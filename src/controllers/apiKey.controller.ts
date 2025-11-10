import { Request, Response } from "express";
import { errorResponse, response } from "../utils/response";
import logger from "../utils/logger";
import prisma from "../utils/prisma";
import bcrypt from "bcrypt";
import { generateOTP, verifyOTPUtils } from "../utils/otp";
import { sendOTPEmail } from "../utils/mailer";
import { generateApiKey } from "../utils/apiKey";

export const createApiKey = async (req: Request, res: Response) => {
  try {
      const {expireDate, name} = req.body;
      const user = (req as any).user;

      const rawApiKey = generateApiKey();
      const prefix = rawApiKey.slice(0, 12);

      const hash = await bcrypt.hash(rawApiKey, 12)
      const apiKey = await prisma.apiKey.create({
        data: {
          prefix,
          name,
          key: hash,
          userId: user.id,
          expiresAt: new Date(expireDate)
        }
      })

      const data= {
        apiKey: rawApiKey,
        expireDate: apiKey.expiresAt
      }
      return response(res, true, 200, "API Key Created", data);

  } catch (err: any) {
    logger.error(`Create API Key failed: ${err.message}`);
    return errorResponse(res, 500, "Internal server error");
  }
};

export const getApiKey = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
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

    const validOrderFields = ["createdAt", "expiresAt", "name", "prefix"];
    const validOrder = order === "asc" ? "asc" : "desc";
    const safeOrderBy = validOrderFields.includes(orderBy) ? orderBy : "createdAt";

    const [list, total] = await Promise.all([
      prisma.apiKey.findMany({
        select: {
          id: true,
          prefix: true,
          name: true,
          expiresAt: true,
          createdAt: true,
        },
        where: {
          userId: user.id,
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive",
              }
            },
            {
              prefix: {
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
      prisma.apiKey.count({
        where: {
          userId: user.id,
          name: {
            contains: search,
            mode: "insensitive",
          },
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

    return response(res, true, 200, "Get API Keys Successfully", data);
  } catch (err: any) {
    logger.error(`Get API Key failed: ${err.message}`);
    return errorResponse(res, 500, "Internal server error");
  }
}

export const deleteApiKey = async (req: Request, res: Response) => {
  try {
      const {id} = req.body;
      const user = (req as any).user
      
      const apiKeyRecord = await prisma.apiKey.findUnique({
        where: {
          id
        },
      })

      if(!apiKeyRecord) {
        return errorResponse(res, 400, "API Key not found")
      }

      if (apiKeyRecord.userId !== user.id) {
        return errorResponse(res, 403, "You are not authorized to delete this API key");
      }

      await prisma.apiKey.delete({
        where: {
          id
        }
      })

      return response(res, true, 200, "API Key Deleted");
      
  } catch (err: any) {
    logger.error(`Create API Key failed: ${err.message}`);
    return errorResponse(res, 500, "Internal server error");
  }
};

export const apiKeyUsage = async (req: Request, res: Response) => {
  try{
    const user = (req as any).user;
    const now = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(now.getMonth() - 1);
    
    const {
      page = 1,
      limit = "10",
      search = "",
      orderBy = "createdAt",
      order = "desc",
      from = oneMonthAgo,
      to = now
    } = req.body;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const whereClause: any = {
      OR: [
        {apiKey: { userId : user.id }},
        { apiKeyId: null}
      ],
      userId: user.id
    };

    if (search) {
      whereClause.OR = [
        {
          apiEndpoint: {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { path: { contains: search, mode: "insensitive" } },
            ],
          },
        },
        {
          apiKey: {
            name: { contains: search, mode: "insensitive" },
          },
        },
        {
          errorCode: { contains: search, mode: "insensitive" },
        },
        {
          reason: { contains: search, mode: "insensitive" },
        },
      ];
    }
    if (from || to) {
      whereClause.createdAt = {
        gte: from ? new Date(from as string) : undefined,
        lte: to ? new Date(to as string) : undefined,
      };
    }

    let orderByClause: any = { createdAt: "desc" }; // default

    switch (orderBy) {
      case "timestamp":
        orderByClause = { createdAt: order };
        break;
      case "apiKey":
        orderByClause = { apiKey: { name: order } };
        break;
      case "endpoint":
        orderByClause = { apiEndpoint: { path: order } };
        break;
      case "cost":
        orderByClause = { cost: order };
        break;
      case "errorCode":
        orderByClause = { errorCode: order };
        break;
      case "reason":
        orderByClause = { reason: order };
        break;
    }

    const [list, total] = await Promise.all([
      prisma.apiUsageLog.findMany({
        where: whereClause,
        skip,
        take,
        orderBy: orderByClause,
        select: {
          cost: true,
          errorCode: true,
          reason: true,
          createdAt: true,
          apiEndpoint: {
            select: { path: true },
          },
          apiKey: {
            select: { name: true },
          }
        },
      }),
      prisma.apiUsageLog.count({ where: whereClause }),
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

    return response(res, true, 200, "Get API Keys Usage Successfully", data);
  } catch (err: any) {
    logger.error(`Get API Key History failed: ${err.message}`);
    return errorResponse(res, 500, "Internal server error");
  }
}