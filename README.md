# Role-Based File Sharing System (RBFS)

An enterprise-grade, secure, multi-tier file sharing and governance platform featuring stateless JWT authentication, role-based access control (RBAC), stream-based AES-256-CBC cryptographic storage, automated audit trail logging, and an API Gateway reverse proxy.

---

## 🏛 System Architecture

```
┌────────────────────────────────────────────────────────┐
│               Frontend (React 18 + Vite)               │
│                  http://localhost:3000                 │
└───────────────────────────┬────────────────────────────┘
                            │ Authorization: Bearer <token>
                            ▼
┌────────────────────────────────────────────────────────┐
│             API Gateway (Node.js / Express)            │
│                  http://localhost:5000                 │
│  - Helmet Security Headers & CORS Whitelist            │
│  - Tiered Rate Limiting (Brute-force protection)       │
│  - Request Header Sanitization                         │
│  - Streaming Reverse Proxy (http-proxy-middleware)     │
└───────────────────────────┬────────────────────────────┘
                            │ /api/** (Preserved raw streams)
                            ▼
┌────────────────────────────────────────────────────────┐
│         Backend & Security (Spring Boot 3.2)           │
│                  http://localhost:8080                 │
│  - Stateless JWT Authentication & Claims Extraction    │
│  - Method-Level RBAC (@PreAuthorize)                   │
│  - AES-256-CBC Stream Encryption/Decryption            │
│  - Audit Log Interceptor (User, IP, Action, Status)    │
│  - Path Traversal Guard (.normalize().startsWith(root))│
└─────────────┬────────────────────────────┬─────────────┘
              │                            │
              ▼                            ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│   MongoDB 8.x Database   │  │ Encrypted File Storage   │
│  mongodb://localhost:27017  │  │ ./uploads/*.enc (AES-256)│
└──────────────────────────┘  └──────────────────────────┘
```

---

## 💻 Tech Stack

| Layer | Technology | Key Libraries / Modules |
|-------|------------|-------------------------|
| **Frontend** | React 18 | `react-router-dom`, `axios`, `lucide-react`, `recharts`, `react-toastify` |
| **API Gateway** | Node.js / Express | `http-proxy-middleware`, `express-rate-limit`, `helmet`, `cors`, `dotenv` |
| **Backend & Security** | Spring Boot 3.2 (Java 21) | Spring Security, JJWT (Stateless), Jakarta Servlet API, Maven |
| **Cryptography** | Java Cryptography Extension | AES-256-CBC with 16-byte prepended random IV and PKCS5 padding |
| **Database** | MongoDB | Spring Data MongoDB, Mongoose (for seed tooling) |

---

## 🔒 Key Security Features

1. **Stateless JWT Role Enforcement:** JWT tokens encapsulate user identity (`id`, `name`, `email`) and authority roles (`ROLE_ADMIN`, `ROLE_MANAGER`, `ROLE_USER`). Authenticated requests require zero database round-trips for authorization.
2. **Stream-Based AES-256-CBC Cryptography:** 
   - Files are encrypted on upload via streaming cipher without loading full blobs into memory.
   - A unique 16-byte cryptographically secure random IV is generated per file and prepended to the ciphertext.
   - Authorized downloads stream-decrypt ciphertext directly to the HTTP response output stream.
3. **API Gateway Perimeter Protection:**
   - Strict CORS origin whitelisting (`http://localhost:3000`).
   - Rate limiting: 15 requests / 15 minutes on `/api/auth/*` (anti-brute-force); 500 requests / 15 minutes on `/api/*`.
   - Complete removal of static file directory serving (`GET /uploads/*` returns `404 Not Found`).
4. **Comprehensive Audit Trail Ledger:**
   - Every security-sensitive transaction (`USER_REGISTER`, `USER_LOGIN`, `FILE_UPLOAD`, `FILE_DOWNLOAD`, `FILE_APPROVE`, `FILE_DELETE`, `USER_ROLE_CHANGE`) is automatically recorded with actor ID, email, IP address, timestamp, and status (`SUCCESS`/`FAILURE`).
