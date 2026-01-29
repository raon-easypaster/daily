const fs = require('fs');
const path = require('path');

const ROOT = 'bible';
let hasError = false;

function walk(dir) {
  fs.readdirSync(dir).forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) {
      walk(full);
      return;
    }

    if (!file.endsWith('.html')) return;

    if (!/^\d{4}-\d{2}-\d{2}\.html$/.test(file)) {
      console.warn(`⚠️ [파일명] ${full}`);
    }

    const html = fs.readFileSync(full, 'utf-8');

    const doctypeCount = (html.match(/<!DOCTYPE html>/gi) || []).length;
    if (doctypeCount !== 1) {
      console.error(`❌ DOCTYPE 오류 (${doctypeCount}개): ${full}`);
      hasError = true;
    }

    if (!/<title>.*<\/title>/i.test(html)) {
      console.error(`❌ title 없음: ${full}`);
      hasError = true;
    }

    if (!/data-scripture=".+?"/i.test(html)) {
      console.error(`❌ data-scripture 없음: ${full}`);
      hasError = true;
    }
  });
}

walk(ROOT);

if (hasError) {
  console.error('\n🚨 HTML 검사 실패 – 수정 후 다시 시도하세요.');
  process.exit(1);
}

console.log('✅ 모든 HTML 검사 통과');
