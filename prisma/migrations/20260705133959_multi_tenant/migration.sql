/*
  Warnings:

  - Added the required column `tenantId` to the `Vehicle` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "AnomalyEvent_createdAt_idx";

-- DropIndex
DROP INDEX "AnomalyEvent_sensor_idx";

-- DropIndex
DROP INDEX "AnomalyEvent_severity_idx";

-- DropIndex
DROP INDEX "AnomalyEvent_vehicleId_idx";

-- DropIndex
DROP INDEX "DiagnosticSession_createdAt_idx";

-- DropIndex
DROP INDEX "DiagnosticSession_vehicleId_idx";

-- DropIndex
DROP INDEX "HealthSnapshot_createdAt_idx";

-- DropIndex
DROP INDEX "HealthSnapshot_vehicleId_idx";

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");

-- CreateIndex
CREATE INDEX "AnomalyEvent_vehicleId_createdAt_idx" ON "AnomalyEvent"("vehicleId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AnomalyEvent_vehicleId_sensor_createdAt_idx" ON "AnomalyEvent"("vehicleId", "sensor", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "DiagnosticSession_vehicleId_createdAt_idx" ON "DiagnosticSession"("vehicleId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "HealthSnapshot_vehicleId_createdAt_idx" ON "HealthSnapshot"("vehicleId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Vehicle_tenantId_idx" ON "Vehicle"("tenantId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticSession" ADD CONSTRAINT "DiagnosticSession_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
