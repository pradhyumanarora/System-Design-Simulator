import { io } from 'socket.io-client';

const serverUrl = import.meta.env.VITE_SERVER_URL || (
  import.meta.env.DEV ? 'http://localhost:3001' : undefined
);

// Static deployments work without collaboration. Set VITE_SERVER_URL in a
// production build to connect the UI to a separately hosted Socket.IO server.
export const socket = io(serverUrl ?? window.location.origin, {
  autoConnect: Boolean(serverUrl),
  transports: ['websocket'],
});

socket.on('connect', () => {
  console.log('[SDS:socket] Connected', { socketId: socket.id });
});

socket.on('disconnect', (reason) => {
  console.log('[SDS:socket] Disconnected', { reason });
});

socket.on('connect_error', (err) => {
  console.log('[SDS:socket] connect_error', { message: err.message });
});

const _emit = socket.emit.bind(socket);
socket.emit = function (event: string, ...args: unknown[]) {
  if (event === 'session:event') {
    const sessionEvent = args[1] as { type?: string } | undefined;
    console.log('[SDS:socket] Emitting session:event', { type: sessionEvent?.type, roomId: args[0] });
  }
  return _emit(event, ...args);
} as typeof socket.emit;

socket.on('session:event', (event: { type?: string }) => {
  console.log('[SDS:socket] Received session:event', { type: event?.type });
});