import { create } from 'zustand';
import type {
  ComponentSpec,
  DataModelDiagram,
  DataModelEntity,
  DataModelRelation,
  DesignNotes,
  DesignState,
  EdgeSpec,
  SessionEvent,
} from '@sds/shared/src/index';
import { addEdge, applyEdgeChanges } from '@xyflow/react';
import type { Connection, EdgeChange, Node, NodeChange } from '@xyflow/react';
import { socket } from '../socket';
import { getHandleIds } from '../components/canvas/handleIdMap';
import type { SystemNode } from '../components/canvas/nodes';
import { createEmptyDesignNotes, normalizeDesignNotes } from '../designNotes';

const ROOM_ID = 'default-room';
const EMPTY_SCHEMA: DataModelDiagram = { entities: [], relations: [] };

type DataModelNode = Node<Record<string, unknown>, 'entity'>;

function emitEvent(type: SessionEvent['type'], payload: unknown) {
  const event: SessionEvent = {
    type,
    payload,
    userId: socket.id ?? 'unknown',
    timestamp: Date.now(),
  };
  socket.emit('session:event', ROOM_ID, event);
}

function normalizeDesign({ components, edges, notes, schema }: DesignState): {
  components: ComponentSpec[];
  edges: EdgeSpec[];
  notes: DesignNotes;
  schema: DataModelDiagram;
} {
  const componentsById = new Map(components.map((component) => [component.id, component]));
  return {
    components,
    edges: edges.map((edge): EdgeSpec => {
      const source = componentsById.get(edge.source);
      const target = componentsById.get(edge.target);
      return {
        ...edge,
        sourceHandle: edge.sourceHandle ?? (source ? getHandleIds(source.kind).out : null),
        targetHandle: edge.targetHandle ?? (target ? getHandleIds(target.kind).in : null),
        type: 'orange',
      };
    }),
    notes: normalizeDesignNotes(notes),
    schema: schema ?? EMPTY_SCHEMA,
  };
}

interface DesignStore {
  components: ComponentSpec[];
  edges: EdgeSpec[];
  notes: DesignNotes;
  schema: DataModelDiagram;
  selectedId: string | null;
  selectedEntityId: string | null;

  addComponent: (component: ComponentSpec, remote?: boolean) => void;
  updateComponent: (id: string, patch: Partial<ComponentSpec>, remote?: boolean) => void;
  removeComponent: (id: string, remote?: boolean) => void;

  onNodesChange: (changes: NodeChange<SystemNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<EdgeSpec>[]) => void;
  onConnect: (connection: Connection, remote?: boolean) => void;

  setSelected: (id: string | null) => void;
  setNotes: (notes: DesignNotes) => void;
  addEntity: (entity: DataModelEntity) => void;
  updateEntity: (id: string, patch: Partial<DataModelEntity>) => void;
  removeEntity: (id: string) => void;
  updateRelation: (id: string, patch: Partial<DataModelRelation>) => void;
  removeRelation: (id: string) => void;
  onSchemaNodesChange: (changes: NodeChange<DataModelNode>[]) => void;
  onSchemaEdgesChange: (changes: EdgeChange<DataModelRelation>[]) => void;
  onSchemaConnect: (connection: Connection) => void;
  setSelectedEntity: (id: string | null) => void;
  setDesign: (design: DesignState) => void;
  clearCanvas: () => void;
}

