import { Request, Response } from "express";
import { errorResponse, response } from "../utils/response";
import logger from "../utils/logger";
import prisma from "../utils/prisma";

export const listUser = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      orderBy = "createdAt",
      order = "desc",
    } = req.body;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const validOrderFields = ["name", "email"];
    const validOrder = order === "asc" ? "asc" : "desc";
    const safeOrderBy = validOrderFields.includes(orderBy) ? orderBy : "createdAt";

    const [list, total] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          balance: true,
          verifiedAt: true
        },
        where: {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive",
              }
            },
            {
              email: {
                contains: search,
                mode: "insensitive",
              }
            } 
          ]
        },
        orderBy: {
          [safeOrderBy]: validOrder,
        },
        skip,
        take: limit,
      }),
      prisma.user.count({
        where: {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive",
              }
            },
            {
              email: {
                contains: search,
                mode: "insensitive",
              }
            } 
          ]
        },
      }),
    ]);

    const data = {
      data: list,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total/limit)
      }
    }

    return response(res, true, 200, "Get User List Successfully", data);  
  } catch (err: any) {
    logger.error(`Get user list failed: ${err.message}`);
    return errorResponse(res, 500, "Internal server error");
  }
};