// Run: node make-pdf.js — สร้าง PDF เฉลย 100 ข้อจาก questions.js (ชุดเดียวกับในเกม)
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { TOPICS, QUESTIONS } = require('./questions.js');

const OUT_PDF = path.resolve(__dirname, '..', 'เฉลย_แบบทดสอบ100ข้อ_วัดประเมิน.pdf');
const OUT_HTML = path.join(__dirname, 'เฉลย.html');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

// สลับตัวเลือกแบบคงที่ (ได้ลำดับเดิมทุกครั้งที่สร้างใหม่) เพื่อไม่ให้คำตอบอยู่ข้อ ก ตลอด
function seeded(seed) { return () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648; }
const rand = seeded(2569);
const LETTERS = ['ก', 'ข', 'ค', 'ง'];
const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

const items = [...QUESTIONS].sort((a, b) => a.t - b.t).map((q, i) => {
    const order = [0, 1, 2, 3];
    for (let k = 3; k > 0; k--) { const j = Math.floor(rand() * (k + 1)); [order[k], order[j]] = [order[j], order[k]]; }
    return { ...q, n: i + 1, opts: order.map(o => q.o[o]), ans: order.indexOf(0) };
});

const count = f => QUESTIONS.filter(f).length;
let html = `<!DOCTYPE html><html lang="th"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
  @page { size: A4; margin: 16mm 15mm 16mm; }
  body { font-family: 'Sarabun', sans-serif; font-size: 13.5pt; line-height: 1.6; color: #1f1630; }
  h1 { font-size: 24pt; margin: 0; color: #86198f; }
  h2 { font-size: 16pt; color: #fff; background: #7c3aed; padding: 4px 12px; border-radius: 8px; margin: 18px 0 8px; break-after: avoid; }
  .sub { color: #555; margin: 4px 0 10px; }
  .howto { background: #f5f3ff; border-radius: 10px; padding: 8px 14px; font-size: 12.5pt; }
  table.key { border-collapse: collapse; width: 100%; margin-top: 10px; font-size: 12pt; }
  table.key td { border: 1px solid #ddd6fe; text-align: center; padding: 2px 0; }
  table.key td.n { background: #f5f3ff; font-weight: 700; color: #6d28d9; width: 6%; }
  .q { break-inside: avoid; border: 1.5px solid #e9d5ff; border-radius: 10px; padding: 8px 12px; margin: 8px 0; }
  .qh { font-weight: 700; }
  .tag { font-size: 10pt; font-weight: 600; padding: 1px 7px; border-radius: 99px; margin-left: 6px; vertical-align: 2px; }
  .tag.d { background: #e0f2fe; color: #0369a1; } .tag.a { background: #fef3c7; color: #b45309; } .tag.b { background: #fce7f3; color: #be185d; }
  .opts { margin: 4px 0 4px 10px; }
  .opt.ok { color: #15803d; font-weight: 700; }
  .ex { background: #f0fdf4; border-left: 4px solid #22c55e; padding: 6px 10px; border-radius: 6px; font-size: 12.5pt; }
  .ex b { color: #15803d; }
  .note { font-size: 11pt; color: #9a3412; margin-top: 14px; }
</style></head><body>
<h1>เฉลยแบบทดสอบ 100 ข้อ · การวัดประเมินผลการเรียนรู้และการประกันคุณภาพการศึกษา</h1>
<div class="sub">ข้อสอบชุดเดียวกับในเกม Boba Battle · เนื้อหาจาก "สรุปวัดประเมิน.pdf" หน้า 8–22 (เรื่องที่ 7–15)</div>
<div class="howto">
  ถามตรงตามไฟล์ <b>${count(q => q.a === 'ตรง')}</b> ข้อ <span class="tag d">ตรงไฟล์</span> · ประยุกต์/คำนวณ <b>${count(q => q.a === 'ประยุกต์')}</b> ข้อ <span class="tag a">ประยุกต์</span>
  · ในเกมเป็นข้อหลัก ${count(q => q.k === 'm')} ข้อ และข้อโบนัส ${count(q => q.k === 'b')} ข้อ <span class="tag b">โบนัส</span><br>
  วิธีใช้: ลองทำเองก่อนโดยปิดคำอธิบายไว้ แล้วตรวจกับตารางเฉลยด้านล่าง ข้อไหนผิดให้อ่านคำอธิบายของข้อนั้น
  ข้อคำนวณทุกข้อตรวจคำตอบซ้ำด้วยสคริปต์ (check.js) แล้ว
</div>
<table class="key">`;
for (let r = 0; r < 10; r++) {
    html += '<tr>';
    for (let c = 0; c < 10; c++) { const it = items[c * 10 + r]; html += `<td class="n">${it.n}</td><td>${LETTERS[it.ans]}</td>`; }
    html += '</tr>';
}
html += '</table>';

let topic = null;
for (const it of items) {
    if (it.t !== topic) { topic = it.t; html += `<h2>เรื่องที่ ${topic} ${esc(TOPICS[topic])}</h2>`; }
    html += `<div class="q"><div class="qh">${it.n}. ${esc(it.q)}
      <span class="tag ${it.a === 'ตรง' ? 'd' : 'a'}">${it.a === 'ตรง' ? 'ตรงไฟล์' : 'ประยุกต์'}</span>${it.k === 'b' ? '<span class="tag b">โบนัส</span>' : ''}</div>
      <div class="opts">${it.opts.map((o, i) => `<div class="opt${i === it.ans ? ' ok' : ''}">${LETTERS[i]}. ${esc(o)}${i === it.ans ? ' ✔' : ''}</div>`).join('')}</div>
      <div class="ex"><b>ตอบ ${LETTERS[it.ans]}. ${esc(it.o[0])}</b><br>${esc(it.x)}</div></div>`;
}
html += `<div class="note">หมายเหตุ: ไฟล์สรุปต้นฉบับมีคำเตือนว่า "ระวังจุดผิด" เฉลยนี้ยึดตามไฟล์สรุปเป็นหลัก เช่น ตารางวิธีของ Carver ในไฟล์วางช่อง c ไว้ที่ "ไม่ผ่าน–ไม่ผ่าน" จึงใช้สูตร P = (a + c)/N ตามไฟล์ ถ้าเอกสารของอาจารย์เขียนต่างไป ให้ยึดตามอาจารย์</div>
</body></html>`;

fs.writeFileSync(OUT_HTML, html);
execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-pdf-header-footer', '--virtual-time-budget=8000', `--print-to-pdf=${OUT_PDF}`, 'file://' + OUT_HTML], { stdio: 'ignore' });
console.log('สร้างแล้ว:', OUT_PDF);
