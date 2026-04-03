# Mapplify Frontend

## Security Notes

- Do not hardcode API keys in source files.
- The map renderer uses `VITE_GOOGLE_MAPS_API_KEY` from environment.
- Directions/geocoding/search calls are proxied through backend endpoints at `/api/google/*`.

## Environment Setup

1. Copy `.env.example` to `.env`.
2. Set `VITE_GOOGLE_MAPS_API_KEY` with a Google Maps browser key.
3. Restrict the key in Google Cloud Console:
	- Allowed URLs (your production domain)
	- Enable only required Maps APIs

## Development

```bash
npm install
npm run dev
```

The Vite dev server proxies `/api` to `http://localhost:8081`.

## Production

1. Build frontend:

```bash
npm run build
```

2. Ensure backend has `GOOGLE_MAPS_SERVER_API_KEY` configured.
3. Deploy frontend and backend behind the same domain or configure `VITE_API_BASE_URL`.
