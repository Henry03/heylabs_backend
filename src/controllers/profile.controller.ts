import { Request, Response } from "express";
import { errorResponse, response } from "../utils/response";
import prisma from "../utils/prisma";
import logger from "../utils/logger";

export const profile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const userDetail = await prisma.user.findUnique({
      select: {
        name: true,
        email: true,
        balance: true
      },
      where: {
        id: user.id
      },
    })

    return response(res, true, 200, "Get profile successful", userDetail);
  } catch (err: any) {
    logger.error(`Get profile failed: ${err.message}`);

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