-- CreateTable
CREATE TABLE "bloqueos" (
    "id" TEXT NOT NULL,
    "bloqueadorId" TEXT NOT NULL,
    "bloqueadoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bloqueos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bloqueos_bloqueadorId_idx" ON "bloqueos"("bloqueadorId");

-- CreateIndex
CREATE INDEX "bloqueos_bloqueadoId_idx" ON "bloqueos"("bloqueadoId");

-- CreateIndex
CREATE UNIQUE INDEX "bloqueos_bloqueadorId_bloqueadoId_key" ON "bloqueos"("bloqueadorId", "bloqueadoId");

-- AddForeignKey
ALTER TABLE "bloqueos" ADD CONSTRAINT "bloqueos_bloqueadorId_fkey" FOREIGN KEY ("bloqueadorId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloqueos" ADD CONSTRAINT "bloqueos_bloqueadoId_fkey" FOREIGN KEY ("bloqueadoId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
