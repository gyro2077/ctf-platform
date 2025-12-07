'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import LogoutButton from '@/components/LogoutButton'

type Profile = {
    full_name: string;
    national_id: string;
    is_admin: boolean;
}

export default function CertificatesPage() {
    const [pdfUrl, setPdfUrl] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState<string>('')
    const [userCedula, setUserCedula] = useState<string>('')
    const [profile, setProfile] = useState<Profile | null>(null)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user }, error } = await supabase.auth.getUser()

            if (error || !user) {
                router.push('/login')
                return
            }

            // Obtener el perfil completo del usuario desde la tabla profiles
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('national_id, full_name, is_admin')
                .eq('id', user.id)
                .single()

            if (profileError || !profileData) {
                console.error('Error al obtener perfil:', profileError)
                setLoading(false)
                return
            }

            setProfile(profileData)
            setUserName(profileData.full_name || user.email?.split('@')[0] || 'Participante')
            setUserCedula(profileData.national_id || '')

            // Construir la URL usando la cédula
            const cedula = profileData.national_id
            if (cedula) {
                const apiUrl = `https://certificados-automaticos-club-de-software.onrender.com/certificado/${encodeURIComponent(cedula)}`
                setPdfUrl(apiUrl)
            }

            setLoading(false)
        }

        checkUser()
    }, [router, supabase])

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0A0A0A] text-[#E4E4E7] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00FF41]"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-[#E4E4E7] p-8">

            {/* Header con navegación - igual al dashboard */}
            <header className="max-w-6xl mx-auto mb-12 flex justify-between items-center">
                <div className="text-left">
                    <h1 className="text-3xl font-bold text-[#00FF41] tracking-[4px]">
                        MIS CERTIFICADOS
                    </h1>
                    <p className="text-lg text-[#888888] font-light">
                        Visualiza y descarga tu certificado oficial
                    </p>
                </div>

                {/* Navegación */}
                <div className="flex items-center gap-4">
                    <a href="/dashboard" className="text-[#00FF41] hover:underline font-semibold uppercase tracking-wider">
                        Dashboard
                    </a>
                    {profile?.is_admin && (
                        <a href="/admin" className="text-[#00FF41] hover:underline font-semibold uppercase tracking-wider">
                            Admin
                        </a>
                    )}
                    <LogoutButton />
                </div>
            </header>

            {/* Contenido principal */}
            <div className="max-w-6xl mx-auto">

                {/* Sección de información del usuario */}
                <div className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-6 mb-8">
                    <h2 className="text-2xl text-[#00FF41] mb-4">Información del Certificado</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-[#888888]">Participante</p>
                            <p className="text-lg text-[#E4E4E7] font-semibold">{userName}</p>
                        </div>
                        <div>
                            <p className="text-sm text-[#888888]">Cédula</p>
                            <p className="text-lg text-[#E4E4E7] font-mono">{userCedula}</p>
                        </div>
                    </div>
                    <div className="mt-4 p-4 bg-[#1A1A1A] rounded-md border border-[#2A2A2A]">
                        <p className="text-sm text-[#888888]">
                            💡 <span className="text-[#E4E4E7]">Tip:</span> Puedes usar los controles del visor para hacer zoom, descargar o imprimir tu certificado directamente.
                        </p>
                    </div>
                </div>

                {/* Visor de PDF mejorado */}
                <div className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl text-[#00FF41]">Tu Certificado</h2>
                    </div>

                    <div className="w-full h-[600px] md:h-[700px] bg-[#1A1A1A] rounded-lg overflow-hidden border border-[#2A2A2A] relative">
                        {pdfUrl ? (
                            <iframe
                                src={pdfUrl}
                                className="w-full h-full absolute inset-0"
                                title="Visor de Certificado"
                                style={{ border: 'none' }}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <p className="text-[#888888] text-lg mb-2">⚠️ No se encontró certificado</p>
                                    <p className="text-[#888888] text-sm">Verifica que tu cédula esté registrada correctamente</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}
