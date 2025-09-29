# API Testing Examples

## Authentication

### Register User
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "password123",
    "fullName": "John Doe"
  }'
```

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "password": "password123"
  }'
```

## Identity Management

### Create Identity
```bash
# Replace TOKEN with the JWT token from login
curl -X POST http://localhost:3001/api/identity/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "personalInfo": {
      "firstName": "John",
      "lastName": "Doe",
      "dateOfBirth": "1990-01-01",
      "nationality": "US"
    }
  }'
```

### Get My Identity
```bash
curl -X GET http://localhost:3001/api/identity/me \
  -H "Authorization: Bearer TOKEN"
```

## Document Management

### Upload Document
```bash
curl -X POST http://localhost:3001/api/documents/upload \
  -H "Authorization: Bearer TOKEN" \
  -F "document=@/path/to/document.pdf" \
  -F "documentType=passport" \
  -F "description=Government issued passport"
```

### List Documents
```bash
curl -X GET http://localhost:3001/api/documents/list \
  -H "Authorization: Bearer TOKEN"
```

## Credentials

### Issue Credential
```bash
curl -X POST http://localhost:3001/api/credentials/issue \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "userId": "USER_ID",
    "type": "identity_verification",
    "subject": {
      "verified": true,
      "level": "basic"
    },
    "expirationDate": "2024-12-31T23:59:59Z"
  }'
```

### Get My Credentials
```bash
curl -X GET http://localhost:3001/api/credentials/my-credentials \
  -H "Authorization: Bearer TOKEN"
```

## Dashboard

### Get Overview
```bash
curl -X GET http://localhost:3001/api/dashboard/overview \
  -H "Authorization: Bearer TOKEN"
```

### Get Activity Feed
```bash
curl -X GET http://localhost:3001/api/dashboard/activity \
  -H "Authorization: Bearer TOKEN"
```