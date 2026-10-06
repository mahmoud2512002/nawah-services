/* ══════════════════════════════════════════════════════════════
   كارنيهات كوين سيرفيس — صفحة جديدة في لوحة الإدارة

   • نفس فكرة صفحة الكارنيهات القديمة، بس باللوجو واسم كوين سيرفيس
     وتعليمات ضهر مناسبة للأمن والإدارة. الوظايف: فرد أمن، مشرف، مدير، نائب مدير + «أخرى». الوظيفة على الكارنيه تلقائي أو بتتكتب
     بإيدك (وتتحفظ في قائمة تختار منها بعد كده).
   • البيانات على جهاز الإدارة بس (localStorage) — مبتترفعش للسيرفر،
     ماعدا رقم الكارنيه قصاد الفني المربوط (زي الصفحة القديمة)
     عشان يظهر في أوامر الشغل.
   • استيراد كتير مرة واحدة: ملف الإكسل + الصور (اسم كل صورة = الرقم القومي)،
     وبعدين مراجعة كارنيه كارنيه أو حفظ الكل (مكتبة vendor/xlsx.mini.min.js بتتحمّل وقت الحاجة).
   • الطباعة: ٩ كارنيهات في ورقة A4، وش ثم ضهر معكوس.
   • الملف بيسجّل نفسه في التنقّل (go) — مفيش تعديل في app.js.
   ══════════════════════════════════════════════════════════════ */
