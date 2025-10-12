# 🧭 Guia de Integração e Deploy — Projeto IDweb3

## Visão Geral

Este guia técnico fornece instruções completas para desenvolvedores e agentes que desejam implantar, integrar com Hardhat, conectar o front-end e utilizar faucets/testnets no projeto IDweb3.

O IDweb3 é um MVP completo com identidade digital descentralizada, credenciais verificáveis, integração com Hedera Hashgraph e IPFS, com stack completo backend + frontend + Docker.

---

## ⚙️ 1. Estrutura Geral do Projeto

| Camada | Tecnologia | Função |
|--------|-----------|---------|
| **Backend** | Node.js, Express, MongoDB, Redis | API REST e lógica de identidade/credenciais |
| **Blockchain** | Hedera SDK | Registro e consenso em blockchain |
| **Armazenamento** | IPFS | Upload e verificação de documentos distribuídos |
| **Identidade** | Guardian Framework | Emissão e verificação de credenciais W3C |
| **Frontend** | React + Material UI | Interface do usuário |
| **Infraestrutura** | Docker Compose | Deploy completo com todos os serviços |

---

## 🧱 2. Adicionando Hardhat (para contratos EVM e extensões Web3)

O IDweb3 já utiliza o Hedera SDK, mas pode ser expandido para Ethereum ou redes EVM-compatíveis via Hardhat. Isso permite, por exemplo, emitir NFTs de identidade em redes EVM.

### 🔧 Passos para Instalação

#### 1. Instalar Hardhat

```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npx hardhat init
```

→ **Escolha**: "Create a JavaScript project"

#### 2. Criar o Contrato IdentityNFT.sol

Crie o arquivo `contracts/IdentityNFT.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract IdentityNFT is ERC721, Ownable {
    uint256 public tokenCounter;
    
    // Mapping from token ID to identity metadata URI
    mapping(uint256 => string) private _tokenURIs;

    constructor() ERC721("IDweb3Identity", "ID3") {
        tokenCounter = 0;
    }

    /**
     * @dev Mint a new identity NFT
     * @param to Address to receive the NFT
     * @param metadataURI IPFS URI containing identity metadata
     */
    function mintIdentity(address to, string memory metadataURI) public onlyOwner returns (uint256) {
        uint256 newId = tokenCounter;
        _safeMint(to, newId);
        _tokenURIs[newId] = metadataURI;
        tokenCounter += 1;
        return newId;
    }

    /**
     * @dev Get the metadata URI for a token
     */
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        return _tokenURIs[tokenId];
    }
}
```

#### 3. Instalar Dependências do OpenZeppelin

```bash
npm install --save-dev @openzeppelin/contracts
```

#### 4. Criar Script de Deploy

Crie o arquivo `scripts/deploy.js`:

