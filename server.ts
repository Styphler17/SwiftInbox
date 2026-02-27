import express from "express";
import { createServer as createViteServer } from "vite";
import Stripe from "stripe";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Supabase Setup
const supabaseUrl = process.env.SUPABASE_URL || 'https://maqzenrgsmsagcvndhdy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

let stripeClient: Stripe | null = null;

function getStripe(): Stripe {
    if (!stripeClient) {
        const key = process.env.STRIPE_SECRET_KEY;
        if (!key) {
            throw new Error("STRIPE_SECRET_KEY environment variable is required");
        }
        stripeClient = new Stripe(key);
    }
    return stripeClient;
}

const JWT_SECRET = process.env.JWT_SECRET || "debesties-secret-super-key";
const MAIL_TM_BASE = 'https://api.mail.tm';

async function startServer() {
    const app = express();
    const PORT = Number(process.env.PORT) || 3001;

    app.use(express.json());

    // API Routes
    app.get("/api/health", (req, res) => {
        res.json({ status: "ok" });
    });

    // Mail.tm API Bridge
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

    // Auth Routes
    app.post('/api/auth/magic-link', async (req, res) => {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });

        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins

        const { error } = await supabase
            .from('auth_tokens')
            .insert([{ token, email, expires_at: expiresAt }]);

        if (error) {
            console.error("Supabase Error (Auth Token):", error);
            return res.status(500).json({ error: 'Failed to generate token' });
        }

        // In a real app, you would send this email. For now, we log it.
        const origin = req.headers.origin || 'http://localhost:3001';
        console.log(`[MAGIC LINK] for ${email}: ${origin}?auth_token=${token}`);

        res.json({ message: 'Magic link "sent" to your email!' });
    });

    app.get('/api/auth/verify', async (req, res) => {
        const { token } = req.query;
        if (!token) return res.status(400).json({ error: 'Token is required' });

        const { data: row, error: fetchError } = await supabase
            .from('auth_tokens')
            .select('*')
            .eq('token', token)
            .single();

        if (fetchError || !row || new Date(row.expires_at) < new Date()) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }

        // Clean up token
        await supabase.from('auth_tokens').delete().eq('token', token);

        // Get or create user
        let { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', row.email)
            .single();

        if (!user) {
            const id = uuidv4();
            const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert([{ id, email: row.email }])
                .select()
                .single();

            if (createError) {
                console.error("Supabase Error (Create User):", createError);
                return res.status(500).json({ error: 'Failed to create user' });
            }
            user = newUser;
        }

        const jwtToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token: jwtToken, user });
    });

    app.get('/api/auth/me', async (req, res) => {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });

        try {
            const decoded = jwt.verify(authHeader.replace('Bearer ', ''), JWT_SECRET) as any;
            const { data: user, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', decoded.id)
                .single();

            if (error || !user) throw new Error("User not found");
            res.json({ user });
        } catch (error) {
            res.status(401).json({ error: 'Invalid token' });
        }
    });

    // Stripe Checkout Session
    app.post("/api/create-checkout-session", async (req, res) => {
        try {
            const { plan, appUrl, email } = req.body;

            let priceId = "";
            let planName = "";

            if (plan === 'plus') {
                priceId = process.env.STRIPE_PLUS_PRICE_ID || "prod_U3clTMc6YPAfKd";
                planName = "Debesties Mail Plus";
            } else if (plan === 'pro') {
                priceId = process.env.STRIPE_PRO_PRICE_ID || "prod_U3cmH2ZxoQdgBW";
                planName = "Debesties Mail Pro";
            } else {
                return res.status(400).json({ error: "Invalid plan" });
            }

            const stripe = getStripe();
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ["card"],
                customer_email: email || undefined,
                line_items: [
                    {
                        price_data: {
                            currency: "usd",
                            product_data: {
                                name: planName,
                                description: `Upgrade your Debesties Mail to ${planName}`,
                            },
                            unit_amount: plan === 'plus' ? 399 : 895,
                            recurring: { interval: "month" },
                        },
                        quantity: 1,
                    },
                ],
                mode: "subscription",
                success_url: `${appUrl}?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
                cancel_url: `${appUrl}`,
            });

            res.json({ url: session.url });
        } catch (error: any) {
            console.error("Stripe Error:", error);
            res.status(500).json({ error: error.message });
        }
    });

    // Vite middleware for development
    if (process.env.NODE_ENV !== "production") {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: "spa",
        });
        app.use(vite.middlewares);
    } else {
        // Production static serving would go here
        app.use(express.static("dist"));
    }

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

startServer();
