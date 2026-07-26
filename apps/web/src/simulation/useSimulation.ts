import { useEffect, useRef, useState } from 'react';
import type { MetricsSnapshot } from '@sds/shared/src/index';
import { useDesignStore } from '../store/useDesignStore';

const INTERVAL_MS = 1500;

export function useSimulation(ingressQps: number) {
  const components = useDesignStore((s) => s.components);
  const edges = useDesignStore((s) => s.edges);
  const [metrics, setMetrics] = useState<MetricsSnapshot | null>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('./simulationWorker.ts', import.meta.url),
      { type: 'module' }
    );
    workerRef.current.onmessage = (e: MessageEvent<MetricsSnapshot>) => {
      setMetrics(e.data);
    };
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  useEffect(() => {
    const run = () => {
      workerRef.current?.postMessage({ components, edges, ingressQps });
    };
    run();
    const id = setInterval(run, INTERVAL_MS);
    return () => clearInterval(id);
  }, [components, edges, ingressQps]);

  return metrics;
}