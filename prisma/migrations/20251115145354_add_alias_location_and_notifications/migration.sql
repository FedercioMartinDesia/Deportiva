-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "alias" TEXT,
ADD COLUMN     "ciudad" TEXT,
ADD COLUMN     "pais" TEXT,
ADD COLUMN     "provincia" TEXT;

-- CreateTable
CREATE TABLE "notificacion_settings" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "notificacionesActivas" BOOLEAN NOT NULL DEFAULT true,
    "usuariosBloqueados" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notificacion_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones_usuarios" (
    "id" TEXT NOT NULL,
    "usuarioReceptorId" TEXT NOT NULL,
    "usuarioEmisorId" TEXT,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificaciones_usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notificacion_settings_usuarioId_key" ON "notificacion_settings"("usuarioId");

-- CreateIndex
CREATE INDEX "notificaciones_usuarios_usuarioReceptorId_idx" ON "notificaciones_usuarios"("usuarioReceptorId");

-- CreateIndex
CREATE INDEX "notificaciones_usuarios_usuarioEmisorId_idx" ON "notificaciones_usuarios"("usuarioEmisorId");

-- AddForeignKey
ALTER TABLE "notificacion_settings" ADD CONSTRAINT "notificacion_settings_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones_usuarios" ADD CONSTRAINT "notificaciones_usuarios_usuarioReceptorId_fkey" FOREIGN KEY ("usuarioReceptorId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones_usuarios" ADD CONSTRAINT "notificaciones_usuarios_usuarioEmisorId_fkey" FOREIGN KEY ("usuarioEmisorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
