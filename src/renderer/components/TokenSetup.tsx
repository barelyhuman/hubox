import { useState } from 'preact/hooks'

declare global {
  interface Window {
    tokenAPI: {
      get: () => Promise<string | null>
      save: (token: string) => Promise<{ success: boolean }>
      delete: () => Promise<{ success: boolean }>
    }
  }
}

type Props = {
  onTokenSaved: (token: string) => void
}

export const TokenSetup = ({ onTokenSaved }: Props) => {
  const [token, setToken] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: Event) => {
    e.preventDefault()
    const trimmed = token.trim()

    if (!trimmed) {
      setError('Please enter a token.')
      return
    }

    // if (!trimmed.startsWith('ghp_') && !trimmed.startsWith('github_pat_')) {
    //   // setError('Token should start with ghp_ or github_pat_')
    //   return
    // }

    setSaving(true)
    setError(null)

    try {
      await window.tokenAPI.save(trimmed)
      await onTokenSaved(trimmed)
    } catch (err) {
      setError('Invalid token or failed to connect to GitHub. Please check your token and try again.')
      setSaving(false)
    }
  }

  return (
    <div class="token-setup">
      <div class="token-setup-card">
        <div class="token-setup-icon">
          <svg width="40" height="40" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
          </svg>
        </div>
        <h1 class="token-setup-title">Connect to GitHub</h1>
        <p class="token-setup-desc">
          Enter a personal access token with <strong>notifications</strong> scope to get started.
        </p>
        <form onSubmit={handleSubmit} class="token-setup-form">
          <input
            type="password"
            class="token-setup-input"
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            value={token}
            onInput={(e) => setToken((e.target as HTMLInputElement).value)}
            autofocus
            spellcheck={false}
          />
          {error && <div class="token-setup-error">{error}</div>}
          <button type="submit" class="token-setup-btn" disabled={saving}>
            {saving ? 'Saving…' : 'Save Token'}
          </button>
        </form>
        <p class="token-setup-hint">
          Your token is encrypted and stored securely on this device.
        </p>
      </div>
    </div>
  )
}
