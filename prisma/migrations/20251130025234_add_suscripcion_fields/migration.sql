-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "suscripcionActiva" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "suscripcionFechaFin" TIMESTAMP(3),
ADD COLUMN     "suscripcionFechaInicio" TIMESTAMP(3),
ADD COLUMN     "suscripcionNotas" TEXT;
