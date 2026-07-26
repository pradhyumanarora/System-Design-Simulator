import { create } from 'zustand';
import type { ComponentSpec, EdgeSpec, SessionEvent } from '@sds/shared/src/index';
import { addEdge, applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import type { Connection, NodeChange, EdgeChange } from '@xyflow/react';
import { socket } from '../socket';
import { getHandleIds } from '../components/canvas/handleIdMap';

const ROOM_ID = 'default-room';

// Map node types to their handle IDs
const HANDLE_IDS: Record<string, { in: string; out: string }> = {
  client: { in: 'client_in', out: 'client_out' },
  'api-gateway': { in: 'gateway_in', out: 'gateway_out' },
  'load-balancer': { in: 'lb_in', out: 'lb_out' },
  'web-server': { in: 'server_in', out: 'server_out' },
  'database-sql': { in: 'sqldb_in', out: 'sqldb_out' },
  'database-nosql': { in: 'nosqldb_in', out: 'nosqldb_out' },
  cache: { in: 'cache_in', out: 'cache_out' },
  'message-queue': { in: 'mq_in', out: 'mq_out' },
  cdn: { in: 'cdn_in', out: 'cdn_out' },
  storage: { in: 'storage_in', out: 'storage_out' },
  dns: { in: 'dns_in', out: 'dns_out' },
};

function emitEvent(type: SessionEvent['type'], payload: unknown) {
  const event: SessionEvent = {
    type,
    payload,
    userId: socket.id ?? 'unknown',
    timestamp: Date.now(),
  };
  socket.emit('session:event', ROOM_ID, event);
}

interface DesignStore {
  components: ComponentSpec[];
  edges: EdgeSpec[];
  selectedId: string | null;

  addComponent: (component: ComponentSpec, remote?: boolean) => void;
  updateComponent: (id: string, patch: Partial<ComponentSpec>, remote?: boolean) => void;
  removeComponent: (id: string, remote?: boolean) => void;

  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection, remote?: boolean) => void;

  setSelected: (id: string | null) => void;
  clearCanvas: () => void;
}

export const useDesignStore = create<DesignStore>((set, get) => {
  // Subscribe to remote events
  socket.on('session:event', (event: SessionEvent) => {
    console.log('[SDS:store] Applying remote event', { type: event.type, userId: event.userId });
    const store = get();
    switch (event.type) {
      case 'component:add':
        store.addComponent(event.payload as ComponentSpec, true);
        break;
      case 'component:update': {
        const comp = event.payload as ComponentSpec;
        store.updateComponent(comp.id, comp, true);
        break;
      }
      case 'component:remove':
        store.removeComponent(event.payload as string, true);
        break;
      case 'edge:add':
        store.onConnect(event.payload as Connection, true);
        break;
      default:
        break;
    }
  });

  // Restore room state when joining (server sends current state to new joiner)
  socket.on('room:state', (state: { components: ComponentSpec[]; edges: EdgeSpec[] }) => {
    console.log('[SDS:store] room:state received', { components: state.components.length, edges: state.edges.length });
    set({ components: state.components, edges: state.edges as any });
  });

  return {
    components: [],
    edges: [],
    selectedId: null,

    addComponent: (component, remote = false) => {
      console.log('[SDS:store] addComponent', { id: component.id, remote });
      set((s) => ({ components: [...s.components, component] }));
      if (!remote) emitEvent('component:add', component);
    },

    updateComponent: (id, patch, remote = false) => {
      console.log('[SDS:store] updateComponent', { id, patch, remote });
      set((s) => ({
        components: s.components.map((c) =>
          c.id === id ? { ...c, ...patch } : c
        ),
      }));
      if (!remote) {
        const updated = get().components.find((c) => c.id === id);
        if (updated) emitEvent('component:update', updated);
      }
    },

    removeComponent: (id, remote = false) => {
      console.log('[SDS:store] removeComponent', { id, remote });
      set((s) => ({
        components: s.components.filter((c) => c.id !== id),
        edges: s.edges.filter((e) => e.source !== id && e.target !== id),
      }));
      if (!remote) emitEvent('component:remove', id);
    },

    onNodesChange: (changes) =>
      set((s) => {
        // applyNodeChanges returns plain Node[] which strips ComponentSpec-specific fields
        // (like `kind`). We must merge the position/selected updates back onto the original
        // ComponentSpec objects to avoid losing `kind` and `config`.
        const updated = applyNodeChanges(changes, s.components as any) as unknown as Array<{ id: string; position?: ComponentSpec['position']; selected?: boolean }>;
        const updatedMap = new Map(updated.map((n) => [n.id, n]));
        return {
          components: s.components
            .filter((c) => updatedMap.has(c.id)) // honour "remove" changes
            .map((c) => {
              const n = updatedMap.get(c.id)!;
              return { ...c, position: n.position ?? c.position };
            }),
        };
      }),

    onEdgesChange: (changes) =>
      set((s) => ({
        edges: applyEdgeChanges(changes, s.edges as any) as unknown as EdgeSpec[],
      })),

    onConnect: (connection, remote = false) => {
      console.log('[SDS:store] onConnect', { connection, remote });
      
      // Validate connection has required fields
      if (!connection.source || !connection.target) {
        console.error('[SDS:store] Invalid connection: missing source or target', connection);
        return;
      }
      
      const edgeId = `e-${connection.source}-${connection.target}`;
      // Check if edge already exists to avoid duplicates
      if (get().edges.find((e) => e.id === edgeId)) {
        console.log('[SDS:store] Edge already exists, skipping', { edgeId });
        return;
      }
      
      // Look up source and target node types to get their handle IDs
      const sourceNode = get().components.find((c) => c.id === connection.source);
      const targetNode = get().components.find((c) => c.id === connection.target);
      
      if (!sourceNode || !targetNode) {
        console.error('[SDS:store] Invalid connection: nodes not found', { sourceNode, targetNode });
        return;
      }
      
      const sourceHandles = HANDLE_IDS[sourceNode.kind];
      const targetHandles = HANDLE_IDS[targetNode.kind];
      
      if (!sourceHandles || !targetHandles) {
        console.error('[SDS:store] Unknown node types', { source: sourceNode.kind, target: targetNode.kind });
        return;
      }
      
      // Create edge with component-specific handle IDs
      const edge = {
        id: edgeId,
        source: connection.source,
        target: connection.target,
        sourceHandle: sourceHandles.out,
        targetHandle: targetHandles.in,
      };
      console.log('[SDS:store] Creating edge:', edge);
      
      set((s) => {
        const updated = addEdge(edge, s.edges as any);
        console.log('[SDS:store] Edges after addEdge:', updated);
        return { edges: updated as unknown as EdgeSpec[] };
      });
      
      if (!remote) emitEvent('edge:add', connection);
    },

    setSelected: (id) => set({ selectedId: id }),

    clearCanvas: () => set({ components: [], edges: [], selectedId: null }),
  };
});
