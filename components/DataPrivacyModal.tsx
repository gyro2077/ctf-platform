// components/DataPrivacyModal.tsx
'use client'

import React from 'react';

// Definimos los 'props' que este componente recibirá
interface ModalProps {
  onAccept: () => void;
  onClose: () => void;
}

export default function DataPrivacyModal({ onAccept, onClose }: ModalProps) {
  // Evita que el modal se cierre al hacer clic dentro del contenido
  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  return (
    // Fondo oscuro semitransparente (overlay)
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm"
      onClick={onClose} // Cierra el modal si se hace clic en el fondo
    >
      {/* Contenedor del Modal */}
      <div
        className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-8 m-4 max-w-lg w-full text-[#E4E4E7]"
        onClick={stopPropagation}
      >
        <h2 className="text-2xl font-bold text-[#00FF41] mb-4">Aviso de Privacidad y Protección de Datos</h2>

        <div className="text-sm text-[#888888] space-y-3 max-h-[60vh] overflow-y-auto pr-2">
          <p className="text-[#E4E4E7]">
            Al registrarte en el evento CTF "Project Overdrive", aceptas que tus datos personales sean recopilados y procesados.
          </p>
          <p>
            Los datos que proporciones (nombre, correo, cédula, ID de estudiante, etc.) serán utilizados <strong>única y exclusivamente para los siguientes fines:</strong>
          </p>
          <ul className="list-disc list-inside ml-4">
            <li>Gestionar tu inscripción y participación en la competencia.</li>
            <li>Crear los rankings y tablas de puntuación.</li>
            <li>Contactarte con información relevante sobre el evento.</li>
            <li>Generar constancias de participación.</li>
          </ul>
          <p>
            Este tratamiento de datos se alinea con la <strong>Ley Orgánica de Protección de Datos Personales del Ecuador</strong> y sigue las buenas prácticas de seguridad de la información, en concordancia con los estándares de la <strong>ISO 27001</strong>.
          </p>
          <p className="text-base text-white font-semibold">
            Tus datos no serán compartidos con terceros con fines comerciales. Una vez finalizado el evento y cumplidos los propósitos de reporte, tus datos personales serán <strong>eliminados de forma segura</strong> de nuestra base de datos.
          </p>
        </div>

        {/* Botones de Acción */}
        <div className="flex gap-4 mt-6">
          <button
            type="button"
            onClick={onAccept}
            className="flex-1 h-12 bg-[#00FF41] text-[#0A0A0A] font-bold uppercase tracking-wider rounded hover:bg-[#00D136]"
          >
            Aceptar y Continuar
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-12 bg-[#2A2A2A] text-[#E4E4E7] font-semibold uppercase rounded hover:bg-[#3A3A3A]"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}