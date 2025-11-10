import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { loginValidation, registerValidation, resendOTPValidation, verifyOTPValidation } from '../validations/auth.validation';
import { validateRequest } from '../middlewares/validateRequest.middleware';

const router = Router();

router.post('/register', registerValidation, validateRequest, authController.register);
router.post('/resend-otp', resendOTPValidation, validateRequest, authController.resendOTP);
router.post('/verify-otp', verifyOTPValidation, validateRequest, authController.verifyOTP);
router.post('/login', loginValidation, validateRequest, authController.login)

export default router;