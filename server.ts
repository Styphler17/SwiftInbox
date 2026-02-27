import express from "express";
import { createServer as createViteServer } from "vite";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Stripe Checkout Session
  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const { plan, appUrl } = req.body;
      
      let priceId = "";
      let planName = "";
      
      if (plan === 'plus') {
        priceId = process.env.STRIPE_PLUS_PRICE_ID || "price_plus_placeholder";
        planName = "SwiftInbox Plus";
      } else if (plan === 'pro') {
        priceId = process.env.STRIPE_PRO_PRICE_ID || "price_pro_placeholder";
        planName = "SwiftInbox Pro";
      } else {
        return res.status(400).json({ error: "Invalid plan" });
      }

      const stripe = getStripe();
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: planName,
                description: `Upgrade your SwiftInbox to ${planName}`,
              },
              unit_amount: plan === 'plus' ? 499 : 900,
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
