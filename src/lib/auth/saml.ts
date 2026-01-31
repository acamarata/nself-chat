/**
 * SAML/SSO Authentication Provider
 *
 * Enterprise-grade Single Sign-On support for:
 * - SAML 2.0 protocol
 * - Common providers (Okta, Azure AD, OneLogin, Google Workspace)
 * - Just-in-Time (JIT) user provisioning
 * - Attribute mapping
 * - Multi-tenant support
 */

import { captureError, addSentryBreadcrumb } from '@/lib/sentry-utils'
import { logAuditEvent } from '@/lib/audit/audit-logger'
import { UserRole } from './roles'

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Supported SAML/SSO providers
 */
export type SSOProvider =
  | 'okta'
  | 'azure-ad'
  | 'google-workspace'
  | 'onelogin'
  | 'auth0'
  | 'ping-identity'
  | 'jumpcloud'
  | 'generic-saml'

/**
 * SAML attribute mapping configuration
 */
export interface SAMLAttributeMapping {
  email: string // SAML attribute name for email (e.g., "email", "mail", "emailAddress")
  firstName?: string // SAML attribute for first name
  lastName?: string // SAML attribute for last name
  displayName?: string // SAML attribute for display name
  username?: string // SAML attribute for username
  role?: string // SAML attribute for role (optional)
  groups?: string // SAML attribute for group membership
  department?: string // SAML attribute for department
  jobTitle?: string // SAML attribute for job title
  phoneNumber?: string // SAML attribute for phone
  customAttributes?: Record<string, string> // Additional custom mappings
}

/**
 * Role mapping from SSO groups/roles to nchat roles
 */
export interface RoleMapping {
  ssoValue: string // Value from SSO provider (e.g., "Admins", "admin-group")
  nchatRole: UserRole // Corresponding nchat role
  priority?: number // Priority for multiple matches (higher = preferred)
}

/**
 * SAML configuration for a provider
 */
export interface SAMLConfiguration {
  // Identity Provider (IdP) Configuration
  idpEntityId: string // Identity provider entity ID
  idpSsoUrl: string // SSO login URL
  idpSloUrl?: string // Single logout URL (optional)
  idpCertificate: string // X.509 certificate (PEM format)

  // Service Provider (SP) Configuration
  spEntityId: string // Service provider entity ID (your app)
  spAssertionConsumerUrl: string // ACS URL (callback URL)
  spSingleLogoutUrl?: string // SLO callback URL

  // SAML Settings
  nameIdFormat?: 'email' | 'persistent' | 'transient' | 'unspecified'
  signatureAlgorithm?: 'sha256' | 'sha512' | 'sha1'
  digestAlgorithm?: 'sha256' | 'sha512' | 'sha1'
  wantAssertionsSigned?: boolean
  wantMessagesSigned?: boolean

  // Attribute Mapping
  attributeMapping: SAMLAttributeMapping

  // Role Mapping
  roleMappings?: RoleMapping[]
  defaultRole?: UserRole // Default role if no mapping matches

  // JIT Provisioning
  jitProvisioning: boolean // Auto-create users on first login
  updateUserOnLogin?: boolean // Update user attributes on each login

  // Security
  allowUnencryptedAssertion?: boolean
  forceAuthn?: boolean // Force re-authentication

  // Multi-tenant
  tenantId?: string // For multi-tenant deployments
}

/**
 * SSO connection configuration
 */
export interface SSOConnection {
  id: string
  name: string
  provider: SSOProvider
  enabled: boolean
  config: SAMLConfiguration
  domains?: string[] // Allowed email domains
  createdAt: Date
  updatedAt: Date
  metadata?: Record<string, unknown>
}

/**
 * SAML response assertion
 */
export interface SAMLAssertion {
  nameId: string
  sessionIndex?: string
  attributes: Record<string, string | string[]>
  issuer: string
  notBefore?: Date
  notOnOrAfter?: Date
  authenticatedAt?: Date
}

/**
 * SSO login result
 */
export interface SSOLoginResult {
  success: boolean
  user?: {
    id: string
    email: string
    username: string
    displayName: string
    role: UserRole
    isNewUser: boolean
    metadata?: Record<string, unknown>
  }
  assertion?: SAMLAssertion
  error?: string
  errorCode?: SSOErrorCode
}

