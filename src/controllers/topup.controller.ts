import { Request, Response } from "express";
import { errorResponse, response } from "../utils/response";
import prisma from "../utils/prisma";
import logger from "../utils/logger";

export const topUp = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    let { amount, receiverId, method } = req.body;

    amount = Number(amount);

    const receiver = await prisma.user.findUnique({ where: {id: receiverId }});
    if(!receiver) return response(res, false, 404, "Receiver not found");


    try {
        const topUpLog = await prisma.$transaction(async (tx) => {
          await tx.user.update({
            where: { id: receiver.id },
            data: { balance: { increment: amount } },
          });
    
          // 2. Log top-up
          const log = await tx.topUpLog.create({
            data: {
              senderId: user.id,
              receiverId: receiver.id,
              amount,
              method,
              status: "success",
              processedAt: new Date()
            },
          });
    
          return log;
        });
    
        return response(res, true, 200, "Top-up successful");
    } catch(err: any){
        logger.error(`Top-up transaction failed: ${err.message}`);
        await prisma.topUpLog.create({
            data: {
              senderId: user.id,
              receiverId: receiver.id,
              amount,
              method,
              status: "failed",
              processedAt: new Date()
            },
        });
    }
  } catch (err: any) {
    logger.error(`Top-up failed: ${err.message}`);

    return errorResponse(res, 500, "Internal server error");
  }
};

export const cancel = async (req: Request, res: Response) => {
    try{
        const {id} = req.body;
        const user = (req as any).user;

        const log = await prisma.topUpLog.findUnique({where: {id}});
        if(!log) return response(res, false, 404, "Top-up not found");

        if(log.senderId !== user.id && !user.isAdmin){
            return response(res, false, 403, "Not authorized");
        }

        if(log.status !== "success"){
            return response(res, false, 400, "Top-up process not successfully yet");
        }

        await prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: {id: log.receiverId},
                data: { balance: {decrement: log.amount }}
            });

            await tx.topUpLog.update({
                where: {id},
                data: {status: "canceled"}
            })
        })

        return response(res, true, 200, "Top-up canceled successfully");
    } catch(err: any) {
        logger.error(`Cancel Top-up failed: ${err.message}`);
        return errorResponse(res, 500, "Internal server Error")
    }
}