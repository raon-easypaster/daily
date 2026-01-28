console.log('🚀 buildBibleData.js started');
const fs = require('fs');
const path = require('path');

const ROOT = 'daily/bible';
const OUTPUT = 'daily/data/bibleData.js';

const results = [];

function extractMeta(html, filePath) {
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  const scriptureMatch = html.match(/data-scripture="([^"]+)"/i);

  if (!titleMatch || !scriptureMatch) {
    console.warn(`⚠️ SKIP (meta missing): ${filePath}`);
    return null;
  }

  return {
    title: titleMatch[1].trim(),
    scripture: scriptureMatch[1].trim(),
  };
}

function walk(dir) {
  if (!fs.existsSync(dir)) {
    console.error(`❌ ROOT not found: ${dir}`);
    process.exit(1);
  }

  fs.readdirSync(dir).forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) {
      walk(full);
      return;
    }

    if (!file.endsWith('.html')) return;

    // YYYY-MM-DD.html 만 허용
    if (!/^\d{4}-\d{2}-\d{2}\.html$/.test(file)) {
      console.warn(`⚠️ SKIP (filename): ${file}`);
      return;
    }

    const html = fs.readFileSync(full, 'utf-8');
    const meta = extractMeta(html, full);
    if (!meta) return;

    results.push({
      date: file.replace('.html', ''),
      title: meta.title,
      scripture: meta.scripture,
      link: full.replace(/^daily\//, ''),
    });
  });
}

// 실행
console.log('🚀 buildBibleData.js started');
walk(ROOT);
console.log('📂 scanning ROOT:', ROOT);


// 🔥 핵심: 결과가 없어도 파일은 만든다
results.sort((a, b) => new Date(b.date) - new Date(a.date));

const output = `// AUTO-GENERATED FILE (DO NOT EDIT)
const BIBLE_DATA = ${JSON.stringify(results, null, 2)};
`;

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, output, 'utf-8');

console.log(`✅ Generated ${results.length} items → ${OUTPUT}`);