(function () {
'use strict';
if (typeof VIEWS === 'undefined' || typeof go !== 'function' || typeof store === 'undefined') return;

const LOGO = 'queen-logo.png';
const K = { cards: 'qcards', set: 'qcardsSet', jobs: 'qcardsJobs', depts: 'qcardsDepts' };

/* تعليمات ضهر كارنيه كوين — للأمن والإشراف والإدارة */
const DEFAULT_INS = [
  'تُعلَّق البطاقة في مكان ظاهر طوال فترة العمل، وتُبرَز عند الطلب.',
  'البطاقة شخصية، ولا يجوز إعارتها أو استخدامها في غير أغراض العمل.',
  'يلتزم حاملها بتعليمات الإدارة ومواعيد العمل والزي الرسمي.',
  'البطاقة ملك الشركة، وتُسلَّم للإدارة عند انتهاء الخدمة.',
  'عند فقدها يُبلَّغ المشرف أو الإدارة فوراً.'
];
/* تعليمات ضهر كارنيه المدير ونائب المدير */
const MGMT_ROLES = ['manager', 'deputy'];
const DEFAULT_INS_MGMT = [
  'حامل البطاقة من الإدارة العليا للشركة، ومخوَّل بالإشراف على جميع العاملين والمواقع.',
  'له حق دخول المواقع ومراجعة السجلات والتقارير في أي وقت.',
  'تُبرَز عند التعامل مع الجهات الرسمية أو العملاء بصفته ممثلاً عن الشركة.',
  'البطاقة شخصية ولا يجوز استخدامها في غير أغراض العمل، وتُسلَّم عند ترك المنصب.',
  'عند فقدها يُبلَّغ مجلس إدارة الشركة فوراً.'
];
/* تعليمات النسخة الأولى (بتاعة الصيانة) — لو لسه متخزنة زي ما هي تتبدّل بالجديدة */
const OLD_INS = [
  'تُبرَز للساكن قبل دخول أي وحدة سكنية.',
  'لا يبدأ العمل إلا بأمر شغل معتمد.',
  'البطاقة شخصية وملك الشركة، ولا يجوز التنازل عنها.',
  'عند فقدها يُبلَّغ مسؤول الأمن فوراً.'
];
const DEFAULT_SET = {
  company: 'كوين سيرفيس',
  tagline: 'للخدمات المتكاملة',
  frontFoot: 'المدينة السكنية بالضبعة',
  fullName: 'شركة كوين سيرفيس للخدمات المتكاملة',
  insTitle: 'تعليمات',
  instructions: DEFAULT_INS.slice(),
  instructionsMgmt: DEFAULT_INS_MGMT.slice(),
  contact: ''
};
const DEFAULT_JOBS = ['فرد أمن', 'مشرف', 'مدير', 'نائب مدير'];

let cards = store.get(K.cards, []);
let S = Object.assign({}, DEFAULT_SET, store.get(K.set, {}));
if (!Array.isArray(S.instructions) || S.instructions.join('\n') === OLD_INS.join('\n')) S.instructions = DEFAULT_INS.slice();
if (!Array.isArray(S.instructionsMgmt)) S.instructionsMgmt = DEFAULT_INS_MGMT.slice();
let jobs = store.get(K.jobs, DEFAULT_JOBS.slice());
if (!Array.isArray(cards)) cards = [];
if (!Array.isArray(jobs)) jobs = DEFAULT_JOBS.slice();
/* أقسام بتضيفها من «أخرى» — للكارنيهات بس، مش بتظهر للسكان في طلب الصيانة */
let custom = store.get(K.depts, []);
if (!Array.isArray(custom)) custom = [];
/* الوظيفة على الكارنيه: تلقائي أو بتتكتب بالإيد — آخر اختيار بيتفضل */
if (typeof S.jobAuto !== 'boolean') S.jobAuto = true;
if (typeof S.secAuto !== 'boolean') S.secAuto = true;

const selected = new Set();
let editingId = null, noTouched = false, draft = null, photoSrc = '', side = 'front', wired = false;

/* ── أدوات ──────────────────────────────── */
const latin = (s) => String(s || '').replace(/[٠-٩]/g, (d) => d.charCodeAt(0) - 1632).replace(/[۰-۹]/g, (d) => d.charCodeAt(0) - 1776);
const arN = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
const qid = () => 'q' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const byId = (id) => cards.find((c) => c.id === id) || null;
const fmtD = (iso) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? m[3] + '/' + m[2] + '/' + m[1] : (iso || ''); };
const saveCards = () => store.set(K.cards, cards);

/* ── كود التصريح: ٤ حروف + ٤ أرقام، عشوائي ومش بيتكرر — زي  KQTM-4827
   (من غير I و O عشان متتلخبطش مع 1 و 0). بيتطبع على الوش وجوه الـ QR،
   وبيتدوّر عليه في «التحقق من كارنيه». */
const CODE_L = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const normCode = (s) => latin(s).toUpperCase().replace(/[^A-Z0-9]/g, '');
function rnd(n) {
  try { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; }
  catch (e) { return Math.floor(Math.random() * n); }
}
function genCode() {
  const used = new Set(cards.map((c) => normCode(c.code)));
  for (;;) {
    let l = '', d = '';
    for (let i = 0; i < 4; i++) { l += CODE_L[rnd(CODE_L.length)]; d += rnd(10); }
    if (!used.has(l + d)) return l + '-' + d;
  }
}
/* الكارنيهات اللي اتعملت قبل الكود بتاخد كود مرة واحدة */
if (cards.some((c) => c && (!c.code || 'exp' in c))) {
  cards.forEach((c) => {
    if (!c) return;
    if (!c.code) c.code = genCode();
    delete c.exp;                     // تاريخ نهاية التصريح اتشال من الكارنيه
  });
  saveCards();
}

/* وظايف كوين سيرفيس الثابتة — كل وظيفة ليها لون وحرف في رقم الكارنيه.
   «أخرى» بتفتح خانة تكتب فيها وظيفة جديدة وتتحفظ معاهم. */
const ROLES = [
  { id: 'guard',   name: 'فرد أمن',   code: 'G', color: { ink: '#C0304A', deep: '#761628', tint: '#FBE4E8' } },
  { id: 'super',   name: 'مشرف',      code: 'S', color: { ink: '#6A3FB5', deep: '#3D2170', tint: '#EEE6FA' } },
  { id: 'manager', name: 'مدير',      code: 'M', color: { ink: '#0D3B8C', deep: '#061F4F', tint: '#DCE6F7' } },
  { id: 'deputy',  name: 'نائب مدير', code: 'N', color: { ink: '#0E8A9A', deep: '#06525C', tint: '#DDF2F5' } },
  { id: 'other',   name: 'أخرى',      code: 'X', color: { ink: '#4A5578', deep: '#262D4A', tint: '#E9ECF4' } }
];
const siteDepts = () => ROLES;
const depts = () => siteDepts().concat(custom);
const customOf = (id) => custom.find((d) => d.id === id) || null;
const deptOf = (id) => depts().find((x) => x.id === id) || depts()[0] || { id: 'other', name: 'أخرى' };
const deptName = (id) => { const d = deptOf(id); return d.name || ''; };
function deptCol(id) {
  const d = depts().find((x) => x.id === id);
  const k = (d && d.color) || ROLES[ROLES.length - 1].color;
  return { c1: k.ink, c2: k.deep, tint: k.tint };
}
function codeOf(id) {
  const d = depts().find((x) => x.id === id);
  return (d && d.code) || 'X';
}
/* الوظيفة التلقائية = اسم الوظيفة المختارة (و«أخرى» من غير اسم بتفضل فاضية) */
function autoJob(id) {
  return id === 'other' ? '' : String(deptName(id) || '').trim();
}
/* القسم التلقائي حسب الوظيفة (الوظيفة الجديدة من «أخرى» قسمها بيتكتب بالإيد) */
const AUTO_SEC = { guard: 'الأمن', super: 'الإشراف', manager: 'الإدارة', deputy: 'الإدارة' };
const autoSec = (id) => AUTO_SEC[id] || '';
/* الوظيفة والقسم: اللي على «تلقائي» بيتكتب من الوظيفة المختارة */
function syncJob() {
  if (!draft) return;
  if (draft.jobAuto) {
    draft.job = autoJob(draft.dept);
    const j = document.getElementById('qcJob');
    if (j) j.value = draft.job;
  }
  if (draft.secAuto) {
    draft.sec = autoSec(draft.dept);
    const s = document.getElementById('qcSec');
    if (s) s.value = draft.sec;
  }
}
/* الوظيفة الجديدة بتاخد حرف فاضي لرقم الكارنيه ولون مش مستخدم */
const EXTRA_COLORS = [
  { ink: '#6E7F1F', deep: '#414C0E', tint: '#F0F3DC' },
  { ink: '#D2552E', deep: '#7E2D14', tint: '#FDE9E1' },
  { ink: '#2F6F4F', deep: '#173D2A', tint: '#E2F0E8' },
  { ink: '#9C6B00', deep: '#5C3F00', tint: '#F8EED6' },
  { ink: '#3D5A80', deep: '#1F2F45', tint: '#E5ECF5' },
  { ink: '#A23B5A', deep: '#5E1F33', tint: '#F8E4EB' },
  { ink: '#00796B', deep: '#004D43', tint: '#DDF1EE' },
  { ink: '#5D4037', deep: '#33221C', tint: '#EFE7E3' },
  { ink: '#283593', deep: '#141B4D', tint: '#E4E7F6' }
];
function freeCode() {
  const used = {};
  depts().forEach((d) => { used[codeOf(d.id)] = 1; });
  const pool = (typeof CODE_SPARE === 'string' ? CODE_SPARE : '') + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let i = 0; i < pool.length; i++) if (!used[pool[i]]) return pool[i];
  return 'X';
}
function freeColor() {
  const used = {};
  depts().forEach((d) => { used[deptCol(d.id).c1.toUpperCase()] = 1; });
  return EXTRA_COLORS.find((c) => !used[c.ink.toUpperCase()]) || EXTRA_COLORS[custom.length % EXTRA_COLORS.length];
}
const normD = (s) => String(s || '').replace(/[\u064B-\u0652\u0640]/g, '').replace(/[أإآ]/g, 'ا').replace(/[ىئ]/g, 'ي').replace(/ؤ/g, 'و').replace(/ة/g, 'ه').replace(/\s+/g, ' ').trim();
const hasOther = () => siteDepts().some((d) => d.id === 'other');
function deptChips() {
  return siteDepts().map((d) => {
    const k = deptCol(d.id);
    return `<button type="button" class="dl-chip${d.id === draft.dept ? ' on' : ''}" data-qcdept="${esc(d.id)}" role="radio" aria-checked="${d.id === draft.dept}" style="--d:${k.c1};--dt:${k.tint}"><i></i>${esc(d.name)}</button>`;
  }).join('') + custom.map((d) => {
    const k = deptCol(d.id);
    return `<span class="qc-dwrap"><button type="button" class="dl-chip${d.id === draft.dept ? ' on' : ''}" data-qcdept="${esc(d.id)}" role="radio" aria-checked="${d.id === draft.dept}" style="--d:${k.c1};--dt:${k.tint}"><i></i>${esc(d.name)}</button><button type="button" class="qc-dx" data-qcdeptdel="${esc(d.id)}" aria-label="مسح وظيفة ${esc(d.name)}">×</button></span>`;
  }).join('') + (hasOther() ? '' : '<button type="button" class="dl-chip" data-qc="newdept" style="--d:var(--navy);--dt:var(--sky-soft)"><i></i>+ وظيفة جديدة</button>');
}
function paintDepts() {
  const lg = document.getElementById('qcDepts');
  if (lg) lg.innerHTML = deptChips();
  const nd = document.getElementById('qcNewDept');
  if (nd) nd.hidden = draft.dept !== 'other' && !nd.dataset.force;
}
function pickDept(id) {
  draft.dept = id;
  if (!editingId && !noTouched) { draft.no = nextNo(id); const n = document.getElementById('qcNo'); if (n) n.value = draft.no; }
  paintDepts();
  syncJob();
  live();
}
/* وظيفة جديدة بلون وحرف لوحدها — بترجع الـ id */
function ensureDept(name) {
  const d = { id: 'qd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), name: String(name).trim().replace(/\s+/g, ' '), code: freeCode(), color: freeColor() };
  custom.push(d);
  store.set(K.depts, custom);
  return d.id;
}
function addDept() {
  const inp = document.getElementById('qcDeptName');
  const name = (inp.value || '').trim().replace(/\s+/g, ' ');
  if (!name) { toast('اكتب اسم الوظيفة الأول.'); inp.focus(); return; }
  const same = depts().find((d) => normD(d.name) === normD(name));
  if (same) {
    toast('الوظيفة «' + same.name + '» موجودة، واتختارت.');
  } else {
    const d = customOf(ensureDept(name));
    toast('اتحفظت وظيفة «' + name + '»، وحرفها في رقم الكارنيه ' + d.code);
    inp.value = '';
    pickDept(d.id);
    return;
  }
  inp.value = '';
  pickDept(same.id);
}
function delDept(id) {
  const d = customOf(id); if (!d) return;
  const used = cards.filter((c) => c.dept === id).length;
  if (used) { toast('وظيفة «' + d.name + '» عليها ' + arN(used) + ' كارنيه. غيّر وظيفتهم الأول وبعدين امسحها.'); return; }
  if (!confirm('مسح وظيفة «' + d.name + '» من الوظايف؟')) return;
  custom = custom.filter((x) => x.id !== id);
  store.set(K.depts, custom);
  if (draft.dept === id) pickDept(hasOther() ? 'other' : (siteDepts()[0] || {}).id);
  else paintDepts();
  toast('اتمسحت وظيفة «' + d.name + '»');
}
const techs = () => (CFG.technicians || []).filter((t) => t && t.id);
const techOf = (id) => techs().find((t) => t.id === id) || null;
function hotline() {
  const ls = CFG.lines || [];
  const l = ls.find((x) => x.hot && x.tel) || ls.find((x) => x.tel);
  return (l && l.tel) || '';
}
const contact = () => S.contact || hotline();

/* ── رقم الكارنيه: حرف القسم - السنة - مسلسل (نفس نظام الموقع) ── */
function prefixFor(dept) {
  const code = codeOf(dept);
  return typeof cardPrefix === 'function' ? cardPrefix(code) : code + '-' + String(new Date().getFullYear()).slice(-2);
}
function nextNo(dept) {
  const pre = prefixFor(dept);
  let hi = typeof maxSerial === 'function' ? maxSerial(pre) : 0;     // كارنيهات الصفحة القديمة + أرقام الفنيين
  cards.forEach((c) => {
    const no = String(c.no || '');
    if (no.indexOf(pre + '-') === 0) hi = Math.max(hi, Number(no.split('-').pop()) || 0);
  });
  return pre + '-' + String(hi + 1).padStart(3, '0');
}
/* رقم الفني اللي بيتكتب في أوامر الشغل */
function techNo(id) {
  if (!id || typeof cardNoFor !== 'function') return '';
  return cardNoFor(id, typeof techById === 'function' ? techById(id) : techOf(id)) || '';
}
/* الفني المربوط ← رقمه يتسجّل في السيرفر عشان يظهر في أمر الشغل */
async function pushTechNo(tech, no) {
  if (!tech || !no || typeof DB === 'undefined' || !DB.ready()) return;
  if (typeof DEVICE_OK === 'undefined' || !DEVICE_OK || typeof DEVICE === 'undefined' || !DEVICE) return;
  if (typeof serverCards === 'function' && serverCards()[tech] === no) return;
  try {
    await DB.rpc('save_tech_cards', Object.assign(DB.cred(), { cards: [{ tech, no }], gone: [] }));
    if (typeof serverCards === 'function') { const m = serverCards(); m[tech] = no; store.set('techCardNos', m); }
    if (typeof refreshIssuedWOs === 'function') setTimeout(refreshIssuedWOs, 3000);
  } catch (e) { /* النت فاصل — الرقم لسه محفوظ في الكارنيه */ }
}

/* ── QR ─────────────────────────────────── */
const qrText = (c) => [S.company, c.no, c.name, c.job, c.code ? 'كود التصريح ' + c.code : ''].filter(Boolean).join('\n');
function qrSVG(text) {
  try {
    if (!window.qrcode) throw new Error('no-qr');
    if (qrcode.stringToBytesFuncs && qrcode.stringToBytesFuncs['UTF-8']) qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
    const q = qrcode(0, 'M'); q.addData(text || ' '); q.make();
    const n = q.getModuleCount(); let p = '';
    for (let r = 0; r < n; r++) {
      let c = 0;
      while (c < n) {
        if (q.isDark(r, c)) { const s = c; while (c < n && q.isDark(r, c)) c++; p += 'M' + s + ' ' + r + 'h' + (c - s) + 'v1h-' + (c - s) + 'z'; }
        else c++;
      }
    }
    return `<svg class="qr" viewBox="-1 -1 ${n + 2} ${n + 2}" shape-rendering="crispEdges" aria-hidden="true"><rect x="-1" y="-1" width="${n + 2}" height="${n + 2}" fill="#fff"/><path d="${p}" fill="#111"/></svg>`;
  } catch (e) { return '<svg class="qr" viewBox="0 0 1 1" aria-hidden="true"></svg>'; }
}

/* ── رسم الكارنيه ───────────────────────── */
const RINGS = '<svg class="rings" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="43" fill="none" stroke="#fff" stroke-width="6"/><circle cx="50" cy="50" r="28" fill="none" stroke="#fff" stroke-width="3"/><circle cx="50" cy="50" r="15" fill="none" stroke="#fff" stroke-width="1.6"/></svg>';
const SIL = '<svg viewBox="0 0 60 70" aria-hidden="true"><circle cx="30" cy="25" r="12.5" fill="#CBC7DA"/><path d="M4 70c0-16 11.6-27 26-27s26 11 26 27z" fill="#CBC7DA"/></svg>';

function frontHTML(c, preview) {
  const k = deptCol(c.dept), rows = [];
  if (c.code) rows.push(['كود التصريح', `<span class="ltr qc-code">${esc(c.code)}</span>`]);
  if (c.nid) rows.push(['الرقم القومي', `<span class="ltr">${esc(c.nid)}</span>`]);
  if (c.no) rows.push(['رقم الكارنيه', `<span class="ltr">${esc(c.no)}</span>`]);
  if (c.sec) rows.push(['القسم', esc(c.sec), 1]);
  if (c.phone) rows.push(['الموبايل', `<span class="ltr">${esc(c.phone)}</span>`]);
  if (c.note) rows.push(['ملاحظات', esc(c.note), 1]);
  const name = c.name ? esc(c.name) : (preview ? '<span class="ph-t">الاسم</span>' : '');
  const job = c.job ? esc(c.job) : (preview ? '<span class="ph-t">الوظيفة</span>' : '');
  const photo = c.photo ? `<img src="${c.photo}" alt="">` : `<div class="ph">${SIL}</div>`;
  return `<div class="qc-b front" style="--c1:${k.c1};--c2:${k.c2}">
    <div class="qc-fh">${RINGS}
      <div class="qc-flogo"><img src="${LOGO}" alt=""></div>
      <div class="qc-fco"><b data-fit>${esc(S.company)}</b><span data-fit>${esc(S.tagline)}</span></div>
    </div>
    <div class="qc-fph">${photo}</div>
    <div class="qc-fname" data-fit>${name}</div>
    <div class="qc-fjob" data-fit>${job}</div>
    <div class="qc-frows${rows.length > 4 ? ' n' + Math.min(rows.length, 7) : ''}">${rows.map((r) => `<div class="r"><span>${r[0]}</span><b${r[2] ? ' data-fit' : ''}>${r[1]}</b></div>`).join('')}</div>
    <div class="qc-ffoot" data-fit>${esc(S.frontFoot)}</div>
  </div>`;
}

function backHTML(c) {
  const k = deptCol(c.dept);
  const ins = ((MGMT_ROLES.indexOf(c.dept) >= 0 ? S.instructionsMgmt : S.instructions) || []).filter((t) => String(t).trim());
  const ct = contact();
  return `<div class="qc-b back" style="--c1:${k.c1};--c2:${k.c2}">
    <div class="qc-bt"><img class="qc-blogo" src="${LOGO}" alt="">
      <div class="qc-bco"><b data-fit>${esc(S.company)}</b><span data-fit>${esc(S.tagline)}</span></div></div>
    <div class="qc-bband"></div>
    <div class="qc-bins" data-fitbox>${S.insTitle ? `<h4>${esc(S.insTitle)}</h4>` : ''}
      <ol>${ins.map((t) => `<li>${esc(t)}</li>`).join('')}</ol></div>
    <div class="qc-bid">${qrSVG(qrText(c))}
      <div class="qc-bidt"><span>رقم الكارنيه</span><b class="ltr" data-fit>${esc(c.no || '—')}</b>
        ${ct ? `<div class="ct" data-fit>للتحقق أو الإبلاغ: <b class="ltr">${esc(ct)}</b></div>` : ''}
      </div></div>
    <div class="qc-bfoot" data-fit>${esc(S.fullName)}</div>
  </div>`;
}

/* تصغير الخط لحد ما الكلام يدخل في مكانه */
function fit(root) {
  root.querySelectorAll('[data-fit]').forEach((el) => {
    el.style.fontSize = '';
    let fs = parseFloat(getComputedStyle(el).fontSize), g = 30;
    while (el.scrollWidth > el.clientWidth + 0.5 && g-- > 0) { fs *= 0.95; el.style.fontSize = fs + 'px'; }
  });
  root.querySelectorAll('[data-fitbox]').forEach((el) => {
    el.style.fontSize = '';
    let fs = parseFloat(getComputedStyle(el).fontSize), g = 30;
    while (el.scrollHeight > el.clientHeight + 0.5 && g-- > 0) { fs *= 0.95; el.style.fontSize = fs + 'px'; }
  });
}

const MM = 96 / 25.4, BW = 54 * MM, BH = 85.6 * MM;
function placeScaled(box, html, scale) {
  box.innerHTML = html;
  box.style.width = (BW * scale) + 'px';
  box.style.height = (BH * scale) + 'px';
  box.firstElementChild.style.transform = 'scale(' + scale + ')';
  fit(box);
}

/* الخط والـ QR بيتحمّلوا أول مرة بس */
let assets = null;
function needAssets() {
  if (!assets) {
    const f = document.fonts && document.fonts.load
      ? Promise.all(['400', '600', '700'].map((w) => document.fonts.load(w + ' 12px QPlex').catch(() => {})))
      : Promise.resolve();
    const q = typeof needQR === 'function' ? needQR() : Promise.resolve();
    assets = Promise.all([f, q]);
  }
  return assets;
}

/* ── الحالة ─────────────────────────────── */
function blank(dept) {
  return { name: '', dept: dept || (depts()[0] || {}).id || 'other', job: '', jobAuto: S.jobAuto, sec: '', secAuto: S.secAuto, nid: '', no: '', code: genCode(), phone: '', note: '', photo: '', tech: '' };
}
function startNew(keepDept) {
  editingId = null; noTouched = false; photoSrc = '';
  draft = blank(keepDept || (draft && draft.dept));
  draft.no = nextNo(draft.dept);
  syncJob();
}

/* ── الصفحة ─────────────────────────────── */
function render() {
  const box = document.getElementById('qcBox');
  if (!box) return;
  if (!draft || !depts().some((d) => d.id === draft.dept)) startNew();
  const ed = !!editingId;

  box.innerHTML = `
    <div class="pp-note">
      كارنيهات بلوجو واسم <b>كوين سيرفيس</b>، وتعليمات الضهر مناسبة للأمن والإدارة (تقدر تعدّلها من «اسم الشركة وتعليمات الضهر» تحت).
      اختار الوظيفة (فرد أمن، مشرف، مدير، نائب مدير). لو وظيفة جديدة اختار «أخرى» واكتب اسمها.
      <br><b>البيانات بتتحفظ على الجهاز ده بس</b> ومبتترفعش للسيرفر.
    </div>

    ${verHTML()}

    <div class="qc-prev" id="qcPrev">
      <figure id="qcFigF"><div class="qc-sbox" id="qcPvF"></div><figcaption>الوش</figcaption></figure>
      <figure id="qcFigB"><div class="qc-sbox" id="qcPvB"></div><figcaption>الضهر</figcaption></figure>
    </div>
    <div class="adm-tabs" id="qcSide" hidden style="justify-content:center;margin:-6px 0 14px">
      <button class="chip on" type="button" data-qcside="front">الوش</button>
      <button class="chip" type="button" data-qcside="back">الضهر</button>
    </div>

    ${ed ? '' : impHTML()}

    <h3 class="adm-h">${ed ? 'تعديل كارنيه' : imp ? 'بيانات الكارنيه من الإكسل' : 'كارنيه جديد'}</h3>
    ${ed ? `<div class="qc-editing">بتعدّل كارنيه ${esc(draft.name)}. التعديل بيتحفظ مكان القديم.</div>` : ''}

    <p class="qc-lbl">الوظيفة</p>
    <div class="dept-legend" id="qcDepts" role="radiogroup" aria-label="الوظيفة">${deptChips()}</div>
    <div class="qc-newdept" id="qcNewDept"${draft.dept === 'other' ? '' : ' hidden'}>
      <label for="qcDeptName">وظيفة جديدة؟ اكتب اسمها واحفظها، وهتتضاف للوظايف اللي فوق.</label>
      <div class="qc-inline">
        <input id="qcDeptName" maxlength="30" autocomplete="off" placeholder="اسم الوظيفة، مثلاً: سائق">
        <button class="btn btn-primary" type="button" data-qc="deptadd">حفظ الوظيفة</button>
      </div>
    </div>

    <div class="idf">
      <label class="fld wide"><span>الاسم</span>
        <input id="qcName" value="${esc(draft.name)}" maxlength="60" autocomplete="off" placeholder="الاسم زي البطاقة">
      </label>
      <div class="fld wide"><span>الوظيفة المكتوبة على الكارنيه</span>
        <div class="qc-mode" role="radiogroup" aria-label="طريقة كتابة الوظيفة">
          <button type="button" class="chip${draft.jobAuto ? ' on' : ''}" data-qcjobmode="auto" role="radio" aria-checked="${!!draft.jobAuto}">تلقائي زي الوظيفة المختارة</button>
          <button type="button" class="chip${draft.jobAuto ? '' : ' on'}" data-qcjobmode="manual" role="radio" aria-checked="${!draft.jobAuto}">أكتبها بإيدي</button>
        </div>
        <div class="qc-inline">
          <input id="qcJob" value="${esc(draft.job)}" maxlength="40" list="qcJobList" autocomplete="off" placeholder="اكتب الوظيفة زي ما هتتطبع" aria-label="الوظيفة"${draft.jobAuto ? ' readonly' : ''}>
          <button class="btn btn-quiet" type="button" data-qc="jobadd"${draft.jobAuto ? ' hidden' : ''}>حفظ في القائمة</button>
        </div>
        <datalist id="qcJobList">${jobs.map((j) => `<option value="${esc(j)}">`).join('')}</datalist>
        <p class="fine"${draft.jobAuto ? '' : ' hidden'}>بتتكتب لوحدها زي الوظيفة اللي اخترتها فوق. عايز تكتبها بشكل تاني، زي «مشرف وردية»؟ اختار «أكتبها بإيدي».</p>
        <div class="qc-chips"${draft.jobAuto ? ' hidden' : ''}>${jobs.map((j, i) => `<span class="qc-chip"><button type="button" data-qcjob="${i}">${esc(j)}</button><button type="button" class="x" data-qcjobdel="${i}" aria-label="مسح ${esc(j)} من القائمة">×</button></span>`).join('')}</div>
      </div>
      <div class="fld wide"><span>القسم المكتوب على الكارنيه</span>
        <div class="qc-mode" role="radiogroup" aria-label="طريقة كتابة القسم">
          <button type="button" class="chip${draft.secAuto ? ' on' : ''}" data-qcsecmode="auto" role="radio" aria-checked="${!!draft.secAuto}">تلقائي حسب الوظيفة</button>
          <button type="button" class="chip${draft.secAuto ? '' : ' on'}" data-qcsecmode="manual" role="radio" aria-checked="${!draft.secAuto}">أكتبه بإيدي</button>
        </div>
        <input id="qcSec" value="${esc(draft.sec)}" maxlength="30" autocomplete="off" placeholder="${draft.secAuto ? 'مفيش قسم للوظيفة دي، اختار «أكتبه بإيدي»' : 'اكتب اسم القسم زي ما هيتطبع'}" aria-label="القسم"${draft.secAuto ? ' readonly' : ''}>
        <p class="fine"${draft.secAuto ? '' : ' hidden'}>المدير ونائب المدير ← الإدارة، فرد الأمن ← الأمن، المشرف ← الإشراف.</p>
      </div>
      <label class="fld"><span>الرقم القومي</span>
        <input id="qcNid" class="ltr" dir="ltr" inputmode="numeric" maxlength="14" value="${esc(draft.nid)}" autocomplete="off" placeholder="١٤ رقم">
      </label>
      <label class="fld"><span>رقم الكارنيه</span>
        <input id="qcNo" class="ltr" dir="ltr" maxlength="20" value="${esc(draft.no)}" autocomplete="off">
      </label>
      <div class="fld"><span>كود التصريح (تلقائي)</span>
        <div class="qc-inline">
          <input id="qcCode" class="ltr qc-codein" dir="ltr" value="${esc(draft.code)}" readonly aria-label="كود التصريح">
          <button class="btn btn-quiet" type="button" data-qc="newcode" title="لو الكارنيه ضاع: كود جديد والقديم يبطل">كود جديد</button>
        </div>
      </div>
      <label class="fld"><span>رقم الموبايل (اختياري)</span>
        <input id="qcPhone" class="ltr" dir="ltr" inputmode="tel" maxlength="15" value="${esc(draft.phone)}" autocomplete="off" placeholder="01xxxxxxxxx">
      </label>
      <label class="fld wide"><span>ملاحظات على وش الكارنيه (اختياري، وخليها قصيرة)</span>
        <input id="qcNote" maxlength="45" value="${esc(draft.note)}" autocomplete="off" placeholder="مثلاً: وردية ليل — بوابة ٣">
      </label>
      <label class="fld"><span>ربط بفني (اختياري)</span>
        <select id="qcTech">
          <option value="">بدون ربط</option>
          ${techs().map((t) => `<option value="${esc(t.id)}"${t.id === draft.tech ? ' selected' : ''}>${esc(t.name)}</option>`).join('')}
        </select>
      </label>
      <div class="fld wide"><span>الصورة</span>
        <div class="qc-photo">
          <div class="pv" id="qcPhotoPv">${draft.photo ? '<img src="' + draft.photo + '" alt="الصورة الحالية">' : 'مفيش صورة'}</div>
          <div class="pa">
            <button class="btn btn-quiet" type="button" data-qc="photo">${draft.photo ? 'تغيير الصورة' : 'اختيار صورة'}</button>
            ${draft.photo ? '<button class="btn btn-quiet" type="button" data-qc="recrop">تعديل القص</button><button class="btn btn-quiet" type="button" data-qc="nophoto">إزالة</button>' : ''}
          </div>
        </div>
        <input type="file" id="qcFile" accept="image/*" hidden>
      </div>
    </div>
    <p class="fine" id="qcTechHint"${draft.tech ? '' : ' hidden'}>الكارنيه مربوط بفني، فرقمه هو اللي بيتكتب في أوامر الشغل اللي بتتسند له.</p>
    <p class="err" id="qcErr" hidden></p>

    <div class="pp-bar">
      <button class="btn btn-primary" type="button" data-qc="save">${ed ? 'حفظ التعديل' : imp ? 'حفظ والتالي' : 'حفظ الكارنيه'}</button>
      ${imp
        ? '<button class="btn btn-quiet" type="button" data-qc="impskip">تخطّي الكارنيه ده</button>'
        : `<button class="btn btn-quiet" type="button" data-qc="clear">${ed ? 'إلغاء التعديل' : 'تفريغ الخانات'}</button>`}
    </div>

    <details class="qc-set">
      <summary>اسم الشركة وتعليمات الضهر</summary>
      <label class="fld"><span>اسم الشركة على الكارنيه</span><input id="qcSCo" maxlength="40" value="${esc(S.company)}"></label>
      <label class="fld"><span>السطر اللي تحت الاسم</span><input id="qcSTag" maxlength="50" value="${esc(S.tagline)}"></label>
      <label class="fld"><span>الشريط اللي تحت الوش</span><input id="qcSFoot" maxlength="60" value="${esc(S.frontFoot)}"></label>
      <label class="fld"><span>الشريط اللي تحت الضهر</span><input id="qcSFull" maxlength="70" value="${esc(S.fullName)}"></label>
      <label class="fld"><span>تعليمات الضهر: فرد أمن ومشرف وأي وظيفة تانية (كل تعليمة في سطر)</span><textarea id="qcSIns">${esc((S.instructions || []).join('\n'))}</textarea></label>
      <label class="fld"><span>تعليمات الضهر: المدير ونائب المدير (كل تعليمة في سطر)</span><textarea id="qcSInsM">${esc((S.instructionsMgmt || []).join('\n'))}</textarea></label>
      <label class="fld"><span>رقم للتحقق أو الإبلاغ</span><input id="qcSCt" class="ltr" dir="ltr" inputmode="tel" maxlength="20" value="${esc(S.contact)}" placeholder="${esc(hotline() || 'اختياري')}"></label>
      <p class="fine">لو سبت الرقم فاضي بيتكتب رقم الخط الساخن من تبويب «الأرقام». الخط بيصغر لوحده لو التعليمات طولت.</p>
      <div class="pp-bar"><button class="btn btn-quiet" type="button" data-qc="resetins">رجوع للتعليمات الأصلية</button></div>
    </details>

    <h3 class="adm-h" id="qcSavedH">الكارنيهات المحفوظة</h3>
    <div class="qc-tools">
      <input id="qcSearch" type="search" placeholder="بحث بالاسم أو الرقم" aria-label="بحث في الكارنيهات">
      <button class="btn btn-quiet" type="button" data-qc="selall">تحديد الكل</button>
    </div>
    <div class="qc-grid" id="qcGrid"></div>
    <p class="fine">الطباعة ٩ كارنيهات في الورقة: وش وبعده ضهر معكوس. اطبع بالحجم الفعلي ١٠٠٪ ومن غير هوامش، وعلى الوجهين بالقلب من الحافة الطويلة.</p>
    <div class="pp-bar">
      <button class="btn btn-primary" type="button" data-qc="print" id="qcPrintBtn">طباعة</button>
      <button class="btn btn-quiet" type="button" data-qc="backup">نسخة احتياطية</button>
      <button class="btn btn-quiet" type="button" data-qc="restore">استرجاع نسخة</button>
    </div>
    <input type="file" id="qcRestore" accept="application/json,.json" hidden>`;

  wire();
  renderPreview();
  renderList();
  needAssets().then(() => { renderPreview(); renderList(); });

  /* الفنيين وأرقامهم من السيرفر — مرة واحدة */
  if (typeof techServer === 'function' && techServer() && typeof TECHS_LOADED !== 'undefined' && !TECHS_LOADED && typeof loadServerTechs === 'function') {
    TECHS_LOADED = true;
    loadServerTechs().then(() => { if (isOpen()) refreshTechSelect(); });
  }
  if (typeof loadTechCards === 'function') loadTechCards().catch(() => {});
}

const isOpen = () => { const v = document.getElementById('v-qcards'); return v && !v.hidden; };

function refreshTechSelect() {
  const sel = document.getElementById('qcTech');
  if (!sel) return;
  sel.innerHTML = '<option value="">بدون ربط</option>' + techs().map((t) =>
    `<option value="${esc(t.id)}"${t.id === draft.tech ? ' selected' : ''}>${esc(t.name)}</option>`).join('');
}

function renderPreview() {
  const prev = document.getElementById('qcPrev');
  if (!prev) return;
  const w = prev.clientWidth - 24;
  let scale = Math.min(1.3, (w - 14) / (BW * 2));
  const both = scale >= 0.78;
  if (!both) scale = Math.min(1.3, w / BW);
  document.getElementById('qcSide').hidden = both;
  document.getElementById('qcFigF').hidden = !both && side !== 'front';
  document.getElementById('qcFigB').hidden = !both && side !== 'back';
  placeScaled(document.getElementById('qcPvF'), frontHTML(draft, true), scale);
  placeScaled(document.getElementById('qcPvB'), backHTML(draft), scale);
}

function renderList() {
  const g = document.getElementById('qcGrid');
  if (!g) return;
  const q = latin((document.getElementById('qcSearch') || {}).value || '').trim().toLowerCase();
  const list = cards.filter((c) => !q || [c.name, c.job, c.nid, c.no, c.code, normCode(c.code), c.phone, c.note, deptName(c.dept)].join(' ').toLowerCase().indexOf(q) >= 0);
  if (!cards.length) g.innerHTML = '<div class="qc-none">لسه مفيش كارنيهات. اكتب بيانات أول فني واضغط «حفظ الكارنيه».</div>';
  else if (!list.length) g.innerHTML = '<div class="qc-none">مفيش كارنيه بالاسم أو الرقم ده.</div>';
  else {
    g.innerHTML = list.map((c) => {
      const on = selected.has(c.id);
      return `<article class="qc-th${on ? ' sel' : ''}" data-id="${esc(c.id)}">
        <label class="pick" title="تحديد للطباعة"><input type="checkbox"${on ? ' checked' : ''} aria-label="تحديد ${esc(c.name)} للطباعة"></label>
        <button class="tc" type="button" data-qcact="edit" aria-label="تعديل ${esc(c.name)}"><div class="qc-sbox"></div></button>
        <div class="ta"><button type="button" data-qcact="edit">تعديل</button><button type="button" class="dl" data-qcact="del">حذف</button></div>
      </article>`;
    }).join('');
    g.querySelectorAll('.qc-th').forEach((el) => placeScaled(el.querySelector('.qc-sbox'), frontHTML(byId(el.dataset.id)), 0.6));
  }
  counts();
  renderVer();
}

function counts() {
  const h = document.getElementById('qcSavedH');
  if (h) h.textContent = 'الكارنيهات المحفوظة' + (cards.length ? ' (' + arN(cards.length) + ')' : '');
  const pb = document.getElementById('qcPrintBtn');
  if (pb) {
    pb.textContent = selected.size ? 'طباعة المحدد (' + arN(selected.size) + ')' : cards.length ? 'طباعة الكل (' + arN(cards.length) + ')' : 'طباعة';
    pb.disabled = !cards.length;
  }
  const sa = document.querySelector('#qcBox [data-qc="selall"]');
  if (sa) { sa.textContent = selected.size && selected.size === cards.length ? 'إلغاء التحديد' : 'تحديد الكل'; sa.disabled = !cards.length; }
}

function setErr(msg, focusId) {
  const e = document.getElementById('qcErr');
  e.textContent = msg; e.hidden = !msg;
  if (msg) { toast(msg); if (focusId) document.getElementById(focusId).focus(); }
}

function addJob(j) {
  j = String(j || '').trim();
  if (!j || jobs.indexOf(j) >= 0) return false;
  jobs.push(j); store.set(K.jobs, jobs);
  return true;
}
function paintJobs() {
  const dl = document.getElementById('qcJobList');
  if (dl) dl.innerHTML = jobs.map((j) => `<option value="${esc(j)}">`).join('');
  const ch = document.querySelector('#qcBox .qc-chips');
  if (ch) ch.innerHTML = jobs.map((j, i) => `<span class="qc-chip"><button type="button" data-qcjob="${i}">${esc(j)}</button><button type="button" class="x" data-qcjobdel="${i}" aria-label="مسح ${esc(j)} من القائمة">×</button></span>`).join('');
}

/* بيانات الكارنيه من الخانات + المراجعة — بيستخدمها الحفظ العادي وحفظ الإكسل */
function cardFrom(d) {
  const c = {
    name: String(d.name || '').trim().replace(/\s+/g, ' '),
    dept: d.dept,
    job: String((d.jobAuto ? autoJob(d.dept) : d.job) || '').trim().replace(/\s+/g, ' '),
    jobAuto: !!d.jobAuto,
    sec: String((d.secAuto ? autoSec(d.dept) : d.sec) || '').trim().replace(/\s+/g, ' '),
    secAuto: !!d.secAuto,
    nid: latin(d.nid).replace(/\D/g, ''),
    no: latin(d.no).trim().toUpperCase(),
    code: d.code || genCode(),
    phone: latin(d.phone).replace(/[^\d+]/g, ''),
    note: String(d.note || '').trim().replace(/\s+/g, ' '),
    photo: d.photo,
    tech: d.tech
  };
  if (!c.name) return { err: 'اكتب اسم صاحب الكارنيه.', focus: 'qcName' };
  if (!c.job) return c.dept === 'other'
    ? { err: 'اكتب اسم الوظيفة الجديدة واضغط «حفظ الوظيفة».', focus: 'qcDeptName' }
    : { err: 'اكتب الوظيفة.', focus: 'qcJob' };
  if (c.nid && c.nid.length !== 14) return { err: 'الرقم القومي لازم يبقى ١٤ رقم (مكتوب ' + arN(c.nid.length) + ').', focus: 'qcNid' };
  return { c };
}

function saveCard() {
  const wasEd = !!editingId;
  const v = cardFrom(draft);
  if (v.err) return setErr(v.err, v.focus);
  const c = v.c;
  if (!c.no) c.no = nextNo(c.dept);
  if (cards.some((x) => x.id !== editingId && normCode(x.code) === normCode(c.code))) c.code = genCode();
  const dupNo = cards.find((x) => x.no === c.no && x.id !== editingId);
  if (dupNo) return setErr('رقم الكارنيه ده مستخدم لكارنيه ' + dupNo.name + '.', 'qcNo');
  const dupNid = c.nid && cards.find((x) => x.nid === c.nid && x.id !== editingId);
  if (dupNid && !confirm('الرقم القومي ده متسجل قبل كده لكارنيه ' + dupNid.name + '. تحفظ برضه؟')) return;
  setErr('');

  const now = Date.now();
  let msg;
  if (editingId) {
    const old = byId(editingId);
    Object.assign(old, c, { updated: now });
    selected.add(old.id);
    msg = 'اتحفظ التعديل على كارنيه ' + c.name;
  } else {
    c.id = qid(); c.created = now; c.updated = now;
    cards.push(c); selected.add(c.id);
    msg = 'اتحفظ كارنيه ' + c.name;
  }
  if (!saveCards()) return;
  if (c.job && !c.jobAuto) addJob(c.job);
  if (c.tech) pushTechNo(c.tech, c.no);
  toast(msg);
  if (imp) {                       // مراجعة الإكسل ← الكارنيه اللي بعده (ولو كان تعديل كارنيه قديم نرجع لنفس الصف)
    if (!wasEd) { imp.saved++; imp.i++; }
    loadImp();
    return;
  }
  startNew(c.dept);
  render();
  const n = document.getElementById('qcName'); if (n) n.focus();
}

function editCard(id) {
  const c = byId(id); if (!c) return;
  editingId = id; noTouched = true; photoSrc = '';
  draft = { name: c.name || '', dept: c.dept, job: c.job || '', jobAuto: !!c.jobAuto, sec: c.sec || '', secAuto: c.secAuto !== false, nid: c.nid || '', no: c.no || '', code: c.code || genCode(), phone: c.phone || '', note: c.note || '', photo: c.photo || '', tech: c.tech || '' };
  syncJob();          // الكارنيهات القديمة اللي من غير قسم بتاخد قسمها التلقائي
  render();
  window.scrollTo(0, 0);
}
function delCard(id) {
  const c = byId(id); if (!c) return;
  if (!confirm('مسح كارنيه ' + c.name + '؟ مش هينفع ترجعه غير من نسخة احتياطية.')) return;
  cards = cards.filter((x) => x.id !== id);
  selected.delete(id);
  saveCards();
  if (editingId === id) { if (imp) loadImp(); else { startNew(); render(); } } else renderList();
  toast('اتمسح كارنيه ' + c.name);
}

/* ── قص الصورة ─────────────────────────── */
/* الصورة المحفوظة ٣٠٠×٤٠٠ — كفاية للطباعة (الصورة على الكارنيه حوالي ٢ سم)
   وصغيرة عشان مئات الكارنيهات تدخل في مساحة المتصفح */
const CW = 270, CH = 360, OUTW = 300, OUTH = 400;
const cr = { img: null, base: 1, s: 1, ox: 0, oy: 0 };
function cropOut(img, s, ox, oy) {
  const o = document.createElement('canvas'); o.width = OUTW; o.height = OUTH;
  const k = OUTW / CW, g = o.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, OUTW, OUTH);
  g.imageSmoothingQuality = 'high';
  g.drawImage(img, ox * k, oy * k, img.naturalWidth * s * k, img.naturalHeight * s * k);
  return o.toDataURL('image/jpeg', 0.82);
}
/* قص تلقائي بنفس ظبط نافذة القص أول ما تفتح (الوش في النص وفوق شوية) */
function autoPhoto(file) {
  return new Promise((ok, fail) => {
    const src = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const s = Math.max(CW / img.naturalWidth, CH / img.naturalHeight);
      ok({ photo: cropOut(img, s, (CW - img.naturalWidth * s) / 2, (CH - img.naturalHeight * s) * 0.3), src });
    };
    img.onerror = () => { URL.revokeObjectURL(src); fail(new Error('img')); };
    img.src = src;
  });
}
let cv = null, cx = null;
function cropDialog() {
  let d = document.getElementById('qcCropDlg');
  if (d) return d;
  d = document.createElement('dialog');
  d.id = 'qcCropDlg'; d.className = 'qc-dlg';
  d.setAttribute('aria-labelledby', 'qcCropT');
  d.innerHTML = `<div class="qc-crop">
      <h3 id="qcCropT">ظبط الصورة</h3>
      <canvas id="qcCropCv" aria-label="اسحب الصورة لتحريكها"></canvas>
      <div class="z"><span>تصغير</span><input id="qcZoom" type="range" min="1" max="4" step="0.01" value="1" dir="ltr" aria-label="تكبير الصورة"><span>تكبير</span></div>
      <div class="acts"><button class="btn btn-primary" type="button" id="qcCropOk">تم</button><button class="btn btn-quiet" type="button" id="qcCropNo">إلغاء</button></div>
    </div>`;
  document.body.appendChild(d);
  cv = d.querySelector('#qcCropCv'); cx = cv.getContext('2d');
  const dpr = Math.min(3, window.devicePixelRatio || 1);
  cv.width = CW * dpr; cv.height = CH * dpr; cx.scale(dpr, dpr);

  let drag = null;
  cv.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY }; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', (e) => {
    if (!drag) return;
    cr.ox += e.clientX - drag.x; cr.oy += e.clientY - drag.y; drag = { x: e.clientX, y: e.clientY };
    clampCrop(); drawCrop();
  });
  cv.addEventListener('pointerup', () => { drag = null; });
  cv.addEventListener('pointercancel', () => { drag = null; });
  cv.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zi = d.querySelector('#qcZoom');
    const z = Math.min(4, Math.max(1, (+zi.value) * (e.deltaY < 0 ? 1.06 : 1 / 1.06)));
    zi.value = z; setZoom(z);
  }, { passive: false });
  d.querySelector('#qcZoom').addEventListener('input', (e) => setZoom(+e.target.value));
  d.querySelector('#qcCropNo').addEventListener('click', () => d.close());
  d.querySelector('#qcCropOk').addEventListener('click', () => {
    draft.photo = cropOut(cr.img, cr.s, cr.ox, cr.oy);
    d.close();
    render();
  });
  return d;
}
function clampCrop() {
  const w = cr.img.naturalWidth * cr.s, h = cr.img.naturalHeight * cr.s;
  cr.ox = Math.min(0, Math.max(CW - w, cr.ox));
  cr.oy = Math.min(0, Math.max(CH - h, cr.oy));
}
function drawCrop() {
  cx.clearRect(0, 0, CW, CH);
  cx.imageSmoothingQuality = 'high';
  cx.drawImage(cr.img, cr.ox, cr.oy, cr.img.naturalWidth * cr.s, cr.img.naturalHeight * cr.s);
  cx.save();
  cx.strokeStyle = 'rgba(255,255,255,.85)'; cx.lineWidth = 1.5; cx.setLineDash([6, 5]);
  cx.beginPath(); cx.ellipse(CW / 2, CH * 0.42, CW * 0.3, CH * 0.27, 0, 0, Math.PI * 2); cx.stroke();
  cx.restore();
}
function setZoom(z) {
  const ns = cr.base * z, mx = (CW / 2 - cr.ox) / cr.s, my = (CH / 2 - cr.oy) / cr.s;
  cr.s = ns; cr.ox = CW / 2 - mx * ns; cr.oy = CH / 2 - my * ns;
  clampCrop(); drawCrop();
}
function openCrop(src) {
  const d = cropDialog();
  const img = new Image();
  img.onload = () => {
    cr.img = img;
    cr.base = Math.max(CW / img.naturalWidth, CH / img.naturalHeight);
    cr.s = cr.base;
    cr.ox = (CW - img.naturalWidth * cr.s) / 2;
    cr.oy = (CH - img.naturalHeight * cr.s) * 0.3;
    d.querySelector('#qcZoom').value = 1;
    clampCrop(); drawCrop();
    if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '');
  };
  img.onerror = () => toast('الملف ده مش صورة يقدر المتصفح يفتحها.');
  img.src = src;
}