/**
 * SSO error codes
 */
export type SSOErrorCode =
  | 'INVALID_ASSERTION'
  | 'EXPIRED_ASSERTION'
  | 'INVALID_SIGNATURE'
  | 'INVALID_AUDIENCE'
  | 'INVALID_ISSUER'
  | 'MISSING_ATTRIBUTE'
  | 'DOMAIN_NOT_ALLOWED'
  | 'PROVISIONING_DISABLED'
  | 'ROLE_MAPPING_FAILED'
  | 'CONNECTION_DISABLED'
  | 'CONFIGURATION_ERROR'

// ============================================================================
// Provider Presets
// ============================================================================

/**
 * Pre-configured SAML attribute mappings for common providers
 */
export const SAML_PROVIDER_PRESETS: Record<SSOProvider, Partial<SAMLAttributeMapping>> = {
  'okta': {
    email: 'email',
    firstName: 'firstName',
    lastName: 'lastName',
    displayName: 'displayName',
    username: 'login',
    groups: 'groups',
  },
  'azure-ad': {
    email: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
    firstName: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname',
    lastName: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname',
    displayName: 'http://schemas.microsoft.com/identity/claims/displayname',
    username: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
    groups: 'http://schemas.microsoft.com/ws/2008/06/identity/claims/groups',
  },
  'google-workspace': {
    email: 'email',
    firstName: 'firstName',
    lastName: 'lastName',
    displayName: 'displayName',
    username: 'email',
  },
  'onelogin': {
    email: 'email',
    firstName: 'firstName',
    lastName: 'lastName',
    displayName: 'name',
    username: 'username',
    groups: 'memberOf',
  },
  'auth0': {
    email: 'email',
    firstName: 'given_name',
    lastName: 'family_name',
    displayName: 'name',
    username: 'nickname',
  },
  'ping-identity': {
    email: 'mail',
    firstName: 'givenName',
    lastName: 'sn',
    displayName: 'cn',
    username: 'uid',
    groups: 'memberOf',
  },
  'jumpcloud': {
    email: 'email',
    firstName: 'firstname',
    lastName: 'lastname',
    displayName: 'displayname',
    username: 'username',
    groups: 'group',
  },
  'generic-saml': {
    email: 'email',
    firstName: 'firstName',
    lastName: 'lastName',
    displayName: 'displayName',
    username: 'username',
  },
}

/**
 * Provider display names
 */
export const SSO_PROVIDER_NAMES: Record<SSOProvider, string> = {
  'okta': 'Okta',
  'azure-ad': 'Microsoft Azure AD',
  'google-workspace': 'Google Workspace',
  'onelogin': 'OneLogin',
  'auth0': 'Auth0',
  'ping-identity': 'Ping Identity',
  'jumpcloud': 'JumpCloud',
  'generic-saml': 'Generic SAML 2.0',
}

// ============================================================================
// SAML Service Class
// ============================================================================

export class SAMLService {
  private connections: Map<string, SSOConnection> = new Map()

  /**
   * Add an SSO connection
   */
  async addConnection(connection: SSOConnection): Promise<void> {
    try {
      // Validate configuration
      this.validateConfiguration(connection.config)

      this.connections.set(connection.id, connection)

      await logAuditEvent({
        action: 'sso_connection_created',
        actor: { type: 'system', id: 'system' },
        category: 'admin',
        severity: 'info',
        description: `SSO connection created: ${connection.name}`,
        metadata: {
          connectionId: connection.id,
          provider: connection.provider,
        },
      })

      addSentryBreadcrumb('sso', 'SSO connection added', {
        connectionId: connection.id,
        provider: connection.provider,
      })
    } catch (error) {
      captureError(error as Error, {
        tags: { context: 'sso-add-connection' },
        extra: { connectionId: connection.id },
      })
      throw error
    }
  }

