import fs from "fs";
import path from "path";

const HARDHAT_TEMPLATE_PATH = "../fhevm-hardhat-template";
const DEPLOYMENTS_PATH = path.join(HARDHAT_TEMPLATE_PATH, "deployments");
const ABI_OUTPUT_PATH = "./abi";

// Ensure ABI output directory exists
if (!fs.existsSync(ABI_OUTPUT_PATH)) {
  fs.mkdirSync(ABI_OUTPUT_PATH, { recursive: true });
}

function generateABI() {
  console.log("🔄 Generating ABI files...");

  // Generate SurveyX ABI
  const surveyXArtifactPath = path.join(HARDHAT_TEMPLATE_PATH, "artifacts/contracts/SurveyX.sol/SurveyX.json");
  
  if (fs.existsSync(surveyXArtifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(surveyXArtifactPath, "utf8"));
    
    // Generate ABI file
    const abiContent = `export const SurveyXABI = ${JSON.stringify({ abi: artifact.abi }, null, 2)} as const;`;
    fs.writeFileSync(path.join(ABI_OUTPUT_PATH, "SurveyXABI.ts"), abiContent);
    
    console.log("✅ Generated SurveyXABI.ts");
  } else {
    console.log("⚠️  SurveyX artifact not found. Please compile contracts first.");
  }

  // Generate addresses from deployments
  const addresses = {};
  
  if (fs.existsSync(DEPLOYMENTS_PATH)) {
    const networks = fs.readdirSync(DEPLOYMENTS_PATH);
    
    for (const network of networks) {
      const networkPath = path.join(DEPLOYMENTS_PATH, network);
      if (fs.statSync(networkPath).isDirectory()) {
        const surveyXDeployment = path.join(networkPath, "SurveyX.json");
        
        if (fs.existsSync(surveyXDeployment)) {
          const deployment = JSON.parse(fs.readFileSync(surveyXDeployment, "utf8"));
          
          // Map network names to chain IDs
          const chainIdMap = {
            "localhost": "31337",
            "sepolia": "11155111",
            "mainnet": "1"
          };
          
          const chainId = chainIdMap[network] || network;
          
          addresses[chainId] = {
            address: deployment.address,
            chainId: parseInt(chainId),
            chainName: network
          };
        }
      }
    }
  }

  // Generate addresses file
  const addressesContent = `export const SurveyXAddresses = ${JSON.stringify(addresses, null, 2)} as const;`;
  fs.writeFileSync(path.join(ABI_OUTPUT_PATH, "SurveyXAddresses.ts"), addressesContent);
  
  console.log("✅ Generated SurveyXAddresses.ts");
  console.log("🎉 ABI generation completed!");
}

generateABI();
