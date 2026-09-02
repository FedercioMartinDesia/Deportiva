-- Migration: Add Profesores y Clases module
-- Date: 2026-03-22
-- Description: Adds professor profiles, class management, sessions, reservations,
--              waiting lists, and class reviews without modifying existing tables structure.

-- =============================================
-- 1. NEW ENUMS
-- =============================================

CREATE TYPE "TipoVinculo" AS ENUM ('STAFF', 'EXTERNO');
CREATE TYPE "EstadoVinculo" AS ENUM ('PENDIENTE', 'ACTIVO', 'RECHAZADO', 'INACTIVO');
CREATE TYPE "MetodoPagoEspacio" AS ENUM ('APP', 'EXTERNO');
CREATE TYPE "TipoClase" AS ENUM ('INDIVIDUAL', 'GRUPAL', 'SUSCRIPCION');
CREATE TYPE "ModalidadPago" AS ENUM ('POR_CLASE', 'MENSUAL', 'PAQUETE');
CREATE TYPE "NivelClase" AS ENUM ('PRINCIPIANTE', 'INTERMEDIO', 'AVANZADO');
CREATE TYPE "EstadoClase" AS ENUM ('BORRADOR', 'PENDIENTE_APROBACION', 'ACTIVA', 'PAUSADA', 'CANCELADA');
CREATE TYPE "EstadoSesion" AS ENUM ('PROGRAMADA', 'EN_CURSO', 'COMPLETADA', 'CANCELADA');
CREATE TYPE "EstadoReservaClase" AS ENUM ('PENDIENTE', 'CONFIRMADA', 'CANCELADA', 'COMPLETADA');
CREATE TYPE "EstadoListaEspera" AS ENUM ('ESPERANDO', 'OFERTADO', 'CONFIRMADO', 'EXPIRADO');

-- =============================================
-- 2. ALTER EXISTING TABLE: usuarios
-- =============================================

ALTER TABLE "usuarios" ADD COLUMN "esProfesor" BOOLEAN NOT NULL DEFAULT false;

-- =============================================
-- 3. NEW TABLES
-- =============================================

-- PerfilProfesor: extensión 1:1 del usuario cuando esProfesor = true
CREATE TABLE "perfiles_profesor" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "deportes" "DeporteType"[],
    "descripcion" VARCHAR(500),
    "anosExperiencia" INTEGER NOT NULL DEFAULT 0,
    "certificaciones" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "niveles" "NivelClase"[],
    "calificacionPromedio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cantidadResenas" INTEGER NOT NULL DEFAULT 0,
    "verificado" BOOLEAN NOT NULL DEFAULT false,
    "verificadoPorId" TEXT,
    "verificadoAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "perfiles_profesor_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "perfiles_profesor_usuarioId_key" ON "perfiles_profesor"("usuarioId");

ALTER TABLE "perfiles_profesor"
    ADD CONSTRAINT "perfiles_profesor_usuarioId_fkey"
    FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- VinculoProfesorEstablecimiento: relación profesor <-> propietario
