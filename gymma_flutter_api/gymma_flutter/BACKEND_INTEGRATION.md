# Backend integration — what changed & what you must do

The app now reads from the live API instead of the bundled JSON asset.

## 1. Set your API base URL (required)
Open `lib/data/api_client.dart` and set `_fallbackBaseUrl` to your deployed
backend, **including the `/api/v1` suffix**:

```dart
const String _fallbackBaseUrl = 'https://YOUR-RENDER-APP.onrender.com/api/v1';
```

Or override per-run without editing code:

```bash
flutter run --dart-define=API_BASE_URL=https://your-api.onrender.com/api/v1
```

## 2. Android manifest (after `flutter create .`)
In `android/app/src/main/AndroidManifest.xml`:

- Add INTERNET permission (inside `<manifest>`, above `<application>`):
  ```xml
  <uses-permission android:name="android.permission.INTERNET"/>
  ```
- Add the `<queries>` block from `android_manifest_patch/AndroidManifest_queries_snippet.xml`
  (needed for the Call / WhatsApp / Directions buttons on Android 11+).

All API calls are HTTPS, so no cleartext config is needed.

## What's wired to the backend
| Feature            | Endpoint                     |
|--------------------|------------------------------|
| Gym list / explore | `GET /gyms`                  |
| Gym detail         | `GET /gyms/:slug`            |
| Reviews            | `GET /gyms/:slug/reviews`    |
| Send inquiry       | `POST /inquiries`            |
| Partner / demo     | `POST /demo-requests`        |

Notes:
- Trainers, plans, classes, FAQs, scores and reviews are now **real backend
  data** — the old seeded-RNG generator was removed.
- Search filters and sort still run client-side over the fetched list, so the
  UX matches the web while the data is live.
- Compare fetches full detail lazily per gym you add (not all at once).
- `assets/data/gyms.json` is no longer used; safe to delete later.
- Render free instances cold-start, so the first request can take up to ~45s;
  the client retries once and shows a Retry button on failure.
