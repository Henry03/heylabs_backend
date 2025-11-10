import { body } from 'express-validator';

export const topupValidation = [
    body('amount')
        .notEmpty().withMessage('Amount is required')
        .isFloat({min:1}).withMessage('Amount must greater than 0'),

    body('method')
        .isIn(['bank_transfer', 'credit_card', 'voucher', 'ewallet', 'qris', 'manual']).withMessage('Invalid top-up method'),

    body('receiverId')
        .notEmpty().withMessage('Receiver id is required')
];

export const cancelTopupValidation = [
    body('id')
        .notEmpty().withMessage('Top up id is required')
];