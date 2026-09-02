-- CreateEnum
CREATE TYPE "TipoSancion" AS ENUM ('BANEADO', 'ADVERTIDO', 'OBSERVADO');

-- CreateTable
CREATE TABLE "sanciones" (
    "id" TEXT NOT NULL,
    "propietarioId" TEXT NOT NULL,
    "jugadorId" TEXT NOT NULL,
    "canchaId" TEXT,
    "tipo" "TipoSancion" NOT NULL,
    "motivo" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sanciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sanciones_propietarioId_idx" ON "sanciones"("propietarioId");

-- CreateIndex
CREATE INDEX "sanciones_jugadorId_idx" ON "sanciones"("jugadorId");

-- CreateIndex
CREATE INDEX "sanciones_canchaId_idx" ON "sanciones"("canchaId");

-- CreateIndex
CREATE UNIQUE INDEX "sanciones_propietarioId_jugadorId_canchaId_key" ON "sanciones"("propietarioId", "jugadorId", "canchaId");

-- AddForeignKey
ALTER TABLE "sanciones" ADD CONSTRAINT "sanciones_propietarioId_fkey" FOREIGN KEY ("propietarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sanciones" ADD CONSTRAINT "sanciones_jugadorId_fkey" FOREIGN KEY ("jugadorId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sanciones" ADD CONSTRAINT "sanciones_canchaId_fkey" FOREIGN KEY ("canchaId") REFERENCES "canchas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
