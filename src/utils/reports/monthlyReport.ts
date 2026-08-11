import {
    createPDF,
    drawStatCards,
    drawSummaryBox,
    footer,
    formatDate,
    keyValue,
    line,
    reportHeader,
    rupiah,
    section,
    title
} from "./pdfHelper";

import { drawTable, TableColumn } from "./pdfTable";

import {
    generateMonthlyData
} from "../../services/courier/report.service";

export const creditColumns: TableColumn[] = [

    {
        
        title: "No",
        width: 40,
        align: "center"
    },

    {
        
        title: "Date",
        width: 150,
        align: "center"
    },

    {
        
        title: "Name",
        width: 240
    },

    {
        
        title: "Bank",
        width: 170
    },

    {
        
        title: "Nominal",
        width: 140,
        align: "right"
    }

];

export async function buildMonthlyPDF(
    month: number,
    year: number
) {

    const report =
        await generateMonthlyData(
            month,
            year
        );

    const {
        doc,
        pdfPath
    } = createPDF(
        `report-${year}-${month.toString().padStart(2, "0")}.pdf`
    );

    // ===================================================
    // COVER
    // ===================================================

    reportHeader(
        doc,
        month,
        year
    );

drawSummaryBox(doc, {
    period: `${formatDate(report.start)} - ${formatDate(
        new Date(report.end.getTime() - 1)
    )}`,
    openingBalance: rupiah(report.openingBalance),
    totalCredit: rupiah(report.totalCredit),
    totalOrder: rupiah(report.totalOrder),
    closingBalance: rupiah(report.closingBalance)
});

drawStatCards(
    doc,
    "ORDER SUMMARY",
    [
        {
            title: "Total Orders",
            value: report.orders.length.toString()
        },
        {
            title: "Total Belanja",
            value: rupiah(report.totalOrder)
        }
    ]
);

drawStatCards(
    doc,
    "CREDIT SUMMARY",
    [
        {
            title: "Total Kredit",
            value: report.credits.length.toString()
        },
        {
            title: "Total Uang Masuk",
            value: rupiah(report.totalCredit)
        }
    ]
);

doc.moveDown();


doc.addPage();

    section(
        doc,
        "ORDER DETAIL"
    );

    // ===================================================
    // ORDER TABLE
    // ===================================================

    const rows: any[] = [];

    let no = 1;

    let grandTotal = 0;

    for (const order of report.orders) {

        const subtotalProduct =
            order.items.reduce(
                (sum, item) => {

                    return (
                        sum +
                        (
                            (item.price - item.discount)
                            *
                            item.quantity
                        )
                    );

                },
                0
            );

        for (const item of order.items) {
            
            const unitPrice =
                Math.ceil(

                    (
                        (
                            (item.price - item.discount)
                            *
                            item.quantity
                        )

                        /

                        subtotalProduct

                    )

                    *

                    order.totalAmount

                    /

                    item.quantity

                );

            const subtotal =
                unitPrice *
                item.quantity;

            grandTotal += subtotal;

            rows.push({

                No: no++,

                Date:
                    formatDate(
                        order.createdAt
                    ),

                Store:
                    order.storeName,

                Item:
                    item.variation
                        ? `${item.name}\n(${item.variation})`
                        : item.name,

                Price:
                    rupiah(unitPrice),

                Qty:
                    item.quantity,

                Subtotal:
                    rupiah(subtotal)

            });

        }

    }

    drawTable(

        doc,
        [
        { title:"No", width:35, align:"center" },
        { title:"Date", width:80, align:"center" },
        { title:"Store", width:140 },
        { title:"Item", width:290 },
        { title:"Price", width:80, align:"right" },
        { title:"Qty", width:45, align:"center" },
        { title:"Subtotal", width:110, align:"right" }
    ],

        rows

    );

    doc.moveDown();

    doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .text(

            `TOTAL ORDER : ${rupiah(grandTotal)}`,

            {

                align: "right"

            }

        );

    // ===================================================
    // CREDIT PAGE
    // (Part 3.3)
    // ===================================================

    doc.addPage();

section(
    doc,
    "CREDIT DETAIL"
);

    const creditRows: any[] = [];

    let creditNo = 1;

    let creditTotal = 0;

    for (const credit of report.credits) {

        creditTotal += credit.nominal;

        creditRows.push({

            No: creditNo++,

            Date: formatDate(
                credit.createdAt
            ),

            Name: credit.name,

            Bank: credit.bank,

            Nominal: rupiah(
                credit.nominal
            )

        });

    }

doc.moveDown();

doc

    .font("Helvetica-Bold")

    .fontSize(12)

    .text(

        `TOTAL CREDIT : ${rupiah(creditTotal)}`,

        {

            align: "right"

        }

    );

    if (creditRows.length === 0) {

    doc

        .fontSize(11)

        .font("Helvetica")

        .text("No credit found.");

}
else {

    drawTable(
        doc,
        creditColumns,
        creditRows
    );

    doc.moveDown();

    doc

        .font("Helvetica-Bold")

        .text(

            `TOTAL CREDIT : ${rupiah(creditTotal)}`,

            {

                align: "right"

            }

        );

}

    footer(doc);

    doc.end();

    return pdfPath;

}