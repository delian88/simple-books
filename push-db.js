import fs from 'fs';
import mysql from 'mysql2/promise';

async function importDb() {
  const sql = fs.readFileSync('namecheap_db_full.sql', 'utf8');

  console.log('Connecting to Namecheap database...');
  const connection = await mysql.createConnection({
    host: '198.54.120.24', // I will use the host from the prompt or let it be 'localhost'? Wait, Namecheap shared hosting doesn't allow remote MySQL connection by default. 
    // Is the user running this from their cPanel terminal or local?
    // "push to database" implies from my environment to Namecheap. 
    // The user didn't provide a host for remote connection. 
    // Ah, wait. Namecheap databases are usually local to the server. If they are on a shared host, they need to whitelist my IP, which is impossible from here.
    // Let me check if I can connect using the domain name or cPanel IP.
    host: 'localhost',
    user: 'mykornwi_bookzuser',
    password: 'bookzuser$1',
    database: 'mykornwi_bookz',
    multipleStatements: true
  });

  console.log('Executing SQL file...');
  await connection.query(sql);
  
  console.log('Successfully pushed to database!');
  await connection.end();
}

importDb().catch(err => {
  console.error(err);
  process.exit(1);
});
