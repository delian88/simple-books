const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: 'czv80u.h.filess.io',
    port: 3306,
    user: 'Ledgerly_db_swamtimeif',
    password: '0c4ea697645ed3d779657d59c26959693e01a3b2',
    database: 'Ledgerly_db_swamtimeif'
  });

  try {
    await connection.query('CREATE INDEX transactions_userId_idx ON transactions(user_id)');
    console.log("Index created successfully.");
  } catch (error) {
    console.error("Query failed:", error.message);
  }

  await connection.end();
}

main();
