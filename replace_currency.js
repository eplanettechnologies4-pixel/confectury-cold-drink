const fs = require('fs');
const path = require('path');

const DIRS = ['app', 'components', 'lib'];

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      if (dirPath.endsWith('.ts') || dirPath.endsWith('.tsx')) {
        callback(dirPath);
      }
    }
  });
}

DIRS.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (fs.existsSync(fullPath)) {
    walkDir(fullPath, (filePath) => {
      let content = fs.readFileSync(filePath, 'utf8');
      let originalContent = content;
      
      // JSX element start e.g. <span>$
      content = content.replace(/(>)\s*\$/g, '$1Rs. ');
      
      // After a colon e.g. Total: $
      content = content.replace(/(:)\s*\$/g, '$1 Rs. ');
      
      // Inside quotes for CSV or similar e.g. "$
      content = content.replace(/("\$)/g, '"Rs. ');
      
      // Also some places might have ' $'
      content = content.replace(/(\s)\$(\{)/g, '$1Rs. $2');

      // specific fixes for UI
      content = content.replace(/&times;\s*\$/g, '&times; Rs. ');
      
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
      }
    });
  }
});
