// app/login/page.tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient' // Importamos el cliente
import { useRouter } from 'next/navigation'
import Link from 'next/link' // Para el enlace a "Registrar"

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // 1. Iniciar sesión con Supabase Auth
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      })

      if (signInError) {
        throw signInError
      }

      // 2. Si el inicio de sesión es exitoso, redirigir al Dashboard
      setLoading(false)
      // Usamos 'replace' para que el usuario no pueda volver
      // a la página de login con el botón "atrás"
      router.replace('/dashboard')

    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Correo o contraseña incorrectos.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E4E4E7] flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#00FF41] tracking-[4px] text-shadow-[0_0_12px_rgba(0,255,65,0.5)]">
            PROJECT OVERDRIVE
          </h1>
          <p className="text-sm text-[#888888] tracking-[8px] font-light">
            INICIAR SESIÓN
          </p>
        </header>

        {/* Tarjeta del formulario */}
        <div className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-8 md:p-12">

          <form onSubmit={handleLogin}>

            {/* Mensaje de error */}
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

            <div className="form-group mb-6">
              <label className="block mb-2 text-sm text-[#888888] tracking-wide" htmlFor="password">
                Contraseña
              </label>
              <input
                className="w-full h-14 px-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded text-[#E4E4E7] focus:outline-none focus:border-[#00FF41] focus:ring-1 focus:ring-[#00FF41]"
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Botón */}
            <button
              type="submit"
              className="w-full h-14 bg-[#00FF41] text-[#0A0A0A] font-bold text-base tracking-wider uppercase rounded transition-all duration-200 ease-out hover:bg-[#00D136] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'ACCEDIENDO...' : 'ACCEDER'}
            </button>
          </form>
          {/* --- AÑADE ESTE BLOQUE --- */}
            <div className="text-center mt-6">
                <Link href="/forgot-password" className="text-sm text-[#888888] hover:text-[#00FF41] hover:underline">
                ¿Olvidaste tu contraseña?
                </Link>
            </div>
            {/* --- FIN DEL BLOQUE --- */}

          {/* Enlace a Registro */}
          <div className="text-center mt-6">
            <p className="text-sm text-[#888888]">
              ¿No tienes una cuenta?{' '}
              <Link href="/signup" className="text-[#00FF41] hover:underline">
                Regístrate aquí
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}