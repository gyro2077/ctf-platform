// lib/departments.ts

// Un objeto (diccionario) que mapea departamentos a sus carreras
// Esto nos permite encontrar las carreras de un departamento fácilmente.
export const careersByDepartment: Record<string, string[]> = {
  "Ciencias de la Computación": [
    "Ingeniería de Software",
    "Tecnologías de la Información"
  ],
  "Eléctrica, Electrónica y Telecomunicaciones": [
    "Telecomunicaciones",
    "Electrónica y Automatización"
  ],
  "Ciencias de Energía y Mecánica": [
    "Mecánica",
    "Mecatrónica"
  ],
  "Ciencias de la Vida y de la Agricultura": [
    "Agropecuaria",
    "Biotecnología"
  ],
  "Ciencias Económicas Administrativas y de Comercio": [
    "Administración de Empresas",
    "Comercio Exterior",
    "Contabilidad y Auditoría",
    "Mercadotecnia",
    "Turismo"
  ],
  "Ciencias de la Tierra y de la Construcción": [
    "Ingeniería Civil",
    "Ingeniería Geoespacial"
  ],
  "Ciencias Médicas": [
    "Medicina"
  ],
  "Ciencias Humanas y Sociales": [
    "Pedagogía de la Actividad Física y Deporte",
    "Educación Inicial"
  ],
  "Seguridad y Defensa": [
    "Relaciones Internacionales"
  ],
  "Ciencias Exactas": [
    "Formación Básica (Sin carrera de pregrado)" // Como mencionaste
  ]
};

// Exportamos una lista simple de los nombres de los departamentos
// Object.keys() toma las "llaves" del objeto de arriba.
export const departments = Object.keys(careersByDepartment);