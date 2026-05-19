# Hospitrix Backend API

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Setup environment
```bash
cp .env.example .env
# Edit .env with your database credentials
```

### 3. Setup database
```bash
npx prisma migrate dev
npx prisma generate
```

### 4. Start development server
```bash
npm run dev
```

API runs at: http://localhost:5000

## 🐳 Docker (Self-hosted)
```bash
docker-compose up -d
```

## 📚 API Endpoints

### Auth
- POST /api/v1/auth/login
- GET  /api/v1/auth/me
- POST /api/v1/auth/logout

### Patients
- GET  /api/v1/patients
- POST /api/v1/patients
- GET  /api/v1/patients/:uid
- PUT  /api/v1/patients/:uid

## 🔐 Login Example
```json
POST /api/v1/auth/login
{
  "email": "admin@hospital.com",
  "password": "password",
  "hospitalCode": "city-hospital"
}
```
