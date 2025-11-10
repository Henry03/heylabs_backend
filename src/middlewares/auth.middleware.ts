import { Request, Response, NextFunction } from "express";
import { errorResponse, response } from "../utils/response";
import jwt from "jsonwebtoken";
import logger from "../utils/logger";
import prisma from "../utils/prisma";
import bcrypt from "bcrypt";
import { JwtPayload } from "../interfaces/auth.interface";
import { formatCurrency } from "../utils/numberFormatting";

export const jwtAuth = (roles: string[] = []) => {
    return (req: Request, res: Response, next: NextFunction) => {

        const authHeader = req.headers.authorization;
    
        if(!authHeader || !authHeader.startsWith("Bearer ")){
            return errorResponse(res, 401, "Missing or invalid token")
        }
    
        const token = authHeader.split(" ")[1];
    
        try {
            const JWT_SECRET = process.env.JWT_SECRET;
            if(!JWT_SECRET){
                logger.error("JWT Secret null")
                return errorResponse(res, 500, "Internal Server Error");
            } 
    
            const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
            
            if(roles.length > 0 && !roles.includes(payload.role)){
                return errorResponse(res, 403, "Access Denied")
            }
    
            (req as any).user = payload;
            next();
        } catch (err: any) {
            logger.error(`JWT Validate ${err.message}`)
            return errorResponse(res, 401, "Invalid or expired token");
        }
    }
}

export const apiKeyAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const apiKey = req.query.apiKey as string;
        if (!apiKey) return res.status(401).json({ error: "Missing API key" });
        if (!apiKey) return errorResponse(res, 400, "Missing API key")
        
        const prefix = apiKey.slice(0, 12);
        
        const api = await prisma.apiKey.findUnique({
            where: { prefix },
            include: { user: true },
        });

        if (!api){
            return errorResponse(res, 403, "Invalid API key")
        } 

        const isValid = await bcrypt.compare(apiKey, api.key);
        if(!isValid){
            return errorResponse(res, 403, "Invalid API key");
        }

        if (api.expiresAt && api.expiresAt < new Date())
            return errorResponse(res, 403, "API key expired")
        
        const path = req.baseUrl + req.route.path
        const endpoint = await prisma.apiEndpoint.findUnique({
            where: { path },
        });

        if (!endpoint){
            await prisma.apiUsageLog.create({
                data: {
                    userId: api.userId,
                    apiKeyId: api.id,
                    apiEndpointId: null,
                    cost: 0,
                    errorCode: "404",
                    reason: `${path} endpoint not found`,
                }
            }).catch(() => {});

            return errorResponse(res, 404, "Endpoint not found");
        }
        if (api.user.balance < endpoint.price){
            const log = await prisma.apiUsageLog.create({
                data: {
                    userId: api.userId,
                    apiKeyId: api.id,
                    apiEndpointId: endpoint.id,
                    cost: 0,
                    errorCode: "403",
                    reason: `Insufficient balance. Balance : ${formatCurrency(api.user.balance)}, Endpoint Price : ${formatCurrency(endpoint.price)}`,
                }
            }).catch(() => {});
            return errorResponse(res, 403, "Insufficient balance");
        }

        (req as any).api = api;
        (req as any).endpoint = endpoint;

        const originalSend = res.send.bind(res);

        res.send = ((body?: any) => {
            (async () => {
                const statusCode = res.statusCode;

                if (statusCode === 200) {
                try {
                    await prisma.$transaction([
                        prisma.user.update({
                            where: { id: api.userId },
                            data: { balance: { decrement: endpoint.price } },
                        }),
                        prisma.apiUsageLog.create({
                            data: {
                                userId: api.userId,
                                apiKeyId: api.id,
                                apiEndpointId: endpoint.id,
                                cost: endpoint.price,
                                errorCode: "200",
                                reason: "Request successful"
                            },
                        }),
                    ]);

                    logger.info(
                    `✅ Deducted ${endpoint.price} saldo for user ${api.user.email} after successful response on ${endpoint.path}`
                    );
                } catch (err) {
                    logger.error(`❌ Failed to deduct saldo: ${err}`);
                }
                } else {
                    logger.info(
                        `⚠️ Request for ${endpoint.path} ended with ${statusCode}, no saldo deducted.`
                    );
                }
            })();

            return originalSend(body);
            }) as typeof res.send;
        next();
    } catch (err) {
        logger.error(`API key middleware error: ${err}`);
        return errorResponse(res, 500, "Internal Server Error")
    }
}