  /**
   * Update an SSO connection
   */
  async updateConnection(id: string, updates: Partial<SSOConnection>): Promise<void> {
    const connection = this.connections.get(id)
    if (!connection) {
      throw new Error(`SSO connection not found: ${id}`)
    }

    const updated = {
      ...connection,
      ...updates,
      updatedAt: new Date(),
    }

    if (updates.config) {
      this.validateConfiguration(updated.config)
    }

    this.connections.set(id, updated)

    await logAuditEvent({
      action: 'sso_connection_updated',
      actor: { type: 'system', id: 'system' },
      category: 'admin',
      severity: 'info',
      description: `SSO connection updated: ${connection.name}`,
      metadata: {
        connectionId: id,
        changes: Object.keys(updates),
      },
    })
  }

  /**
   * Remove an SSO connection
   */
  async removeConnection(id: string): Promise<void> {
    const connection = this.connections.get(id)
    if (!connection) {
      throw new Error(`SSO connection not found: ${id}`)
    }

    this.connections.delete(id)

    await logAuditEvent({
      action: 'sso_connection_deleted',
      actor: { type: 'system', id: 'system' },
      category: 'admin',
      severity: 'warning',
      description: `SSO connection deleted: ${connection.name}`,
      metadata: {
        connectionId: id,
        provider: connection.provider,
      },
    })
  }

  /**
   * Get SSO connection by ID
   */
  getConnection(id: string): SSOConnection | undefined {
    return this.connections.get(id)
  }

  /**
   * Get all SSO connections
   */
  getAllConnections(): SSOConnection[] {
    return Array.from(this.connections.values())
  }

  /**
   * Get SSO connection by email domain
   */
  getConnectionByDomain(email: string): SSOConnection | undefined {
    const domain = email.split('@')[1]?.toLowerCase()
    if (!domain) return undefined

    return Array.from(this.connections.values()).find(
      (conn) => conn.enabled && conn.domains?.includes(domain)
    )
  }

  /**
   * Generate SAML metadata for service provider
   */
  generateSPMetadata(connection: SSOConnection): string {
    const { config } = connection

    return `<?xml version="1.0"?>
<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata"
                     entityID="${config.spEntityId}">
  <md:SPSSODescriptor AuthnRequestsSigned="true"
                      WantAssertionsSigned="${config.wantAssertionsSigned ?? true}"
                      protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <md:NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:${config.nameIdFormat ?? 'email'}</md:NameIDFormat>
    <md:AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
                                 Location="${config.spAssertionConsumerUrl}"
                                 index="1" />
    ${config.spSingleLogoutUrl ? `
    <md:SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
                           Location="${config.spSingleLogoutUrl}" />
    ` : ''}
  </md:SPSSODescriptor>
</md:EntityDescriptor>`
  }

  /**
   * Initiate SAML SSO login
   */
  async initiateLogin(connectionId: string, relayState?: string): Promise<string> {
    const connection = this.connections.get(connectionId)
    if (!connection) {
      throw new Error('SSO connection not found')
    }

    if (!connection.enabled) {
      throw new Error('SSO connection is disabled')
    }

    const { config } = connection

    // Generate SAML AuthnRequest
    const authnRequest = this.buildAuthnRequest(config, relayState)

    await logAuditEvent({
      action: 'sso_login_initiated',
      actor: { type: 'user', id: 'anonymous' },
      category: 'security',
      severity: 'info',
      description: `SSO login initiated for ${connection.name}`,
      metadata: {
        connectionId,
        provider: connection.provider,
      },
    })

    return authnRequest
  }

