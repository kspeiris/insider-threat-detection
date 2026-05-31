# 🛡️ ThreatOps - Insider Threat Detection System

<p align="center">
  <strong>User Behavior Analytics and Isolation Forest based platform for detecting risky insider activity, anomalous access patterns, suspicious file behavior, and high-risk security events.</strong>
</p>

<p align="center">
  <img alt="FastAPI" src="https://img.shields.io/badge/FastAPI-0.104-009688?style=for-the-badge&logo=fastapi&logoColor=white">
  <img alt="React" src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=0f172a">
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white">
  <img alt="Docker" src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white">
  <img alt="ML" src="https://img.shields.io/badge/ML-Scikit--learn-F7931E?style=for-the-badge&logo=scikitlearn&logoColor=white">
</p>

---
![Hero image](docs/screenshots/hero.png)

## 📌 Overview

ThreatOps is a full-stack insider threat detection platform built to help security teams monitor employee activity, score user risk, and surface suspicious behavior before it becomes a serious incident.

The system was implemented as a real-time monitoring platform that collects login, logout, file access, USB, process, and privilege-related activity, transforms raw logs into behavioral features, detects anomalies using an Isolation Forest model, calculates hybrid risk scores, generates alerts, and visualizes the organization security posture through a React dashboard.

---

## ✨ Key Features

- 🔐 **JWT Authentication** - secure login flow with token-based protected routes.
- 📊 **Security Dashboard** - live overview of users, active users, high-risk users, critical alerts, trends, and activity charts.
- 🧠 **Isolation Forest Detection** - evaluates user behavior with an unsupervised anomaly detection model.
- 📈 **User Behavior Analytics** - compares new activity against behavioral indicators such as login time, file volume, USB usage, and data transfer.
- 🎯 **Hybrid Risk Scoring** - combines behavioral risk factors and ML anomaly output into Low, Medium, High, or Critical severity.
- 🚨 **Automated Alerts** - creates high and critical alerts for suspicious patterns.
- 👤 **User Investigation View** - inspect risk history, behavioral radar metrics, and force a fresh risk evaluation.
- 📁 **Log Ingestion API** - accepts login, file, USB, and privilege events.
- 🖥️ **Windows and Linux Collectors** - collector scripts for Windows Event Log/Sysmon-style monitoring and Linux `auditd`.
- 🧪 **Simulated Collector** - generates test activity and anomalous behavior for demos.
- 📄 **PDF Security Report Export** - frontend dashboard can generate a polished security intelligence report.
- 📦 **Deployment Files Included** - Docker and Nginx files are included, while local development can run without Docker.

---

## 🏗️ Architecture

```mermaid
flowchart LR
    subgraph Sources["Event Sources"]
        W["Windows Event Logs / Sysmon"]
        L["Linux auditd Collector"]
        S["Simulated Collector"]
    end

    subgraph Backend["FastAPI Backend"]
        API["REST API /api"]
        Auth["JWT Auth"]
        Logs["Log Ingestion"]
        FE["Feature Extractor"]
        UBA["User Behavior Analytics"]
        ML["Isolation Forest Model"]
        Risk["Risk Engine"]
        Alerts["Alert Manager"]
        WS["WebSocket Live Events"]
    end

    subgraph Data["Persistence"]
        DB[("PostgreSQL")]
        Model["model.pkl / scaler.pkl"]
    end

    subgraph Frontend["React Dashboard"]
        UI["ThreatOps UI"]
        Charts["Recharts Analytics"]
        PDF["PDF Report Generator"]
    end

    W --> Logs
    L --> Logs
    S --> Logs
    UI --> API
    API --> Auth
    API --> Logs
    Logs --> DB
    Logs --> Risk
    Risk --> FE
    FE --> DB
    FE --> UBA
    UBA --> ML
    ML --> Risk
    ML --> Model
    Risk --> Alerts
    Alerts --> DB
    API --> DB
    API --> WS
    API --> Charts
    Charts --> UI
    UI --> PDF
```

### 🧩 System Flow

