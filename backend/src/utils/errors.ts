export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational: boolean = true,
    public details?: any,
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const handleError = (error: any) => {
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      message: error.message,
      details: error.details,
    };
  }

  return {
    statusCode: 500,
    message: 'Internal Server Error',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined,
  };
};

export const createError = (statusCode: number, message: string, details?: any): AppError => {
  return new AppError(statusCode, message, true, details);
};
