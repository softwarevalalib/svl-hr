const PDFDocument = require('pdfkit');

function streamPdf(res, filename, buildFn) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    doc.pipe(res);
    buildFn(doc);
    doc.end();
}

function header(doc, title, subtitle) {
    doc.fontSize(18).text('SVL Human Resource Management', { align: 'left' });
    doc.moveDown(0.3);
    doc.fontSize(14).fillColor('#1a365d').text(title);
    doc.fillColor('#000');
    if (subtitle) {
        doc.fontSize(10).fillColor('#666').text(subtitle);
        doc.fillColor('#000');
    }
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#ccc');
    doc.moveDown();
}

function footer(doc) {
    const bottom = doc.page.height - 40;
    doc.fontSize(8).fillColor('#999').text(
        `Generated ${new Date().toLocaleString()}`,
        50,
        bottom,
        { align: 'center', width: 495 }
    );
}

function drawTable(doc, columns, rows, startY) {
    let y = startY || doc.y;
    const colWidth = 495 / columns.length;
    doc.fontSize(9).fillColor('#333');
    columns.forEach((c, i) => {
        doc.text(c, 50 + i * colWidth, y, { width: colWidth - 4, continued: false });
    });
    y += 16;
    doc.moveTo(50, y - 4).lineTo(545, y - 4).stroke('#ddd');
    rows.forEach((row) => {
        if (y > 750) {
            doc.addPage();
            y = 50;
        }
        columns.forEach((c, i) => {
            const val = row[i] != null ? String(row[i]) : '';
            doc.text(val, 50 + i * colWidth, y, { width: colWidth - 4 });
        });
        y += 14;
    });
    doc.y = y + 10;
}

function payslipPdf(res, payslip, employee) {
    streamPdf(res, `payslip-${payslip.id || 'export'}.pdf`, (doc) => {
        header(doc, 'Payslip', payslip.payroll_name || '');
        doc.fontSize(11);
        doc.text(`Employee: ${employee?.first_name || ''} ${employee?.last_name || ''}`);
        doc.text(`Period: ${payslip.pay_period_start || ''} – ${payslip.pay_period_end || ''}`);
        doc.text(`Status: ${payslip.status || ''}`);
        doc.moveDown();
        doc.text(`Gross Salary: ${Number(payslip.gross_salary || 0).toFixed(2)} ${payslip.currency || 'USD'}`);
        doc.text(`Total Deductions: ${Number(payslip.total_deductions || 0).toFixed(2)}`);
        doc.text(`Net Salary: ${Number(payslip.net_salary || 0).toFixed(2)}`);
        footer(doc);
    });
}

function expenseReceiptPdf(res, expense) {
    streamPdf(res, `receipt-${expense.id}.pdf`, (doc) => {
        header(doc, 'Expense Receipt', expense.transaction_no || `EXP-${expense.id}`);
        doc.fontSize(11);
        doc.text(`Employee: ${expense.employee_name || ''}`);
        doc.text(`Date: ${expense.expense_date || ''}`);
        doc.text(`Payee: ${expense.payee || ''}`);
        doc.text(`Category: ${expense.category_name || ''}`);
        doc.text(`Payment Method: ${expense.payment_method_name || ''}`);
        doc.text(`Amount: ${Number(expense.amount || 0).toFixed(2)} ${expense.currency || 'USD'}`);
        doc.text(`Status: ${expense.status || ''}`);
        if (expense.notes) doc.text(`Notes: ${expense.notes}`);
        footer(doc);
    });
}

function invoicePdf(res, txn) {
    streamPdf(res, `invoice-${txn.transaction_number || txn.id}.pdf`, (doc) => {
        header(doc, 'Invoice / Transaction', txn.transaction_number || '');
        doc.fontSize(11);
        doc.text(`Account: ${txn.account_name || ''}`);
        doc.text(`Type: ${txn.transaction_type_name || ''}`);
        doc.text(`Date: ${txn.transaction_date || ''}`);
        doc.text(`Amount: ${Number(txn.amount || 0).toFixed(2)} ${txn.currency || 'USD'}`);
        doc.text(`Reference: ${txn.reference_number || ''}`);
        doc.text(`Category: ${txn.category || ''}`);
        doc.text(`Status: ${txn.status || ''}`);
        if (txn.description) doc.text(`Description: ${txn.description}`);
        footer(doc);
    });
}

function purchaseOrderPdf(res, order, items) {
    streamPdf(res, `po-${order.po_number || order.id}.pdf`, (doc) => {
        header(doc, 'Purchase Order', order.po_number || '');
        doc.fontSize(11);
        doc.text(`Vendor: ${order.vendor_name || ''}`);
        doc.text(`Date: ${order.po_date || ''}`);
        doc.text(`Expected Delivery: ${order.expected_delivery_date || ''}`);
        doc.text(`Total: ${Number(order.total_amount || 0).toFixed(2)} ${order.currency || 'USD'}`);
        doc.text(`Status: ${order.status || ''}`);
        doc.moveDown();
        if (items && items.length) {
            drawTable(
                doc,
                ['Item', 'Qty', 'Unit', 'Unit Price', 'Total'],
                items.map((i) => [i.item_name, i.quantity, i.unit, i.unit_price, i.total_price])
            );
        }
        footer(doc);
    });
}

function attendanceReportPdf(res, records, meta) {
    streamPdf(res, 'attendance-report.pdf', (doc) => {
        header(doc, 'Attendance Report', meta?.range || '');
        drawTable(
            doc,
            ['Date', 'Employee', 'In', 'Out', 'Status'],
            (records || []).map((r) => [r.date, r.employee_name, r.in_time || '', r.out_time || '', r.status || ''])
        );
        footer(doc);
    });
}

function employeeListPdf(res, employees) {
    streamPdf(res, 'employees.pdf', (doc) => {
        header(doc, 'Employee List');
        drawTable(
            doc,
            ['ID', 'Name', 'Department', 'Job Title', 'Status'],
            (employees || []).map((e) => [
                e.employee_id || e.id,
                `${e.first_name || ''} ${e.last_name || ''}`,
                e.department || '',
                e.job_title || '',
                e.status || '',
            ])
        );
        footer(doc);
    });
}

function leaveSummaryPdf(res, leaves) {
    streamPdf(res, 'leave-summary.pdf', (doc) => {
        header(doc, 'Leave Summary');
        drawTable(
            doc,
            ['Employee', 'Type', 'Start', 'End', 'Days', 'Status'],
            (leaves || []).map((l) => [
                l.employee_name || '',
                l.leave_type_name || '',
                l.date_start || '',
                l.date_end || '',
                l.days || '',
                l.status || '',
            ])
        );
        footer(doc);
    });
}

module.exports = {
    payslipPdf,
    expenseReceiptPdf,
    invoicePdf,
    purchaseOrderPdf,
    attendanceReportPdf,
    employeeListPdf,
    leaveSummaryPdf,
};
