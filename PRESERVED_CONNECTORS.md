# Preserved Connectors & Credentials

This document tracks all environment variables, API keys, secrets, and hosting configurations preserved during the site rebuild.

## Environment Variables (.env.local)

| Variable | Service | Purpose | Status |
|---|---|---|---|
| `GROK_API_KEY` | xAI (Grok API) | AI copywriting generation for product descriptions and blog posts | Preserved |
| `SUPABASE_SERVICE_KEY` | Supabase | Database service key (from previous build — may be repurposed or deprecated) | Preserved |

## New Environment Variables (to be added)

| Variable | Service | Purpose |
|---|---|---|
| `STRIPE_SECRET_KEY` | Stripe | Server-side payment processing |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe | Client-side Stripe checkout |
| `ADMIN_PASSWORD` | Internal | /hq admin login authentication |
| `XAI_API_KEY` | xAI (Grok API) | Alias — currently stored as `GROK_API_KEY` |

## Hosting Configuration

| File | Service | Status |
|---|---|---|
| `vercel.json` | Vercel | Preserved — framework: nextjs, build/dev/install commands |
| `.vercel/` | Vercel | Preserved — project linking and deployment config |

## DNS & Domain

- Domain: swzzle.com
- Hosting: Vercel
- DNS configuration managed externally (not in repo)

## Notes

- `GROK_API_KEY` in .env.local maps to the `XAI_API_KEY` referenced in the rebuild spec. Code will read from `GROK_API_KEY` (existing key name).
- Stripe keys need to be added to .env.local before checkout will function.
- `ADMIN_PASSWORD` needs to be set in .env.local before /hq login will work.
- Supabase key preserved but not used in the new storefront build. Can be removed later if no longer needed.
