import prisma from "../../utils/prisma";

function getMonthRange(
    month: number,
    year: number
) {

    const start =
        new Date(year, month - 1, 1);

    const end =
        new Date(year, month, 1);

    return {
        start,
        end
    };

}

async function getOpeningBalance(
    start: Date
){

    const credits =
        await prisma.credit.aggregate({

            _sum:{
                nominal:true
            },

            where:{
                createdAt:{
                    lt:start
                }
            }

        });

    const orders =
        await prisma.order.aggregate({

            _sum:{
                totalAmount:true
            },

            where:{
                createdAt:{
                    lt:start
                }
            }

        });

    return (
        (credits._sum.nominal ?? 0)
        -
        (orders._sum.totalAmount ?? 0)
    );

}

async function getCreditTotal(
    start:Date,
    end:Date
){

    const result =
        await prisma.credit.aggregate({

            _sum:{
                nominal:true
            },

            where:{

                createdAt:{
                    gte:start,
                    lt:end
                }

            }

        });

    return result._sum.nominal ?? 0;

}

async function getOrderTotal(
    start:Date,
    end:Date
){

    const result =
        await prisma.order.aggregate({

            _sum:{
                totalAmount:true
            },

            where:{

                createdAt:{
                    gte:start,
                    lt:end
                }

            }

        });

    return result._sum.totalAmount ?? 0;

}

async function getOrders(
    start:Date,
    end:Date
){

    return prisma.order.findMany({

        where:{

            createdAt:{

                gte:start,

                lt:end

            }

        },

        include:{
            items:true
        },

        orderBy:{
            createdAt:"asc"
        }

    });

}

async function getCredits(
    start:Date,
    end:Date
){

    return prisma.credit.findMany({

        where:{

            createdAt:{

                gte:start,

                lt:end

            }

        },

        orderBy:{
            createdAt:"asc"
        }

    });

}

export async function generateMonthlyData(

    month:number,

    year:number

){

    const {

        start,

        end

    } = getMonthRange(

        month,

        year

    );

    const openingBalance =
        await getOpeningBalance(start);

    const credits =
        await getCredits(
            start,
            end
        );

    const orders =
        await getOrders(
            start,
            end
        );

    const totalCredit =
        await getCreditTotal(
            start,
            end
        );

    const totalOrder =
        await getOrderTotal(
            start,
            end
        );

    const closingBalance =

        openingBalance

        +

        totalCredit

        -

        totalOrder;

    return{

        month,

        year,

        start,

        end,

        openingBalance,

        totalCredit,

        totalOrder,

        closingBalance,

        credits,

        orders

    };

}