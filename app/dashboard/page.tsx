// app/dashboard/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import LogoutButton from '@/components/LogoutButton'
import EventTimer from '@/components/EventTimer'

// --- DEFINICIÓN DE TIPOS ---
type Profile = {
  full_name: string;
  department: string;
  student_id: string;
  is_admin: boolean;
}

type Team = {
  id: string;
  name: string;
  creator_id: string;
}

type TeamMember = {
  joined_at: string;
  profiles: {
    id: string;
    full_name: string;
    student_id: string;
  };
}

// Tipo para los Desafíos
type Challenge = {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: number;
  points: number;
  flag: string; // ¡Importante! Lo traemos para comparar, pero NUNCA lo mostramos
  hints: string[];
}

// --- ESTADOS ---
export default function DashboardPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)

  // Estados de Equipos
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [availableTeams, setAvailableTeams] = useState<Team[]>([])
  const [teamError, setTeamError] = useState<string | null>(null)
  const [newTeamName, setNewTeamName] = useState('')
  const [isCreatingTeam, setIsCreatingTeam] = useState(false)
  const [isJoiningTeam, setIsJoiningTeam] = useState<string | null>(null)

  // Nuevos estados para Desafíos
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [solvedChallengeIds, setSolvedChallengeIds] = useState<Set<string>>(new Set())
  const [flagInputs, setFlagInputs] = useState<{ [key: string]: string }>({}) // Almacena el valor de cada input de flag
  const [submitError, setSubmitError] = useState<{ [key: string]: string | null }>({})
  const [submitSuccess, setSubmitSuccess] = useState<{ [key: string]: boolean }>({})
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null) // ID del desafío que se está enviando
  const [teamRank, setTeamRank] = useState<number | null>(null)
  const [eventHasEnded, setEventHasEnded] = useState(false)
  const [eventHasStarted, setEventHasStarted] = useState(false)
  const [eventIsActive, setEventIsActive] = useState(false)

  // --- FUNCIÓN PRINCIPAL DE CARGA DE DATOS ---
  const checkSessionAndFetchData = async () => {
    setLoading(true)

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      router.push('/login'); return
    }
    setUser(session.user)

    // *** NUEVO: Cargar ajustes del evento (LÓGICA MEJORADA) ***
    const { data: settingsData } = await supabase
      .from('event_settings')
      .select('registration_end_time, event_start_time, event_end_time')
      .eq('id', 1)
      .single();

    if (settingsData) {
      const now = new Date().getTime();
      const regEnd = settingsData.registration_end_time ? new Date(settingsData.registration_end_time).getTime() : null;
      const start = settingsData.event_start_time ? new Date(settingsData.event_start_time).getTime() : null;
      const end = settingsData.event_end_time ? new Date(settingsData.event_end_time).getTime() : null;

      // Verificar si el evento ha comenzado
      if (start && now >= start) {
        setEventHasStarted(true);
      }

      // Verificar si el evento ha terminado
      if (end && now > end) {
        setEventHasEnded(true);
        setEventIsActive(true);
      } else if (regEnd && now > regEnd) {
        setEventIsActive(true);
      }
    }
    // *** FIN DEL BLOQUE MEJORADO ***

    const { data: profileData, error: profileError } = await supabase
      .from('profiles').select('full_name, department, student_id, is_admin').eq('id', session.user.id).single()
    if (profileError) console.error('Error al buscar el perfil:', profileError)
    if (profileData) setProfile(profileData)

    await fetchUserTeamData(session.user.id) // Esto cargará los datos del equipo
    setLoading(false)
  }

  // --- FUNCIÓN PARA OBTENER DATOS DEL EQUIPO ---
  const fetchUserTeamData = async (userId: string) => {
    setTeamError(null)

    const { data: teamMembership, error: membershipError } = await supabase
      .from('team_members').select('team_id').eq('user_id', userId).single()

    if (membershipError && membershipError.code !== 'PGRST116') {
      console.error('Error buscando membresía:', membershipError)
    }

    if (teamMembership) {
      // SÍ ESTÁ EN UN EQUIPO
      const teamId = teamMembership.team_id

      const { data: teamData } = await supabase
        .from('teams').select('id, name, creator_id').eq('id', teamId).single()
      if (teamData) setCurrentTeam(teamData)

      const { data: membersData } = await supabase
        .from('team_members').select(`joined_at, profiles ( id, full_name, student_id )`).eq('team_id', teamId)
      if (membersData) setTeamMembers(membersData as unknown as TeamMember[])

      // *** NUEVO: Cargar desafíos ya que tenemos un equipo ***
      await fetchChallengesAndSubmissions(teamId)

      // *** NUEVO: Cargar el ranking del equipo ***
      const { data: scoreboardData, error: rankError } = await supabase
        .from('scoreboard') // Leemos desde nuestra VIEW pública
        .select('team_id')

      if (rankError) {
        console.error('Error al cargar ranking:', rankError)
      } else if (scoreboardData) {
        // Encontramos la posición (index) de nuestro equipo en el array
        const rank = scoreboardData.findIndex(team => team.team_id === teamId)
        // El índice es 0, 1, 2... así que sumamos 1
        setTeamRank(rank !== -1 ? rank + 1 : null)
      }
      // *** FIN DEL BLOQUE NUEVO ***

    } else {
      // NO ESTÁ EN UN EQUIPO
      setCurrentTeam(null)
      setTeamMembers([])
      setChallenges([]) // Limpiar desafíos si no hay equipo

      const { data: availableTeamsData } = await supabase
        .from('teams').select('id, name, creator_id')
      if (availableTeamsData) setAvailableTeams(availableTeamsData)
    }
  }

  // --- NUEVA FUNCIÓN: OBTENER DESAFÍOS Y ENVÍOS ---
  const fetchChallengesAndSubmissions = async (teamId: string) => {
    // 1. Obtener todos los desafíos visibles
    const { data: challengesData, error: challengesError } = await supabase
      .from('challenges')
      .select('id, title, description, category, difficulty, points, flag, hints')
      .eq('is_visible', true)

    if (challengesError) console.error('Error al cargar desafíos:', challengesError)
    if (challengesData) setChallenges(challengesData as Challenge[])

    // 2. Obtener los envíos correctos DE ESTE EQUIPO
    const { data: submissionsData, error: submissionsError } = await supabase
      .from('submissions')
      .select('challenge_id')
      .eq('team_id', teamId)
      .eq('is_correct', true)

    if (submissionsError) console.error('Error al cargar envíos:', submissionsError)
    if (submissionsData) {
      // Crear un 'Set' (conjunto) con los IDs de los desafíos ya resueltos
      const solvedIds = new Set(submissionsData.map(sub => sub.challenge_id))
      setSolvedChallengeIds(solvedIds)
    }
  }

  // --- HANDLERS (ACCIONES DEL USUARIO) ---

  const handleCreateTeam = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); if (!newTeamName.trim() || !user) return
    setIsCreatingTeam(true); setTeamError(null)
    try {
      const { data: newTeam, error: createTeamError } = await supabase
        .from('teams').insert({ name: newTeamName, creator_id: user.id }).select().single()
      if (createTeamError) throw createTeamError
      const { error: addMemberError } = await supabase
        .from('team_members').insert({ team_id: newTeam.id, user_id: user.id })
      if (addMemberError) throw addMemberError
      await fetchUserTeamData(user.id); setNewTeamName('')
    } catch (err: any) {
      if (err.code === '23505') setTeamError('El nombre de este equipo ya existe.')
      else setTeamError('No se pudo crear el equipo: ' + err.message)
    }
    setIsCreatingTeam(false)
  }

  const handleJoinTeam = async (teamId: string) => {
    if (!user) return
    setIsJoiningTeam(teamId); setTeamError(null)
    try {
      const { error: joinError } = await supabase
        .from('team_members').insert({ team_id: teamId, user_id: user.id })
      if (joinError) throw joinError
      await fetchUserTeamData(user.id)
    } catch (err: any) {
      if (err.code === '23503') setTeamError('Ya perteneces a un equipo.')
      else setTeamError('No se pudo unir al equipo: ' + err.message)
    }
    setIsJoiningTeam(null)
  }

  const handleLeaveTeam = async () => {
    if (!user || !currentTeam) return
    if (confirm('¿Estás seguro de que quieres abandonar este equipo?')) {
      setLoading(true); setTeamError(null)
      try {
        const { error } = await supabase
          .from('team_members').delete().eq('user_id', user.id).eq('team_id', currentTeam.id)
        if (error) throw error
        await fetchUserTeamData(user.id)
      } catch (err: any) {
        setTeamError('No se pudo abandonar el equipo: ' + err.message)
      }
      setLoading(false)
    }
  }

  // --- NUEVA FUNCIÓN: ENVIAR FLAG ---
  const handleFlagSubmit = async (e: React.FormEvent<HTMLFormElement>, challenge: Challenge) => {
    e.preventDefault()
    if (!user || !currentTeam) return

    const submittedFlag = flagInputs[challenge.id] || ''
    if (!submittedFlag.trim()) return

    setIsSubmitting(challenge.id)
    setSubmitError(prev => ({ ...prev, [challenge.id]: null }))
    setSubmitSuccess(prev => ({ ...prev, [challenge.id]: false }))

    try {
      const isCorrect = submittedFlag === challenge.flag

      // Registrar el envío (sea correcto o incorrecto)
      const { error: submissionError } = await supabase
        .from('submissions')
        .insert({
          user_id: user.id,
          team_id: currentTeam.id,
          challenge_id: challenge.id,
          submitted_flag: submittedFlag,
          is_correct: isCorrect
        })

      if (submissionError) throw submissionError

      if (isCorrect) {
        setSubmitSuccess(prev => ({ ...prev, [challenge.id]: true }))
        // Añadir al Set de resueltos y limpiar input
        setSolvedChallengeIds(prev => new Set(prev).add(challenge.id))
        setFlagInputs(prev => ({ ...prev, [challenge.id]: '' }))
      } else {
        throw new Error('Flag incorrecta.')
      }

    } catch (err: any) {
      setSubmitError(prev => ({ ...prev, [challenge.id]: err.message }))
    }
    setIsSubmitting(null)
  }

  // --- EFECTO PARA VERIFICAR EL ESTADO DEL EVENTO EN TIEMPO REAL ---
  useEffect(() => {
    const checkEventStatus = async () => {
      const { data: settingsData } = await supabase
        .from('event_settings')
        .select('registration_end_time, event_start_time, event_end_time')
        .eq('id', 1)
        .single();

      if (settingsData) {
        const now = new Date().getTime();
        const regEnd = settingsData.registration_end_time ? new Date(settingsData.registration_end_time).getTime() : null;
        const start = settingsData.event_start_time ? new Date(settingsData.event_start_time).getTime() : null;
        const end = settingsData.event_end_time ? new Date(settingsData.event_end_time).getTime() : null;

        // Verificar si el evento ha comenzado
        if (start && now >= start) {
          setEventHasStarted(true);
        } else {
          setEventHasStarted(false);
        }

        // Verificar si el evento ha terminado
        if (end && now > end) {
          setEventHasEnded(true);
          setEventIsActive(true);
        } else if (regEnd && now > regEnd) {
          setEventIsActive(true);
        }
      }
    };

    // Verificar cada segundo
    const statusInterval = setInterval(checkEventStatus, 1000);

    // Limpieza
    return () => clearInterval(statusInterval);
  }, []);

  // --- EFECTO INICIAL ---
  useEffect(() => {
    checkSessionAndFetchData()
  }, []) // Se ejecuta solo una vez al cargar la página

  // --- RENDERIZADO ---
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-[#E4E4E7] flex items-center justify-center">
        <p className="text-2xl text-[#00FF41]">Cargando...</p>
      </div>
    )
  }

  // Función de ayuda para renderizar estrellas de dificultad
  const renderDifficultyStars = (level: number) => {
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <span key={i} className={`star ${i < level ? 'text-yellow-400' : 'text-[#2A2A2A]'}`}>
            ★
          </span>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E4E4E7] p-8">

      <header className="max-w-6xl mx-auto mb-12 flex justify-between items-center">
        <div className="text-left">
          <h1 className="text-3xl font-bold text-[#00FF41] tracking-[4px]">
            BIENVENIDO, {profile?.full_name || user?.email}
          </h1>
          <p className="text-lg text-[#888888] font-light">
            Panel de control
          </p>
        </div>

        {/* Contenedor para botones de admin y logout */}
        <div className="flex items-center gap-4">
          {profile?.is_admin && (
            <a href="/admin" className="text-[#00FF41] hover:underline font-semibold uppercase tracking-wider">
              Admin
            </a>
          )}
          <LogoutButton />
        </div>
      </header>

      {/* ... (después del <header>) ... */}

      {/* --- SECCIÓN 1: TEMPORIZADOR Y TU INFORMACIÓN --- */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">

        {/* Columna del Temporizador */}
        <div className="lg:col-span-2">
          <EventTimer variant="dashboard" /> {/* <-- variante crucial */}
        </div>

        {/* Columna de Tu Información */}
        <div className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-6">
          <h2 className="text-2xl text-[#00FF41] mb-4">Tu Info</h2>
          <p className="mb-1 text-sm"><span className="text-[#888888]">Estudiante:</span> {profile?.full_name || 'N/D'}</p>
          <p className="mb-4 text-sm"><span className="text-[#888888]">ID:</span> {profile?.student_id || 'N/D'}</p>

          {/* Módulo de Ranking */}
          {currentTeam && (
            <div className="bg-[#1A1A1A] p-4 rounded-md text-center">
              <span className="text-sm text-[#888888] uppercase">Tu Posición</span>
              <p className="text-4xl font-bold text-[#00FF41] font-mono">
                {teamRank ? `#${teamRank}` : 'N/A'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* --- SECCIÓN 2: LÓGICA DE EQUIPOS Y DESAFÍOS --- */}
      <div className="max-w-6xl mx-auto">

        {currentTeam ? (
          // --- VISTA: SI YA TIENE EQUIPO (MUESTRA EQUIPO Y DESAFÍOS) ---
          <>
            <div className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-8 mb-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <span className="text-sm text-[#888888]">TU EQUIPO</span>
                  <h2 className="text-3xl text-[#00FF41] font-bold">{currentTeam.name}</h2>
                </div>
                <button
                  onClick={handleLeaveTeam}
                  className="bg-red-900 text-red-100 border border-red-700 h-10 px-4 rounded font-semibold uppercase tracking-wider text-xs transition-all duration-200 hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={eventIsActive || eventHasEnded}
                >
                  Abandonar Equipo
                </button>
              </div>

              <h3 className="text-lg text-[#E4E4E7] font-semibold mb-3">Miembros</h3>
              <ul className="space-y-3">
                {teamMembers.map(member => {
                  const p = member.profiles;

                  return (
                    <li key={p?.id || Math.random()} className="flex items-center bg-[#1A1A1A] p-3 rounded-md">
                      <div className="w-8 h-8 rounded-full bg-[#00FF41] text-[#0A0A0A] flex items-center justify-center font-bold text-sm mr-3">
                        {(p?.full_name?.charAt(0).toUpperCase()) || "?"}
                      </div>
                      <div>
                        <p className="text-base text-[#E4E4E7]">{p?.full_name ?? "Usuario sin nombre"}</p>
                        <p className="text-xs text-[#888888]">{p?.student_id ?? "N/D"}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* --- SECCIÓN 3: DESAFÍOS DISPONIBLES --- */}
            <div>
              <h2 className="text-3xl font-bold text-[#E4E4E7] mb-6 tracking-wide">Desafíos Disponibles</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {challenges.length > 0 ? challenges.map(challenge => {
                  const isSolved = solvedChallengeIds.has(challenge.id)
                  const error = submitError[challenge.id]
                  const success = submitSuccess[challenge.id]

                  return (
                    <div key={challenge.id} className={`bg-[#141414] border border-[#2A2A2A] rounded-lg p-6 flex flex-col transition-all duration-300 ${isSolved ? 'border-green-500' : ''}`}>
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-2xl font-bold text-[#E4E4E7]">{challenge.title}</h3>
                        {isSolved && (
                          <span className="text-sm font-bold text-[#00FF41]">✓ RESUELTO</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mb-2">
                        <span className="text-sm font-semibold uppercase text-[#888888] bg-[#2A2A2A] px-2 py-0.5 rounded">
                          {challenge.category}
                        </span>
                        <span className="text-lg font-bold text-[#00FF41] font-mono">
                          {challenge.points} pts
                        </span>
                      </div>
                      <div className="mb-4">
                        {renderDifficultyStars(challenge.difficulty)}
                      </div>

                      <p className="text-[#888888] text-sm mb-4 min-h-[40px] flex-grow">{challenge.description}</p>

                      {/* Hints (si existen) */}
                      {challenge.hints && challenge.hints.length > 0 && (
                        <div className="mb-4 text-xs text-[#888888]">
                          <span className="font-bold text-[#E4E4E7]">Hints:</span>
                          <ul className="list-disc list-inside ml-2">
                            {challenge.hints.map((hint, i) => hint && <li key={i}>{hint}</li>)}
                          </ul>
                        </div>
                      )}

                      {/* Formulario de Flag o Mensaje de Fin */}
                      {!isSolved ? (
                        !eventHasStarted ? (
                          // Si no está resuelto Y el evento NO HA COMENZADO
                          <div className="mt-auto text-center p-4">
                            <p className="font-bold text-lg text-[#FFA500]">⏳ EVENTO NO INICIADO</p>
                            <p className="text-xs text-[#888888]">El CTF aún no ha comenzado.</p>
                          </div>
                        ) : eventHasEnded ? (
                          // Si no está resuelto Y el evento HA TERMINADO
                          <div className="mt-auto text-center p-4">
                            <p className="font-bold text-lg text-[#FF4500]">🏁 TIEMPO TERMINADO</p>
                            <p className="text-xs text-[#888888]">El evento ha finalizado.</p>
                          </div>
                        ) : (
                          // Si no está resuelto Y el evento está ACTIVO
                          <form className="mt-auto" onSubmit={(e) => handleFlagSubmit(e, challenge)}>
                            <div className="flex flex-col gap-2">
                              <input
                                type="text"
                                placeholder="CTF{...}"
                                className="w-full h-12 px-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded text-[#E4E4E7] font-mono focus:outline-none focus:border-[#00FF41]"
                                value={flagInputs[challenge.id] || ''}
                                onChange={(e) => setFlagInputs(prev => ({ ...prev, [challenge.id]: e.target.value }))}
                                disabled={isSubmitting === challenge.id}
                              />
                              <button
                                type="submit"
                                className="w-full h-12 bg-[#00FF41] text-[#0A0A0A] font-bold text-base tracking-wider uppercase rounded transition-all duration-200 ease-out hover:bg-[#00D136] disabled:opacity-50"
                                disabled={isSubmitting === challenge.id || !flagInputs[challenge.id]}
                              >
                                {isSubmitting === challenge.id ? 'ENVIANDO...' : 'ENVIAR FLAG'}
                              </button>
                            </div>
                            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                            {success && <p className="text-green-500 text-sm mt-2">¡Correcto!</p>}
                          </form>
                        )
                      ) : null} {/* Si isSolved es true, no mostrar nada aquí (el badge ya está arriba) */}
                    </div>
                  )
                }) : (
                  <p className="text-[#888888] md:col-span-3">No hay desafíos disponibles por el momento. ¡Vuelve pronto!</p>
                )}
              </div>
            </div>
          </>
        ) : (
          // --- VISTA: SI NO TIENE EQUIPO ---
          <>
            {(eventIsActive || eventHasEnded) && (
              <div className="text-center bg-[#141414] border border-[#2A2A2A] rounded-lg p-8 mb-8">
                <h2 className="text-2xl text-[#FF4500] mb-4">La Creación de Equipos está Cerrada</h2>
                <p className="text-[#888888]">El período para crear o unirse a equipos ha finalizado.</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-8">
                <h2 className="text-2xl text-[#00FF41] mb-6">Crear un Equipo</h2>
                <form onSubmit={handleCreateTeam}>
                  <div className="form-group mb-4">
                    <label className="block mb-2 text-sm text-[#888888] tracking-wide" htmlFor="teamName">Nombre del Equipo</label>
                    <input
                      className="w-full h-14 px-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded text-[#E4E4E7] focus:outline-none focus:border-[#00FF41] focus:ring-1 focus:ring-[#00FF41]"
                      type="text" id="teamName" value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)} required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full h-14 bg-[#00FF41] text-[#0A0A0A] font-bold text-base tracking-wider uppercase rounded transition-all duration-200 ease-out hover:bg-[#00D136] hover:-translate-y-0.5 disabled:opacity-50"
                    disabled={isCreatingTeam || !newTeamName.trim() || eventIsActive || eventHasEnded}
                  >
                    {isCreatingTeam ? 'CREANDO...' : 'CREAR EQUIPO'}
                  </button>
                </form>
              </div>

              <div className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-8">
                <h2 className="text-2xl text-[#00FF41] mb-6">Unirse a un Equipo</h2>
                <div className="max-h-80 overflow-y-auto space-y-3 pr-2">
                  {availableTeams.length > 0 ? availableTeams.map(team => (
                    <div key={team.id} className="flex justify-between items-center bg-[#1A1A1A] p-4 rounded-md">
                      <span className="text-lg text-[#E4E4E7]">{team.name}</span>
                      <button
                        onClick={() => handleJoinTeam(team.id)}
                        className="bg-[#2A2A2A] text-[#E4E4E7] border border-[#2A2A2A] h-10 px-6 rounded font-semibold uppercase tracking-wider text-xs transition-all duration-200 hover:bg-[#3A3A3A] disabled:opacity-50"
                        disabled={isJoiningTeam === team.id || eventIsActive || eventHasEnded}
                      >
                        {isJoiningTeam === team.id ? 'UNIENDO...' : 'UNIRSE'}
                      </button>
                    </div>
                  )) : (
                    <p className="text-[#888888]">No hay equipos disponibles. ¡Crea el primero!</p>
                  )}
                </div>
              </div>

              {teamError && (
                <div className="md:col-span-2 bg-red-900 border border-red-500 text-red-100 px-4 py-3 rounded-md">
                  <p>{teamError}</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

    </div>
  )
}
