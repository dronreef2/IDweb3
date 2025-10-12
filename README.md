# IDweb3 - Digital Identity MVP

![IDweb3](https://img.shields.io/badge/Status-MVP_Complete-success)
![Hedera](https://img.shields.io/badge/Blockchain-Hedera-blue)
![License](https://img.shields.io/badge/License-MIT-green)

**Sistema completo de identidade digital com credenciais verificáveis, integração blockchain e armazenamento distribuído.**

## 🎯 Visão Geral

IDweb3 é uma plataforma MVP de identidade digital descentralizada que combina:

- ✅ **Identidades Digitais**: Criação e gestão de identidades únicas
- ✅ **Credenciais Verificáveis**: Padrão W3C via Guardian Framework
- ✅ **Blockchain**: Registro imutável no Hedera Hashgraph
- ✅ **NFTs de Identidade**: Tokens ERC721 para identidades (via Hardhat)
- ✅ **IPFS**: Armazenamento distribuído de documentos
- ✅ **API REST**: Integração completa para aplicações externas

## 🚀 Quick Start

### Pré-requisitos

- Docker e Docker Compose
- Node.js >= 16.0.0
- MetaMask (para interação com contratos)
- Conta Hedera Testnet (gratuita)

### Instalação Rápida

```bash
# 1. Clone o repositório
git clone https://github.com/dronreef2/IDweb3.git
cd IDweb3

# 2. Configure o ambiente
cp .env.example .env
# Edite o .env com suas credenciais Hedera

# 3. Inicie todos os serviços
chmod +x setup.sh
./setup.sh

# 4. Acesse a aplicação
# Frontend: http://localhost:3003
# API: http://localhost:3001
# Guardian UI: http://localhost:3000
```

## 🏗️ Arquitetura

### Backend
- **Stack**: Node.js, Express, MongoDB, Redis
- **Blockchain**: Hedera SDK para consenso e armazenamento
- **Storage**: IPFS para documentos distribuídos
- **Identity**: Guardian Framework para credenciais W3C

### Frontend
- **Stack**: React 18, Material UI
- **Web3**: Ethers.js para interação com contratos
- **API**: Axios para comunicação com backend

### Smart Contracts (Hardhat)
- **IdentityNFT**: ERC721 para NFTs de identidade
- **Networks**: Sepolia, Hedera EVM, Local

## 📚 Documentação

### Guias Principais

- 📖 [**Guia de Integração Completo**](docs/INTEGRATION_GUIDE.md) - Setup detalhado e integrações
- 🔧 [**Hardhat Setup**](README_HARDHAT.md) - Deploy de contratos EVM
- 📋 [**Resumo do Projeto**](docs/project-summary.md) - Visão geral técnica
- 🔗 [**Exemplos de API**](docs/api-examples.md) - Uso dos endpoints REST
- 🚀 [**Deploy em Produção**](DEPLOYMENT.md) - Checklist de produção

### Instruções para IA

- 🤖 [**instructions.json**](instructions.json) - Arquivo semântico para agentes IA

## 🔧 Integrações

### 1. Hardhat (Contratos EVM)

```bash
# Instalar Hardhat
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox

# Compilar contratos
npx hardhat compile

# Deploy em Sepolia
npx hardhat run scripts/deploy.js --network sepolia
```

Veja o [guia completo de Hardhat](README_HARDHAT.md).

### 2. Frontend (React + Ethers.js)

```javascript
import { mintIdentityNFT } from './utils/contract';

// Emitir NFT de identidade
const result = await mintIdentityNFT('ipfs://Qm...');
console.log('NFT emitido:', result.tokenId);
```

### 3. API Backend

```bash
# Criar identidade
curl -X POST http://localhost:3001/api/identity/create \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"personalInfo": {...}}'
```

## 🌐 Endpoints da API

### Autenticação
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Login e obter JWT

### Identidade
- `POST /api/identity/create` - Criar identidade digital
- `GET /api/identity/me` - Obter minha identidade
- `POST /api/identity/issue-nft` - Emitir NFT no Hedera

### Documentos
- `POST /api/documents/upload` - Upload para IPFS
- `GET /api/documents/list` - Listar documentos

### Credenciais
- `POST /api/credentials/issue` - Emitir credencial W3C
- `GET /api/credentials/my-credentials` - Listar credenciais

## 💧 Faucets (Tokens de Teste)

### Ethereum Sepolia
- **URL**: https://sepoliafaucet.com
- **Token**: ETH (para gas)

### Hedera Testnet
- **URL**: https://portal.hedera.com/register
- **Token**: HBAR (já incluso na conta testnet)

## 🐳 Docker Services

| Serviço | URL | Porta |
|---------|-----|-------|
| API Backend | http://localhost:3001 | 3001 |
| Frontend | http://localhost:3003 | 3003 |
| Guardian UI | http://localhost:3000 | 3000 |
| MongoDB | localhost | 27017 |
| Redis | localhost | 6379 |

## 🔒 Segurança

- ✅ Autenticação JWT
- ✅ Rate limiting
- ✅ Validação de entrada (Joi)
- ✅ CORS configurado
- ✅ Hashing de senhas (bcrypt)
- ✅ Restrições de upload de arquivos

## 🧪 Testes

```bash
# Backend
cd backend
npm test

# Contratos Hardhat
npx hardhat test
```

## 📦 Tecnologias

### Blockchain & Web3
- Hedera Hashgraph SDK
- Guardian Framework
- Hardhat
- OpenZeppelin Contracts
- Ethers.js

### Backend
- Node.js
- Express
- MongoDB
- Redis
- JWT

### Frontend
- React 18
- Material UI
- Axios

### Storage
- IPFS

## 🛠️ Desenvolvimento

### Estrutura do Projeto

```
IDweb3/
├── backend/          # API REST Node.js
├── frontend/         # Interface React
├── contracts/        # Smart contracts Solidity
├── scripts/          # Scripts de deploy
├── docs/            # Documentação
├── docker-compose.yml
└── hardhat.config.js
```

### Comandos Úteis

```bash
# Iniciar serviços
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar serviços
docker-compose down

# Rebuild
docker-compose up -d --build

# Compilar contratos
npx hardhat compile

# Deploy contrato
npx hardhat run scripts/deploy.js --network sepolia
```

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Add: MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 Suporte

- 📧 Abra uma [issue no GitHub](https://github.com/dronreef2/IDweb3/issues)
- 📖 Consulte a [documentação](docs/)
- 💬 Entre em contato com o time

## ✅ Status do MVP

- ✅ Backend API completo
- ✅ Frontend React funcional
- ✅ Integração Hedera Hashgraph
- ✅ Guardian Framework configurado
- ✅ IPFS integrado
- ✅ Hardhat setup com IdentityNFT
- ✅ Docker Compose pronto
- ✅ Documentação completa

**MVP COMPLETE AND READY FOR DEPLOYMENT** 🚀

---

**Desenvolvido com ❤️ pelo time IDweb3**