export const useDesignStore = create<DesignStore>((set, get) => {
  // Subscribe to remote events once at module load (singleton socket).
  socket.on('session:event', (event: SessionEvent) => {
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
      case 'edge:remove':
        set((state) => ({
          edges: state.edges.filter((edge) => edge.id !== event.payload),
        }));
        break;
      default:
        break;
    }
  });

  // Restore room state when joining (server sends current state to new joiner).
  socket.on('room:state', (state: DesignState) => {
    const normalized = normalizeDesign(state);
    set((current) => ({
      ...normalized,
      notes: state.notes ? normalized.notes : current.notes,
      schema: state.schema ? normalized.schema : current.schema,
      selectedId: null,
      selectedEntityId: null,
    }));
  });

  return {
    components: [],
    edges: [],
    notes: createEmptyDesignNotes(),
    schema: EMPTY_SCHEMA,
    selectedId: null,
    selectedEntityId: null,

    addComponent: (component, remote = false) => {
      set((s) => ({ components: [...s.components, component] }));
      if (!remote) emitEvent('component:add', component);
    },

    updateComponent: (id, patch, remote = false) => {
      set((s) => ({
        components: s.components.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      }));
      if (!remote) {
        const updated = get().components.find((c) => c.id === id);
        if (updated) emitEvent('component:update', updated);
      }
    },

    removeComponent: (id, remote = false) => {
      set((s) => ({
        components: s.components.filter((c) => c.id !== id),
        edges: s.edges.filter((e) => e.source !== id && e.target !== id),
      }));
      if (!remote) emitEvent('component:remove', id);
    },

    onNodesChange: (changes) => {
      const removedIds = new Set<string>();
      const positionChanges = new Map<string, ComponentSpec['position']>();
      let selectedId: string | undefined;

      for (const change of changes) {
        if (change.type === 'remove') {
          removedIds.add(change.id);
        } else if (change.type === 'position' && change.position) {
          positionChanges.set(change.id, change.position);
        } else if (change.type === 'select' && change.selected) {
          selectedId = change.id;
        }
      }

      set((state) => ({
        components: state.components
          .filter((component) => !removedIds.has(component.id))
          .map((component) => {
            const position = positionChanges.get(component.id);
            return position ? { ...component, position } : component;
          }),
        edges: removedIds.size
          ? state.edges.filter(
              (edge) => !removedIds.has(edge.source) && !removedIds.has(edge.target)
            )
          : state.edges,
        selectedId: selectedId ?? (
          state.selectedId && removedIds.has(state.selectedId) ? null : state.selectedId
        ),
      }));

      for (const id of removedIds) {
        emitEvent('component:remove', id);
      }

      for (const change of changes) {
        if (change.type === 'position' && change.position && change.dragging === false) {
          const component = get().components.find((item) => item.id === change.id);
          if (component) emitEvent('component:update', component);
        }
      }
    },

    onEdgesChange: (changes) => {
      set((state) => ({
        edges: applyEdgeChanges(changes, state.edges),
      }));
      for (const change of changes) {
        if (change.type === 'remove') emitEvent('edge:remove', change.id);
      }
    },

    onConnect: (connection, remote = false) => {
      if (!connection.source || !connection.target) return;
      if (connection.source === connection.target) return;

      const sourceNode = get().components.find((c) => c.id === connection.source);
      const targetNode = get().components.find((c) => c.id === connection.target);
      if (!sourceNode || !targetNode) return;

      // Use handle IDs from the connection when the user drags from a specific
      // handle, falling back to the canonical out/in pair from handleIdMap.
      const sourceHandles = getHandleIds(sourceNode.kind);
      const targetHandles = getHandleIds(targetNode.kind);
      const sourceHandle = connection.sourceHandle ?? sourceHandles.out;
      const targetHandle = connection.targetHandle ?? targetHandles.in;
      const edgeId = `e-${connection.source}-${sourceHandle}-${connection.target}-${targetHandle}`;

      if (
        get().edges.some(
          (edge) =>
            edge.source === connection.source &&
            edge.target === connection.target &&
            edge.sourceHandle === sourceHandle &&
            edge.targetHandle === targetHandle
        )
      ) {
        return;
      }

      const edge: EdgeSpec = {
        id: edgeId,
        source: connection.source,
        target: connection.target,
        sourceHandle,
        targetHandle,
        type: 'orange',
      };

      set((state) => ({ edges: addEdge(edge, state.edges) }));
      if (!remote) emitEvent('edge:add', edge);
    },

    setSelected: (id) => set({ selectedId: id }),

    setNotes: (notes) => set({ notes }),

    addEntity: (entity) => set((state) => ({
      schema: {
        ...state.schema,
        entities: [...state.schema.entities, entity],
      },
      selectedEntityId: entity.id,
    })),

    updateEntity: (id, patch) => set((state) => ({
      schema: {
        ...state.schema,
        entities: state.schema.entities.map((entity) =>
          entity.id === id ? { ...entity, ...patch } : entity
        ),
      },
    })),

    removeEntity: (id) => set((state) => ({
      schema: {
        entities: state.schema.entities.filter((entity) => entity.id !== id),
        relations: state.schema.relations.filter(
          (relation) => relation.source !== id && relation.target !== id
        ),
      },
      selectedEntityId: state.selectedEntityId === id ? null : state.selectedEntityId,
    })),

    updateRelation: (id, patch) => set((state) => ({
      schema: {
        ...state.schema,
        relations: state.schema.relations.map((relation) =>
          relation.id === id ? { ...relation, ...patch } : relation
        ),
      },
    })),

    removeRelation: (id) => set((state) => ({
      schema: {
        ...state.schema,
        relations: state.schema.relations.filter((relation) => relation.id !== id),
      },
    })),

    onSchemaNodesChange: (changes) => {
      const removedIds = new Set<string>();
      const positions = new Map<string, DataModelEntity['position']>();
      let selectedEntityId: string | undefined;

      for (const change of changes) {
        if (change.type === 'remove') {
          removedIds.add(change.id);
        } else if (change.type === 'position' && change.position) {
          positions.set(change.id, change.position);
        } else if (change.type === 'select' && change.selected) {
          selectedEntityId = change.id;
        }
      }

      set((state) => ({
        schema: {
          entities: state.schema.entities
            .filter((entity) => !removedIds.has(entity.id))
            .map((entity) => {
              const position = positions.get(entity.id);
              return position ? { ...entity, position } : entity;
            }),
          relations: removedIds.size
            ? state.schema.relations.filter(
                (relation) =>
                  !removedIds.has(relation.source) && !removedIds.has(relation.target)
              )
            : state.schema.relations,
        },
        selectedEntityId: selectedEntityId ?? (
          state.selectedEntityId && removedIds.has(state.selectedEntityId)
            ? null
            : state.selectedEntityId
        ),
      }));
    },

    onSchemaEdgesChange: (changes) => set((state) => ({
      schema: {
        ...state.schema,
        relations: applyEdgeChanges(changes, state.schema.relations),
      },
    })),

    onSchemaConnect: (connection) => {
      if (!connection.source || !connection.target || connection.source === connection.target) {
        return;
      }
      if (
        get().schema.relations.some(
          (relation) =>
            relation.source === connection.source && relation.target === connection.target
        )
      ) {
        return;
      }

      const relation: DataModelRelation = {
        id: `schema-${connection.source}-${connection.target}`,
        source: connection.source,
        target: connection.target,
        cardinality: 'one-to-many',
      };
      set((state) => ({
        schema: {
          ...state.schema,
          relations: [...state.schema.relations, relation],
        },
      }));
    },

    setSelectedEntity: (id) => set({ selectedEntityId: id }),

    setDesign: (design) => set({
      ...normalizeDesign(design),
      selectedId: null,
      selectedEntityId: null,
    }),

    clearCanvas: () => set({
      components: [],
      edges: [],
      notes: createEmptyDesignNotes(),
      schema: EMPTY_SCHEMA,
      selectedId: null,
      selectedEntityId: null,
    }),
  };
});
