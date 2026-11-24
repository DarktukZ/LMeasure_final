// กติกาการต่อสู้ (ยกมาจาก Power Battle) ไม่มี DOM ในไฟล์นี้

const MAX_HP = 300;
const MAIN_TIME = 20, BONUS_TIME = 10;            // วินาที (ข้อคำนวณใช้ q.time แทน)
const BOT_MAIN_RATE = 0.75, BOT_BONUS_RATE = 0.75;  // โอกาสที่บอทตอบถูก

// img: วางรูปไว้ที่ img/ ตามชื่อนี้ ถ้าไม่มีไฟล์ เกมจะใช้อีโมจิแทน
const WEAPONS = [
    { id: 'sword', icon: '🗡️', img: 'img/sword.png', name: 'ดาบ', dmg: 25, heal: 15 },
    { id: 'bow', icon: '🏹', img: 'img/bow.png', name: 'ธนู', dmg: 30, crit: 0.25, critDmg: 90 },
    { id: 'staff', icon: '🪄', img: 'img/staff.png', name: 'คทาเวท', poisonDmg: 10, poisonTurns: 3 },
    { id: 'katana', icon: '💥', img: 'img/katana.png', name: 'ดาบระเบิดพิษ', bonus: 10, backfire: 20 },
];
const [SWORD, BOW, STAFF, KATANA] = WEAPONS;
SWORD.desc = `ดาเมจ ${SWORD.dmg} + ฮีลตัวเอง ${SWORD.heal}`;
BOW.desc = `ดาเมจ ${BOW.dmg} · ${BOW.crit * 100}% ติดคริติคอล ดาเมจ ${BOW.critDmg}`;
STAFF.desc = `ติดพิษ ${STAFF.poisonDmg} ต่อเทิร์น นาน ${STAFF.poisonTurns} เทิร์น`;
KATANA.desc = `ระเบิดพิษที่เหลือทั้งหมด + ${KATANA.bonus} · ถ้าไม่มีพิษ เจ็บตัวเอง ${KATANA.backfire}`;

const BUFFS = [
    { id: 'shield', icon: '🛡️', img: 'img/shield.png', name: 'โล่', rate: 0.5 },
    { id: 'reflect', icon: '🪞', img: 'img/reflect.png', name: 'สะท้อน', rate: 0.5 },
    { id: 'heal', icon: '💚', img: 'img/heal.png', name: 'ฮีล', amount: 40 },
    { id: 'cleanse', icon: '✨', img: 'img/cleanse.png', name: 'ล้างสถานะ' },
];
const [SHIELD, REFLECT, HEAL, CLEANSE] = BUFFS;
SHIELD.desc = `ลดดาเมจที่โดน ${SHIELD.rate * 100}%`;
REFLECT.desc = `สะท้อนดาเมจ ${REFLECT.rate * 100}% กลับไป`;
HEAL.desc = `ฟื้นเลือด ${HEAL.amount}`;
CLEANSE.desc = 'ล้างพิษที่ติดอยู่ทั้งหมด และกันพิษจากการโจมตีนี้';

function newFighter(name) {
    return { name, hp: MAX_HP, poison: 0 };
}

function heal(f, n) { f.hp = Math.min(MAX_HP, f.hp + n); }
function hurt(f, n) { f.hp = Math.max(0, f.hp - n); }

// โจมตี 1 ครั้ง แก้ค่าทั้งสองฝั่ง แล้วคืนข้อความที่จะแสดง
// buff = บัฟของฝั่งรับ (null ถ้าตอบโบนัสผิด) บัฟไม่กันพิษ
function resolveAttack(att, def, weapon, buff, rand = Math.random) {
    const log = [];
    let dmg = 0;
    // ล้างสถานะทำงานก่อนโดนตี: ดาบระเบิดพิษจะเจอว่าไม่มีพิษ และคทาจะใส่พิษไม่ติด
    if (buff === CLEANSE) {
        log.push(def.poison ? `✨ ${def.name} ล้างพิษ ${def.poison} เทิร์นออกหมด` : `✨ ${def.name} ล้างสถานะ`);
        def.poison = 0;
    }
    if (weapon === SWORD) {
        heal(att, SWORD.heal);
        log.push(`${att.name} ฮีล +${SWORD.heal}`);
        dmg = SWORD.dmg;
    } else if (weapon === BOW) {
        if (rand() < BOW.crit) { dmg = BOW.critDmg; log.push('🎯 คริติคอล!'); }
        else dmg = BOW.dmg;
    } else if (weapon === KATANA) {
        if (def.poison > 0) {
            dmg = def.poison * STAFF.poisonDmg + KATANA.bonus;
            log.push(`💥 ระเบิดพิษ ${def.poison} เทิร์น (${def.poison}×${STAFF.poisonDmg}) + ${KATANA.bonus}`);
            def.poison = 0;
        } else {
            hurt(att, KATANA.backfire);
            log.push(`💥 ${def.name} ไม่มีพิษ! ดาบสะท้อนเข้า ${att.name} เสียเลือด ${KATANA.backfire}`);
        }
    } else if (buff === CLEANSE) {
        log.push(`พิษจากคทาไม่ติด เพราะ${def.name}ล้างสถานะ`);
    } else {
        def.poison += STAFF.poisonTurns; // พิษสะสมได้ เช่น มีอยู่ 2 + ใหม่ 3 = 5 เทิร์น
        log.push(def.poison > STAFF.poisonTurns
            ? `${def.name} ติดพิษเพิ่ม ${STAFF.poisonTurns} เทิร์น รวมเป็น ${def.poison} เทิร์น`
            : `${def.name} ติดพิษ ${STAFF.poisonTurns} เทิร์น`);
    }
    if (dmg && buff === SHIELD) dmg = Math.round(dmg * (1 - SHIELD.rate));
    if (dmg) {
        hurt(def, dmg);
        log.push(`${def.name} เสียเลือด ${dmg}`);
    }
    if (dmg && buff === REFLECT) {
        const back = Math.round(dmg * REFLECT.rate);
        hurt(att, back);
        log.push(`สะท้อนกลับ ${att.name} เสียเลือด ${back}`);
    }
    if (buff === HEAL && def.hp > 0) {
        const n = HEAL.amount;
        heal(def, n);
        log.push(`${def.name} ฮีล +${n}`);
    }
    return log;
}

// เรียกตอนเริ่มเทิร์นของฝั่งที่ติดพิษ
function tickPoison(f) {
    if (f.poison <= 0) return null;
    f.poison--;
    hurt(f, STAFF.poisonDmg);
    return `☠️ ${f.name} โดนพิษ เสียเลือด ${STAFF.poisonDmg} (เหลืออีก ${f.poison} เทิร์น)`;
}

// สำรับคำถาม: สุ่มไม่ซ้ำจนหมดสำรับ แล้วสับใหม่ (ข้อที่ตอบผิดจะถูกใส่กลับมาให้เจออีก)
function makeDeck(list) {
    let pile = [];
    const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    return {
        next() { if (!pile.length) pile = shuffle([...list]); return pile.pop(); },
        retry(q) { pile.splice(Math.floor(Math.random() * (pile.length + 1)), 0, q); },
    };
}

if (typeof module !== 'undefined') {
    module.exports = { MAX_HP, WEAPONS, BUFFS, SWORD, BOW, STAFF, KATANA, SHIELD, REFLECT, HEAL, CLEANSE, newFighter, resolveAttack, tickPoison, makeDeck };
}
