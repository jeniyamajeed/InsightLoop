# InsightLoop

**From customer feedback to confirmed resolution.**

InsightLoop is a customer-outcome validation platform that complements post-interaction feedback. It verifies whether a promised customer outcome (refund, card replacement, account correction, technician visit, service activation) was actually delivered after a support interaction. If the customer confirms the issue is unresolved after the promised due date, InsightLoop automatically creates a high-priority escalation.

This repository is a full working microservices implementation built for the technical assessment. It satisfies the required User Management & RBAC scope and extends it with the InsightLoop domain (interactions, commitments, delayed validation, escalations, analytics).

---

## 🛠️ Technology Stack

InsightLoop is built using a modern, scalable, and secure technology stack:

### Frontend (Single Page Application)
* **Core:** Angular 17 (TypeScript) utilizing reactive Signals for fast, state-driven UI updates.
* **Styling:** Premium Vanilla CSS design system with micro-animations, glassmorphism, and responsive grids.
* **Web Server:** Nginx (used for containerized reverse proxy routing).

### Backend (Microservices)
* **Language & SDK:** Java 17.
* **Framework:** Spring Boot 3.3.4 (Spring Data JPA, Hibernate, Spring Security).
* **Gateway & Router:** Spring Cloud Gateway (routing `/api/**` to downstream services, verifying and forwarding JWT user info).

### Databases & Infrastructure
* **Database:** MySQL 8.0 (Schema-per-service pattern for complete microservice data isolation).
* **Orchestration:** Docker, Docker Compose.
* **Automation:** PowerShell runner scripts for streamlined local environment setup.

---

## Table of Contents

