-- CreateTable
CREATE TABLE "seguimientos" (
    "id" TEXT NOT NULL,
    "seguidorId" TEXT NOT NULL,
    "seguidoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seguimientos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "seguimientos_seguidorId_seguidoId_key" ON "seguimientos"("seguidorId", "seguidoId");

-- CreateIndex
CREATE INDEX "seguimientos_seguidorId_idx" ON "seguimientos"("seguidorId");

-- CreateIndex
CREATE INDEX "seguimientos_seguidoId_idx" ON "seguimientos"("seguidoId");

-- AddForeignKey
ALTER TABLE "seguimientos" ADD CONSTRAINT "seguimientos_seguidorId_fkey" FOREIGN KEY ("seguidorId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguimientos" ADD CONSTRAINT "seguimientos_seguidoId_fkey" FOREIGN KEY ("seguidoId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