/* ── استيراد من الإكسل + الصور بالرقم القومي ─────────
   الإكسل بيتقري، والصور بتتربط بالرقم القومي من اسم الملف،
   وبعدين كل كارنيه بيظهر في المعاينة: «حفظ والتالي» أو «تخطّي»،
   أو «حفظ الباقي كله» مرة واحدة. */
let imp = null;              // { rows, i, saved, skipped[], noPic[], file }
let impReport = null;        // ملخص آخر استيراد { text, skipped[], noPic[] }
let impURL = '';             // رابط الصورة الأصلية للكارنيه اللي قدامك (لتعديل القص)
const pics = new Map();      // الرقم القومي ← ملف الصورة
let impBusy = false;

const nidIn = (s) => { const m = /\d{14}/.exec(latin(s)); return m ? m[0] : ''; };
function addPics(files) {
  let ok = 0; const bad = [];
  Array.from(files || []).forEach((f) => {
    if (f.type && !/^image\//.test(f.type)) return;
    const k = nidIn(f.name.replace(/\.[^.]+$/, ''));
    if (k) { pics.set(k, f); ok++; } else bad.push(f.name);
  });
  return { ok, bad };
}
function cellText(v) {
  if (v == null) return '';
  if (typeof v === 'number') return String(Math.round(v));      // الرقم القومي لو اتكتب كرقم
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).trim();
}
/* بيدوّر على صف العناوين: لازم يبقى فيه «الاسم» و«الرقم القومي» */
function findCols(rows) {
  for (let r = 0; r < Math.min(rows.length, 20); r++) {
    const col = {};
    (rows[r] || []).forEach((x, i) => {
      const t = normD(cellText(x));
      if (!t) return;
      if (/القومي/.test(t)) col.nid = i;
      else if (/موبايل|محمول|تليفون|هاتف|جوال/.test(t)) col.phone = i;
      else if (/ملاحظ/.test(t)) col.note = i;
      else if (/(^| )لو /.test(t) && /اخري/.test(t)) col.other = i;
      else if (/الوظيف/.test(t)) { if (col.job == null) col.job = i; }
      else if (/القسم/.test(t)) col.sec = i;
      else if (/الاسم/.test(t)) { if (col.name == null) col.name = i; }
    });
    if (col.name != null && col.nid != null) return { row: r, col };
  }
  return null;
}
/* الوظيفة المكتوبة في الإكسل ← زرار الوظيفة (ولو جديدة بتتضاف للوظايف) */
function roleFor(job, other) {
  const pick = (name) => {
    const n = normD(name);
    const d = depts().find((x) => x.id !== 'other' && normD(x.name) === n);
    return d ? d.id : ensureDept(name);
  };
  if (job && normD(job) !== normD('أخرى')) return pick(job);
  if (other) return pick(other);
  return 'other';
}
async function importXls(file) {
  let rows;
  try {
    if (typeof loadScript !== 'function') throw new Error('no-loader');
    await loadScript('vendor/xlsx.mini.min.js');
    const wb = XLSX.read(new Uint8Array(await file.arrayBuffer()), { type: 'array' });
    const sh = wb.Sheets['البيانات'] || wb.Sheets[wb.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(sh, { header: 1, raw: true, defval: '' });
  } catch (e) {
    toast('مقدرتش أفتح الملف ده. لو مش فاتح، احفظه من الإكسل بصيغة ‎.xlsx وجرّب تاني.');
    return;
  }
  const f = findCols(rows);
  if (!f) { toast('مش لاقي عمود «الاسم» و«الرقم القومي» في الملف. استخدم فايل الإكسل بتاع كوين.'); return; }
  const g = (R, k) => (f.col[k] == null ? '' : cellText(R[f.col[k]]));
  const list = [];
  for (let r = f.row + 1; r < rows.length; r++) {
    const R = rows[r] || [];
    const name = g(R, 'name').replace(/\s+/g, ' ');
    const nid = latin(g(R, 'nid')).replace(/\D/g, '');
    if (!name && !nid) continue;                               // صف فاضي (فيه رقم «م» بس)
    let phone = latin(g(R, 'phone')).replace(/[^\d+]/g, '');
    if (/^1\d{9}$/.test(phone)) phone = '0' + phone;            // الإكسل بيشيل الصفر لو الرقم اتكتب كرقم
    list.push({ name, nid, dept: roleFor(g(R, 'job'), g(R, 'other')), sec: g(R, 'sec'), phone, note: g(R, 'note').replace(/\s+/g, ' ').slice(0, 45), row: r + 1 });
  }
  if (!list.length) { toast('الإكسل مفيهوش أسماء لسه.'); return; }
  impReport = null;
  imp = { rows: list, i: 0, saved: 0, skipped: [], noPic: [], file: file.name };
  const wp = list.filter((x) => pics.has(x.nid)).length;
  toast('اتقرا ' + arN(list.length) + ' اسم' + (pics.size ? '، و' + arN(wp) + ' منهم ليهم صور' : '. اختار الصور من «إضافة صور»'));
  loadImp();
}
const rowLabel = (r) => 'صف ' + arN(r.row) + (r.name ? ' — ' + r.name : '');
/* مسودة كارنيه من صف الإكسل */
function rowDraft(r) {
  const d = blank(r.dept);
  d.name = r.name; d.nid = r.nid; d.phone = r.phone || ''; d.note = r.note || '';
  d.jobAuto = true; d.job = autoJob(r.dept);
  if (r.sec) { d.secAuto = false; d.sec = r.sec; } else { d.secAuto = true; d.sec = autoSec(r.dept); }
  d.no = nextNo(r.dept);
  return d;
}
function dropURL() { if (impURL) { URL.revokeObjectURL(impURL); impURL = ''; } }
async function loadImp() {
  if (!imp) return;
  if (imp.i >= imp.rows.length) { finishImp(); return; }
  const r = imp.rows[imp.i];
  editingId = null; noTouched = false; dropURL(); photoSrc = '';
  draft = rowDraft(r);
  await impPhoto();
  render();
  window.scrollTo(0, 0);
}
/* لو للكارنيه اللي قدامك صورة بالرقم القومي ← تتقص وتتحط */
async function impPhoto() {
  const r = imp && imp.rows[imp.i];
  if (!r || draft.photo || !pics.has(r.nid)) return;
  try {
    const p = await autoPhoto(pics.get(r.nid));
    if (!imp || imp.rows[imp.i] !== r) { URL.revokeObjectURL(p.src); return; }
    dropURL(); impURL = p.src; photoSrc = p.src; draft.photo = p.photo;
  } catch (e) { toast('الصورة ' + pics.get(r.nid).name + ' مش راضية تفتح. اختار صورة تانية.'); }
}
function skipImp() {
  if (!imp || impBusy) return;
  imp.skipped.push(rowLabel(imp.rows[imp.i]) + ': اتخطّى');
  imp.i++;
  loadImp();
}
async function saveAllImp() {
  if (!imp || impBusy) return;
  const left = imp.rows.length - imp.i;
  if (!confirm('هيتحفظ ' + arN(left) + ' كارنيه مرة واحدة من غير مراجعة (أولهم الكارنيه اللي قدامك بالتعديلات اللي عملتها).\nأي صف فيه غلط هيتخطّى ويظهرلك في الآخر. نكمّل؟')) return;
  impBusy = true;
  let first = true;
  for (; imp.i < imp.rows.length; imp.i++) {
    const r = imp.rows[imp.i];
    let d = draft;
    if (!first) {
      d = rowDraft(r);
      if (pics.has(r.nid)) { try { const p = await autoPhoto(pics.get(r.nid)); d.photo = p.photo; URL.revokeObjectURL(p.src); } catch (e) { /* من غير صورة */ } }
    }
    first = false;
    const v = cardFrom(d);
    if (v.err) { imp.skipped.push(rowLabel(r) + ': ' + v.err); continue; }
    const c = v.c;
    const dup = c.nid && cards.find((x) => x.nid === c.nid);
    if (dup) { imp.skipped.push(rowLabel(r) + ': الرقم القومي متسجل قبل كده لكارنيه ' + dup.name); continue; }
    if (!c.no || cards.some((x) => x.no === c.no)) c.no = nextNo(c.dept);
    if (cards.some((x) => normCode(x.code) === normCode(c.code))) c.code = genCode();
    c.id = qid(); c.created = c.updated = Date.now();
    cards.push(c);
    if (!saveCards()) {
      cards.pop();
      imp.skipped.push(rowLabel(r) + ': مساحة التخزين على الجهاز خلصت، ووقف الحفظ هنا. اعمل نسخة احتياطية وامسح كارنيهات قديمة.');
      break;
    }
    selected.add(c.id);
    imp.saved++;
    if (!c.photo) imp.noPic.push(rowLabel(r));
    if (imp.saved % 5 === 0) toast('اتحفظ ' + arN(imp.saved) + ' من ' + arN(imp.rows.length) + '…');
  }
  impBusy = false;
  finishImp();
}
function finishImp() {
  const n = imp.saved;
  impReport = {
    text: 'خلص الإكسل: اتحفظ ' + arN(n) + ' كارنيه' + (imp.skipped.length ? '، واتخطّى ' + arN(imp.skipped.length) : '') + '. الكارنيهات الجديدة متحددة وجاهزة للطباعة.',
    skipped: imp.skipped, noPic: imp.noPic
  };
  imp = null;
  dropURL();
  startNew();
  render();
  toast('اتحفظ ' + arN(n) + ' كارنيه من الإكسل');
  const h = document.getElementById('qcImp'); if (h) h.scrollIntoView({ block: 'start' });
}
function stopImp() {
  if (!imp) return;
  if (!confirm('توقف مراجعة الإكسل؟ اللي اتحفظ بيفضل، والباقي (' + arN(imp.rows.length - imp.i) + ') مش هيتحفظ.')) return;
  for (let k = imp.i; k < imp.rows.length; k++) imp.skipped.push(rowLabel(imp.rows[k]) + ': ما اتراجعش');
  imp.i = imp.rows.length;
  finishImp();
}
function impHTML() {
  if (imp) {
    const n = imp.rows.length, r = imp.rows[imp.i];
    const wp = imp.rows.filter((x) => pics.has(x.nid)).length;
    let st;
    if (draft.photo && pics.has(r.nid)) st = '<span class="ok">✔ الصورة اتحطت من ملف <span class="ltr">' + esc(pics.get(r.nid).name) + '</span></span>';
    else if (draft.photo) st = '<span class="ok">✔ فيه صورة</span>';
    else if (r.nid) st = '<span class="no">✖ مفيش صورة اسمها <span class="ltr">' + esc(r.nid) + '</span> — اضغط «إضافة صور» أو اختار صورته من خانة الصورة تحت.</span>';
    else st = '<span class="no">✖ الصف ده مفيهوش رقم قومي، فمش هينفع يتربط بصورة. اختار الصورة بإيدك.</span>';
    return `<div class="qc-imp on" id="qcImp">
      <div class="qc-imph"><b>مراجعة الإكسل: كارنيه ${arN(imp.i + 1)} من ${arN(n)}</b><span>${esc(rowLabel(r))}</span></div>
      <div class="qc-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${n}" aria-valuenow="${imp.i}"><i style="width:${(imp.i / n * 100).toFixed(1)}%"></i></div>
      <p class="qc-st">${st}</p>
      <p class="fine">اتحفظ ${arN(imp.saved)} لحد دلوقتي • ${arN(wp)} من ${arN(n)} ليهم صور • راجع المعاينة واضغط «حفظ والتالي».</p>
      <div class="pp-bar">
        <button class="btn ${pics.size ? 'btn-quiet' : 'btn-primary'}" type="button" data-qc="imppics">إضافة صور${pics.size ? ' (' + arN(pics.size) + ')' : ''}</button>
        <button class="btn btn-quiet" type="button" data-qc="impall">حفظ الباقي كله مرة واحدة</button>
        <button class="btn btn-quiet" type="button" data-qc="impstop">إنهاء</button>
      </div>
      <input type="file" id="qcPics" accept="image/*" multiple hidden>
    </div>`;
  }
  const rep = impReport ? `<div class="qc-imprep">
      <b>${esc(impReport.text)}</b>
      ${impReport.skipped.length ? '<p>اللي اتخطّى:</p><ul>' + impReport.skipped.map((s) => '<li>' + esc(s) + '</li>').join('') + '</ul>' : ''}
      ${impReport.noPic.length ? '<p>اتحفظوا من غير صورة (افتح الكارنيه واختار صورته):</p><ul>' + impReport.noPic.map((s) => '<li>' + esc(s) + '</li>').join('') + '</ul>' : ''}
      <button class="btn btn-quiet" type="button" data-qc="repok">تمام</button>
    </div>` : '';
  return `<details class="qc-imp" id="qcImp"${impReport || pics.size ? ' open' : ''}>
      <summary>كارنيهات كتير مرة واحدة من الإكسل</summary>
      <ol class="qc-steps">
        <li>اختار فايل الإكسل اللي الناس ملته.</li>
        <li>اختار كل الصور مرة واحدة. لازم اسم كل صورة يكون الرقم القومي بتاع صاحبها، زي <span class="ltr">30123541762275.jpg</span>.</li>
        <li>كل كارنيه هيظهرلك جاهز في المعاينة: راجعه واضغط «حفظ والتالي» لحد ما يخلصوا.</li>
      </ol>
      <div class="pp-bar">
        <button class="btn btn-primary" type="button" data-qc="impxls">اختيار ملف الإكسل</button>
        <button class="btn btn-quiet" type="button" data-qc="imppics">اختيار الصور${pics.size ? ' (' + arN(pics.size) + ')' : ''}</button>
      </div>
      <p class="fine">تقدر تختار الصور قبل الإكسل أو بعده. على الكمبيوتر افتح فولدر الصور واضغط Ctrl+A عشان تختارهم كلهم.</p>
      ${rep}
      <input type="file" id="qcXls" accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" hidden>
      <input type="file" id="qcPics" accept="image/*" multiple hidden>
    </details>`;
}

/* ── التحقق من كارنيه (ضد التزوير) ─────────────────
   اكتب أي حاجة من الكارنيه: كود التصريح أو الرقم القومي أو رقم الكارنيه
   (لازم يطابق بالظبط) أو الاسم (بيدوّر جواه). لو اتطابق الكود أو الرقم
   ← «طالع من عندنا» وتظهر كل البيانات والصورة للمقارنة. */
let verQ = '';
const dayD = (ms) => { const d = new Date(ms); return isNaN(d) ? '' : d.toISOString().slice(0, 10); };
function verHTML() {
  return `<div class="qc-ver">
      <label for="qcVer"><b>التحقق من كارنيه</b> — اكتب كود التصريح أو الرقم القومي أو رقم الكارنيه أو الاسم</label>
      <input id="qcVer" type="search" dir="auto" autocomplete="off" value="${esc(verQ)}" placeholder="مثلاً: KQTM-4827">
      <div id="qcVerRes" aria-live="polite"></div>
    </div>`;
}
function verRow(c, sure) {
  const rows = [
    ['كود التصريح', '<span class="ltr">' + esc(c.code || '—') + '</span>'],
    ['الاسم', esc(c.name)],
    ['الوظيفة', esc(c.job || '')],
    ['القسم', esc(c.sec || '—')],
    ['الرقم القومي', '<span class="ltr">' + esc(c.nid || '—') + '</span>'],
    ['رقم الكارنيه', '<span class="ltr">' + esc(c.no || '—') + '</span>'],
    ['الموبايل', '<span class="ltr">' + esc(c.phone || '—') + '</span>'],
    ['ملاحظات', esc(c.note || '—')],
    ['اتعمل يوم', '<span class="ltr">' + esc(fmtD(dayD(c.created))) + '</span>']
  ];
  return `<article class="qc-vr${sure ? ' sure' : ''}" data-id="${esc(c.id)}">
      <div class="qc-sbox"></div>
      <div class="qc-vd">
        <dl>${rows.map((r) => '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>').join('')}</dl>
        <button class="btn btn-quiet" type="button" data-qcact="edit">فتح الكارنيه</button>
      </div>
    </article>`;
}
function renderVer() {
  const box = document.getElementById('qcVerRes');
  if (!box) return;
  const q = verQ.trim();
  if (!q) { box.innerHTML = ''; return; }
  const nq = normCode(q), tq = normD(q);
  const exact = nq.length >= 4 ? cards.filter((c) => normCode(c.code) === nq || c.nid === nq || normCode(c.no) === nq) : [];
  let html;
  if (exact.length) {
    html = '<p class="qc-vok">✔ الكارنيه ده طالع من عندنا. قارن الصورة والاسم باللي قدامك.</p>' + exact.map((c) => verRow(c, true)).join('');
  } else {
    const part = cards.filter((c) =>
      (tq.length >= 2 && normD(c.name).indexOf(tq) >= 0) ||
      (nq.length >= 3 && (normCode(c.code).indexOf(nq) >= 0 || String(c.nid || '').indexOf(nq) >= 0 || normCode(c.no).indexOf(nq) >= 0))
    ).slice(0, 6);
    html = part.length
      ? '<p class="qc-vmaybe">مفيش تطابق كامل. دول أقرب كارنيهات للي كتبته، اتأكد إن الكود اللي على الكارنيه نفس الكود هنا بالظبط:</p>' + part.map((c) => verRow(c, false)).join('')
      : '<p class="qc-vno">✖ مفيش كارنيه عندنا بالبيانات دي. لو الكود مكتوب صح على الكارنيه، يبقى الكارنيه ده مش طالع من عندنا (أو اتلغى).</p>';
  }
  box.innerHTML = html;
  box.querySelectorAll('.qc-vr').forEach((el) => placeScaled(el.querySelector('.qc-sbox'), frontHTML(byId(el.dataset.id)), 0.62));
}

/* ── الطباعة ───────────────────────────── */
function sheetHTML(chunk, face, s, total) {
  let cells = '';
  for (let i = 0; i < 9; i++) {
    const c = chunk[i], row = Math.floor(i / 3), k = i % 3;
    const col = face === 'front' ? 2 - k : k;          // الضهر معكوس عشان كل وش يقابل ضهره
    cells += `<div style="grid-row:${row + 1};grid-column:${col + 1}">${c ? (face === 'front' ? frontHTML(c) : backHTML(c)) : ''}</div>`;
  }
  const label = face === 'front' ? 'الوش' : 'الضهر، تتطبع على ضهر نفس الورقة';
  return `<section class="qc-sheet"><div class="qc-sh"><img src="${LOGO}" alt=""><span>${esc(S.fullName)}</span>
    <small>ورقة ${arN(s + 1)} من ${arN(total)}، ${label}</small></div>
    <div class="qc-sg">${cells}</div></section>`;
}
async function doPrint() {
  const list = selected.size ? cards.filter((c) => selected.has(c.id)) : cards.slice();
  if (!list.length) { toast('مفيش كارنيهات للطباعة.'); return; }
  await needAssets();
  const total = Math.ceil(list.length / 9);
  let html = '';
  for (let s = 0; s < total; s++) {
    const chunk = list.slice(s * 9, s * 9 + 9);
    html += sheetHTML(chunk, 'front', s, total) + sheetHTML(chunk, 'back', s, total);
  }
  let pa = document.getElementById('qcPrint');
  if (!pa) { pa = document.createElement('div'); pa.id = 'qcPrint'; pa.setAttribute('aria-hidden', 'true'); document.body.appendChild(pa); }
  pa.innerHTML = html;
  await Promise.all(Array.from(pa.querySelectorAll('img')).map((i) => (i.decode ? i.decode().catch(() => {}) : null)));
  fit(pa);

  const prevTitle = document.title;
  document.title = 'كارنيهات-كوين-سيرفيس';
  document.body.classList.add('qc-printing');
  let done = false;
  const clean = () => {
    if (done) return; done = true;
    document.body.classList.remove('qc-printing');
    document.title = prevTitle;
    pa.innerHTML = '';
    window.removeEventListener('afterprint', clean);
  };
  window.addEventListener('afterprint', clean);
  try { window.print(); } catch (e) { toast('المتصفح ده مش بيدعم الطباعة. افتح الموقع من كروم.'); }
  setTimeout(clean, 1500);   // afterprint مش مضمون على كل المتصفحات
}

/* ── نسخة احتياطية ─────────────────────── */
function backup() {
  const data = { app: 'queen-cards', v: 1, at: new Date().toISOString(), cards, settings: S, jobs, depts: custom };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: 'application/json' }));
  a.download = 'كارنيهات-كوين-سيرفيس-' + new Date().toISOString().slice(0, 10) + '.json';
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
  toast('اتنزلت نسخة احتياطية فيها ' + arN(cards.length) + ' كارنيه');
}
function restore(file) {
  const r = new FileReader();
  r.onload = () => {
    let d = null; try { d = JSON.parse(r.result); } catch (e) { d = null; }
    if (!d || d.app !== 'queen-cards' || !Array.isArray(d.cards)) { toast('الملف ده مش نسخة احتياطية من كارنيهات كوين.'); return; }
    if (!confirm('استرجاع ' + arN(d.cards.length) + ' كارنيه من النسخة؟ الكارنيهات الموجودة بتفضل، واللي ليه نفس الكارنيه بيتبدّل بالنسخة.')) return;
    let added = 0, replaced = 0;
    d.cards.forEach((c) => {
      if (!c || !c.id) return;
      const i = cards.findIndex((x) => x.id === c.id);
      if (i >= 0) { cards[i] = c; replaced++; } else { cards.push(c); added++; }
    });
    if (d.settings) S = Object.assign({}, DEFAULT_SET, d.settings);
    if (!Array.isArray(S.instructions)) S.instructions = DEFAULT_INS.slice();
    if (!Array.isArray(S.instructionsMgmt)) S.instructionsMgmt = DEFAULT_INS_MGMT.slice();
    if (typeof S.jobAuto !== 'boolean') S.jobAuto = true;
    if (typeof S.secAuto !== 'boolean') S.secAuto = true;
    if (Array.isArray(d.jobs)) d.jobs.forEach((j) => { if (jobs.indexOf(j) < 0) jobs.push(j); });
    if (Array.isArray(d.depts)) d.depts.forEach((x) => { if (x && x.id && x.name && !customOf(x.id)) custom.push(x); });
    saveCards(); store.set(K.set, S); store.set(K.jobs, jobs); store.set(K.depts, custom);
    render();
    toast('اترجع ' + arN(added) + ' كارنيه جديد' + (replaced ? ' واتحدّث ' + arN(replaced) : ''));
  };
  r.readAsText(file);
}

