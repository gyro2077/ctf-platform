'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { departments, careersByDepartment } from '@/lib/departments'
import {
  validateEcuadorianID,
  validateEspeEmail,
  validateName,
  validateStudentIdDigits
} from '@/lib/validation'
import DataPrivacyModal from '@/components/DataPrivacyModal' // <-- AÑADIDO

// --- INICIO: COMPONENTES Y TIPOS MOVIDOS AFUERA ---

// Tipo para el objeto de errores
type FormErrors = {
  fullName?: string;
  email?: string;
  nationalId?: string;
  studentIdNumbers?: string;
  department?: string;
  career?: string;
  password?: string;
  form?: string; // Para errores generales del servidor
}

// Componente Select (AHORA ESTÁ AFUERA)
const SelectInput = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    {...props}
    className={`w-full h-14 px-4 bg-[#1A1A1A] border ${props['aria-invalid'] ? 'border-red-500' : 'border-[#2A2A2A]'} rounded text-[#E4E4E7] focus:outline-none focus:border-[#00FF41] disabled:opacity-50`}
  >
    {props.children}
  </select>
)

// Componente Input (AHORA ESTÁ AFUERA)
const TextInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={`w-full h-14 px-4 bg-[#1A1A1A] border ${props['aria-invalid'] ? 'border-red-500' : 'border-[#2A2A2A]'} rounded text-[#E4E4E7] focus:outline-none focus:border-[#00FF41]`}
  />
)

// --- FIN: COMPONENTES Y TIPOS MOVIDOS AFUERA ---


