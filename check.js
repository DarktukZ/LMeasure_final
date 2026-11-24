// Run: node check.js — ตรวจจำนวนข้อ สัดส่วน และคำนวณคำตอบข้อคำนวณซ้ำ
const assert = require('assert');
const { QUESTIONS, TOPICS } = require('./questions.js');

const count = f => QUESTIONS.filter(f).length;
const total = QUESTIONS.length;
const bonus = count(q => q.k === 'b');
const direct = count(q => q.a === 'ตรง');
const applied = count(q => q.a === 'ประยุกต์');
console.log({ total, bonus, main: total - bonus, direct, applied });
const byTopic = {};
QUESTIONS.forEach(q => byTopic[q.t] = (byTopic[q.t] || 0) + 1);
console.log('ต่อเรื่อง', byTopic);

assert.strictEqual(total, 100, 'ต้องมี 100 ข้อ');
assert.strictEqual(bonus, 30, 'ข้อโบนัสต้องมี 30');
assert.strictEqual(direct, 60, 'ข้อตรงไฟล์ต้องมี 60');
assert.strictEqual(applied, 40, 'ข้อประยุกต์ต้องมี 40');

const seen = new Set();
QUESTIONS.forEach((q, i) => {
    const id = `ข้อ ${i + 1}`;
    assert(TOPICS[q.t], `${id}: ไม่มีเรื่อง ${q.t}`);
    assert(['b', 'm'].includes(q.k) && ['ตรง', 'ประยุกต์'].includes(q.a), `${id}: k/a ผิด`);
    assert(!(q.k === 'b' && q.a === 'ประยุกต์'), `${id}: ข้อโบนัสต้องเป็นข้อตรงไฟล์`);
    assert.strictEqual(q.o.length, 4, `${id}: ต้องมี 4 ตัวเลือก`);
    assert.strictEqual(new Set(q.o).size, 4, `${id}: ตัวเลือกซ้ำ`);
    assert(q.x && q.x.length > 60, `${id}: คำอธิบายสั้นไป`);
    assert(!seen.has(q.q), `${id}: คำถามซ้ำ`);
    seen.add(q.q);
    if (q.calc !== undefined) {
        const v = Function(`return ${q.calc}`)();
        const dp = q.dp ?? 2;
        assert(Math.abs(v - q.ans) < 0.5 * 10 ** -dp + 1e-9, `${id}: calc = ${v} แต่ ans = ${q.ans}`);
        assert(q.o[0].includes(String(q.ans)), `${id}: คำตอบ "${q.o[0]}" ไม่มี ${q.ans}`);
        // ตัวลวงที่เป็นตัวเลขล้วนต้องไม่เท่าคำตอบ (ตัวลวงแบบ "ค่าถูกแต่แปลผลผิด" ตั้งใจให้ซ้ำได้)
        const pure = q.o.slice(1).filter(s => /^[−-]?\d+(\.\d+)?$/.test(s.trim()));
        assert(!pure.some(n => Number(n.replace('−', '-')) === q.ans), `${id}: ตัวลวงมีค่าเท่าคำตอบ`);
    }
});
console.log(`ผ่านทั้งหมด · ข้อคำนวณที่ตรวจซ้ำ ${count(q => q.calc !== undefined)} ข้อ`);

// ---------- กติกาการต่อสู้ ----------
const L = require('./logic.js');
const pair = (ap = 0, dp = 0) => { const a = L.newFighter('A'), d = L.newFighter('D'); a.poison = ap; d.poison = dp; return [a, d]; };
assert.strictEqual(L.MAX_HP, 300);
{ const [a, d] = pair(0, 3); L.resolveAttack(a, d, L.KATANA, null); assert.strictEqual(d.hp, 300 - 40); assert.strictEqual(d.poison, 0); }     // พิษ 3 เทิร์น → 30 + 10
{ const [a, d] = pair(0, 1); L.resolveAttack(a, d, L.KATANA, null); assert.strictEqual(d.hp, 300 - 20); }                                      // พิษ 1 เทิร์น → 10 + 10
{ const [a, d] = pair(0, 0); L.resolveAttack(a, d, L.KATANA, null); assert.strictEqual(a.hp, 300 - 20); assert.strictEqual(d.hp, 300); }      // ไม่มีพิษ → สะท้อนเข้าตัว 20
{ const [a, d] = pair(0, 3); L.resolveAttack(a, d, L.KATANA, L.SHIELD); assert.strictEqual(d.hp, 300 - 20); }                                 // โล่ลดครึ่ง
{ const [a, d] = pair(0, 3); L.resolveAttack(a, d, L.KATANA, L.CLEANSE); assert.strictEqual(d.hp, 300); assert.strictEqual(a.hp, 280); }      // ล้างพิษก่อน → ดาบสะท้อน
{ const [a, d] = pair(0, 2); L.resolveAttack(a, d, L.SWORD, L.CLEANSE); assert.strictEqual(d.poison, 0); assert.strictEqual(d.hp, 275); }     // ล้างพิษ + ยังโดนดาบปกติ
{ const [a, d] = pair(0, 0); L.resolveAttack(a, d, L.STAFF, L.CLEANSE); assert.strictEqual(d.poison, 0); }                                    // คทาใส่พิษไม่ติด
{ const [a, d] = pair(0, 0); L.resolveAttack(a, d, L.STAFF, null); assert.strictEqual(d.poison, 3); }
{ const [a, d] = pair(0, 0); d.hp = 100; L.resolveAttack(a, d, L.BOW, L.HEAL, () => 0.9); assert.strictEqual(d.hp, 100 - 30 + 40); }          // ธนูปกติ 30, ฮีล 40
{ const [a, d] = pair(0, 2); L.resolveAttack(a, d, L.STAFF, null); assert.strictEqual(d.poison, 5); }                                    // พิษสะสม 2 + 3 = 5
{ const [a, d] = pair(0, 5); L.resolveAttack(a, d, L.KATANA, null); assert.strictEqual(d.hp, 300 - 60); }                                     // ระเบิดพิษ 5 เทิร์น → 50 + 10
{ const a = L.newFighter('A'); a.poison = 2; L.tickPoison(a); assert.strictEqual(a.hp, 290); assert.strictEqual(a.poison, 1); }               // พิษกิน 10 ต่อเทิร์น
{ const [a, d] = pair(0, 0); L.resolveAttack(a, d, L.BOW, null, () => 0.1); assert.strictEqual(d.hp, 300 - 90); }                      // ธนูคริติคอล 90
{ const [a, d] = pair(0, 0); L.resolveAttack(a, d, L.BOW, L.SHIELD, () => 0.1); assert.strictEqual(d.hp, 300 - 45); }                  // คริ 90 โดนโล่เหลือ 45
{ const [a, d] = pair(0, 0); a.hp = 200; L.resolveAttack(a, d, L.SWORD, null); assert.strictEqual(a.hp, 215); assert.strictEqual(d.hp, 275); } // ดาบ 25 + ฮีล 15
console.log('กติกาการต่อสู้ผ่านทั้งหมด');
