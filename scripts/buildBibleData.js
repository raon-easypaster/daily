const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'bible');
const OUTPUT = path.join(__dirname, '..', 'data', 'bibleData.js');

const results = [];

if (!fs.existsSync(ROOT)) {
  console.error(`❌ ROOT not found: ${ROOT}`);
  process.exit(1);
}

function extractMeta(html) {
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  const scriptureMatch = html.match(/data-scripture="([^"]+)"/i);

  if (!titleMatch || !scriptureMatch) return null;

  return {
    title: titleMatch[1].trim(),
    scripture: scriptureMatch[1].trim(),
  };
}

function walk(dir) {
  fs.readdirSync(dir).forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) return walk(full);
    if (!file.endsWith('.html')) return;
    if (!/^\d{4}-\d{2}-\d{2}\.html$/.test(file)) return;

    const html = fs.readFileSync(full, 'utf-8');
    const meta = extractMeta(html);
    if (!meta) return;

    results.push({
      date: file.replace('.html', ''),
      title: meta.title,
      scripture: meta.scripture,
      link: `bible/${file}`,
    });
  });
}

walk(ROOT);

results.sort((a, b) => new Date(b.date) - new Date(a.date));

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const output = `// AUTO-GENERATED FILE
window.BIBLE_DATA = ${JSON.stringify(results, null, 2)};
`;

fs.writeFileSync(OUTPUT, output, 'utf-8');

console.log(`✅ Generated ${results.length} items`);
console.log(`📄 Output → ${OUTPUT}`);
