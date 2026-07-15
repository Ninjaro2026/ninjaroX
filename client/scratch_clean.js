const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app', 'page.tsx');
const content = fs.readFileSync(filePath, 'utf8');

// The file has a duplicate copy starting at the second occurrence of '"use client";'
const keyword = '"use client";';
const parts = content.split(keyword);

if (parts.length > 2) {
  // If there are multiple parts (due to multiple duplication runs), we want the last part
  const cleanContent = keyword + parts[parts.length - 1];
  fs.writeFileSync(filePath, cleanContent, 'utf8');
  console.log('Cleaned up page.tsx successfully!');
} else if (parts.length === 2) {
  // Standard duplicate case
  const cleanContent = keyword + parts[1];
  fs.writeFileSync(filePath, cleanContent, 'utf8');
  console.log('Cleaned up page.tsx successfully!');
} else {
  console.log('No duplication detected.');
}