1. Collectors or clients send activity logs to the backend.
2. FastAPI stores events in PostgreSQL.
3. The risk engine extracts user behavior features over a recent time window.
4. The User Behavior Analytics layer compares activity against expected behavioral patterns.
5. The Isolation Forest model classifies behavior as normal or anomalous.
6. The risk engine converts behavior and anomaly evidence into severity levels.
7. High or critical users trigger alerts.
8. React dashboard visualizes KPIs, trends, alerts, and user investigations.
9. Security teams can export a PDF report from the dashboard.

---

## 🧪 Implementation Report Summary

The project implementation report defines the system as a completed real-time behavioral monitoring platform with seven major components:

```text
Windows Event Logs / Sysmon
        |
        v
Log Collection Module
        |
        v
PostgreSQL Database
        |
        v
Feature Extraction Engine
        |
        v
User Behavior Analytics Module
        |
        v
Isolation Forest Model
        |
        v
Risk Scoring Engine
        |
        v
React Monitoring Dashboard
```

The implemented solution demonstrates how raw operating-system events can be transformed into security intelligence by combining event collection, feature engineering, unsupervised anomaly detection, and analyst-focused dashboard views.

---

## 🧰 Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 18, React Router, Tailwind CSS, Recharts, Lucide React, Axios |
| Reports | html2canvas, jsPDF |
| Backend | FastAPI, Uvicorn, SQLAlchemy, Pydantic |
| Security | JWT, python-jose, Passlib, bcrypt |
| Database | PostgreSQL 15 |
| ML/Data | scikit-learn, NumPy, pandas, joblib |
| Collectors | Python, httpx, Windows Event Log, Sysmon-style event monitoring, Linux auditd |
| DevOps | Docker, Docker Compose, Nginx |

---

## 💻 Development Environment

| Category | Specification |
| --- | --- |
| Processor | Intel Core i5/i7 or equivalent |
| Memory | 8GB RAM or higher |
| Storage | 256GB SSD or higher |
| Operating System | Windows 11 for primary development |
| API Testing | Postman or FastAPI Swagger UI |
| Version Control | Git |

---

## 📂 Project Structure

```text
insider-threat-detection/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app, routers, CORS, WebSocket
│   │   ├── models.py                # SQLAlchemy database models
│   │   ├── schemas.py               # Pydantic request/response schemas
│   │   ├── database.py              # DB connection and initialization
│   │   ├── config.py                # Environment-driven settings
│   │   ├── ml/
│   │   │   ├── model.pkl            # Persisted anomaly model
│   │   │   └── scaler.pkl           # Persisted scaler
│   │   ├── routes/                  # Auth, users, alerts, risk, logs, dashboard
│   │   └── services/                # Risk engine and feature extraction
│   ├── seed.py                      # Demo users, logs, risk scores, alerts
│   ├── init_db.py                   # Database initialization helper
│   ├── requirements.txt
│   └── Dockerfile
├── collector/
│   ├── sim_collector.py             # Demo event simulator
│   ├── windows_collector.py         # Windows Security Event collector
│   └── linux_collector.py           # Linux auditd collector
├── frontend/
│   ├── src/
│   │   ├── App.js                   # Protected routes
│   │   ├── components/Layout.js     # Sidebar and app shell
│   │   ├── pages/                   # Login, Dashboard, Alerts, User Analysis
│   │   └── services/api.js          # Axios API client
│   ├── public/
│   ├── package.json
│   ├── tailwind.config.js
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## 🚀 Quick Start

### ✅ Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL 15 or compatible local PostgreSQL server
- Git
- Docker Desktop is optional

### 🧑‍💻 Run Locally Without Docker

Start PostgreSQL and create a database named `threat_db`. Then configure `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/threat_db
SECRET_KEY=change-this-secret-in-production
MODEL_PATH=app/ml/model.pkl
SCALER_PATH=app/ml/scaler.pkl
```

Start the backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python init_db.py
python run.py
```

Start the frontend in a second terminal:

```bash
cd frontend
npm install
npm start
```

Application URLs:

- 🌐 Frontend: `http://localhost:3000`
- ⚙️ Backend API: `http://localhost:8000`
- 📚 API Docs: `http://localhost:8000/docs`
- 🗄️ PostgreSQL: `localhost:5432`

