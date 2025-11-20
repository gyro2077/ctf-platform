import { supabase } from '@/lib/supabaseClient'
// import { cookies } from 'next/headers' // <-- CORRECCIÓN 1: No necesitamos cookies aquí
import Link from 'next/link'
import EventTimer from '@/components/EventTimer' // <-- AÑADE ESTA LÍNEA
import HeroSection from '@/components/HeroSection'

// Definimos el tipo de dato que esperamos de nuestra VIEW
type ScoreboardEntry = {
  team_id: string;
  team_name: string;
  score: number;
  last_submission: string | null;
}

// --- Componente de Servidor ---
// Hacemos que la página se actualice automáticamente cada 60 segundos
export const revalidate = 60

async function getScores(): Promise<ScoreboardEntry[]> {
  // --- CORRECCIÓN 2: Usamos .from('scoreboard') para leer la VISTA ---
  // en lugar de .rpc('get_scoreboard')
  const { data, error } = await supabase
    .from('scoreboard') // Leemos la VISTA
    .select('*')
    .order('score', { ascending: false })
    .order('last_submission', { ascending: true }) // Desempate

  if (error) {
    console.error('Error al cargar el scoreboard:', error)
    return []
  }

  return data as ScoreboardEntry[]
}

export default async function ScoreboardPage() {
  // 3. Obtenemos los puntajes
  const scoreboard = await getScores()

  // Función para formatear la fecha
  const formatTimeAgo = (timestamp: string | null) => {
    if (!timestamp) return '---'
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  }

  // 4. Renderizamos la página
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E4E4E7] p-0">

      <HeroSection />

      <div className="p-8">
        {/* --- INICIO: TEMPORIZADOR DEL EVENTO --- */}
        <div className="max-w-4xl mx-auto mb-8">
          <EventTimer />
        </div>
        {/* --- FIN: TEMPORIZADOR DEL EVENTO --- */}

        <main className="max-w-4xl mx-auto bg-[#141414] border border-[#2A2A2A] rounded-lg p-8">
          {/* Tabla de Ranking (adaptada de tu leaderboard.html) */}
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2A2A2A]">
                <th className="p-4 text-left text-sm uppercase text-[#888888] tracking-wider">Rank</th>
                <th className="p-4 text-left text-sm uppercase text-[#888888] tracking-wider">Equipo</th>
                <th className="p-4 text-left text-sm uppercase text-[#888888] tracking-wider">Score</th>
                <th className="p-4 text-left text-sm uppercase text-[#888888] tracking-wider">Último Envío</th>
              </tr>
            </thead>
            <tbody>
              {scoreboard.length > 0 ? scoreboard.map((team, index) => (
                <tr key={team.team_id} className="border-b border-[#1A1A1A] hover:bg-[#1f1f1f]">
                  <td className="p-4 font-mono text-lg font-bold text-[#00FF41]">
                    #{index + 1}
                  </td>
                  <td className="p-4 text-lg text-[#E4E4E7] font-semibold">
                    {team.team_name}
                  </td>
                  <td className="p-4 font-mono text-lg text-[#E4E4E7]">
                    {team.score}
                  </td>
                  <td className="p-4 font-mono text-sm text-[#888888]">
                    {formatTimeAgo(team.last_submission)}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-[#888888]">
                    Aún no hay puntajes. ¡La competencia está por comenzar!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </main>

        <footer className="text-center mt-12 text-[#888888] text-sm">
          <p>© {new Date().getFullYear()} Project Overdrive. All rights reserved.</p>
        </footer>
      </div>
    </div>
  )
}

