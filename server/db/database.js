const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbFile = path.join(__dirname, 'customer.db');
const schemaPath = path.join(__dirname, 'schema.sql');

// Create connection
const db = new sqlite3.Database(dbFile, (err) => {
    if (err) {
        console.error('Failed to connect to database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
    }
});

// Load schema on first run
const schema = fs.readFileSync(schemaPath, 'utf8');
db.exec(schema, (err) => {
    if (err) {
        console.error('Failed to initialize schema:', err.message);
    } else {
        console.log('Database schema initialized.');
    }
});

module.exports = db;
