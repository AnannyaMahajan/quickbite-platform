import { getIO } from '../config/socket.js';

export const emitSocketEvent = (eventName, payload, targetRooms = []) => {
  try {
    const io = getIO();
    if (targetRooms.length > 0) {
      targetRooms.forEach(room => {
        io.to(room).emit(eventName, payload);
      });
    } else {
      io.emit(eventName, payload);
    }
  } catch (error) {
    console.error(`Socket Event Emitter Warning: Unable to emit '${eventName}' -`, error.message);
  }
};
