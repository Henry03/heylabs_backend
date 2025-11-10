import { Request, Response } from "express";
import { errorResponse, response } from "../utils/response";
import logger from "../utils/logger";
import prisma from "../utils/prisma";
import bcrypt from "bcrypt";
import { generateOTP, verifyOTPUtils } from "../utils/otp";
import { sendOTPEmail } from "../utils/mailer";
import jwt from "jsonwebtoken";

export const register = async (req: Request, res: Response) => {
  try {
      const {email, name, username, password} = req.body;

      const existing = await prisma.user.findFirst({ 
        where: {
          OR: [
            {email},
            {username}
          ]
        }
      })
      if(existing) {
        const errors: Record<string, string[]> = {};

        if(existing.email === email) {
          errors.email = ["Email already registered"];
        }
        if(existing.username === username) {
          errors.username = ["Username already taken"];
        }

        return errorResponse(res, 400, "The given data was invalid", errors)
      }

      const hash = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          email,
          name,
          password: hash,
          username
        }
      })

      const otp = await generateOTP(user.id);
      await sendOTPEmail(email, otp);
    return response(res, true, 200, "User registered successfully. Check your email for OTP.");
  } catch (err: any) {
    logger.error(`Registration failed: ${err.message}`);
    return errorResponse(res, 500, "Registration failed");
  }
};

export const resendOTP = async (req: Request, res: Response) => {
  try{
    const {email} = req.body;

    const user = await prisma.user.findUnique({where: {email}});

    if(!user) return errorResponse(res, 400, "Email not found");
    if(user.verifiedAt) return errorResponse(res, 400, "Email verified")

    const record = await prisma.userOtp.findFirst({
      where: {
        userId: user.id
      },
      orderBy: { createdAt: "desc" },
    });

    if(record) {
      const oneMinute = 60*1000;
      const now = new Date();
      const diff = now.getTime() - record.createdAt.getTime();

      if(diff < oneMinute) {
        const secondsLeft = Math.ceil((oneMinute - diff)/1000);
        return errorResponse(res, 429, `Please wait ${secondsLeft} before requesting a new OTP`)
      }
    }

    const otp = await generateOTP(user.id);
    await sendOTPEmail(email, otp);

    return response(res, true, 200, "OTP resent successfully.");
  }  catch (err: any) {
    logger.error(`Resend OTP failed: ${err.message}`);
    return errorResponse(res, 500, "Resend OTP failed");
  }
}

export const verifyOTP = async (req: Request, res: Response) => {
  try{
    const {email, otp} = req.body;
    const user = await prisma.user.findUnique({where: {email}})

    if(!user) return errorResponse(res, 400, "Email not found");
    if(user.verifiedAt) return errorResponse(res, 400, "Email verified")

    const valid = await verifyOTPUtils(user.id, otp);
    if(!valid) return errorResponse(res, 400, "Invalid or expired OTP"); 

    await prisma.user.update({
      where: {id: user.id},
      data: {verifiedAt: new Date()}
    })

    return response(res, true, 200, "Email verified successfully");
  }  catch (err: any) {
    logger.error(`Verify OTP failed: ${err.message}`);
    return errorResponse(res, 500, "Verification failed");
  }
}

export const login = async (req: Request, res: Response) => {
  try{
    const {email, password} = req.body;

    const user = await prisma.user.findUnique({where: {email}});
    if(!user) return errorResponse(res, 401, "Invalid email or password");
    if(!user.verifiedAt) return errorResponse(res, 403, "Please verify you email first");

    const match = await bcrypt.compare(password, user.password);

    if(!match) return errorResponse(res, 401, "Invalid email or password");

    if(!process.env.JWT_SECRET) {
      return errorResponse(res, 500, "Login failed");
    }

    const token = jwt.sign({ id: user.id, name: user.name, username: user.username, role: user.role}, process.env.JWT_SECRET, { expiresIn: "7d"});

    const data = {
      token
    }

    return response(res, true, 200, "Login successfully", data);

  } catch (err: any) {
    logger.error(`Login failed: ${err.message}`);
    return errorResponse(res, 500, "Login failed");
  }
}