const ExcelJS = require('exceljs');
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// 📌 Generate SIP File Validation Report
async function generateSIPValidationReport() {
    try {
        const result = await pool.query(`
            SELECT i.name AS intern_name, s.name AS school_name, sf.file_name, sf.uploaded_at
            FROM sip_files sf
            JOIN intern i ON sf.intern_id = i.id
            JOIN school s ON CAST(i.school_id AS INTEGER) = s.id
            ORDER BY sf.uploaded_at DESC
        `);
        
        return createExcelReport(result.rows, 'SIP File Validation Report', [
            { header: 'Intern Name', key: 'intern_name', width: 30 },
            { header: 'School Name', key: 'school_name', width: 30 },
            { header: 'File Name', key: 'file_name', width: 40 },
            { header: 'Uploaded At', key: 'uploaded_at', width: 20 }
        ]);
    } catch (error) {
        console.error('Error generating SIP Validation Report:', error);
    }
}

// 📌 Generate Internship Application Report
async function generateInternshipApplicationReport() {
    try {
        const result = await pool.query(`
            SELECT i.name AS intern_name, s.name AS school_name, c.name AS company_name, cir.application_status, cir.applied_at
            FROM companyinternshiprequests cir
            JOIN intern i ON cir.intern_id = i.id
            JOIN school s ON i.school_id = s.id
            JOIN company c ON cir.company_id = c.id
            ORDER BY cir.applied_at DESC
        `);
        return createExcelReport(result.rows, 'Internship Application Report', [
            { header: 'Intern Name', key: 'intern_name', width: 30 },
            { header: 'School Name', key: 'school_name', width: 30 },
            { header: 'Company Name', key: 'company_name', width: 30 },
            { header: 'Application Status', key: 'application_status', width: 20 },
            { header: 'Applied At', key: 'applied_at', width: 20 }
        ]);
    } catch (error) {
        console.error('Error generating Internship Application Report:', error);
    }
}

// 📌 Generate Internship Approval Rate Report
async function generateInternshipApprovalRateReport() {
    try {
        const result = await pool.query(`
            SELECT 
                COUNT(*) AS total_applications,
                COUNT(CASE WHEN application_status = 'Accepted' THEN 1 END) AS approved,
                COUNT(CASE WHEN application_status = 'Rejected' THEN 1 END) AS rejected
            FROM companyinternshiprequests
        `);
        return createExcelReport([result.rows[0]], 'Internship Approval Rate Report', [
            { header: 'Total Applications', key: 'total_applications', width: 20 },
            { header: 'Approved Applications', key: 'approved', width: 20 },
            { header: 'Rejected Applications', key: 'rejected', width: 20 }
        ]);
    } catch (error) {
        console.error('Error generating Internship Approval Rate Report:', error);
    }
}

// 📌 Generate Email Notification Log Report
async function generateEmailNotificationLogReport() {
    try {
        const result = await pool.query(`
            SELECT recipient_email, subject, sent_at
            FROM email_logs
            ORDER BY sent_at DESC
        `);
        return createExcelReport(result.rows, 'Email Notification Log Report', [
            { header: 'Recipient Email', key: 'recipient_email', width: 30 },
            { header: 'Subject', key: 'subject', width: 50 },
            { header: 'Sent At', key: 'sent_at', width: 20 }
        ]);
    } catch (error) {
        console.error('Error generating Email Notification Log Report:', error);
    }
}

// 📌 Helper Function to Create Excel Reports
async function createExcelReport(data, sheetName, columns) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    worksheet.columns = columns;
    worksheet.addRows(data);

    const filePath = `./reports/${sheetName.replace(/ /g, '_')}.xlsx`;
    await workbook.xlsx.writeFile(filePath);
    console.log(`✅ Report generated: ${filePath}`);

    return filePath;
}

module.exports = {
    generateSIPValidationReport,
    generateInternshipApplicationReport,
    generateInternshipApprovalRateReport,
    generateEmailNotificationLogReport
};
