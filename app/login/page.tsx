'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      window.location.href = '/'
    } else {
      setError('Mot de passe incorrect')
      setLoading(false)
    }
  }

  return (
    <div
      className="flex items-center justify-center"
      style={{ minHeight: 'calc(100vh - 64px)' }}
    >
      <div
        className="w-full max-w-sm mx-4 p-8 rounded-2xl"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: '0 4px 24px rgba(26,10,14,0.08)',
        }}
      >
        <div className="flex flex-col items-center gap-3 mb-8">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--wine-red)' }}
          >
            <span style={{ fontSize: 22 }}>🍷</span>
          </div>
          <h1
            className="text-xl font-bold"
            style={{ fontFamily: 'var(--font-playfair)', color: 'var(--foreground)' }}
          >
            Ma Cave
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Accès privé
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe"
            required
            autoFocus
            className="w-full px-4 py-3 rounded-lg text-sm outline-none"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              color: 'var(--foreground)',
            }}
          />
          {error && (
            <p className="text-sm text-center" style={{ color: 'var(--wine-red)' }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: 'var(--wine-red)', fontFamily: 'var(--font-inter)' }}
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}
