// components/LogoutButton.tsx
'use client'

import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    // 1. Llama a signOut de Supabase
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Error al cerrar sesión:', error.message)
      alert('Error al cerrar sesión') // Muestra un error simple
      return
    }

    // 2. Redirige al login
    // Usamos 'replace' para limpiar el historial de navegación
    router.replace('/login')
  }

  return (
    <button
      onClick={handleLogout}
      // Adaptado de tu .btn-secondary
      className="bg-[#2A2A2A] text-[#E4E4E7] border border-[#2A2A2A] h-12 px-8 rounded font-semibold uppercase tracking-wider transition-all duration-200 hover:bg-[#3A3A3A]"
    >
      Cerrar Sesión
    </button>
  )
}