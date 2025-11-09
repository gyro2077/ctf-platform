// components/EventTimer.tsx
'use client'

import { supabase } from '@/lib/supabaseClient'
import { useEffect, useState } from 'react'

type EventSettings = {
  registration_end_time: string | null;
  event_start_time: string | null;
  event_end_time: string | null;
}

type TimeRemaining = {
  days: number; hours: number; minutes: number; seconds: number;
}

// Función helper (sin cambios)
const calculateTimeRemaining = (targetTime: string): TimeRemaining | null => {
  const difference = new Date(targetTime).getTime() - new Date().getTime()
  if (difference <= 0) return null
  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  }
}

// --- Componente Pequeño para un solo contador ---
const TimeBlock = ({ value, label }: { value: number, label: string }) => (
  <div className="flex flex-col items-center">
    <span className="text-3xl lg:text-4xl font-bold text-[#00FF41] font-mono">
      {String(value).padStart(2, '0')}
    </span>
    <span className="text-xs text-[#888888] uppercase tracking-wider">{label}</span>
  </div>
)

// --- Componente Pequeño para un Timer de una línea ---
const SingleTimer = ({ message, time }: { message: string, time: TimeRemaining }) => (
  <div>
    <h3 className="text-sm lg:text-lg text-[#888888] font-semibold mb-3 tracking-wider">{message}</h3>
    <div className="flex justify-center gap-4 lg:gap-6">
      <TimeBlock value={time.days} label="Días" />
      <TimeBlock value={time.hours} label="Horas" />
      <TimeBlock value={time.minutes} label="Min" />
      <TimeBlock value={time.seconds} label="Seg" />
    </div>
  </div>
)

// --- Componente Principal del Doble Timer ---
export default function EventTimer({ variant = 'public' }: { variant?: 'public' | 'dashboard' }) {
  const [settings, setSettings] = useState<EventSettings | null>(null)
  const [timers, setTimers] = useState<Record<string, TimeRemaining | null>>({})
  const [statusMessage, setStatusMessage] = useState('Cargando tiempo del evento...')

  useEffect(() => {
    // 1. Cargar las horas del evento
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('event_settings')
        .select('registration_end_time, event_start_time, event_end_time')
        .eq('id', 1)
        .single()

      if (data) {
        setSettings(data)
      } else {
        console.error('Error cargando ajustes del evento:', error)
        setStatusMessage('No se pudo cargar la configuración del evento.')
      }
    }
    fetchSettings()
  }, [])

  useEffect(() => {
    if (!settings) return

    // 2. Iniciar el temporizador (se actualiza cada segundo)
    const timerInterval = setInterval(() => {
      const { registration_end_time, event_start_time, event_end_time } = settings
      const now = new Date().getTime()

      // Calculamos los 3 contadores
      const regTime = registration_end_time ? calculateTimeRemaining(registration_end_time) : null
      const startTime = event_start_time ? calculateTimeRemaining(event_start_time) : null
      const endTime = event_end_time ? calculateTimeRemaining(event_end_time) : null

      setTimers({ regTime, startTime, endTime })

      // Lógica de mensajes
      if (endTime === null && event_end_time) {
        setStatusMessage('EL CTF HA FINALIZADO')
      } else if (startTime === null && event_start_time) {
        setStatusMessage('EL CTF ESTÁ EN CURSO')
      } else if (regTime === null && registration_end_time) {
        setStatusMessage('EL REGISTRO HA CERRADO')
      } else {
        setStatusMessage('EL EVENTO AÚN NO COMIENZA')
      }

    }, 1000)

    return () => clearInterval(timerInterval)
  }, [settings])

  // --- Lógica de qué timer mostrar ---
  const renderTimers = () => {
    const { regTime, startTime, endTime } = timers;

    // Caso 1: Evento finalizado
    if (settings?.event_end_time && !endTime) {
      return <p className="text-2xl font-bold text-[#FF4500]">EVENTO CONCLUIDO</p>
    }

    // Caso 2: Evento en curso
    if (settings?.event_start_time && !startTime && endTime) {
      // El CTF está activo, solo mostramos el timer de FIN
      return <SingleTimer message="EL CTF TERMINA EN:" time={endTime} />
    }

    // Caso 3: Evento no ha comenzado (mostramos ambos)
    // El "variant" decide cuál es el "crucial" (grande)
    if (startTime && regTime) {
      const regTimer = <SingleTimer message="CIERRE DE REGISTROS:" time={regTime} />
      const startTimer = <SingleTimer message="EL CTF COMIENZA EN:" time={startTime} />

      if (variant === 'dashboard') {
        return (
          <div className="flex flex-col gap-8">
            {startTimer} {/* El crucial (CTF) arriba */}
            <div className="opacity-70">{regTimer}</div> {/* El secundario abajo */}
          </div>
        )
      } else {
        // Variante pública (scoreboard), los mostramos lado a lado
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {regTimer}
            {startTimer}
          </div>
        )
      }
    }

    // Caso 4: Solo queda el timer de inicio (registro ya cerró)
    if (startTime) {
      return <SingleTimer message="EL CTF COMIENZA EN:" time={startTime} />
    }

    // Caso 5: Solo queda el timer de registro (sin hora de inicio)
    if (regTime) {
      return <SingleTimer message="CIERRE DE REGISTROS:" time={regTime} />
    }

    // Estado inicial
    return <p className="text-[#888888]">{statusMessage}</p>
  }

  return (
    <div className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-6 lg:p-8 text-center">
      {renderTimers()}
    </div>
  )
}