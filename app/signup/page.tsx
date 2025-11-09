// app/signup/page.tsx
'use client' // Directiva obligatoria para usar hooks de React

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient' // Importamos nuestro cliente
import { useRouter } from 'next/navigation' // Para redirigir al usuario

export default function SignUpPage() {
  // Estados para cada campo del formulario
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [nationalId, setNationalId] = useState('')
  const [studentId, setStudentId] = useState('')
  const [department, setDepartment] = useState('')
  const [career, setCareer] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')

  // Estados para UI
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const router = useRouter()

  // Función que se ejecuta al enviar el formulario
  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // 1. Crear el usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
      })

      if (authError) {
        throw authError
      }

      // Si la creación fue exitosa pero el usuario no está, algo raro pasó
      if (!authData.user) {
        throw new Error('No se pudo crear el usuario, por favor intente de nuevo.')
      }

      // 2. Insertar los datos adicionales en la tabla 'profiles'
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id, // El ID del usuario recién creado
          full_name: fullName,
          institutional_email: email, // Usamos el mismo email
          national_id: nationalId,
          student_id: studentId,
          department: department,
          career: career,
          phone_number: phoneNumber,
        })

      if (profileError) {
        // Nota: Si esto falla, el usuario de Auth ya existe.
        // En un escenario real, deberíamos manejar la "reversión" o limpieza.
        throw profileError
      }

      // ¡Todo salió bien!
      setLoading(false)
      setSuccess(true)

      // Opcional: Redirigir después de unos segundos
      setTimeout(() => {
        // Idealmente, aquí rediriges a una página de "Revisa tu email para confirmar"
        // Por ahora, lo mandamos al login.
        router.push('/login') // Crearemos esta página después
      }, 3000)

    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Ocurrió un error inesperado.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E4E4E7] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">

        {/* Logo (adaptado de tu index.html) */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#00FF41] tracking-[4px] text-shadow-[0_0_12px_rgba(0,255,65,0.5)]">
            PROJECT OVERDRIVE
          </h1>
          <p className="text-sm text-[#888888] tracking-[8px] font-light">
            CTF REGISTRO
          </p>
        </header>

        {/* Tarjeta del formulario (adaptado de .auth-card) */}
        <div className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-8 md:p-12">

          {!success ? (
            <form onSubmit={handleSignUp}>

              {/* Mensaje de error */}
              {error && (
                <div className="bg-red-900 border border-red-500 text-red-100 px-4 py-3 rounded-md mb-6">
                  <p>{error}</p>
                </div>
              )}

              {/* Grid para el formulario */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">

                {/* Estilo de .form-group adaptado a Tailwind */}
                <div className="form-group mb-2">
                  <label className="block mb-2 text-sm text-[#888888] tracking-wide" htmlFor="fullName">
                    Nombre completo *
                  </label>
                  <input
                    className="w-full h-14 px-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded text-[#E4E4E7] focus:outline-none focus:border-[#00FF41] focus:ring-1 focus:ring-[#00FF41]"
                    type="text"
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group mb-2">
                  <label className="block mb-2 text-sm text-[#888888] tracking-wide" htmlFor="email">
                    Correo institucional *
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

                <div className="form-group mb-2">
                  <label className="block mb-2 text-sm text-[#888888] tracking-wide" htmlFor="nationalId">
                    Número de Cédula *
                  </label>
                  <input
                    className="w-full h-14 px-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded text-[#E4E4E7] focus:outline-none focus:border-[#00FF41] focus:ring-1 focus:ring-[#00FF41]"
                    type="text"
                    id="nationalId"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group mb-2">
                  <label className="block mb-2 text-sm text-[#888888] tracking-wide" htmlFor="studentId">
                    ID de Estudiante (L00...) *
                  </label>
                  <input
                    className="w-full h-14 px-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded text-[#E4E4E7] focus:outline-none focus:border-[#00FF41] focus:ring-1 focus:ring-[#00FF41]"
                    type="text"
                    id="studentId"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group mb-2">
                  <label className="block mb-2 text-sm text-[#888888] tracking-wide" htmlFor="department">
                    Departamento
                  </label>
                  <input
                    className="w-full h-14 px-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded text-[#E4E4E7] focus:outline-none focus:border-[#00FF41] focus:ring-1 focus:ring-[#00FF41]"
                    type="text"
                    id="department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  />
                </div>

                <div className="form-group mb-2">
                  <label className="block mb-2 text-sm text-[#888888] tracking-wide" htmlFor="career">
                    Carrera
                  </label>
                  <input
                    className="w-full h-14 px-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded text-[#E4E4E7] focus:outline-none focus:border-[#00FF41] focus:ring-1 focus:ring-[#00FF41]"
                    type="text"
                    id="career"
                    value={career}
                    onChange={(e) => setCareer(e.target.value)}
                  />
                </div>

                <div className="form-group mb-2">
                  <label className="block mb-2 text-sm text-[#888888] tracking-wide" htmlFor="phoneNumber">
                    Número de Teléfono
                  </label>
                  <input
                    className="w-full h-14 px-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded text-[#E4E4E7] focus:outline-none focus:border-[#00FF41] focus:ring-1 focus:ring-[#00FF41]"
                    type="tel"
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>

                <div className="form-group mb-2">
                  <label className="block mb-2 text-sm text-[#888888] tracking-wide" htmlFor="password">
                    Contraseña *
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
              </div>

              {/* Botón (adaptado de .btn-primary) */}
              <button
                type="submit"
                className="w-full mt-6 h-14 bg-[#00FF41] text-[#0A0A0A] font-bold text-base tracking-wider uppercase rounded transition-all duration-200 ease-out hover:bg-[#00D136] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? 'CREANDO CUENTA...' : 'CREAR CUENTA'}
              </button>
            </form>
          ) : (
            // Mensaje de éxito
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[#00FF41] mb-4">
                ¡Registro Exitoso!
              </h2>
              <p className="text-[#E4E4E7]">
                Te hemos enviado un correo de confirmación. Por favor, revisa tu bandeja de entrada para activar tu cuenta.
              </p>
              <p className="text-[#888888] mt-2">
                Serás redirigido en 3 segundos...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}