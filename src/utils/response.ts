import { Response } from 'express';

export const response = (
  res: Response,
  status: boolean = false,
  statusCode: number = 200,
  message: string,
  data: any = {}
) => {
  return res.status(statusCode).json({
    status,
    message,
    data,
  });
};

export const errorResponse = (
  res: Response,
  statusCode: number = 422,
  message: string,
  errors: any = {}
) => {
  return res.status(statusCode).json({
      status : false,
      message,
      errors,
    });
}
