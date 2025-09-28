import { JsonRpcProvider } from "ethers";

async function checkHardhatNode() {
  try {
    const provider = new JsonRpcProvider("http://localhost:8545");
    const version = await provider.send("web3_clientVersion", []);
    
    if (version && version.toLowerCase().includes("hardhat")) {
      console.log("✅ Hardhat node is running");
      console.log(`Client version: ${version}`);
      
      // Check if it's a FHEVM node
      try {
        const metadata = await provider.send("fhevm_relayer_metadata", []);
        console.log("✅ FHEVM Hardhat node detected");
        console.log("Metadata:", metadata);
      } catch (e) {
        console.log("⚠️  Standard Hardhat node (not FHEVM)");
      }
      
      process.exit(0);
    } else {
      console.log("❌ Node at localhost:8545 is not Hardhat");
      process.exit(1);
    }
  } catch (error) {
    console.log("❌ Hardhat node is not running on localhost:8545");
    console.log("Please start the Hardhat node first:");
    console.log("  cd ../fhevm-hardhat-template");
    console.log("  npm run node");
    process.exit(1);
  }
}

checkHardhatNode();
