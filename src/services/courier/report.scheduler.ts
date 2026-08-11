import cron from "node-cron";
import prisma from "../../utils/prisma";

import { buildMonthlyPDF } from "../../utils/reports/monthlyReport";

import {
    sendWhatsappDocument
} from "./waha.service";
import { formatDate, rupiah } from "../../utils/reports/pdfHelper";
import { generateMonthlyData } from "./report.service";

const WA_GROUP =
    "120363423177827833@g.us";

const grupBelanjaOnline = "120363411169151632@g.us";

cron.schedule(
    "5 0 1 * *",

    async () => {

        await sendMonthlyReport();

    }
)

function previousMonth(){

    const now =
        new Date();

    let month =
        now.getMonth();

    let year =
        now.getFullYear();

    if(month==0){

        month=12;

        year--;

    }

    return{

        month,

        year

    };

}

async function alreadySent(

    month:number,

    year:number

){

    return prisma.reportLog.findUnique({

        where:{

            month_year:{

                month,

                year

            }

        }

    });

}

export async function sendMonthlyReport(){

    const{

        month,

        year

    }=previousMonth();

    const exist=

        await alreadySent(

            month,

            year

        );

    if(exist){

        console.log(
            "Monthly report already sent."
        );

        return;
    }

    const pdf=

        await buildMonthlyPDF(

            month,

            year

        );
        const report = await generateMonthlyData(month, year);
        const caption =
`📊 *MONTHLY FINANCIAL REPORT*

📅 ${formatDate(report.start)} - ${formatDate(
    new Date(report.end.getTime() - 1)
)}

💰 Total Uang Masuk
${rupiah(report.totalCredit)}

🛒 Total Belanja
${rupiah(report.totalOrder)}

💵 Sisa Uang
${rupiah(report.closingBalance)}

📎 Laporan PDF terlampir.`;

    await sendWhatsappDocument(
        grupBelanjaOnline,
        pdf,

        `${caption}`

    );

    await prisma.reportLog.create({

        data:{

            month,

            year,

            fileName:

                pdf.split("/").pop()!

        }

    });

    console.log(
        "Monthly report sent."
    );

}