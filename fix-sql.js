import fs from 'fs';

let sql = fs.readFileSync('namecheap_db_full.sql', 'utf8');

// Replace NOFORMAT_WRAP("## and ##") with nothing, so it leaves X'...'
sql = sql.replace(/NOFORMAT_WRAP\(\s*"##/g, '');
sql = sql.replace(/##"\s*\)/g, '');

fs.writeFileSync('namecheap_db_full.sql', sql);
console.log('Fixed NOFORMAT_WRAP formatting in namecheap_db_full.sql');
