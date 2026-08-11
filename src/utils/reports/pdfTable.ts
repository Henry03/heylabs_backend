import PDFDocument from "pdfkit";

export interface TableColumn {
    title: string;
    width: number;
    align?: "left" | "center" | "right";
}

export interface TableRow {
    [key: string]: any;
}

const PAGE_LEFT = 40;
const PAGE_BOTTOM = 770;

const HEADER_HEIGHT = 28;
const CELL_PADDING = 5;

function drawHeader(
    doc: PDFKit.PDFDocument,
    columns: TableColumn[]
) {

    let x = doc.page.margins.left;
    const y = doc.y;

    doc
        .font("Helvetica-Bold")
        .fontSize(10);

    for (const column of columns) {

        doc
            .rect(
                x,
                y,
                column.width,
                HEADER_HEIGHT
            )
            .stroke();

        doc.text(

            column.title,

            x + CELL_PADDING,

            y + CELL_PADDING,

            {

                width: column.width - CELL_PADDING * 2,

                align: column.align || "left"

            }

        );

        x += column.width;

    }

    doc.y = y + HEADER_HEIGHT;

}

function calculateRowHeight(
    doc: PDFKit.PDFDocument,
    row: TableRow,
    columns: TableColumn[]
) {

    let maxHeight = HEADER_HEIGHT;

    doc.font("Helvetica").fontSize(10);

    for (const column of columns) {

        const value =
            row[column.title] == null
                ? ""
                : String(row[column.title]);

        const height =
            doc.heightOfString(

                value,

                {

                    width:
                        column.width -
                        CELL_PADDING * 2,

                    align:
                        column.align || "left"

                }

            ) + CELL_PADDING * 2;

        if (height > maxHeight) {

            maxHeight = height;

        }

    }

    return maxHeight;

}

function checkNewPage(
    doc: PDFKit.PDFDocument,
    rowHeight: number,
    columns: TableColumn[]
) {
    const pageBottom =
        doc.page.height -
        doc.page.margins.bottom -
        10;

    if (
        doc.y + rowHeight >
        pageBottom
    ) {

        doc.addPage();

        drawHeader(
            doc,
            columns
        );

    }

}

function drawRow(
    doc: PDFKit.PDFDocument,
    row: TableRow,
    columns: TableColumn[]
) {

    const height =
        calculateRowHeight(
            doc,
            row,
            columns
        );

    checkNewPage(
        doc,
        height,
        columns
    );

    let x = doc.page.margins.left;
    const y = doc.y;

    doc
        .font("Helvetica")
        .fontSize(10);

    for (const column of columns) {

        doc
            .rect(
                x,
                y,
                column.width,
                height
            )
            .stroke();

        const value =
            row[column.title] == null
                ? ""
                : String(row[column.title]);

        doc.text(

            value,

            x + CELL_PADDING,

            y + CELL_PADDING,

            {

                width:
                    column.width -
                    CELL_PADDING * 2,

                align:
                    column.align || "left"

            }

        );

        x += column.width;

    }

    doc.y = y + height + 1;

}

export function drawTable(
    doc: PDFKit.PDFDocument,
    columns: TableColumn[],
    rows: TableRow[]
) {

    if (!rows.length) {

        doc.text("No data");

        return;

    }

    drawHeader(
        doc,
        columns
    );

    for (const row of rows) {

        drawRow(
            doc,
            row,
            columns
        );

    }

}