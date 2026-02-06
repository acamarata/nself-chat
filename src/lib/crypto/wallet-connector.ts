/**
 * Crypto Wallet Connector
 * Connect and interact with Web3 wallets (MetaMask, Coinbase Wallet)
 */

import type { CryptoNetwork } from '@/types/billing'
import { CRYPTO_NETWORKS } from '@/config/billing-plans'

export type WalletProvider = 'metamask' | 'coinbase' | 'walletconnect'

export interface WalletInfo {
  address: string
  network: CryptoNetwork
  provider: WalletProvider
  balance: string
}

export interface ConnectResult {
  success: boolean
  address?: string
  network?: CryptoNetwork
  error?: string
}

/**
 * Check if MetaMask is installed
 */
export function isMetaMaskInstalled(): boolean {
  if (typeof window === 'undefined') return false
  return typeof (window as any).ethereum !== 'undefined'
}

/**
 * Check if Coinbase Wallet is installed
 */
export function isCoinbaseWalletInstalled(): boolean {
  if (typeof window === 'undefined') return false
  const ethereum = (window as any).ethereum
  return ethereum?.isCoinbaseWallet === true
}

/**
 * Get available wallet providers
 */
export function getAvailableWallets(): WalletProvider[] {
  const wallets: WalletProvider[] = []

  if (isMetaMaskInstalled()) wallets.push('metamask')
  if (isCoinbaseWalletInstalled()) wallets.push('coinbase')

  // WalletConnect is always available (uses QR code)
  wallets.push('walletconnect')

  return wallets
}

/**
 * Connect to MetaMask
 */
export async function connectMetaMask(): Promise<ConnectResult> {
  if (!isMetaMaskInstalled()) {
    return {
      success: false,
      error: 'MetaMask is not installed. Please install MetaMask extension.',
    }
  }

  try {
    const ethereum = (window as any).ethereum

    // Request account access
    const accounts = await ethereum.request({
      method: 'eth_requestAccounts',
    })

    if (!accounts || accounts.length === 0) {
      return {
        success: false,
        error: 'No accounts found',
      }
    }

    // Get network
    const chainId = await ethereum.request({ method: 'eth_chainId' })
    const network = getNetworkFromChainId(parseInt(chainId, 16))

    return {
      success: true,
      address: accounts[0],
      network,
    }
  } catch (error: any) {
    console.error('MetaMask connection error:', error)
    return {
      success: false,
      error: error.message || 'Failed to connect to MetaMask',
    }
  }
}

/**
 * Connect to Coinbase Wallet
 */
export async function connectCoinbaseWallet(): Promise<ConnectResult> {
  if (!isCoinbaseWalletInstalled()) {
    return {
      success: false,
      error: 'Coinbase Wallet is not installed. Please install Coinbase Wallet extension.',
    }
  }

  try {
    const ethereum = (window as any).ethereum

    // Request account access
    const accounts = await ethereum.request({
      method: 'eth_requestAccounts',
    })

    if (!accounts || accounts.length === 0) {
      return {
        success: false,
        error: 'No accounts found',
      }
    }

    // Get network
    const chainId = await ethereum.request({ method: 'eth_chainId' })
    const network = getNetworkFromChainId(parseInt(chainId, 16))

    return {
      success: true,
      address: accounts[0],
      network,
    }
  } catch (error: any) {
    console.error('Coinbase Wallet connection error:', error)
    return {
      success: false,
      error: error.message || 'Failed to connect to Coinbase Wallet',
    }
  }
}

/**
 * Connect to WalletConnect
 */
export async function connectWalletConnect(): Promise<ConnectResult> {
  // WalletConnect requires additional setup
  // This is a placeholder for WalletConnect integration
  return {
    success: false,
    error: 'WalletConnect integration coming soon',
  }
}

/**
 * Generic wallet connection
 */
export async function connectWallet(provider: WalletProvider): Promise<ConnectResult> {
  switch (provider) {
    case 'metamask':
      return connectMetaMask()
    case 'coinbase':
      return connectCoinbaseWallet()
    case 'walletconnect':
      return connectWalletConnect()
    default:
      return {
        success: false,
        error: 'Unknown wallet provider',
      }
  }
}

/**
 * Disconnect wallet
 */
export async function disconnectWallet(): Promise<void> {
  // Clear any stored wallet info
  if (typeof window !== 'undefined') {
    localStorage.removeItem('connectedWallet')
  }
}

