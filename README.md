# Edge AI Vehicle Health & Predictive Maintenance 🚀

> **Team Hackaholics** submission for **InnoVent-27: AI at the Edge** 
> *Developing solutions addressing key challenges in Automotive, Industrial Heavy Machinery, and Aerospace industries.*

An advanced, edge-simulated, real-time telemetry and predictive maintenance platform. This project leverages AI, Generative AI, and IoT simulation to enable real-time processing, faster decisions, improved efficiency, and intelligent automation at the source.

---

## 📸 Screenshots

| Fleet Dashboard | Telemetry Stream |
| :---: | :---: |
| <img src="docs/fleet.png" width="400" alt="Dashboard showing fleet health and total vehicles"/> | <img src="docs/dashboard.png" width="400" alt="Live engine telemetry stream"/> |

| AI Agentic Diagnosis | Predictive Maintenance (RUL) |
| :---: | :---: |
| <img src="docs/diagnostics.png" width="400" alt="Chat interface diagnosing engine faults"/> | <img src="docs/maintenance.png" width="400" alt="Remaining useful life of components"/> |

---

## 🎯 The Problem & Our Solution

**The Challenge:** Heavy machinery and commercial vehicle breakdowns cost billions annually. Traditional telemetry data is often sent to the cloud raw, resulting in high latency, massive bandwidth costs, and delayed decision-making.

**The Solution:** We push the intelligence to the edge. By running simulation and anomaly detection locally, we only transmit critical state changes (batched) to the cloud. When an anomaly occurs, our **Agentic AI** kicks in to diagnose the root cause in real-time, drastically reducing downtime.

---

## ✨ Key Features (MVP)

- **Real-Time IoT Telemetry Simulation:** A custom engine streaming sensor data (engine temp, oil pressure, RPM) via Server-Sent Events (SSE) directly to the frontend.
- **Agentic AI Diagnostics:** Integration with **Google Gemini (Flash Lite)** to analyze real-time engine context and provide actionable diagnostic steps when an anomaly is detected.
- **Predictive Maintenance (RUL):** Uses degradation algorithms to calculate the Remaining Useful Life (RUL) of critical components and predict service dates.
- **Enterprise-Grade Multi-Tenancy:** Secure data isolation using PostgreSQL and NextAuth, ensuring fleets only see their own vehicle data.
- **High-Frequency Data Batching:** An asynchronous, in-memory buffering system that batches IoT data writes to PostgreSQL, preventing connection exhaustion.
- **Cursor-Based Pagination:** O(1) database queries for the anomaly logs to handle massive time-series datasets efficiently.

---

## 🏗 Architecture

Our system is built on a modern, decoupled architecture designed for scale and edge performance:

```mermaid
graph TD
    subgraph "Edge Node (Vehicle)"
        Sim[IoT Engine Simulator]
        Sensors[Sensor Data]
        AD[Anomaly Detection]
        Sim --> Sensors
        Sensors --> AD
    end

    subgraph "Cloud Backend (Next.js Serverless)"
        API[SSE Telemetry API]
        Batch[Memory Buffer & Flusher]
        Auth[NextAuth Session Manager]
    end
    
    subgraph "External APIs"
        Gemini[Google Gemini API]
    end

    subgraph "Persistence"
        DB[(PostgreSQL)]
    end

    subgraph "Client App"
        UI[Fleet Dashboard UI]
        AI[Agentic AI Chat]
    end

    AD -- Server-Sent Events --> API
    API -- Streams Data --> UI
    API -- Buffers Data --> Batch
    Batch -- Bulk Inserts (5s) --> DB
    UI -- Auth Check --> Auth
    Auth -- Validates --> DB
    AI -- Analyzes Context --> Gemini
```

---

## 🛠 Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Recharts
- **Backend:** Next.js Serverless API Routes, Server-Sent Events (SSE)
- **Database:** PostgreSQL (via Docker), Prisma ORM
- **Authentication:** NextAuth.js (JWT Strategy)
- **AI Integration:** Google Generative AI SDK (`gemini-3.1-flash-lite`)

---

## 🚀 Getting Started (Local Development)

### 1. Prerequisites
- Node.js (v20+)
- Docker Desktop (for local PostgreSQL)
- Google Gemini API Key

### 2. Clone the Repository
```bash
git clone https://github.com/DivyaMishra896/edge-ai-vehicle-health.git
cd edge-ai-vehicle-health
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory and copy the contents from `.env.example`:
```bash
# Database - points at a local Postgres container on port 5433
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/edgeai?schema=public
DIRECT_URL=postgresql://postgres:postgres@localhost:5433/edgeai?schema=public

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.1-flash-lite

# NextAuth
NEXTAUTH_SECRET=edgeai-local-dev-secret-change-me
NEXTAUTH_URL=http://localhost:3000
```

### 4. Start the Database
Spin up the local PostgreSQL instance using Docker:
```bash
docker run -d --name edgeai-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=edgeai -p 5433:5432 postgres:16
```

### 5. Run Database Migrations & Seeding
This will create the necessary tables and populate the default Fleet Admin account and 5 simulation vehicles.
```bash
npx prisma migrate deploy
npx prisma generate
npx prisma db seed
```

### 6. Start the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Default Login Credentials:**
- **Email:** `admin@edgeai.com`
- **Password:** `admin123`

---

## 📊 Current Status of the MVP

The project is currently a **fully functional prototype** ready for hackathon demonstration. 
- ✅ **Completed:** Real-time telemetry simulation (SSE), multi-tenant secure database backend (PostgreSQL + NextAuth), asynchronous DB write batching, and Agentic AI diagnostic chat (Gemini).
- ✅ **Completed:** Cursor-based pagination for handling deep anomaly logs and dynamic Remaining Useful Life (RUL) algorithms.
- 🚧 **Simulated Constraints:** The "Edge Node" is currently simulated via server-side intervals due to hackathon time constraints and the lack of physical hardware. The telemetry logic represents exactly how the C++ edge software would function on actual vehicle ECUs.

---

## 🔮 Future Scope

- **True Edge Deployment:** Port the simulation engine into a lightweight Rust or C++ daemon to run directly on physical Raspberry Pi or vehicle ECUs.
- **Federated Learning:** Train anomaly detection models locally on the edge node without sending raw data to the cloud.
- **TimescaleDB Integration:** Move from standard PostgreSQL tables to TimescaleDB hypertables for optimized time-series storage at massive scale.
- **Over-The-Air (OTA) Updates:** Ability to push new predictive maintenance algorithms directly to the edge nodes.

---

## 👥 Team Hackaholics

- **Vaidehi Dadheech**
- **Divya Mishra**
- **Devansh Bansal**
- **Abhinav Atul**
- **Krish Goyal**
