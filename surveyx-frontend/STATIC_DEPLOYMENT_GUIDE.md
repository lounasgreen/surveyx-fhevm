# SurveyX Static Deployment Guide

## 🎉 Static Build Completed Successfully!

SurveyX has been successfully built as static files and is ready for deployment to any static hosting service.

## 📁 Build Output

The static files are located in the `/out` directory with the following structure:

```
out/
├── index.html              # Homepage
├── 404.html               # 404 error page
├── browse/                # Browse surveys page
├── create/                # Create survey page
├── my-surveys/            # My surveys page
├── responses/             # User responses page
├── survey/                # Dynamic survey pages
│   ├── 1/index.html
│   ├── 2/index.html
│   ├── 3/index.html
│   ├── 4/index.html
│   └── 5/index.html
├── results/               # Dynamic results pages
│   ├── 1/index.html
│   ├── 2/index.html
│   ├── 3/index.html
│   ├── 4/index.html
│   └── 5/index.html
├── permissions/           # Dynamic permissions pages
│   ├── 1/index.html
│   ├── 2/index.html
│   ├── 3/index.html
│   ├── 4/index.html
│   └── 5/index.html
└── _next/                 # Next.js assets
    ├── static/
    └── ...
```

## 🚀 Deployment Options

### 1. GitHub Pages
```bash
# Create a gh-pages branch and push the out directory
git checkout --orphan gh-pages
git rm -rf .
cp -r out/* .
git add .
git commit -m "Deploy SurveyX static site"
git push origin gh-pages
```

### 2. Netlify
- Drag and drop the `/out` folder to Netlify
- Or connect your repository and set build command: `npm run build:static`
- Set publish directory: `out`

### 3. Vercel
- Connect your repository to Vercel
- Vercel will automatically detect Next.js and deploy
- For static export, set output: 'export' in next.config.ts (already configured)

### 4. AWS S3
```bash
# Install AWS CLI and configure credentials
aws s3 sync out/ s3://your-bucket-name --delete
aws s3 website s3://your-bucket-name --index-document index.html --error-document 404.html
```

### 5. Any Web Server
Simply copy the contents of the `/out` directory to your web server's document root.

## 📊 Build Statistics

- **Total Size**: ~1.92 MB
- **Pages Generated**: 23 static pages
- **Dynamic Routes**: 15 pages (5 each for survey, results, permissions)
- **Static Routes**: 8 pages (home, browse, create, my-surveys, responses, 404)

## 🔧 Technical Details

### Static Export Configuration
- **Output Mode**: Static export (`output: 'export'`)
- **Image Optimization**: Disabled for static hosting
- **Trailing Slash**: Enabled for better compatibility
- **Dynamic Routes**: Pre-generated with `generateStaticParams`

### Client-Side Routing
- Dynamic routes (survey/[id], results/[id], permissions/[id]) are pre-generated for IDs 1-5
- Additional routes will be handled by client-side routing
- 404 page provides fallback for unknown routes

### Browser Compatibility
- Modern browsers with ES6+ support
- Web3 wallet integration (MetaMask)
- FHEVM library compatibility

## 🔐 Blockchain Integration

The static site includes:
- **Sepolia Testnet**: Contract address `0xAa73D10AA6D3D3eA95F1d6798924021591748946`
- **Localhost**: Contract address `0xc11cf49037a020a712C5d51bDF40A2b7ffB184C2`
- **FHEVM Support**: Both mock-utils and relayer-sdk integration

## 🎯 Features Included

✅ **Homepage**: Landing page with feature overview  
✅ **Survey Creation**: Create encrypted surveys  
✅ **Survey Participation**: Submit encrypted responses  
✅ **Results Viewing**: Decrypt and view survey results  
✅ **Public Survey Browse**: Discover community surveys  
✅ **User Responses**: View submitted responses  
✅ **Wallet Integration**: MetaMask connection  
✅ **FHEVM Encryption**: Full homomorphic encryption  

## 🔄 Rebuilding

To rebuild the static files:
```bash
npm run build:static
```

This will:
1. Clean previous builds
2. Generate ABI files
3. Build Next.js application
4. Export static files to `/out` directory

## 🌐 Live Demo

Once deployed, the static site will provide a fully functional SurveyX experience including:
- Survey creation and management
- Encrypted response collection
- FHEVM-based privacy protection
- Blockchain integration
- Modern responsive UI

The site works as a complete SPA (Single Page Application) with client-side routing for dynamic content.
