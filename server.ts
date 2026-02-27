import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'better-sqlite3';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

// Database setup
const db = new sqlite3('database.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    address TEXT NOT NULL,
    token TEXT NOT NULL,
    expires_at DATETIME NOT NULL
  )
`);

app.use(express.json());

// Helper for Mail.tm API
const MAIL_TM_BASE = 'https://api.mail.tm';

app.get('/api/domains', async (req, res) => {
    try {
        const response = await fetch(`${MAIL_TM_BASE}/domains`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch domains' });
    }
});

app.post('/api/accounts', async (req, res) => {
    const { address, password } = req.body;
    try {
        const response = await fetch(`${MAIL_TM_BASE}/accounts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address, password }),
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create account' });
    }
});

app.post('/api/token', async (req, res) => {
    const { address, password } = req.body;
    try {
        const response = await fetch(`${MAIL_TM_BASE}/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address, password }),
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get token' });
    }
});

app.get('/api/messages', async (req, res) => {
    const token = req.headers.authorization;
    try {
        const response = await fetch(`${MAIL_TM_BASE}/messages`, {
            headers: { 'Authorization': token as string },
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

app.get('/api/messages/:id', async (req, res) => {
    const token = req.headers.authorization;
    const { id } = req.params;
    try {
        const response = await fetch(`${MAIL_TM_BASE}/messages/${id}`, {
            headers: { 'Authorization': token as string },
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch message' });
    }
});

app.delete('/api/messages/:id', async (req, res) => {
    const token = req.headers.authorization;
    const { id } = req.params;
    try {
        const response = await fetch(`${MAIL_TM_BASE}/messages/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': token as string },
        });
        if (response.status === 204) {
            res.status(204).send();
        } else {
            const data = await response.json();
            res.status(response.status).json(data);
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete message' });
    }
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
}

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
