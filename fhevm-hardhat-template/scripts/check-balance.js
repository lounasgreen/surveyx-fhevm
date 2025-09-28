const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("🔍 Checking account balance for Sepolia deployment...");
  console.log("📝 Deployer account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  const balanceETH = ethers.formatEther(balance);
  
  console.log("💰 Account balance:", balanceETH, "ETH");
  
  // Check if sufficient for deployment (estimate 0.01 ETH minimum)
  const minRequired = ethers.parseEther("0.01");
  
  if (balance >= minRequired) {
    console.log("✅ Sufficient balance for deployment");
    
    // Get current gas price for cost estimation
    try {
      const gasPrice = await ethers.provider.getFeeData();
      console.log("⛽ Current gas price:", ethers.formatUnits(gasPrice.gasPrice || 0, "gwei"), "gwei");
      
      // Estimate deployment cost (SurveyX uses ~2.4M gas)
      const estimatedGas = 2500000n; // Conservative estimate
      const estimatedCost = estimatedGas * (gasPrice.gasPrice || 20000000000n);
      console.log("💸 Estimated deployment cost:", ethers.formatEther(estimatedCost), "ETH");
      
      if (balance >= estimatedCost * 2n) { // 2x buffer
        console.log("✅ Sufficient balance for deployment with buffer");
      } else {
        console.log("⚠️  Balance is close to minimum - consider getting more ETH");
      }
    } catch (error) {
      console.log("ℹ️  Could not estimate gas costs");
    }
  } else {
    console.log("❌ Insufficient balance for deployment");
    console.log("💡 Please get Sepolia ETH from:");
    console.log("   - https://sepoliafaucet.com/");
    console.log("   - https://faucets.chain.link/sepolia");
    console.log("   - https://sepolia-faucet.pk910.de/");
  }
  
  // Show network info
  const network = await ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name, "(Chain ID:", network.chainId.toString() + ")");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
