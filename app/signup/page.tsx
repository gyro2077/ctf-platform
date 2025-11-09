// app/signup/page.tsx
'use client' 

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient' 
import { useRouter } from 'next/navigation'
import Link from 'next/link'
// --- NUEVA IMPORTACIÓN ---
import { departments, careersByDepartment } from '@/lib/departments'

export default function SignUpPage() {
  // Estados para cada campo del formulario
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [nationalId, setNationalId] = useState('')
  const [studentId, setStudentId] = useState('')
  const [department, setDepartment] = useState('') // Sigue siendo un string
  const [career, setCareer] = useState('')       // Sigue siendo un string
  const [phoneNumber, setPhoneNumber] = useState('')
  
  // --- NUEVO ESTADO PARA LAS CARRERAS FILTRADAS ---
  const [availableCareers, setAvailableCareers] = useState<string[]>([])
  
  // Estados para UI
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Estados para ajustes del evento
  const [checkingSettings, setCheckingSettings] = useState(true)
  const [registrationsOpen, setRegistrationsOpen] = useState(false)

  const router = useRouter()

  useEffect(() => {
    const fetchEventSettings = async () => {
      // ... (esta función no cambia) ...
      const { data, error } = await supabase
        .from('event_settings')
        .select('registrations_open')
        .eq('id', 1)
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
  }, [])

  // --- NUEVA FUNCIÓN: HANDLER DE DEPENDENCIA ---
  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDepartment = e.target.value;
    setDepartment(newDepartment);
    
    // Actualiza la lista de carreras disponibles
    setAvailableCareers(careersByDepartment[newDepartment] || []);
    
    // Resetea la carrera seleccionada
    setCareer('');
  }

  // Función de registro (¡NO CAMBIA!)
  // Sigue funcionando porque 'department' y 'career' son estados de string
  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    // ... (esta función es idéntica a la anterior) ...
    e.preventDefault()
    
    if (!registrationsOpen) {
      setError('Los registros están cerrados.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: fullName,
            institutional_email: email,
            national_id: nationalId,
            student_id: studentId,
            department: department, // Envía el string del departamento
            career: career,         // Envía el string de la carrera
            phone_number: phoneNumber,
          }
        }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('No se pudo crear el usuario.')

      setLoading(false)
      setSuccess(true)

    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Ocurrió un error inesperado.')
      setLoading(false)
    }
  }

  // Estado de carga inicial
  if (checkingSettings) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-[#E4E4E7] flex items-center justify-center p-4">
        <p className="text-2xl text-[#00FF41]">Cargando...</p>
      </div>
    )
  }

  // --- COMPONENTE SELECT (REUTILIZABLE) ---
  // He movido el estilo del <select> a un componente para no repetir código
  const SelectInput = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
    <select
      {...props}
      className="w-full h-14 px-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded text-[#E4E4E7] focus:outline-none focus:border-[#00FF41] focus:ring-1 focus:ring-[#00FF41] disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {props.children}
    </select>
  )


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
          
          {!registrationsOpen ? (
            <div className="text-center">
              {/* ... (vista de registros cerrados, sin cambios) ... */}
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
            <>
              {!success ? (
                <form onSubmit={handleSignUp}>
                  
                  {error && (
                    <div className="bg-red-900 border border-red-500 text-red-100 px-4 py-3 rounded-md mb-6">
                      <p>{error}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    
                    {/* Campos de texto (sin cambios) */}
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
                    {/* --- FIN CAMPOS DE TEXTO --- */}

                    {/* --- INICIO: NUEVOS SELECTS --- */}
                    <div className="form-group mb-2">
                      <label className="block mb-2 text-sm text-[#888888] tracking-wide" htmlFor="department">
                        Departamento *
                      </label>
                      <SelectInput
                        id="department"
                        value={department}
                        onChange={handleDepartmentChange}
                        required
                      >
                        <option value="" disabled>Selecciona tu departamento...</option>
                        {departments.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </SelectInput>
                    </div>
                    
                    <div className="form-group mb-2">
                      <label className="block mb-2 text-sm text-[#888888] tracking-wide" htmlFor="career">
                        Carrera *
                      </label>
                      <SelectInput
                        id="career"
                        value={career}
                        onChange={(e) => setCareer(e.target.value)}
                        required
                        disabled={!department} // Deshabilitado hasta que se elija un departamento
                      >
                        <option value="" disabled>Selecciona tu carrera...</option>
                        {availableCareers.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </SelectInput>
                    </div>
                    {/* --- FIN: NUEVOS SELECTS --- */}

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
              ) : (
                <div className="text-center">
                  {/* ... (vista de éxito, con el texto corregido) ... */}
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
