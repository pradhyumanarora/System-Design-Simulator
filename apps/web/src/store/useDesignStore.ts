import { create } from 'zustand';
import type { ComponentSpec, EdgeSpec } from '@sds/shared/src/index';
import { addEdge, applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import type { Connection, NodeChange, EdgeChange } from '@xyflow/react';

interface DesignStore {
  components: ComponentSpec[];
  edges: EdgeSpec[];
  selectedId: string | null;

  addComponent: (component: ComponentSpec) => void;
  updateComponent: (id: string, patch: Partial<ComponentSpec>) => void;
  removeComponent: (id: string) => void;

  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;

  setSelected: (id: string | null) => void;
  clearCanvas: () => void;
}

export const useDesignStore = create<DesignStore>((set, get) => ({
  components: [],
  edges: [],
  selectedId: null,

  addComponent: (component) =>
    set((s) => ({ components: [...s.components, component] })),

  updateComponent: (id, patch) =>
    set((s) => ({
      components: s.components.map((c) =>
        c.id === id ? { ...c, ...patch } : c
      ),
    })),

  removeComponent: (id) =>
    set((s) => ({
      components: s.components.filter((c) => c.id !== id),
      edges: s.edges.filter((e) => e.source !== id && e.target !== id),
    })),

  onNodesChange: (changes) =>
    set((s) => ({
      components: applyNodeChanges(changes, s.components as any) as unknown as ComponentSpec[],
    })),

  onEdgesChange: (changes) =>
    set((s) => ({
      edges: applyEdgeChanges(changes, s.edges as any) as unknown as EdgeSpec[],
    })),

  onConnect: (connection) =>
    set((s) => ({
      edges: addEdge(
        { ...connection, id: `e-${connection.source}-${connection.target}` },
        s.edges as any
      ) as unknown as EdgeSpec[],
    })),

  setSelected: (id) => set({ selectedId: id }),

  clearCanvas: () => set({ components: [], edges: [], selectedId: null }),
}));
