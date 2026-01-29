const fs = require('fs');
const path = require('path');

const ROOT = 'bible';              // HTML 원본 폴더
const OUTPUT = 'data/bibleData.js'; // index.html 기준 상대경로

const results = [];

/* ===== 메타 추출 ===== */
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

/* ===== 디렉터리 순회 ===== */
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
      // ✅ GitHub Pages + /daily/ 하위 경로 대응
      link: `./${full.replace(/\\/g, '/')}`,
    });
  });
}

/* ===== 실행 ===== */
walk(ROOT);

// 최신 날짜 순
results.sort((a, b) => new Date(b.date) - new Date(a.date));

/* ===== 파일 출력 ===== */
const output = `// AUTO-GENERATED FILE (DO NOT EDIT)
const BIBLE_DATA = ${JSON.stringify(results, null, 2)};
`;

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, output, 'utf-8');

console.log(`✅ Generated ${results.length} items → ${OUTPUT}`);
