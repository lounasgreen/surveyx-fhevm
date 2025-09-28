# SurveyX - FHEVM Encrypted Survey Platform

![SurveyX Logo](https://img.shields.io/badge/SurveyX-FHEVM%20Encrypted%20Surveys-blue)
![Blockchain](https://img.shields.io/badge/Blockchain-Ethereum%20Sepolia-orange)
![Privacy](https://img.shields.io/badge/Privacy-Fully%20Homomorphic%20Encryption-green)

## 🔐 Overview

SurveyX is a revolutionary survey platform that leverages **FHEVM (Fully Homomorphic Encryption Virtual Machine)** technology to provide complete privacy protection for survey responses. Built on the Ethereum blockchain, it ensures that individual responses remain encrypted and private while allowing survey creators to decrypt and analyze aggregated results.

## ✨ Key Features

- **🔒 Complete Privacy**: All responses encrypted using FHEVM technology
- **⛓️ Blockchain Integration**: Deployed on Ethereum Sepolia testnet
- **🎯 Survey Management**: Create, manage, and analyze encrypted surveys
- **👥 Access Control**: Public and private survey options with permission management
- **📊 Real-time Analytics**: Decrypt and view survey results while maintaining privacy
- **🌐 Static Deployment**: Ready-to-deploy static frontend
- **🔗 Wallet Integration**: MetaMask support for seamless Web3 interaction

## 🏗️ Architecture

### Smart Contracts (`fhevm-hardhat-template/`)
- **SurveyX.sol**: Main contract for survey creation and management
- **FHEVM Integration**: Full homomorphic encryption support
- **Sepolia Deployment**: Contract deployed at `0xAa73D10AA6D3D3eA95F1d6798924021591748946`

### Frontend (`surveyx-frontend/`)
- **Next.js 15**: Modern React framework with App Router
- **Static Export**: Built for deployment to any static hosting service
- **FHEVM SDK**: Integration with `@zama-fhe/relayer-sdk` and `@fhevm/mock-utils`
- **TypeScript**: Full type safety and modern development experience

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MetaMask wallet
- Sepolia ETH for gas fees

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/lounasgreen/surveyx-fhevm.git
   cd surveyx-fhevm
   ```

2. **Install smart contract dependencies**
   ```bash
   cd fhevm-hardhat-template
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../surveyx-frontend
   npm install
   ```

### Development

1. **Start local blockchain (optional)**
   ```bash
   cd fhevm-hardhat-template
   npx hardhat node
   ```

2. **Start frontend development server**
   ```bash
   cd surveyx-frontend
   npm run dev
   ```

3. **Build static files for deployment**
   ```bash
   npm run build:static
   ```

## 🌐 Live Deployment

### Static Hosting
The frontend is built as static files and can be deployed to:
- **GitHub Pages**: Automatic deployment from repository
- **Netlify**: Drag & drop the `/out` directory
- **Vercel**: Connect repository for automatic deployment
- **AWS S3**: Upload `/out` contents to S3 bucket
- **Any Web Server**: Copy `/out` contents to document root

### Sepolia Testnet
- **Contract Address**: `0xAa73D10AA6D3D3eA95F1d6798924021591748946`
- **Network**: Ethereum Sepolia Testnet
- **RPC URL**: `https://sepolia.infura.io/v3/YOUR_INFURA_KEY`

## 🔧 Technical Details

### FHEVM Integration
- **Mock Mode**: Local development with `@fhevm/mock-utils`
- **Production Mode**: Real encryption with `@zama-fhe/relayer-sdk`
- **Decryption**: Only survey creators can decrypt results
- **Privacy**: Individual responses remain encrypted

### Smart Contract Features
- Survey creation with multiple question types
- Encrypted response storage
- Access control and permissions
- Public/private survey options
- Response counting and analytics

### Frontend Features
- Responsive design with Tailwind CSS
- Dark/light mode support
- Real-time wallet connection
- Dynamic route handling
- Static export optimization

## 📋 Usage Guide

### Creating a Survey
1. Connect MetaMask wallet
2. Navigate to "Create Survey"
3. Add questions (Single Choice, Multiple Choice, Text, Rating)
4. Set survey visibility (Public/Private)
5. Deploy to blockchain

### Participating in Surveys
1. Browse public surveys or use private survey link
2. Connect wallet if required
3. Answer questions (responses are encrypted)
4. Submit encrypted responses

### Viewing Results
1. Navigate to "My Surveys" (for created surveys)
2. Click "View Results"
3. Decrypt results using your wallet signature
4. View aggregated statistics and analytics

## 🛠️ Development

### Smart Contract Development
```bash
cd fhevm-hardhat-template

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to Sepolia
npx hardhat run scripts/deploySurveyX.ts --network sepolia
```

### Frontend Development
```bash
cd surveyx-frontend

# Development server
npm run dev

# Build for production
npm run build

# Build static files
npm run build:static
```

## 📁 Project Structure

```
surveyx-fhevm/
├── fhevm-hardhat-template/          # Smart contracts
│   ├── contracts/                   # Solidity contracts
│   ├── deploy/                      # Deployment scripts
│   ├── test/                        # Contract tests
│   └── hardhat.config.ts           # Hardhat configuration
├── surveyx-frontend/               # Next.js frontend
│   ├── app/                        # App Router pages
│   ├── hooks/                      # React hooks
│   ├── fhevm/                      # FHEVM integration
│   ├── abi/                        # Contract ABIs
│   └── scripts/                    # Build scripts
└── README.md                       # This file
```

## 🔐 Security & Privacy

- **FHEVM Encryption**: All survey responses encrypted using homomorphic encryption
- **Access Control**: Only authorized users can access private surveys
- **Decryption Control**: Only survey creators can decrypt results
- **Blockchain Security**: Leverages Ethereum's security model
- **No Data Leakage**: Individual responses never exposed

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Zama**: For FHEVM technology and SDK
- **Hardhat**: For blockchain development framework
- **Next.js**: For the frontend framework
- **Ethereum**: For the blockchain infrastructure

## 📞 Support

For questions and support:
- Create an [Issue](https://github.com/lounasgreen/surveyx-fhevm/issues)
- Check the [Documentation](https://github.com/lounasgreen/surveyx-fhevm/wiki)
- Review the [Deployment Guide](surveyx-frontend/STATIC_DEPLOYMENT_GUIDE.md)

---

**SurveyX** - Revolutionizing survey privacy with FHEVM technology 🚀
