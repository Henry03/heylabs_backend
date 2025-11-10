import prisma from "./prisma";

export const generateOTP = async (userId : string) => {
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await prisma.userOtp.create({
    data: { userId, otpCode: otp, expiresAt },
  });

  return otp;
};

export const verifyOTPUtils = async (userId : string, otp : string) => {
  const record = await prisma.userOtp.findFirst({
    where: {
      userId,
      otpCode: otp,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!record) return false;

  await prisma.userOtp.delete({ where: { id: record.id } });
  return true;
};
