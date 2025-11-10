import { body } from 'express-validator';

export const createAPIKeyValidation = [
    body('name')
        .notEmpty().withMessage('API Key name is required'),
    body('expireDate')
        .notEmpty().withMessage('Expire date is required')
        .isISO8601().withMessage('Date format not valid')
        .custom((value) => {
            const now = new Date();
            const inputDate = new Date(value);
            if (inputDate < now) {
            throw new Error('Expire date cannot be in the past');
            }
            return true;
        }),
];

export const deleteAPIKeyValidation = [
    body('id')
        .notEmpty().withMessage('API Key id is required')
];