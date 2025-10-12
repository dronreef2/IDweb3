const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting IdentityNFT deployment...\n");
  
  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  // Check account balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");
  
  if (balance === 0n) {
    console.log("❌ Error: Account has no balance!");
    console.log("Please use a faucet to get test tokens:");
    console.log("  - Sepolia: https://sepoliafaucet.com");
    console.log("  - Hedera: https://portal.hedera.com/register");
    process.exit(1);
  }

  // Deploy the contract
  console.log("📦 Deploying IdentityNFT contract...");
  const IdentityNFT = await hre.ethers.getContractFactory("IdentityNFT");
  const nft = await IdentityNFT.deploy();
  
  await nft.waitForDeployment();
  
  const contractAddress = await nft.getAddress();
  console.log("✅ IdentityNFT deployed successfully!\n");
  console.log("📍 Contract address:", contractAddress);
  
  // Get deployment transaction
  const deployTx = nft.deploymentTransaction();
  if (deployTx) {
    console.log("🔗 Transaction hash:", deployTx.hash);
  }
  
  // Get network info
  const network = await hre.ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name, "(Chain ID:", network.chainId, ")");
  
  // Provide next steps
  console.log("\n📝 Next Steps:");
  console.log("─────────────────────────────────────────────────────");
  console.log("1. Save this contract address to your .env file:");
  console.log(`   NFT_CONTRACT_ADDRESS=${contractAddress}`);
  console.log("\n2. Update frontend environment:");
  console.log(`   REACT_APP_NFT_CONTRACT_ADDRESS=${contractAddress}`);
  console.log("\n3. Copy the ABI to frontend:");
  console.log("   cp artifacts/contracts/IdentityNFT.sol/IdentityNFT.json frontend/src/contracts/");
  console.log("\n4. Verify contract on explorer (optional):");
  console.log(`   npx hardhat verify --network ${network.name} ${contractAddress}`);
  console.log("─────────────────────────────────────────────────────\n");
  
  // Get contract info
  const tokenCounter = await nft.tokenCounter();
  const name = await nft.name();
  const symbol = await nft.symbol();
  
  console.log("📊 Contract Information:");
  console.log("  Name:", name);
  console.log("  Symbol:", symbol);
  console.log("  Total Supply:", tokenCounter.toString());
  console.log("  Owner:", await nft.owner());
  
  console.log("\n✅ Deployment complete!");
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
