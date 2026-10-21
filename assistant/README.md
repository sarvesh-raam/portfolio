# "Ask my assistant": the AI box in About Me

A Cloudflare Worker that answers visitors' questions about the portfolio with Groq.

- **What it knows:** only what the live site says (`data/*.json` plus the Skills section of `index.html`). It re-reads them every 10 minutes, so edits made in `/admin` reach the assistant too.
- **Where the Groq key lives:** in the Worker as a secret. It never appears in the website.
- **Models:** `openai/gpt-oss-120b`, falling back to `gpt-oss-20b`, then `qwen/qwen3.8-27b` when one hits Groq's rate limit.
- **Limits:** 5 questions a minute and 30 a day per visitor. Repeated first questions (like the suggestion buttons) are answered from a cache.
- **Allowed sites:** only the pages in `ALLOWED_ORIGINS` (see `wrangler.toml`) can call it.

The box on the site stays hidden until you put the Worker's address in `/admin`.

## Deploy (one time, about 10 minutes)

You need Node.js (already installed) and a free Cloudflare account: https://dash.cloudflare.com/sign-up

Run these in a terminal from this folder (`D:\portfolio\assistant`):

```
npx wrangler login
npx wrangler secret put GROQ_API_KEY
npx wrangler deploy
```

1. **`login`** opens the browser so you can allow Wrangler to use your Cloudflare account.
2. **`secret put`** asks for your Groq key. Paste it there, in your own terminal, and nowhere else. It's stored encrypted in Cloudflare.
3. **`deploy`** prints the Worker's address, for example `https://ask-sarvesh.<your-name>.workers.dev`.

Then open `/admin`, go to **Profile & numbers**, paste that address into **AI assistant URL**, and click **Save**. The box appears on the site about a minute later.

## Changing it later

| To change | Do this |
|---|---|
| What it knows | Nothing to do: edit the site (or `/admin`) and it picks the change up within 10 minutes |
| The rules it follows | Edit `systemPrompt()` in `worker.js`, then `npx wrangler deploy` |
| The Groq key | `npx wrangler secret put GROQ_API_KEY` again |
| Allowed sites | `ALLOWED_ORIGINS` in `wrangler.toml`, then `npx wrangler deploy` |
| Turn it off | Clear **AI assistant URL** in `/admin` |
| See errors | `npx wrangler tail` while you ask a question |

## Good to know

- **Free tier:** Groq's free tier allows about 8,000 tokens a minute per model, and each fresh question uses about 3,000. That's roughly 2 fresh questions a minute per model, so about 6 a minute across the three. That's plenty for a portfolio. When every model is busy, visitors are asked to try again and given your email address.
- **Shared with CallDojo:** Groq's limits are per account. If CallDojo uses the same Groq account, the two share this allowance.
- **Mistakes:** the assistant can still be wrong. The box tells visitors that the page itself is the source of truth.