```javascript
async function main() {
  console.log("🚀 Deploying IdentityNFT contract...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  const IdentityNFT = await ethers.getContractFactory("IdentityNFT");
  const nft = await IdentityNFT.deploy();
  await nft.waitForDeployment();
  
  const address = await nft.getAddress();
  console.log("✅ IdentityNFT deployed at:", address);
  console.log("\n📝 Save this address to your .env file:");
  console.log(`NFT_CONTRACT_ADDRESS=${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

#### 5. Configurar Hardhat para Testnets

Edite `hardhat.config.js`:

```javascript
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    // Ethereum Sepolia Testnet
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111
    },
    // Hedera Testnet (EVM-compatible)
    hederaTestnet: {
      url: "https://testnet.hashio.io/api",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 296
    },
    // Local Hardhat Network
    hardhat: {
      chainId: 31337
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
```

#### 6. Executar Deploy

**Deploy local (para testes):**
```bash
npx hardhat run scripts/deploy.js --network hardhat
```

**Deploy em Sepolia:**
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

**Deploy em Hedera Testnet:**
```bash
npx hardhat run scripts/deploy.js --network hederaTestnet
```

---

## 💧 3. Faucet para Obter Tokens de Teste

Para fazer deploy de contratos, você precisa de gas. Use faucets para carregar sua carteira com tokens de teste:

### Ethereum Sepolia

| Item | Detalhes |
|------|----------|
| **Faucet URL** | https://sepoliafaucet.com |
| **Token** | ETH de teste |
| **Requisitos** | Conta Alchemy ou Infura (gratuita) |
| **Processo** | 1. Cole o endereço da carteira<br>2. Aguarde confirmação<br>3. Verifique saldo no MetaMask |

### Hedera Testnet

| Item | Detalhes |
|------|----------|
| **Portal** | https://portal.hedera.com/register |
| **Token** | HBAR de teste |
| **Processo** | 1. Registre uma conta testnet<br>2. Gere credenciais (Account ID e Private Key)<br>3. Configure no `.env` do IDweb3 |

### Outras Opções

- **Sepolia Faucet (Chainlink)**: https://faucets.chain.link/sepolia
- **Alchemy Sepolia Faucet**: https://sepoliafaucet.com
- **Polygon Mumbai**: https://faucet.polygon.technology/

> 💡 **Dica**: Após obter os tokens, configure a chave privada e account ID no arquivo `.env` do IDweb3.

---

## 🌐 4. Integração com Front-end (React + ethers.js)

O front-end IDweb3 já existe. Vamos conectá-lo ao contrato NFT ou API Hedera.

### 4.1 Instalar Dependências

```bash
cd frontend
npm install ethers
```

### 4.2 Criar Utilitário de Contrato

Crie `frontend/src/utils/contract.js`:

```javascript
import { ethers } from "ethers";
import IdentityNFT from "../contracts/IdentityNFT.json"; // ABI do contrato

const CONTRACT_ADDRESS = process.env.REACT_APP_NFT_CONTRACT_ADDRESS;

/**
 * Conecta ao contrato IdentityNFT
 */
export async function getContract() {
  if (!window.ethereum) {
    throw new Error("MetaMask não está instalado");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();

  const contract = new ethers.Contract(
    CONTRACT_ADDRESS,
    IdentityNFT.abi,
    signer
  );

  return { contract, signer, provider };
}

/**
 * Emitir NFT de Identidade
 */
export async function mintIdentityNFT(metadataURI) {
  try {
    const { contract, signer } = await getContract();
    const userAddress = await signer.getAddress();

    console.log("Minting NFT para:", userAddress);
    
    const tx = await contract.mintIdentity(userAddress, metadataURI);
    console.log("Transação enviada:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("NFT emitido com sucesso!", receipt);

    return {
      success: true,
      transactionHash: tx.hash,
      receipt
    };
  } catch (error) {
    console.error("Erro ao emitir NFT:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Obter o contador de tokens
 */
export async function getTokenCounter() {
  try {
    const { contract } = await getContract();
    const counter = await contract.tokenCounter();
    return Number(counter);
  } catch (error) {
    console.error("Erro ao obter contador:", error);
    throw error;
  }
}

/**
 * Verificar se o usuário possui um NFT de identidade
 */
export async function hasIdentityNFT(address) {
  try {
    const { contract } = await getContract();
    const balance = await contract.balanceOf(address);
    return Number(balance) > 0;
  } catch (error) {
    console.error("Erro ao verificar NFT:", error);
    return false;
  }
}
```

### 4.3 Integrar no Dashboard

Edite `frontend/src/pages/Dashboard.jsx` (ou componente equivalente):

```javascript
import React, { useState, useEffect } from 'react';
import { Button, Alert, CircularProgress } from '@mui/material';
import { mintIdentityNFT, hasIdentityNFT } from '../utils/contract';

function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [hasNFT, setHasNFT] = useState(false);
  const [txHash, setTxHash] = useState(null);

  useEffect(() => {
    checkNFTStatus();
  }, []);

  const checkNFTStatus = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ 
          method: 'eth_accounts' 
        });
        if (accounts[0]) {
          const nftExists = await hasIdentityNFT(accounts[0]);
          setHasNFT(nftExists);
        }
      }
    } catch (error) {
      console.error("Erro ao verificar NFT:", error);
    }
  };

  const handleMintNFT = async () => {
    setLoading(true);
    try {
      // Supondo que você tenha o metadataURI do IPFS
      const metadataURI = "ipfs://YOUR_METADATA_HASH";
      
      const result = await mintIdentityNFT(metadataURI);
      
      if (result.success) {
        setTxHash(result.transactionHash);
        setHasNFT(true);
        alert("NFT de Identidade emitido com sucesso!");
      } else {
        alert("Erro ao emitir NFT: " + result.error);
      }
    } catch (error) {
      alert("Erro: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Dashboard de Identidade</h2>
      
      {hasNFT ? (
        <Alert severity="success">
          Você já possui um NFT de Identidade!
        </Alert>
      ) : (
        <Button 
          variant="contained" 
          onClick={handleMintNFT}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Emitir NFT de Identidade'}
        </Button>
      )}

      {txHash && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Hash da transação: {txHash}
        </Alert>
      )}
    </div>
  );
}

export default Dashboard;
```

---

## 🧩 5. Integração com a API Backend do IDweb3

A API principal já está implementada. Conecte o front-end React via Axios:

### 5.1 Criar Cliente API

Crie `frontend/src/services/api.js`:

```javascript
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3001/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

// Interceptor para adicionar token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Identity Services
export async function createIdentity(data) {
  return api.post("/identity/create", data);
}

export async function getMyIdentity() {
  return api.get("/identity/me");
}

export async function issueIdentityNFT(identityId) {
  return api.post("/identity/issue-nft", { identityId });
}

// Document Services
export async function uploadDocument(file, documentType, description) {
  const formData = new FormData();
  formData.append("document", file);
  formData.append("documentType", documentType);
  formData.append("description", description);
  
  return api.post("/documents/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
}

export async function listDocuments() {
  return api.get("/documents/list");
}

// Credential Services
export async function getMyCredentials() {
  return api.get("/credentials/my-credentials");
}

export async function verifyCredential(credentialId) {
  return api.post("/credentials/verify", { credentialId });
}

// Auth Services
export async function register(userData) {
  return api.post("/auth/register", userData);
}

export async function login(credentials) {
  const response = await api.post("/auth/login", credentials);
  if (response.data.token) {
    localStorage.setItem("authToken", response.data.token);
  }
  return response;
}

export async function logout() {
  localStorage.removeItem("authToken");
}

export default api;
```

### 5.2 Exemplo de Uso no Componente

```javascript
import { createIdentity, uploadDocument } from '../services/api';

// Criar identidade
const handleCreateIdentity = async () => {
  try {
    const response = await createIdentity({
      personalInfo: {
        firstName: "João",
        lastName: "Silva",
        dateOfBirth: "1990-01-01",
        nationality: "BR"
      }
    });
    console.log("Identidade criada:", response.data);
  } catch (error) {
    console.error("Erro:", error);
  }
};

// Upload de documento
const handleUploadDoc = async (file) => {
  try {
    const response = await uploadDocument(file, "passport", "Documento de identidade");
    console.log("Documento enviado:", response.data);
  } catch (error) {
    console.error("Erro:", error);
  }
};
```

---

## 🐳 6. Deploy com Docker Compose (Modo Completo)

### 6.1 Setup Inicial

```bash
git clone https://github.com/dronreef2/IDweb3.git
cd IDweb3
cp .env.example .env
# Configure as variáveis no .env
chmod +x setup.sh
./setup.sh
```

### 6.2 Variáveis de Ambiente Necessárias

Edite o arquivo `.env`:

```env
# Hedera Configuration
HEDERA_OPERATOR_ID=0.0.YOUR_ACCOUNT_ID
HEDERA_OPERATOR_KEY=YOUR_PRIVATE_KEY
HEDERA_NET=testnet

# MongoDB
MONGODB_URI=mongodb://mongo:27017/idweb3
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=changeme

# Redis
REDIS_URL=redis://redis:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Guardian
GUARDIAN_URL=http://guardian:3002

# IPFS (opcional - Web3.Storage)
IPFS_API_URL=https://api.web3.storage
IPFS_API_KEY=your_web3_storage_key

# Frontend
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_NFT_CONTRACT_ADDRESS=0xYOUR_CONTRACT_ADDRESS

# Hardhat (para deploy)
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
PRIVATE_KEY=your_wallet_private_key
```

### 6.3 Serviços Disponíveis

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **API Backend** | http://localhost:3001 | API REST principal |
| **Frontend** | http://localhost:3003 | Interface do usuário |
| **Guardian UI** | http://localhost:3000 | Interface Guardian Framework |
| **MongoDB** | localhost:27017 | Banco de dados |
| **Redis** | localhost:6379 | Cache e sessões |

### 6.4 Comandos Docker Úteis

```bash
# Iniciar todos os serviços
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar serviços
docker-compose down

# Rebuild após mudanças
docker-compose up -d --build

# Ver status
docker-compose ps
```

---

## 🧪 7. Checklist para Implementação

| # | Etapa | Descrição | Comando/Ação |
|---|-------|-----------|--------------|
| 1 | **Clonar o projeto** | Obter código-fonte | `git clone https://github.com/dronreef2/IDweb3.git` |
| 2 | **Configurar .env** | Adicionar credenciais Hedera e outras | Editar `.env` |
| 3 | **Executar setup** | Subir todos os serviços | `./setup.sh` |
| 4 | **Instalar Hardhat** | Preparar ambiente de contratos | `npm install --save-dev hardhat` |
| 5 | **Criar contrato** | Implementar IdentityNFT.sol | Criar arquivo em `contracts/` |
| 6 | **Deploy contrato** | Publicar na testnet | `npx hardhat run scripts/deploy.js --network sepolia` |
| 7 | **Obter tokens faucet** | Carregar carteira com ETH/HBAR teste | Usar faucets |
| 8 | **Conectar frontend** | Integrar contrato NFT no React | Criar `utils/contract.js` |
| 9 | **Testar API** | Validar endpoints REST | Usar curl ou Postman |
| 10 | **Testar identidade** | Criar identidade via UI | Acessar http://localhost:3003 |
| 11 | **Validar blockchain** | Confirmar registro Hedera/EVM | Verificar logs e explorer |
| 12 | **Verificar IPFS** | Confirmar upload de documentos | Validar hashes IPFS |

---

## ✅ Resultado Esperado

Após completar a integração:

1. ✅ **Sistema IDweb3 operacional**: Cria, assina e registra identidades em blockchain
2. ✅ **Frontend React funcional**: Usuários podem criar identidade e visualizar NFTs
3. ✅ **Hardhat integrado**: Contratos EVM gerenciados e deployados
4. ✅ **Faucet configurado**: Tokens de teste disponíveis para transações
5. ✅ **API REST ativa**: Endpoints disponíveis para integrações externas

---

## 📚 Referências e Recursos

### Documentação Oficial
- **Hedera Docs**: https://docs.hedera.com
- **Guardian Framework**: https://docs.hedera.com/guardian
- **Hardhat Docs**: https://hardhat.org/docs
- **OpenZeppelin**: https://docs.openzeppelin.com/contracts
- **Ethers.js**: https://docs.ethers.org

### Explorers
- **Hedera Testnet**: https://hashscan.io/testnet
- **Sepolia Explorer**: https://sepolia.etherscan.io

### Ferramentas
- **MetaMask**: https://metamask.io
- **Infura**: https://infura.io
- **Web3.Storage**: https://web3.storage

---

## 🆘 Troubleshooting

### Problema: "Insufficient funds for gas"
**Solução**: Use a faucet para obter tokens de teste

### Problema: "MetaMask não conecta"
**Solução**: Verifique se está na rede correta (Sepolia ou Hedera Testnet)

### Problema: "Contrato não encontrado"
**Solução**: Confirme o endereço do contrato no `.env`

### Problema: "API retorna 401"
**Solução**: Verifique se o token JWT está sendo enviado no header Authorization

### Problema: "Guardian não responde"
**Solução**: Aguarde a inicialização completa (~2 minutos) após `docker-compose up`

---

## 📧 Suporte

Para dúvidas ou problemas:
- Abra uma issue no GitHub: https://github.com/dronreef2/IDweb3/issues
- Consulte a documentação em `/docs`
- Revise os logs: `docker-compose logs -f`

---

**Status: Guia de Integração Completo** ✅
