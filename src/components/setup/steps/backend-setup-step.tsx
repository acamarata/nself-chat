'use client'

/**
 * Backend Setup Step
 *
 * Guides users through nself CLI backend setup:
 * - Install nself CLI (if needed)
 * - Initialize backend (nself init)
 * - Build configuration (nself build)
 * - Start services (nself start)
 * - Verify all services are running
 */

import { useEffect, useState, useCallback } from 'react'
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Server,
  Database,
  Shield,
  HardDrive,
  Play,
  Square,
  RefreshCw,
  Terminal,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { type AppConfig } from '@/config/app-config'

interface BackendSetupStepProps {
  config: AppConfig
  onUpdate: (updates: Partial<AppConfig>) => void
  onValidate: (isValid: boolean) => void
}

// Extended config for backend-specific settings
interface BackendSettings {
  initialized?: boolean
  running?: boolean
  services?: Record<string, ServiceStatus>
  urls?: {
    graphql: string
    auth: string
    storage: string
    socket?: string
  }
}

interface ServiceStatus {
  name: string
  running: boolean
  healthy: boolean
  url?: string
}

type SetupPhase = 'checking' | 'install' | 'init' | 'build' | 'start' | 'verify' | 'complete' | 'error'

export function BackendSetupStep({ config, onUpdate, onValidate }: BackendSetupStepProps) {
  const [phase, setPhase] = useState<SetupPhase>('checking')
  const [status, setStatus] = useState<{
    nshelfInstalled: boolean
    backendExists: boolean
    backendInitialized: boolean
    backendRunning: boolean
    services: Record<string, ServiceStatus>
  } | null>(null)
  const [output, setOutput] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null)

  // Check current status
  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/setup/backend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status' }),
      })
      const data = await res.json()

      setStatus({
        nshelfInstalled: data.nshelfInstalled || false,
        backendExists: data.exists || false,
        backendInitialized: data.initialized || false,
        backendRunning: data.running || false,
        services: data.services || {},
      })

      // Determine phase based on status
      if (!data.nshelfInstalled) {
        setPhase('install')
      } else if (!data.initialized) {
        setPhase('init')
      } else if (!data.running) {
        setPhase('start')
      } else {
        setPhase('complete')
        onValidate(true)

        // Update parent with backend URLs
        const urlRes = await fetch('/api/setup/backend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'urls' }),
        })
        const urlData = await urlRes.json()

        // Store backend settings as extended config
        onUpdate({
          // @ts-expect-error - backendSettings is an extension to AppConfig for wizard state
          backendSettings: {
            initialized: true,
            running: true,
            services: data.services,
            urls: urlData.urls,
          },
        })
      }
    } catch (err) {
      console.error('Status check failed:', err)
      setError('Failed to check backend status')
      setPhase('error')
    }
  }, [onUpdate, onValidate])

  useEffect(() => {
    checkStatus()
  }, [checkStatus])

  // Execute backend command
  const executeCommand = async (action: string, options?: Record<string, unknown>) => {
    setIsProcessing(true)
    setError(null)
    setOutput((prev) => [...prev, `> Running: nself ${action}...`])

    try {
      const res = await fetch('/api/setup/backend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, options }),
      })
      const data = await res.json()

      if (data.success) {
        setOutput((prev) => [...prev, data.output || 'Command completed successfully', ''])
        await checkStatus()
      } else {
        setError(data.error || data.message || 'Command failed')
        setOutput((prev) => [...prev, `Error: ${data.error || data.message}`, ''])
        setPhase('error')
      }
    } catch (err) {
      setError(String(err))
      setOutput((prev) => [...prev, `Error: ${err}`, ''])
      setPhase('error')
    } finally {
      setIsProcessing(false)
    }
  }

  // Copy command to clipboard
  const copyCommand = (command: string) => {
    navigator.clipboard.writeText(command)
    setCopiedCommand(command)
    setTimeout(() => setCopiedCommand(null), 2000)
  }

  // Render phase-specific content
  const renderPhaseContent = () => {
    switch (phase) {
      case 'checking':
        return (
          <div className="flex flex-col items-center py-12 space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="text-lg">Checking backend status...</p>
          </div>
        )

      case 'install':
        return (
          <div className="space-y-6">
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-600 dark:text-yellow-400">
                    nself CLI Not Found
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    The nself CLI is required to run the backend services. Install it with one
                    command:
                  </p>
                </div>
              </div>
            </div>

            <CommandBlock
              command="curl -sSL https://install.nself.org | bash"
              onCopy={copyCommand}
              copied={copiedCommand === 'curl -sSL https://install.nself.org | bash'}
            />

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Info className="w-4 h-4" />
              <span>After installation, click &quot;Refresh&quot; to continue.</span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={checkStatus}
                disabled={isProcessing}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                <RefreshCw className={cn('w-4 h-4', isProcessing && 'animate-spin')} />
                Refresh Status
              </button>
              <a
                href="https://nself.org"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted"
              >
                <ExternalLink className="w-4 h-4" />
                nself Documentation
              </a>
            </div>
          </div>
        )

      case 'init':
        return (
          <div className="space-y-6">
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-600 dark:text-blue-400">
                    Initialize Backend
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    The backend folder exists but hasn&apos;t been initialized. This will create
                    the configuration files needed to run services.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => executeCommand('init', { demo: true })}
                disabled={isProcessing}
                className="flex flex-col items-center gap-3 p-6 border-2 rounded-lg hover:border-primary hover:bg-primary/5 transition-all disabled:opacity-50"
              >
                <Server className="w-8 h-8 text-primary" />
                <div className="text-center">
                  <h4 className="font-semibold">Full Demo Setup</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    All services enabled with sample data
                  </p>
                </div>
              </button>

              <button
                onClick={() => executeCommand('init')}
                disabled={isProcessing}
                className="flex flex-col items-center gap-3 p-6 border-2 rounded-lg hover:border-primary hover:bg-primary/5 transition-all disabled:opacity-50"
              >
                <Database className="w-8 h-8 text-muted-foreground" />
                <div className="text-center">
                  <h4 className="font-semibold">Minimal Setup</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Core services only, configure later
                  </p>
                </div>
              </button>
            </div>

            {isProcessing && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Initializing backend... This may take a moment.
              </div>
            )}
          </div>
        )

      case 'build':
        return (
          <div className="space-y-6">
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-600 dark:text-blue-400">Build Backend</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Generate Docker configuration and prepare services for launch.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => executeCommand('build')}
              disabled={isProcessing}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <HardDrive className="w-5 h-5" />
              )}
              Build Backend Configuration
            </button>
          </div>
        )

      case 'start':
        return (
          <div className="space-y-6">
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-600 dark:text-green-400">
                    Ready to Start
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Backend is configured and ready to launch. This will start all required
                    services.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => executeCommand('start')}
              disabled={isProcessing}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Play className="w-5 h-5" />
              )}
              Start Backend Services
            </button>

            {isProcessing && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Starting services... This may take up to a minute.
              </div>
            )}
          </div>
        )

      case 'complete':
        return (
          <div className="space-y-6">
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-600 dark:text-green-400">
                    Backend Running
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    All backend services are up and running. You can proceed to the next step.
                  </p>
                </div>
              </div>
            </div>

            {/* Service Status Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(status?.services || {}).map(([name, service]) => (
                <ServiceCard key={name} name={name} service={service} />
              ))}
            </div>

            {/* Service Control Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => executeCommand('restart')}
                disabled={isProcessing}
                className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted disabled:opacity-50"
              >
                <RefreshCw className={cn('w-4 h-4', isProcessing && 'animate-spin')} />
                Restart
              </button>
              <button
                onClick={() => executeCommand('stop')}
                disabled={isProcessing}
                className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted disabled:opacity-50"
              >
                <Square className="w-4 h-4" />
                Stop
              </button>
              <button
                onClick={checkStatus}
                disabled={isProcessing}
                className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted disabled:opacity-50"
              >
                <RefreshCw className={cn('w-4 h-4', isProcessing && 'animate-spin')} />
                Refresh
              </button>
            </div>
          </div>
        )

      case 'error':
        return (
          <div className="space-y-6">
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-600 dark:text-red-400">Setup Error</h4>
                  <p className="text-sm text-muted-foreground mt-1">{error}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={checkStatus}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <a
                href="https://nself.org/docs/troubleshooting"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted"
              >
                <ExternalLink className="w-4 h-4" />
                Troubleshooting Guide
              </a>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {(['install', 'init', 'build', 'start', 'verify'] as const).map((step, index) => {
          const stepIndex = ['install', 'init', 'build', 'start', 'verify'].indexOf(phase)
          const isComplete =
            index < stepIndex || phase === 'complete' || (phase === 'error' && index < stepIndex)
          const isCurrent = step === phase || (phase === 'complete' && step === 'verify')

          return (
            <div key={step} className="flex items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                  isComplete
                    ? 'bg-green-500 text-white'
                    : isCurrent
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {isComplete ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
              </div>
              {index < 4 && (
                <div
                  className={cn('w-full h-1 mx-2', isComplete ? 'bg-green-500' : 'bg-muted')}
                  style={{ width: '60px' }}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Phase Labels */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Install</span>
        <span>Initialize</span>
        <span>Build</span>
        <span>Start</span>
        <span>Verify</span>
      </div>

      {/* Phase Content */}
      {renderPhaseContent()}

      {/* Terminal Output */}
      {output.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-2">
            <Terminal className="w-4 h-4" />
            <span className="text-sm font-medium">Command Output</span>
          </div>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-xs max-h-48 overflow-y-auto">
            {output.map((line, i) => (
              <div key={i} className={cn(line.startsWith('>') ? 'text-green-400' : '')}>
                {line || '\u00A0'}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Command Block Component
function CommandBlock({
  command,
  onCopy,
  copied,
}: {
  command: string
  onCopy: (cmd: string) => void
  copied: boolean
}) {
  return (
    <div className="relative bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
      <code>{command}</code>
      <button
        onClick={() => onCopy(command)}
        className="absolute top-2 right-2 p-2 hover:bg-gray-800 rounded"
      >
        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  )
}

// Service Card Component
function ServiceCard({ name, service }: { name: string; service: ServiceStatus }) {
  const statusColor = service.healthy
    ? 'text-green-500 bg-green-500/10 border-green-500/20'
    : service.running
    ? 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
    : 'text-red-500 bg-red-500/10 border-red-500/20'

  const StatusIcon = service.healthy ? CheckCircle2 : service.running ? AlertTriangle : XCircle

  return (
    <div className={cn('p-3 rounded-lg border', statusColor)}>
      <div className="flex items-center gap-2">
        <StatusIcon className="w-4 h-4" />
        <span className="font-medium text-sm capitalize">{name}</span>
      </div>
      <p className="text-xs mt-1 opacity-70">
        {service.healthy ? 'Healthy' : service.running ? 'Running' : 'Stopped'}
      </p>
    </div>
  )
}
