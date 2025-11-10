import { Request, Response } from "express";
import { errorResponse, response } from "../utils/response";
import logger from "../utils/logger";
import prisma from "../utils/prisma";
import bcrypt from "bcrypt";
import { generateOTP, verifyOTPUtils } from "../utils/otp";
import { sendOTPEmail } from "../utils/mailer";
import { generateApiKey } from "../utils/apiKey";

export const create = async (req: Request, res: Response) => {
  try {
      const {name, path, price} = req.body;
      const user = (req as any).user;

      const existing = await prisma.apiEndpoint.findFirst({
        where: {
          OR: [
            {name},
            {path}
          ]
        }
      })

      if(existing) {
        const errors: Record<string, string[]> = {};

        if(existing.name == name){
          errors.name = ["Name already exists"];
        }

        if(existing.path == path){
          errors.path = ["Path already exists"];
        }

        return response(res, false, 400, "The given data was invalid", errors);
      }

      const endpoint = await prisma.apiEndpoint.create({
        data: {
          name,
          path,
          price: Number.parseInt(price, 10)
        }
      })

      return response(res, true, 200, "API Endpoint Created");

  } catch (err: any) {
    logger.error(`Create API Key failed: ${err.message}`);
    return errorResponse(res, 500, "Internal server error");
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const {id, name, path, price} = req.body;

    const existing = await prisma.apiEndpoint.findUnique({where: {id}});
    if(!existing){
      return response(res, false, 404, "Endpoint not found");
    }

    const errors: Record<string, string[]> = {};

    if (name) {
      const existingName = await prisma.apiEndpoint.findFirst({
        where: { name, NOT: { id } },
      });
      if (existingName) errors.name = ["Name already exists"];
    }

    if (path) {
      const existingPath = await prisma.apiEndpoint.findFirst({
        where: { path, NOT: { id } },
      });
      if (existingPath) errors.path = ["Path already exists"];
    }

    if (Object.keys(errors).length > 0) {
      return response(res, false, 400, "The given data was invalid", errors);
    }

    const data: Record<string, any> = {};
    if(name) data.name = name;
    if(path) data.path = path;
    if(price !== undefined) data.price = Number.parseInt(price, 10);

    const endpoint = await prisma.apiEndpoint.update({
      where: {id},
      data
    })

    return response(res, true, 200, "API Endpoint Updated");
  } catch (err: any) {
    logger.error(`Update API Key failed: ${err.message}`);
    return errorResponse(res, 500, "Internal server error");
  }
};

export const destroy = async (req: Request, res: Response) => {
  try {
      const {id} = req.body;
      
      const record = await prisma.apiEndpoint.findUnique({
        where: {
          id
        },
      })

      if(!record) {
        return errorResponse(res, 400, "Endpoint not found")
      }

      await prisma.apiEndpoint.delete({
        where: {
          id
        }
      })

      return response(res, true, 200, "Endpoint Deleted");
      
  } catch (err: any) {
    logger.error(`Delete endpoint failed: ${err.message}`);
    return errorResponse(res, 500, "Internal server error");
  }
};

export const detail = async(req: Request, res: Response) => {
  try{
    const {path} = req.body;
    
    const endpoint = await prisma.apiEndpoint.findUnique({
      where: {
        path
      }
    })

    if(!endpoint) {
      const errors = {
        path : "Endpoint path not found"
      }
      return response(res, false, 422, "Failed To Get Endpoint Detail", errors)
    }

    const data = {
      name: endpoint.name,
      path: endpoint.path,
      price: endpoint.price
    }

    return response(res, true, 200, "Get Endpoint Detail Successfully", data)
    
  } catch (err: any) {
    logger.error(`Get endpoint price failed: ${err.message}`);
    return errorResponse(res, 500, "Internal server error");
  }
}

export const list = async(req: Request, res: Response) => {
  try{
    const data = await prisma.apiEndpoint.findMany({
      select: {
        name: true,
        path: true
      }
    })

    return response(res, true, 200, "Get Endpoint List Successfully", data)
  } catch (err: any) {
    logger.error(`Get endpoint list failed: ${err.message}`);
    return errorResponse(res, 500, "Internal server error");
  }
}