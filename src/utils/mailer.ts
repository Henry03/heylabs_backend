import nodemailer from "nodemailer"

export const transporter = nodemailer.createTransport({
    host: "in-v3.mailjet.com",
    port: 2525,
    auth: {
        user: process.env.MAILJET_API_KEY,
        pass: process.env.MAILJET_SECRET_KEY
    }
});

export const sendOTPEmail = async (email:string, otp: string) => {
  await transporter.sendMail({
    from: '"HeyLabs" <no-reply@heylabs.id>',
    to: email,
    subject: "Your HeyLabs OTP Code",
    text: `Your OTP code is ${otp}. It will expire in 5 minutes.`,
  });
};

