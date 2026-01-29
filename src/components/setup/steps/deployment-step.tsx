'use client'

/**
 * Deployment Step
 *
 * Guides users through deploying their configured application:
 * - Backend: nself deploy staging/production
 * - Frontend: Vercel, Netlify, or self-hosted
 * - Desktop: Tauri/Electron build instructions
 * - Mobile: Capacitor build instructions
 */

import { useState, useEffect } from 'react'
import {
  CheckCircle2,
  Loader2,
  Cloud,
  Server,
  Monitor,
  Smartphone,
  ExternalLink,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Download,
  Globe,
  Rocket,
  Terminal,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { type AppConfig } from '@/config/app-config'

interface DeploymentStepProps {
  config: AppConfig
  onUpdate: (updates: Partial<AppConfig>) => void
  onValidate: (isValid: boolean) => void
}

// Extended config for deployment-specific settings
interface DeploymentSettings {
  targets?: {
    backend: 'nself' | 'custom' | 'none'
    frontend: 'vercel' | 'netlify' | 'docker' | 'self-hosted' | 'none'
    desktop: 'tauri' | 'electron' | 'both' | 'none'
    mobile: 'capacitor' | 'react-native' | 'both' | 'none'
  }
  urls?: {
    production?: string
    staging?: string
  }
}

// Default deployment targets
const defaultTargets = {
  backend: 'nself' as const,
  frontend: 'vercel' as const,
  desktop: 'none' as const,
  mobile: 'none' as const,
}

export function DeploymentStep({ config, onUpdate, onValidate }: DeploymentStepProps) {
  // Get initial values from config's extended settings
  const deploySettings = (config as AppConfig & { deploymentSettings?: DeploymentSettings }).deploymentSettings
  const [targets, setTargets] = useState(
    deploySettings?.targets ?? defaultTargets
  )
  const [expandedSection, setExpandedSection] = useState<string | null>('backend')
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null)
  const [isDeploying, setIsDeploying] = useState(false)

  // Always valid - deployment is optional
  useEffect(() => {
    onValidate(true)
  }, [onValidate])

  const updateTarget = (key: keyof typeof defaultTargets, value: string) => {
    const newTargets = { ...targets, [key]: value }
    setTargets(newTargets)
    // Store deployment settings as extended config
    onUpdate({
      // @ts-expect-error - deploymentSettings is an extension to AppConfig for wizard state
      deploymentSettings: { targets: newTargets },
    })
  }

  const copyCommand = (command: string) => {
    navigator.clipboard.writeText(command)
    setCopiedCommand(command)
    setTimeout(() => setCopiedCommand(null), 2000)
  }

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <div className="flex items-start gap-3">
          <Rocket className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold">Deployment Options</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Choose how you want to deploy your chat application. You can deploy the backend,
              frontend, desktop apps, and mobile apps independently.
            </p>
          </div>
        </div>
      </div>

      {/* Backend Deployment */}
      <DeploymentSection
        title="Backend Deployment"
        icon={Server}
        expanded={expandedSection === 'backend'}
        onToggle={() => toggleSection('backend')}
        selected={targets.backend}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Deploy your backend services (PostgreSQL, Hasura, Auth, Storage) to your server.
          </p>

          <div className="grid gap-3">
            <DeploymentOption
              selected={targets.backend === 'nself'}
              onClick={() => updateTarget('backend', 'nself')}
              icon={Server}
              title="nself Deploy (Recommended)"
              description="Deploy to your VPS with zero-downtime using nself CLI"
            />
            <DeploymentOption
              selected={targets.backend === 'custom'}
              onClick={() => updateTarget('backend', 'custom')}
              icon={Cloud}
              title="Custom Infrastructure"
              description="Use your own Kubernetes, Docker Swarm, or managed services"
            />
            <DeploymentOption
              selected={targets.backend === 'none'}
              onClick={() => updateTarget('backend', 'none')}
              icon={Monitor}
              title="Skip Backend Deploy"
              description="Keep using local development or existing backend"
            />
          </div>

          {targets.backend === 'nself' && (
            <div className="mt-4 space-y-3">
              <h5 className="font-medium text-sm">Deployment Commands</h5>

              <CommandBlock
                label="Deploy to Staging"
                command="cd .backend && nself deploy staging"
                onCopy={copyCommand}
                copied={copiedCommand === 'cd .backend && nself deploy staging'}
              />

              <CommandBlock
                label="Deploy to Production"
                command="cd .backend && nself deploy production"
                onCopy={copyCommand}
                copied={copiedCommand === 'cd .backend && nself deploy production'}
              />

              <div className="text-xs text-muted-foreground">
                <p>
                  Before deploying, configure your server in{' '}
                  <code className="bg-muted px-1 rounded">.backend/.environments/</code>
                </p>
              </div>
            </div>
          )}
        </div>
      </DeploymentSection>

      {/* Frontend Deployment */}
      <DeploymentSection
        title="Frontend Deployment"
        icon={Globe}
        expanded={expandedSection === 'frontend'}
        onToggle={() => toggleSection('frontend')}
        selected={targets.frontend}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Deploy your Next.js frontend to the web. Choose a hosting provider.
          </p>

          <div className="grid gap-3">
            <DeploymentOption
              selected={targets.frontend === 'vercel'}
              onClick={() => updateTarget('frontend', 'vercel')}
              icon={Cloud}
              title="Vercel (Recommended)"
              description="One-click deploy, automatic HTTPS, global CDN"
              badge="Free Tier"
            />
            <DeploymentOption
              selected={targets.frontend === 'netlify'}
              onClick={() => updateTarget('frontend', 'netlify')}
              icon={Cloud}
              title="Netlify"
              description="Git-based deployment, serverless functions"
              badge="Free Tier"
            />
            <DeploymentOption
              selected={targets.frontend === 'docker'}
              onClick={() => updateTarget('frontend', 'docker')}
              icon={Server}
              title="Docker / Self-Hosted"
              description="Deploy to any server with Docker"
            />
            <DeploymentOption
              selected={targets.frontend === 'none'}
              onClick={() => updateTarget('frontend', 'none')}
              icon={Monitor}
              title="Skip Frontend Deploy"
              description="Continue with local development"
            />
          </div>

          {targets.frontend === 'vercel' && (
            <div className="mt-4 space-y-3">
              <h5 className="font-medium text-sm">Deploy to Vercel</h5>

              <div className="flex gap-3">
                <a
                  href="https://vercel.com/new/clone?repository-url=https://github.com/acamarata/nself-chat"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
                >
                  <ExternalLink className="w-4 h-4" />
                  Deploy to Vercel
                </a>
              </div>

              <p className="text-xs text-muted-foreground">
                Or use the CLI:{' '}
                <code className="bg-muted px-1 rounded">npx vercel --prod</code>
              </p>
            </div>
          )}

          {targets.frontend === 'docker' && (
            <div className="mt-4 space-y-3">
              <h5 className="font-medium text-sm">Docker Deployment</h5>

              <CommandBlock
                label="Build Docker Image"
                command="docker build -t nchat:latest ."
                onCopy={copyCommand}
                copied={copiedCommand === 'docker build -t nchat:latest .'}
              />

              <CommandBlock
                label="Run Container"
                command="docker run -p 3000:3000 --env-file .env.production nchat:latest"
                onCopy={copyCommand}
                copied={
                  copiedCommand ===
                  'docker run -p 3000:3000 --env-file .env.production nchat:latest'
                }
              />
            </div>
          )}
        </div>
      </DeploymentSection>

      {/* Desktop Apps */}
      <DeploymentSection
        title="Desktop Applications"
        icon={Monitor}
        expanded={expandedSection === 'desktop'}
        onToggle={() => toggleSection('desktop')}
        selected={targets.desktop}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Build native desktop applications for Windows, macOS, and Linux.
          </p>

          <div className="grid gap-3">
            <DeploymentOption
              selected={targets.desktop === 'tauri'}
              onClick={() => updateTarget('desktop', 'tauri')}
              icon={Monitor}
              title="Tauri (Recommended)"
              description="Lightweight native apps (~5MB), fast startup"
              badge="Rust-based"
            />
            <DeploymentOption
              selected={targets.desktop === 'electron'}
              onClick={() => updateTarget('desktop', 'electron')}
              icon={Monitor}
              title="Electron"
              description="Full Chromium, larger size (~100MB), wide compatibility"
            />
            <DeploymentOption
              selected={targets.desktop === 'both'}
              onClick={() => updateTarget('desktop', 'both')}
              icon={Monitor}
              title="Both"
              description="Build for both Tauri and Electron"
            />
            <DeploymentOption
              selected={targets.desktop === 'none'}
              onClick={() => updateTarget('desktop', 'none')}
              icon={Monitor}
              title="Skip Desktop"
              description="No desktop app deployment"
            />
          </div>

          {(targets.desktop === 'tauri' || targets.desktop === 'both') && (
            <div className="mt-4 space-y-3">
              <h5 className="font-medium text-sm">Tauri Build Commands</h5>

              <CommandBlock
                label="Development"
                command="pnpm tauri:dev"
                onCopy={copyCommand}
                copied={copiedCommand === 'pnpm tauri:dev'}
              />

              <CommandBlock
                label="Build All Platforms"
                command="pnpm build:tauri"
                onCopy={copyCommand}
                copied={copiedCommand === 'pnpm build:tauri'}
              />

              <p className="text-xs text-muted-foreground">
                Output: <code className="bg-muted px-1 rounded">platforms/tauri/target/release/bundle/</code>
              </p>
            </div>
          )}

          {(targets.desktop === 'electron' || targets.desktop === 'both') && (
            <div className="mt-4 space-y-3">
              <h5 className="font-medium text-sm">Electron Build Commands</h5>

              <CommandBlock
                label="Development"
                command="pnpm electron:dev"
                onCopy={copyCommand}
                copied={copiedCommand === 'pnpm electron:dev'}
              />

              <CommandBlock
                label="Build All Platforms"
                command="pnpm build:electron"
                onCopy={copyCommand}
                copied={copiedCommand === 'pnpm build:electron'}
              />

              <p className="text-xs text-muted-foreground">
                Output: <code className="bg-muted px-1 rounded">dist-electron/</code>
              </p>
            </div>
          )}
        </div>
      </DeploymentSection>

      {/* Mobile Apps */}
      <DeploymentSection
        title="Mobile Applications"
        icon={Smartphone}
        expanded={expandedSection === 'mobile'}
        onToggle={() => toggleSection('mobile')}
        selected={targets.mobile}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Build native mobile applications for iOS and Android.
          </p>

          <div className="grid gap-3">
            <DeploymentOption
              selected={targets.mobile === 'capacitor'}
              onClick={() => updateTarget('mobile', 'capacitor')}
              icon={Smartphone}
              title="Capacitor (Recommended)"
              description="Uses your existing web code, easy to maintain"
            />
            <DeploymentOption
              selected={targets.mobile === 'react-native'}
              onClick={() => updateTarget('mobile', 'react-native')}
              icon={Smartphone}
              title="React Native"
              description="Fully native components, better performance"
            />
            <DeploymentOption
              selected={targets.mobile === 'both'}
              onClick={() => updateTarget('mobile', 'both')}
              icon={Smartphone}
              title="Both"
              description="Build for both Capacitor and React Native"
            />
            <DeploymentOption
              selected={targets.mobile === 'none'}
              onClick={() => updateTarget('mobile', 'none')}
              icon={Smartphone}
              title="Skip Mobile"
              description="No mobile app deployment"
            />
          </div>

          {(targets.mobile === 'capacitor' || targets.mobile === 'both') && (
            <div className="mt-4 space-y-3">
              <h5 className="font-medium text-sm">Capacitor Build Commands</h5>

              <CommandBlock
                label="Sync Web Assets"
                command="pnpm cap:sync"
                onCopy={copyCommand}
                copied={copiedCommand === 'pnpm cap:sync'}
              />

              <CommandBlock
                label="Open iOS in Xcode"
                command="pnpm cap ios"
                onCopy={copyCommand}
                copied={copiedCommand === 'pnpm cap ios'}
              />

              <CommandBlock
                label="Open Android Studio"
                command="pnpm cap android"
                onCopy={copyCommand}
                copied={copiedCommand === 'pnpm cap android'}
              />
            </div>
          )}

          {(targets.mobile === 'react-native' || targets.mobile === 'both') && (
            <div className="mt-4 space-y-3">
              <h5 className="font-medium text-sm">React Native Build Commands</h5>

              <CommandBlock
                label="iOS"
                command="cd platforms/react-native && npx react-native run-ios"
                onCopy={copyCommand}
                copied={copiedCommand === 'cd platforms/react-native && npx react-native run-ios'}
              />

              <CommandBlock
                label="Android"
                command="cd platforms/react-native && npx react-native run-android"
                onCopy={copyCommand}
                copied={
                  copiedCommand === 'cd platforms/react-native && npx react-native run-android'
                }
              />
            </div>
          )}
        </div>
      </DeploymentSection>

      {/* Summary */}
      <div className="p-4 bg-muted/50 rounded-lg">
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          Deployment Summary
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Backend:</span>
            <span className="ml-2 font-medium capitalize">{targets.backend}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Frontend:</span>
            <span className="ml-2 font-medium capitalize">{targets.frontend}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Desktop:</span>
            <span className="ml-2 font-medium capitalize">{targets.desktop}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Mobile:</span>
            <span className="ml-2 font-medium capitalize">{targets.mobile}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Deployment Section Component
function DeploymentSection({
  title,
  icon: Icon,
  expanded,
  onToggle,
  selected,
  children,
}: {
  title: string
  icon: React.ElementType
  expanded: boolean
  onToggle: () => void
  selected: string
  children: React.ReactNode
}) {
  const isConfigured = selected !== 'none'

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-primary" />
          <span className="font-medium">{title}</span>
          {isConfigured && (
            <span className="px-2 py-0.5 text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400 rounded-full">
              {selected}
            </span>
          )}
        </div>
        {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
      </button>
      {expanded && <div className="p-4 border-t bg-muted/20">{children}</div>}
    </div>
  )
}

// Deployment Option Component
function DeploymentOption({
  selected,
  onClick,
  icon: Icon,
  title,
  description,
  badge,
}: {
  selected: boolean
  onClick: () => void
  icon: React.ElementType
  title: string
  description: string
  badge?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border-2 text-left transition-all',
        selected
          ? 'border-primary bg-primary/5'
          : 'border-transparent bg-muted/50 hover:border-primary/30'
      )}
    >
      <div
        className={cn(
          'p-1.5 rounded',
          selected ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h5 className="font-medium text-sm">{title}</h5>
          {badge && (
            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-primary/10 text-primary rounded">
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div
        className={cn(
          'w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0',
          selected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
        )}
      >
        {selected && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
      </div>
    </button>
  )
}

// Command Block Component
function CommandBlock({
  label,
  command,
  onCopy,
  copied,
}: {
  label: string
  command: string
  onCopy: (cmd: string) => void
  copied: boolean
}) {
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="relative bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-xs">
        <code>{command}</code>
        <button
          onClick={() => onCopy(command)}
          className="absolute top-2 right-2 p-1.5 hover:bg-gray-800 rounded"
        >
          {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
        </button>
      </div>
    </div>
  )
}
