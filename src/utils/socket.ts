// Utility to emit activity updates via WebSocket
export const emitActivityUpdate = (hospitalId: string, type: string, message: string, data?: any) => {
  const emitToHospital = (global as any).emitActivityToHospital;
  if (emitToHospital && hospitalId) {
    emitToHospital(hospitalId, {
      type,
      message,
      at: new Date(),
      data
    });
  }
};
