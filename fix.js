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
      
      // Revert the corrupted template literal/className ` Rs. {` to ` ${`
      content = content.replace(/ Rs\. \{/g, ' ${');
      
      // Revert `Rs. Rs. {` to `Rs. ${`
      content = content.replace(/Rs\. Rs\. \{/g, 'Rs. ${');
      
      // Fix `mailto: Rs. {` back to `mailto:${` (or similar)
      content = content.replace(/mailto: Rs\. \{/g, 'mailto:${');
      
      // Let's also fix JSX literal text `>${` to `>Rs. ${`
      // Wait, since I just reverted ` Rs. {` to ` ${`, now JSX like `<td> ${` is reverted.
      // So I can replace `>\s*\$\{` with `>Rs. ${`
      content = content.replace(/(>)\s*\$\{/g, '$1Rs. ${');

      // Also fix `&times; ${` to `&times; Rs. ${`
      content = content.replace(/&times;\s*\$\{/g, '&times; Rs. ${');
      
      // And `Paid: ${` to `Paid: Rs. ${`
      content = content.replace(/Paid:\s*\$\{/g, 'Paid: Rs. ${');

      // What about `Cost: ${` ?
      content = content.replace(/Cost:\s*\$\{/g, 'Cost: Rs. ${');
      content = content.replace(/Selling:\s*\$\{/g, 'Selling: Rs. ${');

      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed: ${filePath}`);
      }
    });
  }
});
