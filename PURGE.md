# PURGE.md — leaked secrets & git-history remediation

Deleting the leaked files from the working tree (done in this batch) removes them
from the **current** commit going forward, but the secrets **still exist in git
history** and in every clone/fork/CI cache. Anyone with the repo can `git log -p`
and recover them. This file tracks what leaked and what remains to do.

## Status

- [x] Neon Postgres password rotated (done by owner, out of band)
- [x] Render Redis credentials rotated (done by owner, out of band)
- [x] Leaked debug scripts deleted from working tree (this batch — 13 files)
- [ ] **Google Maps API key rotated** (see below — NOT yet done)
- [ ] **fitos JWT keypair regenerated** (see below — NOT yet done)
- [ ] Git history purged of all secrets below
- [ ] Force-push cleaned history + notify collaborators to re-clone

## Secrets that were / still are in the repo

| Secret | Type | Where | Rotated? |
|---|---|---|---|
| `npg_NRmg4Goc1UpH` (Neon Postgres pw) | DB credential | 13 deleted debug scripts (still in history) | ✅ rotated |
| `rediss://red-d90493e7...render.com:6380` | Redis credential | `broadcast-api/check_redis.js` (deleted, still in history) | ✅ rotated |
| `AIzaSyDifVRrrSRbS-WVrmnuZZyaii6QmjAp5Ow` | Google Maps/Places API key | `gyms.json` (×3263), `gymma_flutter_api/.../assets/data/gyms.json` — **still tracked, NOT deleted** | ❌ ROTATE |
| `fitos/backend/keys/private.key` | RSA private key | committed, **still tracked** (not referenced from src/ — may be dead, but treat as compromised) | ❌ REGENERATE |
| Firebase Android/iOS API keys (`AIzaSy...`) | client-embedded keys | `google-services.json`, `GoogleService-Info.plist` | low risk — client keys, restrict by app signing/SHA + API restrictions |
| Neon/Render dashboard URLs + `fitos.admin@gmail.com`, `dhanush.d2209@gmail.com` | infra URLs + account emails | root `README.md` lines 47–70 | not a credential; scrub if repo goes public |

## History purge (run after confirming rotations)

Use `git filter-repo` (preferred) or BFG. This **rewrites history** — coordinate
with everyone who has a clone; they must re-clone afterward.

```bash
# 1) Fresh mirror clone (safety)
git clone --mirror <repo-url> gymma-purge.git && cd gymma-purge.git

# 2) Strip the leaked paths from ALL history
git filter-repo \
  --path check_mig.js --path test_db.js \
  --path broadcast-api/check_db.js --path broadcast-api/check_redis.js \
  --path broadcast-api/db_audit.js --path broadcast-api/fix_db.js \
  --path diet_suggestion/check_db.js --path diet_suggestion/check_mig.js \
  --path diet_suggestion/test_db.js --path diet_suggestion/fix_db.js \
  --path diet_suggestion/full_audit.js --path diet_suggestion/verify_tables.js \
  --path diet_suggestion/check_any_schema.js \
  --path fitos/backend/keys/private.key \
  --invert-paths

# 3) Also scrub the still-live secret strings from surviving files' history
#    (gyms.json keeps its structure but the key is redacted everywhere)
git filter-repo --replace-text <(cat <<'EOF'
npg_NRmg4Goc1UpH==>REDACTED
AIzaSyDifVRrrSRbS-WVrmnuZZyaii6QmjAp5Ow==>REDACTED
EOF
)

# 4) Push rewritten history (coordinate first — everyone re-clones)
git push --force --mirror <repo-url>
```

After the push: rotate the Google Maps key, regenerate the fitos keypair, and
have all collaborators delete their local clones and re-clone.
