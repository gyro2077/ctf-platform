// app/admin/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import EventSettings from '@/components/EventSettings' // <-- AÑADE ESTA LÍNEA

// Tipo para el perfil (simplificado para esta página)
type Profile = {
  is_admin: boolean;
}

// Tipo para los Desafíos (debe coincidir con la DB)
type Challenge = {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: number;
  points: number;
  flag: string; // Columna de la DB
  hints: string[]; // Es un array de texto en nuestra DB
  is_visible: boolean; // Faltaba esta
  created_at: string; // Faltaba esta
}

type NewChallenge = {
  title: string;
  description: string;
  category: string;
  difficulty: number;
  points: number;
  flag: string;
  hints: string; // Campo de texto separado por ;
}

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'challenges' | 'settings'>('challenges') // <-- AÑADE ESTA LÍNEA

  // Estado para el formulario de "Crear Desafío"
  const [newChallenge, setNewChallenge] = useState<NewChallenge>({
    title: '',
    description: '',
    category: 'Web',
    difficulty: 1,
    points: 100,
    flag: 'CTF{...}',
    hints: '',
  })

  // --- 1. VERIFICACIÓN DE ADMIN ---
  useEffect(() => {
    const checkAdminStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) {
        console.error(profileError)
        setError('No se pudo verificar el perfil')
        return
      }

      const isAdmin = (profiles as Profile | null)?.is_admin ?? false
      if (!isAdmin) {
        router.push('/dashboard'); return // ¡No es admin! Redirigir.
      }

      setIsAdmin(true)
      await fetchAllChallenges()
      setLoading(false)
    }

    checkAdminStatus()
  }, [router])

  // --- 2. FUNCIONES CRUD DE DESAFÍOS ---

  // Cargar TODOS los desafíos
  const fetchAllChallenges = async () => {
    // Pedimos todas las columnas que necesitamos
    const { data, error } = await supabase
      .from('challenges')
      .select('id, title, description, category, difficulty, points, flag, hints, is_visible, created_at')
      .order('title', { ascending: true })

    if (error) {
      console.error(error)
      setError('No se pudieron cargar los desafíos')
      return
    }

    setChallenges((data || []) as Challenge[])
  }

