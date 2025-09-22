# IDweb3 - Digital Identity MVP with Hedera + Guardian

A comprehensive Digital Identity system built with Hedera blockchain integration and Guardian framework for issuing and managing verifiable credentials.

## 🚀 Features

- **Digital Identity Creation**: Create unique digital identities linked to users
- **Verifiable Credentials**: Issue, manage, and verify credentials using industry standards
- **Document Signing**: Secure document signing with blockchain attestation
- **Hedera Integration**: Leverages Hedera Hashgraph for immutable record keeping
- **IPFS Storage**: Decentralized storage for documents and credentials
- **Guardian Framework**: Professional credential management system
- **Secure Authentication**: JWT-based authentication with role management

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API    │    │   Hedera        │
│   (React/Vue)   │◄──►│   (Node.js/TS)   │◄──►│   Network       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │                        │
                              ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │   MongoDB        │    │   IPFS          │
                       │   + Redis        │    │   Web3.Storage  │
                       └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │   Guardian       │
                       │   Framework      │
                       └──────────────────┘
```

## 📋 Prerequisites

- Node.js 18+ and npm
- MongoDB (local or cloud)
- Redis (local or cloud)
- Hedera Testnet Account
- Web3.Storage API Token (optional)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/dronreef2/IDweb3.git
   cd IDweb3
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

5. **Start the server**
   ```bash
   npm start
   # or for development
   npm run dev
   ```

## 🔧 Environment Variables

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/idweb3
REDIS_URL=redis://localhost:6379

# Hedera Configuration
HEDERA_NETWORK=testnet
HEDERA_ACCOUNT_ID=your-account-id
HEDERA_PRIVATE_KEY=your-private-key

# IPFS Web3.Storage Configuration
WEB3_STORAGE_TOKEN=your-web3-storage-token

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Guardian Configuration
GUARDIAN_API_URL=http://localhost:3001
GUARDIAN_API_KEY=your-guardian-api-key
```

## 🔑 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/profile` - Get user profile
- `PUT /api/v1/auth/profile` - Update user profile

### Digital Identity
- `POST /api/v1/identity` - Create digital identity
- `GET /api/v1/identity/:id` - Get identity details
- `POST /api/v1/identity/credentials/issue` - Issue credential
- `GET /api/v1/identity/credentials` - Get user credentials
- `POST /api/v1/identity/credentials/verify` - Verify credential

### Document Signing
- `POST /api/v1/documents/sign` - Sign document
- `GET /api/v1/documents/signatures` - Get user signatures
- `GET /api/v1/documents/signatures/:id/verify` - Verify signature

## 💡 Usage Examples

### 1. Register a User
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### 2. Create Digital Identity
```bash
curl -X POST http://localhost:3000/api/v1/identity \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### 3. Issue a Credential
```bash
curl -X POST http://localhost:3000/api/v1/identity/credentials/issue \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "identityId": "user-identity-id",
    "credentialType": "EducationCredential",
    "claims": {
      "degree": "Bachelor of Science",
      "institution": "University of Technology",
      "graduationYear": 2023
    }
  }'
```

### 4. Sign a Document
```bash
curl -X POST http://localhost:3000/api/v1/documents/sign \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "document=@/path/to/document.pdf" \
  -F "metadata={\"description\": \"Contract Agreement\"}"
```

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## 🚀 Development

Start the development server with hot reload:
```bash
npm run dev
```

Build for production:
```bash
npm run build
npm start
```

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Input Validation**: Comprehensive request validation
- **Rate Limiting**: Protection against brute force attacks
- **CORS Protection**: Configurable cross-origin policies
- **Helmet Security**: HTTP headers security
- **Data Encryption**: Sensitive data encryption at rest

## 📊 Monitoring & Logging

- **Winston Logging**: Structured logging with multiple transports
- **Health Checks**: Database and service health monitoring
- **Error Tracking**: Comprehensive error handling and reporting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Hedera Documentation](https://docs.hedera.com/)
- [Guardian Framework](https://github.com/hashgraph/guardian)
- [Web3.Storage](https://web3.storage/)
- [MongoDB](https://www.mongodb.com/)
- [Redis](https://redis.io/)

## 📞 Support

For support, email support@idweb3.com or create an issue on GitHub.