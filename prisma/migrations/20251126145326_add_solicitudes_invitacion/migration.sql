-- CreateEnum
CREATE TYPE "SolicitudEstado" AS ENUM ('PENDIENTE', 'ACEPTADA', 'RECHAZADA');

-- CreateTable
CREATE TABLE "solicitudes_invitacion" (
    "id" TEXT NOT NULL,
    "invitacionId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "estado" "SolicitudEstado" NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solicitudes_invitacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "solicitudes_invitacion_invitacionId_idx" ON "solicitudes_invitacion"("invitacionId");

-- CreateIndex
CREATE INDEX "solicitudes_invitacion_usuarioId_idx" ON "solicitudes_invitacion"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "solicitudes_invitacion_invitacionId_usuarioId_key" ON "solicitudes_invitacion"("invitacionId", "usuarioId");

-- AddForeignKey
ALTER TABLE "solicitudes_invitacion" ADD CONSTRAINT "solicitudes_invitacion_invitacionId_fkey" FOREIGN KEY ("invitacionId") REFERENCES "invitaciones_reserva"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_invitacion" ADD CONSTRAINT "solicitudes_invitacion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
