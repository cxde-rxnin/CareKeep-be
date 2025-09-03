// Utility to emit activity updates via WebSocket
export const emitActivityUpdate = (type: string, message: string, data?: any) => {
  const io = (global as any).io;
  if (io) {
    io.emit('activity_update', {
      type,
      message,
      at: new Date(),
      data
    });
  }
};
