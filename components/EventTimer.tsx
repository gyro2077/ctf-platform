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

// --- Componente Pequeño para un Timer de una línea ---
// (Modificado para aceptar un 'isCrucial' para el tamaño)
const SingleTimer = ({ message, time, isCrucial = false }: { message: string, time: TimeRemaining, isCrucial?: boolean }) => {
  const textSize = isCrucial ? "text-3xl lg:text-4xl" : "text-2xl lg:text-3xl";
  const labelColor = isCrucial ? "text-[#E4E4E7] font-semibold" : "text-[#888888]";

  return (
    <div>
      <h3 className={`text-sm lg:text-lg mb-3 tracking-wider ${labelColor}`}>
        {message}
      </h3>
      <div className="flex justify-center gap-4 lg:gap-6">
        <div className="flex flex-col items-center">
          <span className={`${textSize} font-bold text-[#00FF41] font-mono`}>{String(time.days).padStart(2, '0')}</span>
          <span className="text-xs text-[#888888] uppercase tracking-wider">Días</span>
        </div>
        <div className="flex flex-col items-center">
          <span className={`${textSize} font-bold text-[#00FF41] font-mono`}>{String(time.hours).padStart(2, '0')}</span>
          <span className="text-xs text-[#888888] uppercase tracking-wider">Horas</span>
        </div>
        <div className="flex flex-col items-center">
          <span className={`${textSize} font-bold text-[#00FF41] font-mono`}>{String(time.minutes).padStart(2, '0')}</span>
          <span className="text-xs text-[#888888] uppercase tracking-wider">Min</span>
        </div>
        <div className="flex flex-col items-center">
          <span className={`${textSize} font-bold text-[#00FF41] font-mono`}>{String(time.seconds).padStart(2, '0')}</span>
          <span className="text-xs text-[#888888] uppercase tracking-wider">Seg</span>
        </div>
      </div>
    </div>
  )
}

// --- Componente Principal del Doble Timer ---
export default function EventTimer({ variant = 'public' }: { variant?: 'public' | 'dashboard' }) {
  const [settings, setSettings] = useState<EventSettings | null>(null)
  const [timers, setTimers] = useState<Record<string, TimeRemaining | null>>({})
  const [statusMessage, setStatusMessage] = useState('Cargando tiempo del evento...')

  useEffect(() => {
    // 1. Cargar las horas del evento (sin cambios)
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('event_settings')
        .select('registration_end_time, event_start_time, event_end_time')
        .eq('id', 1)
        .single()
      if (data) setSettings(data)
      else setStatusMessage('No se pudo cargar la configuración del evento.')
    }
    fetchSettings()
  }, [])

  useEffect(() => {
    if (!settings) return
    // 2. Iniciar el temporizador (sin cambios)
    const timerInterval = setInterval(() => {
      const { registration_end_time, event_start_time, event_end_time } = settings;
      const regTime = registration_end_time ? calculateTimeRemaining(registration_end_time) : null;
      const startTime = event_start_time ? calculateTimeRemaining(event_start_time) : null;
      const endTime = event_end_time ? calculateTimeRemaining(event_end_time) : null;
      setTimers({ regTime, startTime, endTime });

      if (endTime === null && event_end_time) setStatusMessage('EL CTF HA FINALIZADO');
      else if (startTime === null && event_start_time) setStatusMessage('EL CTF ESTÁ EN CURSO');
      else if (regTime === null && registration_end_time) setStatusMessage('EL REGISTRO HA CERRADO');
      else setStatusMessage('EL EVENTO AÚN NO COMIENZA');
    }, 1000);
    return () => clearInterval(timerInterval);
  }, [settings])

  // --- LÓGICA DE RENDERIZADO (CORREGIDA) ---
  const renderTimers = () => {
    const { regTime, startTime, endTime } = timers;

    // --- Definimos los timers que están activos ---
    // (Un timer está "activo" si su tiempo futuro existe)
    const ctfEndTimer = (settings?.event_start_time && !startTime && endTime) 
        ? <SingleTimer message="EL CTF TERMINA EN:" time={endTime} isCrucial={true} />
        : null;
        
    const ctfStartTimer = (startTime)
        ? <SingleTimer message="EL CTF COMIENZA EN:" time={startTime} isCrucial={variant === 'dashboard' && !ctfEndTimer} />
        : null;
        
    const regEndTimer = (regTime)
        ? <SingleTimer message="CIERRE DE REGISTROS:" time={regTime} isCrucial={false} />
        : null;

    // --- Decidir qué mostrar ---
    
    // Caso 1: Evento finalizado
    if (settings?.event_end_time && !endTime) {
      return <p className="text-2xl font-bold text-[#FF4500]">EVENTO CONCLUIDO</p>
    }

    // Caso 2: El CTF está en curso
    if (ctfEndTimer) {
      // El CTF está activo (crucial).
      // Mostramos el timer de FIN.
      // Y si *aún* está abierto el registro, lo mostramos también (pequeño).
      return (
        <div className="flex flex-col gap-8">
          {ctfEndTimer}
          {regEndTimer && <div className="opacity-70">{regEndTimer}</div>}
        </div>
      )
    }

    // Caso 3: El CTF no ha comenzado (mostramos los timers de inicio)
    if (ctfStartTimer || regEndTimer) {
      if (variant === 'dashboard') {
        return (
          <div className="flex flex-col gap-8">
            {ctfStartTimer} {/* CTF Start es crucial (grande) */}
            {regEndTimer && <div className="opacity-70">{regEndTimer}</div>} {/* Reg End es secundario (pequeño) */}
          </div>
        )
      } else {
        // Variante pública (scoreboard)
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {regEndTimer}
            {ctfStartTimer}
          </div>
        )
      }
    }

    // Estado inicial o sin fechas
    return <p className="text-[#888888]">{statusMessage}</p>
  }

  return (
    <div className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-6 lg:p-8 text-center">
      {renderTimers()}
    </div>
  )
}