// lib/supabaseClient.ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Lee las variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Función para crear una instancia del cliente de Supabase
export const createClient = () => {
    return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}

// Exportar también la instancia singleton para compatibilidad con código existente
export const supabase = createClient()