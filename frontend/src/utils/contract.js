import { ethers } from "ethers";

// Import the contract ABI (will be available after Hardhat compilation)
// Copy from: artifacts/contracts/IdentityNFT.sol/IdentityNFT.json
let IdentityNFTABI;
try {
  IdentityNFTABI = require("../contracts/IdentityNFT.json");
} catch (e) {
  console.warn("IdentityNFT ABI not found. Please compile and copy the contract first.");
  IdentityNFTABI = { abi: [] };
}

const CONTRACT_ADDRESS = process.env.REACT_APP_NFT_CONTRACT_ADDRESS;

/**
 * Check if MetaMask is installed
 */
export function isMetaMaskInstalled() {
  return typeof window !== "undefined" && typeof window.ethereum !== "undefined";
}

/**
 * Request account access from MetaMask
 */
export async function connectWallet() {
  if (!isMetaMaskInstalled()) {
    throw new Error("MetaMask is not installed. Please install MetaMask to use this feature.");
  }

  try {
    const accounts = await window.ethereum.request({ 
      method: "eth_requestAccounts" 
    });
    return accounts[0];
  } catch (error) {
    console.error("Error connecting to MetaMask:", error);
    throw new Error("Failed to connect wallet: " + error.message);
  }
}

/**
 * Get the current connected wallet address
 */
export async function getCurrentAccount() {
  if (!isMetaMaskInstalled()) {
    return null;
  }

  const accounts = await window.ethereum.request({ 
    method: "eth_accounts" 
  });
  return accounts[0] || null;
}

/**
 * Get the provider, signer, and contract instance
 */
export async function getContract() {
  if (!isMetaMaskInstalled()) {
    throw new Error("MetaMask is not installed");
  }

  if (!CONTRACT_ADDRESS) {
    throw new Error("Contract address not configured. Please set REACT_APP_NFT_CONTRACT_ADDRESS");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  
  // Request account access
  await provider.send("eth_requestAccounts", []);
  
  const signer = await provider.getSigner();
  
  const contract = new ethers.Contract(
    CONTRACT_ADDRESS,
    IdentityNFTABI.abi,
    signer
  );

  return { contract, signer, provider };
}

/**
 * Mint a new Identity NFT
 * @param {string} metadataURI - IPFS URI containing identity metadata (e.g., "ipfs://Qm...")
 * @returns {Object} Transaction result
 */
export async function mintIdentityNFT(metadataURI) {
  try {
    const { contract, signer } = await getContract();
    const userAddress = await signer.getAddress();

    console.log("🎨 Minting Identity NFT for:", userAddress);
    console.log("📄 Metadata URI:", metadataURI);
    
    // Call the mintIdentity function
    const tx = await contract.mintIdentity(userAddress, metadataURI);
    console.log("📤 Transaction sent:", tx.hash);
    
    // Wait for transaction confirmation
    const receipt = await tx.wait();
    console.log("✅ NFT minted successfully!");
    console.log("📝 Transaction receipt:", receipt);

    // Extract token ID from events
    const event = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed.name === "IdentityMinted";
      } catch {
        return false;
      }
    });

    let tokenId = null;
    if (event) {
      const parsed = contract.interface.parseLog(event);
      tokenId = parsed.args.tokenId.toString();
      console.log("🎫 Token ID:", tokenId);
    }

    return {
      success: true,
      transactionHash: tx.hash,
      receipt,
      tokenId
    };
  } catch (error) {
    console.error("❌ Error minting Identity NFT:", error);
    
    let errorMessage = error.message;
    
    // Parse common error messages
    if (error.message.includes("already has an identity")) {
      errorMessage = "This address already has an identity NFT";
    } else if (error.message.includes("user rejected")) {
      errorMessage = "Transaction was rejected by user";
    } else if (error.message.includes("insufficient funds")) {
      errorMessage = "Insufficient funds for gas fees";
    }

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Get the total number of identities minted
 * @returns {number} Token counter
 */
export async function getTokenCounter() {
  try {
    const { contract } = await getContract();
    const counter = await contract.tokenCounter();
    return Number(counter);
  } catch (error) {
    console.error("❌ Error getting token counter:", error);
    throw error;
  }
}

/**
 * Check if an address has an identity NFT
 * @param {string} address - Ethereum address to check
 * @returns {boolean} True if address has an identity NFT
 */
export async function hasIdentityNFT(address) {
  try {
    const { contract } = await getContract();
    const hasNFT = await contract.hasIdentityNFT(address);
    return hasNFT;
  } catch (error) {
    console.error("❌ Error checking identity NFT:", error);
    return false;
  }
}

/**
 * Get the balance of identity NFTs for an address
 * @param {string} address - Ethereum address to check
 * @returns {number} Number of NFTs owned
 */
export async function getBalance(address) {
  try {
    const { contract } = await getContract();
    const balance = await contract.balanceOf(address);
    return Number(balance);
  } catch (error) {
    console.error("❌ Error getting balance:", error);
    return 0;
  }
}

/**
 * Get token URI (IPFS metadata) for a token ID
 * @param {number} tokenId - Token ID to query
 * @returns {string} IPFS URI
 */
export async function getTokenURI(tokenId) {
  try {
    const { contract } = await getContract();
    const uri = await contract.tokenURI(tokenId);
    return uri;
  } catch (error) {
    console.error("❌ Error getting token URI:", error);
    throw error;
  }
}

/**
 * Get the current network information
 * @returns {Object} Network details
 */
export async function getNetwork() {
  try {
    const { provider } = await getContract();
    const network = await provider.getNetwork();
    return {
      name: network.name,
      chainId: Number(network.chainId)
    };
  } catch (error) {
    console.error("❌ Error getting network:", error);
    throw error;
  }
}

/**
 * Switch to the correct network
 * @param {number} chainId - Target chain ID (11155111 for Sepolia, 296 for Hedera Testnet)
 */
export async function switchNetwork(chainId) {
  if (!isMetaMaskInstalled()) {
    throw new Error("MetaMask is not installed");
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: `0x${chainId.toString(16)}` }]
    });
  } catch (error) {
    // If network doesn't exist, add it
    if (error.code === 4902) {
      console.log("Network not found, adding it...");
      // Network configuration would go here
      throw new Error("Network not configured in MetaMask. Please add it manually.");
    }
    throw error;
  }
}

/**
 * Listen for account changes
 * @param {Function} callback - Function to call when account changes
 */
export function onAccountsChanged(callback) {
  if (isMetaMaskInstalled()) {
    window.ethereum.on("accountsChanged", callback);
  }
}

/**
 * Listen for network changes
 * @param {Function} callback - Function to call when network changes
 */
export function onChainChanged(callback) {
  if (isMetaMaskInstalled()) {
    window.ethereum.on("chainChanged", callback);
  }
}

/**
 * Remove event listeners
 */
export function removeListeners() {
  if (isMetaMaskInstalled()) {
    window.ethereum.removeAllListeners("accountsChanged");
    window.ethereum.removeAllListeners("chainChanged");
  }
}

export default {
  isMetaMaskInstalled,
  connectWallet,
  getCurrentAccount,
  getContract,
  mintIdentityNFT,
  getTokenCounter,
  hasIdentityNFT,
  getBalance,
  getTokenURI,
  getNetwork,
  switchNetwork,
  onAccountsChanged,
  onChainChanged,
  removeListeners
};
