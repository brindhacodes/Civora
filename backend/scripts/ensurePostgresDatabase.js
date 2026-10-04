const path = require('path');
const { Client } = require('pg');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function ensureDatabase() {
    const databaseName = process.env.DB_NAME;
    if (!databaseName || !/^[A-Za-z0-9_]+$/.test(databaseName)) {
        throw new Error('DB_NAME must contain only letters, numbers, and underscores');
    }

    const client = new Client({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        database: 'postgres',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        connectionTimeoutMillis: Number(process.env.DB_CONNECT_TIMEOUT_MS || 5000),
        application_name: 'civora-database-setup'
    });

    try {
        await client.connect();
        const existing = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [databaseName]);
        if (existing.rowCount === 0) {
            await client.query(`CREATE DATABASE "${databaseName}"`);
            console.log(`Created PostgreSQL database "${databaseName}"`);
        } else {
            console.log(`PostgreSQL database "${databaseName}" already exists`);
        }
    } finally {
        await client.end();
    }
}

ensureDatabase().catch((error) => {
    console.error('Unable to ensure PostgreSQL database:', error);
    process.exitCode = 1;
});
