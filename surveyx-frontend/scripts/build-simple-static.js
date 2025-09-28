const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔄 Building SurveyX for simple static deployment...');

try {
  // Clean previous builds
  console.log('🧹 Cleaning previous builds...');
  execSync('npm run clean', { stdio: 'inherit' });
  
  // Generate ABI files
  console.log('📝 Generating ABI files...');
  execSync('npm run genabi', { stdio: 'inherit' });

  // Build with Next.js
  console.log('🏗️ Building Next.js application...');
  execSync('npx next build', { stdio: 'inherit' });

  // Check if build was successful
  const outDir = path.join(process.cwd(), 'out');
  if (!fs.existsSync(outDir)) {
    console.error('❌ Static build failed - no output directory found');
    process.exit(1);
  }

  console.log('✅ Static build completed successfully!');
  
  // Get total size of static files
  function getDirectorySize(dirPath) {
    let totalSize = 0;
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        totalSize += getDirectorySize(filePath);
      } else {
        totalSize += stats.size;
      }
    }
    
    return totalSize;
  }

  const totalSize = getDirectorySize(outDir);
  const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
  
  console.log(`📊 Total static files size: ${sizeMB} MB`);
  
  // List key files
  const keyFiles = ['index.html', 'create.html', 'browse.html', 'my-surveys.html', 'responses.html'];
  keyFiles.forEach(file => {
    const filePath = path.join(outDir, file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file} generated`);
    } else {
      console.log(`⚠️ ${file} not found`);
    }
  });

  // Check for _next directory
  const nextDir = path.join(outDir, '_next');
  if (fs.existsSync(nextDir)) {
    console.log('✅ _next assets directory generated');
  }

  console.log('🎉 Static build completed successfully!');
  console.log('📁 Static files are ready in the /out directory');
  console.log('🚀 Deploy the /out directory to any static hosting service');
  console.log('');
  console.log('💡 Deployment options:');
  console.log('   • GitHub Pages: Push /out contents to gh-pages branch');
  console.log('   • Netlify: Drag and drop /out folder');
  console.log('   • Vercel: Connect your repository');
  console.log('   • AWS S3: Upload /out contents to S3 bucket');
  console.log('   • Any web server: Copy /out contents to web root');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
