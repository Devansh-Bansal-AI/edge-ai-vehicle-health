import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default tenant
  const tenant = await prisma.tenant.upsert({
    where: { id: 'default-tenant' },
    update: {},
    create: {
      id: 'default-tenant',
      name: 'Acme Fleet Services',
    },
  });

  console.log(`✅ Tenant verified: ${tenant.name}`);

  // Create default user
  const user = await prisma.user.upsert({
    where: { email: 'admin@edgeai.com' },
    update: {},
    create: {
      email: 'admin@edgeai.com',
      password: 'admin123', // In a real app this would be hashed!
      name: 'Fleet Admin',
      tenantId: tenant.id,
    },
  });

  console.log(`✅ User verified: ${user.email}`);

  // Seed all fleet vehicles
  const FLEET_VEHICLES = [
    { id: 'vehicle-1', name: 'Fleet Unit 1 - Heavy Hauler', vin: 'EDGE-AI-FLT-001' },
    { id: 'vehicle-2', name: 'Fleet Unit 2 - City Runner', vin: 'EDGE-AI-FLT-002' },
    { id: 'vehicle-3', name: 'Fleet Unit 3 - Highway Cruiser', vin: 'EDGE-AI-FLT-003' },
    { id: 'vehicle-4', name: 'Fleet Unit 4 - Off-Road', vin: 'EDGE-AI-FLT-004' },
    { id: 'default-vehicle', name: 'Fleet Unit 7 - Primary', vin: 'EDGE-AI-SIM-001' },
  ];

  let primaryVehicleId = 'default-vehicle';

  for (const v of FLEET_VEHICLES) {
    await prisma.vehicle.upsert({
      where: { vin: v.vin },
      update: { tenantId: tenant.id },
      create: {
        id: v.id,
        name: v.name,
        vin: v.vin,
        tenantId: tenant.id,
      },
    });
  }

  console.log(`✅ ${FLEET_VEHICLES.length} Vehicles verified`);

  // Seed initial maintenance records
  const components = [
    { component: 'Brake Pads', rulDays: 142 },
    { component: 'Engine Oil', rulDays: 28 },
    { component: 'Air Filter', rulDays: 67 },
    { component: 'Timing Belt', rulDays: 312 },
    { component: 'Battery', rulDays: 89 },
    { component: 'Spark Plugs', rulDays: 201 },
    { component: 'Transmission Fluid', rulDays: 45 },
    { component: 'Coolant', rulDays: 14 },
  ];

  for (const comp of components) {
    await prisma.maintenanceRecord.upsert({
      where: {
        id: `seed-${comp.component.toLowerCase().replace(/\s/g, '-')}`,
      },
      update: { rulDays: comp.rulDays },
      create: {
        id: `seed-${comp.component.toLowerCase().replace(/\s/g, '-')}`,
        vehicleId: primaryVehicleId,
        component: comp.component,
        rulDays: comp.rulDays,
      },
    });
  }

  console.log(`✅ Seeded ${components.length} maintenance records`);

  // Seed initial health snapshot
  await prisma.healthSnapshot.create({
    data: {
      vehicleId: primaryVehicleId,
      score: 90,
    },
  });

  console.log('✅ Initial health snapshot created');
  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
