# Hardhat Integration for IDweb3

This directory contains the Hardhat setup for deploying EVM-compatible smart contracts for the IDweb3 project.

## 📋 Overview

The Hardhat integration adds support for:
- **IdentityNFT Contract**: ERC721 NFT for digital identities
- **EVM Network Support**: Deploy to Sepolia, Hedera EVM, or local networks
- **Frontend Integration**: Connect React app to deployed contracts

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts
```

### 2. Configure Environment

Add to your `.env` file:

```env
# For Sepolia deployment
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
PRIVATE_KEY=your_wallet_private_key_without_0x

# For contract address (after deployment)
NFT_CONTRACT_ADDRESS=0x...

# For frontend
REACT_APP_NFT_CONTRACT_ADDRESS=0x...
```

### 3. Compile Contracts

```bash
npx hardhat compile
```

This generates:
- `artifacts/` - Compiled contracts
- `cache/` - Hardhat cache

### 4. Deploy Contract

**Local (for testing):**
```bash
npx hardhat run scripts/deploy.js --network hardhat
```

**Sepolia Testnet:**
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

**Hedera Testnet:**
```bash
npx hardhat run scripts/deploy.js --network hederaTestnet
```

### 5. Copy ABI to Frontend

After compilation, copy the contract ABI:

```bash
cp artifacts/contracts/IdentityNFT.sol/IdentityNFT.json frontend/src/contracts/
```

## 📁 Directory Structure

```
.
├── contracts/
│   └── IdentityNFT.sol          # Main identity NFT contract
├── scripts/
│   └── deploy.js                 # Deployment script
├── test/                         # Contract tests (optional)
├── hardhat.config.js             # Hardhat configuration
└── README_HARDHAT.md             # This file
```

## 🔧 Contract Details

### IdentityNFT.sol

**Standard**: ERC721 (NFT)

**Key Features**:
- Mint identity NFTs with IPFS metadata
- Soulbound tokens (non-transferable)
- One NFT per address
- Metadata updates for verification status

**Main Functions**:

```solidity
// Mint new identity NFT
function mintIdentity(address to, string memory metadataURI) returns (uint256)

// Get token metadata URI
function tokenURI(uint256 tokenId) returns (string)

// Check if address has identity
function hasIdentityNFT(address owner) returns (bool)

// Get total minted
function totalSupply() returns (uint256)
```

## 🌐 Supported Networks

### Local Network (Hardhat)
- **RPC**: http://localhost:8545
- **Chain ID**: 31337
- **Use for**: Local testing

### Ethereum Sepolia
- **Chain ID**: 11155111
- **Explorer**: https://sepolia.etherscan.io
- **Faucet**: https://sepoliafaucet.com

### Hedera Testnet (EVM)
- **RPC**: https://testnet.hashio.io/api
- **Chain ID**: 296
- **Explorer**: https://hashscan.io/testnet
- **Faucet**: https://portal.hedera.com/register

## 💧 Getting Test Tokens

Before deploying, get test tokens:

1. **Sepolia ETH**:
   - Visit: https://sepoliafaucet.com
   - Connect wallet and request tokens
   - Wait 1-2 minutes

2. **Hedera HBAR**:
   - Visit: https://portal.hedera.com/register
   - Create testnet account
   - Use provided credentials

## 🧪 Testing

Run contract tests:

```bash
npx hardhat test
```

Check gas usage:

```bash
REPORT_GAS=true npx hardhat test
```

## 🔍 Verify Contract (Optional)

After deployment on Sepolia:

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

## 🛠️ Common Tasks

### Start Local Node

```bash
npx hardhat node
```

### Run Hardhat Console

```bash
npx hardhat console --network sepolia
```

### Clean Build Artifacts

```bash
npx hardhat clean
```

## 📚 Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Ethers.js Docs](https://docs.ethers.org)
- [Hedera Docs](https://docs.hedera.com)

## 🆘 Troubleshooting

### "Insufficient funds for gas"
**Solution**: Get test tokens from faucet

### "Invalid nonce"
**Solution**: Reset MetaMask account or wait for pending transactions

### "Contract deployment failed"
**Solution**: Check gas price and network connection

### "Module not found: @openzeppelin/contracts"
**Solution**: Run `npm install @openzeppelin/contracts`

## 📝 Next Steps

After deployment:

1. ✅ Save contract address to `.env`
2. ✅ Copy ABI to frontend
3. ✅ Update `REACT_APP_NFT_CONTRACT_ADDRESS`
4. ✅ Test minting in the UI
5. ✅ Verify on blockchain explorer

---

**Need help?** Check the main [Integration Guide](docs/INTEGRATION_GUIDE.md)
