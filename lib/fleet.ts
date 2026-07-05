// ============================================
// Fleet Manager - Multi-Vehicle Engine Instances
// ============================================

import { SimulationEngine, type EngineTickData, type RULComponent } from './engine';

export interface FleetVehicle {
  id: string;
  name: string;
  vin: string;
  engine: SimulationEngine;
  lastTick: EngineTickData | null;
}

export interface FleetOverview {
  vehicles: {
    id: string;
    name: string;
    vin: string;
    healthScore: number;
    criticalComponents: number;
    activeAnomalies: number;
    correlationCount: number;
    nextServiceDays: number;
    status: 'healthy' | 'warning' | 'critical';
  }[];
  fleetHealth: number;
  totalCritical: number;
  totalVehicles: number;
}

const FLEET_VEHICLES = [
  { id: 'vehicle-1', name: 'Fleet Unit 1 - Heavy Hauler', vin: 'EDGE-AI-FLT-001' },
  { id: 'vehicle-2', name: 'Fleet Unit 2 - City Runner', vin: 'EDGE-AI-FLT-002' },
  { id: 'vehicle-3', name: 'Fleet Unit 3 - Highway Cruiser', vin: 'EDGE-AI-FLT-003' },
  { id: 'vehicle-4', name: 'Fleet Unit 4 - Off-Road', vin: 'EDGE-AI-FLT-004' },
  { id: 'default-vehicle', name: 'Fleet Unit 7 - Primary', vin: 'EDGE-AI-SIM-001' },
];

class FleetManager {
  private vehicles: Map<string, FleetVehicle> = new Map();
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (this.initialized) return;

    for (const config of FLEET_VEHICLES) {
      const eng = new SimulationEngine();

      // Simulate different starting conditions by running different tick counts
      const warmupTicks = 20 + Math.floor(Math.random() * 30);
      for (let i = 0; i < warmupTicks; i++) {
        eng.tick();
      }

      // Inject some random anomalies for varied starting health
      if (config.id !== 'default-vehicle') {
        const anomalyCount = Math.floor(Math.random() * 3);
        for (let i = 0; i < anomalyCount; i++) {
          eng.injectAnomaly();
          for (let j = 0; j < 10; j++) eng.tick();
        }
      }

      this.vehicles.set(config.id, {
        id: config.id,
        name: config.name,
        vin: config.vin,
        engine: eng,
        lastTick: null,
      });
    }

    this.initialized = true;
  }

  tickAll(): void {
    for (const vehicle of this.vehicles.values()) {
      if (vehicle.id !== 'default-vehicle') {
        vehicle.lastTick = vehicle.engine.tick();
      }
    }
  }

  getOverview(): FleetOverview {
    // Tick non-default vehicles
    this.tickAll();

    const vehicleData = Array.from(this.vehicles.values()).map(v => {
      const tick = v.lastTick ?? v.engine.tick();
      const criticalComponents = tick.rul.filter((c: RULComponent) => c.urgency === 'critical').length;
      const nextServiceDays = Math.min(...tick.rul.map((c: RULComponent) => c.daysLeft));
      const status: 'healthy' | 'warning' | 'critical' =
        tick.healthScore < 50 || criticalComponents >= 2 ? 'critical' :
        tick.healthScore < 75 || criticalComponents >= 1 ? 'warning' : 'healthy';

      return {
        id: v.id,
        name: v.name,
        vin: v.vin,
        healthScore: tick.healthScore,
        criticalComponents,
        activeAnomalies: tick.anomalies.length,
        correlationCount: tick.correlations.length,
        nextServiceDays: Math.max(0, nextServiceDays),
        status,
      };
    });

    // Sort by health score ascending (most at risk first)
    vehicleData.sort((a, b) => a.healthScore - b.healthScore);

    const fleetHealth = Math.round(
      vehicleData.reduce((sum, v) => sum + v.healthScore, 0) / vehicleData.length
    );

    return {
      vehicles: vehicleData,
      fleetHealth,
      totalCritical: vehicleData.filter(v => v.status === 'critical').length,
      totalVehicles: vehicleData.length,
    };
  }

  getVehicle(id: string): FleetVehicle | undefined {
    return this.vehicles.get(id);
  }
}

// ===== GLOBAL SINGLETON =====
const globalForFleet = globalThis as unknown as { fleetManager: FleetManager };
export const fleetManager = globalForFleet.fleetManager ?? new FleetManager();
if (process.env.NODE_ENV !== 'production') globalForFleet.fleetManager = fleetManager;
