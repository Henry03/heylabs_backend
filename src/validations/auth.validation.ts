import { body } from 'express-validator';

export const registerValidation = [
    body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Email format not valid'),

    body('name')
        .notEmpty().withMessage('Name is required')
        .isString().withMessage('Name must be a string'),

    body('username')
        .notEmpty().withMessage('Username is required')
        .isString().withMessage('Username must be a string')
        .matches(/^[a-zA-Z0-9_-]+$/).withMessage('Username can only contain letters, numbers, underscores, or dashes, and no spaces'),
    
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),

    body('passwordConfirmation')
        .notEmpty().withMessage('Password confirmation is required')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Passwords do not match');
            }
            return true;
        }),
];

export const verifyOTPValidation = [
    body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Email format not valid'),
    
    body('otp')
        .notEmpty().withMessage('OTP is required')
        .isLength({min: 6, max: 6}).withMessage('OTP must be 6 numbers')
]

export const resendOTPValidation = [
    body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Email format not valid'),
]

export const loginValidation = [
    body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Email not valid'),
    
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];
