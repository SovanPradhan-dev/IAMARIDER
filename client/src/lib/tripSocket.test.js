import { describe, expect, it, vi } from 'vitest';
import { joinTripRoom } from './tripSocket.js';

const createSocket = (connected) => ({
  connected,
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
});

describe('joinTripRoom', () => {
  it('joins immediately when the shared socket is already connected', () => {
    const socket = createSocket(true);
    const onConnected = vi.fn();
    const onJoined = vi.fn();

    const removeListener = joinTripRoom(socket, 'trip-1', { onConnected, onJoined });

    expect(onConnected).toHaveBeenCalledOnce();
    expect(socket.emit).toHaveBeenNthCalledWith(1, 'presence:heartbeat', { tripId: 'trip-1' });
    expect(socket.emit).toHaveBeenNthCalledWith(2, 'trip:join', { tripId: 'trip-1' }, onJoined);
    removeListener();
    expect(socket.off).toHaveBeenCalledWith('connect', expect.any(Function));
  });

  it('joins after a new socket connection', () => {
    const socket = createSocket(false);
    const onJoined = vi.fn();

    joinTripRoom(socket, 'trip-2', { onJoined });

    expect(socket.emit).not.toHaveBeenCalled();
    socket.on.mock.calls[0][1]();
    expect(socket.emit).toHaveBeenCalledWith('trip:join', { tripId: 'trip-2' }, onJoined);
  });
});
