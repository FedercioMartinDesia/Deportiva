-- AlterEnum
ALTER TYPE "DeporteType" ADD VALUE 'FUTBOL_4' BEFORE 'FUTBOL_5';
ALTER TYPE "DeporteType" ADD VALUE 'FUTBOL_6' AFTER 'FUTBOL_5';
ALTER TYPE "DeporteType" ADD VALUE 'FUTBOL_8' AFTER 'FUTBOL_7';
ALTER TYPE "DeporteType" ADD VALUE 'FUTBOL_9' AFTER 'FUTBOL_8';
ALTER TYPE "DeporteType" ADD VALUE 'FUTSAL' AFTER 'PADEL';

-- Remove HOCKEY value (since it's not in the new list)
-- Note: In PostgreSQL, you cannot remove enum values directly in most versions
-- We'll leave it as is to maintain backward compatibility
