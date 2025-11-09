// app/admin/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'

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
  flag: string;
  hints: string[];
  is_visible: boolean;
  created_at: string;
}

// Tipo para el formulario de nuevo desafío
type NewChallenge = {
  title: string;
  description: string;
  category: string;
  difficulty: number;
  points: number;
  flag: string;
  hints: string; // Usamos un string simple, luego lo convertimos en array
}

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [error, setError] = useState<string | null>(null)

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
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login'); return
      }
      setUser(session.user)

      // Buscar el perfil del usuario para ver si es admin
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single()

      if (error || !profile || !profile.is_admin) {
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
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) setError(error.message)
    else setChallenges(data as Challenge[])
  }

  // Manejar el formulario de crear
  const handleCreateChallenge = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    // Convertir hints (string separado por comas) en un array
    const hintsArray = newChallenge.hints.split(',').map(h => h.trim()).filter(h => h)

    const { error } = await supabase
      .from('challenges')
      .insert({
        title: newChallenge.title,
        description: newChallenge.description,
        category: newChallenge.category,
        difficulty: newChallenge.difficulty,
        points: newChallenge.points,
        flag: newChallenge.flag,
        hints: hintsArray,
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

  // Cambiar visibilidad
  const handleToggleVisibility = async (id: string, currentVisibility: boolean) => {
    const { error } = await supabase
      .from('challenges')
      .update({ is_visible: !currentVisibility })
      .eq('id', id)

    if (error) setError(error.message)
    else await fetchAllChallenges()
  }

  // Borrar desafío
  const handleDeleteChallenge = async (id: string) => {
    if (confirm('¿Seguro que quieres borrar este desafío? Esta acción no se puede deshacer.')) {
      const { error } = await supabase
        .from('challenges')
        .delete()
        .eq('id', id)

      if (error) setError(error.message)
      else await fetchAllChallenges()
    }
  }

  // --- RENDERIZADO ---
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-[#E4E4E7] flex items-center justify-center">
        <p className="text-2xl text-[#00FF41]">Verificando permisos...</p>
      </div>
    )
  }

  if (!isAdmin) return null // Ya debería haber redirigido

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E4E4E7] p-8">
      <header className="max-w-6xl mx-auto mb-12 flex justify-between items-center">
        <h1 className="text-4xl font-bold text-[#00FF41] tracking-[4px]">
          PANEL DE ADMINISTRACIÓN
        </h1>
        <a href="/dashboard" className="text-[#888888] hover:text-[#00FF41] hover:underline">
          Volver al Dashboard
        </a>
      </header>

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
              <option value="OSINT">OSINT</option>
              <option value="Pwn">Pwn</option>
              <option value="Misc">Misc</option>
            </InputSelect>
            <InputTextarea label="Descripción" name="description" value={newChallenge.description} set={setNewChallenge} />
          </div>

          {/* Columna 2 */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <InputSelect label="Dificultad (1-5)" name="difficulty" type="number" value={newChallenge.difficulty} set={setNewChallenge}>
                <option value={1}>1 - Muy Fácil</option>
                <option value={2}>2 - Fácil</option>
                <option value={3}>3 - Medio</option>
                <option value={4}>4 - Difícil</option>
                <option value={5}>5 - Muy Difícil</option>
              </InputSelect>
              <InputText label="Puntos" name="points" type="number" value={newChallenge.points} set={setNewChallenge} />
            </div>
            <InputText label="Flag" name="flag" value={newChallenge.flag} set={setNewChallenge} />
            <InputText label="Hints (separados por coma)" name="hints" value={newChallenge.hints} set={setNewChallenge} />
            <button
              type="submit"
              className="w-full h-14 mt-6 bg-[#00FF41] text-[#0A0A0A] font-bold text-base tracking-wider uppercase rounded transition-all duration-200 ease-out hover:bg-[#00D136]"
            >
              Crear Desafío
            </button>
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
                <h3 className="text-lg font-semibold text-[#E4E4E7]">{c.title} <span className="text-sm text-[#888888] font-normal">({c.category} - {c.points} pts)</span></h3>
                <code className="text-xs text-[#00FF41] font-mono">{c.flag}</code>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleToggleVisibility(c.id, c.is_visible)}
                  className="text-xs bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white px-3 py-2 rounded"
                >
                  {c.is_visible ? 'Ocultar' : 'Mostrar'}
                </button>
                <button
                  onClick={() => handleDeleteChallenge(c.id)}
                  className="text-xs bg-red-900 hover:bg-red-800 text-red-100 px-3 py-2 rounded"
                >
                  Borrar
                </button>
              </div>
            </div>
          )) : (
            <p className="text-[#888888]">No has creado ningún desafío todavía.</p>
          )}
        </div>
      </div>
    </div>
  )
}

// --- Componentes de Formulario Reutilizables ---
// (Los ponemos al final del archivo para mantener limpio el componente principal)

// Tipo genérico para las props de los inputs
type InputProps<T> = {
  label: string;
  name: keyof T;
  value: string | number;
  set: React.Dispatch<React.SetStateAction<T>>;
  type?: string;
}

function InputText<T>({ label, name, value, set, type = 'text' }: InputProps<T>) {
  return (
    <div className="form-group">
      <label className="block mb-1.5 text-xs text-[#888888] tracking-wide" htmlFor={name as string}>
        {label}
      </label>
      <input
        className="w-full h-12 px-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded text-[#E4E4E7] focus:outline-none focus:border-[#00FF41]"
        type={type}
        id={name as string}
        name={name as string}
        value={value}
        onChange={(e) => set(prev => ({ ...prev, [name]: e.target.value }))}
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
        className="w-full min-h-[100px] p-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded text-[#E4E4E7] focus:outline-none focus:border-[#00FF41]"
        id={name as string}
        name={name as string}
        value={value as string}
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