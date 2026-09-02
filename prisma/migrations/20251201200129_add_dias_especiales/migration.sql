-- CreateTable
CREATE TABLE "dias_especiales" (
    "id" TEXT NOT NULL,
    "canchaId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "tipo" TEXT NOT NULL,
    "horaApertura" TEXT,
    "horaCierre" TEXT,
    "motivo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dias_especiales_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "dias_especiales" ADD CONSTRAINT "dias_especiales_canchaId_fkey" FOREIGN KEY ("canchaId") REFERENCES "canchas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
