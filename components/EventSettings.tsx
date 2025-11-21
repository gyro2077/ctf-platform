// components/EventSettings.tsx
'use client'

import { supabase } from '@/lib/supabaseClient'
import { useEffect, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

// Tipo para los ajustes
type EventSettings = {
  id: 1;
  registrations_open: boolean;
  registration_end_time: string | null;
  event_start_time: string | null;
  event_end_time: string | null;
}

// --- FUNCIONES HELPER DE TIMEZONE ---
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

// Función para obtener la hora actual en formato datetime-local
const getCurrentTimeString = (): string => {
  return toLocalInputString(new Date().toISOString());
}

// Función para obtener una hora futura con offset en minutos
const getOffsetTimeString = (offsetMinutes: number): string => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + offsetMinutes);
  return toLocalInputString(now.toISOString());
}

// Convertir string datetime-local a Date object
const stringToDate = (str: string | null | undefined): Date | null => {
  if (!str) return null;
  return new Date(str);
}

// Convertir Date object a string datetime-local
const dateToString = (date: Date | null): string => {
  if (!date) return '';
  return toLocalInputString(date.toISOString());
}
// --- FIN DE FUNCIONES HELPER ---

export default function EventSettings() {
  const [settings, setSettings] = useState<Partial<EventSettings>>({})
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState<string>(getCurrentTimeString())

  // Actualizar la hora actual cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTimeString())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

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

  // Manejador para DatePicker
  const handleDateChange = (fieldName: keyof EventSettings, date: Date | null) => {
    setSettings(prev => ({ ...prev, [fieldName]: dateToString(date) }))
  }

  // Función para establecer tiempo rápido
  const setQuickTime = (fieldName: keyof EventSettings, offsetMinutes: number) => {
    const timeString = getOffsetTimeString(offsetMinutes)
    setSettings(prev => ({ ...prev, [fieldName]: timeString }))
  }

  if (loading && !settings.id) {
    return <p className="text-[#888888]">Cargando ajustes...</p>
  }

  // Componente para un campo de tiempo con botones rápidos y DatePicker
  const TimeField = ({
    name,
    label,
    value
  }: {
    name: keyof EventSettings;
    label: string;
    value: string | null | undefined;
  }) => (
    <div className="form-group bg-[#1A1A1A] p-5 rounded-lg">
      <label className="block mb-3 text-base font-semibold text-[#E4E4E7]" htmlFor={name}>
        {label}
      </label>

      {/* DatePicker Visual */}
      <div className="mb-3">
        <DatePicker
          selected={stringToDate(value)}
          onChange={(date) => handleDateChange(name, date)}
          showTimeSelect
          timeFormat="HH:mm"
          timeIntervals={15}
          dateFormat="MMMM d, yyyy h:mm aa"
          className="w-full h-12 px-4 bg-[#0A0A0A] border border-[#2A2A2A] rounded text-[#E4E4E7] focus:outline-none focus:border-[#00FF41] font-mono"
          calendarClassName="dark-calendar"
          timeCaption="Hora"
          placeholderText="Selecciona fecha y hora"
        />
      </div>

      {/* Botones de acceso rápido */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setQuickTime(name, 0)}
          className="px-3 py-1.5 bg-[#2A2A2A] text-[#E4E4E7] rounded text-xs font-semibold hover:bg-[#3A3A3A] transition-colors"
        >
          Ahora
        </button>
        <button
          type="button"
          onClick={() => setQuickTime(name, 30)}
          className="px-3 py-1.5 bg-[#2A2A2A] text-[#E4E4E7] rounded text-xs font-semibold hover:bg-[#3A3A3A] transition-colors"
        >
          +30min
        </button>
        <button
          type="button"
          onClick={() => setQuickTime(name, 60)}
          className="px-3 py-1.5 bg-[#2A2A2A] text-[#E4E4E7] rounded text-xs font-semibold hover:bg-[#3A3A3A] transition-colors"
        >
          +1h
        </button>
        <button
          type="button"
          onClick={() => setQuickTime(name, 120)}
          className="px-3 py-1.5 bg-[#2A2A2A] text-[#E4E4E7] rounded text-xs font-semibold hover:bg-[#3A3A3A] transition-colors"
        >
          +2h
        </button>
        <button
          type="button"
          onClick={() => setQuickTime(name, 240)}
          className="px-3 py-1.5 bg-[#2A2A2A] text-[#E4E4E7] rounded text-xs font-semibold hover:bg-[#3A3A3A] transition-colors"
        >
          +4h
        </button>
        <button
          type="button"
          onClick={() => setQuickTime(name, 1440)}
          className="px-3 py-1.5 bg-[#2A2A2A] text-[#E4E4E7] rounded text-xs font-semibold hover:bg-[#3A3A3A] transition-colors"
        >
          +1 día
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Custom CSS for dark theme DatePicker */}
      <style jsx global>{`
        .react-datepicker {
          background-color: #1A1A1A !important;
          border: 1px solid #2A2A2A !important;
          font-family: monospace;
        }
        .react-datepicker__header {
          background-color: #0A0A0A !important;
          border-bottom: 1px solid #2A2A2A !important;
        }
        .react-datepicker__current-month,
        .react-datepicker__day-name {
          color: #00FF41 !important;
        }
        .react-datepicker__day {
          color: #E4E4E7 !important;
        }
        .react-datepicker__day:hover {
          background-color: #2A2A2A !important;
        }
        .react-datepicker__day--selected,
        .react-datepicker__day--keyboard-selected {
          background-color: #00FF41 !important;
          color: #0A0A0A !important;
        }
        .react-datepicker__time-container {
          border-left: 1px solid #2A2A2A !important;
        }
        .react-datepicker__time-container .react-datepicker__time {
          background-color: #1A1A1A !important;
        }
        .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list {
          background-color: #1A1A1A !important;
        }
        .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item {
          color: #E4E4E7 !important;
        }
        .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item:hover {
          background-color: #2A2A2A !important;
        }
        .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item--selected {
          background-color: #00FF41 !important;
          color: #0A0A0A !important;
        }
        .react-datepicker__navigation-icon::before {
          border-color: #E4E4E7 !important;
        }
        .react-datepicker__day--disabled {
          color: #888888 !important;
        }
      `}</style>

      <div className="max-w-6xl mx-auto bg-[#141414] border border-[#2A2A2A] rounded-lg p-8">
        <h2 className="text-2xl text-[#00FF41] mb-2">Ajustes Generales del Evento</h2>

        {/* Mostrar hora actual como referencia */}
        <div className="mb-6 p-4 bg-[#1A1A1A] rounded-lg border border-[#2A2A2A]">
          <p className="text-sm text-[#888888] mb-1">Hora Actual (Tu Zona Horaria):</p>
          <p className="text-2xl font-mono font-bold text-[#00FF41]">
            {new Date().toLocaleString('es-ES', {
              dateStyle: 'full',
              timeStyle: 'medium'
            })}
          </p>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-6">

          <TimeField
            name="registration_end_time"
            label="🔒 Fin de Registros y Equipos"
            value={settings.registration_end_time}
          />

          <TimeField
            name="event_start_time"
            label="🚀 Inicio del CTF"
            value={settings.event_start_time}
          />

          <TimeField
            name="event_end_time"
            label="🏁 Fin del CTF"
            value={settings.event_end_time}
          />

          <button
            type="submit"
            className="w-full h-14 mt-4 bg-[#00FF41] text-[#0A0A0A] font-bold text-base tracking-wider uppercase rounded disabled:opacity-50 hover:bg-[#00cc33] transition-colors"
            disabled={loading}
          >
            {loading ? 'GUARDANDO...' : 'GUARDAR AJUSTES'}
          </button>

          {message && (
            <p className={`mt-4 text-center font-semibold ${message.startsWith('Error') ? 'text-red-500' : 'text-green-500'}`}>
              {message}
            </p>
          )}
        </form>
      </div>
    </>
  )
}