import { io } from 'socket.io-client';

// Force WebSocket-only transport to avoid CORS preflight errors on the HTTP
// long-polling fallback. WebSocket upgrade bypasses CORS entirely.
export const socket = io('http://localhost:3001', {
  autoConnect: true,
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