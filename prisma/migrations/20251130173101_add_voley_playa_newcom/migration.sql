-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DeporteType" ADD VALUE 'VOLEY_PLAYA';
ALTER TYPE "DeporteType" ADD VALUE 'NEWCOM';

-- AlterTable
ALTER TABLE "canchas" ADD COLUMN     "ayudaMedica" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "camaras" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "colegios" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "cumpleanos" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "escuelita" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "gimnasio" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "gradas" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "torneos" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tribuna" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "wifi" BOOLEAN NOT NULL DEFAULT false;
