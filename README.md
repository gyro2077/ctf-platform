# 🎯 PROJECT OVERDRIVE - CTF Platform

Plataforma web para eventos de Capture The Flag (CTF) desarrollada para el Club de Software de la Universidad de las Fuerzas Armadas ESPE.

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Funcionalidades Principales](#-funcionalidades-principales)
- [Validaciones](#-validaciones)
- [Deploy](#-deploy)

## ✨ Características

- 🔐 **Sistema de autenticación completo** con Supabase Auth
- 👥 **Gestión de usuarios** con roles (admin/participante)
- 📊 **Scoreboard en tiempo real** con actualización automática
- 🎫 **Sistema de certificados** automático
- ⏱️ **Timer de evento** con cuenta regresiva
- 🏆 **Gestión de equipos** para competencias
- 📝 **Validaciones específicas** para usuarios de la ESPE
- 🎨 **Diseño tipo terminal/hacker** con temática cyberpunk
- 📱 **Responsive design** adaptado a todos los dispositivos
- 🔒 **Política de privacidad** integrada

## 🛠️ Tecnologías

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Lenguaje**: [TypeScript](https://www.typescriptlang.org/)
- **Estilos**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Backend**: [Supabase](https://supabase.com/) (PostgreSQL + Auth)
- **Gestión de paquetes**: [pnpm](https://pnpm.io/)
- **UI Components**: React 19

## 📦 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** 20.x o superior
- **pnpm** 9.x o superior
- Una cuenta en **Supabase**

## 🚀 Instalación

1. **Clonar el repositorio**

```bash
git clone <url-del-repositorio>
cd ctf-platform
```

2. **Instalar dependencias**

```bash
pnpm install
```

3. **Configurar variables de entorno**

Crea un archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

4. **Ejecutar el servidor de desarrollo**

```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## ⚙️ Configuración

### Configuración de Supabase

Necesitarás configurar las siguientes tablas en tu base de datos de Supabase:

1. **profiles** - Información de usuarios
   - `id` (uuid, primary key)
   - `full_name` (text)
   - `institutional_email` (text, unique)
   - `national_id` (text, unique)
   - `student_id` (text, unique)
   - `department` (text)
   - `career` (text)
   - `phone_number` (text)
   - `is_admin` (boolean)
   - `team_id` (uuid, foreign key)
   - `created_at` (timestamp)

2. **event_settings** - Configuración del evento
   - `id` (integer, primary key)
   - `registrations_open` (boolean)
   - `event_start` (timestamp)
   - `event_end` (timestamp)
   - `event_name` (text)

3. **scoreboard** - Vista para el ranking
   - Vista SQL que muestra los puntajes de los equipos

4. **teams** - Gestión de equipos (si aplica)
   - `id` (uuid, primary key)
   - `name` (text)
   - `score` (integer)
   - `created_at` (timestamp)

### Configuración de Autenticación

En el panel de Supabase, configura:

- **Authentication → Email Templates**: Personaliza los correos de verificación
- **Authentication → URL Configuration**: Añade tu dominio de producción
- **Database → RLS Policies**: Configura las políticas de seguridad

## 💻 Uso

### Scripts Disponibles

```bash
# Desarrollo
pnpm dev          # Inicia el servidor de desarrollo

# Producción
pnpm build        # Construye la aplicación para producción
pnpm start        # Inicia el servidor de producción

# Linting
pnpm lint         # Ejecuta el linter
```

### Roles de Usuario

**Participante:**
- Registrarse con correo institucional (@espe.edu.ec)
- Ver scoreboard en tiempo real
- Acceder a su dashboard
- Descargar certificado de participación
- Unirse a un equipo

**Administrador:**
- Todas las funciones de participante
- Abrir/cerrar registros
- Configurar fechas del evento
- Gestionar equipos
- Acceder al panel de administración

## 📁 Estructura del Proyecto

```
ctf-platform/
├── app/                          # App Router de Next.js
│   ├── admin/                    # Panel de administración
│   ├── dashboard/                # Dashboard de usuario
│   │   └── certificates/         # Visualización de certificados
│   ├── login/                    # Página de inicio de sesión
│   ├── signup/                   # Página de registro
│   ├── forgot-password/          # Recuperación de contraseña
│   ├── reset-password/           # Reseteo de contraseña
│   ├── layout.tsx                # Layout principal
│   ├── page.tsx                  # Página principal (Scoreboard)
│   └── globals.css               # Estilos globales
├── components/                    # Componentes reutilizables
│   ├── DataPrivacyModal.tsx      # Modal de privacidad
│   ├── EventSettings.tsx         # Configuración del evento
│   ├── EventTimer.tsx            # Temporizador del evento
│   ├── HeroSection.tsx           # Sección hero
│   ├── LogoutButton.tsx          # Botón de cerrar sesión
│   └── TeamManagement.tsx        # Gestión de equipos
├── lib/                          # Utilidades y configuración
│   ├── departments.ts            # Departamentos y carreras ESPE
│   ├── supabaseClient.ts         # Cliente de Supabase
│   └── validation.ts             # Funciones de validación
├── public/                       # Archivos estáticos
├── .env.local                    # Variables de entorno (no versionado)
├── next.config.ts                # Configuración de Next.js
├── tailwind.config.ts            # Configuración de Tailwind
├── tsconfig.json                 # Configuración de TypeScript
└── package.json                  # Dependencias del proyecto
```

## 🎯 Funcionalidades Principales

### 1. Sistema de Registro

- Validación de correos institucionales (@espe.edu.ec)
- Validación de cédula ecuatoriana (algoritmo Módulo 10)
- Validación de ID de estudiante (formato L00XXXXXX con 6-8 dígitos)
- Selección de departamento y carrera
- Aceptación obligatoria de política de privacidad

### 2. Dashboard de Usuario

- Vista personalizada con información del usuario
- Acceso rápido al scoreboard
- Navegación a certificados
- Información del equipo

### 3. Panel de Administración

- Control de registros (abrir/cerrar)
- Configuración de fechas del evento
- Gestión de equipos y participantes
- Vista general del evento

### 4. Scoreboard

- Actualización automática cada 60 segundos
- Ranking de equipos por puntaje
- Desempate por tiempo de última entrega
- Diseño tipo terminal hacker

### 5. Sistema de Certificados

- Generación automática vía API externa
- Visualización en línea del PDF
- Descarga directa del certificado
- Basado en cédula del participante

## ✅ Validaciones

El sistema incluye validaciones específicas para la ESPE:

### Correo Institucional
```typescript
// Debe ser del dominio @espe.edu.ec
ejemplo@espe.edu.ec ✓
```

### Cédula Ecuatoriana
```typescript
// Validación con algoritmo Módulo 10
// 10 dígitos, código de provincia válido (01-24)
1234567890 ✓
```

### ID de Estudiante
```typescript
// Formato: L00 + 6-8 dígitos numéricos
L00123456   ✓ (6 dígitos)
L001234567  ✓ (7 dígitos)
L0012345678 ✓ (8 dígitos)
```

### Nombre Completo
```typescript
// Solo letras, espacios y caracteres especiales del español
Juan Pérez García ✓
```

## 🌐 Deploy

### Deploy en Vercel (Recomendado)

1. **Conecta tu repositorio**
   - Ve a [vercel.com/new](https://vercel.com/new)
   - Importa tu repositorio de Git
   - Vercel detectará automáticamente Next.js

2. **Configura las variables de entorno**
   - Añade `NEXT_PUBLIC_SUPABASE_URL`
   - Añade `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Deploy**
   - Click en "Deploy"
   - Tu aplicación estará lista en minutos

### Deploy Manual

```bash
# Construir la aplicación
pnpm build

# Iniciar en producción
pnpm start
```

### Consideraciones de Deploy

- Asegúrate de configurar las variables de entorno en tu plataforma
- Configura los dominios permitidos en Supabase Auth
- Habilita HTTPS en producción
- Configura las políticas CORS si es necesario

## 📝 Notas Adicionales

- El proyecto está optimizado para la Universidad de las Fuerzas Armadas ESPE
- Los certificados se generan mediante una API externa
- El scoreboard se actualiza automáticamente mediante revalidación de Next.js
- Se recomienda usar pnpm como gestor de paquetes

## 🤝 Contribuciones

Para contribuir al proyecto:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## �‍💻 Autor

**Yeshua Chiliquinga** - Desarrollador Principal

Este proyecto fue desarrollado para el Club de Software de la Universidad de las Fuerzas Armadas ESPE.

## 📄 Licencia

Todos los derechos reservados © 2026 Yeshua Chiliquinga

## 📧 Contacto

Para más información sobre el proyecto, contacta al autor o al Club de Software ESPE.

---

Desarrollado con 💚 por Gyro para el Club de Software ESPE
