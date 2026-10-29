export const joinTripRoom = (socket, tripId, { onConnected, onJoined }) => {
  const join = () => {
    onConnected?.();
    socket.emit('presence:heartbeat', { tripId });
    socket.emit('trip:join', { tripId }, onJoined);
  };

  socket.on('connect', join);
  if (socket.connected) join();

  return () => socket.off('connect', join);
};
