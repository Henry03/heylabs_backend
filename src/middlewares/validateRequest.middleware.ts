import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { errorResponse, response } from '../utils/response';

export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors: Record<string, string[]> = {};

    errors.array().forEach((error) => {
      if (!formattedErrors[error.path]) {
        formattedErrors[error.path] = [];
      }
      formattedErrors[error.path].push(error.msg);
    });

    return errorResponse(res, 422, 'The given data was invalid', formattedErrors);
  }

  next();
};