- [Architecture](#architecture)
- [Seed Credentials](#seed-credentials)
- [How to Run (Docker)](#how-to-run-docker)
- [How to Setup & Run (Locally)](#how-to-setup--run-locally)
- [Frontend Screens](#frontend-screens)
- [Role-Based Access Control](#role-based-access-control)
- [Design Decisions](#design-decisions)
- [Assumptions](#assumptions)
- [Bonus Checklist](#bonus-checklist)
- [Project structure](#project-structure)

---

## Architecture

```text
                       ┌───────────────────────────┐
                       │      Angular 17 SPA       │  :4200 (nginx)
                       └────────────┬──────────────┘
                                    │  HTTPS + Bearer JWT
                                    ▼
                       ┌───────────────────────────┐
                       │  Spring Cloud API Gateway │  :8080 (Local) / :8090 (Docker)
                       │  • JWT verification       │
                       │  • Forwards X-User-Id     │
                       │  • Routes /api/**         │
                       └────┬──────────┬────────┬──┘
                             │          │        │
         ┌───────────────────┘          │        └────────────────┐
         ▼                              ▼                         ▼
┌──────────────┐  ┌────────────────┐  ┌───────────────────┐  ┌──────────────────┐
│ auth-service │  │feedback-service │  │validation-service│  │escalation-service│
│    :8081     │  │     :8082       │  │      :8083       │  │      :8084       │
│ users, roles │  │ interactions,   │  │ commitments,     │  │ escalation queue,│
│ permissions, │  │ immediate CSAT  │  │ scheduled        │  │ audit log        │
│ JWT issuance │  │                 │  │ validation       │  │                  │
└──────┬───────┘  └────────┬────────┘  └_________┬________┘  └────────┬─────────┘
       │                   │                     │                    │
       └───────────────────┴──────────┬──────────┴────────────────────┘
                                      ▼
                            ┌─────────────────────┐
                            │    MySQL 8          │  :3306 (Local) / :3307 (Docker)
                            │  schema-per-service │
                            └─────────────────────┘

---

## Seed Credentials

On startup, Flyway and Spring seeds three default users for verification:

| Role | Email | Password | Permissions & Actions |
|---|---|---|---|
| **ADMIN (Super Admin)** | `admin@insightloop.com` | `Admin@123` | Full access, user CRUD, role management, edit/delete commitments. |
| **MANAGER** | `manager@insightloop.com` | `Manager@123` | View dashboard, edit/delete commitments and support logs. |
| **AGENT** | `agent@insightloop.com` | `Agent@123` | View dashboard, create/edit commitments and support logs. |


---

## How to Run (Docker)

Docker Compose containerizes the entire microservice architecture, separating databases and routing traffic.

### 1. Configure Port Mappings
To prevent port conflicts with services running on your local machine, host ports are mapped as follows:
* **Gateway (Public Entrypoint):** Host port **`8090`** (forwards to `8080` internally).
* **MySQL Database:** Host port **`3307`** (forwards to `3306` internally).

### 2. Start the Application
Create a `.env` file (if not present) and run Docker Compose:
```bash
cp .env.example .env
docker compose up --build
```

### 3. Access URLs
* **Frontend:** [http://localhost:4200](http://localhost:4200)
* **API Gateway (Docker):** [http://localhost:8090](http://localhost:8090)
* **Auth Swagger UI:** [http://localhost:8081/swagger-ui.html](http://localhost:8081/swagger-ui.html)
* **Feedback Swagger UI:** [http://localhost:8082/swagger-ui.html](http://localhost:8082/swagger-ui.html)
* **Validation Swagger UI:** [http://localhost:8083/swagger-ui.html](http://localhost:8083/swagger-ui.html)
* **Escalation Swagger UI:** [http://localhost:8084/swagger-ui.html](http://localhost:8084/swagger-ui.html)

### 4. Shut Everything Down
```bash
docker compose down -v
```

---

## How to Setup & Run (Locally)

Running locally without Docker runs the Spring Boot apps and Angular server directly on your operating system.

### Prerequisites
* **Java 17 SDK** (Amazon Corretto, Temurin, or Oracle JDK)
* **Maven 3.8+**
* **Node.js v20+**
* **MySQL Server** (running on default port **`3306`** with credentials `root` / `root`)

### 1. Database Setup
Ensure your local MySQL service is running. Create the four isolated databases required for the microservices:
```sql
CREATE DATABASE auth_db;
CREATE DATABASE feedback_db;
CREATE DATABASE validation_db;
CREATE DATABASE escalation_db;
```

### 2. Automate Local Startup (PowerShell Runner)
You can use the helper PowerShell script to locate Maven/Node, load env settings, start all 5 Spring Boot microservices, and compile the Angular development server:
```powershell
./run_locally.ps1
```

### 3. Manual Local Startup
If starting services manually, run `mvn spring-boot:run` in the directory of each backend service, and `npm start` in the frontend directory:
1. **auth-service:** `cd services/auth-service` -> `mvn spring-boot:run` (Runs on port `8081`)
2. **feedback-service:** `cd services/feedback-service` -> `mvn spring-boot:run` (Runs on port `8082`)
3. **validation-service:** `cd services/validation-service` -> `mvn spring-boot:run` (Runs on port `8083`)
4. **escalation-service:** `cd services/escalation-service` -> `mvn spring-boot:run` (Runs on port `8084`)
5. **api-gateway:** `cd services/api-gateway` -> `mvn spring-boot:run` (Runs on port `8080`)
6. **frontend:** `cd frontend` -> `npm install` -> `npm start` (Runs on port `4200`)

### 4. Access URLs (Local Mode)
* **Frontend:** [http://localhost:4200](http://localhost:4200)
* **API Gateway (Local):** [http://localhost:8080](http://localhost:8080)

---

## Frontend screens

1. **Login** — email/password.
2. **Dashboard** — 6 KPIs: Immediate CSAT 84%, Actual Resolution 61%, Resolution Gap 23%, Commitments Due Today 12, Overdue 8, Open Escalations 6.
3. **Interactions & immediate feedback** — list + CSAT capture.
4. **Create commitment** — form.
5. **Commitments list** — filters, status badges.
6. **Commitment detail with audit timeline** — full lifecycle.
7. **Validation response simulator** — POST resolved / unresolved response as a customer.
8. **Escalation queue** — priority, owner, SLA.
9. **Analytics** — charts.
10. **Admin: users and roles** — full CRUD, role assignment (ADMIN only).

---

## Role-based access control

**Roles:** `ADMIN`, `MANAGER`, `AGENT`, `USER`.

**Permissions:** `user:read`, `user:write`, `commitment:read`, `commitment:write`, `escalation:read`, `escalation:manage`, `analytics:read`.

**Custom Direct Permissions Overrides:**
* Admins can assign a list of **custom direct permissions** to individual users in the Admin dashboard.
* **Override Logic:** If a user is assigned any direct permissions, the system evaluates their access using *only* those direct permissions, completely overriding the default permissions of their assigned roles. This enables admins to revoke individual permissions (like removing `commitment:write` to restrict creation/editing) without changing the user's base role.
* If a user's custom direct permissions list is empty, the system automatically falls back to evaluating permissions using the union of their roles' default permissions.

**Admin-Only Permissions Safeguard:**
* User management permissions (`user:read` and `user:write`) are strictly reserved for the `ADMIN` role.
* To prevent accidental or unauthorized assignment of user management privileges to `AGENT` or `MANAGER` accounts, the permissions selection list in the Admin panel dynamically filters out and hides `user:read` and `user:write` unless the target user's role list includes `ADMIN`.

**Enforcement — three layers:**

1. **Gateway** verifies JWT signature, extracts roles, injects `X-User-Id` + `X-User-Roles` headers to downstream services.
2. **Each service** independently verifies JWT (defense-in-depth) and enforces access with Spring Security `@PreAuthorize("hasRole('ADMIN')")` + a custom `PermissionEvaluator`.
3. **Frontend** guards routes with `authGuard` + `roleGuard(['ADMIN'])` and hides UI elements via reactive permission checks and signal-based guards.

This guarantees the assessment's requirement that RBAC is enforced in both backend and UI.

---

## Design decisions

- **Database-per-service (schema-per-service):** each service owns its schema and does not query another service's tables. Kept in a single MySQL container for dev simplicity; production would use separate instances.
- **Synchronous REST between services (WebClient):** simpler to review, no broker setup. Kafka/RabbitMQ noted as future work for true decoupling of the validation→escalation flow.
- **HS256 shared secret for JWT (not JWKS):** every service can independently verify tokens without runtime dependency on auth-service. `JWT_SECRET` is set via env in `.env`.
- **Gateway is the only public entrypoint:** downstream services are on the internal Docker network and are reachable only via the gateway. Swagger UIs are exposed for reviewer convenience — you would disable them in production.
- **Flyway migrations per service:** each service manages its own schema, no shared DDL.
- **No service discovery (Eureka/Consul):** services address each other by docker-compose service name. Noted as production improvement.

---

## Assumptions

- Default validation window is **48 hours** after commitment due date.
- Single-tenant; no organisation model.
- English-only UI.
- Passwords hashed with BCrypt (strength 10).
- JWT expiry: 8 hours.
- CORS: gateway allows the frontend origin.
- Scheduled validation job runs every 5 minutes (`@Scheduled(fixedDelay = 300000)`).

---

## Bonus checklist

- [x] **Dockerized** — full stack via `docker compose up`.
- [x] **Microservices architecture** — 4 domain services + gateway.
- [x] **RBAC middleware/guards** — Spring `@PreAuthorize` + custom `PermissionEvaluator` + Angular functional guards + `*hasPermission` directive.
- [x] **Edge cases handled** — duplicate email on register (409), invalid credentials (401), missing role on assignment (400), deleting yourself as admin (403), commitment past due (auto-validation trigger), unresolved validation (auto-escalation).

---

## Project structure

```text
insightloop/
├── docker-compose.yml
├── .env.example
├── Documentation/
│   ├── README.md
│   ├── RUNNING.md
│   └── [api.md](./api.md)                           # extended API reference
├── services/
│   ├── api-gateway/              # Spring Cloud Gateway + JwtAuthFilter
│   ├── auth-service/             # users, roles, permissions, JWT
│   ├── feedback-service/         # interactions + CSAT
│   ├── validation-service/       # commitments + scheduled validation
│   └── escalation-service/       # escalation queue + audit log
└── frontend/                     # Angular 17 SPA
    ├── Dockerfile
    ├── nginx.conf
    └── src/app/
        ├── core/                 # auth interceptor, guards, api services
        ├── shared/               # layout, badges, hasPermission directive
        └── features/             # 10 feature modules
```

---

**Built for the Fantacode technical assessment.**
