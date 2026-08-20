const fs = require('fs');
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true, force: true });
}
if (fs.existsSync('.output')) {
  fs.cpSync('.output', 'dist', { recursive: true });
}
console.log('Build output successfully moved from .output to dist!');
