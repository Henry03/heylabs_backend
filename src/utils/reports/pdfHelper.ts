import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

export function createPDF(fileName: string) {
    const reportDir = path.resolve(
        process.cwd(),
        "public",
        "generatedReport"
    );

    if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, {
            recursive: true
        });
    }

    const pdfPath = path.join(
        reportDir,
        fileName
    );

    const doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margin: 30,
        bufferPages: true
    });

    doc.pipe(
        fs.createWriteStream(pdfPath)
    );

    return {
        doc,
        pdfPath
    };
}

export function rupiah(
    value:number
){

    return new Intl.NumberFormat(

        "id-ID",

        {

            style:"currency",

            currency:"IDR",

            maximumFractionDigits:0

        }

    ).format(value);

}

export function formatDate(
    date: Date
) {

    return date.toLocaleDateString(

        "id-ID",

        {

            day: "2-digit",

            month: "2-digit",

            year: "numeric"

        }

    );

}

export function line(
    doc: PDFKit.PDFDocument
) {

    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;

    doc
        .moveTo(left, doc.y)
        .lineTo(right, doc.y)
        .stroke();

}

export function title(

    doc: PDFKit.PDFDocument,

    text: string

) {

    doc

        .fontSize(18)

        .font("Helvetica-Bold")

        .text(

            text,

            {

                align: "center"

            }

        );

    doc.moveDown();

}

export function section(
    doc: PDFKit.PDFDocument,
    title: string
) {

    doc.moveDown();

    doc.x = doc.page.margins.left;

    doc
        .font("Helvetica-Bold")
        .fontSize(13)
        .text(
            title,
            {
                width:
                    doc.page.width -
                    doc.page.margins.left -
                    doc.page.margins.right,
                align: "center"
            }
        );

    doc.moveDown(0.5);

}

export function keyValue(

    doc: PDFKit.PDFDocument,

    key: string,

    value: string

) {

    doc

        .font("Helvetica")

        .fontSize(11)

        .text(

            key,

            50,

            doc.y,

            {

                continued: true,

                width: 150

            }

        );

    doc

        .font("Helvetica-Bold")

        .text(value);

}

export function footer(
    doc: PDFKit.PDFDocument
) {

    const pages =
        doc.bufferedPageRange();

    for (let i = 0; i < pages.count; i++) {

        doc.switchToPage(i);

        const y =
            doc.page.height -
            doc.page.margins.bottom -
            15;

        doc
            .font("Helvetica")
            .fontSize(9);

        doc.text(

            `Page ${i + 1} / ${pages.count}`,

            0,

            y,

            {

                width: doc.page.width,

                align: "center",

                lineBreak: false

            }

        );

    }

}

export function reportHeader(
    doc: PDFKit.PDFDocument,
    month: number,
    year: number
) {

    doc
        .font("Helvetica-Bold")
        .fontSize(20)
        .text("HEYLABS", {
            align: "center"
        });

    doc
        .fontSize(14)
        .text(
            "MONTHLY FINANCIAL REPORT",
            {
                align: "center"
            }
        );

    doc.moveDown();

    const date = new Date(year, month - 1);

    doc
        .fontSize(13)
        .font("Helvetica")
        .text(
            date.toLocaleString("en-US", {
                month: "long",
                year: "numeric"
            }),
            {
                align: "center"
            }
        );

    doc.moveDown(2);

}

export function drawSummaryBox(
    doc: PDFKit.PDFDocument,
    data: {
        period: string;
        openingBalance: string;
        totalCredit: string;
        totalOrder: string;
        closingBalance: string;
    }
) {

    const left = doc.page.margins.left;
    const width = doc.page.width - left * 2;

    const labelWidth = 220;
    const valueWidth = width - labelWidth;

    const rowHeight = 34;

    let y = doc.y;

    // ==========================
    // HEADER
    // ==========================

    doc
        .save()
        .rect(left, y, width, rowHeight)
        .fill("#F3F4F6");

    doc.restore();

    doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .fillColor("black")
        .text(
            "SUMMARY",
            left + 12,
            y + 10
        );

    y += rowHeight;

    const rows = [

        {
            label: "Period",
            value: data.period
        },

        {
            label: "Opening Balance",
            value: data.openingBalance
        },

        {
            label: "Total Credit",
            value: data.totalCredit
        },

        {
            label: "Total Order",
            value: data.totalOrder
        },

        {
            label: "Closing Balance",
            value: data.closingBalance
        }

    ];

    rows.forEach((row, index) => {

        const bg =
            index % 2 === 0
                ? "#FFFFFF"
                : "#FAFAFA";

        doc
            .save()
            .rect(left, y, width, rowHeight)
            .fill(bg);

        doc.restore();

        doc
            .rect(left, y, width, rowHeight)
            .stroke("#DDDDDD");

        doc
            .moveTo(left + labelWidth, y)
            .lineTo(left + labelWidth, y + rowHeight)
            .stroke("#DDDDDD");

        doc
            .font("Helvetica")
            .fontSize(11)
            .fillColor("black")
            .text(
                row.label,
                left + 10,
                y + 10,
                {
                    width: labelWidth - 20
                }
            );

        doc
            .font("Helvetica-Bold")
            .text(
                row.value,
                left + labelWidth + 10,
                y + 10,
                {
                    width: valueWidth - 20,
                    align: "right"
                }
            );

        y += rowHeight;

    });

    doc.y = y + 20;

}

export function drawStatCards(
    doc: PDFKit.PDFDocument,
    title: string,
    cards: {
        title: string;
        value: string;
    }[]
) {

    section(doc, title);

    const gap = 20;

    const pageWidth =
        doc.page.width -
        doc.page.margins.left -
        doc.page.margins.right;

    const cardWidth =
        (pageWidth - gap * (cards.length - 1))
        / cards.length;

    const cardHeight = 40;

    const startX =
        doc.page.margins.left;

    const startY =
        doc.y;

    cards.forEach((card, index) => {

        const x =
            startX +
            index * (cardWidth + gap);

        doc
            .save()
            .roundedRect(
                x,
                startY,
                cardWidth,
                cardHeight,
                6
            )
            .fill("#F8F9FA");

        doc.restore();

        doc
            .roundedRect(
                x,
                startY,
                cardWidth,
                cardHeight,
                6
            )
            .stroke("#DDDDDD");

doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#666666")
    .text(
        card.title,
        x,
        startY + 6,
        {
            width: cardWidth,
            align: "center"
        }
    );

doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor("black")
    .text(
        card.value,
        x,
        startY + 20,
        {
            width: cardWidth,
            align: "center"
        }
    );

    });

    doc.y = startY + cardHeight + 20;

}