Default admin account created by `init_db.py`:

```text
Username: admin
Password: admin123
```

### 🌱 Seed Demo Data

Run the seed script from the backend environment after the database is initialized:

```bash
cd backend
python seed.py
```

Seeded demo users use:

```text
Password: password123
```

Example usernames include `alice.smith`, `bob.jones`, `charlie.brown`, `dave.williams`, and `eve.hacker`.

---

## ⚙️ Manual Development Setup

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Create a `.env` file if you want to override defaults:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/threat_db
SECRET_KEY=change-this-secret-in-production
MODEL_PATH=app/ml/model.pkl
SCALER_PATH=app/ml/scaler.pkl
```

### Frontend

```bash
cd frontend
npm install
npm start
```

The frontend API client currently targets:

```text
http://localhost:8000/api
```

### 🐳 Optional Docker Run

The project still includes Docker files for deployment or demonstration environments:

```bash
docker compose up --build
```

---

## 🧠 Risk Scoring Logic

ThreatOps extracts behavioral features for each user, including:

- Login hour and login frequency
- Total logins
- Late-night logins
- Late-night login ratio
- Total file accesses
- Unique files accessed
- USB connection count
- Data transferred in GB
- Privilege-related activity through the privilege log API
- Average files accessed per login

The ML service loads `model.pkl` and `scaler.pkl` when available. The project report uses Isolation Forest as the selected algorithm because it supports unsupervised anomaly detection, works without labeled attack data, and is efficient for behavioral monitoring.

Example Isolation Forest training concept:

```python
from sklearn.ensemble import IsolationForest

model = IsolationForest(
    contamination=0.05,
    random_state=42
)

model.fit(X_train)
```

Model output:

```text
 1 = Normal Behavior
