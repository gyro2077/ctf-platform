// components/EventTimer.tsx
'use client'

import { supabase } from '@/lib/supabaseClient'
import { useEffect, useState } from 'react'

type EventSettings = {
  event_start_time: string | null;
  event_end_time: string | null;
}

type TimeRemaining = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

// Función para calcular la diferencia de tiempo
const calculateTimeRemaining = (targetTime: string): TimeRemaining | null => {
  const difference = new Date(targetTime).getTime() - new Date().getTime()

  if (difference <= 0) {
    return null // El tiempo ha pasado
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  }
}

export default function EventTimer() {
  const [settings, setSettings] = useState<EventSettings | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null)
  const [message, setMessage] = useState('Cargando tiempo del evento...')

  useEffect(() => {
    // 1. Cargar las horas del evento
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('event_settings')
        .select('event_start_time, event_end_time')
        .eq('id', 1)
        .single()

      if (data) {
        setSettings(data)
      } else {
        console.error('Error cargando ajustes del evento:', error)
        setMessage('No se pudo cargar la configuración del evento.')
      }
    }
    fetchSettings()
  }, [])

  useEffect(() => {
    if (!settings) return

    // 2. Iniciar el temporizador (se actualiza cada segundo)
    const timerInterval = setInterval(() => {
      const { event_start_time, event_end_time } = settings
      const now = new Date().getTime()

      if (event_start_time && now < new Date(event_start_time).getTime()) {
        // Caso 1: El CTF no ha comenzado
        setMessage('EL CTF COMIENZA EN:')
        setTimeRemaining(calculateTimeRemaining(event_start_time))
      } else if (event_end_time && now < new Date(event_end_time).getTime()) {
        // Caso 2: El CTF está en curso
        setMessage('EL CTF TERMINA EN:')
        setTimeRemaining(calculateTimeRemaining(event_end_time))
      } else if (event_end_time && now >= new Date(event_end_time).getTime()) {
        // Caso 3: El CTF ha finalizado
        setMessage('EL CTF HA FINALIZADO')
        setTimeRemaining(null)
        clearInterval(timerInterval) // Detener el temporizador
      } else {
        // Caso 4: No hay fechas configuradas
        setMessage('El evento no tiene hora de inicio/fin.')
        clearInterval(timerInterval)
      }
    }, 1000)

    // Limpiar el intervalo cuando el componente se desmonte
    return () => clearInterval(timerInterval)
  }, [settings]) // Este efecto se ejecuta cada vez que 'settings' cambia

  // Componente para mostrar un número del temporizador
  const TimeBlock = ({ value, label }: { value: number, label: string }) => (
    <div className="flex flex-col items-center">
      <span className="text-4xl font-bold text-[#00FF41] font-mono">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-xs text-[#888888] uppercase tracking-wider">{label}</span>
    </div>
  )

  return (
    <div className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-6 text-center">
      <h3 className="text-lg text-[#888888] font-semibold mb-4 tracking-wider">{message}</h3>

      {timeRemaining ? (
        <div className="flex justify-center gap-6">
          <TimeBlock value={timeRemaining.days} label="Días" />
          <TimeBlock value={timeRemaining.hours} label="Horas" />
          <TimeBlock value={timeRemaining.minutes} label="Min" />
          <TimeBlock value={timeRemaining.seconds} label="Seg" />
        </div>
      ) : (
        // Muestra un estado de "finalizado" o "cargando"
        !message.includes('Cargando') && (
          <p className="text-2xl font-bold text-[#FF4500]">EVENTO CONCLUIDO</p>
        )
      )}
    </div>
  )
}