5. **Path Traversal Protection:**
   - Filenames are normalized and validated (`Paths.get(uploadDir).resolve(fileName).normalize().startsWith(root)`) before accessing the disk.

---

## 👥 Role Matrix & Permissions

| Capability | `ROLE_USER` | `ROLE_MANAGER` | `ROLE_ADMIN` |
|------------|:-----------:|:--------------:|:------------:|
| Login / Register | ✅ | ✅ | ✅ |
| Browse Approved Files & Folders | ✅ | ✅ | ✅ |
| Download Approved Files (Decrypted) | ✅ | ✅ | ✅ |
| Upload Files (Enters Pending Approval) | ❌ (403) | ✅ (Pending) | ✅ (Auto-approved) |
| Download Own Pending Files | ❌ | ✅ | ✅ |
| Approve / Reject Pending Files | ❌ | ❌ | ✅ |
| Manage User Accounts & Promote Roles | ❌ | ❌ | ✅ |
| Query Real-Time Audit Trail Ledger | ❌ (403) | ❌ (403) | ✅ |

### Default Seed Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@aeroshare.com` | `password123` |
| **Manager** | `manager@aeroshare.com` | `password123` |
| **User** | `user@aeroshare.com` | `password123` |

*(To seed demo accounts, run `node backend/seedUsers.js` with MongoDB running).*

---

## 🚀 Step-by-Step Local Startup Instructions

### Prerequisites
- **Node.js** v18+ and **npm**
- **Java JDK 21+** (compiled for Java 21 bytecode)
- **Apache Maven 3.9+** (or Maven wrapper)
- **MongoDB** v6.0+ (running locally on port `27017`)

---

### Step 1: Start MongoDB
Ensure MongoDB is running on port `27017`:
```powershell
# Using installed MongoDB service or binary:
mongod --dbpath "data/db" --port 27017 --bind_ip 127.0.0.1
```

---

### Step 2: Start Spring Boot Backend (Port 8080)
```powershell
cd backend-java

# Set JAVA_HOME if not in PATH (e.g., JDK 21+)
# $env:JAVA_HOME = "C:\Program Files\Java\jdk-24"

# Compile and start
mvn spring-boot:run
```
*Health verification:* Spring Boot starts with context-path `/api` on `http://localhost:8080/api`.

> **Note on Port Collisions:** If port `8080` is in use by another service (e.g. Oracle TNSLSNR), change `server.port=8085` in `backend-java/src/main/resources/application.properties` and set `SPRING_BOOT_URL=http://localhost:8085` in `backend/.env`.

---

### Step 3: Start Node.js API Gateway (Port 5000)
```powershell
cd backend

# Install dependencies if not already installed
npm install

# Start the reverse proxy gateway
npm start
# or: node server.js
```
*Gateway verification:*
```powershell
curl http://localhost:5000/health
# Returns: {"status":"UP","service":"RBFS API Gateway","upstream":"http://localhost:8080"}
```

---

### Step 4: Start React Frontend (Port 3000)
```powershell
cd frontend

# Install dependencies if not already installed
npm install

# Start development server
npm start
```
The browser will automatically open to `http://localhost:3000`.

---

## 🧪 Running Automated QA Verification

An end-to-end integration test suite is included in `qa_verification.js`. It validates all 31 critical checkpoints against the running API Gateway (`http://localhost:5000`):

```powershell
# With MongoDB, Spring Boot, and the Gateway running:
node qa_verification.js
```

### Verified Test Areas (31 / 31 Checks)
- **Gateway Perimeter:** Health check, direct `/uploads` block (404), unauthenticated access blocks (403).
- **Stateless JWT Issuance:** Role claims for Admin, Manager, and User.
- **Cryptographic Round-Trip:** Physical ciphertext inspection, 16-byte random IV verification, stream decryption, and exact SHA-256 checksum integrity match.
- **RBAC Boundaries:** Upload restriction on User, Manager pending workflow, Admin governance & promotion.
- **Audit Logging:** Ledger integrity check, action verification across all 6 core events.
- **Automated Teardown:** Cleanup of temporary test users and files.
