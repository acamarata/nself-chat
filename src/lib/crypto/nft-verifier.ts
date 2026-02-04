/**
 * NFT Verifier
 * Verify NFT ownership and token balances for token gating
 */

import type { CryptoNetwork, TokenType, TokenRequirement } from '@/types/billing'
import { CRYPTO_NETWORKS } from '@/config/billing-plans'

export interface VerificationResult {
  verified: boolean
  balance?: number
  tokenIds?: string[]
  error?: string
}

/**
 * ERC-20 ABI (minimal)
 */
const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  },
]

/**
 * ERC-721 ABI (minimal)
 */
const ERC721_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      { name: '_owner', type: 'address' },
      { name: '_index', type: 'uint256' },
    ],
    name: 'tokenOfOwnerByIndex',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
]

/**
 * ERC-1155 ABI (minimal)
 */
const ERC1155_ABI = [
  {
    constant: true,
    inputs: [
      { name: '_owner', type: 'address' },
      { name: '_id', type: 'uint256' },
    ],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
]

/**
 * Get Web3 provider for a network
 */
function getProvider(network: CryptoNetwork) {
  if (typeof window === 'undefined') {
    throw new Error('Web3 provider only available in browser')
  }

  const ethereum = (window as any).ethereum
  if (!ethereum) {
    throw new Error('No Web3 provider found')
  }

  return ethereum
}

/**
 * Call contract method
 */
async function callContract(
  network: CryptoNetwork,
  contractAddress: string,
  abi: any[],
  method: string,
  params: any[]
): Promise<any> {
  const provider = getProvider(network)

  // Create the call data
  const data = encodeCallData(abi, method, params)

  // Make the call
  const result = await provider.request({
    method: 'eth_call',
    params: [
      {
        to: contractAddress,
        data,
      },
      'latest',
    ],
  })

  return result
}

/**
 * Encode call data (simplified)
 * In production, use a proper Web3 library
 */
function encodeCallData(abi: any[], method: string, params: any[]): string {
  // This is a simplified implementation
  // In production, use ethers.js or web3.js
  const signature = abi.find((item) => item.name === method)
  if (!signature) throw new Error(`Method ${method} not found in ABI`)

  // For now, return empty data
  // Proper implementation would encode the function signature and parameters
  return '0x'
}

/**
 * Decode result (simplified)
 */
function decodeResult(result: string): bigint {
  return BigInt(result)
}

/**
 * Verify ERC-20 token balance
 */
export async function verifyERC20Balance(
  network: CryptoNetwork,
  contractAddress: string,
  walletAddress: string,
  minBalance: number
): Promise<VerificationResult> {
  try {
    const result = await callContract(
      network,
      contractAddress,
      ERC20_ABI,
      'balanceOf',
      [walletAddress]
    )

    const balance = Number(decodeResult(result))
    const decimalsResult = await callContract(
      network,
      contractAddress,
      ERC20_ABI,
      'decimals',
      []
    )
    const decimals = Number(decodeResult(decimalsResult))

    // Adjust for decimals
    const actualBalance = balance / Math.pow(10, decimals)

    return {
      verified: actualBalance >= minBalance,
      balance: actualBalance,
    }
  } catch (error: any) {
    return {
      verified: false,
      error: error.message,
    }
  }
}

/**
 * Verify ERC-721 NFT ownership
 */
export async function verifyERC721Ownership(
  network: CryptoNetwork,
  contractAddress: string,
  walletAddress: string,
  requiredTokenIds?: string[],
  minTokenCount?: number
): Promise<VerificationResult> {
  try {
    // Get balance (number of NFTs owned)
    const balanceResult = await callContract(
      network,
      contractAddress,
      ERC721_ABI,
      'balanceOf',
      [walletAddress]
    )

    const balance = Number(decodeResult(balanceResult))

    // If specific token IDs required
    if (requiredTokenIds && requiredTokenIds.length > 0) {
      // Check each required token ID
      // This would require additional contract calls
      // For now, just check balance
      return {
        verified: balance > 0,
        balance,
      }
    }

    // If minimum token count required
    if (minTokenCount !== undefined) {
      return {
        verified: balance >= minTokenCount,
        balance,
      }
    }

    // Just need to own at least one
    return {
      verified: balance > 0,
      balance,
    }
  } catch (error: any) {
    return {
      verified: false,
      error: error.message,
    }
  }
}

/**
 * Verify ERC-1155 token ownership
 */
export async function verifyERC1155Ownership(
  network: CryptoNetwork,
  contractAddress: string,
  walletAddress: string,
  tokenIds: string[],
  minTokenCount?: number
): Promise<VerificationResult> {
  try {
    let totalBalance = 0

    // Check balance for each token ID
    for (const tokenId of tokenIds) {
      const result = await callContract(
        network,
        contractAddress,
        ERC1155_ABI,
        'balanceOf',
        [walletAddress, tokenId]
      )

      const balance = Number(decodeResult(result))
      totalBalance += balance
    }

    const required = minTokenCount || 1

    return {
      verified: totalBalance >= required,
      balance: totalBalance,
      tokenIds,
    }
  } catch (error: any) {
    return {
      verified: false,
      error: error.message,
    }
  }
}

/**
 * Verify token requirement
 */
export async function verifyTokenRequirement(
  requirement: TokenRequirement,
  walletAddress: string
): Promise<VerificationResult> {
  if (!requirement.enabled) {
    return {
      verified: true,
    }
  }

  switch (requirement.tokenType) {
    case 'erc20':
      return verifyERC20Balance(
        requirement.network,
        requirement.contractAddress,
        walletAddress,
        requirement.minBalance || 0
      )

    case 'erc721':
      return verifyERC721Ownership(
        requirement.network,
        requirement.contractAddress,
        walletAddress,
        requirement.tokenIds,
        requirement.minTokenCount
      )

    case 'erc1155':
      if (!requirement.tokenIds || requirement.tokenIds.length === 0) {
        return {
          verified: false,
          error: 'ERC-1155 requires token IDs',
        }
      }
      return verifyERC1155Ownership(
        requirement.network,
        requirement.contractAddress,
        walletAddress,
        requirement.tokenIds,
        requirement.minTokenCount
      )

    default:
      return {
        verified: false,
        error: 'Unknown token type',
      }
  }
}

/**
 * Batch verify multiple requirements
 */
export async function verifyAllRequirements(
  requirements: TokenRequirement[],
  walletAddress: string
): Promise<{
  allVerified: boolean
  results: Map<string, VerificationResult>
}> {
  const results = new Map<string, VerificationResult>()

  for (const requirement of requirements) {
    if (!requirement.enabled) continue

    const result = await verifyTokenRequirement(requirement, walletAddress)
    results.set(requirement.id, result)
  }

  const allVerified = Array.from(results.values()).every((r) => r.verified)

  return {
    allVerified,
    results,
  }
}

/**
 * Check if wallet has access to a channel
 */
export async function checkChannelAccess(
  channelId: string,
  walletAddress: string
): Promise<boolean> {
  // This would fetch channel requirements from database
  // For now, return mock data
  const requirements: TokenRequirement[] = []

  if (requirements.length === 0) {
    return true // No requirements, public channel
  }

  const { allVerified } = await verifyAllRequirements(requirements, walletAddress)
  return allVerified
}

/**
 * Get user's token holdings for display
 */
export async function getUserTokenHoldings(
  walletAddress: string,
  network: CryptoNetwork,
  contracts: Array<{
    address: string
    type: TokenType
    tokenIds?: string[]
  }>
): Promise<
  Array<{
    contractAddress: string
    tokenType: TokenType
    balance: number
    tokenIds?: string[]
  }>
> {
  const holdings = []

  for (const contract of contracts) {
    let result: VerificationResult

    switch (contract.type) {
      case 'erc20':
        result = await verifyERC20Balance(network, contract.address, walletAddress, 0)
        break

      case 'erc721':
        result = await verifyERC721Ownership(network, contract.address, walletAddress)
        break

      case 'erc1155':
        if (!contract.tokenIds) continue
        result = await verifyERC1155Ownership(
          network,
          contract.address,
          walletAddress,
          contract.tokenIds
        )
        break

      default:
        continue
    }

    if (result.balance && result.balance > 0) {
      holdings.push({
        contractAddress: contract.address,
        tokenType: contract.type,
        balance: result.balance,
        tokenIds: result.tokenIds,
      })
    }
  }

  return holdings
}

/**
 * Verify ownership using Alchemy/Moralis API (recommended for production)
 */
export async function verifyOwnershipViaAPI(
  walletAddress: string,
  contractAddress: string,
  network: CryptoNetwork
): Promise<VerificationResult> {
  // This would use Alchemy NFT API or Moralis
  // Example: https://docs.alchemy.com/reference/getnfts
  // For now, return placeholder

  return {
    verified: false,
    error: 'API verification not implemented',
  }
}
