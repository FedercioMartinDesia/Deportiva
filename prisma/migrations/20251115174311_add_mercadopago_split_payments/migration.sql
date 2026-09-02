-- CreateEnum
CREATE TYPE "PagoReservaEstado" AS ENUM ('PENDIENTE', 'PAGADO', 'REEMBOLSADO');

-- AlterTable
ALTER TABLE "reservas" ADD COLUMN     "horasLimitePago" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "minimoPorcentajeConfirmacion" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "montoPagadoTotal" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "mpAccessToken" TEXT,
ADD COLUMN     "mpConnected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mpRefreshToken" TEXT,
ADD COLUMN     "mpUserId" TEXT;

-- CreateTable
CREATE TABLE "PagoReserva" (
    "id" TEXT NOT NULL,
    "reservaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "estado" "PagoReservaEstado" NOT NULL DEFAULT 'PENDIENTE',
    "mpPreferenceId" TEXT,
    "mpPaymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PagoReserva_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PagoReserva_reservaId_idx" ON "PagoReserva"("reservaId");

-- CreateIndex
CREATE INDEX "PagoReserva_usuarioId_idx" ON "PagoReserva"("usuarioId");

-- CreateIndex
CREATE INDEX "PagoReserva_mpPaymentId_idx" ON "PagoReserva"("mpPaymentId");

-- AddForeignKey
ALTER TABLE "PagoReserva" ADD CONSTRAINT "PagoReserva_reservaId_fkey" FOREIGN KEY ("reservaId") REFERENCES "reservas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoReserva" ADD CONSTRAINT "PagoReserva_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
