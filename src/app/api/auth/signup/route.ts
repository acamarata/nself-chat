import { NextRequest, NextResponse } from 'next/server'
import {
  withErrorHandler,
  withRateLimit,
  compose,
} from '@/lib/api/middleware'
import {
  successResponse,
  badRequestResponse,
  internalErrorResponse,
} from '@/lib/api/response'
import { adminQuery } from '@/lib/graphql/admin-client'
import { gql } from '@apollo/client'

// Rate limit: 3 signup attempts per hour per IP
const RATE_LIMIT = { limit: 3, window: 60 * 60 }

async function handleSignUp(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { email, password, username, displayName } = body

    // In development mode, use mock data
    if (process.env.NEXT_PUBLIC_USE_DEV_AUTH === 'true') {
      // Check if this is the first user by querying the database using admin client
      const GET_USER_COUNT = gql`
        query GetUserCount {
          nchat_users_aggregate {
            aggregate {
              count
            }
          }
        }
      `

      const userCountResult = await adminQuery(GET_USER_COUNT)
      const userCount = userCountResult?.data?.nchat_users_aggregate?.aggregate?.count || 0
      const isFirstUser = userCount === 0

      const mockUser = {
        id: Date.now().toString(),
        email,
        username,
        displayName: displayName || username,
        role: isFirstUser ? 'owner' : 'member',
      }

      const mockToken = Buffer.from(JSON.stringify({
        sub: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
        displayName: mockUser.displayName,
        role: mockUser.role,
      })).toString('base64')

      return successResponse({
        token: `mock.${mockToken}.signature`,
        user: mockUser,
      })
    }

    return badRequestResponse('Missing required fields', 'MISSING_FIELDS')
  } catch (error) {
    console.error('Signup error:', error)
    return internalErrorResponse('Signup failed')
  }
}

// Apply rate limiting and error handling
export const POST = compose(
  withErrorHandler,
  withRateLimit(RATE_LIMIT)
)(handleSignUp)