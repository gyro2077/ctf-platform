// app/forgot-password/page.tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    // Esta es la URL a la que el usuario será redirigido
    // DESDE SU CORREO. Debe ser una página que creemos.
    const redirectTo = `${window.location.origin}/reset-password`

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo,
    })

    if (error) {
      setError(error.message)
    } else {
      setMessage('¡Correo enviado! Revisa tu bandeja de entrada para el enlace de recuperación.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E4E4E7] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#00FF41] tracking-[4px]">
            RECUPERAR CONTRASEÑA
          </h1>
        </header>

        <div className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-8 md:p-12">
          {!message ? (
            <form onSubmit={handleReset}>
              <p className="text-sm text-[#888888] mb-6">
                Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
              </p>

              {error && (
                <div className="bg-red-900 border border-red-500 text-red-100 px-4 py-3 rounded-md mb-6">
                  <p>{error}</p>
                </div>
              )}

              <div className="form-group mb-4">
                <label className="block mb-2 text-sm text-[#888888] tracking-wide" htmlFor="email">
                  Correo institucional
                </label>
                <input
                  className="w-full h-14 px-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded text-[#E4E4E7] focus:outline-none focus:border-[#00FF41] focus:ring-1 focus:ring-[#00FF41]"
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full h-14 bg-[#00FF41] text-[#0A0A0A] font-bold text-base tracking-wider uppercase rounded disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'ENVIANDO...' : 'ENVIAR ENLACE'}
              </button>
            </form>
          ) : (
            <div className="text-center">
              <p className="text-lg text-[#00FF41]">{message}</p>
            </div>
          )}

          <div className="text-center mt-6">
            <Link href="/login" className="text-sm text-[#888888] hover:text-[#00FF41] hover:underline">
              Volver a Iniciar Sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}