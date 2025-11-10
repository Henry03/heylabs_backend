import { body } from 'express-validator';

export const createEndpointValidation = [
    body('name')
        .notEmpty().withMessage('Name is required'),

    body('path')
        .notEmpty().withMessage('Path is required'),

    body('price')
        .notEmpty().withMessage('Price is required')
        .isFloat({gt: -1}).withMessage('Price cant lower than 0')
];

export const updateEndpointValidation = [
    body('id')
        .notEmpty().withMessage('Id is required'),

    body('name')
        .notEmpty().withMessage('Name is required'),

    body('path')
        .notEmpty().withMessage('Path is required'),

    body('price')
        .notEmpty().withMessage('Price is required')
        .isFloat({gt: -1}).withMessage('Price cant lower than 0')
];

export const deleteEndpointValidation = [
    body('id')
        .notEmpty().withMessage('Endpoint id is required')
];

export const detailEndpointValidation = [
    body('path')
        .notEmpty().withMessage('Endpoint path is required')
];