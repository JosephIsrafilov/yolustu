# Yolmates portfolio demo

This branch keeps the original backend and Flutter app intact. The static demo is the existing Next.js frontend with local TypeScript services and `localStorage` data. No FastAPI, database, AWS, WebSocket, SMS, Google Maps key, or payment provider is needed.

## Build and preview

```powershell
cd frontend
npm ci
npm run build:demo
```

Deploy the generated `frontend/out` directory to a Cloudflare Pages project named `yolustu`. The Pages build command is `npm run build:demo`; the root directory is `frontend`; the output directory is `out`. Node.js 20 or newer is recommended. Do not add public API, WebSocket, or Maps environment variables to the Pages build. The demo build script explicitly clears those values before Next compiles client assets.

For a direct upload after `wrangler login`:

```powershell
cd frontend
npx wrangler pages deploy out --project-name yolmates
```

Cloudflare Pages serves the exported route directories directly, including deep links. `build-demo.mjs` also writes flattened RSC prefetch aliases required by this Next.js 16 static export.

## Demo behavior

The footer and login page offer passenger and driver accounts. Local password login uses `+994500000001` or `+994500000002` with `demo123`. OTP flows use `123456`. All identities are fictional. Ride, booking, wallet, chat, review, and notification changes stay in this browser's `localStorage`. Reset Demo Data in the footer restores the seeded state. Two different visitors do not share data or chat with each other.

The map is a local schematic route display in demo mode. Prices are deterministic estimates and all payments are simulated. The original application's server architecture remains in the repository for source review.

## Updates

Edit the frontend and demo services, run `npm run build:demo`, test the output in a browser, commit to the portfolio branch or fork, then push. A Pages Git integration can rebuild automatically from that branch using the settings above; direct-upload projects need `npx wrangler pages deploy out --project-name yolmates` after each build.
