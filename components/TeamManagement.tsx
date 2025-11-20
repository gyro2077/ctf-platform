// components/TeamManagement.tsx
'use client'

import { supabase } from '@/lib/supabaseClient'
import { useEffect, useState } from 'react'

type TeamWithMembers = {
    id: string;
    name: string;
    creator_id: string;
    member_count: number;
    members?: TeamMemberDetail[];
}

type TeamMemberDetail = {
    user_id: string;
    full_name: string;
    student_id: string;
    joined_at: string;
}

type UserWithTeam = {
    id: string;
    full_name: string;
    student_id: string;
    department: string;
    team_id: string | null;
    team_name: string | null;
}

export default function TeamManagement() {
    const [activeView, setActiveView] = useState<'teams' | 'users'>('teams')
    const [teams, setTeams] = useState<TeamWithMembers[]>([])
    const [users, setUsers] = useState<UserWithTeam[]>([])
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [newTeamName, setNewTeamName] = useState('')
    const [isCreatingTeam, setIsCreatingTeam] = useState(false)
    const [userFilter, setUserFilter] = useState<'all' | 'with-team' | 'without-team'>('all')

    // Cargar equipos
    const fetchTeams = async () => {
        const { data: teamsData, error: teamsError } = await supabase
            .from('teams')
            .select('id, name, creator_id')
            .order('name')

        if (teamsError) {
            setError('Error al cargar equipos')
            return
        }

        if (teamsData) {
            // Para cada equipo, obtener conteo y miembros
            const teamsWithData = await Promise.all(
                teamsData.map(async (team) => {
                    const { data: membersData } = await supabase
                        .from('team_members')
                        .select(`
              user_id,
              joined_at,
              profiles (
                full_name,
                student_id
              )
            `)
                        .eq('team_id', team.id)

                    const members = membersData?.map(m => ({
                        user_id: m.user_id,
                        full_name: (m.profiles as any)?.full_name || 'N/D',
                        student_id: (m.profiles as any)?.student_id || 'N/D',
                        joined_at: m.joined_at
                    })) || []

                    return {
                        ...team,
                        member_count: members.length,
                        members: selectedTeamId === team.id ? members : undefined
                    }
                })
            )
            setTeams(teamsWithData)
        }
    }

    // Cargar usuarios
    const fetchUsers = async () => {
        const { data: usersData, error: usersError } = await supabase
            .from('profiles')
            .select(`
        id,
        full_name,
        student_id,
        department
      `)
            .order('full_name')

        if (usersError) {
            setError('Error al cargar usuarios')
            return
        }

        if (usersData) {
            // Para cada usuario, obtener su equipo
            const usersWithTeams = await Promise.all(
                usersData.map(async (user) => {
                    const { data: teamMembership } = await supabase
                        .from('team_members')
                        .select(`
              team_id,
              teams (
                name
              )
            `)
                        .eq('user_id', user.id)
                        .single()

                    return {
                        ...user,
                        team_id: teamMembership?.team_id || null,
                        team_name: (teamMembership?.teams as any)?.name || null
                    }
                })
            )
            setUsers(usersWithTeams)
        }
    }

    useEffect(() => {
        const loadData = async () => {
            setLoading(true)
            if (activeView === 'teams') {
                await fetchTeams()
            } else {
                await fetchUsers()
            }
            setLoading(false)
        }
        loadData()
    }, [activeView, selectedTeamId])

    // Crear equipo
    const handleCreateTeam = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newTeamName.trim()) return

        setIsCreatingTeam(true)
        setError(null)

        // Necesitamos un creator_id, usaremos el primer admin que encontremos
        const { data: adminData } = await supabase
            .from('profiles')
            .select('id')
            .eq('is_admin', true)
            .limit(1)
            .single()

        if (!adminData) {
            setError('No se encontró un administrador para crear el equipo')
            setIsCreatingTeam(false)
            return
        }

        const { error: createError } = await supabase
            .from('teams')
            .insert({ name: newTeamName, creator_id: adminData.id })

        if (createError) {
            if (createError.code === '23505') {
                setError('Ya existe un equipo con ese nombre')
            } else {
                setError('Error al crear equipo: ' + createError.message)
            }
        } else {
            setSuccess('Equipo creado exitosamente')
            setNewTeamName('')
            await fetchTeams()
            setTimeout(() => setSuccess(null), 3000)
        }
        setIsCreatingTeam(false)
    }

    // Eliminar equipo
    const handleDeleteTeam = async (teamId: string, teamName: string) => {
        if (!confirm(`¿Estás seguro de eliminar el equipo "${teamName}"? Los miembros permanecerán en el sistema.`)) {
            return
        }

        setError(null)
        // Primero eliminar los miembros del equipo
        const { error: deleteMembersError } = await supabase
            .from('team_members')
            .delete()
            .eq('team_id', teamId)

        if (deleteMembersError) {
            setError('Error al eliminar miembros del equipo')
            return
        }

        // Luego eliminar el equipo
        const { error: deleteTeamError } = await supabase
            .from('teams')
            .delete()
            .eq('id', teamId)

        if (deleteTeamError) {
            setError('Error al eliminar equipo')
        } else {
            setSuccess('Equipo eliminado exitosamente')
            await fetchTeams()
            setTimeout(() => setSuccess(null), 3000)
        }
    }

    // Remover miembro de equipo
    const handleRemoveMember = async (teamId: string, userId: string, userName: string) => {
        if (!confirm(`¿Remover a ${userName} del equipo?`)) return

        setError(null)
        const { error } = await supabase
            .from('team_members')
            .delete()
            .eq('team_id', teamId)
            .eq('user_id', userId)

        if (error) {
            setError('Error al remover miembro')
        } else {
            setSuccess('Miembro removido exitosamente')
            await fetchTeams()
            setTimeout(() => setSuccess(null), 3000)
        }
    }

    // Mover usuario a otro equipo
    const handleMoveUser = async (userId: string, newTeamId: string, userName: string) => {
        if (newTeamId === 'none') return

        // Verificar si el equipo destino tiene espacio
        const { data: currentMembers } = await supabase
            .from('team_members')
            .select('user_id')
            .eq('team_id', newTeamId)

        if (currentMembers && currentMembers.length >= 4) {
            setError('El equipo destino está lleno (máximo 4 miembros)')
            return
        }

        if (!confirm(`¿Mover a ${userName} al equipo seleccionado?`)) return

        setError(null)

        // Eliminar del equipo actual
        const { error: deleteError } = await supabase
            .from('team_members')
            .delete()
            .eq('user_id', userId)

        if (deleteError) {
            setError('Error al mover usuario')
            return
        }

        // Agregar al nuevo equipo
        const { error: insertError } = await supabase
            .from('team_members')
            .insert({ team_id: newTeamId, user_id: userId })

        if (insertError) {
            setError('Error al agregar al nuevo equipo')
        } else {
            setSuccess('Usuario movido exitosamente')
            await fetchTeams()
            setTimeout(() => setSuccess(null), 3000)
        }
    }

    // Asignar usuario a equipo (desde vista de usuarios)
    const handleAssignToTeam = async (userId: string, teamId: string, userName: string) => {
        if (teamId === 'none') return

        // Verificar si el equipo tiene espacio
        const { data: currentMembers } = await supabase
            .from('team_members')
            .select('user_id')
            .eq('team_id', teamId)

        if (currentMembers && currentMembers.length >= 4) {
            setError('El equipo está lleno (máximo 4 miembros)')
            return
        }

        if (!confirm(`¿Asignar a ${userName} al equipo seleccionado?`)) return

        setError(null)
        const { error } = await supabase
            .from('team_members')
            .insert({ team_id: teamId, user_id: userId })

        if (error) {
            setError('Error al asignar equipo')
        } else {
            setSuccess('Usuario asignado exitosamente')
            await fetchUsers()
            setTimeout(() => setSuccess(null), 3000)
        }
    }

    // Filtrar equipos por búsqueda
    const filteredTeams = teams.filter(team =>
        team.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Filtrar usuarios
    const filteredUsers = users.filter(user => {
        const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.student_id.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesFilter =
            userFilter === 'all' ||
            (userFilter === 'with-team' && user.team_id !== null) ||
            (userFilter === 'without-team' && user.team_id === null)
        return matchesSearch && matchesFilter
    })

    return (
        <div className="max-w-6xl mx-auto">
            {/* Tabs */}
            <div className="flex gap-4 mb-6">
                <button
                    onClick={() => { setActiveView('teams'); setSearchTerm('') }}
                    className={`px-6 py-3 rounded-lg font-semibold uppercase tracking-wider ${activeView === 'teams'
                        ? 'bg-[#00FF41] text-[#0A0A0A]'
                        : 'bg-[#141414] text-[#888888] hover:bg-[#1f1f1f]'
                        }`}
                >
                    Equipos
                </button>
                <button
                    onClick={() => { setActiveView('users'); setSearchTerm('') }}
                    className={`px-6 py-3 rounded-lg font-semibold uppercase tracking-wider ${activeView === 'users'
                        ? 'bg-[#00FF41] text-[#0A0A0A]'
                        : 'bg-[#141414] text-[#888888] hover:bg-[#1f1f1f]'
                        }`}
                >
                    Usuarios
                </button>
            </div>

            {/* Messages */}
            {error && (
                <div className="mb-4 p-4 bg-red-900 border border-red-500 text-red-100 rounded-md">
                    {error}
                </div>
            )}
            {success && (
                <div className="mb-4 p-4 bg-green-900 border border-green-500 text-green-100 rounded-md">
                    {success}
                </div>
            )}

            {/* Teams View */}
            {activeView === 'teams' && (
                <div className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl text-[#00FF41]">Gestión de Equipos</h2>
                        <form onSubmit={handleCreateTeam} className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Nombre del equipo..."
                                value={newTeamName}
                                onChange={(e) => setNewTeamName(e.target.value)}
                                className="h-10 px-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded text-[#E4E4E7] focus:outline-none focus:border-[#00FF41]"
                            />
                            <button
                                type="submit"
                                disabled={isCreatingTeam || !newTeamName.trim()}
                                className="px-4 py-2 bg-[#00FF41] text-[#0A0A0A] font-semibold rounded hover:bg-[#00cc33] disabled:opacity-50"
                            >
                                + Crear
                            </button>
                        </form>
                    </div>

                    <input
                        type="text"
                        placeholder="Buscar equipos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-12 px-4 mb-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded text-[#E4E4E7] focus:outline-none focus:border-[#00FF41]"
                    />

                    {loading ? (
                        <p className="text-[#888888]">Cargando...</p>
                    ) : (
                        <div className="space-y-3">
                            {filteredTeams.map(team => (
                                <div key={team.id} className="bg-[#1A1A1A] rounded-lg p-4">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => setSelectedTeamId(selectedTeamId === team.id ? null : team.id)}
                                                className="text-[#00FF41] hover:text-[#00cc33]"
                                            >
                                                {selectedTeamId === team.id ? '▼' : '▶'}
                                            </button>
                                            <span className="text-lg font-semibold text-[#E4E4E7]">{team.name}</span>
                                            <span className="text-sm text-[#888888] font-mono">({team.member_count}/4)</span>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteTeam(team.id, team.name)}
                                            className="px-3 py-1 bg-red-900 text-red-100 rounded text-sm hover:bg-red-800"
                                        >
                                            Eliminar
                                        </button>
                                    </div>

                                    {/* Team Members (expanded) */}
                                    {selectedTeamId === team.id && team.members && (
                                        <div className="mt-4 ml-8 space-y-2">
                                            {team.members.length > 0 ? (
                                                team.members.map(member => (
                                                    <div key={member.user_id} className="flex justify-between items-center bg-[#0A0A0A] p-3 rounded">
                                                        <div>
                                                            <p className="text-[#E4E4E7]">{member.full_name}</p>
                                                            <p className="text-xs text-[#888888]">{member.student_id}</p>
                                                        </div>
                                                        <div className="flex gap-2 items-center">
                                                            <select
                                                                onChange={(e) => handleMoveUser(member.user_id, e.target.value, member.full_name)}
                                                                className="h-8 px-2 bg-[#2A2A2A] border border-[#2A2A2A] rounded text-[#E4E4E7] text-sm"
                                                                defaultValue="none"
                                                            >
                                                                <option value="none">Mover a...</option>
                                                                {teams
                                                                    .filter(t => t.id !== team.id && t.member_count < 4)
                                                                    .map(t => (
                                                                        <option key={t.id} value={t.id}>{t.name} ({t.member_count}/4)</option>
                                                                    ))
                                                                }
                                                            </select>
                                                            <button
                                                                onClick={() => handleRemoveMember(team.id, member.user_id, member.full_name)}
                                                                className="px-2 py-1 bg-red-900 text-red-100 rounded text-xs hover:bg-red-800"
                                                            >
                                                                Remover
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-[#888888] text-sm">No hay miembros en este equipo</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Users View */}
            {activeView === 'users' && (
                <div className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-8">
                    <h2 className="text-2xl text-[#00FF41] mb-6">Gestión de Usuarios</h2>

                    <div className="flex gap-4 mb-4">
                        <input
                            type="text"
                            placeholder="Buscar usuarios..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1 h-12 px-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded text-[#E4E4E7] focus:outline-none focus:border-[#00FF41]"
                        />
                        <select
                            value={userFilter}
                            onChange={(e) => setUserFilter(e.target.value as any)}
                            className="h-12 px-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded text-[#E4E4E7]"
                        >
                            <option value="all">Todos</option>
                            <option value="with-team">Con equipo</option>
                            <option value="without-team">Sin equipo</option>
                        </select>
                    </div>

                    {loading ? (
                        <p className="text-[#888888]">Cargando...</p>
                    ) : (
                        <div className="space-y-2">
                            {filteredUsers.map(user => (
                                <div key={user.id} className="flex justify-between items-center bg-[#1A1A1A] p-4 rounded-md">
                                    <div>
                                        <p className="text-[#E4E4E7] font-semibold">{user.full_name}</p>
                                        <p className="text-sm text-[#888888]">{user.student_id} • {user.department}</p>
                                        {user.team_name && (
                                            <p className="text-xs text-[#00FF41] mt-1">Equipo: {user.team_name}</p>
                                        )}
                                    </div>
                                    {!user.team_id && (
                                        <select
                                            onChange={(e) => handleAssignToTeam(user.id, e.target.value, user.full_name)}
                                            className="h-10 px-3 bg-[#2A2A2A] border border-[#2A2A2A] rounded text-[#E4E4E7]"
                                            defaultValue="none"
                                        >
                                            <option value="none">Asignar a equipo...</option>
                                            {teams
                                                .filter(t => t.member_count < 3)
                                                .map(t => (
                                                    <option key={t.id} value={t.id}>{t.name} ({t.member_count}/3)</option>
                                                ))
                                            }
                                        </select>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
