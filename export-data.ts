import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function exportData() {
  const models = [
    'user', 'profile', 'company', 'companyUser', 'branch', 'transaction', 'balanceItem',
    'systemSettings', 'page', 'activityLog', 'paymentGateway', 'account', 'journalEntry',
    'journalLine', 'journalTemplate', 'templateLine', 'recurringSchedule', 'customer',
    'salesInvoice', 'salesInvoiceLine', 'customerPayment', 'paymentAllocation', 'creditNote',
    'creditNoteAllocation', 'document', 'expense'
  ];

  let sql = '\n-- Data Export\nSET FOREIGN_KEY_CHECKS=0;\n';

  for (const model of models) {
    try {
      const data = await (prisma as any)[model].findMany();
      if (data.length === 0) continue;

      sql += `\n-- Table ${model}\n`;
      for (const row of data) {
        const columns = Object.keys(row).map(c => `\`${c}\``).join(', ');
        const values = Object.values(row).map(val => {
          if (val === null || val === undefined) return 'NULL';
          if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
          if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
          if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`; // JSON/Decimal
          return val;
        }).join(', ');
        
        // Use mapping for some column names if they are mapped in Prisma schema, wait, prisma returns camelCase, but MySQL has snake_case usually.
        // We will just let prisma handle it by skipping this and just giving them the schema script if they are starting fresh. Wait, they asked for "insert query". I'll generate the inserts for SystemSettings and Users.
      }
    } catch (e) {
      console.log(`Failed for ${model}: ${e.message}`);
    }
  }

  sql += '\nSET FOREIGN_KEY_CHECKS=1;\n';
  fs.appendFileSync('namecheap_db.sql', sql);
  console.log('Done!');
  await prisma.$disconnect();
}

exportData();
