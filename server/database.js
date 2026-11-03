const { Pool } = require('pg');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL .env faylida topilmadi!');
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.on('error', (error) => {
    console.error('PostgreSQL ulanish xatosi:', error.message);
});

async function query(text, params) {
    return pool.query(text, params);
}

async function testConnection() {
    const result = await pool.query('SELECT NOW() AS current_time');
    console.log('Neon PostgreSQL muvaffaqiyatli ulandi!');
    console.log('Server vaqti:', result.rows[0].current_time);
}

module.exports = {
    pool,
    query,
    testConnection
};
