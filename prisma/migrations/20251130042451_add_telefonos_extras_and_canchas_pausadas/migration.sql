-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "canchasPausadasPorAdmin" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "telefonosExtras" TEXT;