// --- COMPONENTE PRINCIPAL DE LA PÁGINA ---
export default function SignUpPage() {
  // Estados del formulario
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [nationalId, setNationalId] = useState('')
  const [studentIdNumbers, setStudentIdNumbers] = useState('') // Solo los 7 dígitos
  const [department, setDepartment] = useState('')
  const [career, setCareer] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')

  const [availableCareers, setAvailableCareers] = useState<string[]>([])
  const [errors, setErrors] = useState<FormErrors>({})

  // Estados de UI
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [checkingSettings, setCheckingSettings] = useState(true)
  const [registrationsOpen, setRegistrationsOpen] = useState(false)
  const [registrationEndTime, setRegistrationEndTime] = useState<string | null>(null)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const [hasAcceptedPrivacy, setHasAcceptedPrivacy] = useState(false)

  const router = useRouter()

  // Carga de ajustes del evento
  useEffect(() => {
    const fetchEventSettings = async () => {
      const { data, error } = await supabase
        .from('event_settings')
        .select('registration_end_time')
        .eq('id', 1)
        .single()

      if (data) {
        setRegistrationEndTime(data.registration_end_time)
        // Verificar si los registros están abiertos basado en el tiempo
        const now = new Date().getTime()
        const endTime = data.registration_end_time ? new Date(data.registration_end_time).getTime() : null

        if (endTime && now <= endTime) {
          setRegistrationsOpen(true)
        } else {
          setRegistrationsOpen(false)
        }
      } else {
        setErrors((prev) => ({ ...prev, form: 'No se pudo cargar la configuración del evento.' }))
      }
      setCheckingSettings(false)
    }
    fetchEventSettings()
  }, [])

  // Handler de Departamento (sin cambios)
  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDepartment = e.target.value;
    setDepartment(newDepartment);
    setAvailableCareers(careersByDepartment[newDepartment] || []);
    setCareer('');
  }

  // Función de validación (sin cambios)
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    if (!validateName(fullName)) {
      newErrors.fullName = 'Ingresa un nombre válido (solo letras y espacios).'
    }
    if (!validateEspeEmail(email)) {
      newErrors.email = 'Debe ser un correo válido del dominio @espe.edu.ec'
    }
    if (!validateEcuadorianID(nationalId)) {
      newErrors.nationalId = 'Ingresa un número de cédula ecuatoriana válido (10 dígitos).'
    }
    if (!validateStudentIdDigits(studentIdNumbers)) {
      newErrors.studentIdNumbers = 'Ingresa entre 6 y 8 dígitos numéricos de tu ID.'
    }
    if (!department) newErrors.department = 'Debes seleccionar un departamento.'
    if (!career) newErrors.career = 'Debes seleccionar una carrera.'
    if (password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres.'
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // Función handleSignUp (sin cambios)
  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!validateForm()) return
    if (!registrationsOpen) {
      setErrors({ form: 'Los registros están cerrados.' })
      return
    }
    if (!hasAcceptedPrivacy) {
      setErrors({ form: 'Debes aceptar la Política de Privacidad para continuar.' })
      return
    }
    setLoading(true)
    setErrors({})
    const fullStudentId = `L00${studentIdNumbers}`

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: fullName,
            institutional_email: email,
            national_id: nationalId,
            student_id: fullStudentId,
            department: department,
            career: career,
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
      setLoading(false)
      if (err.code === '23505' || err.message?.includes('duplicate key')) {
        if (err.message?.includes('profiles_institutional_email_key')) {
          setErrors({ email: 'Este correo institucional ya está registrado.' })
        } else if (err.message?.includes('profiles_national_id_key')) {
          setErrors({ nationalId: 'Este número de cédula ya está registrado.' })
        } else if (err.message?.includes('profiles_student_id_key')) {
          setErrors({ studentIdNumbers: 'Este ID de estudiante ya está registrado.' })
        } else {
          setErrors({ form: 'Este valor ya está registrado.' })
        }
      } else {
        setErrors({ form: err.message || 'Ocurrió un error inesperado.' })
      }
    }
  }

  // --- RENDERIZADO (JSX) ---

  if (checkingSettings) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-[#E4E4E7] flex items-center justify-center p-4">
        <p className="text-2xl text-[#E4E4E7]">Cargando...</p>
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

          {!registrationsOpen ? (
            // ... (Vista de registros cerrados - sin cambios)
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[#FF4500] mb-4">Registros Cerrados</h2>
              <p className="text-[#E4E4E7] mb-6">El período de registro ha finalizado.</p>
              <Link href="/login" className="text-[#00FF41] hover:underline text-lg">
                ¿Ya tienes una cuenta? Inicia sesión aquí
              </Link>
            </div>
          ) : (
            <>
              {!success ? (
                <form onSubmit={handleSignUp}>

                  {errors.form && (
                    <div className="bg-red-900 border border-red-500 text-red-100 px-4 py-3 rounded-md mb-6">
                      <p>{errors.form}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">

                    {/* Nombre completo */}
                    <div className="form-group mb-2">
                      <label className="block mb-2 text-sm text-[#888888] tracking-wide" htmlFor="fullName">Nombre completo *</label>
                      <TextInput
                        type="text" id="fullName" value={fullName}
                        onChange={(e) => setFullName(e.target.value)} required
                        aria-invalid={!!errors.fullName}
                      />
                      {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                    </div>

                    {/* Correo institucional */}
                    <div className="form-group mb-2">
                      <label className="block mb-2 text-sm text-[#888888] tracking-wide" htmlFor="email">Correo institucional *</label>
                      <TextInput
                        type="email" id="email" value={email}
                        onChange={(e) => setEmail(e.target.value)} required
                        aria-invalid={!!errors.email}
                      />
                      {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>

                    {/* Número de Cédula */}
                    <div className="form-group mb-2">
                      <label className="block mb-2 text-sm text-[#888888] tracking-wide" htmlFor="nationalId">Número de Cédula *</label>
                      <TextInput
                        type="tel" id="nationalId" value={nationalId}
                        onChange={(e) => setNationalId(e.target.value.replace(/\D/g, ''))} // Solo permite números
                        maxLength={10} required
                        aria-invalid={!!errors.nationalId}
                      />
                      {errors.nationalId && <p className="text-red-500 text-xs mt-1">{errors.nationalId}</p>}
                    </div>

                    {/* ID de Estudiante (MODIFICADO) */}
                    <div className="form-group mb-2">
                      <label className="block mb-2 text-sm text-[#888888] tracking-wide" htmlFor="studentIdNumbers">ID de Estudiante (6-8 dígitos) *</label>
                      <div className="flex items-center">
                        <span className="h-14 px-4 flex items-center bg-[#2A2A2A] border border-[#2A2A2A] rounded-l text-[#888888]">
                          L00
                        </span>
                        <TextInput
                          type="tel" id="studentIdNumbers" value={studentIdNumbers}
                          onChange={(e) => setStudentIdNumbers(e.target.value.replace(/\D/g, ''))} // Solo números
                          maxLength={8} required
                          aria-invalid={!!errors.studentIdNumbers}
                          className="w-full h-14 px-4 bg-[#1A1A1A] border-t border-r border-b border-[#2A2A2A] rounded-r text-[#E4E4E7] focus:outline-none focus:border-[#00FF41]"
                        />
                      </div>
                      {errors.studentIdNumbers && <p className="text-red-500 text-xs mt-1">{errors.studentIdNumbers}</p>}
                    </div>

                    {/* Departamento */}
                    <div className="form-group mb-2">
                      <label className="block mb-2 text-sm text-[#888888] tracking-wide" htmlFor="department">Departamento *</label>
                      <SelectInput
                        id="department" value={department}
                        onChange={handleDepartmentChange} required
                        aria-invalid={!!errors.department}
                      >
                        <option value="" disabled>Selecciona tu departamento...</option>
                        {departments.map((dept) => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </SelectInput>
                      {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department}</p>}
                    </div>

                    {/* Carrera */}
                    <div className="form-group mb-2">
                      <label className="block mb-2 text-sm text-[#888888] tracking-wide" htmlFor="career">Carrera *</label>
                      <SelectInput
                        id="career" value={career}
                        onChange={(e) => setCareer(e.target.value)}
                        required disabled={!department}
                        aria-invalid={!!errors.career}
                      >
                        <option value="" disabled>Selecciona tu carrera...</option>
                        {availableCareers.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </SelectInput>
                      {errors.career && <p className="text-red-500 text-xs mt-1">{errors.career}</p>}
                    </div>

                    {/* Teléfono (Opcional) */}
                    <div className="form-group mb-2">
                      <label className="block mb-2 text-sm text-[#888888] tracking-wide" htmlFor="phoneNumber">Número de Teléfono</label>
                      <TextInput
                        type="tel" id="phoneNumber" value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                        maxLength={10}
                      />
                    </div>

                    {/* Contraseña */}
                    <div className="form-group mb-2">
                      <label className="block mb-2 text-sm text-[#888888] tracking-wide" htmlFor="password">Contraseña *</label>
                      <TextInput
                        type="password" id="password" value={password}
                        onChange={(e) => setPassword(e.target.value)} required
                        aria-invalid={!!errors.password}
                      />
                      {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                    </div>
                  </div>

                  {/* --- INICIO: CHECKBOX DE PRIVACIDAD --- */}
                  <div className="form-group mt-6">
                    <div className="flex items-center">
                      <input
                        id="privacy-checkbox"
                        type="checkbox"
                        className="h-5 w-5 rounded text-[#00FF41] bg-[#2A2A2A] border-[#888888] focus:ring-[#00FF41]"
                        checked={hasAcceptedPrivacy}
                        onChange={(e) => {
                          if (e.target.checked) {
                            // Si marca, mostrar modal. Si desmarca, simplemente desmarcar.
                            setShowPrivacyModal(true);
                          } else {
                            setHasAcceptedPrivacy(false);
                          }
                        }}
                      />
                      <label htmlFor="privacy-checkbox" className="ml-3 text-sm text-[#E4E4E7]">
                        He leído y acepto la{' '}
                        <button
                          type="button"
                          className="text-[#00FF41] hover:underline font-semibold"
                          onClick={() => setShowPrivacyModal(true)} // Muestra el modal al hacer clic en el enlace
                        >
                          Política de Privacidad de Datos
                        </button>
                        . *
                      </label>
                    </div>
                  </div>
                  {/* --- FIN: CHECKBOX DE PRIVACIDAD --- */}

                  <button
                    type="submit"
                    className="w-full mt-6 h-14 bg-[#00FF41] text-[#0A0A0A] font-bold text-base tracking-wider uppercase rounded disabled:opacity-50"
                    disabled={loading || !hasAcceptedPrivacy} // <-- ACTUALIZADO
                  >
                    {loading ? 'CREANDO CUENTA...' : 'CREAR CUENTA'}
                  </button>
                </form>
              ) : (
                // ... (Vista de Éxito - sin cambios)
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-[#00FF41] mb-4">¡Registro Exitoso!</h2>
                  <p className="text-lg text-[#E4E4E7] mb-4">Te hemos enviado un correo de confirmación.</p>
                  <p className="text-base text-[#888888] mb-6">Por favor, revisa tu bandeja de entrada (y spam) para activar tu cuenta.</p>
                  <Link href="/login" className="text-[#00FF41] hover:underline">
                    Volver a Iniciar Sesión
                  </Link>
                </div>
              )}

              {/* --- INICIO: RENDERIZAR EL MODAL --- */}
              {showPrivacyModal && (
                <DataPrivacyModal
                  onAccept={() => {
                    setHasAcceptedPrivacy(true);
                    setShowPrivacyModal(false);
                  }}
                  onClose={() => setShowPrivacyModal(false)}
                />
              )}
              {/* --- FIN: RENDERIZAR EL MODAL --- */}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
