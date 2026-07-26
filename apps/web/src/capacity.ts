import type { CapacityInputs } from '@sds/shared/src/index';

const SECONDS_PER_DAY = 86_400;

export const DEFAULT_CAPACITY_INPUTS: CapacityInputs = {
  dailyActiveUsers: 1_000_000,
  actionsPerUserPerDay: 10,
  readPercentage: 80,
  peakTrafficMultiplier: 3,
  requestSizeBytes: 1_024,
  responseSizeBytes: 4_096,
  storedRecordSizeBytes: 512,
  retentionDays: 365,
  replicationFactor: 3,
};

export interface CapacityEstimate {
  dailyRequests: number;
  averageQps: number;
  peakQps: number;
  peakReadQps: number;
  peakWriteQps: number;
  ingressBytesPerSecond: number;
  egressBytesPerSecond: number;
  dailyStorageBytes: number;
  retainedStorageBytes: number;
  yearlyReplicatedStorageBytes: number;
}

export function normalizeCapacity(capacity?: CapacityInputs): CapacityInputs {
  return { ...DEFAULT_CAPACITY_INPUTS, ...capacity };
}

export function isDefaultCapacity(capacity: CapacityInputs): boolean {
  return Object.entries(DEFAULT_CAPACITY_INPUTS).every(
    ([key, value]) => capacity[key as keyof CapacityInputs] === value
  );
}

export function calculateCapacity(inputs: CapacityInputs): CapacityEstimate {
  const dailyActiveUsers = Math.max(0, inputs.dailyActiveUsers);
  const actionsPerUser = Math.max(0, inputs.actionsPerUserPerDay);
  const readFraction = Math.min(100, Math.max(0, inputs.readPercentage)) / 100;
  const writeFraction = 1 - readFraction;
  const peakMultiplier = Math.max(1, inputs.peakTrafficMultiplier);
  const dailyRequests = dailyActiveUsers * actionsPerUser;
  const averageQps = dailyRequests / SECONDS_PER_DAY;
  const peakQps = averageQps * peakMultiplier;
  const dailyWrites = dailyRequests * writeFraction;
  const dailyStorageBytes = dailyWrites * Math.max(0, inputs.storedRecordSizeBytes);

  return {
    dailyRequests,
    averageQps,
    peakQps,
    peakReadQps: peakQps * readFraction,
    peakWriteQps: peakQps * writeFraction,
    ingressBytesPerSecond: peakQps * Math.max(0, inputs.requestSizeBytes),
    egressBytesPerSecond: peakQps * Math.max(0, inputs.responseSizeBytes),
    dailyStorageBytes,
    retainedStorageBytes:
      dailyStorageBytes *
      Math.max(0, inputs.retentionDays) *
      Math.max(1, inputs.replicationFactor),
    yearlyReplicatedStorageBytes:
      dailyStorageBytes * 365 * Math.max(1, inputs.replicationFactor),
  };
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatBytes(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const exponent = Math.min(
    Math.floor(Math.log(value) / Math.log(1024)),
    units.length - 1
  );
  return `${(value / 1024 ** exponent).toFixed(exponent > 2 ? 2 : 1)} ${units[exponent]}`;
}
