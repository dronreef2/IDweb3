# IDweb3 - Digital Identity MVP

🎯 **Objetivo**: Sistema completo de identidade digital com Hedera + Guardian integration

## 📋 Funcionalidades

✅ **Identidade Digital Única**
- Criação de identidade com NFT ou VC
- Registro seguro na blockchain Hedera
- Integração com Guardian framework

✅ **Credenciais Verificáveis**
- Emissão automatizada via Guardian
- Padrão W3C Verifiable Credentials
- Armazenamento distribuído com IPFS

✅ **Validação de Documentos**
- Upload seguro de documentos
- Verificação de autenticidade
- Histórico de verificações

✅ **Painel do Usuário**
- Dashboard completo
- Histórico de atividades
- Analytics de uso

✅ **API REST Completa**
- Autenticação JWT
- Rate limiting
- Documentação OpenAPI

## 🧱 Arquitetura

### Backend
- **Guardian**: Motor principal para identidade e credenciais
- **MongoDB + Redis**: Persistência e cache
- **Hedera SDK**: Integração com a rede Hedera
- **IPFS**: Armazenamento distribuído de documentos
- **Node.js/Express**: API REST

### Frontend
- **React**: Interface web responsiva
- **Material-UI**: Componentes de interface
- **Axios**: Cliente HTTP para API

### Blockchain
- **Hedera Hashgraph**: Consensus e HCS (Topics)
- **NFTs**: Representação de identidade única
- **Verifiable Credentials**: Padrão W3C para credenciais

## 🚀 Quick Start

### 1. Configurar Ambiente

```bash
# Clonar repositório
git clone https://github.com/dronreef2/IDweb3.git
cd IDweb3

# Configurar variáveis de ambiente
cp .env.example .env
```

### 2. Configurar Hedera Testnet

1. Acesse [Portal Hedera](https://portal.hedera.com)
2. Crie uma conta testnet
3. Gere chave privada ED25519
4. Atualize o arquivo `.env`:

```env
HEDERA_NET=testnet
HEDERA_OPERATOR_ID=0.0.xxxxx
HEDERA_OPERATOR_KEY=-----BEGIN PRIVATE KEY-----
...
-----END PRIVATE KEY-----
```

### 3. Executar com Docker

```bash
# Subir todos os serviços
docker compose up -d

# Verificar status
docker compose ps
```

### 4. Acessar Interfaces

- **Guardian UI**: http://localhost:3000
- **IDweb3 Frontend**: http://localhost:3003
- **API Health Check**: http://localhost:3001/health

## 📡 API Endpoints

### Autenticação
- `POST /api/auth/register` - Registro de usuário
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Perfil do usuário

### Identidade
- `POST /api/identity/create` - Criar identidade digital
- `GET /api/identity/me` - Obter minha identidade
- `PUT /api/identity/update` - Atualizar identidade
- `POST /api/identity/issue-nft` - Emitir NFT de identidade

### Documentos
- `POST /api/documents/upload` - Upload de documento
- `GET /api/documents/list` - Listar documentos
- `POST /api/documents/:id/verify` - Verificar documento
- `GET /api/documents/:id/download` - Download documento

### Credenciais
- `POST /api/credentials/issue` - Emitir credencial
- `GET /api/credentials/my-credentials` - Minhas credenciais
- `GET /api/credentials/:id` - Detalhes da credencial
- `POST /api/credentials/:id/verify` - Verificar credencial

### Dashboard
- `GET /api/dashboard/overview` - Visão geral
- `GET /api/dashboard/activity` - Feed de atividades
- `GET /api/dashboard/analytics` - Dados analíticos

## 🔧 Desenvolvimento

### Estrutura do Projeto

```
IDweb3/
├── backend/                 # API Node.js/Express
│   ├── src/
│   │   ├── controllers/     # Controladores da API
│   │   ├── models/         # Modelos MongoDB
│   │   ├── routes/         # Rotas da API
│   │   ├── services/       # Serviços (Hedera, Guardian, IPFS)
│   │   ├── middleware/     # Middlewares
│   │   └── config/         # Configurações
│   └── Dockerfile
├── frontend/               # Interface React
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── pages/          # Páginas
│   │   └── services/       # Serviços frontend
│   └── Dockerfile
├── configs/                # Configurações Guardian
├── docs/                   # Documentação
├── docker-compose.yml      # Orquestração containers
└── .env.example           # Template variáveis
```

### Executar em Desenvolvimento

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm start
```

## 🔐 Fluxo de Identidade

1. **Registro**: Usuário cria conta no sistema
2. **Identidade**: Criação de identidade digital única
3. **Documentos**: Upload de documentos de verificação
4. **Verificação**: Validação manual/automática
5. **Credencial**: Emissão de credencial verificável
6. **Blockchain**: Registro na Hedera + IPFS
7. **NFT**: Emissão opcional de NFT de identidade

## 📊 Política Guardian

O sistema utiliza uma política personalizada no Guardian:

```json
{
  "name": "IDweb3 Digital Identity Policy",
  "blocks": [
    "Registration Block",
    "Document Upload Block", 
    "Verification Block",
    "Credential Issuance Block",
    "Hedera Integration Block"
  ]
}
```

Ver: [configs/identity-policy.md](configs/identity-policy.md)

## 🌐 Integrações

### Hedera Hashgraph
- **HCS Topics**: Mensagens de identidade
- **NFTs**: Tokens de identidade única
- **Consensus**: Timestamping imutável

### IPFS
- **Web3.Storage**: Armazenamento descentralizado
- **Metadata**: Dados de identidade e credenciais
- **Gateway**: Acesso público aos documentos

### Guardian Framework
- **Policy Engine**: Fluxos de verificação
- **VC Generation**: Credenciais verificáveis
- **DID Management**: Identidades descentralizadas

## 🔒 Segurança

- **JWT Authentication**: Autenticação stateless
- **Rate Limiting**: Proteção contra abuse
- **Input Validation**: Joi schemas
- **CORS**: Configuração cross-origin
- **Helmet**: Headers de segurança
- **BCrypt**: Hash de senhas

## 🧪 Testes

```bash
# Backend tests
cd backend
npm test

# Lint
npm run lint
```

## 📚 Documentação Adicional

- [API Documentation](docs/api.md)
- [Deployment Guide](docs/deployment.md)
- [Guardian Integration](docs/guardian.md)
- [Hedera Integration](docs/hedera.md)

## 📄 Licença

MIT License - Ver [LICENSE](LICENSE) para detalhes.

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📞 Suporte

- **Issues**: GitHub Issues
- **Documentation**: Wiki do projeto
- **Community**: Discord/Telegram (em breve)

---

**IDweb3** - Construindo o futuro da identidade digital com blockchain 🚀