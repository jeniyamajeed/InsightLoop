# Running InsightLoop

InsightLoop is a customer-outcome validation platform built using a Spring Boot microservices backend, an Angular 17 frontend, and a MySQL database.

This document guides you through running the application using **Docker (recommended)** or **locally** on your host machine.

---

## 🚀 1. Run the Entire Platform (Docker - Recommended)

Docker Compose builds and orchestrates all the services, setting up database instances, internal networking, and host port forwarding.

### Prerequisites
* **Docker Desktop** installed and running on your system.

### Steps to Run
1. Make sure your environment variables are configured. If you don't have a `.env` file yet, copy it from the example:
   ```powershell
   cp .env.example .env
   ```
2. Build and launch all services in detached mode:
   ```powershell
   docker compose up --build -d
   ```
3. Once running, verify all containers are active:
   ```powershell
   docker ps
   ```

### Surface URLs (Docker Mode)
When running via Docker, the services are available on the following host ports (note that the API Gateway maps to `8090` to avoid conflicts on `8080`):

| Service / Surface | URL | Port |
| :--- | :--- | :--- |
| **Frontend SPA** | [http://localhost:4200](http://localhost:4200) | `4200` |
| **API Gateway** | [http://localhost:8090](http://localhost:8090) | `8090` |
| **Auth Service Swagger** | [http://localhost:8081/swagger-ui.html](http://localhost:8081/swagger-ui.html) | `8081` |
| **Feedback Service Swagger** | [http://localhost:8082/swagger-ui.html](http://localhost:8082/swagger-ui.html) | `8082` |
| **Validation Service Swagger** | [http://localhost:8083/swagger-ui.html](http://localhost:8083/swagger-ui.html) | `8083` |
| **Escalation Service Swagger** | [http://localhost:8084/swagger-ui.html](http://localhost:8084/swagger-ui.html) | `8084` |
| **MySQL Database** | `localhost:3306` (Credentials: `root` / `root`) | `3306` |

### Stopping Docker Services
To stop all containers and remove the volumes (useful for clean slates):
```powershell
docker compose down -v
```

---

## 💻 2. Run Locally (Without Docker)

If you prefer to run the services directly on your host machine, you can launch them individually or use the automated PowerShell runner script.

### Prerequisites
* **Java 17** & **Maven** (configured on your system path).
* **Node.js 20+** & **Angular CLI** (`npm install -g @angular/cli`).
* A local **MySQL 8** server running on port `3306` with credentials matching your `.env` configuration (default: root password `root`).

### Steps to Run
Run the provided runner script in PowerShell:
```powershell
./run_locally.ps1
```
This script will:
1. Detect your local MySQL service.
2. Load environment variables from `.env`.
3. Locate `mvn` and `node` on your system.
4. Launch each Spring Boot service in its own terminal window.
5. Boot up the Angular application proxying to the API Gateway.

### Surface URLs (Local Mode)
In local mode, services run directly on your host network loopback:

| Service / Surface | URL | Port |
| :--- | :--- | :--- |
| **Frontend SPA** | [http://localhost:4200](http://localhost:4200) | `4200` |
| **API Gateway** | [http://localhost:8080](http://localhost:8080) | `8080` |
| **Auth Service** | [http://localhost:8081](http://localhost:8081) | `8081` |
| **Feedback Service** | [http://localhost:8082](http://localhost:8082) | `8082` |
| **Validation Service** | [http://localhost:8083](http://localhost:8083) | `8083` |
| **Escalation Service** | [http://localhost:8084](http://localhost:8084) | `8084` |

---

## 🔑 3. Seed Credentials

When the platform boots for the first time, default users are automatically seeded with different levels of access. You can log in immediately using these credentials:

| Role | Email | Password | Allowed Features |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@insightloop.com` | `Admin@123` | View Dashboard, Create/Modify commitments, Manage escalations, Admin CRUD (Users & Roles) |
| **MANAGER** | `manager@insightloop.com` | `Manager@123` | View Dashboard, Create/Modify commitments, Manage escalations |
| **AGENT** | `agent@insightloop.com` | `Agent@123` | Create commitments, Manage escalations, View dashboard |

---

## 🛠️ 4. Troubleshooting

### 1. Port 8080 is already in use
* **Symptom:** Docker container `insightloop-gateway` fails to start with: `bind: Only one usage of each socket address is normally permitted.`
* **Fix:** The host port `8080` has been changed to `8090` in `docker-compose.yml` to prevent conflict with other system processes (like `AgentService.exe`). Use `http://localhost:8090` to send requests directly to the gateway under Docker.

### 2. Spring Boot connection timeout to MySQL
* **Symptom:** Services crash or throw DB connection exceptions during startup.
* **Fix:** If running in Docker, the gateway and services wait for the MySQL health check to pass. If running locally, make sure your MySQL server is running on port `3306` and credentials in `.env` match your database root credentials.
