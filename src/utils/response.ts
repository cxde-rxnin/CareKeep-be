export const successResponse = (data: any) => ({ success: true, data });
export const errorResponse = (error: string) => ({ success: false, error });
