/**
 * buildBibleData.js
 * ------------------------------------
 * bible/ 아래의 YYYY-MM-DD.html 파일을 스캔하여
 * daily/data/bibleData.js 를 자동 생성한다.
 *
 * 요구 조건:
 * - <title>...</title>           → 카드 제목
 * - <body data-scripture="...">  → 본문 정보
 */

const fs = require('fs');
const path = require('path');

/** 🔹 실제 레포 기준 루트 (중요!) */
const ROOT = 'bible';

/** 🔹 GitHub Pages에서 로드될 위치 */
const OUTPUT = 'daily/data/bibleData.js';

const results = [];

/* -----------------------------
 * 메타 정보 추출
 * ----------------------------- */
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

/* -----------------------------
 * 디렉터리 순회
 * ----------------------------- */
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

    // 파일명: YYYY-MM-DD.html 만 허용
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

      // 👉 GitHub Pages 기준 링크 (/daily/ 이후)
      link: full.replace(/^bible\//, ''),
    });
  });
}

/* -----------------------------
 * 실행
 * ----------------------------- */
console.log(`📂 scanning ROOT: ${ROOT}`);
walk(ROOT);

/* 최신 날짜순 정렬 */
results.sort((a, b) => new Date(b.date) - new Date(a.date));

/* JS 파일 생성 */
const output = `// AUTO-GENERATED FILE (DO NOT EDIT)
const BIBLE_DATA = ${JSON.stringify(results, null, 2)};
`;

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, output, 'utf-8');

console.log(`✅ Generated ${results.length} items → ${OUTPUT}`);
