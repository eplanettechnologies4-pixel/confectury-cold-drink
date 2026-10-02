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
      
      // We want to find literal $ that wasn't replaced.
      // E.g. ${item.total} or $>$ or $10
      // We'll just print lines that contain $ but not inside a template literal, or just print all $ lines.
      let lines = content.split('\n');
      lines.forEach((line, i) => {
        if (line.includes('$')) {
          // ignore lines with template literals if they don't have another $
          // actually, just print all of them to be safe
          console.log(`[${filePath}:${i+1}] ${line.trim()}`);
        }
      });
    });
  }
});
