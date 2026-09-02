-- CreateTable
CREATE TABLE "comentarios_reserva" (
    "id" TEXT NOT NULL,
    "reservaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comentarios_reserva_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "comentarios_reserva" ADD CONSTRAINT "comentarios_reserva_reservaId_fkey" FOREIGN KEY ("reservaId") REFERENCES "reservas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios_reserva" ADD CONSTRAINT "comentarios_reserva_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
