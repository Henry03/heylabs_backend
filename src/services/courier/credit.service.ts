import prisma from "../../utils/prisma";

export async function addCredit(
    name: string,
    bank: string,
    nominal: number
) {

    return prisma.credit.create({
        data: {
            name,
            bank,
            nominal
        }
    });

}

export async function getCreditList(
    page = 1,
    limit = 10
) {

    const skip =
        (page - 1) * limit;

    return prisma.credit.findMany({

        skip,

        take: limit,

        orderBy: {
            createdAt: "desc"
        }

    });

}

export async function deleteCredit(
    id: number
) {

    const credit =
        await prisma.credit.findUnique({

            where: {
                id
            }

        });

    if (!credit)
        throw new Error("CREDIT_NOT_FOUND");

    await prisma.credit.delete({

        where: {
            id
        }

    });

    return credit;

}