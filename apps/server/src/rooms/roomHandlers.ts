import { Server, Socket } from 'socket.io';
import type { SessionEvent, DesignState } from '@sds/shared/src/index';

// In-memory room state: roomId → DesignState
const roomState = new Map<string, DesignState>();

export function registerRoomHandlers(io: Server, socket: Socket) {
  socket.on('room:join', (roomId: string) => {
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
    socket.to(roomId).emit('session:event', event);
    // Apply to in-memory state
    applyEvent(roomId, event);
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