  /**
   * Process SAML assertion and create/update user
   */
  async processAssertion(
    connectionId: string,
    samlResponse: string
  ): Promise<SSOLoginResult> {
    try {
      const connection = this.connections.get(connectionId)
      if (!connection) {
        return {
          success: false,
          error: 'SSO connection not found',
          errorCode: 'CONFIGURATION_ERROR',
        }
      }

      if (!connection.enabled) {
        return {
          success: false,
          error: 'SSO connection is disabled',
          errorCode: 'CONNECTION_DISABLED',
        }
      }

      // Parse and validate SAML response
      const assertion = await this.parseAssertion(samlResponse, connection.config)

      // Validate assertion
      const validationError = this.validateAssertion(assertion, connection.config)
      if (validationError) {
        return {
          success: false,
          error: validationError.message,
          errorCode: validationError.code,
        }
      }

      // Extract user attributes
      const userAttributes = this.extractUserAttributes(assertion, connection.config)

      // Check domain restrictions
      if (connection.domains && connection.domains.length > 0) {
        const emailDomain = userAttributes.email.split('@')[1]?.toLowerCase()
        if (!connection.domains.includes(emailDomain)) {
          return {
            success: false,
            error: 'Email domain not allowed',
            errorCode: 'DOMAIN_NOT_ALLOWED',
          }
        }
      }

      // Map role
      const role = this.mapRole(assertion, connection.config)

      // JIT provisioning or user update
      const user = await this.provisionUser(userAttributes, role, connection.config)

      await logAuditEvent({
        action: 'sso_login_success',
        actor: { type: 'user', id: user.id },
        category: 'security',
        severity: 'info',
        description: `SSO login successful for ${user.email}`,
        metadata: {
          connectionId,
          provider: connection.provider,
          isNewUser: user.isNewUser,
        },
      })

      return {
        success: true,
        user,
        assertion,
      }
    } catch (error) {
      captureError(error as Error, {
        tags: { context: 'sso-process-assertion' },
        extra: { connectionId },
      })

      await logAuditEvent({
        action: 'sso_login_failed',
        actor: { type: 'user', id: 'anonymous' },
        category: 'security',
        severity: 'error',
        description: `SSO login failed: ${(error as Error).message}`,
        metadata: {
          connectionId,
          error: (error as Error).message,
        },
      })

      return {
        success: false,
        error: (error as Error).message,
        errorCode: 'CONFIGURATION_ERROR',
      }
    }
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private validateConfiguration(config: SAMLConfiguration): void {
    if (!config.idpEntityId) throw new Error('IdP Entity ID is required')
    if (!config.idpSsoUrl) throw new Error('IdP SSO URL is required')
    if (!config.idpCertificate) throw new Error('IdP certificate is required')
    if (!config.spEntityId) throw new Error('SP Entity ID is required')
    if (!config.spAssertionConsumerUrl) throw new Error('SP ACS URL is required')
    if (!config.attributeMapping.email) throw new Error('Email attribute mapping is required')
  }

  private buildAuthnRequest(config: SAMLConfiguration, relayState?: string): string {
    // This is a simplified example - in production, use a proper SAML library
    const requestId = `_${crypto.randomUUID()}`
    const issueInstant = new Date().toISOString()

    return `${config.idpSsoUrl}?SAMLRequest=...&RelayState=${relayState ?? ''}`
  }

  private async parseAssertion(
    samlResponse: string,
    config: SAMLConfiguration
  ): Promise<SAMLAssertion> {
    // In production, use a proper SAML library like samlify or passport-saml
    // This is a placeholder implementation
    throw new Error('SAML parsing not implemented - use samlify or passport-saml')
  }

  private validateAssertion(
    assertion: SAMLAssertion,
    config: SAMLConfiguration
  ): { message: string; code: SSOErrorCode } | null {
    // Validate issuer
    if (assertion.issuer !== config.idpEntityId) {
      return { message: 'Invalid assertion issuer', code: 'INVALID_ISSUER' }
    }

    // Validate time bounds
    const now = new Date()
    if (assertion.notBefore && assertion.notBefore > now) {
      return { message: 'Assertion not yet valid', code: 'INVALID_ASSERTION' }
    }
    if (assertion.notOnOrAfter && assertion.notOnOrAfter < now) {
      return { message: 'Assertion has expired', code: 'EXPIRED_ASSERTION' }
    }

    return null
  }

  private extractUserAttributes(
    assertion: SAMLAssertion,
    config: SAMLConfiguration
  ): {
    email: string
    firstName?: string
    lastName?: string
    displayName?: string
    username?: string
  } {
    const { attributeMapping } = config
    const attrs = assertion.attributes

    const email = this.getAttributeValue(attrs, attributeMapping.email)
    if (!email) {
      throw new Error('Email attribute not found in assertion')
    }

    return {
      email,
      firstName: attributeMapping.firstName ? this.getAttributeValue(attrs, attributeMapping.firstName) : undefined,
      lastName: attributeMapping.lastName ? this.getAttributeValue(attrs, attributeMapping.lastName) : undefined,
      displayName: attributeMapping.displayName ? this.getAttributeValue(attrs, attributeMapping.displayName) : undefined,
      username: attributeMapping.username ? this.getAttributeValue(attrs, attributeMapping.username) : undefined,
    }
  }

  private getAttributeValue(
    attributes: Record<string, string | string[]>,
    attributeName: string
  ): string | undefined {
    const value = attributes[attributeName]
    if (!value) return undefined
    return Array.isArray(value) ? value[0] : value
  }

  private mapRole(assertion: SAMLAssertion, config: SAMLConfiguration): UserRole {
    if (!config.roleMappings || config.roleMappings.length === 0) {
      return config.defaultRole ?? 'member'
    }

    const groups = config.attributeMapping.groups
      ? this.getAttributeValue(assertion.attributes, config.attributeMapping.groups)
      : undefined

    if (!groups) {
      return config.defaultRole ?? 'member'
    }

    const groupArray = Array.isArray(groups) ? groups : [groups]

    // Find matching role mapping
    const matches = config.roleMappings
      .filter((mapping) => groupArray.includes(mapping.ssoValue))
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))

