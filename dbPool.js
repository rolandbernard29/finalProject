const mysql = require('mysql');

const pool  = mysql.createPool({
    connectionLimit: 100,
    host: "de1tmi3t63foh7fa.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
    user: "pcnz0agio75bdxj0",
    password: "hlpapk55s7ab5748",
    database: "twa85klntx888s8b"
});

module.exports = pool;
