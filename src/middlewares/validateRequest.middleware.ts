import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { errorResponse, response } from '../utils/response';

export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors: Record<string, string[]> = {};

    errors.array().forEach((error) => {
      const field = (error as any).path || (error as any).param || 'unknown';

      if (!formattedErrors[field]) {
        formattedErrors[field] = [];
      }
      formattedErrors[field].push(error.msg);
    });

    return errorResponse(res, 422, 'The given data was invalid', formattedErrors);
  }

  next();
};