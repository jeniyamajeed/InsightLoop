# InsightLoop: Microservices API Reference Manual

This document provides detailed API specifications for the InsightLoop platform. 

All client requests must go through the **API Gateway** as the single entrypoint:
* **Docker Mode Gateway URL:** `http://localhost:8090`
* **Local Mode Gateway URL:** `http://localhost:8080`

Downstream microservices verify signatures independently using a shared JWT secret. For authorized endpoints, append the header: `Authorization: Bearer <JWT_TOKEN>`.

---

## 🔌 Swagger UI Access

You can test all endpoints interactively in your browser via Swagger UI. These URLs are accessible in both **Docker** and **Local** modes:

| Service | Swagger UI URL |
| :--- | :--- |
| **Auth Service** | [http://localhost:8081/swagger-ui.html](http://localhost:8081/swagger-ui.html) |
| **Feedback Service** | [http://localhost:8082/swagger-ui.html](http://localhost:8082/swagger-ui.html) |
| **Validation Service** | [http://localhost:8083/swagger-ui.html](http://localhost:8083/swagger-ui.html) |
| **Escalation Service** | [http://localhost:8084/swagger-ui.html](http://localhost:8084/swagger-ui.html) |

### 🔑 Authenticating in Swagger:
1. Log in via the app or call `POST /api/auth/login` in the **Auth Service** Swagger to get your JWT access token.
2. Click the **Authorize** (padlock) button at the top-right of any Swagger page.
3. Paste the token in the text box formatted exactly as: `Bearer <your_jwt_token_here>`.
4. Click **Authorize** and close. You can now execute protected endpoints directly from Swagger!

---

## 🔑 1. Auth Service API

Manages user registration, login, role assignments, and permission evaluations.

### Login
* **Endpoint:** `POST /api/auth/login`
* **Access:** Public
* **Request Body:**
  ```json
  {
    "email": "admin@insightloop.com",
    "password": "Admin@123"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
    "user": {
      "id": 1,
      "email": "admin@insightloop.com",
      "roles": ["ADMIN"],
      "permissions": ["user:read", "user:write", "commitment:write", "escalation:manage", "analytics:read"]
    }
  }
  ```

### Self-Register
* **Endpoint:** `POST /api/auth/register`
* **Access:** Public
* **Request Body:**
  ```json
  {
    "email": "newuser@insightloop.com",
    "password": "Password@123"
  }
  ```
* **Response (201 Created):** Returns user details with the default `USER` role.

### List All Users
* **Endpoint:** `GET /api/users`
* **Access:** Authorized (Role: `ADMIN`)
* **Response (200 OK):**
  ```json
  [
    {
      "id": 1,
      "email": "admin@insightloop.com",
      "roles": [ "ADMIN" ],
      "permissions": [ "user:read", "user:write" ]
    }
  ]
  ```

### Create User
* **Endpoint:** `POST /api/users`
* **Access:** Authorized (Role: `ADMIN`)
* **Request Body:**
  ```json
  {
    "email": "agent2@insightloop.com",
    "password": "AgentPassword@123",
    "roles": ["AGENT"],
    "permissions": ["commitment:read", "commitment:write"]
  }
  ```
* **Response (201 Created):** Returns created user object.

### Update User (Modify Roles & Direct Permissions)
* **Endpoint:** `PUT /api/users/{id}`
* **Access:** Authorized (Role: `ADMIN`)
* **Request Body:**
  ```json
  {
    "email": "agent2@insightloop.com",
    "roles": ["AGENT"],
    "permissions": ["commitment:read", "commitment:write"]
  }
  ```
  *(Note: User management permissions like `user:read`/`user:write` are strictly restricted to the `ADMIN` role. The frontend panel dynamically hides these options when configuring non-admin accounts.)*
* **Response (200 OK):** Returns updated user object.

### Delete User
* **Endpoint:** `DELETE /api/users/{id}`
* **Access:** Authorized (Role: `ADMIN`)
* **Response (204 No Content)**

### Assign Role
* **Endpoint:** `POST /api/roles/assign`
* **Access:** Authorized (Role: `ADMIN`)
* **Request Body:**
  ```json
  {
    "userId": 2,
    "roleName": "MANAGER"
  }
  ```
* **Response (200 OK):** Returns success status.

### List All System Permissions
* **Endpoint:** `GET /api/permissions`
* **Access:** Authorized (Role: `ADMIN`)
* **Response (200 OK):**
  ```json
  [
    "user:read", "user:write",
    "commitment:read", "commitment:write",
    "escalation:read", "escalation:manage",
    "analytics:read"
  ]
  ```

---

## 💬 2. Feedback Service API

Captures customer interactions and logs immediate post-interaction CSAT scores.

### List Interactions
* **Endpoint:** `GET /api/interactions`
* **Access:** Authorized (Roles: `AGENT`, `MANAGER`, `ADMIN`)
* **Response (200 OK):** Returns a list of all support logs, sorted in descending order (newest first).

### Log Support Interaction
* **Endpoint:** `POST /api/interactions`
* **Access:** Authorized (Roles: `AGENT`, `ADMIN`)
* **Request Body:**
  ```json
  {
    "customerName": "Rahul Verma",
    "channel": "CALL",
    "summary": "Customer called asking for card waiver fee reversal",
    "csatScore": 5,
    "csatComment": "Agent was extremely helpful"
  }
  ```
* **Response (201 Created):** Returns logged interaction object.

### Capture CSAT Later
* **Endpoint:** `POST /api/interactions/{id}/feedback`
* **Access:** Public (Used to capture post-call surveys)
* **Request Body:**
  ```json
  {
    "score": 4,
    "comment": "Good follow-up."
  }
  ```
* **Response (200 OK)**

---

## 📋 3. Validation Service API

Tracks outcome commitments, handles customer simulator responses, and provides dashboard KPIs.

### List Commitments
* **Endpoint:** `GET /api/commitments`
* **Access:** Authorized (Roles: `AGENT`, `MANAGER`, `ADMIN`)
* **Response (200 OK):** Lists all commitments with option to filter by status (`PENDING`, `VALIDATION_SENT`, `RESOLVED`, `ESCALATED`).

### Create Outcome Commitment
* **Endpoint:** `POST /api/commitments`
* **Access:** Authorized (Roles: `AGENT`, `ADMIN`)
* **Request Body:**
  ```json
  {
    "customerName": "Rahul Verma",
    "commitmentType": "REFUND",
    "description": "Reversal of card bounce fee of INR 4,299",
    "dueAt": "2026-07-12T10:00:00Z"
  }
  ```
* **Response (201 Created)**

### View Commitment Detail
* **Endpoint:** `GET /api/commitments/{id}`
* **Access:** Authorized (Roles: `AGENT`, `MANAGER`, `ADMIN`)
* **Response (200 OK):** Returns a detailed breakdown of the commitment, including the **Audit Trail timeline log**:
  ```json
  {
    "commitment": {
      "id": 1,
      "customerName": "Rahul Verma",
      "commitmentType": "REFUND",
      "status": "ESCALATED",
      "dueAt": "2026-07-12T10:00:00Z"
    },
    "audit": [
      { "event": "CREATED", "detail": "Commitment logged", "at": "2026-07-09T18:00:00Z" },
      { "event": "ESCALATED", "detail": "Escalation 1 opened", "at": "2026-07-09T18:05:00Z" }
    ]
  }
  ```

### Update Commitment (Edit)
* **Endpoint:** `PUT /api/commitments/{id}`
* **Access:** Authorized (Roles: `AGENT`, `MANAGER`, `ADMIN`)
* **Request Body:** Allows updating any field or status manually.
  ```json
  {
    "description": "Updated refund details",
    "status": "RESOLVED"
  }
  ```

### Delete Commitment
* **Endpoint:** `DELETE /api/commitments/{id}`
* **Access:** Authorized (Roles: `MANAGER`, `ADMIN` - *AGENT is denied*)
* **Response (204 No Content)**

### Customer Response Simulation (Validation)
* **Endpoint:** `POST /api/validations/{commitmentId}/respond`
* **Access:** Public (Simulator)
* **Request Body:**
  ```json
  {
    "resolved": false,
    "comment": "I still haven't received my refund!"
  }
  ```
* **Response (200 OK):** If `resolved` is `false`, it automatically registers an `UNRESOLVED` state, alerts the validation service, and issues a POST to the Escalation service to create a priority ticket.

---

## 🚨 4. Escalation Service API

Priority queue routing for commitments that failed outcome validation.

### List Escalation Tickets
* **Endpoint:** `GET /api/escalations`
* **Access:** Authorized (Roles: `AGENT`, `MANAGER`, `ADMIN`)
* **Response (200 OK):** Lists all active and closed escalation tickets with priority, SLA, and owner assignments.

### Update Escalation (Assign/Resolve)
* **Endpoint:** `PATCH /api/escalations/{id}`
* **Access:** Authorized (Roles: `AGENT`, `MANAGER`, `ADMIN`)
* **Request Body:**
  ```json
  {
    "status": "RESOLVED",
    "assigneeUserId": 2,
    "priority": "P1"
  }
  ```
* **Response (200 OK):** Changing the status to **`RESOLVED`** here triggers a synchronization REST call back to the Validation Service to automatically update the commitment status to **`RESOLVED`**.

### Edit Ticket Details
* **Endpoint:** `PUT /api/escalations/{id}`
* **Access:** Authorized (Roles: `MANAGER`, `ADMIN`)
* **Request Body:** Edits customer name, summary, SLA hours, or priority.

### Delete Ticket
* **Endpoint:** `DELETE /api/escalations/{id}`
* **Access:** Authorized (Roles: `MANAGER`, `ADMIN`)
* **Response (204 No Content)**

---

## 📊 5. Analytics API
* **Endpoint:** `GET /api/analytics/summary`
* **Access:** Authorized (Roles: `AGENT`, `MANAGER`, `ADMIN`)
* **Response (200 OK):** Computes operational KPIs including:
  * `csatImmediate`: Overall initial CSAT.
  * `actualResolutionConfirmed`: Wiped outcomes confirmed resolved.
  * `resolutionGap`: Difference showing post-call performance drop-off.
  * `commitmentsDueToday`, `overdueCommitments`, `openEscalations`.