export const universalAuth = (roles: string[] = []) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const authHeader = req.headers.authorization;
        const apiKey = req.query.apiKey as string;

        try {
            if (authHeader && authHeader.startsWith("Bearer ")) {
                const token = authHeader.split(" ")[1];
                const JWT_SECRET = process.env.JWT_SECRET;

                if (!JWT_SECRET) {
                    logger.error("JWT Secret null");
                    return errorResponse(res, 500, "Internal Server Error");
                }

                const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;

                if (roles.length > 0 && !roles.includes(payload.role)) {
                    return errorResponse(res, 403, "Access Denied");
                }

                (req as any).user = payload;

                const path = req.baseUrl + req.route.path;
                const endpoint = await prisma.apiEndpoint.findUnique({
                    where: { path },
                });

                if (!endpoint) {
                    await prisma.apiUsageLog.create({
                        data: {
                            userId: payload.id,
                            apiKeyId: null,
                            apiEndpointId: null,
                            cost: 0,
                            errorCode: "404",
                            reason: `${path} endpoint not found`,
                        },
                    });
                    return errorResponse(res, 404, "Endpoint not found");
                }

                const user = await prisma.user.findUnique({
                    where: { id: payload.id }
                });

                if(!user) {
                    return response(res, false, 404, "User not found");
                }

                if (user.balance < endpoint.price) {
                    await prisma.apiUsageLog.create({
                        data: {
                            userId: payload.id,
                            apiKeyId: null,
                            apiEndpointId: endpoint.id,
                            cost: 0,
                            errorCode: "403",
                            reason: `Insufficient balance. Balance : ${formatCurrency(user.balance)}, Endpoint Price : ${formatCurrency(endpoint.price)}`,
                        },
                    });
                    return errorResponse(res, 403, "Insufficient balance");
                }

                (req as any).endpoint = endpoint;
                (req as any).authType = "jwt";

                const originalSend = res.send.bind(res);
                res.send = (body?: any) => {
                    (async () => {
                        const statusCode = res.statusCode;
                        if (statusCode === 200) {
                            try {
                                await prisma.$transaction([
                                prisma.user.update({
                                    where: { id: payload.id },
                                    data: { balance: { decrement: endpoint.price } },
                                }),
                                prisma.apiUsageLog.create({
                                    data: {
                                        userId: payload.id,
                                        apiKeyId: null,
                                        apiEndpointId: endpoint.id,
                                        cost: endpoint.price,
                                        errorCode: "200",
                                        reason: "Request successful",
                                    },
                                }),
                                ]);
                                logger.info(
                                `✅ Deducted ${endpoint.price} saldo for user ${user.email}`
                                );
                            } catch (err) {
                                logger.error(`❌ Failed to deduct saldo: ${err}`);
                            }
                        } else {
                            logger.info(`⚠️ ${endpoint.path} ended with ${statusCode}, no deduction`);
                        }
                    })();
                    return originalSend(body);
                };

                return next();
            }

            if (apiKey) {
                const prefix = apiKey.slice(0, 12);
                const api = await prisma.apiKey.findUnique({
                    where: { prefix },
                    include: { user: true },
                });

                if (!api) return errorResponse(res, 403, "Invalid API key");

                const isValid = await bcrypt.compare(apiKey, api.key);
                if (!isValid) return errorResponse(res, 403, "Invalid API key");

                if (api.expiresAt && api.expiresAt < new Date())
                return errorResponse(res, 403, "API key expired");

                const path = req.baseUrl + req.route.path;
                const endpoint = await prisma.apiEndpoint.findUnique({
                    where: { path },
                });

                if (!endpoint) {
                await prisma.apiUsageLog.create({
                    data: {
                        userId: api.userId,
                        apiKeyId: api.id,
                        apiEndpointId: null,
                        cost: 0,
                        errorCode: "404",
                        reason: `${path} endpoint not found`,
                    },
                });
                return errorResponse(res, 404, "Endpoint not found");
                }

                if (api.user.balance < endpoint.price) {
                await prisma.apiUsageLog.create({
                    data: {
                        userId: api.userId,
                        apiKeyId: api.id,
                        apiEndpointId: endpoint.id,
                        cost: 0,
                        errorCode: "403",
                        reason: `Insufficient balance. Balance : ${formatCurrency(api.user.balance)}, Endpoint Price : ${formatCurrency(endpoint.price)}`,
                    },
                });
                return errorResponse(res, 403, "Insufficient balance");
                }

                (req as any).api = api;
                (req as any).endpoint = endpoint;
                (req as any).authType = "apikey";

                const originalSend = res.send.bind(res);
                res.send = (body?: any) => {
                (async () => {
                    const statusCode = res.statusCode;
                    if (statusCode === 200) {
                    try {
                        await prisma.$transaction([
                        prisma.user.update({
                            where: { id: api.userId },
                            data: { balance: { decrement: endpoint.price } },
                        }),
                        prisma.apiUsageLog.create({
                            data: {
                                userId: api.userId,
                                apiKeyId: api.id,
                                apiEndpointId: endpoint.id,
                                cost: endpoint.price,
                                errorCode: "200",
                                reason: "Request successful",
                            },
                        }),
                        ]);
                        logger.info(
                        `✅ Deducted ${endpoint.price} saldo for user ${api.user.email}`
                        );
                    } catch (err) {
                        logger.error(`❌ Failed to deduct saldo: ${err}`);
                    }
                    } else {
                    logger.info(`⚠️ ${endpoint.path} ended with ${statusCode}, no deduction`);
                    }
                })();
                return originalSend(body);
                };

                return next();
            }

            return errorResponse(res, 401, "Missing JWT token or API key");
        } catch (err: any) {
            logger.error(`Auth middleware error: ${err.message}`);
            return errorResponse(res, 401, "Invalid or expired token / API key");
        }
    };
};
