/*
  Warnings:

  - The values [HOCKEY] on the enum `DeporteType` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "InvitacionEstado" AS ENUM ('PENDIENTE', 'ACEPTADA', 'RECHAZADA', 'EXPIRADA');

-- CreateEnum
CREATE TYPE "GeneroInvitacion" AS ENUM ('MASCULINO', 'FEMENINO', 'INDISTINTO');

-- AlterEnum
BEGIN;
CREATE TYPE "DeporteType_new" AS ENUM ('FUTBOL_4', 'FUTBOL_5', 'FUTBOL_6', 'FUTBOL_7', 'FUTBOL_8', 'FUTBOL_9', 'FUTBOL_11', 'PADEL', 'FUTSAL', 'VOLEY', 'TENIS', 'BASQUET', 'OTRO');
ALTER TABLE "canchas" ALTER COLUMN "deporte" TYPE "DeporteType_new" USING ("deporte"::text::"DeporteType_new");
ALTER TYPE "DeporteType" RENAME TO "DeporteType_old";
ALTER TYPE "DeporteType_new" RENAME TO "DeporteType";
DROP TYPE "DeporteType_old";
COMMIT;

-- CreateTable
CREATE TABLE "invitaciones_reserva" (
    "id" TEXT NOT NULL,
    "reservaId" TEXT NOT NULL,
    "invitadorId" TEXT NOT NULL,
    "invitadoId" TEXT,
    "esPublica" BOOLEAN NOT NULL DEFAULT false,
    "generoRequerido" "GeneroInvitacion" NOT NULL DEFAULT 'INDISTINTO',
    "cuposDisponibles" INTEGER NOT NULL DEFAULT 1,
    "cuposOcupados" INTEGER NOT NULL DEFAULT 0,
    "estado" "InvitacionEstado" NOT NULL DEFAULT 'PENDIENTE',
    "mensaje" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invitaciones_reserva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participantes_invitacion" (
    "id" TEXT NOT NULL,
    "invitacionId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "participantes_invitacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "invitaciones_reserva_reservaId_idx" ON "invitaciones_reserva"("reservaId");

-- CreateIndex
CREATE INDEX "invitaciones_reserva_invitadorId_idx" ON "invitaciones_reserva"("invitadorId");

-- CreateIndex
CREATE INDEX "invitaciones_reserva_invitadoId_idx" ON "invitaciones_reserva"("invitadoId");

-- CreateIndex
CREATE INDEX "invitaciones_reserva_esPublica_estado_idx" ON "invitaciones_reserva"("esPublica", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "participantes_invitacion_invitacionId_usuarioId_key" ON "participantes_invitacion"("invitacionId", "usuarioId");

-- AddForeignKey
ALTER TABLE "invitaciones_reserva" ADD CONSTRAINT "invitaciones_reserva_reservaId_fkey" FOREIGN KEY ("reservaId") REFERENCES "reservas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitaciones_reserva" ADD CONSTRAINT "invitaciones_reserva_invitadorId_fkey" FOREIGN KEY ("invitadorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitaciones_reserva" ADD CONSTRAINT "invitaciones_reserva_invitadoId_fkey" FOREIGN KEY ("invitadoId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participantes_invitacion" ADD CONSTRAINT "participantes_invitacion_invitacionId_fkey" FOREIGN KEY ("invitacionId") REFERENCES "invitaciones_reserva"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participantes_invitacion" ADD CONSTRAINT "participantes_invitacion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
