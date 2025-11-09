// app/reset-password/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { Session } from '@supabase/supabase-js'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    // Escucha el evento de recuperación de contraseña
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          setSession(session) // ¡El usuario está verificado!
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!session) {
      setError('Token inválido o expirado. Solicita un nuevo enlace.');
      setLoading(false);
      return;
    }

    // Actualizar la contraseña del usuario
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      setError(error.message)
    } else {
      setMessage('¡Contraseña actualizada! Serás redirigido al login.')
      // Salir de la sesión de recuperación
      await supabase.auth.signOut()
      setTimeout(() => router.push('/login'), 3000)
    }
    setLoading(false)
  }

  if (!session) {
    // Muestra un mensaje mientras espera el token del enlace
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-[#E4E4E7] flex items-center justify-center p-4">
        <p className="text-[#888888]">Verificando enlace...</p>
      </div>
    )
  }

  // Si el token es válido (session existe), muestra el formulario
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E4E4E7] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#00FF41] tracking-[4px]">
            NUEVA CONTRASEÑA
          </h1>
        </header>

        <div className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-8 md:p-12">
          {!message ? (
            <form onSubmit={handleUpdatePassword}>
              <p className="text-sm text-[#888888] mb-6">
                Ingresa tu nueva contraseña.
              </p>

              {error && (
                <div className="bg-red-900 border border-red-500 text-red-100 px-4 py-3 rounded-md mb-6">
                  <p>{error}</p>
                </div>
              )}

              <div className="form-group mb-4">
                <label className="block mb-2 text-sm text-[#888888] tracking-wide" htmlFor="newPassword">
                  Nueva Contraseña
                </label>
                <input
                  className="w-full h-14 px-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded text-[#E4E4E7] focus:outline-none focus:border-[#00FF41] focus:ring-1 focus:ring-[#00FF41]"
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full h-14 bg-[#00FF41] text-[#0A0A0A] font-bold text-base tracking-wider uppercase rounded disabled:opacity-50"
                disabled={loading || newPassword.length < 6}
              >
                {loading ? 'GUARDANDO...' : 'GUARDAR CONTRASEÑA'}
              </button>
            </form>
          ) : (
            <div className="text-center">
              <p className="text-lg text-[#00FF41]">{message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}