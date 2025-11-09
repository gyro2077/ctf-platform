// app/signup/page.tsx
'use client' 

import { useState, useEffect } from 'react' // <-- Importa useEffect
import { supabase } from '@/lib/supabaseClient' 
import { useRouter } from 'next/navigation'
import Link from 'next/link' // Importamos Link para el enlace

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

  // --- NUEVOS ESTADOS PARA AJUSTES DEL EVENTO ---
  const [checkingSettings, setCheckingSettings] = useState(true)
  const [registrationsOpen, setRegistrationsOpen] = useState(false) // Por defecto 'false' por seguridad

  const router = useRouter()

  // --- NUEVO EFECTO: VERIFICAR SI LOS REGISTROS ESTÁN ABIERTOS ---
  useEffect(() => {
    const fetchEventSettings = async () => {
      const { data, error } = await supabase
        .from('event_settings')
        .select('registrations_open')
        .eq('id', 1) // Siempre es la fila 1
        .single()

      if (data) {
        setRegistrationsOpen(data.registrations_open)
      } else {
        console.error('Error al cargar ajustes del evento:', error)
        setError('No se pudo cargar la configuración del evento. Intenta más tarde.')
      }
      setCheckingSettings(false)
    }

    fetchEventSettings()
  }, []) // El array vacío [] significa que esto se ejecuta solo una vez

  // --- NUEVA VERSIÓN de handleSignUp ---
  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!registrationsOpen) {
      setError('Los registros están cerrados.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 1. Crear el usuario en Supabase Auth
      // Esta vez, pasamos TODOS los datos del formulario en 'options.data'
      // El Trigger en la base de datos se encargará del resto.
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: fullName,
            institutional_email: email, // Guardamos el email aquí también
            national_id: nationalId,
            student_id: studentId,
            department: department,
            career: career,
            phone_number: phoneNumber,
          }
        }
      })

      if (authError) {
        throw authError
      }

      if (!authData.user) {
        throw new Error('No se pudo crear el usuario, por favor intente de nuevo.')
      }

      // ¡YA NO NECESITAMOS INSERTAR EN 'profiles' DESDE AQUÍ!
      // El Trigger lo hizo por nosotros.

      setLoading(false)
      setSuccess(true)

      // Ya no hay redirección, el usuario verá el mensaje
      // "¡Registro Exitoso! Te hemos enviado un correo..."

    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Ocurrió un error inesperado.')
      setLoading(false)
    }
  }

  // --- RENDERIZADO CONDICIONAL ---

  // Estado de carga inicial mientras se verifican los ajustes
  if (checkingSettings) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-[#E4E4E7] flex items-center justify-center p-4">
        <p className="text-2xl text-[#00FF41]">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E4E4E7] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#00FF41] tracking-[4px] text-shadow-[0_0_12px_rgba(0,255,65,0.5)]">
            PROJECT OVERDRIVE
          </h1>
          <p className="text-sm text-[#888888] tracking-[8px] font-light">
            CTF REGISTRO
          </p>
        </header>

        <div className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-8 md:p-12">
          
          {/* --- VISTA SI LOS REGISTROS ESTÁN CERRADOS --- */}
          {!registrationsOpen ? (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[#FF4500] mb-4">
                Registros Cerrados
              </h2>
              <p className="text-[#E4E4E7] mb-6">
                El período de registro para este evento ha finalizado.
              </p>
              <Link 
                href="/login" 
                className="text-[#00FF41] hover:underline text-lg"
              >
                ¿Ya tienes una cuenta? Inicia sesión aquí
              </Link>
            </div>
          ) : (
            
            // --- VISTA SI LOS REGISTROS ESTÁN ABIERTOS (El formulario) ---
            <>
              {!success ? (
                <form onSubmit={handleSignUp}>
                  
                  {error && (
                    <div className="bg-red-900 border border-red-500 text-red-100 px-4 py-3 rounded-md mb-6">
                      <p>{error}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    
                    <div className="form-group mb-2">
                      <label className="block mb-2 text-sm text-[#888888] tracking-wide" htmlFor="fullName">
                        Nombre completo *
                      </label>
                      <input
                        className="w-full h-14 px-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded text-[#E4E4E7] focus:outline-none focus:border-[#00FF41] focus:ring-1 focus:ring-[#00FF41]"
                        type="text" id="fullName" value={fullName}
                        onChange={(e) => setFullName(e.target.value)} required
                      />
                    </div>

                    <div className="form-group mb-2">
                      <label className="block mb-2 text-sm text-[#888888] tracking-wide" htmlFor="email">
                        Correo institucional *
                      </label>
                      <input
                        className="w-full h-14 px-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded text-[#E4E4E7] focus:outline-none focus:border-[#00FF41] focus:ring-1 focus:ring-[#00FF41]"
                        type="email" id="email" value={email}
                        onChange={(e) => setEmail(e.target.value)} required
                      />
                    </div>

                    <div className="form-group mb-2">
                      <label className="block mb-2 text-sm text-[#888888] tracking-wide" htmlFor="nationalId">
                        Número de Cédula *
                      </label>
                      <input
                        className="w-full h-14 px-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded text-[#E4E4E7] focus:outline-none focus:border-[#00FF41] focus:ring-1 focus:ring-[#00FF41]"
                        type="text" id="nationalId" value={nationalId}
                        onChange={(e) => setNationalId(e.target.value)} required
                      />
                    </div>

                    <div className="form-group mb-2">
                      <label className="block mb-2 text-sm text-[#888888] tracking-wide" htmlFor="studentId">
                        ID de Estudiante (L00...) *
                      </label>
                      <input
                        className="w-full h-14 px-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded text-[#E4E4E7] focus:outline-none focus:border-[#00FF41] focus:ring-1 focus:ring-[#00FF41]"
                        type="text" id="studentId" value={studentId}
                        onChange={(e) => setStudentId(e.target.value)} required
                      />
                    </div>

                    <div className="form-group mb-2">
                      <label className="block mb-2 text-sm text-[#888888] tracking-wide" htmlFor="department">
                        Departamento
                      </label>
                      <input
                        className="w-full h-14 px-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded text-[#E4E4E7] focus:outline-none focus:border-[#00FF41] focus:ring-1 focus:ring-[#00FF41]"
                        type="text" id="department" value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                      />
                    </div>
                    
                    <div className="form-group mb-2">
                      <label className="block mb-2 text-sm text-[#888888] tracking-wide" htmlFor="career">
                        Carrera
                      </label>
                      <input
                        className="w-full h-14 px-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded text-[#E4E4E7] focus:outline-none focus:border-[#00FF41] focus:ring-1 focus:ring-[#00FF41]"
                        type="text" id="career" value={career}
                        onChange={(e) => setCareer(e.target.value)}
                      />
                    </div>

                    <div className="form-group mb-2">
                      <label className="block mb-2 text-sm text-[#888888] tracking-wide" htmlFor="phoneNumber">
                        Número de Teléfono
                      </label>
                      <input
                        className="w-full h-14 px-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded text-[#E4E4E7] focus:outline-none focus:border-[#00FF41] focus:ring-1 focus:ring-[#00FF41]"
                        type="tel" id="phoneNumber" value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                      />
                    </div>

                    <div className="form-group mb-2">
                      <label className="block mb-2 text-sm text-[#888888] tracking-wide" htmlFor="password">
                        Contraseña *
                      </label>
                      <input
                        className="w-full h-14 px-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded text-[#E4E4E7] focus:outline-none focus:border-[#00FF41] focus:ring-1 focus:ring-[#00FF41]"
                        type="password" id="password" value={password}
                        onChange={(e) => setPassword(e.target.value)} required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-6 h-14 bg-[#00FF41] text-[#0A0A0A] font-bold text-base tracking-wider uppercase rounded transition-all duration-200 ease-out hover:bg-[#00D136] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    {loading ? 'CREANDO CUENTA...' : 'CREAR CUENTA'}
                  </button>
                </form>
              ) // ESTE ES EL CÓDIGO CORREGIDO
                : (
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-[#00FF41] mb-4">
                    ¡Registro Exitoso!
                    </h2>
                    <p className="text-lg text-[#E4E4E7] mb-4">
                    Te hemos enviado un correo de confirmación.
                    </p>
                    <p className="text-base text-[#888888] mb-6">
                    Por favor, revisa tu bandeja de entrada (y spam) para activar tu cuenta.
                    </p>
                    <Link href="/login" className="text-[#00FF41] hover:underline">
                    Volver a Iniciar Sesión
                    </Link>
                </div>
                )}
            </>
          )}

        </div>
      </div>
    </div>
  )
}