// Crear desafío
  const handleCreateChallenge = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    
    // Convertir hints (string separado por comas o punto y coma) en un array
    const hintsArray = newChallenge.hints
      .split(/[,;]/) // Separa por coma O punto y coma
      .map(h => h.trim())
      .filter(h => h) // Filtra strings vacíos

    const { error } = await supabase
      .from('challenges')
      .insert({
        title: newChallenge.title,
        description: newChallenge.description,
        category: newChallenge.category,
        difficulty: newChallenge.difficulty,
        points: newChallenge.points,
        flag: newChallenge.flag, // <-- Inserta la flag directamente
        hints: hintsArray,       // <-- Inserta el array de hints
        is_visible: false // Por defecto, los nuevos desafíos están ocultos
      })
    
    if (error) {
      setError(error.message)
    } else {
      // Limpiar formulario y recargar lista
      setNewChallenge({
        title: '', description: '', category: 'Web', difficulty: 1,
        points: 100, flag: 'CTF{...}', hints: ''
      })
      await fetchAllChallenges()
    }
  }

  // Eliminar desafío
  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('challenges')
      .delete()
      .eq('id', id)
    if (error) {
      console.error(error)
      setError('No se pudo eliminar el desafío')
      return
    }
    await fetchAllChallenges()
  }

  // Toggle visibilidad (visible/oculto)
  const handleToggleVisibility = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from('challenges')
      .update({ is_visible: !current })
      .eq('id', id)
    if (error) {
      console.error(error)
      setError('No se pudo cambiar visibilidad')
      return
    }
    await fetchAllChallenges()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-[#E4E4E7] flex items-center justify-center">
        <p className="text-[#888888]">Cargando...</p>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-[#E4E4E7]">
      <header className="max-w-6xl mx-auto py-10 px-4 flex items-center justify-between">
        <h1 className="text-3xl font-black tracking-[4px]">
          PANEL DE ADMINISTRACIÓN
        </h1>
        <a href="/dashboard" className="text-[#888888] hover:text-[#00FF41] hover:underline">
          Volver al Dashboard
        </a>
      </header>

      {/* --- INICIO: PESTAÑAS DE NAVEGACIÓN --- */}
      <nav className="max-w-6xl mx-auto mb-8 flex gap-4">
        <button
          onClick={() => setActiveTab('challenges')}
          className={`px-6 py-3 rounded-lg font-semibold uppercase tracking-wider ${
            activeTab === 'challenges'
              ? 'bg-[#00FF41] text-[#0A0A0A]'
              : 'bg-[#141414] text-[#888888] hover:bg-[#1f1f1f]'
          }`}
        >
          Gestionar Desafíos
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-6 py-3 rounded-lg font-semibold uppercase tracking-wider ${
            activeTab === 'settings'
              ? 'bg-[#00FF41] text-[#0A0A0A]'
              : 'bg-[#141414] text-[#888888] hover:bg-[#1f1f1f]'
          }`}
        >
          Ajustes del Evento
        </button>
      </nav>
      {/* --- FIN: PESTAÑAS DE NAVEGACIÓN --- */}

      {activeTab === 'challenges' && (
        <>
          {/* Sección de "Crear Desafío" */}
          <div className="max-w-6xl mx-auto bg-[#141414] border border-[#2A2A2A] rounded-lg p-8 mb-8">
            <h2 className="text-2xl text-[#00FF41] mb-6">Crear Nuevo Desafío</h2>
            <form onSubmit={handleCreateChallenge} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Columna 1 */}
              <div className="space-y-4">
                <InputText label="Título" name="title" value={newChallenge.title} set={setNewChallenge} />
                <InputSelect label="Categoría" name="category" value={newChallenge.category} set={setNewChallenge}>
                  <option value="Web">Web</option>
                  <option value="Crypto">Crypto</option>
                  <option value="Forensics">Forensics</option>
                  <option value="Reverse">Reverse</option>
                  <option value="Pwn">Pwn</option>
                  <option value="Misc">Misc</option>
                </InputSelect>
                <InputSelect label="Dificultad" name="difficulty" value={newChallenge.difficulty} set={setNewChallenge} type="number">
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                  <option value={5}>5</option>
                </InputSelect>
                <InputSelect label="Puntos" name="points" value={newChallenge.points} set={setNewChallenge} type="number">
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={150}>150</option>
                  <option value={200}>200</option>
                  <option value={300}>300</option>
                </InputSelect>
              </div>

              {/* Columna 2 */}
              <div className="space-y-4">
                <InputTextarea label="Descripción" name="description" value={newChallenge.description} set={setNewChallenge} />
                <InputText label="Flag (texto plano)" name="flag" value={newChallenge.flag} set={setNewChallenge} />
                <InputTextarea label="Pistas (separa con ; )" name="hints" value={newChallenge.hints} set={setNewChallenge} />
                <div>
                  <button type="submit" className="mt-2 w-full h-12 rounded-lg bg-[#00FF41] text-[#0A0A0A] font-bold tracking-wide hover:opacity-90">
                    Crear Desafío
                  </button>
                </div>
              </div>
            </form>
            {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
          </div>

          {/* Sección de "Lista de Desafíos" */}
          <div className="max-w-6xl mx-auto bg-[#141414] border border-[#2A2A2A] rounded-lg p-8">
            <h2 className="text-2xl text-[#00FF41] mb-6">Gestionar Desafíos Existentes</h2>
            <div className="space-y-4">
              {challenges.length > 0 ? challenges.map(c => (
                <div key={c.id} className="bg-[#1A1A1A] p-4 rounded-lg flex justify-between items-center">
                  <div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${c.is_visible ? 'bg-green-500 text-black' : 'bg-gray-500 text-white'}`}>
                      {c.is_visible ? 'VISIBLE' : 'OCULTO'}
                    </span>
                    <h3 className="text-lg font-semibold text-[#E4E4E7] mt-1">{c.title}</h3>
                    <p className="text-sm text-[#888888] font-normal">({c.category} - {c.points} pts)</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleToggleVisibility(c.id, !!c.is_visible)} className="h-10 px-3 rounded bg-[#2A2A2A] text-[#E4E4E7] hover:bg-[#333333]">
                      {c.is_visible ? 'Ocultar' : 'Mostrar'}
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="h-10 px-3 rounded bg-red-600 text-white hover:opacity-90">
                      Eliminar
                    </button>
                  </div>
                </div>
              )) : (
                <p className="text-[#888888]">No hay desafíos creados todavía.</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* --- INICIO: SECCIÓN DE AJUSTES --- */}
      {activeTab === 'settings' && (
        <EventSettings />
      )}
      {/* --- FIN: SECCIÓN DE AJUSTES --- */}

      <footer className="h-24" />
    </main>
  )
}

// === Componentes de Formulario (pequeños helpers) ===

type InputProps<T> = {
  label: string
  name: keyof T
  value: any
  set: React.Dispatch<React.SetStateAction<T>>
  type?: 'text' | 'number'
}

function InputText<T>({ label, name, value, set, type = 'text' }: InputProps<T>) {
  return (
    <div className="form-group">
      <label className="block mb-1.5 text-xs text-[#888888] tracking-wide" htmlFor={name as string}>
        {label}
      </label>
      <input
        id={name as string}
        name={name as string}
        type={type}
        className="w-full h-12 px-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded text-[#E4E4E7] focus:outline-none focus:border-[#00FF41]"
        value={value}
        onChange={(e) => set(prev => ({ ...prev, [name]: type === 'number' ? Number(e.target.value) : e.target.value }))}
        required
      />
    </div>
  )
}

function InputTextarea<T>({ label, name, value, set }: InputProps<T>) {
  return (
    <div className="form-group">
      <label className="block mb-1.5 text-xs text-[#888888] tracking-wide" htmlFor={name as string}>
        {label}
      </label>
      <textarea
        id={name as string}
        name={name as string}
        className="min-h-24 w-full px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded text-[#E4E4E7] focus:outline-none focus:border-[#00FF41]"
        value={value}
        onChange={(e) => set(prev => ({ ...prev, [name]: e.target.value }))}
        required
      />
    </div>
  )
}

function InputSelect<T>({ label, name, value, set, children, type = 'text' }: InputProps<T> & { children: React.ReactNode }) {
  return (
    <div className="form-group">
      <label className="block mb-1.5 text-xs text-[#888888] tracking-wide" htmlFor={name as string}>
        {label}
      </label>
      <select
        className="w-full h-12 px-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded text-[#E4E4E7] focus:outline-none focus:border-[#00FF41]"
        id={name as string}
        name={name as string}
        value={value}
        // El 'type' se usa aquí para castear el valor si es un número
        onChange={(e) => set(prev => ({ ...prev, [name]: type === 'number' ? parseInt(e.target.value) : e.target.value }))}
        required
      >
        {children}
      </select>
    </div>
  )
}