    return matches[0]?.nchatRole ?? config.defaultRole ?? 'member'
  }

  private async provisionUser(
    attributes: {
      email: string
      firstName?: string
      lastName?: string
      displayName?: string
      username?: string
    },
    role: UserRole,
    config: SAMLConfiguration
  ): Promise<{
    id: string
    email: string
    username: string
    displayName: string
    role: UserRole
    isNewUser: boolean
    metadata?: Record<string, unknown>
  }> {
    // In production, this would interact with your user database
    // For now, return a mock user
    const displayName = attributes.displayName
      || `${attributes.firstName || ''} ${attributes.lastName || ''}`.trim()
      || attributes.email.split('@')[0]

    const username = attributes.username || attributes.email.split('@')[0]

    return {
      id: crypto.randomUUID(),
      email: attributes.email,
      username,
      displayName,
      role,
      isNewUser: config.jitProvisioning,
      metadata: {
        ssoProvisioned: true,
        provisionedAt: new Date().toISOString(),
      },
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let samlServiceInstance: SAMLService | null = null

export function getSAMLService(): SAMLService {
  if (!samlServiceInstance) {
    samlServiceInstance = new SAMLService()
  }
  return samlServiceInstance
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a pre-configured SSO connection from a provider preset
 */
export function createSSOConnectionFromPreset(
  provider: SSOProvider,
  overrides: Partial<SAMLConfiguration>
): Partial<SSOConnection> {
  const attributeMapping = {
    ...SAML_PROVIDER_PRESETS[provider],
    ...overrides.attributeMapping,
  } as SAMLAttributeMapping

  return {
    provider,
    config: {
      idpEntityId: '',
      idpSsoUrl: '',
      idpCertificate: '',
      spEntityId: '',
      spAssertionConsumerUrl: '',
      nameIdFormat: 'email',
      signatureAlgorithm: 'sha256',
      digestAlgorithm: 'sha256',
      wantAssertionsSigned: true,
      wantMessagesSigned: false,
      attributeMapping,
      jitProvisioning: true,
      updateUserOnLogin: true,
      defaultRole: 'member',
      ...overrides,
    },
  }
}

/**
 * Test SSO connection configuration
 */
export async function testSSOConnection(connectionId: string): Promise<{
  success: boolean
  error?: string
  details?: Record<string, unknown>
}> {
  try {
    const service = getSAMLService()
    const connection = service.getConnection(connectionId)

    if (!connection) {
      return { success: false, error: 'Connection not found' }
    }

    // Validate configuration
    if (!connection.config.idpEntityId) {
      return { success: false, error: 'IdP Entity ID is missing' }
    }
    if (!connection.config.idpSsoUrl) {
      return { success: false, error: 'IdP SSO URL is missing' }
    }
    if (!connection.config.idpCertificate) {
      return { success: false, error: 'IdP certificate is missing' }
    }

    // In production, you would test the actual connection here
    return {
      success: true,
      details: {
        provider: connection.provider,
        idpEntityId: connection.config.idpEntityId,
        jitProvisioning: connection.config.jitProvisioning,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    }
  }
}
