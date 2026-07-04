# Gymma & Fitos - Project Repository

This repository contains the complete ecosystem for Gymma and Fitos, including the frontend web applications, backend APIs, and the Flutter mobile application.

## 🏗 Infrastructure & Environments

### Database (PostgreSQL)
- **Provider**: [Neon](https://neon.tech/)
- **Dashboard Link**: [Neon Project Dashboard](https://console.neon.tech/app/projects/withered-star-52735375?database=neondb&branchId=br-shiny-river-at3xbs3h)
- **Account**: `fitos.admin@gmail.com`

### Backend APIs (Express & NestJS)
- **Provider**: [Render](https://render.com/)
- **Dashboard Link**: [Render Project Dashboard](https://dashboard.render.com/project/prj-d903niurnols73eaq420)
- **Account**: `fitos.admin@gmail.com`

### Redis (Caching & Rate Limiting)
- **Provider**: [Render](https://render.com/)
- **How to find Redis Host/URL**: 
  1. Log into your Render Dashboard using the `fitos.admin@gmail.com` account.
  2. In your main dashboard or within the Project, look for a service with a red Redis icon (e.g., "gymma-redis" or "fitos-redis").
  3. Click on the Redis service.
  4. Scroll down to the **Connections** section. 
  5. Here you will find the **Internal Redis URL** (e.g., `redis://red-xxx:6379`) which should be used as the `REDIS_URL` environment variable for your backend services hosted on Render. You'll also see an **External Redis URL** if you ever need to connect to it from your local machine.

### Frontend Web Applications

**1. Admin Portal**
- **Provider**: [Vercel](https://vercel.com/)
- **Account**: `fitos.admin@gmail.com`

**2. Main Consumer Webpage (Gymma)**
- **Provider**: [Vercel](https://vercel.com/)
- **Account**: `dhanush.d2209@gmail.com`

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js & npm
- Flutter SDK
- Docker (for local database & redis)

### Running the Backends
1. **Start Local Infrastructure** (Database & Redis):
   ```bash
   docker compose up -d
   ```
2. **Start Gymma API (Core)**:
   ```bash
   cd backend/gymma-api
   npm install
   npm run dev
   ```
3. **Start Fitos API (NestJS)**:
   ```bash
   cd fitos/backend
   npm install
   npm run start:dev
   ```

### Running the Frontend
```bash
cd frontend/gymma
npm install
npm run dev
```

### Running the Mobile App
```bash
cd gymma_flutter_api/gymma_flutter
flutter run
```
*(Ensure `api_client.dart` is configured with your local Wi-Fi IP address if you are testing on a physical device, otherwise it will fail to reach the local servers).*