-1 = Anomalous Behavior
```

The final risk score combines anomaly evidence with behavior indicators such as late-night activity, mass file access, USB usage, and privilege escalation signals.

Risk levels:

| Score Range | Risk Level |
| --- | --- |
| `0 - 30` | Low |
| `31 - 60` | Medium |
| `61 - 80` | High |
| `81 - 100` | Critical |

---

## 🔎 Detection Scenarios

The implementation report validates the system using common insider-threat simulations:

| Scenario | Example Behavior | Expected Result |
| --- | --- | --- |
| Abnormal Login Time | User logs in at `02:00 AM` instead of normal work hours | Medium risk alert |
| Mass File Access | User accesses hundreds or thousands of files | High risk alert |
| USB Data Exfiltration | Large data transfer to a removable device | Critical risk alert |
| Privilege Escalation | User role changes to administrator or privileged action occurs | Critical risk alert |

These scenarios can be recreated with `collector/sim_collector.py` or through direct calls to the log ingestion endpoints.

---

## 🔌 API Endpoints

| Area | Endpoint | Purpose |
| --- | --- | --- |
| Health | `GET /health` | Service health check |
| Auth | `POST /api/auth/register` | Register user |
| Auth | `POST /api/auth/token` | Login and receive JWT |
| Auth | `GET /api/auth/me` | Current authenticated user |
| Dashboard | `GET /api/dashboard/stats` | KPI summary |
| Dashboard | `GET /api/dashboard/risk-trends` | Average risk trend |
| Dashboard | `GET /api/dashboard/top-risky-users` | Highest risk users |
| Dashboard | `GET /api/dashboard/alerts-distribution` | Alert severity distribution |
| Dashboard | `GET /api/dashboard/hourly-activity` | Login/file activity by hour |
| Users | `GET /api/users` | List active users |
| Users | `GET /api/users/{user_id}` | Get user profile |
| Users | `GET /api/users/{user_id}/risk-history` | User risk history |
| Users | `GET /api/users/{user_id}/features` | Behavioral radar features |
| Users | `POST /api/users/{user_id}/evaluate` | Force risk evaluation |
| Risk | `GET /api/risk/scores` | Latest risk scores |
| Risk | `POST /api/risk/evaluate/{user_id}` | Evaluate risk for user |
| Alerts | `GET /api/alerts` | List alerts |
| Alerts | `PUT /api/alerts/{alert_id}/resolve` | Resolve alert |
| Alerts | `PUT /api/alerts/{alert_id}/investigate` | Mark alert as investigating |
| Logs | `POST /api/logs/login` | Add login event |
| Logs | `POST /api/logs/file` | Add file event |
| Logs | `POST /api/logs/usb` | Add USB event |
| Logs | `POST /api/logs/privilege` | Add privilege event |
| Live Events | `WS /ws/live-events` | Broadcast live event messages |

---

## 🖥️ Collectors

### 🧪 Simulated Collector

Use this for demos and testing. It sends normal user activity for most users and anomalous activity for a suspicious user.

```bash
cd collector
python sim_collector.py
```

### 🪟 Windows Collector

Collects Windows Security Event Log activity such as logons, file access, and privilege events. The implementation report also describes Microsoft Sysmon as a monitoring source for process creation, file activity, USB device activity, and user login events.

```bash
cd collector
python windows_collector.py
```

Run as Administrator for best access to Windows security logs.

Recommended Windows monitoring sources:

```text
Successful logon events
Failed logon events
File access events
USB device activity
Process execution events
Special privilege events
```

### 🐧 Linux Collector

Uses `auditd` and `ausearch` to collect login, file, and process events.

```bash
sudo apt-get install auditd audispd-plugins
sudo systemctl start auditd
cd collector
python linux_collector.py
```

---

## 📸 Screenshots

Add screenshots to `docs/screenshots/` and update the image paths below.

### 🔐 Login

![Login Screen](docs/screenshots/login.png)

### 📊 Security Dashboard

![Security Dashboard](docs/screenshots/dashboard.png)
![Security Dashboard](docs/screenshots/dashboard2.png)
### 🚨 Active Alerts

![Active Alerts](docs/screenshots/alerts.png)

### 👤 User Investigation

![User Investigation](docs/screenshots/user-analysis.png)

### 📄 Generated Security Report

![Security Report](docs/screenshots/security-report.png)

---

## 📄 Report Generation

The dashboard includes a built-in **Generate Report** action that creates a PDF security intelligence report from current dashboard data.

The report includes:

- Executive KPI cards
- Network risk trend
- Alert severity distribution
- Hourly system activity
- Top risky users table
- Confidential security report styling

This supports the project report requirement to present the implemented system, current security state, and actionable alerts in a professional format.

---

## 🗄️ Database Models

| Model | Purpose |
| --- | --- |
| `User` | System user profile, department, role, authentication state |
| `LoginLog` | Login/logout events, IP address, host |
| `FileLog` | File activity, path, action, size, timestamp |
| `USBLog` | USB device events and transferred data |
| `PrivilegeLog` | Sudo/admin/role-change activity |
| `RiskScore` | Calculated score, risk level, anomaly score |
| `Alert` | Security alert with severity, description, status |

---

## 🔐 Security Notes

- Change `SECRET_KEY` before production deployment.
- Replace default database credentials in `docker-compose.yml`.
- Use HTTPS and secure cookie/session practices in production.
- Restrict CORS origins to trusted frontend domains.
- Validate collector identity before accepting production log events.
- Store ML models and sensitive data with proper access controls.

---

## 🧪 Useful Commands

```bash
# Backend development server
cd backend && python run.py

# Frontend development server
cd frontend && npm start

# Initialize database and admin user
cd backend && python init_db.py

# Generate demo data
cd backend && python seed.py

# Run simulated collector
cd collector && python sim_collector.py

# Optional Docker run
docker compose up --build
```

---

## 🛣️ Future Improvements

- Role-based access control for analysts and admins.
- Real-time frontend WebSocket feed for incoming events.
- Alert timeline and investigation notes.
- Configurable risk thresholds per department.
- Model training pipeline and evaluation metrics.
- Collector authentication with API keys or mTLS.
- Exportable CSV/JSON audit evidence bundles.

---

## 👥 Intended Users

ThreatOps is designed for:

- SOC analysts
- Security administrators
- Risk and compliance teams
- Cybersecurity students and researchers
- Internal monitoring proof-of-concept projects

---