CREATE TABLE "vinculos_profesor_establecimiento" (
    "id" TEXT NOT NULL,
    "profesorId" TEXT NOT NULL,
    "establecimientoId" TEXT NOT NULL,
    "tipoVinculo" "TipoVinculo" NOT NULL,
    "aprobacionAutomatica" BOOLEAN NOT NULL DEFAULT false,
    "metodoPagoEspacio" "MetodoPagoEspacio" NOT NULL DEFAULT 'EXTERNO',
    "comisionClub" DOUBLE PRECISION,
    "estado" "EstadoVinculo" NOT NULL DEFAULT 'PENDIENTE',
    "motivoRechazo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vinculos_profesor_establecimiento_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "vinculos_profesor_establecimiento_profesorId_establecimientoId_key"
    ON "vinculos_profesor_establecimiento"("profesorId", "establecimientoId");
CREATE INDEX "vinculos_profesor_establecimiento_profesorId_idx"
    ON "vinculos_profesor_establecimiento"("profesorId");
CREATE INDEX "vinculos_profesor_establecimiento_establecimientoId_idx"
    ON "vinculos_profesor_establecimiento"("establecimientoId");

ALTER TABLE "vinculos_profesor_establecimiento"
    ADD CONSTRAINT "vinculos_profesor_establecimiento_profesorId_fkey"
    FOREIGN KEY ("profesorId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "vinculos_profesor_establecimiento"
    ADD CONSTRAINT "vinculos_profesor_establecimiento_establecimientoId_fkey"
    FOREIGN KEY ("establecimientoId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Clase: servicio que ofrece un profesor
CREATE TABLE "clases" (
    "id" TEXT NOT NULL,
    "profesorId" TEXT NOT NULL,
    "canchaId" TEXT,
    "nombre" TEXT NOT NULL,
    "deporte" "DeporteType" NOT NULL,
    "tipoClase" "TipoClase" NOT NULL,
    "modalidadPago" "ModalidadPago" NOT NULL DEFAULT 'POR_CLASE',
    "cantidadClasesPaquete" INTEGER,
    "descripcion" VARCHAR(1000),
    "requisitos" TEXT,
    "nivel" "NivelClase" NOT NULL DEFAULT 'PRINCIPIANTE',
    "precioProfesor" DOUBLE PRECISION NOT NULL,
    "precioEspacio" DOUBLE PRECISION,
    "precioTotal" DOUBLE PRECISION NOT NULL,
    "cupoMaximo" INTEGER,
    "precioDinamicoActivo" BOOLEAN NOT NULL DEFAULT false,
    "precioDinamicoConfig" JSONB,
    "requiereAprobacionClub" BOOLEAN NOT NULL DEFAULT false,
    "estado" "EstadoClase" NOT NULL DEFAULT 'BORRADOR',
    "motivoRechazo" TEXT,
    "horasLimiteCancelacion" INTEGER NOT NULL DEFAULT 24,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clases_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "clases_profesorId_idx" ON "clases"("profesorId");
CREATE INDEX "clases_canchaId_idx" ON "clases"("canchaId");
CREATE INDEX "clases_deporte_idx" ON "clases"("deporte");
CREATE INDEX "clases_estado_idx" ON "clases"("estado");

ALTER TABLE "clases"
    ADD CONSTRAINT "clases_profesorId_fkey"
    FOREIGN KEY ("profesorId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "clases"
    ADD CONSTRAINT "clases_canchaId_fkey"
    FOREIGN KEY ("canchaId") REFERENCES "canchas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- HorarioClase: horarios recurrentes de una clase
CREATE TABLE "horarios_clase" (
    "id" TEXT NOT NULL,
    "claseId" TEXT NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "horarios_clase_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "horarios_clase_claseId_idx" ON "horarios_clase"("claseId");

ALTER TABLE "horarios_clase"
    ADD CONSTRAINT "horarios_clase_claseId_fkey"
    FOREIGN KEY ("claseId") REFERENCES "clases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- SesionClase: instancia concreta de una clase en una fecha/hora
CREATE TABLE "sesiones_clase" (
    "id" TEXT NOT NULL,
    "claseId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT NOT NULL,
    "estado" "EstadoSesion" NOT NULL DEFAULT 'PROGRAMADA',
    "cuposDisponibles" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sesiones_clase_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "sesiones_clase_claseId_idx" ON "sesiones_clase"("claseId");
CREATE INDEX "sesiones_clase_fecha_idx" ON "sesiones_clase"("fecha");
CREATE INDEX "sesiones_clase_estado_idx" ON "sesiones_clase"("estado");

ALTER TABLE "sesiones_clase"
    ADD CONSTRAINT "sesiones_clase_claseId_fkey"
    FOREIGN KEY ("claseId") REFERENCES "clases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ReservaClase: reserva de participante a una sesión
CREATE TABLE "reservas_clase" (
    "id" TEXT NOT NULL,
    "sesionId" TEXT NOT NULL,
    "participanteId" TEXT NOT NULL,
    "estado" "EstadoReservaClase" NOT NULL DEFAULT 'PENDIENTE',
    "montoPagado" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "splitProfesor" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "splitClub" DOUBLE PRECISION,
    "splitApp" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metodoPago" TEXT,
    "mpPreferenceId" TEXT,
    "mpPaymentId" TEXT,
    "pagoLiberado" BOOLEAN NOT NULL DEFAULT false,
    "pagoLiberadoAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservas_clase_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "reservas_clase_sesionId_participanteId_key"
    ON "reservas_clase"("sesionId", "participanteId");
CREATE INDEX "reservas_clase_sesionId_idx" ON "reservas_clase"("sesionId");
CREATE INDEX "reservas_clase_participanteId_idx" ON "reservas_clase"("participanteId");
CREATE INDEX "reservas_clase_mpPaymentId_idx" ON "reservas_clase"("mpPaymentId");

ALTER TABLE "reservas_clase"
    ADD CONSTRAINT "reservas_clase_sesionId_fkey"
    FOREIGN KEY ("sesionId") REFERENCES "sesiones_clase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reservas_clase"
    ADD CONSTRAINT "reservas_clase_participanteId_fkey"
    FOREIGN KEY ("participanteId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ListaEspera: cola para sesiones llenas
CREATE TABLE "lista_espera" (
    "id" TEXT NOT NULL,
    "sesionId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "posicion" INTEGER NOT NULL,
    "notificado" BOOLEAN NOT NULL DEFAULT false,
    "expiraEn" TIMESTAMP(3),
    "estado" "EstadoListaEspera" NOT NULL DEFAULT 'ESPERANDO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lista_espera_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lista_espera_sesionId_usuarioId_key"
    ON "lista_espera"("sesionId", "usuarioId");
CREATE INDEX "lista_espera_sesionId_estado_idx"
    ON "lista_espera"("sesionId", "estado");

ALTER TABLE "lista_espera"
    ADD CONSTRAINT "lista_espera_sesionId_fkey"
    FOREIGN KEY ("sesionId") REFERENCES "sesiones_clase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lista_espera"
    ADD CONSTRAINT "lista_espera_usuarioId_fkey"
    FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ResenaClase: calificación de participante a profesor/clase
CREATE TABLE "resenas_clase" (
    "id" TEXT NOT NULL,
    "reservaClaseId" TEXT NOT NULL,
    "participanteId" TEXT NOT NULL,
    "profesorId" TEXT NOT NULL,
    "calificacion" INTEGER NOT NULL,
    "comentario" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resenas_clase_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "resenas_clase_reservaClaseId_key" ON "resenas_clase"("reservaClaseId");
CREATE UNIQUE INDEX "resenas_clase_reservaClaseId_participanteId_key"
    ON "resenas_clase"("reservaClaseId", "participanteId");
CREATE INDEX "resenas_clase_profesorId_idx" ON "resenas_clase"("profesorId");

ALTER TABLE "resenas_clase"
    ADD CONSTRAINT "resenas_clase_reservaClaseId_fkey"
    FOREIGN KEY ("reservaClaseId") REFERENCES "reservas_clase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "resenas_clase"
    ADD CONSTRAINT "resenas_clase_participanteId_fkey"
    FOREIGN KEY ("participanteId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "resenas_clase"
    ADD CONSTRAINT "resenas_clase_profesorId_fkey"
    FOREIGN KEY ("profesorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
