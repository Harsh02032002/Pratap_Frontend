const fs = require('fs');
const path = require('path');

const issues = [];

function scan(dir) {
  let items;
  try { items = fs.readdirSync(dir, { withFileTypes: true }); } catch(e) { return; }
  for (const item of items) {
    const full = path.join(dir, item.name);
    if (item.isDirectory() && !['node_modules', '.git', 'dist', '.vite'].includes(item.name)) {
      scan(full);
    } else if (item.isFile() && /\.(jsx|js|tsx|ts)$/.test(item.name) && !item.name.includes('.d.ts')) {
      try {
        const code = fs.readFileSync(full, 'utf8');
        const lines = code.split(/\r?\n/);
        
        // Check 1: duplicate "export default X;" 
        const exportDefaultLines = [];
        for (let i = 0; i < lines.length; i++) {
          if (/^\s*export\s+default\s+\w+\s*;?\s*$/.test(lines[i])) {
            exportDefaultLines.push(i + 1);
          }
        }
        if (exportDefaultLines.length > 1) {
          issues.push({ file: full, type: 'DUPLICATE_EXPORT_DEFAULT', lines: exportDefaultLines });
        }

        // Check 2: code after final closing brace of component (JSX after function end)
        // Find last "export default" and check if there's meaningful code after it
        for (let i = lines.length - 1; i >= 0; i--) {
          if (/^\s*export\s+default\s+\w+/.test(lines[i])) {
            const afterCode = lines.slice(i + 1).filter(l => l.trim().length > 0);
            if (afterCode.length > 0) {
              issues.push({ file: full, type: 'CODE_AFTER_EXPORT_DEFAULT', line: i + 1, trailing: afterCode.length + ' lines after' });
            }
            break;
          }
        }

        // Check 3: stray closing braces/tags after function end 
        // Pattern: "}" on its own after the component function has already returned
        let braceDepth = 0;
        let lastFunctionEnd = -1;
        for (let i = 0; i < lines.length; i++) {
          const t = lines[i].trim();
          // Count standalone braces (rough heuristic)
          if (t === '}') {
            braceDepth--;
            if (braceDepth < 0) {
              issues.push({ file: full, type: 'EXTRA_CLOSING_BRACE', line: i + 1 });
              braceDepth = 0;
            }
          }
          // Very rough brace tracking
          const opens = (lines[i].match(/\{/g) || []).length;
          const closes = (lines[i].match(/\}/g) || []).length;
          braceDepth += opens - closes;
        }

        // Check 4: Unexpected "</tag>" appearing after function close
        let foundFuncEnd = false;
        for (let i = 0; i < lines.length; i++) {
          const t = lines[i].trim();
          if (/^(export\s+default\s+|)\s*function\s+\w+|^(export\s+default\s+|const\s+\w+\s*=\s*)\s*(\(|function)/.test(t)) {
            foundFuncEnd = false;
          }
          if (foundFuncEnd && /^\s*<\//.test(lines[i])) {
            issues.push({ file: full, type: 'JSX_AFTER_FUNCTION_END', line: i + 1, content: lines[i].trim().substring(0, 60) });
            break;
          }
          if (t === '}' && i > 10) {
            // Could be function end - check if next non-empty line is JSX close tag
            for (let j = i + 1; j < lines.length && j < i + 5; j++) {
              if (lines[j].trim().length > 0) {
                if (/^\s*<\//.test(lines[j]) || /^\s*\};?\s*$/.test(lines[j])) {
                  // Potential duplicate ending
                }
                break;
              }
            }
          }
        }

      } catch(e) { /* skip */ }
    }
  }
}

scan(path.join('d:', 'hello-roomhy', 'Roomhy-Frontend', 'src'));

if (issues.length === 0) {
  console.log('No issues found!');
} else {
  console.log(`Found ${issues.length} potential issues:\n`);
  for (const issue of issues) {
    console.log(`[${issue.type}] ${issue.file}${issue.line ? ':' + issue.line : ''} ${issue.lines ? 'lines: ' + issue.lines.join(',') : ''} ${issue.trailing || ''} ${issue.content || ''}`);
  }
}
