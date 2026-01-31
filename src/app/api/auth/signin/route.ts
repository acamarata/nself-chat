import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { Pool } from 'pg'
import {
  withErrorHandler,
  withRateLimit,
  compose,
} from '@/lib/api/middleware'
import {
  successResponse,
  unauthorizedResponse,
  badRequestResponse,
  internalErrorResponse,
} from '@/lib/api/response'

// Lazy initialization of database connection and JWT_SECRET
// This prevents build-time validation errors while still ensuring runtime safety
let pool: Pool | null = null
let JWT_SECRET: string | null = null

function initializeDatabaseConnection() {
  if (pool) return pool

  // Skip validation during build
  if (process.env.SKIP_ENV_VALIDATION === 'true') {
    console.warn('SKIP_ENV_VALIDATION is true, skipping database initialization')
    return null
  }

  const requiredEnvVars = {
    DATABASE_HOST: process.env.DATABASE_HOST,
    DATABASE_PORT: process.env.DATABASE_PORT,
    DATABASE_NAME: process.env.DATABASE_NAME,
    DATABASE_USER: process.env.DATABASE_USER,
    DATABASE_PASSWORD: process.env.DATABASE_PASSWORD,
  }

  // Validate required environment variables at runtime
  if (process.env.NODE_ENV === 'production') {
    for (const [key, value] of Object.entries(requiredEnvVars)) {
      if (!value) {
        throw new Error(`FATAL: ${key} environment variable must be set in production`)
      }
    }

    // Validate DATABASE_PASSWORD minimum length
    if (requiredEnvVars.DATABASE_PASSWORD!.length < 16) {
      throw new Error('FATAL: DATABASE_PASSWORD must be at least 16 characters in production')
    }
  }

  // Create PostgreSQL connection pool
  pool = new Pool({
    host: process.env.DATABASE_HOST!,
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    database: process.env.DATABASE_NAME!,
    user: process.env.DATABASE_USER!,
    password: process.env.DATABASE_PASSWORD!,
  })

  return pool
}

function getJWTSecret() {
  if (JWT_SECRET) return JWT_SECRET

  // Skip validation during build
  if (process.env.SKIP_ENV_VALIDATION === 'true') {
    console.warn('SKIP_ENV_VALIDATION is true, using dummy JWT_SECRET')
    return 'dummy-secret-for-build-only-must-be-at-least-32-chars'
  }

  JWT_SECRET = process.env.JWT_SECRET || null
  if (!JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET environment variable must be set')
  }
  if (JWT_SECRET.length < 32) {
    throw new Error('FATAL: JWT_SECRET must be at least 32 characters')
  }

  return JWT_SECRET
}

// Rate limit: 5 login attempts per 15 minutes per IP
const RATE_LIMIT = { limit: 5, window: 15 * 60 }

async function handleSignIn(request: NextRequest): Promise<NextResponse> {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return badRequestResponse('Email and password are required', 'MISSING_CREDENTIALS')
    }

    // Initialize database connection (lazy)
    const dbPool = initializeDatabaseConnection()
    if (!dbPool) {
      return internalErrorResponse('Database connection not available')
    }

    // Query the database for the user
    const userQuery = `
      SELECT
        au.id as auth_id,
        au.email,
        au.encrypted_password,
        au.given_name,
        au.family_name,
        nu.id,
        nu.username,
        nu.display_name,
        nu.avatar_url,
        nu.status,
        r.name as role,
        r.priority as role_priority
      FROM auth.users au
      LEFT JOIN nchat.nchat_users nu ON au.id = nu.user_id
      LEFT JOIN nchat.nchat_user_roles ur ON nu.id = ur.user_id
      LEFT JOIN nchat.nchat_roles r ON ur.role_id = r.id
      WHERE LOWER(au.email) = LOWER($1)
      ORDER BY r.priority DESC NULLS LAST
      LIMIT 1
    `

    const result = await dbPool.query(userQuery, [email])

    if (result.rows.length === 0) {
      return unauthorizedResponse('Invalid email or password')
    }

    const user = result.rows[0]

    // Verify password using bcrypt
    const isValidPassword = await bcrypt.compare(password, user.encrypted_password)

    if (!isValidPassword) {
      return unauthorizedResponse('Invalid email or password')
    }

    // Get JWT secret (lazy)
    const jwtSecret = getJWTSecret()

    // Generate JWT tokens
    const accessToken = jwt.sign(
      {
        sub: user.id,
        auth_id: user.auth_id,
        email: user.email,
        username: user.username,
        displayName: user.display_name,
        role: user.role || 'member',
      },
      jwtSecret,
      { expiresIn: '24h' }
    )

    const refreshToken = jwt.sign(
      { sub: user.id },
      jwtSecret,
      { expiresIn: '30d' }
    )

    // Return user data and tokens
    const responseData = {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.display_name || user.username,
        avatarUrl: user.avatar_url,
        role: user.role || 'member',
        status: user.status || 'online',
      },
      accessToken,
      refreshToken,
    }

    return successResponse(responseData)
  } catch (error) {
    console.error('Sign in error:', error)
    return internalErrorResponse('Sign in failed')
  }
}

// Apply rate limiting and error handling
export const POST = compose(
  withErrorHandler,
  withRateLimit(RATE_LIMIT)
)(handleSignIn)