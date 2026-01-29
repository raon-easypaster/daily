const fs = require('fs');
const path = require('path');

const ROOT = 'bible/genesis';
const found = new Set();
const duplicates = new Set();

fs.readdirSync(ROOT).forEach(file => {
  if (!file.endsWith('.html')) return;

  const html = fs.readFileSync(path.join(ROOT, file), 'utf-8');
  const match = html.match(/data-scripture="창세기\s*(\d+)장"/);

  if (!match) {
    console.warn(`⚠️ 장 정보 없음: ${file}`);
    return;
  }

  const chapter = Number(match[1]);
  if (found.has(chapter)) {
    duplicates.add(chapter);
  } else {
    found.add(chapter);
  }
});

// 누락 장 체크 (1–50장)
const missing = [];
for (let i = 1; i <= 50; i++) {
  if (!found.has(i)) missing.push(i);
}

if (duplicates.size) {
  console.error('❌ 중복 장:', [...duplicates].join(', '));
}
if (missing.length) {
  console.warn('⚠️ 누락 장:', missing.join(', '));
}

if (duplicates.size) process.exit(1);
console.log('✅ 장 순서 검사 완료');
