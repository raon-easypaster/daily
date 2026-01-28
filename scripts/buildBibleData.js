import fs from 'fs';
import path from 'path';

const ROOT = 'bible';
const OUTPUT = 'data/bibleData.js';

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
  fs.readdirSync(dir).forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) {
      walk(full);
      return;
    }

    if (!file.endsWith('.html')) return;

    // 파일명이 YYYY-MM-DD.html 형식이 아니면 스킵
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
      link: full;

    });
  });
}

// 실행
walk(ROOT);

// 날짜 최신순 정렬
results.sort((a, b) => new Date(b.date) - new Date(a.date));

// 출력 JS 생성
const output = `// AUTO-GENERATED FILE (DO NOT EDIT)
const BIBLE_DATA = ${JSON.stringify(results, null, 2)};
`;

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, output, 'utf-8');

console.log(`✅ Generated ${results.length} items → ${OUTPUT}`);
