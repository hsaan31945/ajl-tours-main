# Vercel Fast Origin Transfer Audit

Date: June 20, 2026

## Production status

Both `https://ajltour.com` and `https://ajl-tours-backend-phi.vercel.app` returned:

- HTTP `402 Payment Required`
- `x-vercel-error: DEPLOYMENT_DISABLED`
- Vercel project status: `live: false`

The paused deployment prevented live application payload sampling. The measurements below use the repository's May 19, 2026 MongoDB export and the production route serialization logic.

## Root cause

The export contains 11 tours and 64 embedded base64 images:

- Complete tour array: `13,088,103` bytes
- Image fields alone: `13,034,987` bytes (`99.59%`)
- Decoded image assets: `9,774,923` bytes

The frontend also added a timestamp query and `no-store`/`no-cache` directives to public tour and hero requests, while the backend returned tour data with `no-store`. This prevented Vercel's CDN from absorbing repeated ad traffic.

## Before and after

| Endpoint/data path | Before | After |
|---|---:|---:|
| `GET /api/tours?full=true` (11 tours) | 13,088,103 B | 58,059 B |
| `GET /api/tours?view=list&limit=100` | Could fall back to full records in legacy paths | 12,841 B |
| `GET /api/tours?view=summary&limit=100` | Could fall back to full records in legacy paths | 12,841 B |
| `GET /api/tours?view=search&limit=100` | Could fall back to full records in legacy paths | 6,408 B |
| `GET /api/tours/:id` | 530,694–1,656,771 B; average 1,189,826 B | 4,487–6,403 B; average 5,277 B |
| `GET /api/tours/:id/image` | 49,100–284,369 B from backend; average 152,733 B | 0-byte redirect body to frontend CDN |
| `GET /api/content/homepage/hero_banners` | Up to four embedded base64 images per page and forced origin refresh | URL-only JSON, cached at Vercel edge |
| Hero image fallback endpoint | Image embedded in JSON | Separate image response cached for 7 days |
| `GET /api/bookings` | Unbounded when called without filters | Requires `email` or `tourId`; maximum 100 records |
| `GET /api/admin/summary` | Already bounded to 8 recent bookings | Unchanged |
| `GET /api/admin/users` | Already paginated (25 default, 100 maximum) | Unchanged |
| `GET /api/admin/bookings` | Unbounded because the existing dashboard expects the complete list | Unchanged to avoid altering dashboard behavior |

Gzip comparison for the full tour array:

- Before: `9,780,921` bytes
- After: `9,833` bytes

## Implemented controls

- Exported all 64 current tour images to `frontend/public/tour-media`, served as immutable frontend CDN assets.
- Added a manifest so public tour JSON contains image URLs only.
- Kept legacy tour image URLs working with CDN redirects.
- Added lightweight public tour list fields and fetched full details only for a selected tour.
- Added browser request coalescing and a five-minute frontend memory cache.
- Removed timestamp cache busting and public `no-store` directives.
- Added Vercel CDN cache headers to public tour and homepage data.
- Converted public hero base64 values to image endpoint URLs; the fallback image endpoint is cached for seven days.
- Required booking filters to prevent accidental full booking collection downloads.
- Added response-size logging support through `DEBUG_PERF=true`.

## Pagination decision

Public tour lists remain capped at 100, which matches the current UI and does not add pagination controls. Admin bookings were not paginated because the existing dashboard loads and filters the complete collection; changing that would alter dashboard behavior.
