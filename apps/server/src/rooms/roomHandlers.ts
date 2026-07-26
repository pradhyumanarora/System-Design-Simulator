import { Server, Socket } from 'socket.io';
import type { SessionEvent, DesignState } from '@sds/shared/src/index';

// In-memory room state: roomId → DesignState
const roomState = new Map<string, DesignState>();

export function registerRoomHandlers(io: Server, socket: Socket) {
  console.log('[SDS:server] Client connected', { socketId: socket.id });
  socket.on('room:join', (roomId: string) => {
    console.log('[SDS:server] room:join received', { roomId, socketId: socket.id });
    socket.join(roomId);
    // Send current state to the joining client
    const state = roomState.get(roomId) ?? { components: [], edges: [] };
    socket.emit('room:state', state);
    console.log(`[room] ${socket.id} joined ${roomId}`);
  });

  socket.on('room:leave', (roomId: string) => {
    socket.leave(roomId);
    console.log(`[room] ${socket.id} left ${roomId}`);
  });

  socket.on('session:event', (roomId: string, event: SessionEvent) => {
    // Broadcast to everyone else in the room
    console.log('[SDS:server] session:event received', { roomId, type: event.type, socketId: socket.id });
    socket.to(roomId).emit('session:event', event);
    console.log('[SDS:server] session:event broadcast to room', { roomId, type: event.type });
    // Apply to in-memory state
    applyEvent(roomId, event);
  });

  socket.on('disconnect', (reason: string) => {
    console.log('[SDS:server] Client disconnected', { socketId: socket.id, reason });
  });
}

function applyEvent(roomId: string, event: SessionEvent) {
  const state = roomState.get(roomId) ?? { components: [], edges: [] };

  switch (event.type) {
    case 'component:add':
      state.components.push(event.payload as any);
      break;
    case 'component:update': {
      const updated = event.payload as any;
      const idx = state.components.findIndex((c) => c.id === updated.id);
      if (idx !== -1) state.components[idx] = updated;
      break;
    }
    case 'component:remove': {
      const id = event.payload as string;
      state.components = state.components.filter((c) => c.id !== id);
      state.edges = state.edges.filter((edge) => edge.source !== id && edge.target !== id);
      break;
    }
    case 'edge:add':
      state.edges.push(event.payload as any);
      break;
    case 'edge:remove': {
      const id = event.payload as string;
      state.edges = state.edges.filter((e) => e.id !== id);
      break;
    }
    default:
      break;
  }

  roomState.set(roomId, state);
}
