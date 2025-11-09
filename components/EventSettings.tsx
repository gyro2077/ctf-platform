// components/EventSettings.tsx
'use client'

import { supabase } from '@/lib/supabaseClient'
import { useEffect, useState } from 'react'

// Tipo para los ajustes
type EventSettings = {
  id: 1;
  registrations_open: boolean; // Mantenemos el switch manual por si acaso
  registration_end_time: string | null;
  event_start_time: string | null;
  event_end_time: string | null;
}

// --- FUNCIONES HELPER DE TIMEZONE (Sin cambios) ---
const toLocalInputString = (utcString: string | null | undefined): string => {
  if (!utcString) return '';
  const d = new Date(utcString);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

const toUTCISOString = (localString: string | null | undefined): string | null => {
  if (!localString) return null;
  return new Date(localString).toISOString();
}
// --- FIN DE FUNCIONES HELPER ---

export default function EventSettings() {
  const [settings, setSettings] = useState<Partial<EventSettings>>({})
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)

  // Cargar los ajustes actuales al inicio
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('event_settings')
        .select('*')
        .eq('id', 1)
        .single()

      if (data) {
        setSettings({
          ...data,
          registration_end_time: toLocalInputString(data.registration_end_time),
          event_start_time: toLocalInputString(data.event_start_time),
          event_end_time: toLocalInputString(data.event_end_time),
        })
      } else { console.error('Error cargando ajustes:', error) }
      setLoading(false)
    }
    fetchSettings()
  }, [])

  const handleSaveSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const { error } = await supabase
      .from('event_settings')
      .update({
        registrations_open: settings.registrations_open,
        registration_end_time: toUTCISOString(settings.registration_end_time),
        event_start_time: toUTCISOString(settings.event_start_time),
        event_end_time: toUTCISOString(settings.event_end_time),
      })
      .eq('id', 1)

    if (error) {
      setMessage(`Error al guardar: ${error.message}`)
    } else {
      setMessage('¡Ajustes guardados exitosamente!')
      setTimeout(() => setMessage(null), 3000)
    }
    setLoading(false)
  }

  // Manejador de cambios (sin cambios)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      setSettings(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }))
    } else {
      setSettings(prev => ({ ...prev, [name]: value === '' ? null : value }))
    }
  }

  if (loading && !settings.id) {
    return <p className="text-[#888888]">Cargando ajustes...</p>
  }

  return (
    <div className="max-w-6xl mx-auto bg-[#141414] border border-[#2A2A0A] rounded-lg p-8">
      <h2 className="text-2xl text-[#00FF41] mb-6">Ajustes Generales del Evento</h2>
      <form onSubmit={handleSaveSettings} className="max-w-md space-y-6">

        <div className="flex items-center justify-between bg-[#1A1A1A] p-4 rounded-lg">
          <label htmlFor="registrations_open" className="text-lg font-medium text-[#E4E4E7]">
            Registros Abiertos (Manual)
          </label>
          <input
            type="checkbox"
            id="registrations_open"
            name="registrations_open"
            className="h-6 w-6 rounded text-[#00FF41] bg-[#2A2A2A] border-[#888888] focus:ring-[#00FF41]"
            checked={settings.registrations_open || false}
            onChange={handleChange}
          />
        </div>

        {/* --- NUEVO INPUT --- */}
        <div className="form-group">
          <label className="block mb-1.5 text-sm text-[#888888] tracking-wide" htmlFor="registration_end_time">
            Fin de Registros y Equipos (Tu Hora Local)
          </label>
          <input
            className="w-full h-12 px-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded text-[#E4E4E7] focus:outline-none focus:border-[#00FF41]"
            type="datetime-local"
            id="registration_end_time"
            name="registration_end_time"
            value={settings.registration_end_time || ''}
            onChange={handleChange}
          />
        </div>
        {/* --- FIN NUEVO INPUT --- */}

        <div className="form-group">
          <label className="block mb-1.5 text-sm text-[#888888] tracking-wide" htmlFor="event_start_time">
            Hora de Inicio del CTF (Tu Hora Local)
          </label>
          <input
            className="w-full h-12 px-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded text-[#E4E4E7] focus:outline-none focus:border-[#00FF41]"
            type="datetime-local"
            id="event_start_time"
            name="event_start_time"
            value={settings.event_start_time || ''}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label className="block mb-1.5 text-sm text-[#888888] tracking-wide" htmlFor="event_end_time">
            Hora de Fin del CTF (Tu Hora Local)
          </label>
          <input
            className="w-full h-12 px-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded text-[#E4E4E7] focus:outline-none focus:border-[#00FF41]"
            type="datetime-local"
            id="event_end_time"
            name="event_end_time"
            value={settings.event_end_time || ''}
            onChange={handleChange}
          />
        </div>

        <button
          type="submit"
          className="w-full h-14 mt-4 bg-[#00FF41] text-[#0A0A0A] font-bold text-base tracking-wider uppercase rounded disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'GUARDANDO...' : 'GUARDAR AJUSTES'}
        </button>

        {message && (
          <p className={`mt-4 text-center ${message.startsWith('Error') ? 'text-red-500' : 'text-green-500'}`}>
            {message}
          </p>
        )}
      </form>
    </div>
  )
}