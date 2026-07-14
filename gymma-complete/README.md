# Gymma & Fitos - Project Repository

![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20iOS%20%7C%20Android-blue.svg)
![Frontend](https://img.shields.io/badge/Frontend-Next.js%2014%20%7C%20React-blueviolet.svg)
![Mobile](https://img.shields.io/badge/Mobile-Flutter-blue.svg)
![Backend](https://img.shields.io/badge/Backend-Express.js%20%7C%20NestJS-green.svg)
![Database](https://img.shields.io/badge/Database-PostgreSQL%20%7C%20Prisma-informational.svg)

This repository contains the complete ecosystem for **Gymma** and **Fitos**, modern platforms designed for comprehensive gym management (Gymma) and AI-driven fitness tracking & analytics (Fitos). 

## 📖 Project Overview

The ecosystem is broken down into four primary applications:
1. **Gymma API (Core Backend)**: An Express.js REST API handling core user authentication, gym discovery (PostGIS), subscriptions, and member management.
2. **Fitos API (AI/Analytics Backend)**: A NestJS application handling exercise tracking, analytics, adaptive workout plans, and AI vector search.
3. **Gymma Web Portal**: A Next.js application tailored for Gym Owners/Admins to onboard their gyms, manage members, and track gym analytics.
4. **Gymma Mobile App**: A cross-platform Flutter application for end-consumers (gym members) to discover gyms, track workouts, and monitor their fitness journey.

---

## 🛠 Tech Stack

### Frontend (Web)
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS, Radix UI
- **Data Fetching**: React Query, Axios
- **State Management**: Zustand

### Frontend (Mobile)
- **Framework**: Flutter (Dart)
- **Networking**: `http` package
- **State Management**: Provider / ChangeNotifier

### Backend (Express & NestJS)
- **Core API**: Node.js, Express, Zod (Validation), JWT
- **AI/Tracking API**: NestJS, Passport, JWT
- **Database ORM**: Prisma
- **Database Engine**: PostgreSQL with PostGIS extension (for geographic gym queries)
- **Caching**: Redis

---

## 🏗 Infrastructure & Environments

### Database (PostgreSQL)
- **Provider**: [Neon](https://neon.tech/)
- **Dashboard Link**: [Neon Project Dashboard](https://console.neon.tech/app/projects/withered-star-52735375?database=neondb&branchId=br-shiny-river-at3xbs3h)
- **Account**: `fitos.admin@gmail.com`

### Backend APIs
- **Provider**: [Render](https://render.com/)
- **Dashboard Link**: [Render Project Dashboard](https://dashboard.render.com/project/prj-d903niurnols73eaq420)
- **Account**: `fitos.admin@gmail.com`

### Redis (Caching & Rate Limiting)
- **Provider**: [Render](https://render.com/)
- **How to find your Redis Host/URL**: 
  1. Log into your Render Dashboard using the `fitos.admin@gmail.com` account.
  2. Locate your active **Redis** service (marked with a red Redis icon).
  3. Click on the Redis service and scroll down to the **Connections** section. 
  4. Use the **Internal Redis URL** (e.g., `redis://red-xxx:6379`) for the `REDIS_URL` environment variables on your Render-hosted backends. Use the **External Redis URL** if connecting from your local development machine.

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
Ensure you have the following installed on your machine:
- **Node.js** (v18+) & **npm**
- **Flutter SDK**
- **Docker** & **Docker Compose** (for local databases)

### 1. Start Local Infrastructure
Both backends rely on a local PostgreSQL database with PostGIS, and a local Redis instance.
```bash
docker compose up -d
```

### 2. Run the Gymma API (Core)
The core backend handles authentication, user roles, and gym management.
```bash
cd backend/gymma-api
npm install
npm run dev
```
*(Runs locally on `http://localhost:8085`)*

### 3. Run the Fitos API (NestJS)
The NestJS backend handles all workout tracking, AI, and advanced analytics.
```bash
cd fitos/backend
npm install
npm run start:dev
```
*(Runs locally on `http://localhost:3002`, bound to `0.0.0.0` for network access)*

### 4. Run the Gymma Web Portal
The Next.js dashboard used by Gym Owners.
```bash
cd frontend/gymma
npm install
npm run dev
```
*(Runs locally on `http://localhost:3000`)*

### 5. Run the Flutter Mobile App
The consumer-facing application for iOS and Android.
```bash
cd gymma_flutter_api/gymma_flutter
flutter pub get
flutter run
```
**Important note for mobile development**: If testing on a physical device, ensure `api_client.dart` is configured with your machine's local Wi-Fi IP address (e.g., `http://192.168.1.5:8085/api/v1`), otherwise the app will fail to reach your local servers. 

---

## 🔒 Environment Variables
Before running the services, ensure you have duplicated the `.env.example` files into `.env` files in each respective directory and filled in the required secrets (JWT secrets, Database URLs, Redis URLs, etc.).

*This project is strictly for internal development and is closed-source.*
