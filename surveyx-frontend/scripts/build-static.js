const fs = require('fs');
const path = require('path');

console.log('🔄 Building SurveyX for static deployment...');

// Post-build processing for static files
function postProcessStatic() {
  const outDir = path.join(process.cwd(), 'out');
  
  if (!fs.existsSync(outDir)) {
    console.log('❌ Static build output not found. Make sure to run "next build" first.');
    return;
  }

  console.log('✅ Static build found in /out directory');
  
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
  const indexPath = path.join(outDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    console.log('✅ index.html generated');
  }
  
  const createPath = path.join(outDir, 'create.html');
  if (fs.existsSync(createPath)) {
    console.log('✅ create.html generated');
  }
  
  const browsePath = path.join(outDir, 'browse.html');
  if (fs.existsSync(browsePath)) {
    console.log('✅ browse.html generated');
  }

  // Check for _next directory
  const nextDir = path.join(outDir, '_next');
  if (fs.existsSync(nextDir)) {
    console.log('✅ _next assets directory generated');
  }

  console.log('🎉 Static build completed successfully!');
  console.log('📁 Static files are ready in the /out directory');
  console.log('🚀 Deploy the /out directory to any static hosting service');
}

// Run post-processing
postProcessStatic();
