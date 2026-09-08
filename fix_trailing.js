// Auto-fix script: Remove trailing duplicate code after component function ends
// Pattern: function ends with "}" then has duplicate JSX/code after it
const fs = require('fs');
const path = require('path');

const fixed = [];
const errors = [];

function walk(dir) {
  let items;
  try { items = fs.readdirSync(dir, { withFileTypes: true }); } catch(e) { return; }
  for (const item of items) {
    const full = path.join(dir, item.name);
    if (item.isDirectory() && !['node_modules', '.git', 'dist', '.vite'].includes(item.name)) {
      walk(full);
    } else if (item.isFile() && /\.(jsx|js|tsx)$/.test(item.name) && !item.name.includes('.d.')) {
      try {
        checkAndFix(full);
      } catch(e) {
        errors.push(full + ': ' + e.message);
      }
    }
  }
}

function checkAndFix(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');
  const lines = original.split(/\r?\n/);
  const lineEnding = original.includes('\r\n') ? '\r\n' : '\n';
  
  // Find all "export default" statement lines
  const exportDefaultLines = [];
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*export\s+default\s+/.test(lines[i])) {
      exportDefaultLines.push(i);
    }
  }
  
  // If there are duplicate export defaults at the end, remove the later ones
  if (exportDefaultLines.length >= 2) {
    const firstExport = exportDefaultLines[0];
    const lastExport = exportDefaultLines[exportDefaultLines.length - 1];
    
    // Only fix if it's a standalone "export default X;" (not "export default function")
    if (/^\s*export\s+default\s+\w+\s*;?\s*$/.test(lines[lastExport]) && 
        /^\s*export\s+default\s+\w+\s*;?\s*$/.test(lines[firstExport]) &&
        firstExport !== lastExport) {
      // Find where to cut: from after the first export default to end
      const newLines = lines.slice(0, firstExport + 1);
      const newContent = newLines.join(lineEnding) + lineEnding;
      if (newContent !== original) {
        fs.writeFileSync(filePath, newContent);
        fixed.push(filePath + ' (removed duplicate export default, kept line ' + (firstExport+1) + ', removed from line ' + (lastExport+1) + ')');
        return;
      }
    }
  }
  
  // Find the proper end of component: look for the pattern where a function/component ends
  // and there's trailing code after it
  // Strategy: find "export default function" or standalone component function, 
  // then find its closing "}", and check if there's code after
  
  // For "export default function Foo() {" components - track brace depth
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*export\s+default\s+function\s+\w+/.test(lines[i]) || 
        /^\s*function\s+\w+\s*\(/.test(lines[i]) && i > 0 && /export\s+default/.test(lines.slice(Math.max(0,i-3), i+1).join(' '))) {
      // Found component function start, track braces to find its end
      let depth = 0;
      let funcEndLine = -1;
      for (let j = i; j < lines.length; j++) {
        const opens = (lines[j].match(/\{/g) || []).length;
        const closes = (lines[j].match(/\}/g) || []).length;
        depth += opens - closes;
        if (depth === 0 && j > i) {
          funcEndLine = j;
          break;
        }
      }
      
      if (funcEndLine > 0) {
        // Check if there's meaningful code after the function end
        const afterLines = lines.slice(funcEndLine + 1);
        const meaningfulAfter = afterLines.filter(l => l.trim().length > 0 && !l.trim().startsWith('//'));
        
        if (meaningfulAfter.length > 2) {
          // There's trailing code - remove it
          const newLines = lines.slice(0, funcEndLine + 1);
          newLines.push(''); // add final newline
          const newContent = newLines.join(lineEnding);
          if (newContent !== original) {
            fs.writeFileSync(filePath, newContent);
            fixed.push(filePath + ' (removed ' + meaningfulAfter.length + ' trailing lines after function end at line ' + (funcEndLine+1) + ')');
          }
          return;
        }
      }
      break; // Only check first export default function
    }
  }
  
  // Check for stray "}" after proper function end followed by JSX
  // Pattern: "}" alone on a line, then after blank lines, "</Tag>" appears
  let lastCloseBrace = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].trim() === '}') {
      if (lastCloseBrace === -1) {
        lastCloseBrace = i;
      } else {
        // Check if the content between this } and the last } looks like duplicate
        const between = lines.slice(i + 1, lastCloseBrace).filter(l => l.trim());
        if (between.length === 0) {
          // Two consecutive close braces with nothing between - possible duplicate
        }
      }
    }
  }
}

// Scan the pages directories
walk(path.join('d:', 'hello-roomhy', 'Roomhy-Frontend', 'src', 'pages'));
walk(path.join('d:', 'hello-roomhy', 'Roomhy-Frontend', 'src', 'components'));

console.log('\n=== FIXED FILES ===');
if (fixed.length === 0) {
  console.log('No files needed fixing.');
} else {
  fixed.forEach(f => console.log('  FIXED: ' + f));
}

if (errors.length > 0) {
  console.log('\n=== ERRORS ===');
  errors.forEach(e => console.log('  ERROR: ' + e));
}

console.log('\nDone. Fixed ' + fixed.length + ' files.');