/**
 * Get current wallet address
 */
export async function getCurrentAddress(): Promise<string | null> {
  if (typeof window === 'undefined') return null

  const ethereum = (window as any).ethereum
  if (!ethereum) return null

  try {
    const accounts = await ethereum.request({ method: 'eth_accounts' })
    return accounts[0] || null
  } catch (error) {
    console.error('Error getting current address:', error)
    return null
  }
}

/**
 * Get wallet balance
 */
export async function getBalance(address: string): Promise<string> {
  if (typeof window === 'undefined') return '0'

  const ethereum = (window as any).ethereum
  if (!ethereum) return '0'

  try {
    const balance = await ethereum.request({
      method: 'eth_getBalance',
      params: [address, 'latest'],
    })

    // Convert from wei to ETH
    const balanceInEth = parseInt(balance, 16) / 1e18
    return balanceInEth.toFixed(4)
  } catch (error) {
    console.error('Error getting balance:', error)
    return '0'
  }
}

/**
 * Switch to a specific network
 */
export async function switchNetwork(network: CryptoNetwork): Promise<boolean> {
  if (typeof window === 'undefined') return false

  const ethereum = (window as any).ethereum
  if (!ethereum) return false

  const networkConfig = CRYPTO_NETWORKS[network]
  const chainIdHex = `0x${networkConfig.chainId.toString(16)}`

  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainIdHex }],
    })
    return true
  } catch (error: any) {
    // This error code indicates that the chain has not been added to MetaMask
    if (error.code === 4902) {
      try {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: chainIdHex,
              chainName: networkConfig.name,
              rpcUrls: [networkConfig.rpcUrl],
              nativeCurrency: {
                name: networkConfig.symbol,
                symbol: networkConfig.symbol,
                decimals: 18,
              },
            },
          ],
        })
        return true
      } catch (addError) {
        console.error('Error adding network:', addError)
        return false
      }
    }

    console.error('Error switching network:', error)
    return false
  }
}

/**
 * Get network from chain ID
 */
function getNetworkFromChainId(chainId: number): CryptoNetwork {
  const networkMap: Record<number, CryptoNetwork> = {
    1: 'ethereum',
    137: 'polygon',
    56: 'bsc',
    42161: 'arbitrum',
  }

  return networkMap[chainId] || 'ethereum'
}

/**
 * Sign a message with the connected wallet
 */
export async function signMessage(message: string): Promise<string | null> {
  if (typeof window === 'undefined') return null

  const ethereum = (window as any).ethereum
  if (!ethereum) return null

  try {
    const address = await getCurrentAddress()
    if (!address) return null

    const signature = await ethereum.request({
      method: 'personal_sign',
      params: [message, address],
    })

    return signature
  } catch (error) {
    console.error('Error signing message:', error)
    return null
  }
}

/**
 * Listen for account changes
 */
export function onAccountsChanged(callback: (accounts: string[]) => void): void {
  if (typeof window === 'undefined') return

  const ethereum = (window as any).ethereum
  if (!ethereum) return

  ethereum.on('accountsChanged', callback)
}

/**
 * Listen for network changes
 */
export function onChainChanged(callback: (chainId: string) => void): void {
  if (typeof window === 'undefined') return

  const ethereum = (window as any).ethereum
  if (!ethereum) return

  ethereum.on('chainChanged', callback)
}

/**
 * Remove listeners
 */
export function removeListeners(): void {
  if (typeof window === 'undefined') return

  const ethereum = (window as any).ethereum
  if (!ethereum) return

  ethereum.removeAllListeners('accountsChanged')
  ethereum.removeAllListeners('chainChanged')
}

/**
 * Get wallet info
 */
export async function getWalletInfo(): Promise<WalletInfo | null> {
  const address = await getCurrentAddress()
  if (!address) return null

  const ethereum = (window as any).ethereum
  const chainId = await ethereum.request({ method: 'eth_chainId' })
  const network = getNetworkFromChainId(parseInt(chainId, 16))
  const balance = await getBalance(address)

  // Determine provider
  let provider: WalletProvider = 'metamask'
  if (ethereum.isCoinbaseWallet) {
    provider = 'coinbase'
  }

  return {
    address,
    network,
    provider,
    balance,
  }
}
