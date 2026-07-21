const fs = require('fs');
const path = require('path');
const targetDir = path.join(__dirname, 'src/pages');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const regex = /\{Array\.from\(\{ length: Math\.min\(([^,]+), \d+\) \}, \(_, i\) => \{\s*const p = i \+ 1;\s*return \(\s*<button key=\{p\} onClick=\{\(\) => setCurrentPage\(p\)\}\s*style=\{\{ width: 28, height: 28, borderRadius: 6, border: `1px solid \$\{p === currentPage \? 'var\(--accent-primary\)' : 'var\(--border-color\)'\}`, background: p === currentPage \? 'var\(--accent-primary\)' : 'transparent', color: p === currentPage \? '#fff' : 'var\(--text-primary\)', cursor: 'pointer', fontSize: '0\.8rem', fontWeight: p === currentPage \? 700 : 400 \}\}>\s*\{p\}\s*<\/button>\s*\);\s*\}\)\}/g;

const replacement = `{Array.from({ length: Math.max($1 || 1, 1) }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === Math.max($1 || 1, 1) || Math.abs(p - currentPage) <= 2)
                    .reduce((acc, p, i, arr) => {
                      if (i > 0 && p - arr[i - 1] > 1) acc.push('...');
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, idx) => p === '...' ? (
                      <span key={\`ell-\${idx}\`} style={{ padding: '0 4px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>...</span>
                    ) : (
                      <button key={p} onClick={() => setCurrentPage(p)}
                        style={{ width: 28, height: 28, borderRadius: 6, border: \`1px solid \${p === currentPage ? 'var(--accent-primary)' : 'var(--border-color)'}\`, background: p === currentPage ? 'var(--accent-primary)' : 'transparent', color: p === currentPage ? '#fff' : 'var(--text-primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: p === currentPage ? 700 : 400 }}>
                        {p}
                      </button>
                    ))}`;

walkDir(targetDir, function(filePath) {
  if (filePath.endsWith('.jsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (regex.test(content)) {
      console.log('Replacing in: ' + filePath);
      content = content.replace(regex, replacement);
      fs.writeFileSync(filePath, content, 'utf8');
    }
  }
});
