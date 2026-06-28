# gymma — Flutter

Mobile port of the Gymma gym-discovery web app (Bengaluru). Same data, same features: explore, search + filters, gym detail, compare, owner dashboard, partner form.

## Run

This project ships `lib/`, `pubspec.yaml` and the data asset only. Generate the platform folders once, then run:

```bash
cd gymma_flutter
flutter create .          # scaffolds android/ ios/ etc. (keeps existing lib & pubspec)
flutter pub get
flutter run
```

Requires Flutter SDK 3.3+ (Dart 3).

## Features

- **Explore** — hero search, area chips, stats bar, featured rails (top rated / nearby / affordable), owner CTA.
- **Discover** — search + filter sheet (status, women-friendly, distance, price), sort, grid/map toggle.
- **Gym detail** — cover, identity, chips, price, about, gallery, trainers, plans, facilities, classes, reviews + category scores, FAQs, call/whatsapp/directions/inquiry actions.
- **Compare** — up to 3 gyms side by side; best price & rating highlighted.
- **Owner dashboard** — stats, profile completion, inquiries, announcement composer (demo data).
- **Partner** — demo-request form.

## Notes

- 48 real Bengaluru gyms bundled in `assets/data/gyms.json`.
- Map uses OpenStreetMap tiles → needs internet.
- Gym cover images are Google Places photo URLs; if they fail to load, a gradient + initials fallback is shown.
- Trainers / plans / classes / FAQs / scores are seed-generated per gym (same deterministic logic as the web app).
