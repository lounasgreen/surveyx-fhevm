# 🌐 SurveyX Sepolia Testnet Deployment Guide

## 📋 Prerequisites

### 1. **Setup Environment Variables**
You need to configure these hardhat variables:

```bash
cd fhevm-hardhat-template
npx hardhat vars set MNEMONIC
npx hardhat vars set INFURA_API_KEY  
npx hardhat vars set ETHERSCAN_API_KEY
```

### 2. **Required Accounts & Keys**

#### **MNEMONIC**:
- Your 12-word seed phrase for the deployer account
- Make sure the first account has Sepolia ETH
- Get Sepolia ETH from: https://sepoliafaucet.com/

#### **INFURA_API_KEY**:
- Create account at: https://infura.io/
- Create new project
- Copy the Project ID as API key

#### **ETHERSCAN_API_KEY** (Optional):
- Create account at: https://etherscan.io/
- Go to: https://etherscan.io/apis
- Create new API key for contract verification

## 🚀 Deployment Steps

### Step 1: Set Environment Variables
```bash
cd fhevm-hardhat-template

# Set your 12-word mnemonic (deployer account)
npx hardhat vars set MNEMONIC
# Enter: "your twelve word mnemonic phrase here..."

# Set Infura API key
npx hardhat vars set INFURA_API_KEY  
# Enter: your_infura_project_id

# Set Etherscan API key (optional, for verification)
npx hardhat vars set ETHERSCAN_API_KEY
# Enter: your_etherscan_api_key
```

### Step 2: Check Account Balance
```bash
# Check if deployer account has Sepolia ETH
npx hardhat run scripts/check-balance.js --network sepolia
```

### Step 3: Deploy to Sepolia
```bash
# Deploy SurveyX contract to Sepolia
npx hardhat deploy --network sepolia --tags SurveyX
```

### Step 4: Verify Contract (Optional)
```bash
# Verify contract on Etherscan
npx hardhat verify --network sepolia [CONTRACT_ADDRESS]
```

## 📊 Expected Deployment Output

```
Nothing to compile
deploying "SurveyX" (tx: 0x...)...: deployed at 0x... with XXXXX gas
SurveyX contract deployed at: 0x...

✅ Deployment successful!
Contract Address: 0x...
Transaction Hash: 0x...
Gas Used: XXXXX
Network: Sepolia (Chain ID: 11155111)
```

## 🔗 After Deployment

### **Contract Information**:
- **Network**: Sepolia Testnet
- **Chain ID**: 11155111
- **Contract Address**: Will be displayed after deployment
- **Explorer**: https://sepolia.etherscan.io/

### **Frontend Configuration**:
The frontend will automatically detect Sepolia deployment and update the ABI files.

## ⚠️ Important Notes

### **Gas Costs**:
- Sepolia deployment requires real ETH
- SurveyX is a complex contract (~2.4M gas)
- Estimated cost: ~0.01-0.05 ETH on Sepolia

### **Network Switching**:
- Your MetaMask will need to be on Sepolia network
- Frontend will work with both localhost and Sepolia
- FHEVM will use real relayer services on Sepolia

### **FHEVM on Sepolia**:
- Real FHEVM functionality (not mock)
- Requires real relayer SDK
- More realistic testing environment

## 🎯 Troubleshooting

### **"Insufficient funds"**:
- Get more Sepolia ETH from faucets
- https://sepoliafaucet.com/
- https://faucets.chain.link/sepolia

### **"Invalid API key"**:
- Check INFURA_API_KEY is correct
- Ensure project is active
- Verify endpoint URL

### **"Network error"**:
- Check internet connection
- Verify Infura service status
- Try different RPC endpoint

## 🚀 Ready for Deployment

Once environment variables are set:
1. **Fund deployer account** with Sepolia ETH
2. **Run deployment command**
3. **Update frontend configuration**
4. **Test on Sepolia network**

The deployment will create a production-ready SurveyX instance on Sepolia testnet! 🌐
