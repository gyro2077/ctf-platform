import Link from 'next/link'

export default function HeroSection() {
    return (
        <section className="relative overflow-hidden py-20 sm:py-32 lg:pb-32 xl:pb-36 text-center">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="mx-auto max-w-3xl">
                    <h1 className="text-5xl font-bold text-[#00FF41] tracking-[4px] text-shadow-[0_0_12px_rgba(0,255,65,0.5)] mb-6">
                        PROJECT OVERDRIVE
                    </h1>
                    <p className="text-xl text-[#888888] tracking-[8px] font-light mb-8">
                        CAPTURE THE FLAG EVENT
                    </p>
                    <p className="text-lg text-[#E4E4E7] mb-10 leading-relaxed max-w-2xl mx-auto">
                        Pon a prueba tus habilidades en ciberseguridad. Resuelve retos de <span className="text-[#00FF41]">criptografía</span>, <span className="text-[#00FF41]">forense</span>, <span className="text-[#00FF41]">web</span> y más.
                        <br />
                        ¡Demuestra que eres el mejor en este desafío de hacking ético!
                    </p>
                    <div className="flex justify-center gap-6">
                        <Link
                            href="/signup"
                            className="px-8 py-3 bg-[#00FF41] text-black font-bold rounded hover:bg-[#00cc33] transition-colors duration-200 shadow-[0_0_15px_rgba(0,255,65,0.3)]"
                        >
                            Registrarse
                        </Link>
                        <Link
                            href="/login"
                            className="px-8 py-3 border border-[#00FF41] text-[#00FF41] font-bold rounded hover:bg-[#00FF41] hover:text-black transition-colors duration-200"
                        >
                            Iniciar Sesión
                        </Link>
                    </div>
                </div>
            </div>

            {/* Background decoration (optional, simple grid or glow) */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-20 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#00FF41] rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#00FF41] rounded-full blur-[120px]"></div>
            </div>
        </section>
    )
}