/* ── الأحداث (مرة واحدة، بالتفويض على الصندوق) ── */
let raf = 0, setT = 0;
const live = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(renderPreview); };

function wire() {
  if (wired) return;
  const box = document.getElementById('qcBox');
  if (!box) return;
  wired = true;

  box.addEventListener('input', (e) => {
    const t = e.target;
    if (t.id === 'qcName') { draft.name = t.value; live(); }
    else if (t.id === 'qcJob') { draft.job = t.value; live(); }
    else if (t.id === 'qcSec') { draft.sec = t.value; live(); }
    else if (t.id === 'qcPhone') {
      const v = latin(t.value).replace(/[^\d+]/g, '');
      if (v !== t.value) t.value = v;
      draft.phone = v; live();
    }
    else if (t.id === 'qcNote') { draft.note = t.value; live(); }
    else if (t.id === 'qcNid') {
      const v = latin(t.value).replace(/\D/g, '').slice(0, 14);
      if (v !== t.value) t.value = v;
      draft.nid = v; live();
    }
    else if (t.id === 'qcNo') { draft.no = latin(t.value).toUpperCase(); noTouched = true; live(); }
    else if (t.id === 'qcSearch') renderList();
    else if (t.id === 'qcVer') { verQ = t.value; renderVer(); }
    else if (/^qcS/.test(t.id)) {
      S.company = document.getElementById('qcSCo').value.trim();
      S.tagline = document.getElementById('qcSTag').value.trim();
      S.frontFoot = document.getElementById('qcSFoot').value.trim();
      S.fullName = document.getElementById('qcSFull').value.trim();
      S.contact = latin(document.getElementById('qcSCt').value.trim());
      S.instructions = document.getElementById('qcSIns').value.split('\n').map((s) => s.trim()).filter(Boolean);
      S.instructionsMgmt = document.getElementById('qcSInsM').value.split('\n').map((s) => s.trim()).filter(Boolean);
      live();
      clearTimeout(setT); setT = setTimeout(() => { store.set(K.set, S); renderList(); }, 400);
    }
  });

  box.addEventListener('change', (e) => {
    const t = e.target;
    if (t.id === 'qcTech') {
      draft.tech = t.value;
      document.getElementById('qcTechHint').hidden = !draft.tech;
      const tc = techOf(draft.tech);
      if (tc) {
        if (!draft.name.trim()) { draft.name = tc.name || ''; document.getElementById('qcName').value = draft.name; }
        const s0 = (tc.svcs || [])[0];
        if (s0 && s0 !== draft.dept && depts().some((d) => d.id === s0)) {
          draft.dept = s0;
          paintDepts();
          syncJob();
        }
        /* الكارنيه المطبوع ياخد نفس رقم الفني اللي في أوامر الشغل */
        const no = techNo(draft.tech);
        if (no) { draft.no = no; noTouched = true; }
        else if (!editingId && !noTouched) draft.no = nextNo(draft.dept);
        document.getElementById('qcNo').value = draft.no;
      }
      live();
    }
    if (t.id === 'qcFile') {
      const f = t.files && t.files[0]; t.value = '';
      if (!f) return;
      if (!/^image\//.test(f.type)) { toast('اختار ملف صورة (JPG أو PNG).'); return; }
      const r = new FileReader();
      r.onload = () => { photoSrc = r.result; openCrop(photoSrc); };
      r.readAsDataURL(f);
    }
    if (t.id === 'qcRestore') { const f = t.files && t.files[0]; t.value = ''; if (f) restore(f); }
    if (t.id === 'qcXls') { const f = t.files && t.files[0]; t.value = ''; if (f) importXls(f); }
    if (t.id === 'qcPics') {
      const res = addPics(t.files); t.value = '';
      let msg = 'اتختار ' + arN(res.ok) + ' صورة';
      if (res.bad.length) msg += '، و' + arN(res.bad.length) + ' اسمها مش رقم قومي (' + res.bad.slice(0, 3).join('، ') + (res.bad.length > 3 ? '…' : '') + ')';
      toast(msg);
      if (imp) impPhoto().then(render); else render();
    }
    if (t.type === 'checkbox' && t.closest('.qc-th')) {
      const art = t.closest('.qc-th');
      if (t.checked) selected.add(art.dataset.id); else selected.delete(art.dataset.id);
      art.classList.toggle('sel', t.checked);
      counts();
    }
  });

  box.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.id === 'qcDeptName') { e.preventDefault(); addDept(); return; }
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.closest('.idf') && e.target.type !== 'file') {
      e.preventDefault(); saveCard();
    }
  });

  box.addEventListener('click', (e) => {
    const dx = e.target.closest('[data-qcdeptdel]');
    if (dx) { delDept(dx.dataset.qcdeptdel); return; }
    const dp = e.target.closest('[data-qcdept]');
    if (dp) {
      const nd = document.getElementById('qcNewDept');
      if (nd) delete nd.dataset.force;
      pickDept(dp.dataset.qcdept);
      if (dp.dataset.qcdept === 'other') setTimeout(() => { const i = document.getElementById('qcDeptName'); if (i) i.focus(); }, 30);
      return;
    }
    const sd = e.target.closest('[data-qcside]');
    if (sd) {
      side = sd.dataset.qcside;
      document.querySelectorAll('#qcSide .chip').forEach((b) => b.classList.toggle('on', b === sd));
      renderPreview();
      return;
    }
    const sm = e.target.closest('[data-qcsecmode]');
    if (sm) {
      const auto = sm.dataset.qcsecmode === 'auto';
      if (auto === !!draft.secAuto) return;
      draft.secAuto = auto;
      S.secAuto = auto; store.set(K.set, S);
      syncJob();
      render();
      if (!auto) { const s = document.getElementById('qcSec'); if (s) { s.focus(); s.select(); } }
      return;
    }
    const jm = e.target.closest('[data-qcjobmode]');
    if (jm) {
      const auto = jm.dataset.qcjobmode === 'auto';
      if (auto === !!draft.jobAuto) return;
      draft.jobAuto = auto;
      S.jobAuto = auto; store.set(K.set, S);
      syncJob();
      render();
      if (!auto) { const j = document.getElementById('qcJob'); if (j) { j.focus(); j.select(); } }
      return;
    }
    const jb = e.target.closest('[data-qcjob]');
    if (jb) {
      draft.job = jobs[+jb.dataset.qcjob] || '';
      document.getElementById('qcJob').value = draft.job;
      live();
      return;
    }
    const jd = e.target.closest('[data-qcjobdel]');
    if (jd) {
      const j = jobs[+jd.dataset.qcjobdel];
      jobs.splice(+jd.dataset.qcjobdel, 1); store.set(K.jobs, jobs); paintJobs();
      toast('اتمسحت «' + j + '» من القائمة');
      return;
    }
    const ac = e.target.closest('[data-qcact]');
    if (ac) {
      const id = ac.closest('.qc-th, .qc-vr').dataset.id;
      if (ac.dataset.qcact === 'edit') editCard(id);
      if (ac.dataset.qcact === 'del') delCard(id);
      return;
    }
    const b = e.target.closest('[data-qc]');
    if (!b) return;
    const act = b.dataset.qc;
    if (act === 'save') saveCard();
    if (act === 'deptadd') addDept();
    if (act === 'newdept') {
      const nd = document.getElementById('qcNewDept');
      nd.dataset.force = '1'; nd.hidden = false;
      document.getElementById('qcDeptName').focus();
    }
    if (act === 'clear') { if (imp) loadImp(); else { startNew(); render(); } }
    if (act === 'newcode') {
      if (editingId && !confirm('تدّي الكارنيه ده كود تصريح جديد؟\nالكود القديم (' + draft.code + ') مش هيبقى صالح، ولازم تطبع الكارنيه تاني بعد الحفظ.')) return;
      draft.code = genCode();
      document.getElementById('qcCode').value = draft.code;
      live();
    }
    if (act === 'impxls') document.getElementById('qcXls').click();
    if (act === 'imppics') document.getElementById('qcPics').click();
    if (act === 'impskip') skipImp();
    if (act === 'impall') saveAllImp();
    if (act === 'impstop') stopImp();
    if (act === 'repok') { impReport = null; render(); }
    if (act === 'jobadd') {
      const j = (document.getElementById('qcJob').value || '').trim();
      if (!j) { toast('اكتب الوظيفة الأول وبعدين احفظها في القائمة.'); document.getElementById('qcJob').focus(); return; }
      toast(addJob(j) ? 'الوظيفة «' + j + '» اتضافت للقائمة' : 'الوظيفة «' + j + '» موجودة في القائمة');
      paintJobs();
    }
    if (act === 'photo') document.getElementById('qcFile').click();
    if (act === 'recrop') openCrop(photoSrc || draft.photo);
    if (act === 'nophoto') { draft.photo = ''; photoSrc = ''; render(); }
    if (act === 'resetins') {
      if (!confirm('ترجع التعليمات للنص الأصلي بتاع كوين؟ تعديلاتك على التعليمات هتتشال.')) return;
      S.instructions = DEFAULT_INS.slice(); S.instructionsMgmt = DEFAULT_INS_MGMT.slice(); store.set(K.set, S);
      document.getElementById('qcSIns').value = S.instructions.join('\n');
      document.getElementById('qcSInsM').value = S.instructionsMgmt.join('\n');
      live(); renderList();
    }
    if (act === 'selall') {
      if (selected.size && selected.size === cards.length) selected.clear();
      else cards.forEach((c) => selected.add(c.id));
      renderList();
    }
    if (act === 'print') doPrint();
    if (act === 'backup') backup();
    if (act === 'restore') document.getElementById('qcRestore').click();
  });
}

let rt = 0;
window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (isOpen()) renderPreview(); }, 150); });

/* ── التسجيل في التنقّل ─────────────────── */
VIEWS.push('qcards');
const goBase = go;
go = function (name, arg) {
  if (name === 'qcards' && !isAdmin) { askPassword(); return; }
  goBase(name, arg);
  if (name === 'qcards') {
    document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('on', t.dataset.go === 'admin'));
    render();
  }
};
})();
