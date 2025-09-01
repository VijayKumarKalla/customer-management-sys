const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to SQLite database
const dbFile = path.resolve(__dirname, 'database.db');
const db = new sqlite3.Database(dbFile, (err) => {
    if (err) return console.error(err.message);
    console.log('✅ Connected to SQLite database.');
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Create tables if they don't exist
const initSchema = fs.readFileSync(path.join(__dirname, './db/schema.sql'), 'utf8');
db.exec(initSchema, (err) => {
    if (err) return console.error('❌ Failed to initialize schema:', err.message);
    console.log('📦 Tables ensured');
});

// ===============================
// Customer Routes
// ===============================

// Create new customer
app.post('/api/customers', (req, res) => {
    const { first_name, last_name, phone_number } = req.body;
    const sql = `INSERT INTO customers (first_name, last_name, phone_number) VALUES (?, ?, ?)`;
    db.run(sql, [first_name, last_name, phone_number], function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.status(201).json({ message: 'Customer created', id: this.lastID });
    });
});

// Get all customers (with search, sort, pagination)
app.get('/api/customers', (req, res) => {
    let { search = '', sort = 'id', order = 'ASC', page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const offset = (page - 1) * limit;

    const validSortFields = ['id', 'first_name', 'last_name', 'phone_number'];
    if (!validSortFields.includes(sort)) sort = 'id';

    const sql = `
        SELECT * FROM customers
        WHERE first_name LIKE ? OR last_name LIKE ? OR phone_number LIKE ?
        ORDER BY ${sort} ${order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'}
        LIMIT ? OFFSET ?
    `;
    const queryParams = [`%${search}%`, `%${search}%`, `%${search}%`, limit, offset];

    db.all(sql, queryParams, (err, rows) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: 'success', data: rows });
    });
});

// Get single customer
app.get('/api/customers/:id', (req, res) => {
    const sql = `SELECT * FROM customers WHERE id = ?`;
    db.get(sql, [req.params.id], (err, row) => {
        if (err) return res.status(400).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Customer not found' });
        res.json({ message: 'success', data: row });
    });
});

// Update customer
app.put('/api/customers/:id', (req, res) => {
    const { first_name, last_name, phone_number } = req.body;
    const sql = `UPDATE customers SET first_name = ?, last_name = ?, phone_number = ? WHERE id = ?`;
    db.run(sql, [first_name, last_name, phone_number, req.params.id], function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: 'Customer updated' });
    });
});

// Delete customer
app.delete('/api/customers/:id', (req, res) => {
    const sql = `DELETE FROM customers WHERE id = ?`;
    db.run(sql, [req.params.id], function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: 'Customer deleted' });
    });
});

// ===============================
// Address Routes
// ===============================

// Add new address for a customer
app.post('/api/customers/:id/addresses', (req, res) => {
    const customerId = req.params.id;
    const { address_details, city, state, pin_code } = req.body;

    const sql = `
        INSERT INTO addresses (customer_id, address_details, city, state, pin_code)
        VALUES (?, ?, ?, ?, ?)
    `;
    db.run(sql, [customerId, address_details, city, state, pin_code], function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.status(201).json({ message: 'Address added', id: this.lastID });
    });
});

// Get all addresses for a customer
app.get('/api/customers/:id/addresses', (req, res) => {
    const sql = `SELECT * FROM addresses WHERE customer_id = ?`;
    db.all(sql, [req.params.id], (err, rows) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: 'success', data: rows });
    });
});

// Update a specific address
app.put('/api/addresses/:addressId', (req, res) => {
    const { address_details, city, state, pin_code } = req.body;
    const sql = `
        UPDATE addresses
        SET address_details = ?, city = ?, state = ?, pin_code = ?
        WHERE id = ?
    `;
    db.run(sql, [address_details, city, state, pin_code, req.params.addressId], function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: 'Address updated' });
    });
});

// Delete a specific address
app.delete('/api/addresses/:addressId', (req, res) => {
    const sql = `DELETE FROM addresses WHERE id = ?`;
    db.run(sql, [req.params.addressId], function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: 'Address deleted' });
    });
});

// ===============================
// Start Server
// ===============================
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
