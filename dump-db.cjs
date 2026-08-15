const mysqldump = require('mysqldump');

mysqldump({
    connection: {
        host: 'czv80u.h.filess.io',
        user: 'Ledgerly_db_swamtimeif',
        password: '0c4ea697645ed3d779657d59c26959693e01a3b2',
        database: 'Ledgerly_db_swamtimeif',
        port: 3306
    },
    dumpToFile: 'namecheap_db_full.sql',
}).then(() => {
    console.log('Database successfully dumped to namecheap_db_full.sql!');
}).catch(err => {
    console.error('Error dumping database:', err);
});
