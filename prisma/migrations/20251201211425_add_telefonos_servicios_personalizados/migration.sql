-- AlterTable
ALTER TABLE "canchas" ADD COLUMN     "serviciosPersonalizados" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "telefonos" TEXT;
