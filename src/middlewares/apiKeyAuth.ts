import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";
import prisma from "../utils/prisma";

export async function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const apiKeyRaw = req.query.apiKey;
    
    const apiKey =
      typeof apiKeyRaw === "string"
      ? apiKeyRaw
      : Array.isArray(apiKeyRaw)
      ? apiKeyRaw[0]
      : "";
    
    if (!apiKey) return res.status(401).json({ error: "Missing API key" });

    const api = await prisma.apiKey.findUnique({
      where: { key: apiKey as string },
      include: { user: true },
    });

    if (!api) return res.status(403).json({ error: "Invalid API key" });
    if (api.expiresAt && api.expiresAt < new Date())
      return res.status(403).json({ error: "API key expired" });

    const endpoint = await prisma.apiEndpoint.findUnique({
      where: { path: req.route.path },
    });

    if (!endpoint)
      return res.status(404).json({ error: "Endpoint not registered" });

    if (api.user.balance < endpoint.price)
      return res.status(403).json({ error: "Insufficient balance" });

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
                        apiKeyId: api.id,
                        userId: api.userId,
                        apiEndpointId: endpoint.id,
                        cost: endpoint.price,
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
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
