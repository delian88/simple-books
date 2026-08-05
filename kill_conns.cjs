const mysql = require('mysql2/promise');

async function main() {
  try {
    const connection = await mysql.createConnection({
      host: 'czv80u.h.filess.io',
      port: 3306,
      user: 'Ledgerly_db_swamtimeif',
      password: '0c4ea697645ed3d779657d59c26959693e01a3b2',
      database: 'Ledgerly_db_swamtimeif'
    });

    console.log("Connected to MySQL successfully!");
    
    const [rows] = await connection.query('SHOW PROCESSLIST');
    console.log("Process List:");
    console.table(rows);

    let killedCount = 0;
    for (const row of rows) {
      if (row.Command === 'Sleep' && row.Time > 10) {
        console.log(`Killing process ${row.Id}`);
        try {
          await connection.query(`KILL ${row.Id}`);
          killedCount++;
        } catch(e) {
          console.error(`Failed to kill ${row.Id}:`, e.message);
        }
      }
    }
    
    console.log(`Killed ${killedCount} sleeping connections.`);
    await connection.end();
  } catch (error) {
    console.error("Database connection failed:", error);
  }
}

main();
