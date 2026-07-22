// ══════════════════════════════
//  DATA
// ══════════════════════════════
let customers = JSON.parse(localStorage.getItem('sms2_customers')||'[]');
let cFilter = 'all';
let markupType = 'pct';
let selectedPlan = 6;
let msgCust = null, ledCust = null;

function saveLocalData(){ localStorage.setItem('sms2_customers', JSON.stringify(customers)); }

// ══════════════════════════════
//  MARKUP TYPE
// ══════════════════════════════
function setMarkupType(t){
  markupType=t;
  ['pct','amt','none'].forEach(x=>{
    document.getElementById('mt-'+x).classList.toggle('on',x===t);
  });
  const mf = document.getElementById('markup-field');
  if(t==='none'){ mf.style.display='none'; document.getElementById('m-markup').value=''; }
  else{
    mf.style.display='flex';
    document.getElementById('mu-unit').textContent = t==='pct' ? '%' : 'Rs.';
    document.querySelector('label[for="m-markup"],#markup-field label').innerHTML =
      t==='pct' ? '<i class="fa-solid fa-chart-simple"></i> مارک اپ فیصد:' : '<i class="fa-solid fa-chart-simple"></i> مارک اپ رقم:';
  }
  calc();
}

// ══════════════════════════════
//  PLAN SELECT
// ══════════════════════════════
function selectPlan(m, el){
  selectedPlan = m;
  document.querySelectorAll('.plan-card').forEach(c=>c.classList.remove('selected'));
  if(el) el.classList.add('selected');
  const mb = document.getElementById('manual-months-box');
  if(m === 'manual'){
    mb.style.display = 'block';
    document.getElementById('m-months').value = parseInt(document.getElementById('m-months-manual').value)||0;
  } else {
    mb.style.display = 'none';
    document.getElementById('m-months').value = m;
  }
  calc();
}

function onManualMonths(){
  const mv = parseInt(document.getElementById('m-months-manual').value)||0;
  document.getElementById('m-months').value = mv;
  // auto-calc monthly from price unless manual monthly is set
  document.getElementById('m-monthly-manual').value = '';
  calc();
}

function onManualMonthly(){
  // if user types monthly manually, override calc result display
  const mv = parseFloat(document.getElementById('m-monthly-manual').value)||0;
  if(mv > 0){
    document.getElementById('cres').style.display = 'block';
    document.getElementById('cr-mon').textContent = 'Rs. '+fmt(mv)+' (مینوئل)';
  }
}

// ══════════════════════════════
//  CALCULATOR
// ══════════════════════════════
function calc(){
  suggestModel();
  const price  = parseFloat(document.getElementById('m-price').value)||0;
  const adv    = parseFloat(document.getElementById('m-adv').value)||0;
  const months = parseInt(document.getElementById('m-months').value)||6;
  const mval   = parseFloat(document.getElementById('m-markup').value)||0;

  if(!price){ document.getElementById('cres').style.display='none'; updatePlanPrices(0,0); return; }

  let markup = 0;
  if(markupType==='pct') markup = price * mval / 100;
  else if(markupType==='amt') markup = mval;

  const total   = price + markup;
  const remain  = total - adv;
  const monthly = Math.ceil(remain / months);

  document.getElementById('cres').style.display='block';
  document.getElementById('cr-price').textContent  = 'Rs. '+fmt(price);
  document.getElementById('cr-markup').textContent = markup>0 ? 'Rs. '+fmt(markup)+(markupType==='pct'?' ('+mval+'%)':'') : 'بغیر مارک اپ';
  document.getElementById('cr-total').textContent  = 'Rs. '+fmt(total);
  document.getElementById('cr-adv').textContent    = 'Rs. '+fmt(adv);
  document.getElementById('cr-rem').textContent    = 'Rs. '+fmt(remain);
  document.getElementById('cr-mo').textContent     = months+' ماہ';
  document.getElementById('cr-mon').textContent    = 'Rs. '+fmt(monthly);

  updatePlanPrices(total, adv);
}

function updatePlanPrices(total, adv){
  [2,4,6,8,10].forEach(m=>{
    const r = total - adv;
    const mon = total>0 ? 'Rs.'+fmt(Math.ceil(r/m)) : '—';
    document.getElementById('pp-'+m).textContent = mon;
  });
}

// ══════════════════════════════
//  SAVE / EDIT CUSTOMER
// ══════════════════════════════
// ── PRODUCT CATEGORY SYSTEM ──────────────────────────────────
//  Level 1: category  →  Level 2: item (category-specific)  →
//  Level 3: brand (category-specific)  →  Level 4: RAM/Storage
//  spec (mobile phones only)  →  Level 5: model number/name (manual)
//  →  Level 6: dynamic unique-ID field(s) (IMEI / Serial / Chassis+Engine)
//  →  Level 7: category-specific extra spec fields.
//  Every dropdown level keeps an independent "+" manual-override box.
const CATEGORY_CONFIG = {
  'الیکٹرانکس اینڈ ہوم اپلائنسز': {
    items:  ['واشنگ مشین','استری','فریج / ریفریجریٹر','ڈیپ فریزر','ائیر کنڈیشنر','مائیکرو ویو اوون','واٹر ڈسپنسر','جوسر بلینڈر','ایل ای ڈی ٹی وی','روم ہیٹر','گیزر'],
    brands: ['Dawlance','Haier','Pel','Orient','Gree','Waves','Kenwood','Philips','Panasonic','Anex'],
    idLabel:'سیریل نمبر', idIcon:'fa-barcode', idPlaceholder:'مثال: SR-2024-XXXX',
    extra: [
      {id:'size',     label:'سائز / کپیسٹی', icon:'fa-ruler-combined', placeholder:'مثال: 12kg, 1.5 Ton, 14 CFT'},
      {id:'inverter', label:'انورٹر / نان انورٹر', type:'select', options:['انورٹر','نان انورٹر']},
      {id:'warranty', label:'وارنٹی کا وقت', icon:'fa-shield-halved', placeholder:'مثال: 1 سال'}
    ]
  },
  'موبائل فونز اینڈ گیجٹس': {
    items:  ['اسمارٹ فون','کی پیڈ فون','ٹیبلٹ / آئی پیڈ','لیپ ٹاپ','اسمارٹ واچ','ائیر پوڈز / ہینڈز فری','پاور بینک','کمپیوٹر ایل سی ڈی','گیمنگ کنسول','وائی فائی راؤٹر'],
    brands: ['Samsung','Apple','Vivo','Oppo','Infinix','Tecno','Xiaomi/Redmi','Realme','OnePlus','Nokia','Huawei','Honor','Itel'],
    idLabel:'IMEI نمبر', idIcon:'fa-mobile-screen-button', idPlaceholder:'مثال: 356789104561234',
    specItems: ['اسمارٹ فون','ٹیبلٹ / آئی پیڈ','لیپ ٹاپ'],
    extra: [
      {id:'color',     label:'کلر', icon:'fa-palette', placeholder:'مثال: بلیک'},
      {id:'condition', label:'کنڈیشن', type:'select', options:['نیا (New)','استعمال شدہ (Used)']}
    ]
  },
  'گاڑیاں اینڈ بائیکس': {
    items:  ['موٹر سائیکل 70cc','موٹر سائیکل 125cc','ہیوی بائیک','لوڈر رکشہ','مسافر رکشہ','کار / گاڑی','الیکٹرک بائیک','اسکوٹی','چنگ چی رکشہ','بائیسکل / سائیکل'],
    brands: ['Honda','Suzuki','Yamaha','United','Road Prince','Toyota','Hi-Speed'],
    idLabel:'چیسس نمبر', idIcon:'fa-hashtag', idPlaceholder:'مثال: CH-123456',
    hasEngine: true,
    extra: [
      {id:'regno',     label:'رجسٹریشن نمبر', icon:'fa-id-card', placeholder:'مثال: LEA-1234'},
      {id:'modelyear', label:'ماڈل سال', icon:'fa-calendar', placeholder:'مثال: 2023'},
      {id:'color',     label:'کلر', icon:'fa-palette', placeholder:'مثال: سرخ'}
    ]
  },
  'فرنیچر اینڈ ہوم ڈیکور': {
    items:  ['بیڈ سیٹ','صوفہ سیٹ','ڈائننگ ٹیبل','الماری','ڈریسنگ ٹیبل','شوکیس','گدا / میٹرس','کچن کیبنٹ','کمپیوٹر ٹیبل / آفس چیئر','سینٹر ٹیبل'],
    brands: ['Interwood','Diamond Foam','Local Market','Local Wood'],
    idLabel:'سیریل / شناخت نمبر (اختیاری)', idIcon:'fa-hashtag', idPlaceholder:'اختیاری',
    extra: [
      {id:'wood',   label:'لکڑی کی قسم', type:'select', options:['صرف','ٹاہلی','کیکر','لیمینیشن','دیگر']},
      {id:'fabric', label:'کپڑے کا کلر / ٹائپ', icon:'fa-palette', placeholder:'مثال: گرے فیبرک'},
      {id:'size',   label:'سائز', icon:'fa-ruler', placeholder:'مثال: King Size, 5-Seater'}
    ]
  },
  'دیگر': {
    items: [], brands: [],
    idLabel:'سیریل / شناخت نمبر', idIcon:'fa-hashtag', idPlaceholder:'مثال: کوئی بھی شناختی نمبر',
    extra: []
  }
};
const ITEM_SPEC_OPTIONS = ['2/32','3/32','3/64','4/64','4/128','6/128','6/256','8/128','8/256'];

// Maps the old single-level "itemType" values (from before the 4-category
// system existed) onto the new category/item pair, so previously saved
// customers still edit correctly.
const LEGACY_ITEMTYPE_MAP = {
  'موبائل':            {category:'موبائل فونز اینڈ گیجٹس', item:'اسمارٹ فون'},
  'لیپ ٹاپ':           {category:'موبائل فونز اینڈ گیجٹس', item:'لیپ ٹاپ'},
  'ٹیبلٹ':             {category:'موبائل فونز اینڈ گیجٹس', item:'ٹیبلٹ / آئی پیڈ'},
  'ٹی وی / ایل ای ڈی': {category:'الیکٹرانکس اینڈ ہوم اپلائنسز', item:'ایل ای ڈی ٹی وی'},
  'فرج':               {category:'الیکٹرانکس اینڈ ہوم اپلائنسز', item:'فریج / ریفریجریٹر'},
  'ایئر کنڈیشنر':      {category:'الیکٹرانکس اینڈ ہوم اپلائنسز', item:'ائیر کنڈیشنر'},
  'موٹر سائیکل':       {category:'گاڑیاں اینڈ بائیکس', item:''},
  'فرنیچر':            {category:'فرنیچر اینڈ ہوم ڈیکور', item:''},
};
function legacyCategoryFor(itemType){ return (LEGACY_ITEMTYPE_MAP[itemType]||{}).category || itemType || ''; }
function legacyItemFor(itemType){ return (LEGACY_ITEMTYPE_MAP[itemType]||{}).item || ''; }

// Generic "+" toggle used by every level's manual-entry box.
function toggleManualBox(boxId, btn){
  const box = document.getElementById(boxId);
  if(!box) return;
  const show = box.style.display === 'none' || !box.style.display;
  box.style.display = show ? 'block' : 'none';
  if(btn) btn.classList.toggle('on', show);
  if(show){
    const inp = box.querySelector('input');
    if(inp) setTimeout(()=>inp.focus(), 50);
  }
  calc();
}

function currentCategoryKey(){
  const el = document.getElementById('m-category');
  return el ? el.value : 'دیگر';
}
function currentCategoryConfig(){
  return CATEGORY_CONFIG[currentCategoryKey()] || CATEGORY_CONFIG['دیگر'];
}

// ── LEVEL 1 — Category ──
function onCategoryChange(){
  const catKey = currentCategoryKey();
  const otherBox = document.getElementById('m-category-other-box');
  if(otherBox) otherBox.style.display = (catKey === 'دیگر') ? 'block' : 'none';
  populateItemAndBrandDropdowns(catKey);
  updateIdFieldsForCategory(catKey);
  renderExtraFields(catKey);
  suggestModel();
  calc();
}
function onCategoryOtherInput(){ suggestModel(); calc(); }

function populateItemAndBrandDropdowns(catKey){
  const cfg = CATEGORY_CONFIG[catKey] || CATEGORY_CONFIG['دیگر'];
  const itemBox  = document.getElementById('m-item-box');
  const itemSel  = document.getElementById('m-item-sel');
  const brandBox = document.getElementById('m-brand-box');
  const brandSel = document.getElementById('m-brand');
  const itemOtherBox  = document.getElementById('m-item-other-box');
  const brandOtherBox = document.getElementById('m-brand-other-box');

  if(cfg.items.length){
    itemBox.style.display = 'block';
    itemSel.innerHTML = '<option value="">-- منتخب کریں --</option>' +
      cfg.items.map(it=>`<option value="${it}">${it}</option>`).join('') +
      '<option value="دیگر">🛠️ دیگر</option>';
    itemSel.value = '';
    itemOtherBox.style.display = 'none';
  } else {
    itemBox.style.display = 'none';
    itemOtherBox.style.display = 'block';
  }
  document.getElementById('m-item-other').value = '';

  if(cfg.brands.length){
    brandBox.style.display = 'block';
    brandSel.innerHTML = '<option value="">-- منتخب کریں --</option>' +
      cfg.brands.map(b=>`<option value="${b}">${b}</option>`).join('') +
      '<option value="دیگر">🛠️ دیگر</option>';
    brandSel.value = '';
    brandOtherBox.style.display = 'none';
  } else {
    brandBox.style.display = 'none';
    brandOtherBox.style.display = 'block';
  }
  document.getElementById('m-brand-other').value = '';

  updateSpecVisibility(catKey, '');
}

// ── LEVEL 2 — Item ──
function onItemSelChange(){
  const catKey  = currentCategoryKey();
  const itemVal = document.getElementById('m-item-sel').value;
  const otherBox = document.getElementById('m-item-other-box');
  if(otherBox) otherBox.style.display = (itemVal === 'دیگر') ? 'block' : 'none';
  updateSpecVisibility(catKey, itemVal);
  suggestModel();
  calc();
}

// ── LEVEL 3 — Brand ──
function onBrandChange(){
  const brandVal = document.getElementById('m-brand').value;
  const otherBox = document.getElementById('m-brand-other-box');
  if(otherBox) otherBox.style.display = (brandVal === 'دیگر') ? 'block' : 'none';
  suggestModel();
  calc();
}

// ── LEVEL 4 — RAM/Storage spec (only for phone/tablet/laptop items) ──
function updateSpecVisibility(catKey, itemVal){
  const cfg = CATEGORY_CONFIG[catKey] || CATEGORY_CONFIG['دیگر'];
  const specBox = document.getElementById('m-spec-box');
  const show = !!(cfg.specItems && cfg.specItems.includes(itemVal));
  specBox.style.display = show ? 'block' : 'none';
  if(!show) document.getElementById('m-spec-other-box').style.display = 'none';
}

// ── LEVEL 6 — Dynamic unique-ID field(s) ──
function updateIdFieldsForCategory(catKey){
  const cfg = CATEGORY_CONFIG[catKey] || CATEGORY_CONFIG['دیگر'];
  const lbl = document.getElementById('m-imei-label');
  const inp = document.getElementById('m-imei');
  if(lbl) lbl.innerHTML = `<i class="fa-solid ${cfg.idIcon||'fa-hashtag'}"></i> ${cfg.idLabel}`;
  if(inp) inp.placeholder = cfg.idPlaceholder || '';
  const engineBox = document.getElementById('m-engine-box');
  if(engineBox){
    engineBox.style.display = cfg.hasEngine ? 'block' : 'none';
    if(!cfg.hasEngine) document.getElementById('m-engine-no').value = '';
  }
}

// ── LEVEL 7 — Category-specific extra fields (rendered dynamically) ──
function renderExtraFields(catKey){
  const cfg  = CATEGORY_CONFIG[catKey] || CATEGORY_CONFIG['دیگر'];
  const wrap = document.getElementById('m-extra-wrap');
  const cont = document.getElementById('m-extra-fields');
  if(!cfg.extra || !cfg.extra.length){ wrap.style.display='none'; cont.innerHTML=''; return; }
  wrap.style.display = 'block';
  cont.innerHTML = cfg.extra.map(f=>{
    const id = 'm-extra-'+f.id;
    if(f.type==='select'){
      return `<div class="fg"><label><i class="fa-solid fa-list"></i> ${f.label}</label>
        <select id="${id}"><option value="">-- منتخب کریں --</option>${f.options.map(o=>`<option value="${o}">${o}</option>`).join('')}</select></div>`;
    }
    return `<div class="fg"><label><i class="fa-solid ${f.icon||'fa-circle-info'}"></i> ${f.label}</label>
      <input id="${id}" placeholder="${f.placeholder||''}"></div>`;
  }).join('');
}
function getExtraFieldValues(){
  const cfg = currentCategoryConfig();
  const out = {};
  (cfg.extra||[]).forEach(f=>{
    const el = document.getElementById('m-extra-'+f.id);
    if(el) out[f.id] = (el.value||'').trim ? el.value.trim() : el.value;
  });
  return out;
}

// ── LEVEL 5 — Model number/name: a real manual field, but auto-suggested
//    from brand+spec (or item) as a convenience until the user types their
//    own value, so it's never left blank by accident. ──
let _modelTouched = false;
function _markModelEdited(){ _modelTouched = true; }
function suggestModel(){
  const modelEl = document.getElementById('m-model');
  if(!modelEl || _modelTouched) return;
  const brand = getBrandValue();
  const item  = getItemValue();
  const spec  = getSpecValue();
  let parts = [];
  if(brand) parts.push(brand);
  if(spec)  parts.push(spec);
  if(!parts.length && item) parts.push(item);
  modelEl.value = parts.join(' ');
}

// ── Setters used when loading a saved customer for editing ──
function setCategory(val){
  const sel = document.getElementById('m-category');
  if(!sel) return;
  if(Object.prototype.hasOwnProperty.call(CATEGORY_CONFIG, val)){
    sel.value = val;
    document.getElementById('m-category-other').value = '';
  } else {
    sel.value = 'دیگر';
    document.getElementById('m-category-other').value = val || '';
  }
  onCategoryChange();
}
function setItem(val){
  const catKey = currentCategoryKey();
  const cfg = CATEGORY_CONFIG[catKey] || CATEGORY_CONFIG['دیگر'];
  if(cfg.items.length){
    const sel = document.getElementById('m-item-sel');
    if(val && cfg.items.includes(val)){
      sel.value = val;
      document.getElementById('m-item-other').value = '';
      document.getElementById('m-item-other-box').style.display = 'none';
    } else if(val){
      sel.value = 'دیگر';
      document.getElementById('m-item-other').value = val;
      document.getElementById('m-item-other-box').style.display = 'block';
    }
  } else if(val){
    document.getElementById('m-item-other').value = val;
  }
  updateSpecVisibility(catKey, document.getElementById('m-item-sel').value);
}
function setBrand(val){
  const catKey = currentCategoryKey();
  const cfg = CATEGORY_CONFIG[catKey] || CATEGORY_CONFIG['دیگر'];
  if(cfg.brands.length){
    const sel = document.getElementById('m-brand');
    if(val && cfg.brands.includes(val)){
      sel.value = val;
      document.getElementById('m-brand-other').value = '';
      document.getElementById('m-brand-other-box').style.display = 'none';
    } else if(val){
      sel.value = 'دیگر';
      document.getElementById('m-brand-other').value = val;
      document.getElementById('m-brand-other-box').style.display = 'block';
    }
  } else if(val){
    document.getElementById('m-brand-other').value = val;
  }
}
function setSpec(val){
  const sel = document.getElementById('m-spec');
  if(!sel) return;
  if(!val){ sel.value=''; document.getElementById('m-spec-other').value=''; return; }
  if(ITEM_SPEC_OPTIONS.includes(val)){
    sel.value = val;
    document.getElementById('m-spec-other').value = '';
  } else {
    sel.value = 'دیگر';
    document.getElementById('m-spec-other').value = val;
    document.getElementById('m-spec-other-box').style.display = 'block';
  }
}
function setExtraFieldValues(obj){
  if(!obj) return;
  Object.keys(obj).forEach(k=>{
    const el = document.getElementById('m-extra-'+k);
    if(el) el.value = obj[k] || '';
  });
}

// ── Getters used when saving: manual "+" text (if open & filled) always wins ──
function getCategoryValue(){
  const sel = document.getElementById('m-category').value;
  if(sel === 'دیگر'){
    const otherVal = (document.getElementById('m-category-other')?.value||'').trim();
    return otherVal || 'دیگر';
  }
  return sel;
}
function getItemValue(){
  const cfg = currentCategoryConfig();
  const otherVal = (document.getElementById('m-item-other')?.value||'').trim();
  if(!cfg.items.length) return otherVal;
  const sel = document.getElementById('m-item-sel').value;
  return sel === 'دیگر' ? otherVal : sel;
}
function getBrandValue(){
  const cfg = currentCategoryConfig();
  const otherVal = (document.getElementById('m-brand-other')?.value||'').trim();
  if(!cfg.brands.length) return otherVal;
  const sel = document.getElementById('m-brand').value;
  return sel === 'دیگر' ? otherVal : sel;
}
function getSpecValue(){
  const box = document.getElementById('m-spec-box');
  if(!box || box.style.display === 'none') return '';
  const otherBox = document.getElementById('m-spec-other-box');
  const otherVal = document.getElementById('m-spec-other')?.value.trim();
  if(otherBox && otherBox.style.display !== 'none' && otherVal) return otherVal;
  const sel = document.getElementById('m-spec').value;
  return sel === 'دیگر' ? (otherVal || '') : sel;
}

function saveCustomer(){
  const name  = document.getElementById('c-name').value.trim();
  const phone = document.getElementById('c-phone').value.trim();
  const price = parseFloat(document.getElementById('m-price').value)||0;
  const category = getCategoryValue();
  const item     = getItemValue();
  const itemBrand = getBrandValue();
  const itemSpec  = getSpecValue();
  suggestModel();
  const model = document.getElementById('m-model').value.trim();
  const imei  = document.getElementById('m-imei').value.trim();
  const engineNo = document.getElementById('m-engine-no').value.trim();
  const extra = getExtraFieldValues();
  if(!name||!phone||!price||!model){ showToast('<i class="fa-solid fa-triangle-exclamation"></i> نام، نمبر، آئٹم اور قیمت لازمی ہے','warn'); return; }

  const adv    = parseFloat(document.getElementById('m-adv').value)||0;
  const months = parseInt(document.getElementById('m-months').value)||6;
  const mval   = parseFloat(document.getElementById('m-markup').value)||0;
  let markup=0;
  if(markupType==='pct') markup = price*mval/100;
  else if(markupType==='amt') markup = mval;
  const total   = price + markup;
  const remain  = total - adv;
  // Use manual monthly if entered, else auto-calculate
  const manualMonthly = parseFloat(document.getElementById('m-monthly-manual').value)||0;
  const monthly = manualMonthly > 0 ? manualMonthly : Math.ceil(remain/months);
  const startD  = document.getElementById('m-start').value || new Date().toISOString().split('T')[0];

  const editId = document.getElementById('edit-id').value;

  const data = {
    name, phone,
    cnic:  document.getElementById('c-cnic').value.trim(),
    email: document.getElementById('c-email').value.trim(),
    wa:    document.getElementById('c-wa').value.trim()||phone,
    addr:  document.getElementById('c-addr').value.trim(),
    gps: {
      lat: document.getElementById('c-gps-lat').value ? parseFloat(document.getElementById('c-gps-lat').value) : null,
      lng: document.getElementById('c-gps-lng').value ? parseFloat(document.getElementById('c-gps-lng').value) : null
    },
    guarantor:{ name:document.getElementById('g-name').value.trim(), phone:document.getElementById('g-phone').value.trim(), cnic:document.getElementById('g-cnic').value.trim() },
    mobile:{ category, item, itemType: item || category, itemBrand, itemSpec, model, imei, engineNo, extra, price, markup, markupType, markupPct: markupType==='pct'?mval:0, total, advance:adv, remaining:remain, months, monthly, startDate:startD, dueDay:parseInt(document.getElementById('m-dday').value)||10 },
  };

  if(editId){
    // Editing an existing agreement — save immediately, no signature step.
    const idx = customers.findIndex(c=>c.id==editId);
    if(idx>-1){ customers[idx] = {...customers[idx], ...data}; }
    showToast('<i class="fa-solid fa-circle-check"></i> کسٹمر اپ ڈیٹ ہو گیا!');
    save(); clearForm();
    renderDash();
    renderCustomers();
    showSc('customers');
    setTimeout(()=>openLedger(idx>-1 ? customers[idx].id : null), 300);
    return;
  }

  // New agreement — hold the assembled data and collect BOTH signatures
  // (shopkeeper + customer) before it's actually created.
  _pendingCustomerData = data;
  openSignatureModal();
}

// Finishes creating a new customer record once both signature pads
// have been confirmed. Runs the same finalize/sync steps saveCustomer()
// used to run directly for a brand-new agreement.
function finalizeAgreementWithSignatures(){
  const shopCanvas = document.getElementById('sig-canvas-shop');
  const custCanvas = document.getElementById('sig-canvas-cust');
  if(_isCanvasBlank(shopCanvas) || _isCanvasBlank(custCanvas)){
    showToast('<i class="fa-solid fa-triangle-exclamation"></i> براہ مہربانی دونوں فریقین کے دستخط کریں', 'warn');
    return;
  }
  const data = _pendingCustomerData;
  if(!data) return;

  data.id = Date.now();
  data.grNo = _getGrCounter() + 1;
  localStorage.setItem('sms_gr_counter', String(data.grNo));
  data.payments = [];
  data.createdAt = new Date().toISOString();
  data.status = 'active';
  // Dual digital signatures, attached directly to the customer record
  // so they travel with it into every Firebase sync automatically.
  data.signatures = {
    shopkeeper: shopCanvas.toDataURL('image/png'),
    customer:   custCanvas.toDataURL('image/png'),
    signedAt:   new Date().toISOString()
  };
  customers.push(data);
  const savedId = data.id;
  _pendingCustomerData = null;

  closeMod('sig-wizard');
  showToast('<i class="fa-solid fa-circle-check"></i> معاہدہ دستخط کے ساتھ محفوظ ہو گیا!');

  save(); clearForm();
  renderDash();
  renderCustomers(); // show the full up-to-date list immediately (not just on search)

  // Immediately compile and show the full contract summary — customer
  // + guarantor details, mobile/IMEI specs, T&Cs, and both signatures —
  // with a one-tap "Send via WhatsApp" button, instead of just opening
  // the ledger.
  showSc('customers');
  setTimeout(()=>showAgreement(savedId), 300);
}

function cancelSignatureModal(){
  closeMod('sig-wizard');
  _pendingCustomerData = null;
  showToast('↩️ دستخط منسوخ — فارم محفوظ ہے، دوبارہ "محفوظ کریں" دبائیں');
}

// ══════════════════════════════════════════════════════════════
//  FULL-SCREEN DUAL SIGNATURE WIZARD
// ──────────────────────────────────────────────────────────────
//  Step 1: Shopkeeper Signature (full-width / half-height pad) → Next
//  Step 2: Customer Signature (same layout) → Save
// ══════════════════════════════════════════════════════════════
let _pendingCustomerData = null; // customer data waiting on both signatures
let _sigStep = 1;                // 1 = shopkeeper, 2 = customer

function openSignatureModal(){
  openMod('sig-wizard'); // handles the 'open' class + back-button nav stack
  _sigStep = 1;
  _sigWizardRender();

  // Wait one frame so the wizard has real layout dimensions before we
  // size the canvases to match (canvases are 0×0 while display:none).
  requestAnimationFrame(()=>{
    _setupSignatureCanvas('sig-canvas-shop');
    _setupSignatureCanvas('sig-canvas-cust');
    clearSignature('sig-canvas-shop');
    clearSignature('sig-canvas-cust');
  });
}

// Moves the wizard forward: step 1 → validate shopkeeper signed → step 2.
// Step 2's button re-uses this same handler but triggers the actual save.
function sigWizardNext(){
  if(_sigStep === 1){
    if(_isCanvasBlank(document.getElementById('sig-canvas-shop'))){
      showToast('<i class="fa-solid fa-triangle-exclamation"></i> پہلے دکاندار کے دستخط کریں', 'warn');
      return;
    }
    _sigStep = 2;
    _sigWizardRender();
  } else {
    finalizeAgreementWithSignatures();
  }
}

function sigWizardBack(){
  if(_sigStep === 2){
    _sigStep = 1;
    _sigWizardRender();
  }
}

// Clears whichever pad is currently active/visible.
function clearActiveSignature(){
  clearSignature(_sigStep === 1 ? 'sig-canvas-shop' : 'sig-canvas-cust');
}

function _sigWizardRender(){
  const shopWrap = document.getElementById('sig-pad-shop-wrap');
  const custWrap = document.getElementById('sig-pad-cust-wrap');
  const title    = document.getElementById('sig-wizard-title');
  const hint     = document.getElementById('sig-wizard-hint');
  const nextBtn  = document.getElementById('sig-wizard-next');
  const backBtn  = document.getElementById('sig-wizard-back');
  const dot1     = document.getElementById('sig-step-dot-1');
  const dot2     = document.getElementById('sig-step-dot-2');

  if(_sigStep === 1){
    if(shopWrap) shopWrap.style.display = 'flex';
    if(custWrap) custWrap.style.display = 'none';
    if(title) title.textContent = 'مالک دکان / اونر کے دستخط (Owner Signature)';
    if(hint)  hint.textContent  = 'مرحلہ 1 از 2 — دکاندار براہ مہربانی نیچے دستخط کریں';
    if(nextBtn) nextBtn.innerHTML = 'اگلا <i class="fa-solid fa-arrow-left"></i>';
    if(backBtn) backBtn.style.display = 'none';
    if(dot1) dot1.classList.add('active');
    if(dot2) dot2.classList.remove('active');
    // Re-fit in case the pad was resized while hidden.
    requestAnimationFrame(()=>_fitSignatureCanvas(document.getElementById('sig-canvas-shop')));
  } else {
    if(shopWrap) shopWrap.style.display = 'none';
    if(custWrap) custWrap.style.display = 'flex';
    if(title) title.textContent = 'کسٹمر کے دستخط (Customer Signature)';
    if(hint)  hint.textContent  = 'مرحلہ 2 از 2 — کسٹمر براہ مہربانی نیچے دستخط کریں';
    if(nextBtn) nextBtn.innerHTML = '<i class="fa-solid fa-check"></i> محفوظ کریں';
    if(backBtn) backBtn.style.display = 'block';
    if(dot1) dot1.classList.remove('active');
    if(dot2) dot2.classList.add('active');
    requestAnimationFrame(()=>_fitSignatureCanvas(document.getElementById('sig-canvas-cust')));
  }
}

function _fitSignatureCanvas(canvas){
  if(!canvas) return;
  const dpr  = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth  || 300;
  const cssH = canvas.clientHeight || 200;
  const targetW = Math.round(cssW*dpr), targetH = Math.round(cssH*dpr);
  if(canvas.width !== targetW || canvas.height !== targetH){
    // Preserve whatever was already drawn across a resize (e.g. screen
    // rotation) instead of silently wiping the signature.
    let prev = null;
    if(canvas.width > 0 && canvas.height > 0){
      try{ prev = canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height); }catch(e){}
    }
    canvas.width  = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0,0,cssW,cssH);
    if(prev){
      try{ ctx.setTransform(1,0,0,1,0,0); ctx.putImageData(prev,0,0); ctx.setTransform(dpr,0,0,dpr,0,0); }catch(e){}
    }
  }
}

function _setupSignatureCanvas(id){
  const canvas = document.getElementById(id);
  if(!canvas) return;
  _fitSignatureCanvas(canvas);
  if(canvas._sigReady) return; // listeners already attached once
  canvas._sigReady = true;

  const ctx = canvas.getContext('2d');
  let drawing = false, lastX = 0, lastY = 0;

  function pos(e){
    const rect = canvas.getBoundingClientRect();
    const t = (e.touches && e.touches[0]) ? e.touches[0] : e;
    return { x: t.clientX - rect.left, y: t.clientY - rect.top };
  }
  function start(e){
    drawing = true;
    const p = pos(e); lastX = p.x; lastY = p.y;
    e.preventDefault();
  }
  function move(e){
    if(!drawing) return;
    const p = pos(e);
    ctx.strokeStyle = '#0D1B4B';
    ctx.lineWidth = 2.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastX = p.x; lastY = p.y;
    e.preventDefault();
  }
  function end(){ drawing = false; }

  // Touch (Android WebView) + mouse (desktop testing) support, with
  // { passive:false } so preventDefault() actually stops the page from
  // scrolling while signing on mobile.
  canvas.addEventListener('touchstart', start, { passive:false });
  canvas.addEventListener('touchmove',  move,  { passive:false });
  canvas.addEventListener('touchend',   end);
  canvas.addEventListener('mousedown',  start);
  canvas.addEventListener('mousemove',  move);
  window.addEventListener('mouseup',    end);
}

function clearSignature(id){
  const canvas = document.getElementById(id);
  if(!canvas) return;
  _fitSignatureCanvas(canvas);
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  ctx.save();
  ctx.setTransform(1,0,0,1,0,0);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.restore();
  ctx.setTransform(dpr,0,0,dpr,0,0);
}

function _isCanvasBlank(canvas){
  if(!canvas || !canvas.width || !canvas.height) return true;
  const ctx = canvas.getContext('2d');
  const px = ctx.getImageData(0,0,canvas.width,canvas.height).data;
  for(let i=0;i<px.length;i+=4){
    if(px[i]<250 || px[i+1]<250 || px[i+2]<250) return false; // found a non-white pixel
  }
  return true;
}
function editCustomer(id){
  const c = customers.find(x=>x.id===id);
  if(!c) return;
  closeMod('mod-detail');
  document.getElementById('edit-id').value = id;
  document.getElementById('add-title').innerHTML = '<i class="fa-solid fa-pen"></i> کسٹمر ایڈٹ کریں';
  document.getElementById('save-btn').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> اپ ڈیٹ کریں';
  document.getElementById('cancel-edit-btn').style.display='flex';
  _refreshGrBadge(c.grNo || null);
  const grLbl = document.querySelector('.gr-badge-label');
  if(grLbl) grLbl.textContent = c.grNo ? 'کسٹمر رجسٹریشن نمبر' : 'یہ پرانا ریکارڈ ہے — GR نمبر دستیاب نہیں';
  if(!c.grNo){ const badgeEl=document.getElementById('c-gr-badge-text'); if(badgeEl) badgeEl.textContent='—'; }

  document.getElementById('c-name').value  = c.name||'';
  document.getElementById('c-phone').value = c.phone||'';
  document.getElementById('c-cnic').value  = c.cnic||'';
  document.getElementById('c-email').value = c.email||'';
  document.getElementById('c-wa').value    = c.wa||'';
  document.getElementById('c-addr').value  = c.addr||'';
  if(c.gps && c.gps.lat != null && c.gps.lng != null){
    document.getElementById('c-gps-lat').value = c.gps.lat;
    document.getElementById('c-gps-lng').value = c.gps.lng;
    document.getElementById('c-gps-display').value = c.gps.lat.toFixed(6) + ', ' + c.gps.lng.toFixed(6);
  } else {
    _resetCustomerGpsFields();
  }
  document.getElementById('g-name').value  = c.guarantor?.name||'';
  document.getElementById('g-phone').value = c.guarantor?.phone||'';
  document.getElementById('g-cnic').value  = c.guarantor?.cnic||'';

  const savedCategory = c.mobile?.category || legacyCategoryFor(c.mobile?.itemType) || 'موبائل فونز اینڈ گیجٹس';
  const savedItem     = c.mobile?.item     || legacyItemFor(c.mobile?.itemType)     || '';
  setCategory(savedCategory);
  setItem(savedItem);
  setBrand(c.mobile?.itemBrand||'');
  setSpec(c.mobile?.itemSpec||'');
  document.getElementById('m-model').value = c.mobile?.model||'';
  _modelTouched = true; // keep the customer's original model text; don't auto-overwrite it
  document.getElementById('m-imei').value = c.mobile?.imei||'';
  document.getElementById('m-engine-no').value = c.mobile?.engineNo||'';
  setExtraFieldValues(c.mobile?.extra||{});

  document.getElementById('m-price').value = c.mobile?.price||'';
  document.getElementById('m-adv').value   = c.mobile?.advance||'';
  document.getElementById('m-start').value = c.mobile?.startDate||'';
  document.getElementById('m-dday').value  = c.mobile?.dueDay||10;

  const mt = c.mobile?.markupType||'none';
  setMarkupType(mt);
  document.getElementById('m-markup').value = mt==='pct' ? (c.mobile?.markupPct||0) : (c.mobile?.markup||0);

  const savedMonths = c.mobile?.months||6;
  const planNums = [2,4,6,8,10];
  const planIdx = planNums.indexOf(savedMonths);
  if(planIdx > -1){
    selectPlan(savedMonths, document.querySelectorAll('.plan-card')[planIdx]);
  } else {
    // manual plan
    selectPlan('manual', document.getElementById('plan-manual'));
    document.getElementById('m-months-manual').value = savedMonths;
    document.getElementById('m-months').value = savedMonths;
  }
  if(c.mobile?.manualMonthly) document.getElementById('m-monthly-manual').value = c.mobile.monthly;
  calc();
  showSc('add');
  window.scrollTo(0,0);
}

function cancelEdit(){
  clearForm();
  document.getElementById('add-title').innerHTML='<i class="fa-solid fa-circle-plus"></i> نیا کسٹمر شامل کریں';
  document.getElementById('save-btn').innerHTML='<i class="fa-solid fa-floppy-disk"></i> کسٹمر محفوظ کریں';
  document.getElementById('cancel-edit-btn').style.display='none';
  const grLbl = document.querySelector('.gr-badge-label');
  if(grLbl) grLbl.textContent = 'کسٹمر رجسٹریشن نمبر (خودکار)';
}

// ══════════════════════════════
//  GR NUMBER (auto customer registration number — GR#0001, GR#0002...)
//  Stored as a persistent counter so numbers never repeat, even if a
//  customer is later deleted.
// ══════════════════════════════
function _getGrCounter(){
  const n = parseInt(localStorage.getItem('sms_gr_counter')||'0', 10);
  return isNaN(n) ? 0 : n;
}
function _formatGr(n){ return 'GR#' + String(n).padStart(4,'0'); }
function _refreshGrBadge(explicitNo){
  const el = document.getElementById('c-gr-badge-text');
  if(!el) return;
  el.textContent = explicitNo != null ? _formatGr(explicitNo) : _formatGr(_getGrCounter()+1);
}

function clearForm(){
  ['c-name','c-phone','c-cnic','c-email','c-wa','c-addr','g-name','g-phone','g-cnic','m-model','m-imei','m-engine-no','m-price','m-adv','m-markup','m-start','m-months-manual','m-monthly-manual','m-category-other','m-item-other','m-brand-other','m-spec-other'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
  document.getElementById('edit-id').value='';
  _modelTouched = false;
  setCategory('موبائل فونز اینڈ گیجٹس');
  setItem('');
  setBrand('');
  setSpec('');
  document.getElementById('m-months').value=6;
  document.getElementById('cres').style.display='none';
  document.getElementById('manual-months-box').style.display='none';
  selectPlan(6, document.querySelectorAll('.plan-card')[2]);
  setMarkupType('pct');
  _resetCustomerGpsFields();
  _refreshGrBadge();
}

// ══════════════════════════════
//  RENDER CUSTOMERS
// ══════════════════════════════
function setF(el,f){
  document.querySelectorAll('.ftab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active'); cFilter=f; renderCustomers();
}

function renderCustomers(){
  const el=document.getElementById('clist');
  if(!el) return; // DOM not ready
  const q=(document.getElementById('srch')?.value||'').toLowerCase();
  let list=customers.filter(c=>{
    if(!c) return false;
    const m=!q||(c.name||'').toLowerCase().includes(q)||(c.phone||'').includes(q)||(c.cnic||'').includes(q)||(c.mobile?.model||'').toLowerCase().includes(q)||(c.mobile?.imei||'').toLowerCase().includes(q);
    const s=cFilter==='all'||c.status===cFilter;
    return m&&s;
  });
  if(!list.length){ el.innerHTML='<div class="empty"><div class="empty-ico"><i class="fa-solid fa-users"></i></div><p>کوئی نتیجہ نہیں ملا</p></div>'; return; }
  el.innerHTML=list.map(c=>{
    if(!Array.isArray(c.payments)) c.payments=[];
    if(!c.mobile) c.mobile={};
    const paid=c.payments.reduce((s,p)=>s+(p.amount||0),0);
    const rem=Math.max(0,(c.mobile?.remaining||0)-paid);
    const totalRem = c.mobile?.remaining || c.mobile?.price || 1; // guard div/0
    const pct=Math.min(100,Math.round((paid/totalRem)*100));
    const sl=c.status==='done'?'مکمل <i class="fa-solid fa-circle-check"></i>':c.status==='late'?'تاخیر <i class="fa-solid fa-triangle-exclamation"></i>':'فعال 🟢';
    const sc=c.status==='done'?'bdone':c.status==='late'?'blate':'bact';
    return `<div class="ccard">
      <div class="ctop">
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="cavatar">${c.name.charAt(0)}</div>
          <div><div class="cname">${c.name} ${c.grNo?`<span class="gr-mini-badge"><i class="fa-solid fa-hashtag"></i>${_formatGr(c.grNo)}</span>`:''}</div><div class="cph"><i class="fa-solid fa-phone"></i> ${c.phone}</div></div>
        </div>
        <span class="cbadge ${sc}">${sl}</span>
      </div>
      <div class="cinfo">
        <div class="ii"><i class="fa-solid fa-mobile-screen-button"></i> <strong>${c.mobile.model}</strong></div>
        ${c.mobile.imei?`<div class="ii" style="font-size:11px;color:var(--t2)"><i class="fa-solid fa-hashtag"></i> سیریل نمبر: <strong>${c.mobile.imei}</strong></div>`:''}
        <div class="ii"><i class="fa-solid fa-money-bill"></i> <strong>Rs. ${fmt(c.mobile.total||c.mobile.price)}</strong></div>
        <div class="ii"><i class="fa-solid fa-credit-card"></i> ایڈوانس: <strong>Rs. ${fmt(c.mobile.advance)}</strong></div>
        <div class="ii"><i class="fa-solid fa-arrow-trend-up"></i> مارک اپ: <strong>${c.mobile.markup>0?'Rs. '+fmt(c.mobile.markup):'—'}</strong></div>
        <div class="ii"><i class="fa-solid fa-calendar-days"></i> ماہانہ: <strong>Rs. ${fmt(c.mobile.monthly)}</strong></div>
        <div class="ii"><i class="fa-solid fa-circle-check"></i> ادا: <strong style="color:var(--g2)">Rs. ${fmt(paid)}</strong></div>
        <div class="ii">⏳ باقی: <strong style="color:var(--r2)">Rs. ${fmt(rem)}</strong></div>
        <div class="ii"><i class="fa-solid fa-chart-simple"></i> مدت: <strong>${c.mobile.months} ماہ</strong></div>
      </div>
      <div class="pbar"><div class="pfill" style="width:${pct}%"></div></div>
      <div class="plbl"><span>${c.payments.length}/${c.mobile.months} اقساط</span><span>${pct}%</span></div>
      <div class="cacts">
        <button class="btn bp bsm" onclick="showDetail(${c.id})"><i class="fa-solid fa-clipboard"></i> تفصیل</button>
        <button class="btn bg bsm" onclick="editCustomer(${c.id})"><i class="fa-solid fa-pen"></i> ایڈٹ</button>
        <button class="btn bwa bsm" onclick="openMsg(${c.id},'wa')"><i class="fa-brands fa-whatsapp"></i> واٹس ایپ</button>
        <button class="btn bwa bsm" onclick="sendScheduleReminder(${c.id})"><i class="fa-solid fa-calendar-days"></i> شیڈول</button>
        <button class="btn ba bsm" onclick="openLedger(${c.id})"><i class="fa-solid fa-chart-simple"></i> لیجر</button>
        <button class="btn bg bsm" onclick="showAgreement(${c.id})"><i class="fa-solid fa-file-signature"></i> معاہدہ</button>
        <button class="btn br bsm" onclick="delCust(${c.id})"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>`;
  }).join('');
}

// ══════════════════════════════
//  DETAIL MODAL
// ══════════════════════════════
function showDetail(id){
  const c=customers.find(x=>x.id===id);
  if(!c) return;
  const paid=c.payments.reduce((s,p)=>s+p.amount,0);
  const rem=Math.max(0,c.mobile.remaining-paid);
  const pct=Math.min(100,Math.round((paid/c.mobile.remaining)*100));
  const ph=c.payments.length?[...c.payments].reverse().map(p=>`
    <div class="pitem">
      <div><div style="font-weight:600;">${fmtDT(p.date)}</div>${p.note?`<div class="pdate"><i class="fa-solid fa-note-sticky"></i> ${p.note}</div>`:''}</div>
      <span class="pamt">Rs. ${fmt(p.amount)}</span>
      <span class="pst spaid">ادا <i class="fa-solid fa-circle-check"></i></span>
    </div>`).join(''):'<div style="text-align:center;padding:16px;color:var(--t2);">ابھی کوئی ادائیگی نہیں</div>';

  document.getElementById('md-title').textContent=c.name+' — تفصیل';
  document.getElementById('mod-body').innerHTML=`
    <div class="rcpt">
      <div class="rcpt-hdr"><h2><i class="fa-solid fa-mobile-screen-button"></i> ${shopProfile.name}</h2><p>انسٹالمنٹ تفصیل</p></div>
      <hr class="rcpt-hr">
      <div class="rrow"><span><i class="fa-solid fa-user"></i> نام</span><strong>${c.name}</strong></div>
      <div class="rrow"><span><i class="fa-solid fa-phone"></i> نمبر</span><strong>${c.phone}</strong></div>
      ${c.cnic?`<div class="rrow"><span><i class="fa-solid fa-id-card"></i> CNIC</span><strong>${c.cnic}</strong></div>`:''}
      ${c.addr?`<div class="rrow"><span><i class="fa-solid fa-location-dot"></i> پتہ</span><strong>${c.addr}</strong></div>`:''}
      ${c.guarantor?.name?`<hr class="rcpt-hr"><div style="font-weight:700;margin-bottom:5px;"><i class="fa-solid fa-handshake"></i> ضامن</div>
      <div class="rrow"><span><i class="fa-solid fa-user-shield"></i></span><strong>${c.guarantor.name}</strong></div>
      <div class="rrow"><span><i class="fa-solid fa-phone"></i></span><strong>${c.guarantor.phone||'—'}</strong></div>
      ${c.guarantor.cnic?`<div class="rrow"><span><i class="fa-solid fa-id-card"></i></span><strong>${c.guarantor.cnic}</strong></div>`:''}`:``}
      <hr class="rcpt-hr">
      <div class="rrow"><span><i class="fa-solid fa-mobile-screen-button"></i> موبائل</span><strong>${c.mobile.model}</strong></div>
      <div class="rrow"><span><i class="fa-solid fa-money-bill"></i> اصل قیمت</span><strong>Rs. ${fmt(c.mobile.price)}</strong></div>
      ${c.mobile.markup>0?`<div class="rrow"><span><i class="fa-solid fa-arrow-trend-up"></i> مارک اپ</span><strong style="color:var(--a1)">Rs. ${fmt(c.mobile.markup)}</strong></div>`:''}
      <div class="rrow"><span><i class="fa-solid fa-money-bill"></i> کل قیمت</span><strong>Rs. ${fmt(c.mobile.total||c.mobile.price)}</strong></div>
      <div class="rrow"><span><i class="fa-solid fa-credit-card"></i> ایڈوانس</span><strong>Rs. ${fmt(c.mobile.advance)}</strong></div>
      <div class="rrow total"><span><i class="fa-solid fa-sack-dollar"></i> ماہانہ قسط</span><strong>Rs. ${fmt(c.mobile.monthly)}</strong></div>
      <hr class="rcpt-hr">
      <div class="rrow"><span><i class="fa-solid fa-circle-check"></i> ادا شدہ</span><strong style="color:var(--g2)">Rs. ${fmt(paid)}</strong></div>
      <div class="rrow"><span>⏳ باقی</span><strong style="color:var(--r2)">Rs. ${fmt(rem)}</strong></div>
      <div class="pbar" style="margin:10px 0;"><div class="pfill" style="width:${pct}%"></div></div>
    </div>
    <div class="sdiv" style="margin:14px 0 10px;"><span><i class="fa-solid fa-scroll"></i> ادائیگی تاریخ</span></div>
    <div>${ph}</div>
    <div class="bgrp" style="margin-top:14px;">
      <button class="btn bp bsm" onclick="closeMod('mod-detail');editCustomer(${c.id})"><i class="fa-solid fa-pen"></i> ایڈٹ</button>
      <button class="btn ba bsm" onclick="closeMod('mod-detail');openLedger(${c.id})"><i class="fa-solid fa-chart-simple"></i> لیجر</button>
      <button class="btn bwa bsm" onclick="closeMod('mod-detail');openMsg(${c.id},'wa')"><i class="fa-brands fa-whatsapp"></i> واٹس ایپ</button>
      <button class="btn bmail bsm" onclick="closeMod('mod-detail');openMsg(${c.id},'mail')"><i class="fa-solid fa-envelope"></i> میل</button>
      <button class="btn bg bsm" onclick="closeMod('mod-detail');showAgreement(${c.id})"><i class="fa-solid fa-file-signature"></i> معاہدہ</button>
    </div>`;
  openMod('mod-detail');
}

// ══════════════════════════════
//  LEDGER
// ══════════════════════════════
function openLedger(id){
  const c=customers.find(x=>x.id===id);
  if(!c) return;
  ledCust=c;
  document.getElementById('led-title').innerHTML='<i class="fa-solid fa-chart-column"></i> '+c.name+(c.grNo?` <span class="gr-mini-badge"><i class="fa-solid fa-hashtag"></i>${_formatGr(c.grNo)}</span>`:'')+' — ماہانہ لیجر';

  const paid=c.payments.reduce((s,p)=>s+p.amount,0);
  const rem=Math.max(0,c.mobile.remaining-paid);

  // Build monthly schedule
  let rows='';
  let cumPaid=c.mobile.advance;
  const startD=new Date(c.mobile.startDate||new Date());

  for(let i=1;i<=c.mobile.months;i++){
    const d=new Date(startD);
    d.setMonth(d.getMonth()+i);
    d.setDate(c.mobile.dueDay||10);
    const payForMonth=c.payments[i-1];
    const status=payForMonth?'<span class="pst spaid">ادا <i class="fa-solid fa-circle-check"></i></span>':'<span class="pst sdue">باقی ⏳</span>';
    const payAmt=payForMonth?'Rs. '+fmt(payForMonth.amount):'—';
    const balance=c.mobile.remaining - Math.min(c.mobile.monthly*i, c.mobile.remaining);
    rows+=`<tr>
      <td>${i}</td>
      <td>${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}</td>
      <td>Rs. ${fmt(c.mobile.monthly)}</td>
      <td>${payAmt}</td>
      <td>Rs. ${fmt(Math.max(0,balance))}</td>
      <td>${status}</td>
    </tr>`;
  }

  document.getElementById('ledger-body').innerHTML=`
    <div class="rcpt" style="margin-bottom:14px;">
      <div class="rcpt-hdr"><h2><i class="fa-solid fa-mobile-screen-button"></i> ${shopProfile.name}</h2><p>ماہانہ قسط لیجر — ${c.name}</p></div>
      <hr class="rcpt-hr">
      <div class="rrow"><span><i class="fa-solid fa-mobile-screen-button"></i> موبائل</span><strong>${c.mobile.model}</strong></div>
      <div class="rrow"><span><i class="fa-solid fa-money-bill"></i> کل قیمت</span><strong>Rs. ${fmt(c.mobile.total||c.mobile.price)}</strong></div>
      <div class="rrow"><span><i class="fa-solid fa-credit-card"></i> ایڈوانس</span><strong>Rs. ${fmt(c.mobile.advance)}</strong></div>
      <div class="rrow total"><span><i class="fa-solid fa-sack-dollar"></i> ماہانہ قسط</span><strong>Rs. ${fmt(c.mobile.monthly)}</strong></div>
    </div>
    <div style="overflow-x:auto;">
      <table class="ledger-table">
        <thead><tr><th>#</th><th>تاریخ</th><th>قسط</th><th>ادائیگی</th><th>بقایا</th><th>حال</th></tr></thead>
        <tbody>${rows}</tbody>
        <tr class="total"><td colspan="2">کل</td><td>Rs. ${fmt(c.mobile.remaining)}</td><td>Rs. ${fmt(paid)}</td><td>Rs. ${fmt(rem)}</td><td></td></tr>
      </table>
    </div>
    <div class="dua">🤲 جَزَاكَ اللَّهُ خَيْرًا فِي الدَّارَيْن 🌸<br>${shopProfile.name}</div>`;
  openMod('mod-ledger');
}

function buildLedgerText(){
  const c=ledCust; if(!c) return '';
  const paid=c.payments.reduce((s,p)=>s+p.amount,0);
  const rem=Math.max(0,c.mobile.remaining-paid);
  const startD=new Date(c.mobile.startDate||new Date());
  let rows=`\n${'─'.repeat(50)}\n#  تاریخ           قسط        ادائیگی   بقایا\n${'─'.repeat(50)}\n`;
  for(let i=1;i<=c.mobile.months;i++){
    const d=new Date(startD); d.setMonth(d.getMonth()+i); d.setDate(c.mobile.dueDay||10);
    const pf=c.payments[i-1];
    const balance=Math.max(0,c.mobile.remaining-c.mobile.monthly*i);
    const st=pf?'<i class="fa-solid fa-circle-check"></i>':'⏳';
    rows+=`${st} ${i}.  ${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}   Rs.${fmt(c.mobile.monthly)}   ${pf?'Rs.'+fmt(pf.amount):'باقی'}   Rs.${fmt(balance)}\n`;
  }
  return `<i class="fa-solid fa-mobile-screen-button"></i> *${shopProfile.name}*\n━━━━━━━━━━━━━━━━━\n*ماہانہ قسط لیجر*\n\n<i class="fa-solid fa-user"></i> *${c.name}*\n<i class="fa-solid fa-phone"></i> ${c.phone}\n<i class="fa-solid fa-mobile-screen-button"></i> ${c.mobile.model}\n<i class="fa-solid fa-money-bill"></i> کل قیمت: Rs. ${fmt(c.mobile.total||c.mobile.price)}\n<i class="fa-solid fa-credit-card"></i> ایڈوانس: Rs. ${fmt(c.mobile.advance)}\n<i class="fa-solid fa-sack-dollar"></i> ماہانہ قسط: Rs. ${fmt(c.mobile.monthly)}\n${rows}\n<i class="fa-solid fa-circle-check"></i> ادا شدہ: Rs. ${fmt(paid)}\n⏳ باقی: Rs. ${fmt(rem)}\n━━━━━━━━━━━━━━━━━\n🤲 جَزَاكَ اللَّهُ خَيْرًا فِي الدَّارَيْن 🌸\n${shopProfile.name}\n<i class="fa-solid fa-phone"></i> ${shopProfile.phone}`;
}
function sendLedgerWA(){ const c=ledCust;if(!c)return;const n=(c.wa||c.phone).replace(/[^0-9]/g,'');const intl=n.startsWith('0')?'92'+n.slice(1):n;window.open(`https://wa.me/${intl}?text=${encodeURIComponent(_cleanWaText(buildLedgerText()))}`,'_blank');closeMod('mod-ledger');}
function sendLedgerMail(){ const c=ledCust;if(!c||!c.email){showToast('<i class="fa-solid fa-triangle-exclamation"></i> ای میل نہیں','warn');return;}window.open(`mailto:${c.email}?subject=${encodeURIComponent(shopProfile.name + ' — قسط لیجر')}&body=${encodeURIComponent(_cleanWaText(buildLedgerText()))}`,'_blank');closeMod('mod-ledger');}
function copyLedger(){ navigator.clipboard.writeText(buildLedgerText()).then(()=>{showToast('<i class="fa-solid fa-clipboard"></i> لیجر کاپی ہو گیا!');closeMod('mod-ledger');}).catch(()=>showToast('<i class="fa-solid fa-triangle-exclamation"></i> کاپی نہیں ہو سکا','warn')); }

// ══════════════════════════════
//  MESSAGE
// ══════════════════════════════
function buildMsg(c){
  const now=new Date();
  const ds=now.toLocaleDateString('ur-PK',{year:'numeric',month:'long',day:'numeric'});
  const ts=now.toLocaleTimeString('ur-PK',{hour:'2-digit',minute:'2-digit'});
  const dy=['اتوار','سوموار','منگل','بدھ','جمعرات','جمعہ','ہفتہ'][now.getDay()];
  const paid=c.payments.reduce((s,p)=>s+p.amount,0);
  const rem=Math.max(0,c.mobile.remaining-paid);
  const last=c.payments.length?c.payments[c.payments.length-1]:null;
  return `🕌 *${shopProfile.name}*\n━━━━━━━━━━━━━━━━━\n\nالسلام علیکم *${c.name}* صاحب! 🌟\n\n<i class="fa-solid fa-mobile-screen-button"></i> *موبائل:* ${c.mobile.model}\n<i class="fa-solid fa-money-bill"></i> *کل قیمت:* Rs. ${fmt(c.mobile.total||c.mobile.price)}${c.mobile.markup>0?'\n<i class="fa-solid fa-arrow-trend-up"></i> *مارک اپ:* Rs. '+fmt(c.mobile.markup):''}\n<i class="fa-solid fa-credit-card"></i> *ایڈوانس:* Rs. ${fmt(c.mobile.advance)}\n<i class="fa-solid fa-sack-dollar"></i> *ماہانہ قسط:* Rs. ${fmt(c.mobile.monthly)}\n<i class="fa-solid fa-calendar-days"></i> *مدت:* ${c.mobile.months} ماہ\n\n━━━━━━━━━━━━━━━━━\n<i class="fa-solid fa-chart-simple"></i> *ادائیگی کی صورتحال*\n<i class="fa-solid fa-circle-check"></i> *ادا شدہ:* Rs. ${fmt(paid)} (${c.payments.length} قسطیں)\n⏳ *باقی رقم:* Rs. ${fmt(rem)}${last?'\n🕐 *آخری ادائیگی:* '+fmtDT(last.date):''}\n\n━━━━━━━━━━━━━━━━━\n<i class="fa-solid fa-calendar-days"></i> *تاریخ:* ${ds}\n⏰ *وقت:* ${ts} — ${dy}\n━━━━━━━━━━━━━━━━━\n*جَزَاكَ اللَّهُ خَيْرًا فِي الدَّارَيْن* 🤲\n${shopProfile.name} <i class="fa-solid fa-mobile-screen-button"></i>\n<i class="fa-solid fa-phone"></i> ${shopProfile.phone}`;
}
function openMsg(id,type){
  const c=customers.find(x=>x.id===id);if(!c)return;
  msgCust=c;
  document.getElementById('msg-title').innerHTML=type==='wa'?'<i class="fa-brands fa-whatsapp"></i> واٹس ایپ پیغام':'<i class="fa-solid fa-envelope"></i> ای میل پیغام';
  document.getElementById('msg-prev').textContent=buildMsg(c);
  openMod('mod-msg');
}
function sendWA(){if(!msgCust)return;const n=(msgCust.wa||msgCust.phone).replace(/[^0-9]/g,'');const i=n.startsWith('0')?'92'+n.slice(1):n;window.open(`https://wa.me/${i}?text=${encodeURIComponent(_cleanWaText(buildMsg(msgCust)))}`,'_blank');closeMod('mod-msg');}
function sendMail(){if(!msgCust)return;if(!msgCust.email){showToast('<i class="fa-solid fa-triangle-exclamation"></i> ای میل ایڈریس نہیں','warn');return;}window.open(`mailto:${msgCust.email}?subject=${encodeURIComponent(shopProfile.name + ' — قسط تفصیل')}&body=${encodeURIComponent(_cleanWaText(buildMsg(msgCust)))}`,'_blank');closeMod('mod-msg');}
function copyMsg(){if(!msgCust)return;navigator.clipboard.writeText(buildMsg(msgCust)).then(()=>{showToast('<i class="fa-solid fa-clipboard"></i> پیغام کاپی ہو گیا!');closeMod('mod-msg');}).catch(()=>showToast('<i class="fa-solid fa-triangle-exclamation"></i> کاپی نہیں ہو سکا','warn'));}

// ══════════════════════════════
//  PAYMENTS
// ══════════════════════════════
function popPaySel(){
  const sel=document.getElementById('pay-sel');
  if(!sel) return;
  const cur=sel.value;
  sel.innerHTML='<option value="">-- کسٹمر منتخب کریں --</option>';
  customers.filter(c=>c && c.status!=='done').forEach(c=>{
    const o=document.createElement('option');
    // Use String() explicitly so the option value always matches what
    // the <select> will hand back on change, regardless of whether the
    // id came from Date.now() locally or round-tripped through
    // JSON/Firebase as a number.
    o.value=String(c.id);
    o.textContent=`${c.name} — ${c.mobile?.model||'—'}`;
    sel.appendChild(o);
  });
  // Restore previous selection if it still exists in the fresh list,
  // otherwise fall back to blank instead of silently keeping a
  // dangling selection that no longer matches any customer.
  const stillExists = cur && Array.from(sel.options).some(o=>o.value===cur);
  sel.value = stillExists ? cur : '';
  loadPay();
}
function loadPay(){
  const sel=document.getElementById('pay-sel');
  const box=document.getElementById('pay-info');
  if(!sel || !box) return;
  const rawVal=sel.value;
  // Bulletproof match: compare as strings so it never matters whether
  // c.id is a number (Date.now()) or a string (e.g. after certain
  // Firebase/localStorage round-trips) — dashes-on-select bug fix.
  const c = rawVal ? customers.find(x=>String(x.id)===String(rawVal)) : null;
  if(!c){ box.style.display='none'; return; }
  box.style.display='block';
  const payments = Array.isArray(c.payments) ? c.payments : [];
  const mobile = c.mobile || {};
  const paid = payments.reduce((s,p)=>s+(p.amount||0),0);
  const rem = Math.max(0,(mobile.remaining||0)-paid);
  document.getElementById('pi-model').textContent = mobile.model || '—';
  document.getElementById('pi-mon').textContent = 'Rs. '+fmt(mobile.monthly||0);
  document.getElementById('pi-paid').textContent = 'Rs. '+fmt(paid);
  document.getElementById('pi-rem').textContent = 'Rs. '+fmt(rem);
  document.getElementById('pi-cnt').textContent = `${payments.length}/${mobile.months||0} اقساط`;
  document.getElementById('pay-amt').value = mobile.monthly || '';
  document.getElementById('pay-date').value = new Date().toISOString().split('T')[0];
  renderPayHist(c);
}
function renderPayHist(c){
  const el=document.getElementById('pay-hist');
  el.innerHTML=c.payments.length?[...c.payments].reverse().map(p=>`
    <div class="pitem">
      <div><div style="font-weight:600;">${fmtDT(p.date)}</div>${p.note?`<div class="pdate"><i class="fa-solid fa-note-sticky"></i> ${p.note}</div>`:''}</div>
      <span class="pamt">Rs. ${fmt(p.amount)}</span>
      <span class="pst spaid">ادا <i class="fa-solid fa-circle-check"></i></span>
    </div>`).join(''):'<div style="text-align:center;padding:14px;color:var(--t2);">ابھی کوئی ادائیگی نہیں</div>';
}
// ══════════════════════════════
//  DASHBOARD
// ══════════════════════════════
function renderDash(){
  // Guard: elements may not exist yet on first call
  const dC = document.getElementById('d-c');
  const dA = document.getElementById('d-a');
  const dR = document.getElementById('d-r');
  const dP = document.getElementById('d-p');
  const hC = document.getElementById('hdr-c');
  const hA = document.getElementById('hdr-a');
  if(!dC) return; // DOM not ready yet

  // Sanitize customers array to prevent crashes on uninitialized objects
  if(Array.isArray(customers)){
    customers.forEach(c => {
      if(c){
        if(!Array.isArray(c.payments)) c.payments = [];
        if(!c.mobile) c.mobile = {};
      }
    });
  } else {
    customers = [];
  }

  const validCustomers = customers.filter(c => c && typeof c === 'object');
  const tot = validCustomers.length;
  const act = validCustomers.filter(c => c.status === 'active').length;
  const allPaid = validCustomers.reduce((s, c) => s + (Array.isArray(c.payments) ? c.payments.reduce((ss, p) => ss + (p.amount || 0), 0) : 0), 0);
  const allRem = validCustomers.reduce((s, c) => {
    const p = Array.isArray(c.payments) ? c.payments.reduce((ss, x) => ss + (x.amount || 0), 0) : 0;
    const remaining = (c.mobile && c.mobile.remaining) ? c.mobile.remaining : 0;
    return s + Math.max(0, remaining - p);
  }, 0);

  dC.textContent = tot;
  dA.textContent = act;
  dR.textContent = allPaid >= 1000 ? Math.round(allPaid / 1000) + 'K' : '₨' + fmt(allPaid);
  dP.textContent = allRem >= 1000 ? Math.round(allRem / 1000) + 'K' : '₨' + fmt(allRem);
  if(hC) hC.textContent = tot;
  if(hA) hA.textContent = act;

  renderPlanSummary();

  const allP = [];
  validCustomers.forEach(c => {
    if(Array.isArray(c.payments)){
      c.payments.forEach(p => {
        if(p) allP.push({ ...p, cn: c.name || '', cm: c.mobile?.model || '' });
      });
    }
  });
  allP.sort((a, b) => new Date(b.time || b.date) - new Date(a.time || a.date));
  const rEl = document.getElementById('d-recent');
  if(rEl){
    rEl.innerHTML = allP.slice(0, 5).length ? allP.slice(0, 5).map(p => `
      <div class="pitem">
        <div><div style="font-weight:600;">${p.cn}</div><div class="pdate">${p.cm} — ${fmtDT(p.date)}</div></div>
        <span class="pamt">Rs. ${fmt(p.amount)}</span>
      </div>`).join('') : '<div class="empty"><div class="empty-ico"><i class="fa-solid fa-chart-simple"></i></div><p>ابھی کوئی ریکارڈ نہیں</p></div>';
  }

  const dEl = document.getElementById('d-due');
  if(dEl){
    const dueList = validCustomers.filter(c => c.status === 'active');
    dEl.innerHTML = dueList.length ? dueList.map(c => {
      const p = Array.isArray(c.payments) ? c.payments.reduce((s, x) => s + (x.amount || 0), 0) : 0;
      const r = Math.max(0, (c.mobile?.remaining || 0) - p);
      const left = (c.mobile?.months || 0) - (c.payments ? c.payments.length : 0);
      return `<div class="pitem"><div><div style="font-weight:600;">${c.name}</div><div class="pdate">${c.mobile?.model || ''} — ${left} قسطیں باقی</div></div><span class="pamt">Rs. ${fmt(r)}</span></div>`;
    }).join('') : '<div class="empty"><div class="empty-ico"><i class="fa-solid fa-circle-check"></i></div><p>سب ٹھیک ہے!</p></div>';
  }
}

// ══════════════════════════════
//  INSTALLMENT PLAN BREAKDOWN
//  "6 Months Plan: X Customers | 8 Months: Y | 10 Months: Z" etc,
//  built dynamically from whatever plan lengths actually exist among
//  active customer records — not hardcoded to 6/8/10.
// ══════════════════════════════
function renderPlanSummary(){
  const el = document.getElementById('d-plans-summary');
  if(!el) return;
  const active = customers.filter(c=>c && c.status!=='done' && c.mobile);
  if(!active.length){
    el.innerHTML = `<div class="empty"><p>${isUrdu?'ابھی کوئی کسٹمر نہیں':'No customers yet'}</p></div>`;
    return;
  }
  const counts = {};
  active.forEach(c=>{
    const m = c.mobile.months || 0;
    if(!m) return;
    counts[m] = (counts[m]||0) + 1;
  });
  const sortedMonths = Object.keys(counts).map(Number).sort((a,b)=>a-b);
  el.innerHTML = sortedMonths.map(m=>`
    <div class="plan-chip">
      <div class="pc-num">${counts[m]}</div>
      <div class="pc-lbl">${isUrdu?`${m} ماہ والے`:`${m}-Month Plan`}</div>
    </div>`).join('');
}

// ══════════════════════════════
//  HELPERS
// ══════════════════════════════
// ══════════════════════════════
//  WHATSAPP/SMS TEXT SANITIZER
//  Every reminder/ledger/receipt/contract message is built as plain text
//  for wa.me / SMS / email — but those builder strings embed FontAwesome
//  <i class="fa-..."></i> icon tags meant for on-screen HTML. Raw HTML
//  tags don't render on WhatsApp/SMS; they show up as literal broken
//  text, which is what created the "empty/blank column" look in real
//  messages. This converts every icon tag to a real Unicode emoji
//  right before the text leaves the app.
// ══════════════════════════════
const _ICON_EMOJI_MAP = {
  'fa-mobile-screen-button':'📱','fa-money-bill':'💵','fa-credit-card':'💳','fa-sack-dollar':'💰',
  'fa-calendar-days':'📅','fa-chart-simple':'📊','fa-circle-check':'✅','fa-user':'👤','fa-phone':'📞',
  'fa-arrow-trend-up':'📈','fa-handshake':'🤝','fa-triangle-exclamation':'⚠️','fa-clipboard':'📋',
  'fa-note-sticky':'📝','fa-envelope':'📧','fa-hashtag':'#️⃣','fa-id-card':'🪪','fa-location-dot':'📍',
  'fa-file-signature':'✍️','fa-key':'🔑','fa-scroll':'📜','fa-whatsapp':'💬'
};
function _cleanWaText(txt){
  return (txt||'').replace(/<i class="fa-(?:solid|brands) (fa-[a-z0-9-]+)"><\/i>/g,
    (m, cls) => _ICON_EMOJI_MAP[cls] || '');
}

function fmt(n){ return Math.round(n||0).toLocaleString('ur-PK'); }
function fmtDT(ds){
  if(!ds)return'—';
  const d=new Date(ds);
  const days=['اتوار','سوموار','منگل','بدھ','جمعرات','جمعہ','ہفتہ'];
  return `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()} — ${days[d.getDay()]}`;
}
function openMod(id){ document.getElementById(id).classList.add('open'); _navOpenModal(id); }
function closeMod(id){ document.getElementById(id).classList.remove('open'); _navCloseModal(id); }

// ══════════════════════════════════════════════════════════════
//  ANDROID BACK-BUTTON NAVIGATION MANAGER
// ──────────────────────────────────────────────────────────────
//  Fixes: pressing the phone's hardware back button used to exit the
//  whole app immediately, even while deep inside a tab or a detail
//  modal (e.g. a customer's installment history). Instead we now:
//    • 1 back press closes an open modal and reveals whatever was
//      underneath it (e.g. the customer list)
//    • 1 back press from any bottom-nav tab returns to the Dashboard
//    • only pressing back while already ON the Dashboard with nothing
//      open is allowed to actually exit the app
//  This works by keeping a matching browser history entry pushed for
//  every "sub view" we enter, so the hardware back button (which
//  Android WebViews translate into history.back()) has somewhere to
//  land other than closing the activity.
// ══════════════════════════════════════════════════════════════
let currentView = 'dash';         // active bottom-nav screen
let _openModalStack = [];         // ids of currently open modals, top = last
let _navSelfBack = false;         // true while WE are the ones calling history.back()

// Tabs are siblings: switching between them should not pile up history,
// so we replace the current sub-view entry unless we're at the root.
function _navGoScreen(n){
  currentView = n;
  if(n === 'dash'){
    _openModalStack = [];
    try{ history.replaceState({sms:true,view:'root'}, '', '#dash'); }catch(e){}
    return;
  }
  if(history.state && history.state.sms && history.state.view !== 'root'){
    try{ history.replaceState({sms:true,view:'screen:'+n}, '', '#'+n); }catch(e){}
  } else {
    try{ history.pushState({sms:true,view:'screen:'+n}, '', '#'+n); }catch(e){}
  }
}

// Modals sit ON TOP of whatever screen/modal is currently showing, so
// they always get their own extra history entry (never replaced).
function _navOpenModal(id){
  _openModalStack.push(id);
  try{ history.pushState({sms:true,view:'modal:'+id}, '', '#'+id); }catch(e){}
}

// Closing a modal via its own ✕ button (not the hardware back button):
// keep our stack in sync and unwind exactly one history entry ourselves.
function _navCloseModal(id){
  const idx = _openModalStack.lastIndexOf(id);
  if(idx === _openModalStack.length - 1){
    _openModalStack.pop();
    _navSelfBack = true;
    history.back();
  }
}

window.addEventListener('popstate', function(){
  if(_navSelfBack){ _navSelfBack = false; return; }

  if(_openModalStack.length){
    const top = _openModalStack.pop();
    const el = document.getElementById(top);
    if(el) el.classList.remove('open');
    return; // stay on the current screen underneath — e.g. the customer list
  }

  if(currentView !== 'dash'){
    showSc('dash');
    return;
  }

  // Already at the Dashboard root with nothing open: this genuinely IS
  // "home", so we do nothing further and let the Android WebView's own
  // back-button handling proceed (which safely exits the app here).
});

// Cordova-wrapped APKs fire a 'backbutton' event (via cordova.js) instead
// of / in addition to popstate — hook it too so both wrapping styles work.
document.addEventListener('deviceready', function(){
  if(window.cordova){
    document.addEventListener('backbutton', function(e){
      if(_openModalStack.length || currentView !== 'dash'){
        e.preventDefault();
        history.back();
      } else if(navigator.app && navigator.app.exitApp){
        navigator.app.exitApp();
      }
    }, false);
  }
}, false);

function _navInit(){
  // Establish the Dashboard as the root history entry (replace, not
  // push, so there is nothing further back than this to accidentally
  // land on).
  try{ history.replaceState({sms:true,view:'root'}, '', '#dash'); }catch(e){}
}
async function swalConfirm(title, text='', icon='question', confirmButtonText='جی ہاں', cancelButtonText='منسوخ کریں'){
  if(typeof Swal === 'undefined') return confirm(title + (text ? '\n' + text : ''));
  const res = await Swal.fire({
    title: title,
    html: text,
    icon: icon,
    showCancelButton: true,
    confirmButtonColor: '#1565C0',
    cancelButtonColor: '#d33',
    confirmButtonText: confirmButtonText,
    cancelButtonText: cancelButtonText,
    background: 'var(--card, #fff)',
    color: 'var(--t1, #0D1B4B)'
  });
  return res.isConfirmed;
}

async function delCust(id){
  const c = customers.find(x=>x.id===id); if(!c) return;
  const ok = await swalConfirm(`کیا آپ واقعی "${c.name}" کو حذف کرنا چاہتے ہیں؟`, 'یہ کسٹمر اور اس کا تمام ہسٹری ریکارڈ مٹ جائے گا!', 'warning', 'جی ہاں، حذف کریں', 'منسوخ کریں');
  if(!ok) return;
  customers = customers.filter(x=>x.id!==id);
  save(); renderCustomers(); renderDash();
  showToast('<i class="fa-solid fa-trash"></i> حذف ہو گیا', 'warn');
}

function showToast(msg, t=''){
  if(typeof Swal !== 'undefined'){
    const iconMap = { warn: 'warning', error: 'error', success: 'success', info: 'info' };
    const icon = iconMap[t] || (msg.includes('خوش آمدید') || msg.includes('مکمل') || msg.includes('جمع') || msg.includes('بچت') || msg.includes('لود') ? 'success' : (msg.includes('حذف') || msg.includes('وارننگ') || msg.includes('غلط') || msg.includes('مسئلہ') ? 'warning' : 'info'));
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });
    Toast.fire({ icon: icon, html: msg });
  } else {
    const el = document.getElementById('toast');
    if(!el) return;
    el.innerHTML = msg; el.className = 'toast' + (t ? ' ' + t : '');
    el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 2800);
  }
}

// ══════════════════════════════
//  GRAPH
// ══════════════════════════════
function renderGraphs(){
  renderMonthlyChart();
  renderStatusChart();
  renderTrendChart();
}

function renderMonthlyChart(){
  const canvas=document.getElementById('chart-monthly');
  const ctx=canvas.getContext('2d');
  canvas.width=canvas.parentElement.offsetWidth||340;
  const W=canvas.width,H=220;
  ctx.clearRect(0,0,W,H);

  // collect per-customer paid vs remaining
  const labels=[],paid=[],remaining=[];
  customers.slice(0,8).forEach(c=>{
    const p=c.payments.reduce((s,x)=>s+x.amount,0);
    const r=Math.max(0,c.mobile.remaining-p);
    labels.push(c.name.length>6?c.name.slice(0,6)+'…':c.name);
    paid.push(p);remaining.push(r);
  });

  if(!labels.length){ctx.fillStyle='#90A4AE';ctx.font='13px Poppins';ctx.textAlign='center';ctx.fillText('کوئی ریکارڈ نہیں',W/2,H/2);return;}

  const maxV=Math.max(...paid,...remaining,1);
  const pad={l:10,r:10,t:20,b:50};
  const bW=Math.floor((W-pad.l-pad.r)/labels.length);
  const bGap=4,bW2=Math.floor((bW-bGap*3)/2);
  const chartH=H-pad.t-pad.b;

  // grid
  ctx.strokeStyle='rgba(187,222,251,0.5)';ctx.lineWidth=1;
  for(let i=0;i<=4;i++){const y=pad.t+chartH*(i/4);ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(W-pad.r,y);ctx.stroke();}

  labels.forEach((lbl,i)=>{
    const x=pad.l+i*bW+bGap;
    // paid bar
    const ph=Math.round(paid[i]/maxV*chartH);
    const pg=ctx.createLinearGradient(0,pad.t+chartH-ph,0,pad.t+chartH);
    pg.addColorStop(0,'#0F52BA');pg.addColorStop(1,'#5B8DEF');
    ctx.fillStyle=pg;
    ctx.beginPath();roundRect(ctx,x,pad.t+chartH-ph,bW2,ph,4);ctx.fill();
    // remaining bar
    const rh=Math.round(remaining[i]/maxV*chartH);
    const rg=ctx.createLinearGradient(0,pad.t+chartH-rh,0,pad.t+chartH);
    rg.addColorStop(0,'#FF5500');rg.addColorStop(1,'#FF9E5E');
    ctx.fillStyle=rg;
    ctx.beginPath();roundRect(ctx,x+bW2+bGap,pad.t+chartH-rh,bW2,rh,4);ctx.fill();
    // label
    ctx.fillStyle='#546E7A';ctx.font='9px Poppins';ctx.textAlign='center';
    ctx.fillText(lbl,x+bW2,H-pad.b+14);
  });
}

function roundRect(ctx,x,y,w,h,r){
  if(h<r)r=h;
  ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h);ctx.lineTo(x,y+h);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);
}

function renderStatusChart(){
  const canvas=document.getElementById('chart-status');
  const ctx=canvas.getContext('2d');
  const W=220,H=220;
  ctx.clearRect(0,0,W,H);
  const act=customers.filter(c=>c.status==='active').length;
  const done=customers.filter(c=>c.status==='done').length;
  const tot=customers.length||1;
  const slices=[
    {val:act,color:'#0F52BA',label:'فعال'},
    {val:done,color:'#43A047',label:'مکمل'},
    {val:Math.max(0,tot-act-done),color:'#FF6F00',label:'دیگر'}
  ].filter(s=>s.val>0);
  let start=- Math.PI/2;
  slices.forEach(s=>{
    const angle=(s.val/tot)*2*Math.PI;
    ctx.beginPath();ctx.moveTo(110,110);ctx.arc(110,110,95,start,start+angle);ctx.closePath();
    ctx.fillStyle=s.color;ctx.fill();
    ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.stroke();
    start+=angle;
  });
  // center circle
  ctx.beginPath();ctx.arc(110,110,55,0,2*Math.PI);
  const cg=ctx.createRadialGradient(110,110,0,110,110,55);
  cg.addColorStop(0,'#fff');cg.addColorStop(1,'#F0F6FF');
  ctx.fillStyle=cg;ctx.fill();
  ctx.fillStyle='#0D47A1';ctx.font='bold 22px Poppins';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(tot,110,104);
  ctx.fillStyle='#546E7A';ctx.font='11px Poppins';ctx.fillText('کل',110,122);

  // legend
  const leg=document.getElementById('status-legend');
  leg.innerHTML=slices.map(s=>`<div class="leg-item"><div class="leg-dot" style="background:${s.color}"></div>${s.label}: ${s.val}</div>`).join('');
}

function renderTrendChart(){
  const canvas=document.getElementById('chart-trend');
  const ctx=canvas.getContext('2d');
  canvas.width=canvas.parentElement.offsetWidth||340;
  const W=canvas.width,H=200;
  ctx.clearRect(0,0,W,H);

  const now=new Date();
  const months=[];
  for(let i=5;i>=0;i--){
    const d=new Date(now.getFullYear(),now.getMonth()-i,1);
    months.push({key:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`,label:`${d.getMonth()+1}/${d.getFullYear().toString().slice(2)}`});
  }
  const vals=months.map(m=>{
    let s=0;
    customers.forEach(c=>c.payments.forEach(p=>{if(p.date&&p.date.startsWith(m.key))s+=p.amount;}));
    return s;
  });
  const maxV=Math.max(...vals,1);
  const pad={l:10,r:10,t:20,b:40};
  const chartH=H-pad.t-pad.b;
  const xStep=(W-pad.l-pad.r)/(months.length-1);

  // grid
  ctx.strokeStyle='rgba(187,222,251,0.5)';ctx.lineWidth=1;
  for(let i=0;i<=4;i++){const y=pad.t+chartH*(i/4);ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(W-pad.r,y);ctx.stroke();}

  // area
  const pts=vals.map((v,i)=>({x:pad.l+i*xStep,y:pad.t+chartH*(1-v/maxV)}));
  const grad=ctx.createLinearGradient(0,pad.t,0,pad.t+chartH);
  grad.addColorStop(0,'rgba(30,136,229,0.35)');grad.addColorStop(1,'rgba(30,136,229,0)');
  ctx.beginPath();ctx.moveTo(pts[0].x,pad.t+chartH);
  pts.forEach(p=>ctx.lineTo(p.x,p.y));
  ctx.lineTo(pts[pts.length-1].x,pad.t+chartH);ctx.closePath();
  ctx.fillStyle=grad;ctx.fill();

  // line
  ctx.beginPath();pts.forEach((p,i)=>i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y));
  ctx.strokeStyle='#1E88E5';ctx.lineWidth=2.5;ctx.stroke();

  // dots
  pts.forEach((p,i)=>{
    ctx.beginPath();ctx.arc(p.x,p.y,5,0,2*Math.PI);
    ctx.fillStyle='#fff';ctx.fill();
    ctx.strokeStyle='#1E88E5';ctx.lineWidth=2.5;ctx.stroke();
    ctx.fillStyle='#546E7A';ctx.font='9px Poppins';ctx.textAlign='center';
    ctx.fillText(months[i].label,p.x,H-pad.b+14);
    if(vals[i]>0){ctx.fillStyle='#0D47A1';ctx.font='bold 9px Poppins';ctx.fillText(vals[i]>=1000?Math.round(vals[i]/1000)+'K':vals[i],p.x,p.y-10);}
  });
}

// ══════════════════════════════
//  INSTALLMENT CALCULATOR
// ══════════════════════════════
function calcIC(){
  const price=parseFloat(document.getElementById('ic-price').value)||0;
  const adv=parseFloat(document.getElementById('ic-adv-amt').value)||0;
  const markupPct=parseFloat(document.getElementById('ic-markup').value)||0;
  const months=parseInt(document.getElementById('ic-months').value)||0;
  if(!price||!months){document.getElementById('ic-result').style.display='none';return;}
  const markup=Math.round(price*markupPct/100);
  const total=price+markup;
  const installmentBase=total-adv;
  const monthly=Math.round(installmentBase/months);
  const totalPayable=adv+monthly*months;
  const advPct=price>0?Math.round(adv/price*100):0;

  // markup amount = price * markupPct / 100
  const markupAmt = markup; // already computed above
  // total minus advance (what customer still owes after advance)
  const totalMinusAdv = total - adv;

  document.getElementById('ic-result').style.display='block';
  document.getElementById('ic-markup-amt').textContent='Rs. '+fmt(markupAmt);
  document.getElementById('ic-pct-lbl').textContent=markupPct;
  document.getElementById('ic-adv-show').textContent='Rs. '+fmt(adv);
  document.getElementById('ic-total-minus-adv').textContent='Rs. '+fmt(totalMinusAdv);
  document.getElementById('ic-monthly').textContent='Rs. '+fmt(monthly);

  document.getElementById('ic-tbody').innerHTML=`
    <tr>
      <td>Rs. ${fmt(price)}</td>
      <td>Rs. ${fmt(adv)}</td>
      <td>${markupPct}%<br><small style="color:var(--a1)">Rs.${fmt(markupAmt)}</small></td>
      <td>Rs. ${fmt(installmentBase)}</td>
      <td>${months}</td>
      <td><strong>Rs. ${fmt(total)}</strong></td>
      <td class="ic-big">Rs. ${fmt(totalMinusAdv)}</td>
      <td class="ic-big">Rs. ${fmt(monthly)}</td>
    </tr>`;
}

// ══════════════════════════════
//  PASSWORD CHANGE (from inside the app, while logged in)
// ══════════════════════════════
async function changePassword(){
  if(!_fbAuth || !_fbAuth.currentUser){ showToast('<i class="fa-solid fa-triangle-exclamation"></i> پہلے لاگ ان کریں', 'warn'); return; }
  const cur = prompt('موجودہ پاس ورڈ درج کریں:');
  if(cur===null) return;
  const np = prompt('نیا پاس ورڈ (کم از کم 6 حروف):');
  if(!np || np.length < 6){ alert('پاس ورڈ کم از کم 6 حروف کا ہونا چاہیے!'); return; }

  try{
    const user = _fbAuth.currentUser;
    const cred = firebase.auth.EmailAuthProvider.credential(user.email, cur);
    await user.reauthenticateWithCredential(cred);
    await user.updatePassword(np);
    showToast('<i class="fa-solid fa-circle-check"></i> پاس ورڈ تبدیل ہو گیا!');
  } catch(e){
    alert('Error: ' + _stripHtml(_friendlyAuthError(e)));
  }
}

// ══════════════════════════════
//  RECEIPT PRINT
// ══════════════════════════════
let lastReceiptData=null;
function showReceipt(custId, payObj){
  const c=customers.find(x=>x.id===custId);
  if(!c)return;
  const paid=c.payments.reduce((s,p)=>s+p.amount,0);
  const rem=Math.max(0,c.mobile.remaining-paid);
  const now=new Date();
  const dateStr=`${now.getDate()}/${now.getMonth()+1}/${now.getFullYear()}`;
  const html=`
  <div class="rcpt-print" id="receipt-content">
    <div class="rcpt-print-hdr">
      <h2><i class="fa-solid fa-mobile-screen-button"></i> ${shopProfile.name}</h2>
      <p><i class="fa-solid fa-phone"></i> ${shopProfile.phone}${shopProfile.email?' | '+shopProfile.email:''}</p>
      ${shopProfile.address?`<p>📍 ${shopProfile.address}</p>`:''}
      <p>قسط رسید | ${dateStr}</p>
    </div>
    <div class="rcpt-rrow"><span><i class="fa-solid fa-user"></i> نام</span><strong>${c.name}</strong></div>
    <div class="rcpt-rrow"><span><i class="fa-solid fa-phone"></i> نمبر</span><strong>${c.phone}</strong></div>
    <div class="rcpt-rrow"><span><i class="fa-solid fa-mobile-screen-button"></i> موبائل</span><strong>${c.mobile.model}</strong></div>
    ${c.cnic?`<div class="rcpt-rrow"><span><i class="fa-solid fa-id-card"></i> CNIC</span><strong>${c.cnic}</strong></div>`:''}
    <div class="rcpt-rrow"><span><i class="fa-solid fa-money-bill"></i> کل قیمت</span><strong>Rs. ${fmt(c.mobile.total||c.mobile.price)}</strong></div>
    <div class="rcpt-rrow"><span><i class="fa-solid fa-credit-card"></i> ایڈوانس</span><strong>Rs. ${fmt(c.mobile.advance)}</strong></div>
    <div class="rcpt-rrow"><span><i class="fa-solid fa-calendar-days"></i> اقساط</span><strong>${c.payments.length}/${c.mobile.months} ماہ</strong></div>
    <div class="rcpt-rrow big"><span><i class="fa-solid fa-circle-check"></i> ادا شدہ (آج)</span><strong>Rs. ${fmt(payObj?payObj.amount:0)}</strong></div>
    <div class="rcpt-rrow"><span><i class="fa-solid fa-circle-check"></i> کل ادا شدہ</span><strong style="color:green">Rs. ${fmt(paid)}</strong></div>
    <div class="rcpt-rrow"><span>⏳ باقی رقم</span><strong style="color:red">Rs. ${fmt(rem)}</strong></div>
    <div class="rcpt-footer">
      شکریہ! آپ کا اعتماد ہماری پہچان ہے <i class="fa-solid fa-handshake"></i><br>
      ${shopProfile.name}
    </div>
  </div>`;
  document.getElementById('receipt-body').innerHTML=html;
  lastReceiptData={c,payObj,paid,rem,dateStr};
  openMod('mod-receipt');
}
function printReceipt(){
  const content=document.getElementById('receipt-content');
  if(!content)return;
  let pa=document.getElementById('print-area');
  if(!pa){pa=document.createElement('div');pa.id='print-area';document.body.appendChild(pa);}
  pa.innerHTML=content.outerHTML;
  window.print();
}
function shareReceipt(){
  if(!lastReceiptData)return;
  const {c,payObj,paid,rem,dateStr}=lastReceiptData;
  const txt=`🧾 *${shopProfile.name} — رسید*\n<i class="fa-solid fa-calendar-days"></i> ${dateStr}\n\n<i class="fa-solid fa-user"></i> نام: ${c.name}\n<i class="fa-solid fa-mobile-screen-button"></i> موبائل: ${c.mobile.model}\n<i class="fa-solid fa-circle-check"></i> آج ادا: Rs. ${fmt(payObj?payObj.amount:0)}\n<i class="fa-solid fa-circle-check"></i> کل ادا: Rs. ${fmt(paid)}\n⏳ باقی: Rs. ${fmt(rem)}\n\n<i class="fa-solid fa-phone"></i> ${shopProfile.phone}`;
  const n=(c.wa||c.phone).replace(/[^0-9]/g,'');
  const i=n.startsWith('0')?'92'+n.slice(1):n;
  window.open(`https://wa.me/${i}?text=${encodeURIComponent(_cleanWaText(txt))}`,'_blank');
}

// ══════════════════════════════
//  LEGACY STOCK DATA (kept for backward Firebase/backup compatibility
//  only — the Stock tab UI has been removed and replaced by Reminders)
// ══════════════════════════════
let stock=JSON.parse(localStorage.getItem('sms_stock')||'[]');

// ══════════════════════════════
//  REMINDER TEMPLATES (یاددہانی)
//  Editable WhatsApp reminder/collection message templates.
//  Placeholders are filled in automatically when a reminder is sent.
// ══════════════════════════════
const DEFAULT_REMINDER_TEMPLATES = {
  general: 'السلام علیکم {name} صاحب! 🌸\n\n{shopName} کی طرف سے یاددہانی:\n\n<i class="fa-solid fa-mobile-screen-button"></i> موبائل: {model}\n<i class="fa-solid fa-sack-dollar"></i> ماہانہ قسط: Rs. {monthly}\n⏳ باقی رقم: Rs. {remaining}\n\n{lateInfo}\n\n<i class="fa-solid fa-phone"></i> {shopName}: {phone}\nجَزَاكَ اللَّهُ خَيْرًا <i class="fa-solid fa-handshake"></i>',
  schedule: 'السلام علیکم {name} صاحب! 🌸\n\n<i class="fa-solid fa-mobile-screen-button"></i> *{model}* قسط شیڈول:\n\n{schedule}\n<i class="fa-solid fa-sack-dollar"></i> ماہانہ قسط: Rs.{monthly}\n<i class="fa-solid fa-phone"></i> {shopName}: {phone}\nجَزَاكَ اللَّهُ خَيْرًا <i class="fa-solid fa-handshake"></i>'
};

let reminderTemplates = JSON.parse(localStorage.getItem('sms_reminder_templates') || 'null') || { ...DEFAULT_REMINDER_TEMPLATES };

function _persistReminderTemplates(){
  localStorage.setItem('sms_reminder_templates', JSON.stringify(reminderTemplates));
}

// Fills {placeholder} tokens in a template with the given values.
function _fillTemplate(tpl, vars){
  return (tpl || '').replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
}

function renderReminders(){
  const g = document.getElementById('rt-general');
  const s = document.getElementById('rt-schedule');
  if(g) g.value = reminderTemplates.general;
  if(s) s.value = reminderTemplates.schedule;
  renderTermsConditionsUI();
}

function saveReminderTemplates(){
  reminderTemplates.general  = document.getElementById('rt-general').value || DEFAULT_REMINDER_TEMPLATES.general;
  reminderTemplates.schedule = document.getElementById('rt-schedule').value || DEFAULT_REMINDER_TEMPLATES.schedule;
  _persistReminderTemplates();
  showToast('<i class="fa-solid fa-circle-check"></i> یاددہانی ٹیمپلیٹس محفوظ ہو گئے!');
}

function resetReminderTemplates(){
  if(!confirm('ٹیمپلیٹس ڈیفالٹ پر واپس لے جائیں؟')) return;
  reminderTemplates = { ...DEFAULT_REMINDER_TEMPLATES };
  _persistReminderTemplates();
  renderReminders();
  showToast('↺ ڈیفالٹ ٹیمپلیٹس بحال ہو گئے');
}

// ══════════════════════════════
//  TERMS & CONDITIONS (شرائط و ضوابط) — customizable, and can be
//  embedded automatically into every new contract / customer ledger.
// ══════════════════════════════
const DEFAULT_TERMS_CONDITIONS =
`۱۔ خریدار مقررہ تاریخ پر قسط ادا کرنے کا پابند ہے۔
۲۔ تاخیر کی صورت میں فریقین مل کر حل نکالیں گے۔
۳۔ جب تک مکمل ادائیگی نہ ہو موبائل دکاندار کی امانت ہے۔
۴۔ یہ معاہدہ دونوں فریقین کی رضامندی سے ہے۔`;

let termsConditions = localStorage.getItem('sms_terms_conditions') || DEFAULT_TERMS_CONDITIONS;
let tcEmbedEnabled   = localStorage.getItem('sms_tc_embed') !== '0'; // default ON

function renderTermsConditionsUI(){
  const t = document.getElementById('tc-text');
  if(t) t.value = termsConditions;
  const tog = document.getElementById('tc-embed-toggle');
  if(tog) tog.checked = tcEmbedEnabled;
}

function saveTermsConditions(){
  const val = (document.getElementById('tc-text').value || '').trim();
  termsConditions = val || DEFAULT_TERMS_CONDITIONS;
  localStorage.setItem('sms_terms_conditions', termsConditions);
  showToast('<i class="fa-solid fa-circle-check"></i> شرائط و ضوابط محفوظ ہو گئیں!');
}

function resetTermsConditions(){
  if(!confirm('شرائط ڈیفالٹ پر واپس لے جائیں؟')) return;
  termsConditions = DEFAULT_TERMS_CONDITIONS;
  localStorage.setItem('sms_terms_conditions', termsConditions);
  renderTermsConditionsUI();
  showToast('↺ ڈیفالٹ شرائط بحال ہو گئیں');
}

function saveTcEmbedSetting(checked){
  tcEmbedEnabled = checked;
  localStorage.setItem('sms_tc_embed', checked ? '1' : '0');
  showToast(checked ? '<i class="fa-solid fa-circle-check"></i> شرائط و ضوابط اب معاہدے میں شامل ہوں گی' : '🚫 شرائط و ضوابط شامل نہیں ہوں گی');
}

// ══════════════════════════════
//  LATE PAYMENT ALERTS
// ══════════════════════════════
function renderAlerts(){
  const today=new Date();today.setHours(0,0,0,0);
  const list=[];
  customers.filter(c=>c.status==='active').forEach(c=>{
    const paid=c.payments.reduce((s,p)=>s+p.amount,0);
    const rem=Math.max(0,c.mobile.remaining-paid);
    const paidCount=c.payments.length;
    const startD=new Date(c.mobile.startDate||new Date());
    // Next due date
    const nextDue=new Date(startD);
    nextDue.setMonth(nextDue.getMonth()+paidCount+1);
    nextDue.setDate(c.mobile.dueDay||10);
    const diffMs=today-nextDue;
    const diffDays=Math.floor(diffMs/(1000*60*60*24));
    list.push({c,rem,paidCount,nextDue,diffDays});
  });
  // Advanced Alerts rule: only surface a customer here once their due
  // date is 3 days away or less (or already overdue) — flagged as an
  // "Upcoming Due" / "Late Payment Alert" notice. Anything further out
  // doesn't need attention yet, so it's left off this list.
  const flagged = list.filter(x=>x.diffDays>=-3);
  flagged.sort((a,b)=>b.diffDays-a.diffDays);

  const overdue=flagged.filter(x=>x.diffDays>0).length;
  const dueToday=flagged.filter(x=>x.diffDays===0).length;
  const upcoming=flagged.filter(x=>x.diffDays<0&&x.diffDays>=-3).length;

  // Update badge
  const navAl=document.getElementById('nav-alerts');
  if(navAl){
    const badge=navAl.querySelector('.nlbl');
    badge.innerHTML=overdue>0?`الرٹس<span class="badge-count">${overdue}</span>`:'الرٹس';
  }

  const smry=document.getElementById('alerts-summary');
  smry.innerHTML=`
    <div class="sum-box"><div class="sv" style="color:#E53935">${overdue}</div><div class="sl">تاخیر</div></div>
    <div class="sum-box" style="border-left:1px solid var(--bd)"><div class="sv" style="color:#FF6F00">${dueToday}</div><div class="sl">آج واجب</div></div>
    <div class="sum-box" style="border-left:1px solid var(--bd)"><div class="sv" style="color:#43A047">${upcoming}</div><div class="sl">3 دن میں واجب</div></div>`;

  const el=document.getElementById('alerts-list');
  if(!flagged.length){el.innerHTML='<div class="card"><div class="cb"><div class="empty"><div class="empty-ico"><i class="fa-solid fa-circle-check"></i></div><p>سب ٹھیک ہے! کوئی لیٹ پیمنٹ یا قریبی واجب الادا قسط نہیں</p></div></div></div>';return;}
  el.innerHTML=flagged.map(({c,rem,paidCount,nextDue,diffDays})=>{
    const dd=nextDue.getDate()+'/'+(nextDue.getMonth()+1)+'/'+nextDue.getFullYear();
    const cls=diffDays>7?'alert-red':diffDays>0?'alert-yellow':'alert-green';
    const daytxt=diffDays>0?`${diffDays} دن تاخیر <i class="fa-solid fa-triangle-exclamation"></i> (Late Payment Alert)`:diffDays===0?'آج واجب الادا (Due Today)':`${Math.abs(diffDays)} دن میں واجب (Upcoming Due)`;
    const daycls=diffDays>0?'days-over':'days-ok';
    const left=c.mobile.months-paidCount;
    return `<div class="alert-card ${cls}">
      <div class="alert-top">
        <div>
          <div class="alert-name">${c.name}</div>
          <div style="font-size:11px;color:var(--t2)">${c.mobile.model} | <i class="fa-solid fa-phone"></i> ${c.phone}</div>
        </div>
        <span class="alert-days ${daycls}">${daytxt}</span>
      </div>
      <div class="alert-info">
        <div class="alert-ii">ماہانہ قسط<strong>Rs. ${fmt(c.mobile.monthly)}</strong></div>
        <div class="alert-ii">باقی رقم<strong style="color:var(--r2)">Rs. ${fmt(rem)}</strong></div>
        <div class="alert-ii">اگلی تاریخ<strong>${dd}</strong></div>
        <div class="alert-ii">باقی اقساط<strong>${left} ماہ</strong></div>
      </div>
      <div class="alert-acts">
        <button class="btn bwa bsm" onclick="alertWA(${c.id},${diffDays})"><i class="fa-brands fa-whatsapp"></i> یاددہانی</button>
        <button class="btn bp bsm" onclick="showSc('pay')"><i class="fa-solid fa-sack-dollar"></i> قسط جمع</button>
        <button class="btn ba bsm" onclick="showDetail(${c.id})"><i class="fa-solid fa-clipboard"></i> تفصیل</button>
      </div>
    </div>`;
  }).join('');
}
// ══════════════════════════════
//  REMINDER TEXT BUILDER — BULLETPROOF PLACEHOLDER FILLING
//  Always re-fetches the customer fresh from the live `customers` array
//  by id (never a stale reference) and guarantees every {placeholder}
//  gets a real value — customer name, mobile info, dues, and shop
//  settings are always fully populated, never blank.
// ══════════════════════════════
function _buildReminderVars(c, diffDays){
  const payments = Array.isArray(c.payments) ? c.payments : [];
  const mobile   = c.mobile || {};
  const paid     = payments.reduce((s,p)=>s+(p.amount||0),0);
  const rem      = Math.max(0,(mobile.remaining||0)-paid);
  const late = (diffDays===undefined||diffDays===null) ? '' :
    diffDays>0 ? `آپ کی قسط ${diffDays} دن سے تاخیر میں ہے۔ براہ کرم جلد ادا کریں۔` :
    diffDays===0 ? 'آپ کی قسط آج واجب الادا ہے۔' :
    `آپ کی اگلی قسط ${Math.abs(diffDays)} دن میں واجب الادا ہے۔`;
  return {
    name      : c.name || '—',
    model     : mobile.model || '—',
    monthly   : fmt(mobile.monthly || 0),
    remaining : fmt(rem),
    lateInfo  : late,
    shopName  : (shopProfile && shopProfile.name) || 'SM Pro Installment',
    phone     : (shopProfile && shopProfile.phone) || '—'
  };
}
function buildReminderText(id, kind, diffDays){
  // Always re-fetch fresh — this is the "completely fetches the data
  // object from the database" guarantee: never trust a cached/passed-in
  // customer object, always look it up live from the current array.
  const c = customers.find(x=>String(x.id)===String(id));
  if(!c) return '';
  const vars = _buildReminderVars(c, diffDays);
  if(kind === 'schedule'){
    const mobile = c.mobile || {};
    const startD = new Date(mobile.startDate || new Date());
    let schedule = '';
    const months = mobile.months || 0;
    for(let i=1; i<=Math.min(months,6); i++){
      const d = new Date(startD);
      d.setMonth(d.getMonth()+i);
      d.setDate(mobile.dueDay || 10);
      const paidI = i <= (c.payments||[]).length;
      schedule += `${i}. ${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()} — Rs.${fmt(mobile.monthly||0)} ${paidI?'✅':'⏳'}\n`;
    }
    if(months>6) schedule += `...(کل ${months} اقساط)\n`;
    return _cleanWaText(_fillTemplate(reminderTemplates.schedule, {...vars, schedule}));
  }
  return _cleanWaText(_fillTemplate(reminderTemplates.general, vars));
}

// ── DUAL-OPTION REMINDER MODAL (Text Message vs PDF/Media Receipt) ──
let _reminderCtx = null; // {id, kind, diffDays}
function openReminderChoice(id, kind, diffDays){
  const c = customers.find(x=>String(x.id)===String(id));
  if(!c){ showToast('<i class="fa-solid fa-triangle-exclamation"></i> کسٹمر نہیں ملا','warn'); return; }
  _reminderCtx = { id, kind: kind||'general', diffDays };
  const nameEl = document.getElementById('rc-cust-name');
  if(nameEl) nameEl.textContent = c.name || '—';
  openMod('mod-reminder-choice');
}
function reminderSendText(){
  if(!_reminderCtx) return;
  const { id, kind, diffDays } = _reminderCtx;
  const c = customers.find(x=>String(x.id)===String(id));
  if(!c) return;
  const txt = buildReminderText(id, kind, diffDays);
  const n = (c.wa || c.phone || '').replace(/[^0-9]/g,'');
  const i = n.startsWith('0') ? '92'+n.slice(1) : n;
  window.open(`https://wa.me/${i}?text=${encodeURIComponent(txt)}`,'_blank');
  closeMod('mod-reminder-choice');
}
function reminderGenerateMedia(){
  if(!_reminderCtx) return;
  const { id, kind, diffDays } = _reminderCtx;
  generateReminderMedia(id, kind, diffDays);
  closeMod('mod-reminder-choice');
}

// Legacy name kept working — existing onclick="alertWA(...)" callers
// now route through the dual-option modal instead of firing WhatsApp
// text directly.
function alertWA(id,diffDays){ openReminderChoice(id,'general',diffDays); }

// ══════════════════════════════
//  PDF / MEDIA RECEIPT GENERATOR
//  Draws a clean, professional graphical reminder card to a <canvas>
//  and exports it as a shareable/printable PNG image — no external
//  charting/PDF library required, so it can never break on
//  offline-file/Android WebView loads.
// ══════════════════════════════
let _lastReminderMediaUrl = null;
function generateReminderMedia(id, kind, diffDays){
  const c = customers.find(x=>String(x.id)===String(id));
  if(!c){ showToast('<i class="fa-solid fa-triangle-exclamation"></i> کسٹمر نہیں ملا','warn'); return; }
  const vars   = _buildReminderVars(c, diffDays);
  const mobile = c.mobile || {};

  const canvas = document.getElementById('reminder-canvas');
  const W = 720, H = kind==='schedule' ? 900 : 760;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  const cs = getComputedStyle(document.documentElement);
  const p1 = (cs.getPropertyValue('--p1')||'#1565C0').trim();
  const p2 = (cs.getPropertyValue('--p2')||'#0D47A1').trim();
  const a1 = (cs.getPropertyValue('--a1')||'#FF6F00').trim();

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0,0,W,H);

  const hdrGrad = ctx.createLinearGradient(0,0,W,0);
  hdrGrad.addColorStop(0,p2); hdrGrad.addColorStop(1,p1);
  ctx.fillStyle = hdrGrad;
  ctx.fillRect(0,0,W,150);

  ctx.textAlign='center';
  ctx.fillStyle='#FFD700';
  ctx.font='900 34px Georgia, serif';
  ctx.fillText(vars.shopName, W/2, 62);
  ctx.fillStyle='#FFFFFF';
  ctx.font='600 16px Arial';
  ctx.fillText(kind==='schedule' ? 'قسط شیڈول یاددہانی' : 'قسط یاددہانی — Installment Reminder', W/2, 92);
  ctx.font='500 13px Arial';
  ctx.fillStyle='rgba(255,255,255,0.85)';
  ctx.fillText(vars.phone, W/2, 118);

  let y = 190;
  ctx.textAlign='right';
  const rightX = W-50;

  function row(label, value, opts={}){
    ctx.font = opts.big ? '800 22px Arial' : '600 17px Arial';
    ctx.fillStyle = opts.color || '#263238';
    ctx.fillText(String(value), rightX, y);
    ctx.font = '500 12px Arial';
    ctx.fillStyle = '#78909C';
    ctx.fillText(label, rightX, y+18);
    y += opts.big ? 52 : 44;
  }

  ctx.font='800 24px Arial'; ctx.fillStyle=p2;
  ctx.fillText(vars.name + ' صاحب', rightX, y); y += 40;

  row('آئٹم ماڈل', vars.model);
  row('ماہانہ قسط', 'Rs. ' + vars.monthly);
  if(kind==='schedule'){
    const startD = new Date(mobile.startDate || new Date());
    const months = mobile.months || 0;
    ctx.font='700 14px Arial'; ctx.fillStyle=p1;
    ctx.fillText('قسط شیڈول:', rightX, y); y += 30;
    for(let i=1; i<=Math.min(months,8); i++){
      const d = new Date(startD);
      d.setMonth(d.getMonth()+i);
      d.setDate(mobile.dueDay || 10);
      const paidI = i <= (c.payments||[]).length;
      ctx.font='500 14px Arial';
      ctx.fillStyle = paidI ? '#2E7D32' : '#546E7A';
      ctx.fillText(`${i}. ${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()} — Rs.${fmt(mobile.monthly||0)} ${paidI?'✅':'⏳'}`, rightX, y);
      y += 28;
    }
    if(months>8){ ctx.fillStyle='#78909C'; ctx.font='500 13px Arial'; ctx.fillText(`...(کل ${months} اقساط)`, rightX, y); y+=28; }
  } else {
    row('باقی رقم', 'Rs. ' + vars.remaining, {big:true, color:'#C62828'});
    if(vars.lateInfo){
      ctx.font='600 14px Arial'; ctx.fillStyle=a1;
      _wrapText(ctx, vars.lateInfo, rightX, y, W-100, 20);
      y += 50;
    }
  }

  ctx.strokeStyle='#E0E0E0'; ctx.beginPath(); ctx.moveTo(50,H-70); ctx.lineTo(W-50,H-70); ctx.stroke();
  ctx.textAlign='center'; ctx.font='500 12px Arial'; ctx.fillStyle='#90A4AE';
  ctx.fillText('جَزَاكَ اللَّهُ خَيْرًا — ' + new Date().toLocaleDateString('ur-PK'), W/2, H-38);

  const dataUrl = canvas.toDataURL('image/png');
  _lastReminderMediaUrl = dataUrl;
  document.getElementById('reminder-media-preview').src = dataUrl;
  openMod('mod-reminder-media');
}
function _wrapText(ctx, text, x, y, maxWidth, lineHeight){
  const words = text.split(' ');
  let line = '';
  const lines = [];
  for(const w of words){
    const test = line + w + ' ';
    if(ctx.measureText(test).width > maxWidth && line){ lines.push(line); line = w + ' '; }
    else line = test;
  }
  lines.push(line);
  lines.forEach((l,idx)=> ctx.fillText(l.trim(), x, y + idx*lineHeight));
}
function downloadReminderMedia(){
  if(!_lastReminderMediaUrl) return;
  const a = document.createElement('a');
  a.href = _lastReminderMediaUrl;
  a.download = 'reminder-receipt-' + Date.now() + '.png';
  a.click();
}
async function shareReminderMedia(){
  if(!_lastReminderMediaUrl) return;
  try{
    const res = await fetch(_lastReminderMediaUrl);
    const blob = await res.blob();
    const file = new File([blob], 'reminder-receipt.png', {type:'image/png'});
    if(navigator.canShare && navigator.canShare({files:[file]})){
      await navigator.share({files:[file], title:'قسط یاددہانی'});
      return;
    }
  }catch(e){}
  window.open(_lastReminderMediaUrl, '_blank');
}
function printReminderMedia(){
  if(!_lastReminderMediaUrl) return;
  const w = window.open('', '_blank');
  w.document.write(`<img src="${_lastReminderMediaUrl}" style="width:100%;" onload="window.print()">`);
  w.document.close();
}


// ══════════════════════════════
//  UPDATE showSc & recPay
// ══════════════════════════════
function goToAddStep(step){
  document.querySelectorAll('.add-step-content').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.step-btn').forEach(b => b.classList.remove('active'));
  const targetContent = document.getElementById('add-step-' + step);
  const targetBtn = document.getElementById('step-btn-' + step);
  if(targetContent) targetContent.classList.add('active');
  if(targetBtn) targetBtn.classList.add('active');
  const card = document.querySelector('#sc-add .card');
  if(card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showSc(n){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.ni').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.mob-ni').forEach(x=>x.classList.remove('active'));
  const el=document.getElementById('sc-'+n);if(el)el.classList.add('active');
  const nm={dash:0,calc:1,add:2,customers:3,pay:4,alerts:5,reminders:6,report:7,games:8,about:8};
  if(nm[n] !== undefined){
    document.querySelectorAll('.ni')[nm[n]]?.classList.add('active');
    document.querySelectorAll('.mob-ni')[nm[n]]?.classList.add('active');
  }
  if(n==='dash') renderDash();
  if(n==='add') goToAddStep(1);
  if(n==='customers'){
    const srchEl = document.getElementById('srch');
    if(srchEl) srchEl.value = '';
    renderCustomers();
  }
  if(n==='pay') popPaySel();
  if(n==='graph') setTimeout(renderGraphs,60);
  if(n==='reminders') renderReminders();
  if(n==='alerts') renderAlerts();
  if(n==='report') initReport();
  _navGoScreen(n);
}

function toggleMobileMenu(){
  const dropdown = document.getElementById('hdr-mobile-dropdown');
  const btn = document.getElementById('mobile-menu-btn');
  if(dropdown){
    dropdown.classList.toggle('open');
    if(btn) btn.classList.toggle('active');
  }
}

function navMobileGo(n){
  showSc(n);
  const dropdown = document.getElementById('hdr-mobile-dropdown');
  const btn = document.getElementById('mobile-menu-btn');
  if(dropdown) dropdown.classList.remove('open');
  if(btn) btn.classList.remove('active');
}

// Override recPay to show receipt after payment
function recPay(){
  const rawVal=document.getElementById('pay-sel').value;
  const amt=parseFloat(document.getElementById('pay-amt').value)||0;
  const date=document.getElementById('pay-date').value;
  const note=document.getElementById('pay-note').value.trim();
  const c=customers.find(x=>String(x.id)===String(rawVal));
  if(!c||!amt){showToast('<i class="fa-solid fa-triangle-exclamation"></i> کسٹمر اور رقم لازمی ہے','warn');return;}
  const payObj={amount:amt,date,note,time:new Date().toISOString()};
  c.payments.push(payObj);
  const paid=c.payments.reduce((s,p)=>s+p.amount,0);
  if(paid>=c.mobile.remaining) c.status='done';
  save();showToast('<i class="fa-solid fa-circle-check"></i> قسط جمع ہو گئی!');
  loadPay();renderDash();
  document.getElementById('pay-note').value='';
  setTimeout(()=>showReceipt(id,payObj),400);
}


// ══════════════════════════════
//  DYNAMIC THEME COLOR SWATCHER
//  12 curated theme presets. Clicking a swatch overrides --p1/--p2/--p3
//  (primary) and --a1/--a2/--a3 (accent) globally via inline CSS
//  variables on :root, and the chosen index persists in localStorage.
// ══════════════════════════════
const THEME_PRESETS = [
  { name:'رائل بلیو',   p1:'#1565C0', p2:'#0D47A1', p3:'#1E88E5', a1:'#FF6F00', a2:'#FFA000', a3:'#FFD54F' },
  { name:'ٹیل',         p1:'#00897B', p2:'#00695C', p3:'#26A69A', a1:'#FF6F00', a2:'#FFA000', a3:'#FFD54F' },
  { name:'فاریسٹ گرین', p1:'#2E7D32', p2:'#1B5E20', p3:'#43A047', a1:'#F9A825', a2:'#FBC02D', a3:'#FFE082' },
  { name:'وائبرینٹ اورنج', p1:'#EF6C00', p2:'#E65100', p3:'#FB8C00', a1:'#1565C0', a2:'#1E88E5', a3:'#90CAF9' },
  { name:'پرپل',        p1:'#6A1B9A', p2:'#4A148C', p3:'#8E24AA', a1:'#FFB300', a2:'#FFCA28', a3:'#FFE082' },
  { name:'کرمسن',       p1:'#C62828', p2:'#8E0000', p3:'#E53935', a1:'#FFB300', a2:'#FFCA28', a3:'#FFE082' },
  { name:'انڈیگو',      p1:'#3949AB', p2:'#283593', p3:'#5C6BC0', a1:'#FF6F00', a2:'#FFA000', a3:'#FFD54F' },
  { name:'روز پنک',     p1:'#D81B60', p2:'#AD1457', p3:'#EC407A', a1:'#00897B', a2:'#26A69A', a3:'#80CBC4' },
  { name:'ٹیل ڈارک',    p1:'#00695C', p2:'#004D40', p3:'#00897B', a1:'#FFAB00', a2:'#FFC400', a3:'#FFE082' },
  { name:'برگنڈی',      p1:'#880E4F', p2:'#560027', p3:'#AD1457', a1:'#FDD835', a2:'#FFF176', a3:'#FFF9C4' },
  { name:'سلیٹ گرے',    p1:'#455A64', p2:'#263238', p3:'#607D8B', a1:'#FF6F00', a2:'#FFA000', a3:'#FFD54F' },
  { name:'سیان',        p1:'#0097A7', p2:'#006064', p3:'#00BCD4', a1:'#FF6F00', a2:'#FFA000', a3:'#FFD54F' }
];
let currentThemeIdx = parseInt(localStorage.getItem('sms_theme_idx')||'0')||0;

function applyThemeColor(idx){
  const t = THEME_PRESETS[idx]; if(!t) return;
  const r = document.documentElement.style;
  r.setProperty('--p1', t.p1); r.setProperty('--p2', t.p2); r.setProperty('--p3', t.p3);
  r.setProperty('--a1', t.a1); r.setProperty('--a2', t.a2); r.setProperty('--a3', t.a3);
  currentThemeIdx = idx;
  localStorage.setItem('sms_theme_idx', String(idx));
  renderThemeSwatches();
}
function renderThemeSwatches(){
  const el = document.getElementById('theme-swatch-row');
  if(!el) return;
  el.innerHTML = THEME_PRESETS.map((t,i)=>`
    <div class="theme-swatch${i===currentThemeIdx?' sel':''}"
         style="background:linear-gradient(135deg,${t.p1},${t.p3});color:${t.p1};"
         title="${t.name}" onclick="applyThemeColor(${i})"></div>`).join('');
}

// ══════════════════════════════
//  DARK MODE (ROBUST)
// ══════════════════════════════
let darkMode = localStorage.getItem('sms_dark') === '1';

function applyDark(){
  if(darkMode){
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }
}
function toggleDark(){
  darkMode = !darkMode;
  localStorage.setItem('sms_dark', darkMode ? '1' : '0');
  applyDark();
}
applyDark();

// ══════════════════════════════
//  SHOP TITLE EDITOR
// ══════════════════════════════
let shopNames = JSON.parse(localStorage.getItem('sms_shopnames') || 'null') || {
  ur: 'شاہد موبائل شاپ',
  en: 'Shahid Mobile Shop',
  sub: 'INSTALLMENT MANAGEMENT SYSTEM'
};
function applyShopName(){
  const en = !isUrdu;
  document.getElementById('shop-name-display').textContent = en ? shopNames.en : shopNames.ur;
  document.getElementById('shop-sub-display').innerHTML = shopNames.sub + ' <i class="fa-solid fa-pen"></i>';
}
function openTitleEdit(){
  document.getElementById('title-ur').value = shopNames.ur;
  document.getElementById('title-en').value = shopNames.en;
  document.getElementById('title-sub').value = shopNames.sub;
  openMod('mod-title');
}
function saveTitle(){
  shopNames.ur = document.getElementById('title-ur').value.trim() || shopNames.ur;
  shopNames.en = document.getElementById('title-en').value.trim() || shopNames.en;
  shopNames.sub = document.getElementById('title-sub').value.trim() || shopNames.sub;
  localStorage.setItem('sms_shopnames', JSON.stringify(shopNames));
  applyShopName();
  closeMod('mod-title');
  showToast('<i class="fa-solid fa-circle-check"></i> نام محفوظ ہو گیا!');
}

// ══════════════════════════════
//  PROFILE SETTINGS (دکان/پروفائل سیٹنگز)
//  Per-user business card info used across footer, receipts,
//  agreements, and WhatsApp/Email reminders. Syncs to Firebase at
//  backups/users/{mobile}/profile so it follows the user to any device.
// ══════════════════════════════
// SM Pro Installment — premium dark & gold 3D brand mark, embedded as a
// self-contained Base64 asset so the APK never depends on an external file.
const SM_PRO_LOGO_B64 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgdmlld0JveD0iMCAwIDUwMCA1MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImJnR3JhZCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiMyQTFGMEEiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSI1NSUiIHN0b3AtY29sb3I9IiMxMjBEMDYiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjMDAwMDAwIi8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogICAgPGxpbmVhckdyYWRpZW50IGlkPSJnb2xkR3JhZCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNGRkY2RDgiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIyNSUiIHN0b3AtY29sb3I9IiNGRkQ3MDAiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSI1NSUiIHN0b3AtY29sb3I9IiNENEEwMTciLz4KICAgICAgPHN0b3Agb2Zmc2V0PSI4MCUiIHN0b3AtY29sb3I9IiNGRkU1OEEiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjQjg4NjBCIi8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogICAgPGxpbmVhckdyYWRpZW50IGlkPSJnb2xkR3JhZFNvZnQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjAlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iI0ZGRTU4QSIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjUwJSIgc3RvcC1jb2xvcj0iI0ZGRDcwMCIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNENEEwMTciLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICA8Y2xpcFBhdGggaWQ9InJvdW5kZWRGcmFtZSI+CiAgICAgIDxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSI1MDAiIGhlaWdodD0iNTAwIiByeD0iOTAiLz4KICAgIDwvY2xpcFBhdGg+CiAgPC9kZWZzPgoKICA8ZyBjbGlwLXBhdGg9InVybCgjcm91bmRlZEZyYW1lKSI+CiAgICA8cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0idXJsKCNiZ0dyYWQpIi8+CiAgICA8Y2lyY2xlIGN4PSIyNTAiIGN5PSIyNTAiIHI9IjIwNSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjQjg4NjBCIiBzdHJva2Utb3BhY2l0eT0iMC4yNSIgc3Ryb2tlLXdpZHRoPSIxLjUiLz4KICAgIDxjaXJjbGUgY3g9IjI1MCIgY3k9IjI1MCIgcj0iMTY1IiBmaWxsPSJub25lIiBzdHJva2U9IiNCODg2MEIiIHN0cm9rZS1vcGFjaXR5PSIwLjIyIiBzdHJva2Utd2lkdGg9IjEuNSIvPgogICAgPGxpbmUgeDE9IjYwIiB5MT0iMjUwIiB4Mj0iNDQwIiB5Mj0iMjUwIiBzdHJva2U9IiNCODg2MEIiIHN0cm9rZS1vcGFjaXR5PSIwLjE1IiBzdHJva2Utd2lkdGg9IjEiLz4KICAgIDxsaW5lIHgxPSIyNTAiIHkxPSI2MCIgeDI9IjI1MCIgeTI9IjQ0MCIgc3Ryb2tlPSIjQjg4NjBCIiBzdHJva2Utb3BhY2l0eT0iMC4xNSIgc3Ryb2tlLXdpZHRoPSIxIi8+CgogICAgPHJlY3QgeD0iMTQiIHk9IjE0IiB3aWR0aD0iNDcyIiBoZWlnaHQ9IjQ3MiIgcng9IjgwIiBmaWxsPSJub25lIiBzdHJva2U9InVybCgjZ29sZEdyYWQpIiBzdHJva2Utd2lkdGg9IjYiLz4KCiAgICA8dGV4dCB4PSIyNTAiIHk9IjIyOCIgZm9udC1mYW1pbHk9Ikdlb3JnaWEsICdUaW1lcyBOZXcgUm9tYW4nLCBzZXJpZiIgZm9udC1zaXplPSIxNTAiIGZvbnQtd2VpZ2h0PSI5MDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9InVybCgjZ29sZEdyYWQpIiBzdHJva2U9IiM1QzNEMDAiIHN0cm9rZS13aWR0aD0iMS41Ij5TTTwvdGV4dD4KCiAgICA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgzMDAsMTIwKSI+CiAgICAgIDxwYXRoIGQ9Ik0wIDQ2IEwxOCAyNCBMMzQgMzYgTDU4IDQiIGZpbGw9Im5vbmUiIHN0cm9rZT0idXJsKCNnb2xkR3JhZCkiIHN0cm9rZS13aWR0aD0iNyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CiAgICAgIDxwYXRoIGQ9Ik00NCA0IEw1OCA0IEw1OCAxOCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ1cmwoI2dvbGRHcmFkKSIgc3Ryb2tlLXdpZHRoPSI3IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KICAgICAgPHJlY3QgeD0iNzAiIHk9IjMwIiB3aWR0aD0iOSIgaGVpZ2h0PSIyMiIgcng9IjEuNSIgZmlsbD0idXJsKCNnb2xkR3JhZCkiLz4KICAgICAgPHJlY3QgeD0iODMiIHk9IjIwIiB3aWR0aD0iOSIgaGVpZ2h0PSIzMiIgcng9IjEuNSIgZmlsbD0idXJsKCNnb2xkR3JhZCkiLz4KICAgICAgPHJlY3QgeD0iOTYiIHk9IjgiIHdpZHRoPSI5IiBoZWlnaHQ9IjQ0IiByeD0iMS41IiBmaWxsPSJ1cmwoI2dvbGRHcmFkKSIvPgogICAgPC9nPgoKICAgIDx0ZXh0IHg9IjI1MCIgeT0iMzAwIiBmb250LWZhbWlseT0iQXJpYWwsIEhlbHZldGljYSwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIzOCIgZm9udC13ZWlnaHQ9IjgwMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0idXJsKCNnb2xkR3JhZFNvZnQpIj5QUk88L3RleHQ+CgogICAgPHJlY3QgeD0iOTAiIHk9IjMzNSIgd2lkdGg9IjMyMCIgaGVpZ2h0PSIyIiBmaWxsPSIjQjg4NjBCIiBmaWxsLW9wYWNpdHk9IjAuNSIvPgoKICAgIDx0ZXh0IHg9IjI1MCIgeT0iMzg1IiBmb250LWZhbWlseT0iQXJpYWwsIEhlbHZldGljYSwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSI0NiIgZm9udC13ZWlnaHQ9IjgwMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0idXJsKCNnb2xkR3JhZFNvZnQpIiBsZXR0ZXItc3BhY2luZz0iMSI+SW5zdGFsbG1lbnQ8L3RleHQ+CiAgICA8dGV4dCB4PSIyNTAiIHk9IjQyNSIgZm9udC1mYW1pbHk9IkFyaWFsLCBIZWx2ZXRpY2EsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjIiIGZvbnQtd2VpZ2h0PSI2MDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiNFOEM0NjgiIGxldHRlci1zcGFjaW5nPSI0Ij5NQU5BR0VNRU5UIFNZU1RFTTwvdGV4dD4KICA8L2c+Cjwvc3ZnPgo=';
const SMS_DEFAULT_LOGO = SM_PRO_LOGO_B64;

let shopProfile = JSON.parse(localStorage.getItem('sms_shop_profile') || 'null') || {
  name    : 'شاہد مدنی',
  ownerName: '',
  phone   : '03132092639',
  address : '',
  email   : '',
  logo    : '',
  location:      '', // readable area/city name from reverse-geocoding (e.g. "Korangi, Karachi")
  locationMapUrl: ''  // Google Maps link for the same GPS point
};

function _persistShopProfile(){
  localStorage.setItem('sms_shop_profile', JSON.stringify(shopProfile));
}

// ══════════════════════════════
//  PROFILE EMAIL — AUTO-SAVE + LOCK
//  This email is what the Firebase backup path is described to the
//  user by, so it must never be silently lost. Every keystroke is
//  persisted to localStorage immediately (not just on the Save
//  button), and once a value has been saved the field locks itself
//  so it can't be accidentally cleared/overwritten — it must be
//  explicitly unlocked first.
// ══════════════════════════════
let _profileEmailDraftTimer = null;
let _profileEmailUnlocked = false;

function _draftSaveProfileEmail(){
  const el = document.getElementById('prof-email');
  if(!el) return;
  if(_profileEmailDraftTimer) clearTimeout(_profileEmailDraftTimer);
  _profileEmailDraftTimer = setTimeout(()=>{
    const val = (el.value || '').trim();
    // Only persist while the value is empty or a syntactically valid
    // email — never let a half-typed string overwrite a good saved one.
    if(val === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)){
      shopProfile.email = val;
      _persistShopProfile();
    }
  }, 400);
}

function _setProfileEmailLock(locked){
  const el   = document.getElementById('prof-email');
  const btn  = document.getElementById('prof-email-unlock-btn');
  const tag  = document.getElementById('prof-email-lock-tag');
  if(!el) return;
  el.readOnly = !!locked;
  el.style.opacity = locked ? '0.75' : '1';
  el.style.background = locked ? 'var(--bg)' : '';
  if(btn) btn.style.display = locked ? 'block' : 'none';
  if(tag) tag.style.display = locked ? 'inline' : 'none';
}

function _unlockProfileEmail(){
  if(!confirm('یہ ای میل Firebase بیک اپ سے جڑی ہوئی ہے۔ کیا آپ واقعی اسے تبدیل کرنا چاہتے ہیں؟')) return;
  _profileEmailUnlocked = true;
  _setProfileEmailLock(false);
  const el = document.getElementById('prof-email');
  if(el) el.focus();
}

// Push current shopProfile values into every place they're displayed.
// ══════════════════════════════
//  PROFILE SLIDE-OUT SIDEBAR
// ══════════════════════════════
// ══════════════════════════════
//  PROFILE SLIDE-OUT SIDEBAR
//  (now doubles as the editable profile form — see prof-* fields,
//  populated by applyShopProfile() and saved via saveProfileSettings())
// ══════════════════════════════
function openProfileSidebar(){
  applyShopProfile();
  document.getElementById('profile-drawer').classList.add('open');
  document.getElementById('profile-drawer-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeProfileSidebar(){
  document.getElementById('profile-drawer').classList.remove('open');
  document.getElementById('profile-drawer-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

function applyShopProfile(){
  const nameEl = document.getElementById('about-profile-name');
  if(nameEl) nameEl.textContent = shopProfile.name || 'شاہد موبائل شاپ';
  const badgeNameEl = document.getElementById('about-badge-name');
  if(badgeNameEl) badgeNameEl.textContent = shopProfile.name || 'شاہد موبائل شاپ';

  const avatarImg = document.getElementById('about-avatar-img');
  if(avatarImg) avatarImg.src = shopProfile.logo || SMS_DEFAULT_LOGO;

  const digits = (shopProfile.phone || '').replace(/[^0-9]/g,'');
  const intl   = digits.startsWith('0') ? '92' + digits.slice(1) : digits;

  const phoneLink = document.getElementById('about-phone-link');
  if(phoneLink) phoneLink.href = 'tel:' + digits;
  const phoneVal = document.getElementById('about-phone-val');
  if(phoneVal) phoneVal.textContent = shopProfile.phone || '—';

  const waLink = document.getElementById('about-wa-link');
  if(waLink) waLink.href = 'https://wa.me/' + intl;
  const waVal = document.getElementById('about-wa-val');
  if(waVal) waVal.textContent = shopProfile.phone || '—';

  const mailLink = document.getElementById('about-mail-link');
  if(mailLink) mailLink.href = 'mailto:' + (shopProfile.email || '');
  const mailVal = document.getElementById('about-mail-val');
  if(mailVal) mailVal.textContent = shopProfile.email || '—';

  const addrCard = document.getElementById('about-addr-card');
  const addrVal  = document.getElementById('about-addr-val');
  if(addrVal) addrVal.textContent = shopProfile.address || '—';
  if(addrCard) addrCard.style.display = shopProfile.address ? 'flex' : 'flex';

  const gpsCard = document.getElementById('about-gps-card');
  const gpsVal  = document.getElementById('about-gps-val');
  if(gpsCard){
    if(shopProfile.locationMapUrl){
      gpsCard.href = shopProfile.locationMapUrl; // icon links to the live Google Maps URL
      if(gpsVal) gpsVal.textContent = shopProfile.location || 'Google Maps'; // readable name shown as the value
      gpsCard.style.display = 'flex';
    } else {
      gpsCard.style.display = 'none';
    }
  }

  // Also pre-fill the settings form if it's currently on screen
  const fName = document.getElementById('prof-name');
  if(fName && document.activeElement !== fName) fName.value = shopProfile.name || '';
  const fOwnerName = document.getElementById('prof-owner-name');
  if(fOwnerName && document.activeElement !== fOwnerName) fOwnerName.value = shopProfile.ownerName || '';
  const fPhone = document.getElementById('prof-phone');
  if(fPhone && document.activeElement !== fPhone) fPhone.value = shopProfile.phone || '';
  const fAddr = document.getElementById('prof-address');
  if(fAddr && document.activeElement !== fAddr) fAddr.value = shopProfile.address || '';
  const fEmail = document.getElementById('prof-email');
  if(fEmail && document.activeElement !== fEmail) fEmail.value = shopProfile.email || '';
  _setProfileEmailLock(!!(shopProfile.email && !_profileEmailUnlocked));
  const fGps = document.getElementById('prof-gps-link');
  if(fGps) fGps.value = shopProfile.location || '';
  const fLogoPrev = document.getElementById('prof-logo-preview');
  if(fLogoPrev) fLogoPrev.src = shopProfile.logo || SMS_DEFAULT_LOGO;
}

// Reads the chosen image file and stores it as a Base64 data URL.
function handleLogoUpload(evt){
  const file = evt.target.files && evt.target.files[0];
  if(!file) return;
  if(!file.type.startsWith('image/')){ showToast('<i class="fa-solid fa-triangle-exclamation"></i> صرف تصویر منتخب کریں', 'warn'); return; }
  const reader = new FileReader();
  reader.onload = () => {
    const preview = document.getElementById('prof-logo-preview');
    if(preview) preview.src = reader.result;
    // stash on the input element until Save is pressed
    document.getElementById('prof-logo-input').dataset.base64 = reader.result;
  };
  reader.onerror = () => showToast('<i class="fa-solid fa-circle-xmark"></i> تصویر لوڈ نہیں ہو سکی', 'warn');
  reader.readAsDataURL(file);
}

async function saveProfileSettings(){
  const name  = (document.getElementById('prof-name').value || '').trim();
  const ownerName = (document.getElementById('prof-owner-name').value || '').trim();
  const phone = (document.getElementById('prof-phone').value || '').trim();
  const addr  = (document.getElementById('prof-address').value || '').trim();
  const email = (document.getElementById('prof-email').value || '').trim();
  const logoInput = document.getElementById('prof-logo-input');
  const newLogo = logoInput.dataset.base64;

  if(email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
    showToast('<i class="fa-solid fa-triangle-exclamation"></i> درست ای میل درج کریں', 'warn');
    return;
  }

  shopProfile = {
    name    : name  || shopProfile.name,
    ownerName: ownerName,
    phone   : phone || shopProfile.phone,
    address : addr,
    email   : email || shopProfile.email,
    logo    : newLogo || shopProfile.logo,
    location:      shopProfile.location || '',      // captured separately via captureGpsLocation()
    locationMapUrl: shopProfile.locationMapUrl || ''
  };
  _persistShopProfile();
  _profileEmailUnlocked = false;
  applyShopProfile();
  showToast('<i class="fa-solid fa-circle-check"></i> پروفائل محفوظ ہو گئی!');

  // Sync to Firebase at backups/users/{mobile}/profile so a new device
  // can pull the shop's identity back automatically on next login.
  const mobile = getSessionUid();
  if(mobile && _fbDb){
    try{ await _fbDb.ref(_fbUserPath(mobile) + '/profile').set(shopProfile); }
    catch(e){ console.warn('[profile sync]', e.message); }
  }
}

// ── GPS LOCATION CAPTURE ──────────────────────────────────────
// Prompts for geolocation permission, captures precise lat/lng, reverse
// -geocodes it into a readable area/city name via OpenStreetMap's free
// Nominatim API, and stores BOTH: the readable text (shown in the
// Profile "Location" field) and the Google Maps link (used by the
// map-icon card in the About screen).
// ══════════════════════════════════════════════════════════════
//  CUSTOMER GPS LOCATION (New Customer form)
//  Captures high-accuracy lat/lng via the HTML5 Geolocation API and
//  stores them in hidden fields (#c-gps-lat / #c-gps-lng) so they get
//  submitted along with the rest of the customer's data in saveCustomer().
// ══════════════════════════════════════════════════════════════
function captureCustomerGpsLocation(){
  const status  = document.getElementById('c-gps-status');
  const display = document.getElementById('c-gps-display');
  const latF    = document.getElementById('c-gps-lat');
  const lngF    = document.getElementById('c-gps-lng');

  if(!navigator.geolocation){
    if(status) status.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> اس ڈیوائس/براؤزر میں GPS دستیاب نہیں';
    alert('یہ ڈیوائس یا براؤزر GPS لوکیشن سپورٹ نہیں کرتا۔');
    return;
  }

  if(status) status.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> مقام حاصل کیا جا رہا ہے…';
  if(display) display.value = 'براہ مہربانی انتظار کریں…';

  navigator.geolocation.getCurrentPosition(
    (pos)=>{
      const { latitude, longitude } = pos.coords;
      if(latF) latF.value = latitude;
      if(lngF) lngF.value = longitude;
      if(display) display.value = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      if(status) status.innerHTML = '<i class="fa-solid fa-circle-check"></i> مقام کامیابی سے حاصل ہو گیا!';
      showToast('<i class="fa-solid fa-circle-check"></i> GPS مقام محفوظ ہو گیا');
    },
    (err)=>{
      let msg = 'مقام حاصل نہیں ہو سکا — دوبارہ کوشش کریں';
      if(err.code === 1) msg = 'لوکیشن پرمیشن مسترد کر دی گئی — براہ مہربانی براؤزر/ایپ سیٹنگز میں GPS اجازت دیں';
      else if(err.code === 2) msg = 'مقام کا پتہ نہیں چل سکا — GPS سگنل یا انٹرنیٹ چیک کریں';
      else if(err.code === 3) msg = 'وقت ختم ہو گیا — کھلی جگہ پر جا کر دوبارہ کوشش کریں';
      if(status) status.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> ' + msg;
      if(display) display.value = '';
      alert(msg); // native alert guides the user clearly even if they miss the inline status text
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
}

// Resets the customer-GPS fields — called from clearForm() so a fresh
// "New Customer" entry never inherits the previous customer's coordinates.
function _resetCustomerGpsFields(){
  const latF = document.getElementById('c-gps-lat');
  const lngF = document.getElementById('c-gps-lng');
  const disp = document.getElementById('c-gps-display');
  const stat = document.getElementById('c-gps-status');
  if(latF) latF.value = '';
  if(lngF) lngF.value = '';
  if(disp) disp.value = '';
  if(stat) stat.textContent = '';
}

async function captureGpsLocation(){
  const status = document.getElementById('prof-gps-status');
  const linkInput = document.getElementById('prof-gps-link');

  if(!navigator.geolocation){
    if(status) status.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> اس ڈیوائس/براؤزر میں GPS دستیاب نہیں';
    return;
  }

  if(status) status.textContent = '⏳ مقام حاصل کیا جا رہا ہے…';

  navigator.geolocation.getCurrentPosition(
    async (pos)=>{
      const { latitude, longitude } = pos.coords;
      const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
      shopProfile.locationMapUrl = mapsLink;

      // Fallback text if the reverse-geocode lookup below fails —
      // still better than nothing, and gets replaced the moment the
      // API responds successfully.
      let readableName = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
      if(status) status.textContent = '⏳ پتہ معلوم کیا جا رہا ہے…';

      try{
        const resp = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1`,
          { headers: { 'Accept-Language': 'ur,en' } }
        );
        if(resp.ok){
          const data = await resp.json();
          const a = data.address || {};
          const area = a.suburb || a.neighbourhood || a.town || a.village || a.city_district || '';
          const city = a.city || a.town || a.state_district || a.state || '';
          readableName = [area, city].filter(Boolean).join(', ') || data.display_name || readableName;
        }
      } catch(e){
        console.warn('[reverse geocode]', e.message);
        // Network hiccup or Nominatim unreachable — keep the raw
        // coordinates fallback set above rather than failing outright.
      }

      shopProfile.location = readableName; // readable text — the Profile "Location" field
      _persistShopProfile();
      if(linkInput) linkInput.value = readableName;
      if(status) status.innerHTML = '<i class="fa-solid fa-circle-check"></i> مقام محفوظ ہو گیا!';
      showToast('<i class="fa-solid fa-circle-check"></i> GPS مقام محفوظ ہو گیا: ' + readableName);
      applyShopProfile(); // refresh the About screen's map-icon card link too

      // Sync immediately so the location travels with the profile.
      const mobile = getSessionUid();
      if(mobile && _fbDb){
        try{ await _fbDb.ref(_fbUserPath(mobile) + '/profile').set(shopProfile); }
        catch(e){ console.warn('[gps profile sync]', e.message); }
      }
    },
    (err)=>{
      let msg = '<i class="fa-solid fa-circle-xmark"></i> مقام حاصل نہیں ہو سکا';
      if(err.code === 1) msg = '<i class="fa-solid fa-triangle-exclamation"></i> لوکیشن پرمیشن دیں تاکہ مقام محفوظ ہو سکے';
      else if(err.code === 2) msg = '<i class="fa-solid fa-triangle-exclamation"></i> مقام کا پتہ نہیں چل سکا — سگنل چیک کریں';
      else if(err.code === 3) msg = '<i class="fa-solid fa-triangle-exclamation"></i> وقت ختم ہو گیا — دوبارہ کوشش کریں';
      if(status) status.innerHTML = msg;
      showToast(msg, 'warn');
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
}

// ══════════════════════════════════════════════════════════════
//  PIN LOCK (replaces the old fingerprint/biometric system)
// ──────────────────────────────────────────────────────────────
//  Storage: 'sms_pin_enabled' ('1'/'0') + 'sms_pin_hash' (SHA-256 of
//  the 4-digit PIN, base64-encoded — never store the raw PIN).
// ══════════════════════════════════════════════════════════════
const PIN_ENABLED_KEY = 'sms_pin_enabled';
const PIN_HASH_KEY    = 'sms_pin_hash';

let _pinEntry      = '';   // digits typed so far on the unlock screen
let _pinSetupStage = 'new'; // 'new' -> 'confirm' while setting a PIN
let _pinSetupFirst = '';    // first entry, held until confirmed

// SHA-256 hash of the PIN, base64-encoded. Falls back to a simple
// non-cryptographic hash on the rare WebView with no Web Crypto API,
// so the feature still works everywhere rather than breaking.
async function _hashPin(pin){
  try{
    if(window.crypto && crypto.subtle){
      const buf = new TextEncoder().encode('sms-pin::' + pin);
      const digest = await crypto.subtle.digest('SHA-256', buf);
      return _abToB64(digest);
    }
  } catch(e){ /* fall through to the simple fallback below */ }
  let h = 0;
  const s = 'sms-pin::' + pin;
  for(let i=0;i<s.length;i++){ h = ((h<<5)-h) + s.charCodeAt(i); h |= 0; }
  return 'fallback:' + h;
}
function _abToB64(buf){
  let bin = '';
  const bytes = new Uint8Array(buf);
  for(let i=0;i<bytes.byteLength;i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function isPinEnabled(){ return localStorage.getItem(PIN_ENABLED_KEY) === '1'; }
function hasPinSet(){ return !!localStorage.getItem(PIN_HASH_KEY); }

// Reflects current state into the Settings toggle.
function _updatePinUI(){
  const toggle = document.getElementById('pin-toggle');
  if(toggle) toggle.checked = isPinEnabled();
}

// Settings toggle handler.
function togglePinLock(checked){
  if(checked){
    if(!hasPinSet()){
      // No PIN chosen yet — send them straight to setup; the toggle
      // itself only turns fully on once a PIN has actually been saved.
      const toggle = document.getElementById('pin-toggle');
      if(toggle) toggle.checked = false;
      showToast('ℹ️ پہلے اپنا PIN سیٹ کریں', 'warn');
      openPinSetup();
      return;
    }
    localStorage.setItem(PIN_ENABLED_KEY, '1');
    showToast('<i class="fa-solid fa-circle-check"></i> PIN لاک فعال ہو گیا!');
  } else {
    localStorage.setItem(PIN_ENABLED_KEY, '0');
    showToast('🔓 PIN لاک بند کر دیا گیا');
  }
  _updatePinUI();
}

// ── Settings → "PIN سیٹ / تبدیل کریں" ───────────────────────────
function openPinSetup(){
  _pinSetupStage = 'new';
  _pinSetupFirst = '';
  pinSetupKeyPress._buf = '';
  _renderPinSetup();
  document.getElementById('pin-setup-screen').style.display = 'flex';
}
function closePinSetup(){
  document.getElementById('pin-setup-screen').style.display = 'none';
}
function _renderPinSetup(){
  const title = document.getElementById('pin-setup-title');
  const hint  = document.getElementById('pin-setup-hint');
  if(_pinSetupStage === 'new'){
    if(title) title.textContent = 'نیا PIN درج کریں';
    if(hint)  hint.textContent  = '4 ہندسوں کا PIN منتخب کریں';
  } else {
    if(title) title.textContent = 'PIN دوبارہ درج کریں';
    if(hint)  hint.textContent  = 'تصدیق کے لیے وہی PIN دوبارہ درج کریں';
  }
  _updatePinDots('pin-setup-dot-', '');
  const err = document.getElementById('pin-setup-err');
  if(err) err.textContent = '';
}
async function pinSetupKeyPress(k){
  const err = document.getElementById('pin-setup-err');
  if(err) err.textContent = '';

  let cur = (pinSetupKeyPress._buf || '');
  if(k === 'back'){ cur = cur.slice(0,-1); }
  else if(k === 'hash'){ cur = ''; }
  else if(cur.length < 4){ cur += k; }
  pinSetupKeyPress._buf = cur;
  _updatePinDots('pin-setup-dot-', cur);

  if(cur.length === 4){
    if(_pinSetupStage === 'new'){
      _pinSetupFirst = cur;
      _pinSetupStage = 'confirm';
      pinSetupKeyPress._buf = '';
      setTimeout(()=>{ _renderPinSetup(); }, 200);
    } else {
      if(cur !== _pinSetupFirst){
        if(err) err.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> PIN مماثل نہیں — دوبارہ کوشش کریں';
        pinSetupKeyPress._buf = '';
        _pinSetupStage = 'new';
        _pinSetupFirst = '';
        setTimeout(()=>{ _updatePinDots('pin-setup-dot-',''); _renderPinSetup(); }, 700);
        return;
      }
      const hash = await _hashPin(cur);
      localStorage.setItem(PIN_HASH_KEY, hash);
      localStorage.setItem(PIN_ENABLED_KEY, '1');
      pinSetupKeyPress._buf = '';
      closePinSetup();
      _updatePinUI();
      showToast('<i class="fa-solid fa-circle-check"></i> PIN محفوظ ہو گیا اور PIN لاک فعال ہو گیا!');
    }
  }
}

// ── Unlock screen (shown on cold start / auto-lock resume) ──────
function _updatePinDots(prefix, value){
  for(let i=0;i<4;i++){
    const dot = document.getElementById(prefix + i);
    if(dot) dot.classList.toggle('filled', i < value.length);
  }
}
async function pinKeyPress(k){
  const err = document.getElementById('pin-lock-err');
  if(err) err.textContent = '';

  if(k === 'back'){ _pinEntry = _pinEntry.slice(0,-1); }
  else if(k === 'hash'){ _pinEntry = ''; }
  else if(_pinEntry.length < 4){ _pinEntry += k; }
  _updatePinDots('pin-dot-', _pinEntry);

  if(_pinEntry.length === 4){
    const enteredHash = await _hashPin(_pinEntry);
    const savedHash = localStorage.getItem(PIN_HASH_KEY);
    if(enteredHash === savedHash){
      _pinEntry = '';
      _updatePinDots('pin-dot-', '');
      const lock = document.getElementById('pin-lock-screen');
      if(lock) lock.style.display = 'none';
      showSc('dash');
      showToast('<i class="fa-solid fa-circle-check"></i> خوش آمدید!');
    } else {
      if(err) err.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> غلط PIN — دوبارہ کوشش کریں';
      setTimeout(()=>{ _pinEntry=''; _updatePinDots('pin-dot-',''); }, 500);
    }
  }
}

// ══════════════════════════════════════════════════════════════
//  1-MINUTE AUTO-LOCK
// ──────────────────────────────────────────────────────────────
// When the app is minimized / phone screen locks, note the time. If
// the user comes back more than 60 seconds later and PIN Lock is on,
// force the app back to the PIN screen.
// ══════════════════════════════════════════════════════════════
let _pinBackgroundedAt = null;
document.addEventListener('visibilitychange', function(){
  if(document.hidden){
    _pinBackgroundedAt = Date.now();
  } else if(_pinBackgroundedAt){
    const awayMs = Date.now() - _pinBackgroundedAt;
    _pinBackgroundedAt = null;
    if(awayMs > 60000 && isPinEnabled() && hasPinSet()){
      _maybeShowPinLock();
    }
  }
});

// Called from onAuthStateChanged once a real Firebase session is
// confirmed, and from the auto-lock timer above. Blocks the dashboard
// behind the PIN screen before any shop/customer data is visible.
function _maybeShowPinLock(){
  if(isPinEnabled() && hasPinSet()){
    _pinEntry = '';
    _updatePinDots('pin-dot-', '');
    const err = document.getElementById('pin-lock-err');
    if(err) err.textContent = '';
    const lock = document.getElementById('pin-lock-screen');
    if(lock) lock.style.display = 'flex';
  }
}

// ══════════════════════════════
//  LANGUAGE TOGGLE (ROBUST)
// ══════════════════════════════
let isUrdu = localStorage.getItem('sms_lang') !== 'en';

// All static UI strings: [urdu, english]
const UI = {
  // Nav tabs (order must match the .ni elements in .bnav)
  'nav-0': ['ہوم','Home'],
  'nav-1': ['کیلکولیٹر','Calc'],
  'nav-2': ['نیا','New'],
  'nav-3': ['کسٹمرز','Customers'],
  'nav-4': ['قسط','Payment'],
  'nav-5': ['الرٹس','Alerts'],
  'nav-6': ['یاددہانی','Reminders'],
  'nav-7': ['رپورٹ','Report'],
  'nav-8': ['گیمز','Games'],
  'nav-9': ['سیٹنگز','Settings'],
};

// Elements with data-ur / data-en attributes get translated automatically.
// For dynamic rendered content, language is passed as a flag to render functions.

function getLang(ur, en){ return isUrdu ? ur : en; }

function applyLang(){
  const en = !isUrdu;

  // 1. body direction & font
  document.body.dir = en ? 'ltr' : 'rtl';
  document.body.style.fontFamily = en
    ? "'Poppins',sans-serif"
    : "'Jameel Noori Nastaleeq','Poppins',sans-serif";

  // 2. toggle switch state
  const langBtn = document.getElementById('lang-btn');
  const langThumb = document.getElementById('lang-thumb');
  if(langBtn) langBtn.classList.toggle('en', en);
  if(langThumb) langThumb.textContent = en ? 'EN' : 'اردو';

  // 3. nav labels
  const navLabels = document.querySelectorAll('.ni .nlbl');
  Object.keys(UI).forEach((k,i)=>{
    if(navLabels[i]){
      // preserve badge spans inside label
      const badge = navLabels[i].querySelector('.badge-count');
      navLabels[i].textContent = UI[k][en?1:0];
      if(badge) navLabels[i].appendChild(badge);
    }
  });

  // 4. All elements with data-ur / data-en
  document.querySelectorAll('[data-ur]').forEach(el=>{
    el.textContent = en ? (el.dataset.en||el.dataset.ur) : el.dataset.ur;
  });

  // 5. Shop name
  applyShopName();

  // 6. Save preference
  localStorage.setItem('sms_lang', en ? 'en' : 'ur');

  // 7. Re-render active screen with new language
  const active = document.querySelector('.screen.active');
  if(active){
    const id = active.id.replace('sc-','');
    if(id==='dash') renderDash();
    else if(id==='customers') renderCustomers();
    else if(id==='alerts') renderAlerts();
    else if(id==='reminders') renderReminders();
    else if(id==='report') renderReport();
    else if(id==='pay') popPaySel();
  }
}

function toggleLang(){
  isUrdu = !isUrdu;
  applyLang();
}

// ══════════════════════════════
//  GAMES TAB — two self-contained puzzle games embedded via base64
//  (UTF-8 safe) into a sandboxed <iframe>, so their own CSS/JS never
//  collides with the main app's styles/classes/ids.
// ══════════════════════════════
function _b64ToUtf8(b64){
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder('utf-8').decode(bytes);
}
const GAME_MOSAIC_B64 = "PCFET0NUWVBFIGh0bWw+CjxodG1sIGxhbmc9InVyIiBkaXI9InJ0bCI+CjxoZWFkPgo8bWV0YSBjaGFyc2V0PSJVVEYtOCI+CjxtZXRhIG5hbWU9InZpZXdwb3J0IiBjb250ZW50PSJ3aWR0aD1kZXZpY2Utd2lkdGgsIGluaXRpYWwtc2NhbGU9MS4wLCBtYXhpbXVtLXNjYWxlPTEuMCwgdXNlci1zY2FsYWJsZT1ubywgdmlld3BvcnQtZml0PWNvdmVyIj4KPHRpdGxlPtmF2YjYstuM2qkg2KjZhNin2qnYsyDigJQgTW9zYWljIEJsb2NrczwvdGl0bGU+CjxzdHlsZT4KICA6cm9vdHsKICAgIC0tYmcxOiMwYzA4MjE7IC0tYmcyOiMxYzEwNDY7IC0tYmczOiMyYTEyNTk7CiAgICAtLXBhbmVsOnJnYmEoMjU1LDI1NSwyNTUsMC4wNTUpOyAtLXBhbmVsLWJyZDpyZ2JhKDI1NSwyNTUsMjU1LDAuMTQpOwogICAgLS1wYW5lbC1icmQtaGk6cmdiYSgyNTUsMjU1LDI1NSwwLjI4KTsKICAgIC0tZ29sZDojZmZkNjVhOyAtLWdvbGQyOiNmZjlhM2M7CiAgICAtLXRleHQ6I2YzZWZmZjsgLS10ZXh0LWRpbTojYjZhY2RkOyAtLXRleHQtZGltMjojOGE3ZmMwOwogICAgLS1kYW5nZXI6I2ZmNTQ3MDsgLS1vazojNGVlNmE2OwogICAgLS1jZWxsOiA0MHB4OwogICAgLS1yYWRpdXM6IDE2cHg7CiAgfQogICp7Ym94LXNpemluZzpib3JkZXItYm94OyAtd2Via2l0LXRhcC1oaWdobGlnaHQtY29sb3I6dHJhbnNwYXJlbnQ7fQogIGh0bWwsYm9keXtoZWlnaHQ6MTAwJTt9CiAgYm9keXsKICAgIG1hcmdpbjowOyBtaW4taGVpZ2h0OjEwMHZoOyBvdmVyZmxvdy14OmhpZGRlbjsKICAgIGZvbnQtZmFtaWx5OidTZWdvZSBVSScsJ1RhaG9tYScsJ05vdG8gTmFzdGFsaXEgVXJkdScsc2Fucy1zZXJpZjsKICAgIGNvbG9yOnZhcigtLXRleHQpOwogICAgYmFja2dyb3VuZDoKICAgICAgcmFkaWFsLWdyYWRpZW50KDExMDBweCA3MDBweCBhdCAxNSUgLTEwJSwgcmdiYSgyNTUsMTU0LDYwLDAuMTYpLCB0cmFuc3BhcmVudCA2MCUpLAogICAgICByYWRpYWwtZ3JhZGllbnQoOTAwcHggNjAwcHggYXQgMTEwJSAxMCUsIHJnYmEoNzgsMjMwLDE2NiwwLjEwKSwgdHJhbnNwYXJlbnQgNTUlKSwKICAgICAgcmFkaWFsLWdyYWRpZW50KDEwMDBweCA4MDBweCBhdCA1MCUgMTIwJSwgcmdiYSgyNTUsODAsMTUwLDAuMTQpLCB0cmFuc3BhcmVudCA1NSUpLAogICAgICBsaW5lYXItZ3JhZGllbnQoMTYwZGVnLCB2YXIoLS1iZzEpLCB2YXIoLS1iZzIpIDU1JSwgdmFyKC0tYmczKSk7CiAgICBiYWNrZ3JvdW5kLWF0dGFjaG1lbnQ6Zml4ZWQ7CiAgICBwb3NpdGlvbjpyZWxhdGl2ZTsKICAgIHVzZXItc2VsZWN0Om5vbmU7CiAgICAtd2Via2l0LXVzZXItc2VsZWN0Om5vbmU7CiAgICB0b3VjaC1hY3Rpb246bm9uZTsKICB9CiAgLyogYW1iaWVudCBtb3NhaWMgdGV4dHVyZSAqLwogIGJvZHk6OmJlZm9yZXsKICAgIGNvbnRlbnQ6Jyc7cG9zaXRpb246Zml4ZWQ7aW5zZXQ6MDtwb2ludGVyLWV2ZW50czpub25lO3otaW5kZXg6MDtvcGFjaXR5Oi41OwogICAgYmFja2dyb3VuZC1pbWFnZToKICAgICAgbGluZWFyLWdyYWRpZW50KDQ1ZGVnLCByZ2JhKDI1NSwyNTUsMjU1LDAuMDI1KSAyNSUsIHRyYW5zcGFyZW50IDI1JSwgdHJhbnNwYXJlbnQgNzUlLCByZ2JhKDI1NSwyNTUsMjU1LDAuMDI1KSA3NSUpLAogICAgICBsaW5lYXItZ3JhZGllbnQoNDVkZWcsIHJnYmEoMjU1LDI1NSwyNTUsMC4wMjUpIDI1JSwgdHJhbnNwYXJlbnQgMjUlLCB0cmFuc3BhcmVudCA3NSUsIHJnYmEoMjU1LDI1NSwyNTUsMC4wMjUpIDc1JSk7CiAgICBiYWNrZ3JvdW5kLXNpemU6MzhweCAzOHB4OwogICAgYmFja2dyb3VuZC1wb3NpdGlvbjowIDAsIDE5cHggMTlweDsKICAgIGFuaW1hdGlvbjogZHJpZnRCZyA0MHMgbGluZWFyIGluZmluaXRlOwogIH0KICBAa2V5ZnJhbWVzIGRyaWZ0Qmd7IHRveyBiYWNrZ3JvdW5kLXBvc2l0aW9uOjM0MHB4IDAsIDM1OXB4IDE5cHg7IH0gfQoKICAjYXBwe3Bvc2l0aW9uOnJlbGF0aXZlOyB6LWluZGV4OjE7IG1pbi1oZWlnaHQ6MTAwdmg7IGRpc3BsYXk6ZmxleDsgZmxleC1kaXJlY3Rpb246Y29sdW1uOyBhbGlnbi1pdGVtczpjZW50ZXI7IHBhZGRpbmc6MThweCAxNHB4IDMwcHg7fQoKICAuc2NyZWVueyB3aWR0aDoxMDAlOyBtYXgtd2lkdGg6NDYwcHg7IGRpc3BsYXk6ZmxleDsgZmxleC1kaXJlY3Rpb246Y29sdW1uOyBhbGlnbi1pdGVtczpjZW50ZXI7IGFuaW1hdGlvbjpmYWRlSW4gLjM1cyBlYXNlOyB9CiAgQGtleWZyYW1lcyBmYWRlSW57IGZyb217b3BhY2l0eTowOyB0cmFuc2Zvcm06dHJhbnNsYXRlWSg4cHgpO30gdG97b3BhY2l0eToxOyB0cmFuc2Zvcm06dHJhbnNsYXRlWSgwKTt9IH0KICAuaGlkZGVueyBkaXNwbGF5Om5vbmUgIWltcG9ydGFudDsgfQoKICAvKiA9PT09PT09PT09PT0gVElUTEUgLyBMT0dPID09PT09PT09PT09PSAqLwogIC5sb2dvLXdyYXB7IHRleHQtYWxpZ246Y2VudGVyOyBtYXJnaW46MThweCAwIDhweDsgcG9zaXRpb246cmVsYXRpdmU7IH0KICAubG9nby1nZW1zeyBmb250LXNpemU6MzRweDsgbGV0dGVyLXNwYWNpbmc6NnB4OyBmaWx0ZXI6ZHJvcC1zaGFkb3coMCA0cHggMThweCByZ2JhKDI1NSwyMTQsOTAsLjQ1KSk7IGFuaW1hdGlvbjpnZW1GbG9hdCAzLjJzIGVhc2UtaW4tb3V0IGluZmluaXRlOyB9CiAgQGtleWZyYW1lcyBnZW1GbG9hdHsgMCUsMTAwJXt0cmFuc2Zvcm06dHJhbnNsYXRlWSgwKTt9IDUwJXt0cmFuc2Zvcm06dHJhbnNsYXRlWSgtNnB4KTt9IH0KICAudGl0bGV7CiAgICBmb250LXNpemU6MzJweDsgZm9udC13ZWlnaHQ6OTAwOyBtYXJnaW46NnB4IDAgMnB4OyBsZXR0ZXItc3BhY2luZzoxcHg7CiAgICBiYWNrZ3JvdW5kOmxpbmVhci1ncmFkaWVudCg5MGRlZywjZmZkNjVhLCNmZjlhM2MgMzUlLCNmZjU0NzAgNjUlLCNjMDg0ZmMpOwogICAgLXdlYmtpdC1iYWNrZ3JvdW5kLWNsaXA6dGV4dDsgYmFja2dyb3VuZC1jbGlwOnRleHQ7IGNvbG9yOnRyYW5zcGFyZW50OwogICAgYmFja2dyb3VuZC1zaXplOjIwMCUgYXV0bzsgYW5pbWF0aW9uOnRpdGxlU2hpbmUgNXMgbGluZWFyIGluZmluaXRlOwogIH0KICBAa2V5ZnJhbWVzIHRpdGxlU2hpbmV7IHRveyBiYWNrZ3JvdW5kLXBvc2l0aW9uOjIwMCUgY2VudGVyOyB9IH0KICAuc3VidGl0bGV7IGZvbnQtc2l6ZToxMi41cHg7IGNvbG9yOnZhcigtLXRleHQtZGltKTsgbGV0dGVyLXNwYWNpbmc6M3B4OyB0ZXh0LXRyYW5zZm9ybTp1cHBlcmNhc2U7IH0KCiAgLyogPT09PT09PT09PT09IEJVVFRPTlMgPT09PT09PT09PT09ICovCiAgLmJ0bnsKICAgIGJvcmRlcjpub25lOyBjdXJzb3I6cG9pbnRlcjsgYm9yZGVyLXJhZGl1czo5OTlweDsgZm9udC13ZWlnaHQ6ODAwOyBmb250LWZhbWlseTppbmhlcml0OwogICAgY29sb3I6IzFhMGUzMzsgcGFkZGluZzoxM3B4IDI2cHg7IGZvbnQtc2l6ZToxNXB4OyBsZXR0ZXItc3BhY2luZzouM3B4OwogICAgYmFja2dyb3VuZDpsaW5lYXItZ3JhZGllbnQoMTM1ZGVnLCNmZmU1OGEsdmFyKC0tZ29sZCkgNDUlLHZhcigtLWdvbGQyKSk7CiAgICBib3gtc2hhZG93OjAgOHB4IDIycHggcmdiYSgyNTUsMTU0LDYwLC4zNSksIDAgMnB4IDAgcmdiYSgyNTUsMjU1LDI1NSwuNSkgaW5zZXQ7CiAgICBkaXNwbGF5OmlubGluZS1mbGV4OyBhbGlnbi1pdGVtczpjZW50ZXI7IGdhcDo4cHg7IHRyYW5zaXRpb246dHJhbnNmb3JtIC4xNXMsIGJveC1zaGFkb3cgLjE1czsKICB9CiAgLmJ0bjphY3RpdmV7IHRyYW5zZm9ybTpzY2FsZSguOTUpOyBib3gtc2hhZG93OjAgM3B4IDEwcHggcmdiYSgyNTUsMTU0LDYwLC4zKSBpbnNldDsgfQogIC5idG4uZ2hvc3R7CiAgICBiYWNrZ3JvdW5kOnZhcigtLXBhbmVsKTsgY29sb3I6dmFyKC0tdGV4dCk7IGJvcmRlcjoxcHggc29saWQgdmFyKC0tcGFuZWwtYnJkKTsKICAgIGJveC1zaGFkb3c6bm9uZTsgZm9udC13ZWlnaHQ6NzAwOwogIH0KICAuYnRuLnNtYWxseyBwYWRkaW5nOjlweCAxNnB4OyBmb250LXNpemU6MTIuNXB4OyB9CiAgLmJ0bi5ibG9ja3sgd2lkdGg6MTAwJTsganVzdGlmeS1jb250ZW50OmNlbnRlcjsgfQogIC5idG46ZGlzYWJsZWR7IG9wYWNpdHk6LjQ1OyBwb2ludGVyLWV2ZW50czpub25lOyB9CgogIC5pY29uYnRuewogICAgd2lkdGg6NDJweDtoZWlnaHQ6NDJweDtib3JkZXItcmFkaXVzOjUwJTsgYm9yZGVyOjFweCBzb2xpZCB2YXIoLS1wYW5lbC1icmQpOyBiYWNrZ3JvdW5kOnZhcigtLXBhbmVsKTsKICAgIGNvbG9yOnZhcigtLXRleHQpOyBkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2p1c3RpZnktY29udGVudDpjZW50ZXI7IGN1cnNvcjpwb2ludGVyOyBmb250LXNpemU6MTdweDsKICAgIHRyYW5zaXRpb246YmFja2dyb3VuZCAuMnMsIHRyYW5zZm9ybSAuMTVzOwogIH0KICAuaWNvbmJ0bjphY3RpdmV7IHRyYW5zZm9ybTpzY2FsZSguOSk7IH0KICAuaWNvbmJ0bi5vbnsgY29sb3I6dmFyKC0tZ29sZCk7IGJvcmRlci1jb2xvcjpyZ2JhKDI1NSwyMTQsOTAsLjUpOyBib3gtc2hhZG93OjAgMCAxNHB4IHJnYmEoMjU1LDIxNCw5MCwuMzUpOyB9CgogIC5tZW51LWFjdGlvbnN7IGRpc3BsYXk6ZmxleDsgZmxleC1kaXJlY3Rpb246Y29sdW1uOyBnYXA6MTJweDsgd2lkdGg6MTAwJTsgbWF4LXdpZHRoOjI4MHB4OyBtYXJnaW4tdG9wOjIycHg7IH0KCiAgLyogPT09PT09PT09PT09IFNUQVQgU1RSSVAgT04gTUVOVSA9PT09PT09PT09PT0gKi8KICAuc3RhdC1zdHJpcHsgZGlzcGxheTpmbGV4OyBnYXA6MTBweDsgbWFyZ2luLXRvcDoyNnB4OyB9CiAgLnN0YXQtY2hpcHsKICAgIGJhY2tncm91bmQ6dmFyKC0tcGFuZWwpOyBib3JkZXI6MXB4IHNvbGlkIHZhcigtLXBhbmVsLWJyZCk7IGJvcmRlci1yYWRpdXM6MTRweDsgcGFkZGluZzoxMHB4IDE2cHg7CiAgICB0ZXh0LWFsaWduOmNlbnRlcjsgbWluLXdpZHRoOjg0cHg7CiAgfQogIC5zdGF0LWNoaXAgYnsgZGlzcGxheTpibG9jazsgZm9udC1zaXplOjE5cHg7IGNvbG9yOnZhcigtLWdvbGQpOyB9CiAgLnN0YXQtY2hpcCBzcGFueyBmb250LXNpemU6MTAuNXB4OyBjb2xvcjp2YXIoLS10ZXh0LWRpbSk7IH0KCiAgLyogPT09PT09PT09PT09IExFVkVMIFNFTEVDVCA9PT09PT09PT09PT0gKi8KICAubHZsLWhlYWRlcnsgZGlzcGxheTpmbGV4OyBhbGlnbi1pdGVtczpjZW50ZXI7IGp1c3RpZnktY29udGVudDpzcGFjZS1iZXR3ZWVuOyB3aWR0aDoxMDAlOyBtYXJnaW4tYm90dG9tOjE0cHg7IH0KICAubHZsLWhlYWRlciBoMnsgZm9udC1zaXplOjE4cHg7IG1hcmdpbjowOyB9CiAgLmx2bC1ncmlkewogICAgZGlzcGxheTpncmlkOyBncmlkLXRlbXBsYXRlLWNvbHVtbnM6cmVwZWF0KDUsMWZyKTsgZ2FwOjEwcHg7IHdpZHRoOjEwMCU7CiAgICBtYXgtaGVpZ2h0OjYydmg7IG92ZXJmbG93LXk6YXV0bzsgcGFkZGluZzo2cHggNHB4IDE2cHg7CiAgfQogIC5sdmwtY2VsbHsKICAgIGFzcGVjdC1yYXRpbzoxOyBib3JkZXItcmFkaXVzOjE0cHg7IGRpc3BsYXk6ZmxleDsgZmxleC1kaXJlY3Rpb246Y29sdW1uOyBhbGlnbi1pdGVtczpjZW50ZXI7IGp1c3RpZnktY29udGVudDpjZW50ZXI7CiAgICBmb250LXdlaWdodDo4MDA7IGZvbnQtc2l6ZToxNXB4OyBjdXJzb3I6cG9pbnRlcjsgcG9zaXRpb246cmVsYXRpdmU7IGJvcmRlcjoxcHggc29saWQgdmFyKC0tcGFuZWwtYnJkKTsKICAgIGJhY2tncm91bmQ6dmFyKC0tcGFuZWwpOyBjb2xvcjp2YXIoLS10ZXh0KTsgdHJhbnNpdGlvbjp0cmFuc2Zvcm0gLjE1czsKICB9CiAgLmx2bC1jZWxsOmFjdGl2ZXsgdHJhbnNmb3JtOnNjYWxlKC45Mik7IH0KICAubHZsLWNlbGwuZG9uZXsKICAgIGJhY2tncm91bmQ6bGluZWFyLWdyYWRpZW50KDE1MGRlZywjM2VlOGIwLCMwZjllNzMpOyBjb2xvcjojMDQyODFjOyBib3JkZXItY29sb3I6cmdiYSgyNTUsMjU1LDI1NSwuMyk7CiAgICBib3gtc2hhZG93OjAgNnB4IDE2cHggcmdiYSg2MiwyMzIsMTc2LC4zNSk7CiAgfQogIC5sdmwtY2VsbC5jdXJyZW50ewogICAgYmFja2dyb3VuZDpsaW5lYXItZ3JhZGllbnQoMTUwZGVnLCNmZmU1OGEsdmFyKC0tZ29sZDIpKTsgY29sb3I6IzNhMjIwMDsgYm9yZGVyLWNvbG9yOnJnYmEoMjU1LDI1NSwyNTUsLjUpOwogICAgYm94LXNoYWRvdzowIDAgMCAzcHggcmdiYSgyNTUsMjE0LDkwLC4yNSksIDAgOHB4IDIwcHggcmdiYSgyNTUsMTU0LDYwLC40KTsKICAgIGFuaW1hdGlvbjpwdWxzZUx2bCAxLjhzIGVhc2UtaW4tb3V0IGluZmluaXRlOwogIH0KICBAa2V5ZnJhbWVzIHB1bHNlTHZseyAwJSwxMDAleyBib3gtc2hhZG93OjAgMCAwIDNweCByZ2JhKDI1NSwyMTQsOTAsLjI1KSwwIDhweCAyMHB4IHJnYmEoMjU1LDE1NCw2MCwuNCk7fSA1MCV7IGJveC1zaGFkb3c6MCAwIDAgN3B4IHJnYmEoMjU1LDIxNCw5MCwuMTIpLDAgOHB4IDI2cHggcmdiYSgyNTUsMTU0LDYwLC41NSk7fSB9CiAgLmx2bC1jZWxsLmxvY2tlZHsgb3BhY2l0eTouMzg7IGN1cnNvcjpkZWZhdWx0OyB9CiAgLmx2bC1jZWxsIC5zdGFyeyBmb250LXNpemU6OXB4OyBtYXJnaW4tdG9wOjJweDsgfQoKICAvKiA9PT09PT09PT09PT0gR0FNRSBTQ1JFRU4gPT09PT09PT09PT09ICovCiAgLmdhbWUtdG9weyBkaXNwbGF5OmZsZXg7IGFsaWduLWl0ZW1zOmNlbnRlcjsganVzdGlmeS1jb250ZW50OnNwYWNlLWJldHdlZW47IHdpZHRoOjEwMCU7IG1hcmdpbi1ib3R0b206MTBweDsgfQogIC5nYW1lLXRvcCAubGVmdCwgLmdhbWUtdG9wIC5yaWdodHsgZGlzcGxheTpmbGV4OyBhbGlnbi1pdGVtczpjZW50ZXI7IGdhcDo4cHg7IH0KICAubHZsLWJhZGdlewogICAgYmFja2dyb3VuZDp2YXIoLS1wYW5lbCk7IGJvcmRlcjoxcHggc29saWQgdmFyKC0tcGFuZWwtYnJkKTsgYm9yZGVyLXJhZGl1czoxMnB4OyBwYWRkaW5nOjdweCAxNHB4OyBmb250LXdlaWdodDo4MDA7IGZvbnQtc2l6ZToxM3B4OwogIH0KICAucHJvZ3Jlc3Mtd3JhcHsgd2lkdGg6MTAwJTsgbWFyZ2luLWJvdHRvbToxMnB4OyB9CiAgLnByb2dyZXNzLWxhYmVsc3sgZGlzcGxheTpmbGV4OyBqdXN0aWZ5LWNvbnRlbnQ6c3BhY2UtYmV0d2VlbjsgZm9udC1zaXplOjExcHg7IGNvbG9yOnZhcigtLXRleHQtZGltKTsgbWFyZ2luLWJvdHRvbTo1cHg7IH0KICAucHJvZ3Jlc3MtdHJhY2t7IGhlaWdodDoxMnB4OyBib3JkZXItcmFkaXVzOjhweDsgYmFja2dyb3VuZDpyZ2JhKDI1NSwyNTUsMjU1LC4wOCk7IGJvcmRlcjoxcHggc29saWQgdmFyKC0tcGFuZWwtYnJkKTsgb3ZlcmZsb3c6aGlkZGVuOyB9CiAgLnByb2dyZXNzLWZpbGx7IGhlaWdodDoxMDAlOyBib3JkZXItcmFkaXVzOjhweDsgYmFja2dyb3VuZDpsaW5lYXItZ3JhZGllbnQoOTBkZWcsI2ZmZDY1YSwjZmY5YTNjLCNmZjU0NzApOyB0cmFuc2l0aW9uOndpZHRoIC40cyBjdWJpYy1iZXppZXIoLjIsLjksLjMsMSk7IGJveC1zaGFkb3c6MCAwIDEycHggcmdiYSgyNTUsMTU0LDYwLC42KTsgfQoKICAvKiBUaGUgZ3JpZC9kcmFnIG1lY2hhbmljcyBhc3N1bWUgc3RhbmRhcmQgbGVmdC10by1yaWdodCBwaXhlbC9jb2x1bW4KICAgICBvcmRlciBmb3IgdGhlIHBvaW50ZXItdG8tY2VsbCBtYXRoLCBzbyB0aGUgaW50ZXJhY3RpdmUgZ2FtZSBhcmVhIGlzCiAgICAgZm9yY2VkIHRvIExUUiByZWdhcmRsZXNzIG9mIHRoZSBwYWdlJ3MgUlRMIFVyZHUgdGV4dCBkaXJlY3Rpb24g4oCUCiAgICAgdGhpcyBhdm9pZHMgQ1NTIEdyaWQgbWlycm9yaW5nIGNvbHVtbnMgdW5kZXIgZGlyPSJydGwiLiAqLwogIC5ib2FyZC13cmFwLCAudHJheXsgZGlyZWN0aW9uOmx0cjsgfQogIC5ib2FyZC13cmFweyBwb3NpdGlvbjpyZWxhdGl2ZTsgcGFkZGluZzoxMHB4OyBib3JkZXItcmFkaXVzOjIycHg7IGJhY2tncm91bmQ6dmFyKC0tcGFuZWwpOyBib3JkZXI6MXB4IHNvbGlkIHZhcigtLXBhbmVsLWJyZCk7CiAgICBib3gtc2hhZG93OjAgMjBweCA1MHB4IHJnYmEoMCwwLDAsLjM1KSwgMCAxcHggMCByZ2JhKDI1NSwyNTUsMjU1LC4wOCkgaW5zZXQ7IH0KICAjYm9hcmR7CiAgICBkaXNwbGF5OmdyaWQ7IGdhcDo0cHg7IHBvc2l0aW9uOnJlbGF0aXZlOyB6LWluZGV4OjE7CiAgICBncmlkLXRlbXBsYXRlLWNvbHVtbnM6cmVwZWF0KDgsIHZhcigtLWNlbGwpKTsgZ3JpZC10ZW1wbGF0ZS1yb3dzOnJlcGVhdCg4LCB2YXIoLS1jZWxsKSk7CiAgfQogIC5jZWxsewogICAgd2lkdGg6dmFyKC0tY2VsbCk7IGhlaWdodDp2YXIoLS1jZWxsKTsgYm9yZGVyLXJhZGl1czo4cHg7IGJhY2tncm91bmQ6cmdiYSgyNTUsMjU1LDI1NSwuMDQ1KTsKICAgIGJvcmRlcjoxcHggc29saWQgcmdiYSgyNTUsMjU1LDI1NSwuMDYpOyBwb3NpdGlvbjpyZWxhdGl2ZTsgb3ZlcmZsb3c6dmlzaWJsZTsKICB9CiAgLmNlbGwuZmlsbGVkeyBib3JkZXI6bm9uZTsgfQogIC5jZWxsIC5nZW17CiAgICBwb3NpdGlvbjphYnNvbHV0ZTsgaW5zZXQ6MnB4OyBib3JkZXItcmFkaXVzOjhweDsKICAgIGJveC1zaGFkb3c6MCAzcHggOHB4IHJnYmEoMCwwLDAsLjM1KSwgMCAxcHggMCByZ2JhKDI1NSwyNTUsMjU1LC4zNSkgaW5zZXQsIDAgLTNweCA2cHggcmdiYSgwLDAsMCwuMTgpIGluc2V0OwogIH0KICAuY2VsbCAuZ2VtOjphZnRlcnsgY29udGVudDonJzsgcG9zaXRpb246YWJzb2x1dGU7IHRvcDo4JTsgbGVmdDoxMiU7IHdpZHRoOjM0JTsgaGVpZ2h0OjIyJTsgYm9yZGVyLXJhZGl1czo1MCU7IGJhY2tncm91bmQ6cmdiYSgyNTUsMjU1LDI1NSwuNTUpOyBmaWx0ZXI6Ymx1cigxLjVweCk7IH0KICAuY2VsbC5wcmV2aWV3LW9reyBiYWNrZ3JvdW5kOnJnYmEoNzgsMjMwLDE2NiwuMjgpOyBib3gtc2hhZG93OjAgMCAwIDJweCByZ2JhKDc4LDIzMCwxNjYsLjYpIGluc2V0OyB9CiAgLmNlbGwucHJldmlldy1iYWR7IGJhY2tncm91bmQ6cmdiYSgyNTUsODQsMTEyLC4yNCk7IGJveC1zaGFkb3c6MCAwIDAgMnB4IHJnYmEoMjU1LDg0LDExMiwuNTUpIGluc2V0OyB9CiAgLmNlbGwuY2xlYXJpbmd7IGFuaW1hdGlvbjpjZWxsUG9wIC4zOHMgZWFzZSBmb3J3YXJkczsgfQogIEBrZXlmcmFtZXMgY2VsbFBvcHsgMCV7IHRyYW5zZm9ybTpzY2FsZSgxKTsgZmlsdGVyOmJyaWdodG5lc3MoMSk7fSA0MCV7IHRyYW5zZm9ybTpzY2FsZSgxLjE4KTsgZmlsdGVyOmJyaWdodG5lc3MoMS44KTt9IDEwMCV7IHRyYW5zZm9ybTpzY2FsZSguMik7IGZpbHRlcjpicmlnaHRuZXNzKDIuNCk7IG9wYWNpdHk6MDt9IH0KCiAgLmJlYW17IHBvc2l0aW9uOmFic29sdXRlOyB6LWluZGV4OjI7IHBvaW50ZXItZXZlbnRzOm5vbmU7IGJhY2tncm91bmQ6bGluZWFyLWdyYWRpZW50KDkwZGVnLCB0cmFuc3BhcmVudCwgcmdiYSgyNTUsMjU1LDI1NSwuOSksIHRyYW5zcGFyZW50KTsgb3BhY2l0eTowOyB9CiAgLmJlYW0uZ297IGFuaW1hdGlvbjpiZWFtU3dlZXAgLjVzIGVhc2UgZm9yd2FyZHM7IH0KICBAa2V5ZnJhbWVzIGJlYW1Td2VlcHsgMCV7IG9wYWNpdHk6MDt9IDE1JXsgb3BhY2l0eToxO30gMTAwJXsgb3BhY2l0eTowO30gfQoKICAuc2hhcmR7IHBvc2l0aW9uOmZpeGVkOyB6LWluZGV4OjUwOyBwb2ludGVyLWV2ZW50czpub25lOyBib3JkZXItcmFkaXVzOjNweDsgfQoKICAvKiA9PT09PT09PT09PT0gVFJBWSA9PT09PT09PT09PT0gKi8KICAudHJheXsgZGlzcGxheTpmbGV4OyBqdXN0aWZ5LWNvbnRlbnQ6c3BhY2UtYXJvdW5kOyBhbGlnbi1pdGVtczpjZW50ZXI7IHdpZHRoOjEwMCU7IG1heC13aWR0aDo0MDBweDsgbWFyZ2luLXRvcDoyMHB4OyBnYXA6OHB4OyBtaW4taGVpZ2h0Ojk2cHg7IH0KICAudHJheS1zbG90eyBmbGV4OjE7IGRpc3BsYXk6ZmxleDsgYWxpZ24taXRlbXM6Y2VudGVyOyBqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyOyBtaW4taGVpZ2h0OjkwcHg7IGJvcmRlci1yYWRpdXM6MTRweDsgcG9zaXRpb246cmVsYXRpdmU7IH0KICAudHJheS1zbG90LmVtcHR5OjphZnRlcnsgY29udGVudDonJzsgfQogIC5waWVjZXsgZGlzcGxheTpncmlkOyBjdXJzb3I6Z3JhYjsgdG91Y2gtYWN0aW9uOm5vbmU7IH0KICAucGllY2UgLnBjeyBib3JkZXItcmFkaXVzOjZweDsgYm94LXNoYWRvdzowIDNweCA3cHggcmdiYSgwLDAsMCwuMzUpLCAwIDFweCAwIHJnYmEoMjU1LDI1NSwyNTUsLjM1KSBpbnNldDsgfQogIC5waWVjZS5kcmFnZ2luZ3sgb3BhY2l0eTouMjU7IH0KCiAgLmRyYWctZ2hvc3R7IHBvc2l0aW9uOmZpeGVkOyB6LWluZGV4OjEwMDsgcG9pbnRlci1ldmVudHM6bm9uZTsgZGlzcGxheTpncmlkOyBkaXJlY3Rpb246bHRyOyB9CiAgLmRyYWctZ2hvc3QgLnBjeyBib3JkZXItcmFkaXVzOjdweDsgYm94LXNoYWRvdzowIDZweCAxNHB4IHJnYmEoMCwwLDAsLjQpLCAwIDFweCAwIHJnYmEoMjU1LDI1NSwyNTUsLjQpIGluc2V0OyB9CgogIC5zY29yZS1mbHl7IHBvc2l0aW9uOmZpeGVkOyB6LWluZGV4OjYwOyBwb2ludGVyLWV2ZW50czpub25lOyBmb250LXdlaWdodDo5MDA7IGNvbG9yOnZhcigtLWdvbGQpOyB0ZXh0LXNoYWRvdzowIDJweCA4cHggcmdiYSgwLDAsMCwuNSk7IGFuaW1hdGlvbjpmbHlVcCAxcyBlYXNlIGZvcndhcmRzOyB9CiAgQGtleWZyYW1lcyBmbHlVcHsgMCV7IG9wYWNpdHk6MTsgdHJhbnNmb3JtOnRyYW5zbGF0ZVkoMCkgc2NhbGUoMSk7fSAxMDAleyBvcGFjaXR5OjA7IHRyYW5zZm9ybTp0cmFuc2xhdGVZKC01MHB4KSBzY2FsZSgxLjMpO30gfQoKICAvKiA9PT09PT09PT09PT0gT1ZFUkxBWVMgPT09PT09PT09PT09ICovCiAgLm92ZXJsYXl7IHBvc2l0aW9uOmZpeGVkOyBpbnNldDowOyB6LWluZGV4OjgwOyBkaXNwbGF5OmZsZXg7IGFsaWduLWl0ZW1zOmNlbnRlcjsganVzdGlmeS1jb250ZW50OmNlbnRlcjsgYmFja2dyb3VuZDpyZ2JhKDgsNCwyMCwuNzIpOyBiYWNrZHJvcC1maWx0ZXI6Ymx1cig2cHgpOyBhbmltYXRpb246ZmFkZUluIC4yNXMgZWFzZTsgfQogIC5vdmVybGF5LWNhcmR7CiAgICB3aWR0aDo4OCU7IG1heC13aWR0aDozNDBweDsgYm9yZGVyLXJhZGl1czoyNHB4OyBwYWRkaW5nOjMwcHggMjRweDsgdGV4dC1hbGlnbjpjZW50ZXI7CiAgICBiYWNrZ3JvdW5kOmxpbmVhci1ncmFkaWVudCgxNjVkZWcsIHJnYmEoNDAsMjAsODAsLjk1KSwgcmdiYSgyMCwxMCw0NSwuOTcpKTsKICAgIGJvcmRlcjoxcHggc29saWQgdmFyKC0tcGFuZWwtYnJkLWhpKTsgYm94LXNoYWRvdzowIDMwcHggODBweCByZ2JhKDAsMCwwLC41KTsKICAgIGFuaW1hdGlvbjpjYXJkUG9wIC40cyBjdWJpYy1iZXppZXIoLjIsLjksLjI1LDEuMyk7CiAgfQogIEBrZXlmcmFtZXMgY2FyZFBvcHsgZnJvbXsgdHJhbnNmb3JtOnNjYWxlKC44KTsgb3BhY2l0eTowO30gdG97IHRyYW5zZm9ybTpzY2FsZSgxKTsgb3BhY2l0eToxO30gfQogIC5vdmVybGF5LWljb257IGZvbnQtc2l6ZTo1MnB4OyBtYXJnaW4tYm90dG9tOjhweDsgZmlsdGVyOmRyb3Atc2hhZG93KDAgNnB4IDE4cHggcmdiYSgyNTUsMjE0LDkwLC41KSk7IH0KICAub3ZlcmxheS10aXRsZXsgZm9udC1zaXplOjIycHg7IGZvbnQtd2VpZ2h0OjkwMDsgbWFyZ2luLWJvdHRvbTo2cHg7IH0KICAub3ZlcmxheS1zdWJ7IGZvbnQtc2l6ZToxM3B4OyBjb2xvcjp2YXIoLS10ZXh0LWRpbSk7IG1hcmdpbi1ib3R0b206MThweDsgfQogIC5vdmVybGF5LXNjb3JleyBmb250LXNpemU6MzBweDsgZm9udC13ZWlnaHQ6OTAwOyBjb2xvcjp2YXIoLS1nb2xkKTsgbWFyZ2luLWJvdHRvbTo0cHg7IH0KICAub3ZlcmxheS1idG5zeyBkaXNwbGF5OmZsZXg7IGZsZXgtZGlyZWN0aW9uOmNvbHVtbjsgZ2FwOjEwcHg7IG1hcmdpbi10b3A6MTZweDsgfQoKICAuY29uZmV0dGl7IHBvc2l0aW9uOmZpeGVkOyB6LWluZGV4OjgxOyB0b3A6LTEwcHg7IGJvcmRlci1yYWRpdXM6MnB4OyBwb2ludGVyLWV2ZW50czpub25lOyB9CgogIDo6LXdlYmtpdC1zY3JvbGxiYXJ7IHdpZHRoOjZweDsgfQogIDo6LXdlYmtpdC1zY3JvbGxiYXItdGh1bWJ7IGJhY2tncm91bmQ6cmdiYSgyNTUsMjU1LDI1NSwuMik7IGJvcmRlci1yYWRpdXM6NHB4OyB9CgogIEBtZWRpYSAobWF4LXdpZHRoOjM4MHB4KXsKICAgIDpyb290eyAtLWNlbGw6MzRweDsgfQogICAgLnRpdGxleyBmb250LXNpemU6MjZweDsgfQogIH0KPC9zdHlsZT4KPC9oZWFkPgo8Ym9keT4KPGRpdiBpZD0iYXBwIj4KCiAgPCEtLSA9PT09PT09PT09PT09PT09PSBNRU5VID09PT09PT09PT09PT09PT09IC0tPgogIDxkaXYgY2xhc3M9InNjcmVlbiIgaWQ9InNjci1tZW51Ij4KICAgIDxkaXYgY2xhc3M9ImxvZ28td3JhcCI+CiAgICAgIDxkaXYgY2xhc3M9ImxvZ28tZ2VtcyI+8J+SjvCflLfwn5Ka8J+UtvCfkpw8L2Rpdj4KICAgICAgPGRpdiBjbGFzcz0idGl0bGUiPtmF2YjYstuM2qkg2KjZhNin2qnYszwvZGl2PgogICAgICA8ZGl2IGNsYXNzPSJzdWJ0aXRsZSI+TU9TQUlDIEJMT0NLUzwvZGl2PgogICAgPC9kaXY+CgogICAgPGRpdiBjbGFzcz0ic3RhdC1zdHJpcCI+CiAgICAgIDxkaXYgY2xhc3M9InN0YXQtY2hpcCI+PGIgaWQ9InN0YXQtbGV2ZWwiPjE8L2I+PHNwYW4+2YXZiNis2YjYr9uBINmE24zZiNmEPC9zcGFuPjwvZGl2PgogICAgICA8ZGl2IGNsYXNzPSJzdGF0LWNoaXAiPjxiIGlkPSJzdGF0LXN0YXJzIj4wPC9iPjxzcGFuPuKtkCDYs9iq2KfYsduSPC9zcGFuPjwvZGl2PgogICAgICA8ZGl2IGNsYXNzPSJzdGF0LWNoaXAiPjxiIGlkPSJzdGF0LWJlc3QiPjA8L2I+PHNwYW4+2Kjbgdiq2LHbjNmGINin2LPaqdmI2LE8L3NwYW4+PC9kaXY+CiAgICA8L2Rpdj4KCiAgICA8ZGl2IGNsYXNzPSJtZW51LWFjdGlvbnMiPgogICAgICA8YnV0dG9uIGNsYXNzPSJidG4gYmxvY2siIGlkPSJidG4tY29udGludWUiPjxzcGFuPuKWtu+4jzwvc3Bhbj4g2qnavtuM2YTZhtinINis2KfYsduMINix2qnavtuM2ro8L2J1dHRvbj4KICAgICAgPGJ1dHRvbiBjbGFzcz0iYnRuIGdob3N0IGJsb2NrIiBpZD0iYnRuLWxldmVscyI+PHNwYW4+8J+Xuu+4jzwvc3Bhbj4g2YTbjNmI2YQg2YXZhtiq2K7YqCDaqdix24zaujwvYnV0dG9uPgogICAgICA8YnV0dG9uIGNsYXNzPSJidG4gZ2hvc3QgYmxvY2siIGlkPSJidG4tcmVzdGFydC1wcm9ncmVzcyI+PHNwYW4+8J+UhDwvc3Bhbj4g2b7bjNi0INix2YHYqiDYr9mI2KjYp9ix24Eg2LTYsdmI2Lkg2qnYsduM2ro8L2J1dHRvbj4KICAgIDwvZGl2PgoKICAgIDxkaXYgc3R5bGU9Im1hcmdpbi10b3A6MjBweDsiPgogICAgICA8YnV0dG9uIGNsYXNzPSJpY29uYnRuIiBpZD0iYnRuLXNvdW5kLW1lbnUiPvCflIo8L2J1dHRvbj4KICAgIDwvZGl2PgogIDwvZGl2PgoKICA8IS0tID09PT09PT09PT09PT09PT09IExFVkVMIFNFTEVDVCA9PT09PT09PT09PT09PT09PSAtLT4KICA8ZGl2IGNsYXNzPSJzY3JlZW4gaGlkZGVuIiBpZD0ic2NyLWxldmVscyI+CiAgICA8ZGl2IGNsYXNzPSJsdmwtaGVhZGVyIj4KICAgICAgPGJ1dHRvbiBjbGFzcz0iaWNvbmJ0biIgaWQ9ImJ0bi1sZXZlbHMtYmFjayI+4p6h77iPPC9idXR0b24+CiAgICAgIDxoMj7ZhNuM2YjZhCDZhdmG2KrYrtioINqp2LHbjNq6PC9oMj4KICAgICAgPGRpdiBzdHlsZT0id2lkdGg6NDJweDsiPjwvZGl2PgogICAgPC9kaXY+CiAgICA8ZGl2IGNsYXNzPSJsdmwtZ3JpZCIgaWQ9Imx2bC1ncmlkIj48L2Rpdj4KICA8L2Rpdj4KCiAgPCEtLSA9PT09PT09PT09PT09PT09PSBHQU1FID09PT09PT09PT09PT09PT09IC0tPgogIDxkaXYgY2xhc3M9InNjcmVlbiBoaWRkZW4iIGlkPSJzY3ItZ2FtZSI+CiAgICA8ZGl2IGNsYXNzPSJnYW1lLXRvcCI+CiAgICAgIDxkaXYgY2xhc3M9InJpZ2h0Ij4KICAgICAgICA8YnV0dG9uIGNsYXNzPSJpY29uYnRuIiBpZD0iYnRuLWdhbWUtYmFjayI+4p6h77iPPC9idXR0b24+CiAgICAgICAgPGRpdiBjbGFzcz0ibHZsLWJhZGdlIj7ZhNuM2YjZhCA8c3BhbiBpZD0iZ2FtZS1sZXZlbCI+MTwvc3Bhbj48L2Rpdj4KICAgICAgPC9kaXY+CiAgICAgIDxkaXYgY2xhc3M9ImxlZnQiPgogICAgICAgIDxidXR0b24gY2xhc3M9Imljb25idG4iIGlkPSJidG4tc291bmQtZ2FtZSI+8J+UijwvYnV0dG9uPgogICAgICAgIDxidXR0b24gY2xhc3M9Imljb25idG4iIGlkPSJidG4tcmVzdGFydC1sZXZlbCI+8J+UgTwvYnV0dG9uPgogICAgICA8L2Rpdj4KICAgIDwvZGl2PgoKICAgIDxkaXYgY2xhc3M9InByb2dyZXNzLXdyYXAiPgogICAgICA8ZGl2IGNsYXNzPSJwcm9ncmVzcy1sYWJlbHMiPgogICAgICAgIDxzcGFuIGlkPSJzY29yZS1sYWJlbCI+2KfYs9qp2YjYsTogMDwvc3Bhbj4KICAgICAgICA8c3BhbiBpZD0idGFyZ2V0LWxhYmVsIj7bgdiv2YE6IDMwMDwvc3Bhbj4KICAgICAgPC9kaXY+CiAgICAgIDxkaXYgY2xhc3M9InByb2dyZXNzLXRyYWNrIj48ZGl2IGNsYXNzPSJwcm9ncmVzcy1maWxsIiBpZD0icHJvZ3Jlc3MtZmlsbCIgc3R5bGU9IndpZHRoOjAlIj48L2Rpdj48L2Rpdj4KICAgIDwvZGl2PgoKICAgIDxkaXYgY2xhc3M9ImJvYXJkLXdyYXAiPgogICAgICA8ZGl2IGlkPSJib2FyZCI+PC9kaXY+CiAgICA8L2Rpdj4KCiAgICA8ZGl2IGNsYXNzPSJ0cmF5IiBpZD0idHJheSI+PC9kaXY+CiAgPC9kaXY+Cgo8L2Rpdj4KCjxzY3JpcHQ+CihmdW5jdGlvbigpewoidXNlIHN0cmljdCI7CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAgQ09ORklHCj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpjb25zdCBTSVpFID0gODsKY29uc3QgTEVWRUxfQ09VTlQgPSA1MDsKY29uc3QgU1RPUkVfS0VZID0gJ21vc2FpY2Jsb2Nrczpwcm9ncmVzcyc7Cgpjb25zdCBDT0xPUlMgPSBbCiAge2E6JyNmZjhhOWMnLCBiOicjZTkxZTYzJywgZ2xvdzoncmdiYSgyMzMsMzAsOTksLjU1KSd9LCAgIC8vIHJ1YnkKICB7YTonIzVhZDBmZicsIGI6JyMxNTY1YzAnLCBnbG93OidyZ2JhKDIxLDEwMSwxOTIsLjU1KSd9LCAgLy8gc2FwcGhpcmUKICB7YTonIzdiZjBiMCcsIGI6JyMwZjllNzMnLCBnbG93OidyZ2JhKDE1LDE1OCwxMTUsLjU1KSd9LCAgLy8gZW1lcmFsZAogIHthOicjZmZkNjZiJywgYjonI2ZmOGEwMCcsIGdsb3c6J3JnYmEoMjU1LDEzOCwwLC41NSknfSwgICAvLyBhbWJlcgogIHthOicjZDU5YmZmJywgYjonIzdjM2FlZCcsIGdsb3c6J3JnYmEoMTI0LDU4LDIzNywuNTUpJ30sICAvLyBhbWV0aHlzdAogIHthOicjZmZiM2Q5JywgYjonI2Q2MzM2YycsIGdsb3c6J3JnYmEoMjE0LDUxLDEwOCwuNTUpJ30sICAvLyByb3NlCiAge2E6JyM3ZmU5ZGYnLCBiOicjMGY5ZTllJywgZ2xvdzoncmdiYSgxNSwxNTgsMTU4LC41NSknfSwgIC8vIHRlYWwKICB7YTonI2ZmZTA4YScsIGI6JyNmMmI3MDUnLCBnbG93OidyZ2JhKDI0MiwxODMsNSwuNTUpJ30sICAgLy8gdG9wYXoKXTsKCi8vIFBpZWNlIHNoYXBlcyBhcyBbcm93LGNvbF0gb2Zmc2V0cyBmcm9tIHRvcC1sZWZ0IG9mIGJvdW5kaW5nIGJveC4KY29uc3QgU0hBUEVTID0gWwogIFtbMCwwXV0sCiAgW1swLDBdLFswLDFdXSwKICBbWzAsMF0sWzEsMF1dLAogIFtbMCwwXSxbMCwxXSxbMCwyXV0sCiAgW1swLDBdLFsxLDBdLFsyLDBdXSwKICBbWzAsMF0sWzAsMV0sWzAsMl0sWzAsM11dLAogIFtbMCwwXSxbMSwwXSxbMiwwXSxbMywwXV0sCiAgW1swLDBdLFswLDFdLFsxLDBdLFsxLDFdXSwKICBbWzAsMF0sWzEsMF0sWzIsMF0sWzIsMV1dLAogIFtbMCwxXSxbMSwxXSxbMiwxXSxbMiwwXV0sCiAgW1swLDBdLFswLDFdLFswLDJdLFsxLDBdXSwKICBbWzAsMF0sWzAsMV0sWzAsMl0sWzEsMl1dLAogIFtbMCwwXSxbMSwwXSxbMSwxXSxbMSwyXV0sCiAgW1swLDJdLFsxLDBdLFsxLDFdLFsxLDJdXSwKICBbWzAsMF0sWzAsMV0sWzAsMl0sWzEsMV1dLAogIFtbMCwxXSxbMSwwXSxbMSwxXSxbMSwyXV0sCiAgW1swLDFdLFswLDJdLFsxLDBdLFsxLDFdXSwKICBbWzAsMF0sWzAsMV0sWzEsMV0sWzEsMl1dLAogIFtbMCwxXSxbMSwwXSxbMSwxXSxbMSwyXSxbMiwxXV0sCiAgW1swLDBdLFswLDFdLFsxLDBdXSwKICBbWzAsMF0sWzAsMV0sWzEsMV1dLAogIFtbMCwwXSxbMSwwXSxbMSwxXV0sCiAgW1swLDFdLFsxLDBdLFsxLDFdXSwKICBbWzAsMF0sWzAsMV0sWzAsMl0sWzEsMF0sWzEsMV0sWzEsMl1dLApdOwoKZnVuY3Rpb24gdGFyZ2V0Rm9yTGV2ZWwobHZsKXsKICByZXR1cm4gTWF0aC5yb3VuZCgoMjYwICsgKGx2bC0xKSoxMzUpIC8gMTApICogMTA7Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICBQRVJTSVNURU5UIFNUT1JBR0UgKGxvY2FsU3RvcmFnZSDigJQgdGhpcyBnYW1lIHJ1bnMgZW1iZWRkZWQgaW5zaWRlCiAgIHRoZSBpbnN0YWxsbWVudCBhcHAsIHdoaWNoIHJlbGllcyBvbiBsb2NhbFN0b3JhZ2UgdGhyb3VnaG91dDsKICAgZmFsbHMgYmFjayB0byBpbi1tZW1vcnkgcHJvZ3Jlc3MgaWYgc3RvcmFnZSBpcyBldmVyIHVuYXZhaWxhYmxlKQo9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KbGV0IHByb2dyZXNzID0geyB1bmxvY2tlZDoxLCBzdGFyczp7fSwgYmVzdDp7fSwgc291bmRPbjp0cnVlIH07CmFzeW5jIGZ1bmN0aW9uIGxvYWRQcm9ncmVzcygpewogIHRyeXsKICAgIGNvbnN0IHJhdyA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKFNUT1JFX0tFWSk7CiAgICBpZihyYXcpeyBwcm9ncmVzcyA9IE9iamVjdC5hc3NpZ24ocHJvZ3Jlc3MsIEpTT04ucGFyc2UocmF3KSk7IH0KICB9Y2F0Y2goZSl7IC8qIGZpcnN0IHJ1biBvciBzdG9yYWdlIHVuYXZhaWxhYmxlIOKAlCB1c2UgZGVmYXVsdHMgKi8gfQogIHJlbmRlck1lbnVTdGF0cygpOwp9CmFzeW5jIGZ1bmN0aW9uIHNhdmVQcm9ncmVzcygpewogIHRyeXsgbG9jYWxTdG9yYWdlLnNldEl0ZW0oU1RPUkVfS0VZLCBKU09OLnN0cmluZ2lmeShwcm9ncmVzcykpOyB9Y2F0Y2goZSl7fQp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAgU09VTkQgKFdlYiBBdWRpbyDigJQgcHJvY2VkdXJhbGx5IGdlbmVyYXRlZCwgbm8gYXNzZXRzIG5lZWRlZCkKPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCmxldCBhY3R4ID0gbnVsbDsKZnVuY3Rpb24gZW5zdXJlQXVkaW8oKXsKICBpZighYWN0eCl7CiAgICB0cnl7IGFjdHggPSBuZXcgKHdpbmRvdy5BdWRpb0NvbnRleHR8fHdpbmRvdy53ZWJraXRBdWRpb0NvbnRleHQpKCk7IH1jYXRjaChlKXsgYWN0eD1udWxsOyB9CiAgfQogIGlmKGFjdHggJiYgYWN0eC5zdGF0ZSA9PT0gJ3N1c3BlbmRlZCcpIGFjdHgucmVzdW1lKCk7Cn0KZnVuY3Rpb24gdG9uZShmcmVxLCBzdGFydCwgZHVyLCB0eXBlLCB2b2wpewogIGlmKCFwcm9ncmVzcy5zb3VuZE9uIHx8ICFhY3R4KSByZXR1cm47CiAgY29uc3QgdDAgPSBhY3R4LmN1cnJlbnRUaW1lICsgc3RhcnQ7CiAgY29uc3Qgb3NjID0gYWN0eC5jcmVhdGVPc2NpbGxhdG9yKCk7CiAgY29uc3QgZ2FpbiA9IGFjdHguY3JlYXRlR2FpbigpOwogIG9zYy50eXBlID0gdHlwZSB8fCAnc2luZSc7CiAgb3NjLmZyZXF1ZW5jeS5zZXRWYWx1ZUF0VGltZShmcmVxLCB0MCk7CiAgZ2Fpbi5nYWluLnNldFZhbHVlQXRUaW1lKDAsIHQwKTsKICBnYWluLmdhaW4ubGluZWFyUmFtcFRvVmFsdWVBdFRpbWUodm9sIT1udWxsP3ZvbDowLjE4LCB0MCswLjAxMik7CiAgZ2Fpbi5nYWluLmV4cG9uZW50aWFsUmFtcFRvVmFsdWVBdFRpbWUoMC4wMDEsIHQwK2R1cik7CiAgb3NjLmNvbm5lY3QoZ2Fpbik7IGdhaW4uY29ubmVjdChhY3R4LmRlc3RpbmF0aW9uKTsKICBvc2Muc3RhcnQodDApOyBvc2Muc3RvcCh0MCtkdXIrMC4wMik7Cn0KY29uc3QgU05EID0gewogIHBsYWNlKCl7IHRvbmUoMzYwLDAsLjA5LCd0cmlhbmdsZScsMC4xNCk7IH0sCiAgaW52YWxpZCgpeyB0b25lKDE0MCwwLC4xMiwnc3F1YXJlJywwLjEwKTsgfSwKICBjbGVhcihuKXsKICAgIGNvbnN0IG5vdGVzPVs1MjMsNjU5LDc4NCw5ODgsMTE3NSwxNTY4XTsKICAgIGZvcihsZXQgaT0wO2k8TWF0aC5taW4obixub3Rlcy5sZW5ndGgpO2krKykgdG9uZShub3Rlc1tpXSwgaSowLjA1LCAuMjIsJ3NpbmUnLDAuMTYpOwogIH0sCiAgbGV2ZWxVcCgpeyBbNTIzLDY1OSw3ODQsMTA0NywxMzE5XS5mb3JFYWNoKChmLGkpPT50b25lKGYsIGkqMC4wOSwgLjM1LCd0cmlhbmdsZScsMC4xOCkpOyB9LAogIGdhbWVPdmVyKCl7IFs0MDAsMzQwLDI4MCwyMjBdLmZvckVhY2goKGYsaSk9PnRvbmUoZiwgaSowLjEzLCAuMywnc2F3dG9vdGgnLDAuMTMpKTsgfSwKICBjbGljaygpeyB0b25lKDYwMCwwLC4wNSwnc3F1YXJlJywwLjA4KTsgfSwKfTsKCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICBTVEFURQo9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KbGV0IGJvYXJkID0gW107ICAgICAgIC8vIFNJWkUgeCBTSVpFIC0+IG51bGwgfCB7YSxiLGdsb3d9CmxldCB0cmF5ID0gW251bGwsbnVsbCxudWxsXTsKbGV0IHNjb3JlID0gMCwgdGFyZ2V0ID0gMzAwLCBjdXJMZXZlbCA9IDE7CmxldCBkcmFnU3RhdGUgPSBudWxsOwpsZXQgYm9hcmRFbCwgdHJheUVsOwoKZnVuY3Rpb24gZW1wdHlCb2FyZCgpewogIGNvbnN0IGIgPSBbXTsKICBmb3IobGV0IHI9MDtyPFNJWkU7cisrKXsgYi5wdXNoKG5ldyBBcnJheShTSVpFKS5maWxsKG51bGwpKTsgfQogIHJldHVybiBiOwp9CgpmdW5jdGlvbiByYW5kb21TaGFwZSgpewogIGNvbnN0IHNoYXBlID0gU0hBUEVTW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSpTSEFQRVMubGVuZ3RoKV07CiAgY29uc3QgY29sb3IgPSBDT0xPUlNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKkNPTE9SUy5sZW5ndGgpXTsKICByZXR1cm4geyBzaGFwZSwgY29sb3IsIGlkOiBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zbGljZSgyKSB9Owp9CgpmdW5jdGlvbiByZWZpbGxUcmF5KCl7CiAgZm9yKGxldCBpPTA7aTwzO2krKyl7IGlmKCF0cmF5W2ldKSB0cmF5W2ldID0gcmFuZG9tU2hhcGUoKTsgfQp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAgU0NSRUVOIE5BVklHQVRJT04KPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCmNvbnN0IHNjcmVlbnMgPSB7IG1lbnU6J3Njci1tZW51JywgbGV2ZWxzOidzY3ItbGV2ZWxzJywgZ2FtZTonc2NyLWdhbWUnIH07CmZ1bmN0aW9uIHNob3dTY3JlZW4obmFtZSl7CiAgT2JqZWN0LnZhbHVlcyhzY3JlZW5zKS5mb3JFYWNoKGlkPT5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCkuY2xhc3NMaXN0LmFkZCgnaGlkZGVuJykpOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHNjcmVlbnNbbmFtZV0pLmNsYXNzTGlzdC5yZW1vdmUoJ2hpZGRlbicpOwp9CgpmdW5jdGlvbiByZW5kZXJNZW51U3RhdHMoKXsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc3RhdC1sZXZlbCcpLnRleHRDb250ZW50ID0gcHJvZ3Jlc3MudW5sb2NrZWQ7CiAgY29uc3Qgc3RhclRvdGFsID0gT2JqZWN0LnZhbHVlcyhwcm9ncmVzcy5zdGFycykucmVkdWNlKChhLGIpPT5hK2IsMCk7CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3N0YXQtc3RhcnMnKS50ZXh0Q29udGVudCA9IHN0YXJUb3RhbDsKICBjb25zdCBiZXN0VG90YWwgPSBPYmplY3QudmFsdWVzKHByb2dyZXNzLmJlc3QpLnJlZHVjZSgoYSxiKT0+TWF0aC5tYXgoYSxiKSwwKTsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc3RhdC1iZXN0JykudGV4dENvbnRlbnQgPSBiZXN0VG90YWw7CiAgdXBkYXRlU291bmRJY29ucygpOwp9CmZ1bmN0aW9uIHVwZGF0ZVNvdW5kSWNvbnMoKXsKICBjb25zdCBpY29uID0gcHJvZ3Jlc3Muc291bmRPbiA/ICfwn5SKJyA6ICfwn5SIJzsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYnRuLXNvdW5kLW1lbnUnKS50ZXh0Q29udGVudCA9IGljb247CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2J0bi1zb3VuZC1nYW1lJykudGV4dENvbnRlbnQgPSBpY29uOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdidG4tc291bmQtbWVudScpLmNsYXNzTGlzdC50b2dnbGUoJ29uJywgcHJvZ3Jlc3Muc291bmRPbik7CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2J0bi1zb3VuZC1nYW1lJykuY2xhc3NMaXN0LnRvZ2dsZSgnb24nLCBwcm9ncmVzcy5zb3VuZE9uKTsKfQoKZnVuY3Rpb24gcmVuZGVyTGV2ZWxHcmlkKCl7CiAgY29uc3QgZ3JpZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsdmwtZ3JpZCcpOwogIGdyaWQuaW5uZXJIVE1MID0gJyc7CiAgZm9yKGxldCBpPTE7aTw9TEVWRUxfQ09VTlQ7aSsrKXsKICAgIGNvbnN0IGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpOwogICAgY29uc3QgZG9uZSA9ICEhcHJvZ3Jlc3Muc3RhcnNbaV07CiAgICBjb25zdCBsb2NrZWQgPSBpID4gcHJvZ3Jlc3MudW5sb2NrZWQ7CiAgICBkaXYuY2xhc3NOYW1lID0gJ2x2bC1jZWxsICcgKyAobG9ja2VkPydsb2NrZWQnOihkb25lPydkb25lJzooaT09PXByb2dyZXNzLnVubG9ja2VkPydjdXJyZW50JzonJykpKTsKICAgIGRpdi5pbm5lckhUTUwgPSBgPGRpdj4ke2l9PC9kaXY+YCArIChkb25lP2A8ZGl2IGNsYXNzPSJzdGFyIj4keyfirZAnLnJlcGVhdChwcm9ncmVzcy5zdGFyc1tpXSl9PC9kaXY+YDonJyk7CiAgICBpZighbG9ja2VkKXsKICAgICAgZGl2LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCk9PnsgU05ELmNsaWNrKCk7IHN0YXJ0TGV2ZWwoaSk7IH0pOwogICAgfQogICAgZ3JpZC5hcHBlbmRDaGlsZChkaXYpOwogIH0KfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIEdBTUUgU1RBUlQgLyBMRVZFTCBMT0dJQwo9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KZnVuY3Rpb24gc3RhcnRMZXZlbChsdmwpewogIGN1ckxldmVsID0gbHZsOwogIHRhcmdldCA9IHRhcmdldEZvckxldmVsKGx2bCk7CiAgc2NvcmUgPSAwOwogIGJvYXJkID0gZW1wdHlCb2FyZCgpOwogIHRyYXkgPSBbbnVsbCxudWxsLG51bGxdOwogIHJlZmlsbFRyYXkoKTsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZ2FtZS1sZXZlbCcpLnRleHRDb250ZW50ID0gbHZsOwogIHVwZGF0ZUh1ZCgpOwogIHJlbmRlckJvYXJkKCk7CiAgcmVuZGVyVHJheSgpOwogIHNob3dTY3JlZW4oJ2dhbWUnKTsKfQoKZnVuY3Rpb24gdXBkYXRlSHVkKCl7CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Njb3JlLWxhYmVsJykudGV4dENvbnRlbnQgPSAn2KfYs9qp2YjYsTogJyArIHNjb3JlOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0YXJnZXQtbGFiZWwnKS50ZXh0Q29udGVudCA9ICfbgdiv2YE6ICcgKyB0YXJnZXQ7CiAgY29uc3QgcGN0ID0gTWF0aC5taW4oMTAwLCBNYXRoLnJvdW5kKHNjb3JlL3RhcmdldCoxMDApKTsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncHJvZ3Jlc3MtZmlsbCcpLnN0eWxlLndpZHRoID0gcGN0ICsgJyUnOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAgQk9BUkQgUkVOREVSCj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpmdW5jdGlvbiByZW5kZXJCb2FyZCgpewogIGJvYXJkRWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYm9hcmQnKTsKICBib2FyZEVsLmlubmVySFRNTCA9ICcnOwogIGZvcihsZXQgcj0wO3I8U0laRTtyKyspewogICAgZm9yKGxldCBjPTA7YzxTSVpFO2MrKyl7CiAgICAgIGNvbnN0IGNlbGwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTsKICAgICAgY2VsbC5jbGFzc05hbWUgPSAnY2VsbCc7CiAgICAgIGNlbGwuZGF0YXNldC5yID0gcjsgY2VsbC5kYXRhc2V0LmMgPSBjOwogICAgICBjb25zdCB2ID0gYm9hcmRbcl1bY107CiAgICAgIGlmKHYpewogICAgICAgIGNlbGwuY2xhc3NMaXN0LmFkZCgnZmlsbGVkJyk7CiAgICAgICAgY29uc3QgZ2VtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7CiAgICAgICAgZ2VtLmNsYXNzTmFtZSA9ICdnZW0nOwogICAgICAgIGdlbS5zdHlsZS5iYWNrZ3JvdW5kID0gYGxpbmVhci1ncmFkaWVudCgxMzVkZWcsICR7di5hfSwgJHt2LmJ9KWA7CiAgICAgICAgZ2VtLnN0eWxlLmJveFNoYWRvdyA9IGAwIDNweCA4cHggcmdiYSgwLDAsMCwuMzUpLCAwIDFweCAwIHJnYmEoMjU1LDI1NSwyNTUsLjM1KSBpbnNldCwgMCAwIDEwcHggJHt2Lmdsb3d9YDsKICAgICAgICBjZWxsLmFwcGVuZENoaWxkKGdlbSk7CiAgICAgIH0KICAgICAgYm9hcmRFbC5hcHBlbmRDaGlsZChjZWxsKTsKICAgIH0KICB9Cn0KCmZ1bmN0aW9uIHJlbmRlclRyYXkoKXsKICB0cmF5RWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndHJheScpOwogIHRyYXlFbC5pbm5lckhUTUwgPSAnJzsKICB0cmF5LmZvckVhY2goKHAsIGlkeCk9PnsKICAgIGNvbnN0IHNsb3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTsKICAgIHNsb3QuY2xhc3NOYW1lID0gJ3RyYXktc2xvdCcgKyAocD8nJzonIGVtcHR5Jyk7CiAgICBpZihwKXsKICAgICAgY29uc3Qge21pblIsbWluQyxtYXhSLG1heEN9ID0gYmJveChwLnNoYXBlKTsKICAgICAgY29uc3Qgcm93cyA9IG1heFItbWluUisxLCBjb2xzID0gbWF4Qy1taW5DKzE7CiAgICAgIGNvbnN0IGNlbGxQeCA9IE1hdGgubWF4KDE2LCBNYXRoLm1pbigyNiwgTWF0aC5mbG9vcig5Ni9NYXRoLm1heChyb3dzLGNvbHMpKSkpOwogICAgICBjb25zdCBwaWVjZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpOwogICAgICBwaWVjZS5jbGFzc05hbWUgPSAncGllY2UnOwogICAgICBwaWVjZS5zdHlsZS5ncmlkVGVtcGxhdGVDb2x1bW5zID0gYHJlcGVhdCgke2NvbHN9LCAke2NlbGxQeH1weClgOwogICAgICBwaWVjZS5zdHlsZS5ncmlkVGVtcGxhdGVSb3dzID0gYHJlcGVhdCgke3Jvd3N9LCAke2NlbGxQeH1weClgOwogICAgICBwaWVjZS5zdHlsZS5nYXAgPSAnM3B4JzsKICAgICAgcGllY2UuZGF0YXNldC5pZHggPSBpZHg7CiAgICAgIC8vIGJ1aWxkIGEgZnVsbCByb3dzKmNvbHMgZ3JpZCBzbyBibGFuayBjZWxscyBrZWVwIHNwYWNpbmcKICAgICAgZm9yKGxldCByPTA7cjxyb3dzO3IrKyl7CiAgICAgICAgZm9yKGxldCBjPTA7Yzxjb2xzO2MrKyl7CiAgICAgICAgICBjb25zdCBoYXMgPSBwLnNoYXBlLnNvbWUoKFtzcixzY10pPT5zci1taW5SPT09ciAmJiBzYy1taW5DPT09Yyk7CiAgICAgICAgICBjb25zdCBwYyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpOwogICAgICAgICAgaWYoaGFzKXsKICAgICAgICAgICAgcGMuY2xhc3NOYW1lID0gJ3BjJzsKICAgICAgICAgICAgcGMuc3R5bGUud2lkdGggPSBjZWxsUHgrJ3B4JzsgcGMuc3R5bGUuaGVpZ2h0ID0gY2VsbFB4KydweCc7CiAgICAgICAgICAgIHBjLnN0eWxlLmJhY2tncm91bmQgPSBgbGluZWFyLWdyYWRpZW50KDEzNWRlZywgJHtwLmNvbG9yLmF9LCAke3AuY29sb3IuYn0pYDsKICAgICAgICAgIH0gZWxzZSB7CiAgICAgICAgICAgIHBjLnN0eWxlLndpZHRoID0gY2VsbFB4KydweCc7IHBjLnN0eWxlLmhlaWdodCA9IGNlbGxQeCsncHgnOwogICAgICAgICAgfQogICAgICAgICAgcGllY2UuYXBwZW5kQ2hpbGQocGMpOwogICAgICAgIH0KICAgICAgfQogICAgICBhdHRhY2hEcmFnKHBpZWNlLCBpZHgpOwogICAgICBzbG90LmFwcGVuZENoaWxkKHBpZWNlKTsKICAgIH0KICAgIHRyYXlFbC5hcHBlbmRDaGlsZChzbG90KTsKICB9KTsKfQoKZnVuY3Rpb24gYmJveChzaGFwZSl7CiAgbGV0IG1pblI9OTksbWluQz05OSxtYXhSPS05OSxtYXhDPS05OTsKICBzaGFwZS5mb3JFYWNoKChbcixjXSk9PnsgbWluUj1NYXRoLm1pbihtaW5SLHIpOyBtaW5DPU1hdGgubWluKG1pbkMsYyk7IG1heFI9TWF0aC5tYXgobWF4UixyKTsgbWF4Qz1NYXRoLm1heChtYXhDLGMpOyB9KTsKICByZXR1cm4ge21pblIsbWluQyxtYXhSLG1heEN9Owp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAgRFJBRyAmIERST1AgKHBvaW50ZXIgZXZlbnRzIOKAlCB3b3JrcyBmb3IgbW91c2UgKyB0b3VjaCkKPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCmZ1bmN0aW9uIGF0dGFjaERyYWcocGllY2VFbCwgaWR4KXsKICBwaWVjZUVsLmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJkb3duJywgKGUpPT57CiAgICBlbnN1cmVBdWRpbygpOwogICAgZS5wcmV2ZW50RGVmYXVsdCgpOwogICAgY29uc3QgcCA9IHRyYXlbaWR4XTsKICAgIGlmKCFwKSByZXR1cm47CiAgICBjb25zdCB7bWluUixtaW5DLG1heFIsbWF4Q30gPSBiYm94KHAuc2hhcGUpOwogICAgY29uc3Qgcm93cyA9IG1heFItbWluUisxLCBjb2xzID0gbWF4Qy1taW5DKzE7CiAgICBjb25zdCBjZWxsUHggPSBwYXJzZUludChnZXRDb21wdXRlZFN0eWxlKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCkuZ2V0UHJvcGVydHlWYWx1ZSgnLS1jZWxsJykpIHx8IDQwOwoKICAgIGNvbnN0IGdob3N0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7CiAgICBnaG9zdC5jbGFzc05hbWUgPSAnZHJhZy1naG9zdCc7CiAgICBnaG9zdC5zdHlsZS5ncmlkVGVtcGxhdGVDb2x1bW5zID0gYHJlcGVhdCgke2NvbHN9LCAke2NlbGxQeH1weClgOwogICAgZ2hvc3Quc3R5bGUuZ3JpZFRlbXBsYXRlUm93cyA9IGByZXBlYXQoJHtyb3dzfSwgJHtjZWxsUHh9cHgpYDsKICAgIGdob3N0LnN0eWxlLmdhcCA9ICc0cHgnOwogICAgZm9yKGxldCByPTA7cjxyb3dzO3IrKyl7CiAgICAgIGZvcihsZXQgYz0wO2M8Y29scztjKyspewogICAgICAgIGNvbnN0IGhhcyA9IHAuc2hhcGUuc29tZSgoW3NyLHNjXSk9PnNyLW1pblI9PT1yICYmIHNjLW1pbkM9PT1jKTsKICAgICAgICBjb25zdCBwYyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpOwogICAgICAgIHBjLnN0eWxlLndpZHRoID0gY2VsbFB4KydweCc7IHBjLnN0eWxlLmhlaWdodD1jZWxsUHgrJ3B4JzsKICAgICAgICBpZihoYXMpeyBwYy5jbGFzc05hbWU9J3BjJzsgcGMuc3R5bGUuYmFja2dyb3VuZCA9IGBsaW5lYXItZ3JhZGllbnQoMTM1ZGVnLCAke3AuY29sb3IuYX0sICR7cC5jb2xvci5ifSlgOyB9CiAgICAgICAgZ2hvc3QuYXBwZW5kQ2hpbGQocGMpOwogICAgICB9CiAgICB9CiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGdob3N0KTsKICAgIHBpZWNlRWwuY2xhc3NMaXN0LmFkZCgnZHJhZ2dpbmcnKTsKCiAgICBkcmFnU3RhdGUgPSB7IGlkeCwgcCwgcm93cywgY29scywgbWluUiwgbWluQywgZ2hvc3QsIGNlbGxQeCwgb2ZmWDooY29scypjZWxsUHgrKChjb2xzLTEpKjQpKS8yLCBvZmZZOihyb3dzKmNlbGxQeCsoKHJvd3MtMSkqNCkpLzIgfTsKICAgIHBvc2l0aW9uR2hvc3QoZS5jbGllbnRYLCBlLmNsaWVudFkpOwogICAgY2xlYXJQcmV2aWV3KCk7CgogICAgY29uc3QgbW92ZSA9IChldik9PnsgcG9zaXRpb25HaG9zdChldi5jbGllbnRYLCBldi5jbGllbnRZKTsgc2hvd1ByZXZpZXcoZXYuY2xpZW50WCwgZXYuY2xpZW50WSk7IH07CiAgICBjb25zdCB1cCA9IChldik9PnsKICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJtb3ZlJywgbW92ZSk7CiAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdwb2ludGVydXAnLCB1cCk7CiAgICAgIHBpZWNlRWwuY2xhc3NMaXN0LnJlbW92ZSgnZHJhZ2dpbmcnKTsKICAgICAgdHJ5RHJvcChldi5jbGllbnRYLCBldi5jbGllbnRZKTsKICAgICAgaWYoZHJhZ1N0YXRlICYmIGRyYWdTdGF0ZS5naG9zdCkgZHJhZ1N0YXRlLmdob3N0LnJlbW92ZSgpOwogICAgICBkcmFnU3RhdGUgPSBudWxsOwogICAgICBjbGVhclByZXZpZXcoKTsKICAgIH07CiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcm1vdmUnLCBtb3ZlKTsKICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVydXAnLCB1cCk7CiAgfSk7Cn0KCmZ1bmN0aW9uIHBvc2l0aW9uR2hvc3QoeCx5KXsKICBpZighZHJhZ1N0YXRlKSByZXR1cm47CiAgZHJhZ1N0YXRlLmdob3N0LnN0eWxlLmxlZnQgPSAoeCAtIGRyYWdTdGF0ZS5vZmZYKSArICdweCc7CiAgZHJhZ1N0YXRlLmdob3N0LnN0eWxlLnRvcCA9ICh5IC0gZHJhZ1N0YXRlLm9mZlkgLSA0NikgKyAncHgnOwp9CgpmdW5jdGlvbiBib2FyZENlbGxGcm9tUG9pbnQoeCx5KXsKICBjb25zdCByZWN0ID0gYm9hcmRFbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTsKICBjb25zdCBzdHlsZSA9IGdldENvbXB1dGVkU3R5bGUoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50KTsKICBjb25zdCBjZWxsUHggPSBwYXJzZUludChzdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCctLWNlbGwnKSkgfHwgNDA7CiAgY29uc3QgZ2FwID0gNDsKICBjb25zdCBsb2NhbFggPSB4IC0gcmVjdC5sZWZ0LCBsb2NhbFkgPSB5IC0gcmVjdC50b3AgLSA0NjsKICBjb25zdCBjb2wgPSBNYXRoLnJvdW5kKGxvY2FsWCAvIChjZWxsUHgrZ2FwKSAtIGRyYWdTdGF0ZS5jb2xzLzIgKyAwLjUpOwogIGNvbnN0IHJvdyA9IE1hdGgucm91bmQobG9jYWxZIC8gKGNlbGxQeCtnYXApIC0gZHJhZ1N0YXRlLnJvd3MvMiArIDAuNSk7CiAgcmV0dXJuIHtyb3csY29sfTsKfQoKZnVuY3Rpb24gY2xlYXJQcmV2aWV3KCl7CiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmNlbGwucHJldmlldy1vaywuY2VsbC5wcmV2aWV3LWJhZCcpLmZvckVhY2goYz0+Yy5jbGFzc0xpc3QucmVtb3ZlKCdwcmV2aWV3LW9rJywncHJldmlldy1iYWQnKSk7Cn0KCmZ1bmN0aW9uIGNhblBsYWNlKHNoYXBlLCByb3csIGNvbCl7CiAgZm9yKGNvbnN0IFtzcixzY10gb2Ygc2hhcGUpewogICAgY29uc3QgciA9IHJvdytzciwgYyA9IGNvbCtzYzsKICAgIGlmKHI8MHx8cj49U0laRXx8YzwwfHxjPj1TSVpFKSByZXR1cm4gZmFsc2U7CiAgICBpZihib2FyZFtyXVtjXSkgcmV0dXJuIGZhbHNlOwogIH0KICByZXR1cm4gdHJ1ZTsKfQoKZnVuY3Rpb24gc2hvd1ByZXZpZXcoeCx5KXsKICBpZighZHJhZ1N0YXRlKSByZXR1cm47CiAgY2xlYXJQcmV2aWV3KCk7CiAgY29uc3Qge3Jvdyxjb2x9ID0gYm9hcmRDZWxsRnJvbVBvaW50KHgseSk7CiAgY29uc3Qgb2sgPSBjYW5QbGFjZShkcmFnU3RhdGUucC5zaGFwZSwgcm93LCBjb2wpOwogIGRyYWdTdGF0ZS5wLnNoYXBlLmZvckVhY2goKFtzcixzY10pPT57CiAgICBjb25zdCByPXJvdytzciwgYz1jb2wrc2M7CiAgICBpZihyPj0wJiZyPFNJWkUmJmM+PTAmJmM8U0laRSl7CiAgICAgIGNvbnN0IGNlbGwgPSBib2FyZEVsLnF1ZXJ5U2VsZWN0b3IoYC5jZWxsW2RhdGEtcj0iJHtyfSJdW2RhdGEtYz0iJHtjfSJdYCk7CiAgICAgIGlmKGNlbGwpIGNlbGwuY2xhc3NMaXN0LmFkZChvaz8ncHJldmlldy1vayc6J3ByZXZpZXctYmFkJyk7CiAgICB9CiAgfSk7Cn0KCmZ1bmN0aW9uIHRyeURyb3AoeCx5KXsKICBpZighZHJhZ1N0YXRlKSByZXR1cm47CiAgY29uc3Qge3Jvdyxjb2x9ID0gYm9hcmRDZWxsRnJvbVBvaW50KHgseSk7CiAgY29uc3QgcmVjdCA9IGJvYXJkRWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7CiAgY29uc3Qgd2l0aGluQm9hcmRBcmVhID0gKHggPiByZWN0LmxlZnQtMzAgJiYgeCA8IHJlY3QucmlnaHQrMzAgJiYgeSA+IHJlY3QudG9wLTMwICYmIHkgPCByZWN0LmJvdHRvbSs4MCk7CiAgaWYod2l0aGluQm9hcmRBcmVhICYmIGNhblBsYWNlKGRyYWdTdGF0ZS5wLnNoYXBlLCByb3csIGNvbCkpewogICAgcGxhY2VQaWVjZShkcmFnU3RhdGUuaWR4LCBkcmFnU3RhdGUucCwgcm93LCBjb2wpOwogIH0gZWxzZSB7CiAgICBTTkQuaW52YWxpZCgpOwogIH0KfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIFBMQUNFTUVOVCAvIFNDT1JJTkcgLyBMSU5FIENMRUFSCj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpmdW5jdGlvbiBwbGFjZVBpZWNlKGlkeCwgcCwgcm93LCBjb2wpewogIHAuc2hhcGUuZm9yRWFjaCgoW3NyLHNjXSk9PnsgYm9hcmRbcm93K3NyXVtjb2wrc2NdID0gcC5jb2xvcjsgfSk7CiAgc2NvcmUgKz0gcC5zaGFwZS5sZW5ndGg7CiAgdHJheVtpZHhdID0gbnVsbDsKICBTTkQucGxhY2UoKTsKICByZW5kZXJCb2FyZCgpOwogIHVwZGF0ZUh1ZCgpOwoKICBjb25zdCBjbGVhcmVkID0gZGV0ZWN0QW5kQ2xlYXJMaW5lcygpOwogIGlmKGNsZWFyZWQuY291bnQ+MCl7CiAgICBzY29yZSArPSBjbGVhcmVkLmNlbGxzICogMTAgKiBjbGVhcmVkLmNvdW50OwogICAgU05ELmNsZWFyKGNsZWFyZWQuY291bnQpOwogICAgc3Bhd25TY29yZUZseShjbGVhcmVkLmNlbGxzKjEwKmNsZWFyZWQuY291bnQpOwogIH0KICB1cGRhdGVIdWQoKTsKCiAgaWYodHJheS5ldmVyeSh0PT4hdCkpIHJlZmlsbFRyYXkoKTsKICByZW5kZXJUcmF5KCk7CgogIGlmKHNjb3JlID49IHRhcmdldCl7CiAgICBzZXRUaW1lb3V0KCgpPT53aW5MZXZlbCgpLCAyNjApOwogICAgcmV0dXJuOwogIH0KICBpZighYW55TW92ZUF2YWlsYWJsZSgpKXsKICAgIHNldFRpbWVvdXQoKCk9Pmxvc2VMZXZlbCgpLCAyNjApOwogIH0KfQoKZnVuY3Rpb24gZGV0ZWN0QW5kQ2xlYXJMaW5lcygpewogIGNvbnN0IGZ1bGxSb3dzID0gW10sIGZ1bGxDb2xzID0gW107CiAgZm9yKGxldCByPTA7cjxTSVpFO3IrKyl7IGlmKGJvYXJkW3JdLmV2ZXJ5KHY9PnYpKSBmdWxsUm93cy5wdXNoKHIpOyB9CiAgZm9yKGxldCBjPTA7YzxTSVpFO2MrKyl7IGlmKGJvYXJkLmV2ZXJ5KHJvdz0+cm93W2NdKSkgZnVsbENvbHMucHVzaChjKTsgfQogIGNvbnN0IGNvdW50ID0gZnVsbFJvd3MubGVuZ3RoICsgZnVsbENvbHMubGVuZ3RoOwogIGlmKGNvdW50PT09MCkgcmV0dXJuIHtjb3VudDowLCBjZWxsczowfTsKCiAgY29uc3QgY2VsbHNUb0NsZWFyID0gbmV3IFNldCgpOwogIGZ1bGxSb3dzLmZvckVhY2gocj0+eyBmb3IobGV0IGM9MDtjPFNJWkU7YysrKSBjZWxsc1RvQ2xlYXIuYWRkKHIrJywnK2MpOyB9KTsKICBmdWxsQ29scy5mb3JFYWNoKGM9PnsgZm9yKGxldCByPTA7cjxTSVpFO3IrKykgY2VsbHNUb0NsZWFyLmFkZChyKycsJytjKTsgfSk7CgogIGNlbGxzVG9DbGVhci5mb3JFYWNoKGtleT0+ewogICAgY29uc3QgW3IsY10gPSBrZXkuc3BsaXQoJywnKS5tYXAoTnVtYmVyKTsKICAgIGNvbnN0IGVsID0gYm9hcmRFbC5xdWVyeVNlbGVjdG9yKGAuY2VsbFtkYXRhLXI9IiR7cn0iXVtkYXRhLWM9IiR7Y30iXWApOwogICAgaWYoZWwpeyBlbC5jbGFzc0xpc3QuYWRkKCdjbGVhcmluZycpOyBzcGF3blNoYXJkcyhlbCwgYm9hcmRbcl1bY10pOyB9CiAgfSk7CgogIGZ1bGxSb3dzLmZvckVhY2gocj0+c3Bhd25CZWFtKCdyb3cnLCByKSk7CiAgZnVsbENvbHMuZm9yRWFjaChjPT5zcGF3bkJlYW0oJ2NvbCcsIGMpKTsKCiAgc2V0VGltZW91dCgoKT0+ewogICAgY2VsbHNUb0NsZWFyLmZvckVhY2goa2V5PT57CiAgICAgIGNvbnN0IFtyLGNdID0ga2V5LnNwbGl0KCcsJykubWFwKE51bWJlcik7CiAgICAgIGJvYXJkW3JdW2NdID0gbnVsbDsKICAgIH0pOwogICAgcmVuZGVyQm9hcmQoKTsKICB9LCAzMDApOwoKICByZXR1cm4geyBjb3VudCwgY2VsbHM6IGNlbGxzVG9DbGVhci5zaXplIH07Cn0KCmZ1bmN0aW9uIHNwYXduQmVhbSh0eXBlLCBpbmRleCl7CiAgY29uc3QgcmVjdCA9IGJvYXJkRWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7CiAgY29uc3Qgc3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCk7CiAgY29uc3QgY2VsbFB4ID0gcGFyc2VJbnQoc3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgnLS1jZWxsJykpIHx8IDQwOwogIGNvbnN0IGdhcCA9IDQ7CiAgY29uc3QgYmVhbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpOwogIGJlYW0uY2xhc3NOYW1lID0gJ2JlYW0gZ28nOwogIGlmKHR5cGU9PT0ncm93Jyl7CiAgICBiZWFtLnN0eWxlLmxlZnQ9JzAnOyBiZWFtLnN0eWxlLndpZHRoPScxMDAlJzsKICAgIGJlYW0uc3R5bGUudG9wID0gKGluZGV4KihjZWxsUHgrZ2FwKSkgKyAncHgnOwogICAgYmVhbS5zdHlsZS5oZWlnaHQgPSBjZWxsUHgrJ3B4JzsKICB9IGVsc2UgewogICAgYmVhbS5zdHlsZS50b3A9JzAnOyBiZWFtLnN0eWxlLmhlaWdodD0nMTAwJSc7CiAgICBiZWFtLnN0eWxlLmxlZnQgPSAoaW5kZXgqKGNlbGxQeCtnYXApKSArICdweCc7CiAgICBiZWFtLnN0eWxlLndpZHRoID0gY2VsbFB4KydweCc7CiAgfQogIGJvYXJkRWwucGFyZW50RWxlbWVudC5hcHBlbmRDaGlsZChiZWFtKTsKICBzZXRUaW1lb3V0KCgpPT5iZWFtLnJlbW92ZSgpLCA2MDApOwp9CgpmdW5jdGlvbiBzcGF3blNoYXJkcyhjZWxsRWwsIGNvbG9yKXsKICBjb25zdCByZWN0ID0gY2VsbEVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpOwogIGNvbnN0IGN4ID0gcmVjdC5sZWZ0K3JlY3Qud2lkdGgvMiwgY3kgPSByZWN0LnRvcCtyZWN0LmhlaWdodC8yOwogIGNvbnN0IG4gPSA2OwogIGZvcihsZXQgaT0wO2k8bjtpKyspewogICAgY29uc3Qgc2hhcmQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTsKICAgIHNoYXJkLmNsYXNzTmFtZSA9ICdzaGFyZCc7CiAgICBjb25zdCBzeiA9IDQrTWF0aC5yYW5kb20oKSo1OwogICAgc2hhcmQuc3R5bGUud2lkdGggPSBzeisncHgnOyBzaGFyZC5zdHlsZS5oZWlnaHQ9c3orJ3B4JzsKICAgIHNoYXJkLnN0eWxlLmxlZnQgPSBjeCsncHgnOyBzaGFyZC5zdHlsZS50b3AgPSBjeSsncHgnOwogICAgc2hhcmQuc3R5bGUuYmFja2dyb3VuZCA9IE1hdGgucmFuZG9tKCk+MC41ID8gKGNvbG9yP2NvbG9yLmE6JyNmZmYnKSA6IChjb2xvcj9jb2xvci5iOicjZmZmJyk7CiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHNoYXJkKTsKICAgIGNvbnN0IGFuZyA9IE1hdGgucmFuZG9tKCkqTWF0aC5QSSoyOwogICAgY29uc3QgZGlzdCA9IDMwK01hdGgucmFuZG9tKCkqNTA7CiAgICBjb25zdCBkeCA9IE1hdGguY29zKGFuZykqZGlzdCwgZHkgPSBNYXRoLnNpbihhbmcpKmRpc3Q7CiAgICBzaGFyZC5hbmltYXRlKFsKICAgICAgeyB0cmFuc2Zvcm06J3RyYW5zbGF0ZSgwLDApIHJvdGF0ZSgwZGVnKScsIG9wYWNpdHk6MSB9LAogICAgICB7IHRyYW5zZm9ybTpgdHJhbnNsYXRlKCR7ZHh9cHgsICR7ZHl9cHgpIHJvdGF0ZSgke01hdGgucmFuZG9tKCkqMzYwfWRlZylgLCBvcGFjaXR5OjAgfQogICAgXSwgeyBkdXJhdGlvbjo1MDArTWF0aC5yYW5kb20oKSoyNTAsIGVhc2luZzonY3ViaWMtYmV6aWVyKC4yLC44LC4zLDEpJyB9KTsKICAgIHNldFRpbWVvdXQoKCk9PnNoYXJkLnJlbW92ZSgpLCA4MDApOwogIH0KfQoKZnVuY3Rpb24gc3Bhd25TY29yZUZseShhbW91bnQpewogIGlmKGFtb3VudDw9MCkgcmV0dXJuOwogIGNvbnN0IHJlY3QgPSBib2FyZEVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpOwogIGNvbnN0IGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7CiAgZWwuY2xhc3NOYW1lID0gJ3Njb3JlLWZseSc7CiAgZWwuc3R5bGUubGVmdCA9IChyZWN0LmxlZnQrcmVjdC53aWR0aC8yLTIwKSsncHgnOwogIGVsLnN0eWxlLnRvcCA9IChyZWN0LnRvcCtyZWN0LmhlaWdodC8yKSsncHgnOwogIGVsLnN0eWxlLmZvbnRTaXplID0gJzIycHgnOwogIGVsLnRleHRDb250ZW50ID0gJysnK2Ftb3VudDsKICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGVsKTsKICBzZXRUaW1lb3V0KCgpPT5lbC5yZW1vdmUoKSwgMTAwMCk7Cn0KCmZ1bmN0aW9uIGFueU1vdmVBdmFpbGFibGUoKXsKICBmb3IoY29uc3QgcCBvZiB0cmF5KXsKICAgIGlmKCFwKSBjb250aW51ZTsKICAgIGZvcihsZXQgcj0wO3I8U0laRTtyKyspewogICAgICBmb3IobGV0IGM9MDtjPFNJWkU7YysrKXsKICAgICAgICBpZihjYW5QbGFjZShwLnNoYXBlLCByLCBjKSkgcmV0dXJuIHRydWU7CiAgICAgIH0KICAgIH0KICB9CiAgcmV0dXJuIGZhbHNlOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAgV0lOIC8gTE9TRQo9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KZnVuY3Rpb24gd2luTGV2ZWwoKXsKICBTTkQubGV2ZWxVcCgpOwogIGNvbnN0IHN0YXJzID0gc2NvcmUgPj0gdGFyZ2V0KjEuNSA/IDMgOiAoc2NvcmUgPj0gdGFyZ2V0KjEuMTUgPyAyIDogMSk7CiAgcHJvZ3Jlc3Muc3RhcnNbY3VyTGV2ZWxdID0gTWF0aC5tYXgocHJvZ3Jlc3Muc3RhcnNbY3VyTGV2ZWxdfHwwLCBzdGFycyk7CiAgcHJvZ3Jlc3MuYmVzdFtjdXJMZXZlbF0gPSBNYXRoLm1heChwcm9ncmVzcy5iZXN0W2N1ckxldmVsXXx8MCwgc2NvcmUpOwogIGlmKGN1ckxldmVsID09PSBwcm9ncmVzcy51bmxvY2tlZCAmJiBjdXJMZXZlbCA8IExFVkVMX0NPVU5UKSBwcm9ncmVzcy51bmxvY2tlZCA9IGN1ckxldmVsKzE7CiAgc2F2ZVByb2dyZXNzKCk7CiAgc3Bhd25Db25mZXR0aSgpOwogIHNob3dPdmVybGF5KHsKICAgIGljb246J/Cfj4YnLCB0aXRsZTon2YTbjNmI2YQg2YXaqdmF2YQhJywgc3ViOifYtNin2YbYr9in2LEhINii2b4g2YbbkiDbgdiv2YEg2K3Yp9i12YQg2qnYsSDZhNuM2KcnLAogICAgc2NvcmUsIHN0YXJzLAogICAgYnV0dG9uczpbCiAgICAgIGN1ckxldmVsIDwgTEVWRUxfQ09VTlQgPyB7bGFiZWw6J9in2q/ZhNinINmE24zZiNmEIOKWtu+4jycsIGFjdGlvbjooKT0+eyBjbG9zZU92ZXJsYXkoKTsgc3RhcnRMZXZlbChjdXJMZXZlbCsxKTsgfX0gOiB7bGFiZWw6J9mF2KjYp9ix2qkg24HZiCEg8J+OiScsIGFjdGlvbjooKT0+eyBjbG9zZU92ZXJsYXkoKTsgc2hvd1NjcmVlbignbWVudScpOyByZW5kZXJNZW51U3RhdHMoKTsgfX0sCiAgICAgIHtsYWJlbDon2YXbjNmG2YgnLCBhY3Rpb246KCk9PnsgY2xvc2VPdmVybGF5KCk7IHNob3dTY3JlZW4oJ21lbnUnKTsgcmVuZGVyTWVudVN0YXRzKCk7IH0sIGdob3N0OnRydWV9CiAgICBdCiAgfSk7Cn0KCmZ1bmN0aW9uIGxvc2VMZXZlbCgpewogIFNORC5nYW1lT3ZlcigpOwogIHByb2dyZXNzLmJlc3RbY3VyTGV2ZWxdID0gTWF0aC5tYXgocHJvZ3Jlc3MuYmVzdFtjdXJMZXZlbF18fDAsIHNjb3JlKTsKICBzYXZlUHJvZ3Jlc3MoKTsKICBzaG93T3ZlcmxheSh7CiAgICBpY29uOifwn5KlJywgdGl0bGU6J9qv24zZhSDYp9mI2YjYsScsIHN1Yjon2qnZiNim24wg2obYp9mEINio2KfZgtuMINmG24HbjNq6IOKAlCDYr9mI2KjYp9ix24Eg2qnZiNi02LQg2qnYsduM2ronLAogICAgc2NvcmUsIHRhcmdldCwKICAgIGJ1dHRvbnM6WwogICAgICB7bGFiZWw6J9iv2YjYqNin2LHbgSDaqdmI2LTYtCDaqdix24zauiDwn5SBJywgYWN0aW9uOigpPT57IGNsb3NlT3ZlcmxheSgpOyBzdGFydExldmVsKGN1ckxldmVsKTsgfX0sCiAgICAgIHtsYWJlbDon2YXbjNmG2YgnLCBhY3Rpb246KCk9PnsgY2xvc2VPdmVybGF5KCk7IHNob3dTY3JlZW4oJ21lbnUnKTsgcmVuZGVyTWVudVN0YXRzKCk7IH0sIGdob3N0OnRydWV9CiAgICBdCiAgfSk7Cn0KCmZ1bmN0aW9uIHNob3dPdmVybGF5KGNmZyl7CiAgY29uc3Qgb3YgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTsKICBvdi5jbGFzc05hbWUgPSAnb3ZlcmxheSc7CiAgb3YuaWQgPSAnYWN0aXZlLW92ZXJsYXknOwogIGNvbnN0IHN0YXJzSHRtbCA9IGNmZy5zdGFycyA/IGA8ZGl2IHN0eWxlPSJmb250LXNpemU6MjJweDttYXJnaW4tYm90dG9tOjZweDsiPiR7J+KtkCcucmVwZWF0KGNmZy5zdGFycyl9JHsn4piGJy5yZXBlYXQoMy1jZmcuc3RhcnMpfTwvZGl2PmAgOiAnJzsKICBjb25zdCB0YXJnZXRIdG1sID0gY2ZnLnRhcmdldCA/IGA8ZGl2IGNsYXNzPSJvdmVybGF5LXN1YiI+24HYr9mBOiAke2NmZy50YXJnZXR9PC9kaXY+YCA6ICcnOwogIG92LmlubmVySFRNTCA9IGAKICAgIDxkaXYgY2xhc3M9Im92ZXJsYXktY2FyZCI+CiAgICAgIDxkaXYgY2xhc3M9Im92ZXJsYXktaWNvbiI+JHtjZmcuaWNvbn08L2Rpdj4KICAgICAgPGRpdiBjbGFzcz0ib3ZlcmxheS10aXRsZSI+JHtjZmcudGl0bGV9PC9kaXY+CiAgICAgIDxkaXYgY2xhc3M9Im92ZXJsYXktc3ViIj4ke2NmZy5zdWJ9PC9kaXY+CiAgICAgICR7c3RhcnNIdG1sfQogICAgICA8ZGl2IGNsYXNzPSJvdmVybGF5LXNjb3JlIj4ke2NmZy5zY29yZX08L2Rpdj4KICAgICAgJHt0YXJnZXRIdG1sfQogICAgICA8ZGl2IGNsYXNzPSJvdmVybGF5LWJ0bnMiIGlkPSJvdi1idG5zIj48L2Rpdj4KICAgIDwvZGl2PmA7CiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChvdik7CiAgY29uc3QgYnRuV3JhcCA9IG92LnF1ZXJ5U2VsZWN0b3IoJyNvdi1idG5zJyk7CiAgY2ZnLmJ1dHRvbnMuZm9yRWFjaChiPT57CiAgICBjb25zdCBidG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTsKICAgIGJ0bi5jbGFzc05hbWUgPSAnYnRuIGJsb2NrJyArIChiLmdob3N0PycgZ2hvc3QnOicnKTsKICAgIGJ0bi50ZXh0Q29udGVudCA9IGIubGFiZWw7CiAgICBidG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKT0+eyBTTkQuY2xpY2soKTsgYi5hY3Rpb24oKTsgfSk7CiAgICBidG5XcmFwLmFwcGVuZENoaWxkKGJ0bik7CiAgfSk7Cn0KZnVuY3Rpb24gY2xvc2VPdmVybGF5KCl7CiAgY29uc3Qgb3YgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYWN0aXZlLW92ZXJsYXknKTsKICBpZihvdikgb3YucmVtb3ZlKCk7Cn0KCmZ1bmN0aW9uIHNwYXduQ29uZmV0dGkoKXsKICBjb25zdCBjb2xvcnMgPSBDT0xPUlM7CiAgZm9yKGxldCBpPTA7aTw1MDtpKyspewogICAgY29uc3QgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTsKICAgIGVsLmNsYXNzTmFtZSA9ICdjb25mZXR0aSc7CiAgICBjb25zdCBjb2wgPSBjb2xvcnNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKmNvbG9ycy5sZW5ndGgpXTsKICAgIGVsLnN0eWxlLmJhY2tncm91bmQgPSBNYXRoLnJhbmRvbSgpPjAuNT9jb2wuYTpjb2wuYjsKICAgIGVsLnN0eWxlLmxlZnQgPSBNYXRoLnJhbmRvbSgpKjEwMCsndncnOwogICAgZWwuc3R5bGUud2lkdGggPSAoNStNYXRoLnJhbmRvbSgpKjUpKydweCc7CiAgICBlbC5zdHlsZS5oZWlnaHQgPSAoOCtNYXRoLnJhbmRvbSgpKjgpKydweCc7CiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGVsKTsKICAgIGNvbnN0IGZhbGwgPSAzMDArTWF0aC5yYW5kb20oKSo0MDA7CiAgICBlbC5hbmltYXRlKFsKICAgICAgeyB0cmFuc2Zvcm06YHRyYW5zbGF0ZVkoMCkgcm90YXRlKDBkZWcpYCwgb3BhY2l0eToxIH0sCiAgICAgIHsgdHJhbnNmb3JtOmB0cmFuc2xhdGVZKCR7d2luZG93LmlubmVySGVpZ2h0KzUwfXB4KSByb3RhdGUoJHszNjArTWF0aC5yYW5kb20oKSozNjB9ZGVnKWAsIG9wYWNpdHk6LjkgfQogICAgXSwgeyBkdXJhdGlvbjoxNjAwK01hdGgucmFuZG9tKCkqMTAwMCwgZWFzaW5nOidjdWJpYy1iZXppZXIoLjIsLjYsLjQsMSknIH0pOwogICAgc2V0VGltZW91dCgoKT0+ZWwucmVtb3ZlKCksIDI3MDApOwogIH0KfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIFdJUkUgVVAgVUkKPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdidG4tY29udGludWUnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpPT57IFNORC5jbGljaygpOyBlbnN1cmVBdWRpbygpOyBzdGFydExldmVsKHByb2dyZXNzLnVubG9ja2VkKTsgfSk7CmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdidG4tbGV2ZWxzJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKT0+eyBTTkQuY2xpY2soKTsgcmVuZGVyTGV2ZWxHcmlkKCk7IHNob3dTY3JlZW4oJ2xldmVscycpOyB9KTsKZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2J0bi1sZXZlbHMtYmFjaycpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCk9PnsgU05ELmNsaWNrKCk7IHNob3dTY3JlZW4oJ21lbnUnKTsgfSk7CmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdidG4tZ2FtZS1iYWNrJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKT0+eyBTTkQuY2xpY2soKTsgc2hvd1NjcmVlbignbWVudScpOyByZW5kZXJNZW51U3RhdHMoKTsgfSk7CmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdidG4tcmVzdGFydC1sZXZlbCcpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCk9PnsgU05ELmNsaWNrKCk7IHN0YXJ0TGV2ZWwoY3VyTGV2ZWwpOyB9KTsKZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2J0bi1yZXN0YXJ0LXByb2dyZXNzJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKT0+ewogIGlmKGNvbmZpcm0oJ9qp24zYpyDYotm+INmI2KfZgti524wg2KrZhdin2YUg2b7bjNi0INix2YHYqiDYr9mI2KjYp9ix24Eg2LTYsdmI2Lkg2qnYsdmG2Kcg2obYp9uB2KrbkiDbgduM2rrYnycpKXsKICAgIHByb2dyZXNzID0geyB1bmxvY2tlZDoxLCBzdGFyczp7fSwgYmVzdDp7fSwgc291bmRPbjpwcm9ncmVzcy5zb3VuZE9uIH07CiAgICBzYXZlUHJvZ3Jlc3MoKTsgcmVuZGVyTWVudVN0YXRzKCk7CiAgfQp9KTsKZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2J0bi1zb3VuZC1tZW51JykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKT0+eyBwcm9ncmVzcy5zb3VuZE9uPSFwcm9ncmVzcy5zb3VuZE9uOyBlbnN1cmVBdWRpbygpOyBTTkQuY2xpY2soKTsgdXBkYXRlU291bmRJY29ucygpOyBzYXZlUHJvZ3Jlc3MoKTsgfSk7CmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdidG4tc291bmQtZ2FtZScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCk9PnsgcHJvZ3Jlc3Muc291bmRPbj0hcHJvZ3Jlc3Muc291bmRPbjsgZW5zdXJlQXVkaW8oKTsgU05ELmNsaWNrKCk7IHVwZGF0ZVNvdW5kSWNvbnMoKTsgc2F2ZVByb2dyZXNzKCk7IH0pOwoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIElOSVQKPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCmxvYWRQcm9ncmVzcygpLnRoZW4oKCk9Pnsgc2hvd1NjcmVlbignbWVudScpOyB9KTsKCn0pKCk7Cjwvc2NyaXB0Pgo8L2JvZHk+CjwvaHRtbD4K";
const GAME_ARROW_B64 = "PCFET0NUWVBFIGh0bWw+CjxodG1sIGxhbmc9InVyIiBkaXI9InJ0bCI+CjxoZWFkPgo8bWV0YSBjaGFyc2V0PSJVVEYtOCI+CjxtZXRhIG5hbWU9InZpZXdwb3J0IiBjb250ZW50PSJ3aWR0aD1kZXZpY2Utd2lkdGgsIGluaXRpYWwtc2NhbGU9MS4wLCBtYXhpbXVtLXNjYWxlPTEuMCwgdXNlci1zY2FsYWJsZT1ubywgdmlld3BvcnQtZml0PWNvdmVyIj4KPHRpdGxlPtin24zYsdmIINm+2LLZhCDigJQgQXJyb3cgRmxvdzwvdGl0bGU+CjxzdHlsZT4KICA6cm9vdHsKICAgIC0tYmcxOiMwNjE0Mjg7IC0tYmcyOiMwYTI0NDA7IC0tYmczOiMwZjNhNTI7CiAgICAtLXBhbmVsOnJnYmEoMjU1LDI1NSwyNTUsMC4wNTUpOyAtLXBhbmVsLWJyZDpyZ2JhKDI1NSwyNTUsMjU1LDAuMTQpOwogICAgLS1wYW5lbC1icmQtaGk6cmdiYSgyNTUsMjU1LDI1NSwwLjI4KTsKICAgIC0tZ29sZDojNWRmMGQwOyAtLWdvbGQyOiMzOGI2ZmY7CiAgICAtLXRleHQ6I2VlZmRmZjsgLS10ZXh0LWRpbTojYTljNmQ2OyAtLXRleHQtZGltMjojN2E5YmIwOwogICAgLS1yYWRpdXM6MTZweDsKICB9CiAgKntib3gtc2l6aW5nOmJvcmRlci1ib3g7IC13ZWJraXQtdGFwLWhpZ2hsaWdodC1jb2xvcjp0cmFuc3BhcmVudDt9CiAgaHRtbCxib2R5e2hlaWdodDoxMDAlO30KICBib2R5ewogICAgbWFyZ2luOjA7IG1pbi1oZWlnaHQ6MTAwdmg7IG92ZXJmbG93LXg6aGlkZGVuOwogICAgZm9udC1mYW1pbHk6J1NlZ29lIFVJJywnVGFob21hJywnTm90byBOYXN0YWxpcSBVcmR1JyxzYW5zLXNlcmlmOwogICAgY29sb3I6dmFyKC0tdGV4dCk7CiAgICBiYWNrZ3JvdW5kOgogICAgICByYWRpYWwtZ3JhZGllbnQoMTEwMHB4IDcwMHB4IGF0IDEyJSAtMTAlLCByZ2JhKDU2LDE4MiwyNTUsMC4xNiksIHRyYW5zcGFyZW50IDYwJSksCiAgICAgIHJhZGlhbC1ncmFkaWVudCg5MDBweCA2NTBweCBhdCAxMTAlIDE1JSwgcmdiYSg5MywyNDAsMjA4LDAuMTIpLCB0cmFuc3BhcmVudCA1NSUpLAogICAgICByYWRpYWwtZ3JhZGllbnQoMTAwMHB4IDgwMHB4IGF0IDUwJSAxMjAlLCByZ2JhKDE1MCw5MCwyNTUsMC4xNCksIHRyYW5zcGFyZW50IDU1JSksCiAgICAgIGxpbmVhci1ncmFkaWVudCgxNjBkZWcsIHZhcigtLWJnMSksIHZhcigtLWJnMikgNTUlLCB2YXIoLS1iZzMpKTsKICAgIGJhY2tncm91bmQtYXR0YWNobWVudDpmaXhlZDsKICAgIHBvc2l0aW9uOnJlbGF0aXZlOyB1c2VyLXNlbGVjdDpub25lOyAtd2Via2l0LXVzZXItc2VsZWN0Om5vbmU7IHRvdWNoLWFjdGlvbjpub25lOwogIH0KICBib2R5OjpiZWZvcmV7CiAgICBjb250ZW50OicnO3Bvc2l0aW9uOmZpeGVkO2luc2V0OjA7cG9pbnRlci1ldmVudHM6bm9uZTt6LWluZGV4OjA7b3BhY2l0eTouNDU7CiAgICBiYWNrZ3JvdW5kLWltYWdlOnJhZGlhbC1ncmFkaWVudChyZ2JhKDI1NSwyNTUsMjU1LDAuMDYpIDFweCwgdHJhbnNwYXJlbnQgMXB4KTsKICAgIGJhY2tncm91bmQtc2l6ZToyNnB4IDI2cHg7IGFuaW1hdGlvbjp0d2lua2xlIDZzIGVhc2UtaW4tb3V0IGluZmluaXRlOwogIH0KICBAa2V5ZnJhbWVzIHR3aW5rbGV7IDAlLDEwMCV7b3BhY2l0eTouMzt9IDUwJXtvcGFjaXR5Oi41NTt9IH0KCiAgI2FwcHtwb3NpdGlvbjpyZWxhdGl2ZTsgei1pbmRleDoxOyBtaW4taGVpZ2h0OjEwMHZoOyBkaXNwbGF5OmZsZXg7IGZsZXgtZGlyZWN0aW9uOmNvbHVtbjsgYWxpZ24taXRlbXM6Y2VudGVyOyBwYWRkaW5nOjE4cHggMTRweCAzMHB4O30KICAuc2NyZWVueyB3aWR0aDoxMDAlOyBtYXgtd2lkdGg6NDYwcHg7IGRpc3BsYXk6ZmxleDsgZmxleC1kaXJlY3Rpb246Y29sdW1uOyBhbGlnbi1pdGVtczpjZW50ZXI7IGFuaW1hdGlvbjpmYWRlSW4gLjM1cyBlYXNlOyB9CiAgQGtleWZyYW1lcyBmYWRlSW57IGZyb217b3BhY2l0eTowOyB0cmFuc2Zvcm06dHJhbnNsYXRlWSg4cHgpO30gdG97b3BhY2l0eToxOyB0cmFuc2Zvcm06dHJhbnNsYXRlWSgwKTt9IH0KICAuaGlkZGVueyBkaXNwbGF5Om5vbmUgIWltcG9ydGFudDsgfQoKICAubG9nby13cmFweyB0ZXh0LWFsaWduOmNlbnRlcjsgbWFyZ2luOjE4cHggMCA4cHg7IH0KICAubG9nby1hcnJvd3N7IGZvbnQtc2l6ZTozMnB4OyBsZXR0ZXItc3BhY2luZzo4cHg7IGZpbHRlcjpkcm9wLXNoYWRvdygwIDRweCAxOHB4IHJnYmEoOTMsMjQwLDIwOCwuNDUpKTsgYW5pbWF0aW9uOmFycm93RmxvYXQgM3MgZWFzZS1pbi1vdXQgaW5maW5pdGU7IH0KICBAa2V5ZnJhbWVzIGFycm93RmxvYXR7IDAlLDEwMCV7dHJhbnNmb3JtOnRyYW5zbGF0ZVkoMCkgcm90YXRlKDBkZWcpO30gNTAle3RyYW5zZm9ybTp0cmFuc2xhdGVZKC02cHgpIHJvdGF0ZSgzZGVnKTt9IH0KICAudGl0bGV7CiAgICBmb250LXNpemU6MzJweDsgZm9udC13ZWlnaHQ6OTAwOyBtYXJnaW46NnB4IDAgMnB4OyBsZXR0ZXItc3BhY2luZzoxcHg7CiAgICBiYWNrZ3JvdW5kOmxpbmVhci1ncmFkaWVudCg5MGRlZywjNWRmMGQwLCMzOGI2ZmYgNDAlLCM5YTZiZmYgNzAlLCM1ZGYwZDApOwogICAgLXdlYmtpdC1iYWNrZ3JvdW5kLWNsaXA6dGV4dDsgYmFja2dyb3VuZC1jbGlwOnRleHQ7IGNvbG9yOnRyYW5zcGFyZW50OwogICAgYmFja2dyb3VuZC1zaXplOjIwMCUgYXV0bzsgYW5pbWF0aW9uOnRpdGxlU2hpbmUgNXMgbGluZWFyIGluZmluaXRlOwogIH0KICBAa2V5ZnJhbWVzIHRpdGxlU2hpbmV7IHRveyBiYWNrZ3JvdW5kLXBvc2l0aW9uOjIwMCUgY2VudGVyOyB9IH0KICAuc3VidGl0bGV7IGZvbnQtc2l6ZToxMi41cHg7IGNvbG9yOnZhcigtLXRleHQtZGltKTsgbGV0dGVyLXNwYWNpbmc6M3B4OyB0ZXh0LXRyYW5zZm9ybTp1cHBlcmNhc2U7IH0KCiAgLmJ0bnsKICAgIGJvcmRlcjpub25lOyBjdXJzb3I6cG9pbnRlcjsgYm9yZGVyLXJhZGl1czo5OTlweDsgZm9udC13ZWlnaHQ6ODAwOyBmb250LWZhbWlseTppbmhlcml0OwogICAgY29sb3I6IzA0MjEyYjsgcGFkZGluZzoxM3B4IDI2cHg7IGZvbnQtc2l6ZToxNXB4OyBsZXR0ZXItc3BhY2luZzouM3B4OwogICAgYmFja2dyb3VuZDpsaW5lYXItZ3JhZGllbnQoMTM1ZGVnLCM5ZGY3ZTYsdmFyKC0tZ29sZCkgNDUlLHZhcigtLWdvbGQyKSk7CiAgICBib3gtc2hhZG93OjAgOHB4IDIycHggcmdiYSg1NiwxODIsMjU1LC4zNSksIDAgMnB4IDAgcmdiYSgyNTUsMjU1LDI1NSwuNSkgaW5zZXQ7CiAgICBkaXNwbGF5OmlubGluZS1mbGV4OyBhbGlnbi1pdGVtczpjZW50ZXI7IGdhcDo4cHg7IHRyYW5zaXRpb246dHJhbnNmb3JtIC4xNXMsIGJveC1zaGFkb3cgLjE1czsKICB9CiAgLmJ0bjphY3RpdmV7IHRyYW5zZm9ybTpzY2FsZSguOTUpOyBib3gtc2hhZG93OjAgM3B4IDEwcHggcmdiYSg1NiwxODIsMjU1LC4zKSBpbnNldDsgfQogIC5idG4uZ2hvc3R7IGJhY2tncm91bmQ6dmFyKC0tcGFuZWwpOyBjb2xvcjp2YXIoLS10ZXh0KTsgYm9yZGVyOjFweCBzb2xpZCB2YXIoLS1wYW5lbC1icmQpOyBib3gtc2hhZG93Om5vbmU7IGZvbnQtd2VpZ2h0OjcwMDsgfQogIC5idG4uc21hbGx7IHBhZGRpbmc6OXB4IDE2cHg7IGZvbnQtc2l6ZToxMi41cHg7IH0KICAuYnRuLmJsb2NreyB3aWR0aDoxMDAlOyBqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyOyB9CiAgLmJ0bjpkaXNhYmxlZHsgb3BhY2l0eTouNDU7IHBvaW50ZXItZXZlbnRzOm5vbmU7IH0KCiAgLmljb25idG57CiAgICB3aWR0aDo0MnB4O2hlaWdodDo0MnB4O2JvcmRlci1yYWRpdXM6NTAlOyBib3JkZXI6MXB4IHNvbGlkIHZhcigtLXBhbmVsLWJyZCk7IGJhY2tncm91bmQ6dmFyKC0tcGFuZWwpOwogICAgY29sb3I6dmFyKC0tdGV4dCk7IGRpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7anVzdGlmeS1jb250ZW50OmNlbnRlcjsgY3Vyc29yOnBvaW50ZXI7IGZvbnQtc2l6ZToxN3B4OwogICAgdHJhbnNpdGlvbjpiYWNrZ3JvdW5kIC4ycywgdHJhbnNmb3JtIC4xNXM7CiAgfQogIC5pY29uYnRuOmFjdGl2ZXsgdHJhbnNmb3JtOnNjYWxlKC45KTsgfQogIC5pY29uYnRuLm9ueyBjb2xvcjp2YXIoLS1nb2xkKTsgYm9yZGVyLWNvbG9yOnJnYmEoOTMsMjQwLDIwOCwuNSk7IGJveC1zaGFkb3c6MCAwIDE0cHggcmdiYSg5MywyNDAsMjA4LC4zNSk7IH0KCiAgLm1lbnUtYWN0aW9uc3sgZGlzcGxheTpmbGV4OyBmbGV4LWRpcmVjdGlvbjpjb2x1bW47IGdhcDoxMnB4OyB3aWR0aDoxMDAlOyBtYXgtd2lkdGg6MjgwcHg7IG1hcmdpbi10b3A6MjJweDsgfQogIC5zdGF0LXN0cmlweyBkaXNwbGF5OmZsZXg7IGdhcDoxMHB4OyBtYXJnaW4tdG9wOjI2cHg7IH0KICAuc3RhdC1jaGlweyBiYWNrZ3JvdW5kOnZhcigtLXBhbmVsKTsgYm9yZGVyOjFweCBzb2xpZCB2YXIoLS1wYW5lbC1icmQpOyBib3JkZXItcmFkaXVzOjE0cHg7IHBhZGRpbmc6MTBweCAxNnB4OyB0ZXh0LWFsaWduOmNlbnRlcjsgbWluLXdpZHRoOjg0cHg7IH0KICAuc3RhdC1jaGlwIGJ7IGRpc3BsYXk6YmxvY2s7IGZvbnQtc2l6ZToxOXB4OyBjb2xvcjp2YXIoLS1nb2xkKTsgfQogIC5zdGF0LWNoaXAgc3BhbnsgZm9udC1zaXplOjEwLjVweDsgY29sb3I6dmFyKC0tdGV4dC1kaW0pOyB9CiAgLnNvdW5kLXJvd3sgZGlzcGxheTpmbGV4OyBnYXA6MTJweDsgbWFyZ2luLXRvcDoyMHB4OyB9CgogIC8qID09PT09PT09PT09PSBMRVZFTCBTRUxFQ1QgPT09PT09PT09PT09ICovCiAgLmx2bC1oZWFkZXJ7IGRpc3BsYXk6ZmxleDsgYWxpZ24taXRlbXM6Y2VudGVyOyBqdXN0aWZ5LWNvbnRlbnQ6c3BhY2UtYmV0d2Vlbjsgd2lkdGg6MTAwJTsgbWFyZ2luLWJvdHRvbToxNHB4OyB9CiAgLmx2bC1oZWFkZXIgaDJ7IGZvbnQtc2l6ZToxOHB4OyBtYXJnaW46MDsgfQogIC5sdmwtZ3JpZHsgZGlzcGxheTpncmlkOyBncmlkLXRlbXBsYXRlLWNvbHVtbnM6cmVwZWF0KDUsMWZyKTsgZ2FwOjEwcHg7IHdpZHRoOjEwMCU7IG1heC1oZWlnaHQ6NjJ2aDsgb3ZlcmZsb3cteTphdXRvOyBwYWRkaW5nOjZweCA0cHggMTZweDsgfQogIC5sdmwtY2VsbHsKICAgIGFzcGVjdC1yYXRpbzoxOyBib3JkZXItcmFkaXVzOjE0cHg7IGRpc3BsYXk6ZmxleDsgZmxleC1kaXJlY3Rpb246Y29sdW1uOyBhbGlnbi1pdGVtczpjZW50ZXI7IGp1c3RpZnktY29udGVudDpjZW50ZXI7CiAgICBmb250LXdlaWdodDo4MDA7IGZvbnQtc2l6ZToxNXB4OyBjdXJzb3I6cG9pbnRlcjsgcG9zaXRpb246cmVsYXRpdmU7IGJvcmRlcjoxcHggc29saWQgdmFyKC0tcGFuZWwtYnJkKTsKICAgIGJhY2tncm91bmQ6dmFyKC0tcGFuZWwpOyBjb2xvcjp2YXIoLS10ZXh0KTsgdHJhbnNpdGlvbjp0cmFuc2Zvcm0gLjE1czsKICB9CiAgLmx2bC1jZWxsOmFjdGl2ZXsgdHJhbnNmb3JtOnNjYWxlKC45Mik7IH0KICAubHZsLWNlbGwuZG9uZXsgYmFja2dyb3VuZDpsaW5lYXItZ3JhZGllbnQoMTUwZGVnLCM1ZGYwZDAsIzE4OWI4YSk7IGNvbG9yOiMwMzI2MjE7IGJvcmRlci1jb2xvcjpyZ2JhKDI1NSwyNTUsMjU1LC4zKTsgYm94LXNoYWRvdzowIDZweCAxNnB4IHJnYmEoOTMsMjQwLDIwOCwuMzUpOyB9CiAgLmx2bC1jZWxsLmN1cnJlbnR7CiAgICBiYWNrZ3JvdW5kOmxpbmVhci1ncmFkaWVudCgxNTBkZWcsIzlkZjdlNix2YXIoLS1nb2xkMikpOyBjb2xvcjojMDQyMTJiOyBib3JkZXItY29sb3I6cmdiYSgyNTUsMjU1LDI1NSwuNSk7CiAgICBib3gtc2hhZG93OjAgMCAwIDNweCByZ2JhKDkzLDI0MCwyMDgsLjI1KSwgMCA4cHggMjBweCByZ2JhKDU2LDE4MiwyNTUsLjQpOwogICAgYW5pbWF0aW9uOnB1bHNlTHZsIDEuOHMgZWFzZS1pbi1vdXQgaW5maW5pdGU7CiAgfQogIEBrZXlmcmFtZXMgcHVsc2VMdmx7IDAlLDEwMCV7IGJveC1zaGFkb3c6MCAwIDAgM3B4IHJnYmEoOTMsMjQwLDIwOCwuMjUpLDAgOHB4IDIwcHggcmdiYSg1NiwxODIsMjU1LC40KTt9IDUwJXsgYm94LXNoYWRvdzowIDAgMCA3cHggcmdiYSg5MywyNDAsMjA4LC4xMiksMCA4cHggMjZweCByZ2JhKDU2LDE4MiwyNTUsLjU1KTt9IH0KICAubHZsLWNlbGwubG9ja2VkeyBvcGFjaXR5Oi4zODsgY3Vyc29yOmRlZmF1bHQ7IH0KICAubHZsLWNlbGwgLnN0YXJ7IGZvbnQtc2l6ZTo5cHg7IG1hcmdpbi10b3A6MnB4OyB9CgogIC8qID09PT09PT09PT09PSBHQU1FIFNDUkVFTiA9PT09PT09PT09PT0gKi8KICAuZ2FtZS10b3B7IGRpc3BsYXk6ZmxleDsgYWxpZ24taXRlbXM6Y2VudGVyOyBqdXN0aWZ5LWNvbnRlbnQ6c3BhY2UtYmV0d2Vlbjsgd2lkdGg6MTAwJTsgbWFyZ2luLWJvdHRvbToxMHB4OyB9CiAgLmdhbWUtdG9wIC5sZWZ0LCAuZ2FtZS10b3AgLnJpZ2h0eyBkaXNwbGF5OmZsZXg7IGFsaWduLWl0ZW1zOmNlbnRlcjsgZ2FwOjhweDsgfQogIC5sdmwtYmFkZ2V7IGJhY2tncm91bmQ6dmFyKC0tcGFuZWwpOyBib3JkZXI6MXB4IHNvbGlkIHZhcigtLXBhbmVsLWJyZCk7IGJvcmRlci1yYWRpdXM6MTJweDsgcGFkZGluZzo3cHggMTRweDsgZm9udC13ZWlnaHQ6ODAwOyBmb250LXNpemU6MTNweDsgfQogIC5wcm9ncmVzcy13cmFweyB3aWR0aDoxMDAlOyBtYXJnaW4tYm90dG9tOjE2cHg7IH0KICAucHJvZ3Jlc3MtbGFiZWxzeyBkaXNwbGF5OmZsZXg7IGp1c3RpZnktY29udGVudDpzcGFjZS1iZXR3ZWVuOyBmb250LXNpemU6MTFweDsgY29sb3I6dmFyKC0tdGV4dC1kaW0pOyBtYXJnaW4tYm90dG9tOjVweDsgfQogIC5wcm9ncmVzcy10cmFja3sgaGVpZ2h0OjEycHg7IGJvcmRlci1yYWRpdXM6OHB4OyBiYWNrZ3JvdW5kOnJnYmEoMjU1LDI1NSwyNTUsLjA4KTsgYm9yZGVyOjFweCBzb2xpZCB2YXIoLS1wYW5lbC1icmQpOyBvdmVyZmxvdzpoaWRkZW47IH0KICAucHJvZ3Jlc3MtZmlsbHsgaGVpZ2h0OjEwMCU7IGJvcmRlci1yYWRpdXM6OHB4OyBiYWNrZ3JvdW5kOmxpbmVhci1ncmFkaWVudCg5MGRlZywjNWRmMGQwLCMzOGI2ZmYsIzlhNmJmZik7IHRyYW5zaXRpb246d2lkdGggLjRzIGN1YmljLWJlemllciguMiwuOSwuMywxKTsgYm94LXNoYWRvdzowIDAgMTJweCByZ2JhKDU2LDE4MiwyNTUsLjYpOyB9CgogIC8qIHRoZSBib2FyZCBpcyBnaXZlbiBhIHN1YnRsZSAzRCB0YWJsZXRvcCB0aWx0IGZvciBhIHByZW1pdW0gZmVlbCAqLwogIC5ib2FyZC1zY2VuZXsgcGVyc3BlY3RpdmU6MTEwMHB4OyBwYWRkaW5nOjE0cHggMCAyNnB4OyB9CiAgLmJvYXJkLXdyYXB7CiAgICBkaXJlY3Rpb246bHRyOyBwb3NpdGlvbjpyZWxhdGl2ZTsgcGFkZGluZzoxMnB4OyBib3JkZXItcmFkaXVzOjIycHg7IGJhY2tncm91bmQ6dmFyKC0tcGFuZWwpOyBib3JkZXI6MXB4IHNvbGlkIHZhcigtLXBhbmVsLWJyZCk7CiAgICBib3gtc2hhZG93OjAgMzBweCA2MHB4IHJnYmEoMCwwLDAsLjUpLCAwIDFweCAwIHJnYmEoMjU1LDI1NSwyNTUsLjA4KSBpbnNldDsKICAgIHRyYW5zZm9ybTpyb3RhdGVYKDhkZWcpOyB0cmFuc2Zvcm0tc3R5bGU6cHJlc2VydmUtM2Q7CiAgfQogICNib2FyZHsgZGlzcGxheTpncmlkOyBwb3NpdGlvbjpyZWxhdGl2ZTsgei1pbmRleDoxOyB9CiAgLmNlbGx7IHBvc2l0aW9uOnJlbGF0aXZlOyB9CiAgLnRpbGV7CiAgICBwb3NpdGlvbjphYnNvbHV0ZTsgaW5zZXQ6MnB4OyBib3JkZXItcmFkaXVzOjEwcHg7IGN1cnNvcjpwb2ludGVyOwogICAgZGlzcGxheTpmbGV4OyBhbGlnbi1pdGVtczpjZW50ZXI7IGp1c3RpZnktY29udGVudDpjZW50ZXI7CiAgICBib3gtc2hhZG93OjAgNXB4IDAgcmdiYSgwLDAsMCwuMjgpLCAwIDhweCAxNHB4IHJnYmEoMCwwLDAsLjM1KSwgMCAxcHggMCByZ2JhKDI1NSwyNTUsMjU1LC40KSBpbnNldDsKICAgIHRyYW5zaXRpb246dHJhbnNmb3JtIC4xMnMgZWFzZSwgYm94LXNoYWRvdyAuMTJzIGVhc2U7CiAgICB0cmFuc2Zvcm06dHJhbnNsYXRlWig2cHgpOwogIH0KICAudGlsZTphY3RpdmV7IHRyYW5zZm9ybTp0cmFuc2xhdGVaKDJweCkgc2NhbGUoLjk0KTsgYm94LXNoYWRvdzowIDJweCAwIHJnYmEoMCwwLDAsLjI4KSwgMCAzcHggNnB4IHJnYmEoMCwwLDAsLjMpIGluc2V0OyB9CiAgLnRpbGUgLmdseXBoeyB3aWR0aDo0NiU7IGhlaWdodDo0NiU7IGZpbHRlcjpkcm9wLXNoYWRvdygwIDFweCAxcHggcmdiYSgwLDAsMCwuMzUpKTsgfQogIC50aWxlLnNoYWtleyBhbmltYXRpb246c2hha2VUaWxlIC4zNXMgZWFzZTsgfQogIEBrZXlmcmFtZXMgc2hha2VUaWxleyAwJSwxMDAleyB0cmFuc2Zvcm06dHJhbnNsYXRlWig2cHgpIHRyYW5zbGF0ZVgoMCk7fSAyMCV7dHJhbnNmb3JtOnRyYW5zbGF0ZVooNnB4KSB0cmFuc2xhdGVYKC01cHgpIHJvdGF0ZSgtNGRlZyk7fSA0MCV7dHJhbnNmb3JtOnRyYW5zbGF0ZVooNnB4KSB0cmFuc2xhdGVYKDVweCkgcm90YXRlKDRkZWcpO30gNjAle3RyYW5zZm9ybTp0cmFuc2xhdGVaKDZweCkgdHJhbnNsYXRlWCgtNHB4KSByb3RhdGUoLTNkZWcpO30gODAle3RyYW5zZm9ybTp0cmFuc2xhdGVaKDZweCkgdHJhbnNsYXRlWCg0cHgpIHJvdGF0ZSgzZGVnKTt9IH0KICAudGlsZS5zbGlkaW5neyB0cmFuc2l0aW9uOnRyYW5zZm9ybSAuMzhzIGN1YmljLWJlemllciguMywuNiwuMzUsMSksIG9wYWNpdHkgLjM4cyBlYXNlOyBvcGFjaXR5OjA7IH0KCiAgLnRyYWlseyBwb3NpdGlvbjphYnNvbHV0ZTsgei1pbmRleDoyOyBwb2ludGVyLWV2ZW50czpub25lOyBib3JkZXItcmFkaXVzOjZweDsgb3BhY2l0eTouNTU7IH0KICAuc3Bhcmt7IHBvc2l0aW9uOmZpeGVkOyB6LWluZGV4OjUwOyBwb2ludGVyLWV2ZW50czpub25lOyBib3JkZXItcmFkaXVzOjUwJTsgfQoKICAuc2NvcmUtZmx5eyBwb3NpdGlvbjpmaXhlZDsgei1pbmRleDo2MDsgcG9pbnRlci1ldmVudHM6bm9uZTsgZm9udC13ZWlnaHQ6OTAwOyBjb2xvcjp2YXIoLS1nb2xkKTsgdGV4dC1zaGFkb3c6MCAycHggOHB4IHJnYmEoMCwwLDAsLjUpOyBhbmltYXRpb246Zmx5VXAgLjhzIGVhc2UgZm9yd2FyZHM7IH0KICBAa2V5ZnJhbWVzIGZseVVweyAwJXsgb3BhY2l0eToxOyB0cmFuc2Zvcm06dHJhbnNsYXRlWSgwKSBzY2FsZSgxKTt9IDEwMCV7IG9wYWNpdHk6MDsgdHJhbnNmb3JtOnRyYW5zbGF0ZVkoLTQwcHgpIHNjYWxlKDEuMjUpO30gfQoKICAvKiA9PT09PT09PT09PT0gT1ZFUkxBWVMgPT09PT09PT09PT09ICovCiAgLm92ZXJsYXl7IHBvc2l0aW9uOmZpeGVkOyBpbnNldDowOyB6LWluZGV4OjgwOyBkaXNwbGF5OmZsZXg7IGFsaWduLWl0ZW1zOmNlbnRlcjsganVzdGlmeS1jb250ZW50OmNlbnRlcjsgYmFja2dyb3VuZDpyZ2JhKDMsMTAsMjAsLjc1KTsgYmFja2Ryb3AtZmlsdGVyOmJsdXIoNnB4KTsgYW5pbWF0aW9uOmZhZGVJbiAuMjVzIGVhc2U7IH0KICAub3ZlcmxheS1jYXJkewogICAgd2lkdGg6ODglOyBtYXgtd2lkdGg6MzQwcHg7IGJvcmRlci1yYWRpdXM6MjRweDsgcGFkZGluZzozMHB4IDI0cHg7IHRleHQtYWxpZ246Y2VudGVyOwogICAgYmFja2dyb3VuZDpsaW5lYXItZ3JhZGllbnQoMTY1ZGVnLCByZ2JhKDEwLDQwLDYwLC45NiksIHJnYmEoNCwxOCwzMCwuOTgpKTsKICAgIGJvcmRlcjoxcHggc29saWQgdmFyKC0tcGFuZWwtYnJkLWhpKTsgYm94LXNoYWRvdzowIDMwcHggODBweCByZ2JhKDAsMCwwLC41KTsKICAgIGFuaW1hdGlvbjpjYXJkUG9wIC40cyBjdWJpYy1iZXppZXIoLjIsLjksLjI1LDEuMyk7CiAgfQogIEBrZXlmcmFtZXMgY2FyZFBvcHsgZnJvbXsgdHJhbnNmb3JtOnNjYWxlKC44KTsgb3BhY2l0eTowO30gdG97IHRyYW5zZm9ybTpzY2FsZSgxKTsgb3BhY2l0eToxO30gfQogIC5vdmVybGF5LWljb257IGZvbnQtc2l6ZTo1MnB4OyBtYXJnaW4tYm90dG9tOjhweDsgZmlsdGVyOmRyb3Atc2hhZG93KDAgNnB4IDE4cHggcmdiYSg5MywyNDAsMjA4LC41KSk7IH0KICAub3ZlcmxheS10aXRsZXsgZm9udC1zaXplOjIycHg7IGZvbnQtd2VpZ2h0OjkwMDsgbWFyZ2luLWJvdHRvbTo2cHg7IH0KICAub3ZlcmxheS1zdWJ7IGZvbnQtc2l6ZToxM3B4OyBjb2xvcjp2YXIoLS10ZXh0LWRpbSk7IG1hcmdpbi1ib3R0b206MThweDsgfQogIC5vdmVybGF5LXNjb3JleyBmb250LXNpemU6MjZweDsgZm9udC13ZWlnaHQ6OTAwOyBjb2xvcjp2YXIoLS1nb2xkKTsgbWFyZ2luLWJvdHRvbTo0cHg7IH0KICAub3ZlcmxheS1idG5zeyBkaXNwbGF5OmZsZXg7IGZsZXgtZGlyZWN0aW9uOmNvbHVtbjsgZ2FwOjEwcHg7IG1hcmdpbi10b3A6MTZweDsgfQogIC5jb25mZXR0aXsgcG9zaXRpb246Zml4ZWQ7IHotaW5kZXg6ODE7IHRvcDotMTBweDsgYm9yZGVyLXJhZGl1czoycHg7IHBvaW50ZXItZXZlbnRzOm5vbmU7IH0KCiAgOjotd2Via2l0LXNjcm9sbGJhcnsgd2lkdGg6NnB4OyB9CiAgOjotd2Via2l0LXNjcm9sbGJhci10aHVtYnsgYmFja2dyb3VuZDpyZ2JhKDI1NSwyNTUsMjU1LC4yKTsgYm9yZGVyLXJhZGl1czo0cHg7IH0KCiAgQG1lZGlhIChtYXgtd2lkdGg6MzgwcHgpeyAudGl0bGV7IGZvbnQtc2l6ZToyNnB4OyB9IH0KPC9zdHlsZT4KPC9oZWFkPgo8Ym9keT4KPGRpdiBpZD0iYXBwIj4KCiAgPCEtLSA9PT09PT09PT09PT09PT09PSBNRU5VID09PT09PT09PT09PT09PT09IC0tPgogIDxkaXYgY2xhc3M9InNjcmVlbiIgaWQ9InNjci1tZW51Ij4KICAgIDxkaXYgY2xhc3M9ImxvZ28td3JhcCI+CiAgICAgIDxkaXYgY2xhc3M9ImxvZ28tYXJyb3dzIj7inqTinqTinqQ8L2Rpdj4KICAgICAgPGRpdiBjbGFzcz0idGl0bGUiPtin24zYsdmIINmB2YTZiDwvZGl2PgogICAgICA8ZGl2IGNsYXNzPSJzdWJ0aXRsZSI+QVJST1cgRkxPVyBQVVpaTEU8L2Rpdj4KICAgIDwvZGl2PgoKICAgIDxkaXYgY2xhc3M9InN0YXQtc3RyaXAiPgogICAgICA8ZGl2IGNsYXNzPSJzdGF0LWNoaXAiPjxiIGlkPSJzdGF0LWxldmVsIj4xPC9iPjxzcGFuPtmF2YjYrNmI2K/bgSDZhNuM2YjZhDwvc3Bhbj48L2Rpdj4KICAgICAgPGRpdiBjbGFzcz0ic3RhdC1jaGlwIj48YiBpZD0ic3RhdC1zdGFycyI+MDwvYj48c3Bhbj7irZAg2LPYqtin2LHbkjwvc3Bhbj48L2Rpdj4KICAgICAgPGRpdiBjbGFzcz0ic3RhdC1jaGlwIj48YiBpZD0ic3RhdC10b3RhbCI+NDU8L2I+PHNwYW4+2qnZhCDZhNuM2YjZhNiyPC9zcGFuPjwvZGl2PgogICAgPC9kaXY+CgogICAgPGRpdiBjbGFzcz0ibWVudS1hY3Rpb25zIj4KICAgICAgPGJ1dHRvbiBjbGFzcz0iYnRuIGJsb2NrIiBpZD0iYnRuLWNvbnRpbnVlIj48c3Bhbj7ilrbvuI88L3NwYW4+INqp2r7bjNmE2YbYpyDYrNin2LHbjCDYsdqp2r7bjNq6PC9idXR0b24+CiAgICAgIDxidXR0b24gY2xhc3M9ImJ0biBnaG9zdCBibG9jayIgaWQ9ImJ0bi1sZXZlbHMiPjxzcGFuPvCfl7rvuI88L3NwYW4+INmE24zZiNmEINmF2YbYqtiu2Kgg2qnYsduM2ro8L2J1dHRvbj4KICAgICAgPGJ1dHRvbiBjbGFzcz0iYnRuIGdob3N0IGJsb2NrIiBpZD0iYnRuLXJlc3RhcnQtcHJvZ3Jlc3MiPjxzcGFuPvCflIQ8L3NwYW4+INm+24zYtCDYsdmB2Kog2K/ZiNio2KfYsduBINi02LHZiNi5INqp2LHbjNq6PC9idXR0b24+CiAgICA8L2Rpdj4KCiAgICA8ZGl2IGNsYXNzPSJzb3VuZC1yb3ciPgogICAgICA8YnV0dG9uIGNsYXNzPSJpY29uYnRuIiBpZD0iYnRuLW11c2ljLW1lbnUiIHRpdGxlPSLZhduM2YjYstqpIj7wn461PC9idXR0b24+CiAgICAgIDxidXR0b24gY2xhc3M9Imljb25idG4iIGlkPSJidG4tc291bmQtbWVudSIgdGl0bGU9Itiz2KfYpNmG2ogg2KfbjNmB24zaqdm52LMiPvCflIo8L2J1dHRvbj4KICAgIDwvZGl2PgogIDwvZGl2PgoKICA8IS0tID09PT09PT09PT09PT09PT09IExFVkVMIFNFTEVDVCA9PT09PT09PT09PT09PT09PSAtLT4KICA8ZGl2IGNsYXNzPSJzY3JlZW4gaGlkZGVuIiBpZD0ic2NyLWxldmVscyI+CiAgICA8ZGl2IGNsYXNzPSJsdmwtaGVhZGVyIj4KICAgICAgPGJ1dHRvbiBjbGFzcz0iaWNvbmJ0biIgaWQ9ImJ0bi1sZXZlbHMtYmFjayI+4p6h77iPPC9idXR0b24+CiAgICAgIDxoMj7ZhNuM2YjZhCDZhdmG2KrYrtioINqp2LHbjNq6PC9oMj4KICAgICAgPGRpdiBzdHlsZT0id2lkdGg6NDJweDsiPjwvZGl2PgogICAgPC9kaXY+CiAgICA8ZGl2IGNsYXNzPSJsdmwtZ3JpZCIgaWQ9Imx2bC1ncmlkIj48L2Rpdj4KICA8L2Rpdj4KCiAgPCEtLSA9PT09PT09PT09PT09PT09PSBHQU1FID09PT09PT09PT09PT09PT09IC0tPgogIDxkaXYgY2xhc3M9InNjcmVlbiBoaWRkZW4iIGlkPSJzY3ItZ2FtZSI+CiAgICA8ZGl2IGNsYXNzPSJnYW1lLXRvcCI+CiAgICAgIDxkaXYgY2xhc3M9InJpZ2h0Ij4KICAgICAgICA8YnV0dG9uIGNsYXNzPSJpY29uYnRuIiBpZD0iYnRuLWdhbWUtYmFjayI+4p6h77iPPC9idXR0b24+CiAgICAgICAgPGRpdiBjbGFzcz0ibHZsLWJhZGdlIj7ZhNuM2YjZhCA8c3BhbiBpZD0iZ2FtZS1sZXZlbCI+MTwvc3Bhbj48L2Rpdj4KICAgICAgPC9kaXY+CiAgICAgIDxkaXYgY2xhc3M9ImxlZnQiPgogICAgICAgIDxidXR0b24gY2xhc3M9Imljb25idG4iIGlkPSJidG4tbXVzaWMtZ2FtZSI+8J+OtTwvYnV0dG9uPgogICAgICAgIDxidXR0b24gY2xhc3M9Imljb25idG4iIGlkPSJidG4tc291bmQtZ2FtZSI+8J+UijwvYnV0dG9uPgogICAgICAgIDxidXR0b24gY2xhc3M9Imljb25idG4iIGlkPSJidG4tcmVzdGFydC1sZXZlbCI+8J+UgTwvYnV0dG9uPgogICAgICA8L2Rpdj4KICAgIDwvZGl2PgoKICAgIDxkaXYgY2xhc3M9InByb2dyZXNzLXdyYXAiPgogICAgICA8ZGl2IGNsYXNzPSJwcm9ncmVzcy1sYWJlbHMiPgogICAgICAgIDxzcGFuIGlkPSJjbGVhcmVkLWxhYmVsIj7Ytdin2YE6IDAgLyAwPC9zcGFuPgogICAgICAgIDxzcGFuIGlkPSJtaXN0YWtlLWxhYmVsIj7YutmE2LfbjNin2ro6IDA8L3NwYW4+CiAgICAgIDwvZGl2PgogICAgICA8ZGl2IGNsYXNzPSJwcm9ncmVzcy10cmFjayI+PGRpdiBjbGFzcz0icHJvZ3Jlc3MtZmlsbCIgaWQ9InByb2dyZXNzLWZpbGwiIHN0eWxlPSJ3aWR0aDowJSI+PC9kaXY+PC9kaXY+CiAgICA8L2Rpdj4KCiAgICA8ZGl2IGNsYXNzPSJib2FyZC1zY2VuZSI+CiAgICAgIDxkaXYgY2xhc3M9ImJvYXJkLXdyYXAiPjxkaXYgaWQ9ImJvYXJkIj48L2Rpdj48L2Rpdj4KICAgIDwvZGl2PgogIDwvZGl2PgoKPC9kaXY+Cgo8c2NyaXB0PgooZnVuY3Rpb24oKXsKInVzZSBzdHJpY3QiOwoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIENPTkZJRwo9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KY29uc3QgTEVWRUxfQ09VTlQgPSA0NTsKY29uc3QgU1RPUkVfS0VZID0gJ2Fycm93Zmxvdzpwcm9ncmVzcyc7Cgpjb25zdCBDT0xPUlMgPSBbCiAge2E6JyNmZjhhOWMnLCBiOicjZTkxZTYzJ30sIHthOicjNWFkMGZmJywgYjonIzE1NjVjMCd9LCB7YTonIzdiZjBiMCcsIGI6JyMwZjllNzMnfSwKICB7YTonI2ZmZDY2YicsIGI6JyNmZjhhMDAnfSwge2E6JyNkNTliZmYnLCBiOicjN2MzYWVkJ30sIHthOicjZmZiM2Q5JywgYjonI2Q2MzM2Yyd9LAogIHthOicjN2ZlOWRmJywgYjonIzBmOWU5ZSd9LCB7YTonI2ZmZTA4YScsIGI6JyNmMmI3MDUnfSwKXTsKY29uc3QgRElSUyA9IFsndXAnLCdyaWdodCcsJ2Rvd24nLCdsZWZ0J107CmNvbnN0IERJUl9ERUxUQSA9IHsgdXA6Wy0xLDBdLCBkb3duOlsxLDBdLCBsZWZ0OlswLC0xXSwgcmlnaHQ6WzAsMV0gfTsKY29uc3QgRElSX0RFRyAgID0geyB1cDowLCByaWdodDo5MCwgZG93bjoxODAsIGxlZnQ6MjcwIH07CgpmdW5jdGlvbiBncmlkU2l6ZUZvckxldmVsKGx2bCl7CiAgaWYobHZsPD04KSByZXR1cm4gNDsKICBpZihsdmw8PTE2KSByZXR1cm4gNTsKICBpZihsdmw8PTI0KSByZXR1cm4gNjsKICBpZihsdmw8PTMyKSByZXR1cm4gNzsKICBpZihsdmw8PTQwKSByZXR1cm4gODsKICByZXR1cm4gOTsKfQpmdW5jdGlvbiBkZW5zaXR5Rm9yTGV2ZWwobHZsKXsgcmV0dXJuIE1hdGgubWluKDAuNjAsIDAuMzQgKyAobHZsL0xFVkVMX0NPVU5UKSowLjI4KTsgfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIFNFRURFRCBSTkcgKGRldGVybWluaXN0aWMgcGVyIGxldmVsKQo9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KZnVuY3Rpb24gbXVsYmVycnkzMihzZWVkKXsKICByZXR1cm4gZnVuY3Rpb24oKXsKICAgIHNlZWQgfD0gMDsgc2VlZCA9IChzZWVkICsgMHg2RDJCNzlGNSkgfCAwOwogICAgbGV0IHQgPSBNYXRoLmltdWwoc2VlZCBeIChzZWVkID4+PiAxNSksIDEgfCBzZWVkKTsKICAgIHQgPSAodCArIE1hdGguaW11bCh0IF4gKHQgPj4+IDcpLCA2MSB8IHQpKSBeIHQ7CiAgICByZXR1cm4gKCh0IF4gKHQgPj4+IDE0KSkgPj4+IDApIC8gNDI5NDk2NzI5NjsKICB9Owp9CmZ1bmN0aW9uIHJhbmRJbnQocm5nLCBuKXsgcmV0dXJuIE1hdGguZmxvb3Iocm5nKCkqbik7IH0KZnVuY3Rpb24gcmFuZENob2ljZShybmcsIGFycil7IHJldHVybiBhcnJbcmFuZEludChybmcsIGFyci5sZW5ndGgpXTsgfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIExFVkVMIEdFTkVSQVRJT04g4oCUIGd1YXJhbnRlZWQgc29sdmFibGUgdmlhIHJldmVyc2UgY29uc3RydWN0aW9uOgogICBlYWNoIGFycm93IGlzIHBsYWNlZCBvbmx5IGluIGEgZGlyZWN0aW9uIHdob3NlIHBhdGgtdG8tZWRnZSBpcwogICBjbGVhciBBVCBQTEFDRU1FTlQgVElNRSwgd2hpY2ggbWF0aGVtYXRpY2FsbHkgZ3VhcmFudGVlcyB0aGUKICAgYm9hcmQgY2FuIGFsd2F5cyBiZSBjbGVhcmVkIChuZXZlciBhIGRlYWQtbG9jayksIGluIEFOWSBvcmRlcgogICB0aGUgcGxheWVyIGNob29zZXMgYW1vbmcgY3VycmVudGx5LWNsZWFyYWJsZSBhcnJvd3MuCj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpmdW5jdGlvbiBwYXRoQ2xlYXIoZ3JpZCwgTiwgciwgYywgZGlyKXsKICBjb25zdCBbZHIsZGNdID0gRElSX0RFTFRBW2Rpcl07CiAgbGV0IHJyPXIrZHIsIGNjPWMrZGM7CiAgd2hpbGUocnI+PTAgJiYgcnI8TiAmJiBjYz49MCAmJiBjYzxOKXsKICAgIGlmKGdyaWRbcnJdW2NjXSkgcmV0dXJuIGZhbHNlOwogICAgcnIrPWRyOyBjYys9ZGM7CiAgfQogIHJldHVybiB0cnVlOwp9CgpmdW5jdGlvbiBnZW5lcmF0ZUxldmVsKGxldmVsTnVtKXsKICBjb25zdCBybmcgPSBtdWxiZXJyeTMyKGxldmVsTnVtKjc5MTkgKyAxMDQ3MjkpOwogIGNvbnN0IE4gPSBncmlkU2l6ZUZvckxldmVsKGxldmVsTnVtKTsKICBjb25zdCBkZW5zaXR5ID0gZGVuc2l0eUZvckxldmVsKGxldmVsTnVtKTsKICBjb25zdCB0YXJnZXRDb3VudCA9IE1hdGgubWF4KDQsIE1hdGgucm91bmQoTipOKmRlbnNpdHkpKTsKICBjb25zdCBncmlkID0gW107CiAgZm9yKGxldCByPTA7cjxOO3IrKykgZ3JpZC5wdXNoKG5ldyBBcnJheShOKS5maWxsKG51bGwpKTsKCiAgbGV0IHBsYWNlZCA9IDAsIGF0dGVtcHRzID0gMDsKICBjb25zdCBtYXhBdHRlbXB0cyA9IHRhcmdldENvdW50ICogNDA7CiAgd2hpbGUocGxhY2VkIDwgdGFyZ2V0Q291bnQgJiYgYXR0ZW1wdHMgPCBtYXhBdHRlbXB0cyl7CiAgICBhdHRlbXB0cysrOwogICAgY29uc3QgciA9IHJhbmRJbnQocm5nLE4pLCBjID0gcmFuZEludChybmcsTik7CiAgICBpZihncmlkW3JdW2NdKSBjb250aW51ZTsKICAgIGNvbnN0IHZhbGlkRGlycyA9IERJUlMuZmlsdGVyKGQ9PnBhdGhDbGVhcihncmlkLE4scixjLGQpKTsKICAgIGlmKHZhbGlkRGlycy5sZW5ndGg9PT0wKSBjb250aW51ZTsKICAgIGNvbnN0IGRpciA9IHJhbmRDaG9pY2Uocm5nLCB2YWxpZERpcnMpOwogICAgY29uc3QgY29sb3IgPSByYW5kQ2hvaWNlKHJuZywgQ09MT1JTKTsKICAgIGdyaWRbcl1bY10gPSB7IGlkOidhJytyKydfJytjKydfJytwbGFjZWQsIGRpciwgY29sb3IgfTsKICAgIHBsYWNlZCsrOwogIH0KICByZXR1cm4geyBOLCBncmlkLCB0b3RhbDogcGxhY2VkIH07Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICBQRVJTSVNURU5UIFNUT1JBR0UgKGxvY2FsU3RvcmFnZSDigJQgZW1iZWRkZWQgaW5zaWRlIHRoZSBpbnN0YWxsbWVudCBhcHApCj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpsZXQgcHJvZ3Jlc3MgPSB7IHVubG9ja2VkOjEsIHN0YXJzOnt9LCBzb3VuZE9uOnRydWUsIG11c2ljT246dHJ1ZSB9Owphc3luYyBmdW5jdGlvbiBsb2FkUHJvZ3Jlc3MoKXsKICB0cnl7CiAgICBjb25zdCByYXcgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShTVE9SRV9LRVkpOwogICAgaWYocmF3KXsgcHJvZ3Jlc3MgPSBPYmplY3QuYXNzaWduKHByb2dyZXNzLCBKU09OLnBhcnNlKHJhdykpOyB9CiAgfWNhdGNoKGUpe30KICByZW5kZXJNZW51U3RhdHMoKTsKfQphc3luYyBmdW5jdGlvbiBzYXZlUHJvZ3Jlc3MoKXsgdHJ5eyBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShTVE9SRV9LRVksIEpTT04uc3RyaW5naWZ5KHByb2dyZXNzKSk7IH1jYXRjaChlKXt9IH0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICBTT1VORCDigJQgU0ZYICsgcHJvY2VkdXJhbCBhbWJpZW50IG11c2ljIChXZWIgQXVkaW8sIG5vIGFzc2V0cykKPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCmxldCBhY3R4ID0gbnVsbDsKZnVuY3Rpb24gZW5zdXJlQXVkaW8oKXsKICBpZighYWN0eCl7IHRyeXsgYWN0eCA9IG5ldyAod2luZG93LkF1ZGlvQ29udGV4dHx8d2luZG93LndlYmtpdEF1ZGlvQ29udGV4dCkoKTsgfWNhdGNoKGUpeyBhY3R4PW51bGw7IH0gfQogIGlmKGFjdHggJiYgYWN0eC5zdGF0ZT09PSdzdXNwZW5kZWQnKSBhY3R4LnJlc3VtZSgpOwp9CmZ1bmN0aW9uIHRvbmUoZnJlcSwgc3RhcnQsIGR1ciwgdHlwZSwgdm9sKXsKICBpZighcHJvZ3Jlc3Muc291bmRPbiB8fCAhYWN0eCkgcmV0dXJuOwogIGNvbnN0IHQwID0gYWN0eC5jdXJyZW50VGltZStzdGFydDsKICBjb25zdCBvc2MgPSBhY3R4LmNyZWF0ZU9zY2lsbGF0b3IoKSwgZ2FpbiA9IGFjdHguY3JlYXRlR2FpbigpOwogIG9zYy50eXBlID0gdHlwZXx8J3NpbmUnOwogIG9zYy5mcmVxdWVuY3kuc2V0VmFsdWVBdFRpbWUoZnJlcSwgdDApOwogIGdhaW4uZ2Fpbi5zZXRWYWx1ZUF0VGltZSgwLCB0MCk7CiAgZ2Fpbi5nYWluLmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKHZvbCE9bnVsbD92b2w6MC4xNiwgdDArMC4wMTIpOwogIGdhaW4uZ2Fpbi5leHBvbmVudGlhbFJhbXBUb1ZhbHVlQXRUaW1lKDAuMDAxLCB0MCtkdXIpOwogIG9zYy5jb25uZWN0KGdhaW4pOyBnYWluLmNvbm5lY3QoYWN0eC5kZXN0aW5hdGlvbik7CiAgb3NjLnN0YXJ0KHQwKTsgb3NjLnN0b3AodDArZHVyKzAuMDIpOwp9CmNvbnN0IFNORCA9IHsKICBzbGlkZSgpeyB0b25lKDcyMCwwLC4xLCd0cmlhbmdsZScsMC4xMyk7IHRvbmUoOTgwLDAuMDMsLjEyLCdzaW5lJywwLjA5KTsgfSwKICBibG9ja2VkKCl7IHRvbmUoMTYwLDAsLjEsJ3NxdWFyZScsMC4wOSk7IH0sCiAgd2luKCl7IFs1MjMsNjU5LDc4NCwxMDQ3LDEzMTldLmZvckVhY2goKGYsaSk9PnRvbmUoZixpKjAuMDksLjM1LCd0cmlhbmdsZScsMC4xNykpOyB9LAogIGNsaWNrKCl7IHRvbmUoNjAwLDAsLjA1LCdzcXVhcmUnLDAuMDgpOyB9LAp9OwoKLyogc29mdCBhbWJpZW50IHBhZCBsb29wICovCmxldCBtdXNpY1RpbWVyID0gbnVsbDsKY29uc3QgQ0hPUkRTID0gWyBbMjIwLDI3NywzMzBdLCBbMTk2LDI0NywyOTRdLCBbMTc0LjYsMjIwLDI2MS42XSwgWzE5NiwyNDcsMjk0XSBdOwpsZXQgY2hvcmRJZHggPSAwOwpmdW5jdGlvbiBwbGF5Q2hvcmQoZnJlcXMpewogIGlmKCFwcm9ncmVzcy5tdXNpY09uIHx8ICFhY3R4KSByZXR1cm47CiAgY29uc3QgdDAgPSBhY3R4LmN1cnJlbnRUaW1lOwogIGZyZXFzLmZvckVhY2goKGYsaSk9PnsKICAgIGNvbnN0IG9zYyA9IGFjdHguY3JlYXRlT3NjaWxsYXRvcigpLCBnYWluID0gYWN0eC5jcmVhdGVHYWluKCk7CiAgICBvc2MudHlwZT0nc2luZSc7IG9zYy5mcmVxdWVuY3kuc2V0VmFsdWVBdFRpbWUoZiwgdDApOwogICAgZ2Fpbi5nYWluLnNldFZhbHVlQXRUaW1lKDAsIHQwKTsKICAgIGdhaW4uZ2Fpbi5saW5lYXJSYW1wVG9WYWx1ZUF0VGltZSgwLjAzNSwgdDArMS4xKTsKICAgIGdhaW4uZ2Fpbi5saW5lYXJSYW1wVG9WYWx1ZUF0VGltZSgwLjAwMDEsIHQwKzQuNik7CiAgICBvc2MuY29ubmVjdChnYWluKTsgZ2Fpbi5jb25uZWN0KGFjdHguZGVzdGluYXRpb24pOwogICAgb3NjLnN0YXJ0KHQwKTsgb3NjLnN0b3AodDArNC43KTsKICB9KTsKfQpmdW5jdGlvbiBzdGFydE11c2ljKCl7CiAgaWYobXVzaWNUaW1lcikgcmV0dXJuOwogIGVuc3VyZUF1ZGlvKCk7CiAgaWYoIXByb2dyZXNzLm11c2ljT24pIHJldHVybjsKICBwbGF5Q2hvcmQoQ0hPUkRTW2Nob3JkSWR4ICUgQ0hPUkRTLmxlbmd0aF0pOyBjaG9yZElkeCsrOwogIG11c2ljVGltZXIgPSBzZXRJbnRlcnZhbCgoKT0+ewogICAgaWYoIXByb2dyZXNzLm11c2ljT24peyBzdG9wTXVzaWMoKTsgcmV0dXJuOyB9CiAgICBwbGF5Q2hvcmQoQ0hPUkRTW2Nob3JkSWR4ICUgQ0hPUkRTLmxlbmd0aF0pOyBjaG9yZElkeCsrOwogIH0sIDQyMDApOwp9CmZ1bmN0aW9uIHN0b3BNdXNpYygpeyBpZihtdXNpY1RpbWVyKXsgY2xlYXJJbnRlcnZhbChtdXNpY1RpbWVyKTsgbXVzaWNUaW1lcj1udWxsOyB9IH0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICBTVEFURQo9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KbGV0IGN1ckxldmVsID0gMSwgY3VyTiA9IDQsIGN1ckdyaWQgPSBbXSwgdG90YWxBcnJvd3MgPSAwLCBjbGVhcmVkQ291bnQgPSAwLCBtaXN0YWtlcyA9IDA7CmxldCBib2FyZEVsOwoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIE5BVklHQVRJT04KPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCmNvbnN0IHNjcmVlbnMgPSB7IG1lbnU6J3Njci1tZW51JywgbGV2ZWxzOidzY3ItbGV2ZWxzJywgZ2FtZTonc2NyLWdhbWUnIH07CmZ1bmN0aW9uIHNob3dTY3JlZW4obmFtZSl7CiAgT2JqZWN0LnZhbHVlcyhzY3JlZW5zKS5mb3JFYWNoKGlkPT5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCkuY2xhc3NMaXN0LmFkZCgnaGlkZGVuJykpOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHNjcmVlbnNbbmFtZV0pLmNsYXNzTGlzdC5yZW1vdmUoJ2hpZGRlbicpOwp9CgpmdW5jdGlvbiByZW5kZXJNZW51U3RhdHMoKXsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc3RhdC1sZXZlbCcpLnRleHRDb250ZW50ID0gcHJvZ3Jlc3MudW5sb2NrZWQ7CiAgY29uc3Qgc3RhclRvdGFsID0gT2JqZWN0LnZhbHVlcyhwcm9ncmVzcy5zdGFycykucmVkdWNlKChhLGIpPT5hK2IsMCk7CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3N0YXQtc3RhcnMnKS50ZXh0Q29udGVudCA9IHN0YXJUb3RhbDsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc3RhdC10b3RhbCcpLnRleHRDb250ZW50ID0gTEVWRUxfQ09VTlQ7CiAgdXBkYXRlVG9nZ2xlSWNvbnMoKTsKfQpmdW5jdGlvbiB1cGRhdGVUb2dnbGVJY29ucygpewogIGNvbnN0IHMgPSBwcm9ncmVzcy5zb3VuZE9uID8gJ/CflIonIDogJ/CflIgnOwogIGNvbnN0IG0gPSBwcm9ncmVzcy5tdXNpY09uID8gJ/CfjrUnIDogJ/CflIcnOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdidG4tc291bmQtbWVudScpLnRleHRDb250ZW50ID0gczsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYnRuLXNvdW5kLWdhbWUnKS50ZXh0Q29udGVudCA9IHM7CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2J0bi1tdXNpYy1tZW51JykudGV4dENvbnRlbnQgPSBtOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdidG4tbXVzaWMtZ2FtZScpLnRleHRDb250ZW50ID0gbTsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYnRuLXNvdW5kLW1lbnUnKS5jbGFzc0xpc3QudG9nZ2xlKCdvbicsIHByb2dyZXNzLnNvdW5kT24pOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdidG4tc291bmQtZ2FtZScpLmNsYXNzTGlzdC50b2dnbGUoJ29uJywgcHJvZ3Jlc3Muc291bmRPbik7CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2J0bi1tdXNpYy1tZW51JykuY2xhc3NMaXN0LnRvZ2dsZSgnb24nLCBwcm9ncmVzcy5tdXNpY09uKTsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYnRuLW11c2ljLWdhbWUnKS5jbGFzc0xpc3QudG9nZ2xlKCdvbicsIHByb2dyZXNzLm11c2ljT24pOwp9CgpmdW5jdGlvbiByZW5kZXJMZXZlbEdyaWQoKXsKICBjb25zdCBncmlkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2x2bC1ncmlkJyk7CiAgZ3JpZC5pbm5lckhUTUwgPSAnJzsKICBmb3IobGV0IGk9MTtpPD1MRVZFTF9DT1VOVDtpKyspewogICAgY29uc3QgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7CiAgICBjb25zdCBkb25lID0gISFwcm9ncmVzcy5zdGFyc1tpXTsKICAgIGNvbnN0IGxvY2tlZCA9IGkgPiBwcm9ncmVzcy51bmxvY2tlZDsKICAgIGRpdi5jbGFzc05hbWUgPSAnbHZsLWNlbGwgJyArIChsb2NrZWQ/J2xvY2tlZCc6KGRvbmU/J2RvbmUnOihpPT09cHJvZ3Jlc3MudW5sb2NrZWQ/J2N1cnJlbnQnOicnKSkpOwogICAgZGl2LmlubmVySFRNTCA9IGA8ZGl2PiR7aX08L2Rpdj5gICsgKGRvbmU/YDxkaXYgY2xhc3M9InN0YXIiPiR7J+KtkCcucmVwZWF0KHByb2dyZXNzLnN0YXJzW2ldKX08L2Rpdj5gOicnKTsKICAgIGlmKCFsb2NrZWQpIGRpdi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpPT57IFNORC5jbGljaygpOyBzdGFydExldmVsKGkpOyB9KTsKICAgIGdyaWQuYXBwZW5kQ2hpbGQoZGl2KTsKICB9Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICBMRVZFTCBTVEFSVCAvIFJFTkRFUgo9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KZnVuY3Rpb24gc3RhcnRMZXZlbChsdmwpewogIGN1ckxldmVsID0gbHZsOwogIGNvbnN0IGdlbiA9IGdlbmVyYXRlTGV2ZWwobHZsKTsKICBjdXJOID0gZ2VuLk47IGN1ckdyaWQgPSBnZW4uZ3JpZDsgdG90YWxBcnJvd3MgPSBnZW4udG90YWw7CiAgY2xlYXJlZENvdW50ID0gMDsgbWlzdGFrZXMgPSAwOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdnYW1lLWxldmVsJykudGV4dENvbnRlbnQgPSBsdmw7CiAgdXBkYXRlSHVkKCk7CiAgcmVuZGVyQm9hcmQoKTsKICBzaG93U2NyZWVuKCdnYW1lJyk7CiAgc3RhcnRNdXNpYygpOwp9CgpmdW5jdGlvbiB1cGRhdGVIdWQoKXsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2xlYXJlZC1sYWJlbCcpLnRleHRDb250ZW50ID0gYNi12KfZgTogJHtjbGVhcmVkQ291bnR9IC8gJHt0b3RhbEFycm93c31gOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtaXN0YWtlLWxhYmVsJykudGV4dENvbnRlbnQgPSBg2LrZhNi324zYp9q6OiAke21pc3Rha2VzfWA7CiAgY29uc3QgcGN0ID0gdG90YWxBcnJvd3MgPyBNYXRoLnJvdW5kKGNsZWFyZWRDb3VudC90b3RhbEFycm93cyoxMDApIDogMDsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncHJvZ3Jlc3MtZmlsbCcpLnN0eWxlLndpZHRoID0gcGN0KyclJzsKfQoKZnVuY3Rpb24gY2VsbFNpemVGb3JCb2FyZCgpewogIGNvbnN0IGF2YWlsYWJsZSA9IE1hdGgubWluKDQwMCwgd2luZG93LmlubmVyV2lkdGggLSA2MCk7CiAgY29uc3QgZ2FwID0gNDsKICBjb25zdCBzaXplID0gTWF0aC5mbG9vcigoYXZhaWxhYmxlIC0gZ2FwKihjdXJOLTEpKSAvIGN1ck4pOwogIHJldHVybiBNYXRoLm1heCgyOCwgTWF0aC5taW4oNjQsIHNpemUpKTsKfQoKZnVuY3Rpb24gYXJyb3dHbHlwaFNWRyhjb2xvcil7CiAgcmV0dXJuIGA8c3ZnIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiBjbGFzcz0iZ2x5cGgiIHN0eWxlPSJmaWx0ZXI6ZHJvcC1zaGFkb3coMCAxcHggMXB4IHJnYmEoMCwwLDAsLjQpKTsiPgogICAgPHBvbHlnb24gcG9pbnRzPSI1MCw0IDkyLDU4IDY4LDU4IDY4LDk2IDMyLDk2IDMyLDU4IDgsNTgiIGZpbGw9IiR7Y29sb3J9Ii8+CiAgPC9zdmc+YDsKfQoKZnVuY3Rpb24gcmVuZGVyQm9hcmQoKXsKICBib2FyZEVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JvYXJkJyk7CiAgYm9hcmRFbC5pbm5lckhUTUwgPSAnJzsKICBjb25zdCBjZWxsUHggPSBjZWxsU2l6ZUZvckJvYXJkKCk7CiAgYm9hcmRFbC5zdHlsZS5ncmlkVGVtcGxhdGVDb2x1bW5zID0gYHJlcGVhdCgke2N1ck59LCAke2NlbGxQeH1weClgOwogIGJvYXJkRWwuc3R5bGUuZ3JpZFRlbXBsYXRlUm93cyA9IGByZXBlYXQoJHtjdXJOfSwgJHtjZWxsUHh9cHgpYDsKICBib2FyZEVsLnN0eWxlLmdhcCA9ICc0cHgnOwoKICBmb3IobGV0IHI9MDtyPGN1ck47cisrKXsKICAgIGZvcihsZXQgYz0wO2M8Y3VyTjtjKyspewogICAgICBjb25zdCBjZWxsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7CiAgICAgIGNlbGwuY2xhc3NOYW1lID0gJ2NlbGwnOwogICAgICBjZWxsLnN0eWxlLndpZHRoID0gY2VsbFB4KydweCc7IGNlbGwuc3R5bGUuaGVpZ2h0ID0gY2VsbFB4KydweCc7CiAgICAgIGNlbGwuZGF0YXNldC5yPXI7IGNlbGwuZGF0YXNldC5jPWM7CiAgICAgIGNvbnN0IHYgPSBjdXJHcmlkW3JdW2NdOwogICAgICBpZih2KXsKICAgICAgICBjb25zdCB0aWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7CiAgICAgICAgdGlsZS5jbGFzc05hbWUgPSAndGlsZSc7CiAgICAgICAgdGlsZS5kYXRhc2V0LnI9cjsgdGlsZS5kYXRhc2V0LmM9YzsKICAgICAgICB0aWxlLnN0eWxlLmJhY2tncm91bmQgPSBgbGluZWFyLWdyYWRpZW50KDE1MGRlZywgJHt2LmNvbG9yLmF9LCAke3YuY29sb3IuYn0pYDsKICAgICAgICB0aWxlLmlubmVySFRNTCA9IGFycm93R2x5cGhTVkcoJ3JnYmEoMjU1LDI1NSwyNTUsMC45NSknKTsKICAgICAgICB0aWxlLnF1ZXJ5U2VsZWN0b3IoJy5nbHlwaCcpLnN0eWxlLnRyYW5zZm9ybSA9IGByb3RhdGUoJHtESVJfREVHW3YuZGlyXX1kZWcpYDsKICAgICAgICB0aWxlLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCk9Pm9uVGlsZVRhcChyLGMpKTsKICAgICAgICBjZWxsLmFwcGVuZENoaWxkKHRpbGUpOwogICAgICB9CiAgICAgIGJvYXJkRWwuYXBwZW5kQ2hpbGQoY2VsbCk7CiAgICB9CiAgfQp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAgVEFQIEhBTkRMSU5HCj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpmdW5jdGlvbiBvblRpbGVUYXAocixjKXsKICBlbnN1cmVBdWRpbygpOwogIGNvbnN0IHYgPSBjdXJHcmlkW3JdW2NdOwogIGlmKCF2KSByZXR1cm47CiAgaWYocGF0aENsZWFyKGN1ckdyaWQsIGN1ck4sIHIsIGMsIHYuZGlyKSl7CiAgICBzbGlkZUFuZENsZWFyKHIsYyx2KTsKICB9IGVsc2UgewogICAgbWlzdGFrZXMrKzsKICAgIHVwZGF0ZUh1ZCgpOwogICAgU05ELmJsb2NrZWQoKTsKICAgIGNvbnN0IHRpbGVFbCA9IGJvYXJkRWwucXVlcnlTZWxlY3RvcihgLnRpbGVbZGF0YS1yPSIke3J9Il1bZGF0YS1jPSIke2N9Il1gKTsKICAgIGlmKHRpbGVFbCl7IHRpbGVFbC5jbGFzc0xpc3QucmVtb3ZlKCdzaGFrZScpOyB2b2lkIHRpbGVFbC5vZmZzZXRXaWR0aDsgdGlsZUVsLmNsYXNzTGlzdC5hZGQoJ3NoYWtlJyk7IH0KICB9Cn0KCmZ1bmN0aW9uIHNsaWRlQW5kQ2xlYXIocixjLHYpewogIGNvbnN0IHRpbGVFbCA9IGJvYXJkRWwucXVlcnlTZWxlY3RvcihgLnRpbGVbZGF0YS1yPSIke3J9Il1bZGF0YS1jPSIke2N9Il1gKTsKICBjb25zdCBjZWxsUHggPSBjZWxsU2l6ZUZvckJvYXJkKCk7CiAgY29uc3QgW2RyLGRjXSA9IERJUl9ERUxUQVt2LmRpcl07CiAgY29uc3Qgc3RlcHMgPSAoZHIhPT0wKSA/IChkcjwwID8gcisyIDogY3VyTi1yKzEpIDogKGRjPDAgPyBjKzIgOiBjdXJOLWMrMSk7CiAgY29uc3QgZHggPSBkYypzdGVwcyooY2VsbFB4KzQpOwogIGNvbnN0IGR5ID0gZHIqc3RlcHMqKGNlbGxQeCs0KTsKCiAgY3VyR3JpZFtyXVtjXSA9IG51bGw7CiAgY2xlYXJlZENvdW50Kys7CiAgU05ELnNsaWRlKCk7CiAgdXBkYXRlSHVkKCk7CiAgc3Bhd25TY29yZUZseSh0aWxlRWwsIDEwKTsKCiAgaWYodGlsZUVsKXsKICAgIHRpbGVFbC5zdHlsZS56SW5kZXggPSA1OwogICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpPT57CiAgICAgIHRpbGVFbC5jbGFzc0xpc3QuYWRkKCdzbGlkaW5nJyk7CiAgICAgIHRpbGVFbC5zdHlsZS50cmFuc2Zvcm0gPSBgdHJhbnNsYXRlWig2cHgpIHRyYW5zbGF0ZSgke2R4fXB4LCAke2R5fXB4KSBzY2FsZSguNylgOwogICAgfSk7CiAgICBzZXRUaW1lb3V0KCgpPT57CiAgICAgIHNwYXduU3BhcmtBdEVkZ2UodGlsZUVsLCB2LmNvbG9yKTsKICAgICAgdGlsZUVsLnJlbW92ZSgpOwogICAgfSwgMzgwKTsKICB9CgogIGlmKGNsZWFyZWRDb3VudCA+PSB0b3RhbEFycm93cyl7CiAgICBzZXRUaW1lb3V0KCgpPT53aW5MZXZlbCgpLCA0MjApOwogIH0KfQoKZnVuY3Rpb24gc3Bhd25TY29yZUZseSh0aWxlRWwsIGFtb3VudCl7CiAgaWYoIXRpbGVFbCkgcmV0dXJuOwogIGNvbnN0IHJlY3QgPSB0aWxlRWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7CiAgY29uc3QgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTsKICBlbC5jbGFzc05hbWUgPSAnc2NvcmUtZmx5JzsKICBlbC5zdHlsZS5sZWZ0ID0gKHJlY3QubGVmdCtyZWN0LndpZHRoLzItMTApKydweCc7CiAgZWwuc3R5bGUudG9wID0gcmVjdC50b3ArJ3B4JzsKICBlbC5zdHlsZS5mb250U2l6ZSA9ICcxNXB4JzsKICBlbC50ZXh0Q29udGVudCA9ICcrJythbW91bnQ7CiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChlbCk7CiAgc2V0VGltZW91dCgoKT0+ZWwucmVtb3ZlKCksIDg1MCk7Cn0KCmZ1bmN0aW9uIHNwYXduU3BhcmtBdEVkZ2UodGlsZUVsLCBjb2xvcil7CiAgaWYoIXRpbGVFbCkgcmV0dXJuOwogIGNvbnN0IHJlY3QgPSB0aWxlRWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7CiAgY29uc3QgY3ggPSByZWN0LmxlZnQrcmVjdC53aWR0aC8yLCBjeSA9IHJlY3QudG9wK3JlY3QuaGVpZ2h0LzI7CiAgZm9yKGxldCBpPTA7aTw4O2krKyl7CiAgICBjb25zdCBzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7CiAgICBzLmNsYXNzTmFtZSA9ICdzcGFyayc7CiAgICBjb25zdCBzeiA9IDMrTWF0aC5yYW5kb20oKSo0OwogICAgcy5zdHlsZS53aWR0aD1zeisncHgnOyBzLnN0eWxlLmhlaWdodD1zeisncHgnOwogICAgcy5zdHlsZS5sZWZ0PWN4KydweCc7IHMuc3R5bGUudG9wPWN5KydweCc7CiAgICBzLnN0eWxlLmJhY2tncm91bmQgPSBNYXRoLnJhbmRvbSgpPjAuNT9jb2xvci5hOmNvbG9yLmI7CiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHMpOwogICAgY29uc3QgYW5nID0gTWF0aC5yYW5kb20oKSpNYXRoLlBJKjIsIGRpc3Q9MjArTWF0aC5yYW5kb20oKSo0MDsKICAgIHMuYW5pbWF0ZShbCiAgICAgIHt0cmFuc2Zvcm06J3RyYW5zbGF0ZSgwLDApJywgb3BhY2l0eToxfSwKICAgICAge3RyYW5zZm9ybTpgdHJhbnNsYXRlKCR7TWF0aC5jb3MoYW5nKSpkaXN0fXB4LCAke01hdGguc2luKGFuZykqZGlzdH1weClgLCBvcGFjaXR5OjB9CiAgICBdLCB7ZHVyYXRpb246NDAwK01hdGgucmFuZG9tKCkqMjAwLCBlYXNpbmc6J2Vhc2Utb3V0J30pOwogICAgc2V0VGltZW91dCgoKT0+cy5yZW1vdmUoKSwgNjUwKTsKICB9Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICBXSU4KPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCmZ1bmN0aW9uIHdpbkxldmVsKCl7CiAgU05ELndpbigpOwogIGNvbnN0IHN0YXJzID0gbWlzdGFrZXM9PT0wID8gMyA6IChtaXN0YWtlczw9MiA/IDIgOiAxKTsKICBwcm9ncmVzcy5zdGFyc1tjdXJMZXZlbF0gPSBNYXRoLm1heChwcm9ncmVzcy5zdGFyc1tjdXJMZXZlbF18fDAsIHN0YXJzKTsKICBpZihjdXJMZXZlbCA9PT0gcHJvZ3Jlc3MudW5sb2NrZWQgJiYgY3VyTGV2ZWwgPCBMRVZFTF9DT1VOVCkgcHJvZ3Jlc3MudW5sb2NrZWQgPSBjdXJMZXZlbCsxOwogIHNhdmVQcm9ncmVzcygpOwogIHNwYXduQ29uZmV0dGkoKTsKICBzaG93T3ZlcmxheSh7CiAgICBpY29uOifwn4+GJywgdGl0bGU6J9mE24zZiNmEINmF2qnZhdmEIScsIHN1Yjpg2LrZhNi324zYp9q6OiAke21pc3Rha2VzfWAsCiAgICBzY29yZTogY2xlYXJlZENvdW50LCBzdGFycywKICAgIGJ1dHRvbnM6WwogICAgICBjdXJMZXZlbCA8IExFVkVMX0NPVU5UID8ge2xhYmVsOifYp9qv2YTYpyDZhNuM2YjZhCDilrbvuI8nLCBhY3Rpb246KCk9PnsgY2xvc2VPdmVybGF5KCk7IHN0YXJ0TGV2ZWwoY3VyTGV2ZWwrMSk7IH19IDoge2xhYmVsOifZhdio2KfYsdqpINuB2YghIPCfjoknLCBhY3Rpb246KCk9PnsgY2xvc2VPdmVybGF5KCk7IHNob3dTY3JlZW4oJ21lbnUnKTsgcmVuZGVyTWVudVN0YXRzKCk7IH19LAogICAgICB7bGFiZWw6J9mF24zZhtmIJywgYWN0aW9uOigpPT57IGNsb3NlT3ZlcmxheSgpOyBzaG93U2NyZWVuKCdtZW51Jyk7IHJlbmRlck1lbnVTdGF0cygpOyB9LCBnaG9zdDp0cnVlfQogICAgXQogIH0pOwp9CgpmdW5jdGlvbiBzaG93T3ZlcmxheShjZmcpewogIGNvbnN0IG92ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7CiAgb3YuY2xhc3NOYW1lPSdvdmVybGF5Jzsgb3YuaWQ9J2FjdGl2ZS1vdmVybGF5JzsKICBjb25zdCBzdGFyc0h0bWwgPSBjZmcuc3RhcnMgPyBgPGRpdiBzdHlsZT0iZm9udC1zaXplOjIycHg7bWFyZ2luLWJvdHRvbTo2cHg7Ij4keyfirZAnLnJlcGVhdChjZmcuc3RhcnMpfSR7J+KYhicucmVwZWF0KDMtY2ZnLnN0YXJzKX08L2Rpdj5gIDogJyc7CiAgb3YuaW5uZXJIVE1MID0gYAogICAgPGRpdiBjbGFzcz0ib3ZlcmxheS1jYXJkIj4KICAgICAgPGRpdiBjbGFzcz0ib3ZlcmxheS1pY29uIj4ke2NmZy5pY29ufTwvZGl2PgogICAgICA8ZGl2IGNsYXNzPSJvdmVybGF5LXRpdGxlIj4ke2NmZy50aXRsZX08L2Rpdj4KICAgICAgPGRpdiBjbGFzcz0ib3ZlcmxheS1zdWIiPiR7Y2ZnLnN1Yn08L2Rpdj4KICAgICAgJHtzdGFyc0h0bWx9CiAgICAgIDxkaXYgY2xhc3M9Im92ZXJsYXktc2NvcmUiPiR7Y2ZnLnNjb3JlfSDYqtuM2LEg2LXYp9mBPC9kaXY+CiAgICAgIDxkaXYgY2xhc3M9Im92ZXJsYXktYnRucyIgaWQ9Im92LWJ0bnMiPjwvZGl2PgogICAgPC9kaXY+YDsKICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKG92KTsKICBjb25zdCB3cmFwID0gb3YucXVlcnlTZWxlY3RvcignI292LWJ0bnMnKTsKICBjZmcuYnV0dG9ucy5mb3JFYWNoKGI9PnsKICAgIGNvbnN0IGJ0bj1kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTsKICAgIGJ0bi5jbGFzc05hbWU9J2J0biBibG9jaycrKGIuZ2hvc3Q/JyBnaG9zdCc6JycpOwogICAgYnRuLnRleHRDb250ZW50PWIubGFiZWw7CiAgICBidG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKT0+eyBTTkQuY2xpY2soKTsgYi5hY3Rpb24oKTsgfSk7CiAgICB3cmFwLmFwcGVuZENoaWxkKGJ0bik7CiAgfSk7Cn0KZnVuY3Rpb24gY2xvc2VPdmVybGF5KCl7IGNvbnN0IG92PWRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhY3RpdmUtb3ZlcmxheScpOyBpZihvdikgb3YucmVtb3ZlKCk7IH0KCmZ1bmN0aW9uIHNwYXduQ29uZmV0dGkoKXsKICBmb3IobGV0IGk9MDtpPDUwO2krKyl7CiAgICBjb25zdCBlbD1kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTsKICAgIGVsLmNsYXNzTmFtZT0nY29uZmV0dGknOwogICAgY29uc3QgY29sID0gQ09MT1JTW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSpDT0xPUlMubGVuZ3RoKV07CiAgICBlbC5zdHlsZS5iYWNrZ3JvdW5kID0gTWF0aC5yYW5kb20oKT4wLjU/Y29sLmE6Y29sLmI7CiAgICBlbC5zdHlsZS5sZWZ0ID0gTWF0aC5yYW5kb20oKSoxMDArJ3Z3JzsKICAgIGVsLnN0eWxlLndpZHRoPSg1K01hdGgucmFuZG9tKCkqNSkrJ3B4JzsgZWwuc3R5bGUuaGVpZ2h0PSg4K01hdGgucmFuZG9tKCkqOCkrJ3B4JzsKICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZWwpOwogICAgZWwuYW5pbWF0ZShbCiAgICAgIHt0cmFuc2Zvcm06J3RyYW5zbGF0ZVkoMCkgcm90YXRlKDBkZWcpJywgb3BhY2l0eToxfSwKICAgICAge3RyYW5zZm9ybTpgdHJhbnNsYXRlWSgke3dpbmRvdy5pbm5lckhlaWdodCs1MH1weCkgcm90YXRlKCR7MzYwK01hdGgucmFuZG9tKCkqMzYwfWRlZylgLCBvcGFjaXR5Oi45fQogICAgXSwge2R1cmF0aW9uOjE2MDArTWF0aC5yYW5kb20oKSoxMDAwLCBlYXNpbmc6J2N1YmljLWJlemllciguMiwuNiwuNCwxKSd9KTsKICAgIHNldFRpbWVvdXQoKCk9PmVsLnJlbW92ZSgpLCAyNzAwKTsKICB9Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICBXSVJFIFVQIFVJCj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYnRuLWNvbnRpbnVlJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKT0+eyBTTkQuY2xpY2soKTsgZW5zdXJlQXVkaW8oKTsgc3RhcnRMZXZlbChwcm9ncmVzcy51bmxvY2tlZCk7IH0pOwpkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYnRuLWxldmVscycpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCk9PnsgU05ELmNsaWNrKCk7IHJlbmRlckxldmVsR3JpZCgpOyBzaG93U2NyZWVuKCdsZXZlbHMnKTsgfSk7CmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdidG4tbGV2ZWxzLWJhY2snKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpPT57IFNORC5jbGljaygpOyBzaG93U2NyZWVuKCdtZW51Jyk7IH0pOwpkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYnRuLWdhbWUtYmFjaycpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCk9PnsgU05ELmNsaWNrKCk7IHNob3dTY3JlZW4oJ21lbnUnKTsgcmVuZGVyTWVudVN0YXRzKCk7IH0pOwpkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYnRuLXJlc3RhcnQtbGV2ZWwnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpPT57IFNORC5jbGljaygpOyBzdGFydExldmVsKGN1ckxldmVsKTsgfSk7CmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdidG4tcmVzdGFydC1wcm9ncmVzcycpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCk9PnsKICBpZihjb25maXJtKCfaqduM2Kcg2KLZviDZiNin2YLYuduMINiq2YXYp9mFINm+24zYtCDYsdmB2Kog2K/ZiNio2KfYsduBINi02LHZiNi5INqp2LHZhtinINqG2Kfbgdiq25Ig24HbjNq62J8nKSl7CiAgICBwcm9ncmVzcyA9IHsgdW5sb2NrZWQ6MSwgc3RhcnM6e30sIHNvdW5kT246cHJvZ3Jlc3Muc291bmRPbiwgbXVzaWNPbjpwcm9ncmVzcy5tdXNpY09uIH07CiAgICBzYXZlUHJvZ3Jlc3MoKTsgcmVuZGVyTWVudVN0YXRzKCk7CiAgfQp9KTsKZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2J0bi1zb3VuZC1tZW51JykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKT0+eyBwcm9ncmVzcy5zb3VuZE9uPSFwcm9ncmVzcy5zb3VuZE9uOyBlbnN1cmVBdWRpbygpOyBTTkQuY2xpY2soKTsgdXBkYXRlVG9nZ2xlSWNvbnMoKTsgc2F2ZVByb2dyZXNzKCk7IH0pOwpkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYnRuLXNvdW5kLWdhbWUnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpPT57IHByb2dyZXNzLnNvdW5kT249IXByb2dyZXNzLnNvdW5kT247IGVuc3VyZUF1ZGlvKCk7IFNORC5jbGljaygpOyB1cGRhdGVUb2dnbGVJY29ucygpOyBzYXZlUHJvZ3Jlc3MoKTsgfSk7CmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdidG4tbXVzaWMtbWVudScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCk9PnsgcHJvZ3Jlc3MubXVzaWNPbj0hcHJvZ3Jlc3MubXVzaWNPbjsgZW5zdXJlQXVkaW8oKTsgdXBkYXRlVG9nZ2xlSWNvbnMoKTsgc2F2ZVByb2dyZXNzKCk7IGlmKHByb2dyZXNzLm11c2ljT24pIHN0YXJ0TXVzaWMoKTsgZWxzZSBzdG9wTXVzaWMoKTsgfSk7CmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdidG4tbXVzaWMtZ2FtZScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCk9PnsgcHJvZ3Jlc3MubXVzaWNPbj0hcHJvZ3Jlc3MubXVzaWNPbjsgZW5zdXJlQXVkaW8oKTsgdXBkYXRlVG9nZ2xlSWNvbnMoKTsgc2F2ZVByb2dyZXNzKCk7IGlmKHByb2dyZXNzLm11c2ljT24pIHN0YXJ0TXVzaWMoKTsgZWxzZSBzdG9wTXVzaWMoKTsgfSk7Cgp3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgKCk9PnsgaWYoIWRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzY3ItZ2FtZScpLmNsYXNzTGlzdC5jb250YWlucygnaGlkZGVuJykpIHJlbmRlckJvYXJkKCk7IH0pOwoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIElOSVQKPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCmxvYWRQcm9ncmVzcygpLnRoZW4oKCk9Pnsgc2hvd1NjcmVlbignbWVudScpOyB9KTsKCn0pKCk7Cjwvc2NyaXB0Pgo8L2JvZHk+CjwvaHRtbD4K";
const GAME_ZEN_B64 = "PCFET0NUWVBFIGh0bWw+CjxodG1sIGxhbmc9InVyIiBkaXI9InJ0bCI+CjxoZWFkPgo8bWV0YSBjaGFyc2V0PSJVVEYtOCI+CjxtZXRhIG5hbWU9InZpZXdwb3J0IiBjb250ZW50PSJ3aWR0aD1kZXZpY2Utd2lkdGgsIGluaXRpYWwtc2NhbGU9MS4wLCBtYXhpbXVtLXNjYWxlPTEuMCwgdXNlci1zY2FsYWJsZT1ubywgdmlld3BvcnQtZml0PWNvdmVyIj4KPHRpdGxlPtiy24zYsdmIINiy24zZhiDigJQgWmVybyBaZW48L3RpdGxlPgo8c3R5bGU+Cjpyb290ewogIC0tYmcxOiMwMzA5MWE7IC0tYmcyOiMwODEyMmU7IC0tYmczOiMwZTFhNDA7CiAgLS1taW50OiM0ZWU2YzQ7IC0tbGF2OiNjMDg0ZmM7IC0tcm9zZTojZjQ3MmI2OyAtLWdvbGQ6I2ZiYmYyNDsKICAtLXNreTojMzhiZGY4OyAtLWxpbWU6Izg2ZWZhYzsKICAtLXBhbmVsOnJnYmEoMjU1LDI1NSwyNTUsMC4wNTUpOyAtLXBhbmVsLWJyZDpyZ2JhKDI1NSwyNTUsMjU1LDAuMTIpOwogIC0tdGV4dDojZThmNGZmOyAtLWRpbTojOGFhYmNjOyAtLWRpbTI6IzRhNmE4ODsKICAtLXJhZGl1czoxNnB4Owp9Cip7IGJveC1zaXppbmc6Ym9yZGVyLWJveDsgLXdlYmtpdC10YXAtaGlnaGxpZ2h0LWNvbG9yOnRyYW5zcGFyZW50OyB9Cmh0bWwsYm9keXsgaGVpZ2h0OjEwMCU7IG1hcmdpbjowOyBvdmVyZmxvdy14OmhpZGRlbjsgfQpib2R5ewogIG1pbi1oZWlnaHQ6MTAwdmg7IGZvbnQtZmFtaWx5OidTZWdvZSBVSScsJ1RhaG9tYScsc2Fucy1zZXJpZjsgY29sb3I6dmFyKC0tdGV4dCk7CiAgYmFja2dyb3VuZDoKICAgIHJhZGlhbC1ncmFkaWVudCg5MDBweCA2MDBweCBhdCAxMCUgLTEwJSwgcmdiYSg3OCwyMzAsMTk2LC4xMiksIHRyYW5zcGFyZW50IDYwJSksCiAgICByYWRpYWwtZ3JhZGllbnQoODAwcHggNzAwcHggYXQgMTEwJSAxNSUsIHJnYmEoMTkyLDEzMiwyNTIsLjEwKSwgdHJhbnNwYXJlbnQgNTUlKSwKICAgIHJhZGlhbC1ncmFkaWVudCg5MDBweCA3MDBweCBhdCA1MCUgMTE1JSwgcmdiYSg1NiwxODksMjQ4LC4xMCksIHRyYW5zcGFyZW50IDU1JSksCiAgICBsaW5lYXItZ3JhZGllbnQoMTYwZGVnLCB2YXIoLS1iZzEpLCB2YXIoLS1iZzIpIDU1JSwgdmFyKC0tYmczKSk7CiAgYmFja2dyb3VuZC1hdHRhY2htZW50OmZpeGVkOwogIHVzZXItc2VsZWN0Om5vbmU7IC13ZWJraXQtdXNlci1zZWxlY3Q6bm9uZTsgdG91Y2gtYWN0aW9uOm5vbmU7IHBvc2l0aW9uOnJlbGF0aXZlOwp9CmJvZHk6OmJlZm9yZXsKICBjb250ZW50OicnOyBwb3NpdGlvbjpmaXhlZDsgaW5zZXQ6MDsgcG9pbnRlci1ldmVudHM6bm9uZTsgei1pbmRleDowOwogIGJhY2tncm91bmQ6cmFkaWFsLWdyYWRpZW50KHJnYmEoNzgsMjMwLDE5NiwuMDUpIDFweCwgdHJhbnNwYXJlbnQgMXB4KTsKICBiYWNrZ3JvdW5kLXNpemU6MzBweCAzMHB4OwogIGFuaW1hdGlvbjpiZ1B1bHNlIDhzIGVhc2UtaW4tb3V0IGluZmluaXRlOwp9CkBrZXlmcmFtZXMgYmdQdWxzZXsgMCUsMTAwJXtvcGFjaXR5Oi42O30gNTAle29wYWNpdHk6MTt9IH0KCiNhcHB7IHBvc2l0aW9uOnJlbGF0aXZlOyB6LWluZGV4OjE7IG1pbi1oZWlnaHQ6MTAwdmg7IGRpc3BsYXk6ZmxleDsgZmxleC1kaXJlY3Rpb246Y29sdW1uOyBhbGlnbi1pdGVtczpjZW50ZXI7IHBhZGRpbmc6MTZweCAxMnB4IDI4cHg7IH0KLnNjcmVlbnsgd2lkdGg6MTAwJTsgbWF4LXdpZHRoOjQ2MHB4OyBkaXNwbGF5OmZsZXg7IGZsZXgtZGlyZWN0aW9uOmNvbHVtbjsgYWxpZ24taXRlbXM6Y2VudGVyOyBhbmltYXRpb246ZmFkZUluIC4zNXMgZWFzZTsgfQpAa2V5ZnJhbWVzIGZhZGVJbnsgZnJvbXtvcGFjaXR5OjA7dHJhbnNmb3JtOnRyYW5zbGF0ZVkoOHB4KTt9IHRve29wYWNpdHk6MTt0cmFuc2Zvcm06dHJhbnNsYXRlWSgwKTt9IH0KLmhpZGRlbnsgZGlzcGxheTpub25lICFpbXBvcnRhbnQ7IH0KCi8qIOKUgOKUgCBMT0dPIOKUgOKUgCAqLwoubG9nby13cmFweyB0ZXh0LWFsaWduOmNlbnRlcjsgbWFyZ2luOjE0cHggMCA2cHg7IH0KLmxvZ28tZ2xvd3sgZm9udC1zaXplOjI4cHg7IGxldHRlci1zcGFjaW5nOjEwcHg7IGZpbHRlcjpkcm9wLXNoYWRvdygwIDAgMThweCByZ2JhKDc4LDIzMCwxOTYsLjYpKTsgYW5pbWF0aW9uOmxvZ29GbG9hdCAzLjVzIGVhc2UtaW4tb3V0IGluZmluaXRlOyB9CkBrZXlmcmFtZXMgbG9nb0Zsb2F0eyAwJSwxMDAle3RyYW5zZm9ybTp0cmFuc2xhdGVZKDApIHNjYWxlKDEpO30gNTAle3RyYW5zZm9ybTp0cmFuc2xhdGVZKC03cHgpIHNjYWxlKDEuMDQpO30gfQoudGl0bGV7CiAgZm9udC1zaXplOjM0cHg7IGZvbnQtd2VpZ2h0OjkwMDsgbWFyZ2luOjZweCAwIDJweDsgbGV0dGVyLXNwYWNpbmc6MXB4OwogIGJhY2tncm91bmQ6bGluZWFyLWdyYWRpZW50KDkwZGVnLCM0ZWU2YzQsIzM4YmRmOCAzOCUsI2MwODRmYyA2OCUsIzRlZTZjNCk7CiAgLXdlYmtpdC1iYWNrZ3JvdW5kLWNsaXA6dGV4dDsgYmFja2dyb3VuZC1jbGlwOnRleHQ7IGNvbG9yOnRyYW5zcGFyZW50OwogIGJhY2tncm91bmQtc2l6ZToyMDAlIGF1dG87IGFuaW1hdGlvbjpzaGluZSA1cyBsaW5lYXIgaW5maW5pdGU7Cn0KQGtleWZyYW1lcyBzaGluZXsgdG97YmFja2dyb3VuZC1wb3NpdGlvbjoyMDAlIGNlbnRlcjt9IH0KLnN1YnRpdGxleyBmb250LXNpemU6MTEuNXB4OyBjb2xvcjp2YXIoLS1kaW0pOyBsZXR0ZXItc3BhY2luZzozcHg7IHRleHQtdHJhbnNmb3JtOnVwcGVyY2FzZTsgfQoKLyog4pSA4pSAIFNUQVRTIOKUgOKUgCAqLwouc3RhdC1yb3d7IGRpc3BsYXk6ZmxleDsgZ2FwOjEwcHg7IG1hcmdpbjoxOHB4IDAgNHB4OyB9Ci5zY3sKICBiYWNrZ3JvdW5kOnZhcigtLXBhbmVsKTsgYm9yZGVyOjFweCBzb2xpZCB2YXIoLS1wYW5lbC1icmQpOyBib3JkZXItcmFkaXVzOjE0cHg7CiAgcGFkZGluZzoxMHB4IDE0cHg7IHRleHQtYWxpZ246Y2VudGVyOyBtaW4td2lkdGg6ODBweDsKfQouc2MgYnsgZGlzcGxheTpibG9jazsgZm9udC1zaXplOjIwcHg7IGNvbG9yOnZhcigtLW1pbnQpOyB9Ci5zYyBzcGFueyBmb250LXNpemU6MTBweDsgY29sb3I6dmFyKC0tZGltKTsgfQoKLyog4pSA4pSAIEJVVFRPTlMg4pSA4pSAICovCi5idG57CiAgYm9yZGVyOm5vbmU7IGN1cnNvcjpwb2ludGVyOyBib3JkZXItcmFkaXVzOjk5OXB4OyBmb250LXdlaWdodDo4MDA7IGZvbnQtZmFtaWx5OmluaGVyaXQ7CiAgcGFkZGluZzoxMnB4IDI0cHg7IGZvbnQtc2l6ZToxNC41cHg7IGRpc3BsYXk6aW5saW5lLWZsZXg7IGFsaWduLWl0ZW1zOmNlbnRlcjsgZ2FwOjhweDsKICB0cmFuc2l0aW9uOnRyYW5zZm9ybSAuMTRzLCBib3gtc2hhZG93IC4xNHM7IHBvc2l0aW9uOnJlbGF0aXZlOyBvdmVyZmxvdzpoaWRkZW47Cn0KLmJ0bjo6YWZ0ZXJ7IGNvbnRlbnQ6Jyc7IHBvc2l0aW9uOmFic29sdXRlOyBpbnNldDowOyBiYWNrZ3JvdW5kOnJnYmEoMjU1LDI1NSwyNTUsMCk7IHRyYW5zaXRpb246YmFja2dyb3VuZCAuMThzOyB9Ci5idG46YWN0aXZlOjphZnRlcnsgYmFja2dyb3VuZDpyZ2JhKDI1NSwyNTUsMjU1LC4xMik7IH0KLmJ0bjphY3RpdmV7IHRyYW5zZm9ybTpzY2FsZSguOTUpOyB9Ci5idG4tcHJpbWFyeXsKICBjb2xvcjojMDQxODFhOyBiYWNrZ3JvdW5kOmxpbmVhci1ncmFkaWVudCgxMzVkZWcsIzlkZjdlNix2YXIoLS1taW50KSA0NSUsdmFyKC0tc2t5KSk7CiAgYm94LXNoYWRvdzowIDhweCAyNHB4IHJnYmEoNzgsMjMwLDE5NiwuMzgpLCAwIDJweCAwIHJnYmEoMjU1LDI1NSwyNTUsLjQ1KSBpbnNldDsKfQouYnRuLWdob3N0eyBiYWNrZ3JvdW5kOnZhcigtLXBhbmVsKTsgY29sb3I6dmFyKC0tdGV4dCk7IGJvcmRlcjoxcHggc29saWQgdmFyKC0tcGFuZWwtYnJkKTsgYm94LXNoYWRvdzpub25lOyB9Ci5idG4tYmxvY2t7IHdpZHRoOjEwMCU7IGp1c3RpZnktY29udGVudDpjZW50ZXI7IH0KLm1lbnUtYnRuc3sgZGlzcGxheTpmbGV4OyBmbGV4LWRpcmVjdGlvbjpjb2x1bW47IGdhcDoxMnB4OyB3aWR0aDoxMDAlOyBtYXgtd2lkdGg6MjgwcHg7IG1hcmdpbi10b3A6MjBweDsgfQoKLmljb25idG57CiAgd2lkdGg6NDJweDsgaGVpZ2h0OjQycHg7IGJvcmRlci1yYWRpdXM6NTAlOyBib3JkZXI6MXB4IHNvbGlkIHZhcigtLXBhbmVsLWJyZCk7CiAgYmFja2dyb3VuZDp2YXIoLS1wYW5lbCk7IGNvbG9yOnZhcigtLXRleHQpOyBkaXNwbGF5OmZsZXg7IGFsaWduLWl0ZW1zOmNlbnRlcjsganVzdGlmeS1jb250ZW50OmNlbnRlcjsKICBjdXJzb3I6cG9pbnRlcjsgZm9udC1zaXplOjE3cHg7IHRyYW5zaXRpb246dHJhbnNmb3JtIC4xNXM7Cn0KLmljb25idG46YWN0aXZleyB0cmFuc2Zvcm06c2NhbGUoLjkpOyB9Ci5pY29uYnRuLm9ueyBjb2xvcjp2YXIoLS1taW50KTsgYm9yZGVyLWNvbG9yOnJnYmEoNzgsMjMwLDE5NiwuNSk7IGJveC1zaGFkb3c6MCAwIDE0cHggcmdiYSg3OCwyMzAsMTk2LC4zNSk7IH0KLnRvcC1yb3d7IGRpc3BsYXk6ZmxleDsgZ2FwOjEwcHg7IG1hcmdpbi10b3A6MTZweDsgfQoKLyog4pSA4pSAIExFVkVMIFNFTEVDVCDilIDilIAgKi8KLmx2bC1oZWFkZXJ7IGRpc3BsYXk6ZmxleDsgYWxpZ24taXRlbXM6Y2VudGVyOyBqdXN0aWZ5LWNvbnRlbnQ6c3BhY2UtYmV0d2Vlbjsgd2lkdGg6MTAwJTsgbWFyZ2luLWJvdHRvbToxNHB4OyB9Ci5sdmwtaGVhZGVyIGgyeyBmb250LXNpemU6MThweDsgbWFyZ2luOjA7IH0KLmx2bC1ncmlkeyBkaXNwbGF5OmdyaWQ7IGdyaWQtdGVtcGxhdGUtY29sdW1uczpyZXBlYXQoNSwxZnIpOyBnYXA6OXB4OyB3aWR0aDoxMDAlOyBtYXgtaGVpZ2h0OjYwdmg7IG92ZXJmbG93LXk6YXV0bzsgcGFkZGluZzo0cHggMnB4IDE0cHg7IH0KLmxjewogIGFzcGVjdC1yYXRpbzoxOyBib3JkZXItcmFkaXVzOjE0cHg7IGRpc3BsYXk6ZmxleDsgZmxleC1kaXJlY3Rpb246Y29sdW1uOwogIGFsaWduLWl0ZW1zOmNlbnRlcjsganVzdGlmeS1jb250ZW50OmNlbnRlcjsgZm9udC13ZWlnaHQ6ODAwOyBmb250LXNpemU6MTRweDsKICBjdXJzb3I6cG9pbnRlcjsgYm9yZGVyOjFweCBzb2xpZCB2YXIoLS1wYW5lbC1icmQpOyBiYWNrZ3JvdW5kOnZhcigtLXBhbmVsKTsKICBjb2xvcjp2YXIoLS10ZXh0KTsgdHJhbnNpdGlvbjp0cmFuc2Zvcm0gLjE0czsKfQoubGM6YWN0aXZleyB0cmFuc2Zvcm06c2NhbGUoLjkxKTsgfQoubGMuZG9uZXsgYmFja2dyb3VuZDpsaW5lYXItZ3JhZGllbnQoMTUwZGVnLCM0ZWU2YzQsIzBmOWU3Myk7IGNvbG9yOiMwMjJiMjI7IGJvcmRlci1jb2xvcjpyZ2JhKDI1NSwyNTUsMjU1LC4zKTsgYm94LXNoYWRvdzowIDVweCAxNnB4IHJnYmEoNzgsMjMwLDE5NiwuMzUpOyB9Ci5sYy5jdXJ7CiAgYmFja2dyb3VuZDpsaW5lYXItZ3JhZGllbnQoMTUwZGVnLCM5ZGY3ZTYsdmFyKC0tc2t5KSk7IGNvbG9yOiMwNDE4MWE7IGJvcmRlci1jb2xvcjpyZ2JhKDI1NSwyNTUsMjU1LC41KTsKICBib3gtc2hhZG93OjAgMCAwIDNweCByZ2JhKDc4LDIzMCwxOTYsLjI1KSwgMCA4cHggMjJweCByZ2JhKDU2LDE4OSwyNDgsLjQpOwogIGFuaW1hdGlvbjpsY1B1bHNlIDEuOHMgZWFzZS1pbi1vdXQgaW5maW5pdGU7Cn0KQGtleWZyYW1lcyBsY1B1bHNleyAwJSwxMDAle2JveC1zaGFkb3c6MCAwIDAgM3B4IHJnYmEoNzgsMjMwLDE5NiwuMjUpLDAgOHB4IDIycHggcmdiYSg1NiwxODksMjQ4LC40KTt9IDUwJXtib3gtc2hhZG93OjAgMCAwIDdweCByZ2JhKDc4LDIzMCwxOTYsLjEpLDAgOHB4IDI4cHggcmdiYSg1NiwxODksMjQ4LC42KTt9IH0KLmxjLmxvY2tlZHsgb3BhY2l0eTouMzY7IGN1cnNvcjpkZWZhdWx0OyB9Ci5sYyAuc3RhcnsgZm9udC1zaXplOjhweDsgbWFyZ2luLXRvcDoycHg7IH0KCi8qIOKUgOKUgCBHQU1FIEhFQURFUiDilIDilIAgKi8KLmdhbWUtdG9weyBkaXNwbGF5OmZsZXg7IGFsaWduLWl0ZW1zOmNlbnRlcjsganVzdGlmeS1jb250ZW50OnNwYWNlLWJldHdlZW47IHdpZHRoOjEwMCU7IG1hcmdpbi1ib3R0b206MTBweDsgfQouZ2FtZS10b3AgLkwsLmdhbWUtdG9wIC5SeyBkaXNwbGF5OmZsZXg7IGFsaWduLWl0ZW1zOmNlbnRlcjsgZ2FwOjhweDsgfQoubHZsLXBpbGx7IGJhY2tncm91bmQ6dmFyKC0tcGFuZWwpOyBib3JkZXI6MXB4IHNvbGlkIHZhcigtLXBhbmVsLWJyZCk7IGJvcmRlci1yYWRpdXM6MTJweDsgcGFkZGluZzo3cHggMTRweDsgZm9udC13ZWlnaHQ6ODAwOyBmb250LXNpemU6MTNweDsgfQouaW5mby1yb3d7IGRpc3BsYXk6ZmxleDsgZ2FwOjEwcHg7IHdpZHRoOjEwMCU7IG1hcmdpbi1ib3R0b206MTRweDsgfQouaW5mby1jaGlwewogIGZsZXg6MTsgYmFja2dyb3VuZDp2YXIoLS1wYW5lbCk7IGJvcmRlcjoxcHggc29saWQgdmFyKC0tcGFuZWwtYnJkKTsgYm9yZGVyLXJhZGl1czoxNHB4OwogIHBhZGRpbmc6OHB4IDEycHg7IHRleHQtYWxpZ246Y2VudGVyOwp9Ci5pbmZvLWNoaXAgYnsgZGlzcGxheTpibG9jazsgZm9udC1zaXplOjE4cHg7IGNvbG9yOnZhcigtLW1pbnQpOyB9Ci5pbmZvLWNoaXAgc3BhbnsgZm9udC1zaXplOjEwcHg7IGNvbG9yOnZhcigtLWRpbSk7IH0KLnByb2dyZXNzLXRyYWNreyBoZWlnaHQ6MTBweDsgYm9yZGVyLXJhZGl1czo4cHg7IGJhY2tncm91bmQ6cmdiYSgyNTUsMjU1LDI1NSwuMDgpOyBib3JkZXI6MXB4IHNvbGlkIHZhcigtLXBhbmVsLWJyZCk7IG92ZXJmbG93OmhpZGRlbjsgd2lkdGg6MTAwJTsgbWFyZ2luLWJvdHRvbToxNHB4OyB9Ci5wcm9ncmVzcy1maWxseyBoZWlnaHQ6MTAwJTsgYm9yZGVyLXJhZGl1czo4cHg7IGJhY2tncm91bmQ6bGluZWFyLWdyYWRpZW50KDkwZGVnLCM0ZWU2YzQsIzM4YmRmOCwjYzA4NGZjKTsgdHJhbnNpdGlvbjp3aWR0aCAuNHMgY3ViaWMtYmV6aWVyKC4yLC45LC4zLDEpOyBib3gtc2hhZG93OjAgMCAxMHB4IHJnYmEoNzgsMjMwLDE5NiwuNTUpOyB9CgovKiDilIDilIAgR1JJRCBCT0FSRCDilIDilIAgKi8KLmJvYXJkLXNjZW5leyBwZXJzcGVjdGl2ZToxMjAwcHg7IHBhZGRpbmc6MTBweCAwIDI0cHg7IHdpZHRoOjEwMCU7IH0KLmJvYXJkLXdyYXB7CiAgZGlyZWN0aW9uOmx0cjsgcG9zaXRpb246cmVsYXRpdmU7IHBhZGRpbmc6MTJweDsgYm9yZGVyLXJhZGl1czoyMnB4OwogIGJhY2tncm91bmQ6cmdiYSg4LDE4LDQ2LC44NSk7IGJvcmRlcjoxcHggc29saWQgcmdiYSgyNTUsMjU1LDI1NSwuMSk7CiAgYm94LXNoYWRvdzowIDI4cHggNjBweCByZ2JhKDAsMCwwLC41NSksIDAgMXB4IDAgcmdiYSgyNTUsMjU1LDI1NSwuMDcpIGluc2V0OwogIHRyYW5zZm9ybTpyb3RhdGVYKDdkZWcpOyB0cmFuc2Zvcm0tc3R5bGU6cHJlc2VydmUtM2Q7Cn0KI2JvYXJkeyBkaXNwbGF5OmdyaWQ7IGdhcDo1cHg7IGRpcmVjdGlvbjpsdHI7IH0KCi8qIOKUgOKUgCBUSUxFUyDilIDilIAgKi8KLmNlbGx7IHBvc2l0aW9uOnJlbGF0aXZlOyB9Ci50aWxlewogIHBvc2l0aW9uOmFic29sdXRlOyBpbnNldDoycHg7IGJvcmRlci1yYWRpdXM6MTJweDsgY3Vyc29yOnBvaW50ZXI7CiAgZGlzcGxheTpmbGV4OyBhbGlnbi1pdGVtczpjZW50ZXI7IGp1c3RpZnktY29udGVudDpjZW50ZXI7IGZvbnQtd2VpZ2h0OjkwMDsKICBib3gtc2hhZG93OjAgNnB4IDAgcmdiYSgwLDAsMCwuMzIpLCAwIDEwcHggMThweCByZ2JhKDAsMCwwLC4zOCksIDAgMXB4IDAgcmdiYSgyNTUsMjU1LDI1NSwuMzgpIGluc2V0OwogIHRyYW5zaXRpb246dHJhbnNmb3JtIC4xNHMgZWFzZSwgYm94LXNoYWRvdyAuMTRzIGVhc2UsIGZpbHRlciAuMTRzIGVhc2U7CiAgdHJhbnNmb3JtOnRyYW5zbGF0ZVooOHB4KTsKICAvKiBzaGltbWVyIGhpZ2hsaWdodCAqLwogIG92ZXJmbG93OmhpZGRlbjsKfQoudGlsZTo6YmVmb3JlewogIGNvbnRlbnQ6Jyc7IHBvc2l0aW9uOmFic29sdXRlOyB0b3A6LTM1JTsgbGVmdDotMzAlOyB3aWR0aDo3MCU7IGhlaWdodDo1NSU7CiAgYmFja2dyb3VuZDpyZ2JhKDI1NSwyNTUsMjU1LC4yMik7IGJvcmRlci1yYWRpdXM6NTAlOyBmaWx0ZXI6Ymx1cig2cHgpOwogIHBvaW50ZXItZXZlbnRzOm5vbmU7Cn0KLnRpbGU6YWN0aXZleyB0cmFuc2Zvcm06dHJhbnNsYXRlWigycHgpIHNjYWxlKC45Mik7IGJveC1zaGFkb3c6MCAycHggMCByZ2JhKDAsMCwwLC4zMiksIDAgM3B4IDdweCByZ2JhKDAsMCwwLC4zNSkgaW5zZXQ7IH0KCi8qIHNlbGVjdGVkIHN0YXRlICovCi50aWxlLnNlbHsKICB0cmFuc2Zvcm06dHJhbnNsYXRlWigxNHB4KSBzY2FsZSgxLjA4KTsKICBib3gtc2hhZG93OjAgMTBweCAwIHJnYmEoMCwwLDAsLjI4KSwgMCAxNHB4IDI4cHggcmdiYSg3OCwyMzAsMTk2LC41NSksCiAgICAgICAgICAgICAwIDAgMCAzcHggcmdiYSg3OCwyMzAsMTk2LC43KSwgMCAxcHggMCByZ2JhKDI1NSwyNTUsMjU1LC41KSBpbnNldDsKICBhbmltYXRpb246dGlsZUJvdW5jZSAuM3MgZWFzZTsKfQpAa2V5ZnJhbWVzIHRpbGVCb3VuY2V7IDAle3RyYW5zZm9ybTp0cmFuc2xhdGVaKDhweCkgc2NhbGUoMSk7fSA1MCV7dHJhbnNmb3JtOnRyYW5zbGF0ZVooMThweCkgc2NhbGUoMS4xMik7fSAxMDAle3RyYW5zZm9ybTp0cmFuc2xhdGVaKDE0cHgpIHNjYWxlKDEuMDgpO30gfQoKLyogd3JvbmcgcGFpciAqLwoudGlsZS53cm9uZ3sgYW5pbWF0aW9uOnRpbGVXcm9uZyAuMzZzIGVhc2U7IH0KQGtleWZyYW1lcyB0aWxlV3Jvbmd7IDAlLDEwMCV7dHJhbnNmb3JtOnRyYW5zbGF0ZVooOHB4KSB0cmFuc2xhdGVYKDApO30gMjAle3RyYW5zZm9ybTp0cmFuc2xhdGVaKDhweCkgdHJhbnNsYXRlWCgtNnB4KSByb3RhdGUoLTVkZWcpO30gNDAle3RyYW5zZm9ybTp0cmFuc2xhdGVaKDhweCkgdHJhbnNsYXRlWCg2cHgpIHJvdGF0ZSg1ZGVnKTt9IDYwJXt0cmFuc2Zvcm06dHJhbnNsYXRlWig4cHgpIHRyYW5zbGF0ZVgoLTVweCkgcm90YXRlKC00ZGVnKTt9IDgwJXt0cmFuc2Zvcm06dHJhbnNsYXRlWig4cHgpIHRyYW5zbGF0ZVgoNXB4KSByb3RhdGUoNGRlZyk7fSB9CgovKiBwb3Agb3V0IGFuaW1hdGlvbiAqLwoudGlsZS5wb3BwaW5neyBhbmltYXRpb246dGlsZVBvcCAuNDJzIGN1YmljLWJlemllciguNCwwLC42LDEpIGZvcndhcmRzOyB9CkBrZXlmcmFtZXMgdGlsZVBvcHsgMCV7dHJhbnNmb3JtOnRyYW5zbGF0ZVooMTRweCkgc2NhbGUoMS4wOCk7b3BhY2l0eToxO2ZpbHRlcjpicmlnaHRuZXNzKDEpO30gNDAle3RyYW5zZm9ybTp0cmFuc2xhdGVaKDQwcHgpIHNjYWxlKDEuMzUpO29wYWNpdHk6MTtmaWx0ZXI6YnJpZ2h0bmVzcygyLjIpO30gMTAwJXt0cmFuc2Zvcm06dHJhbnNsYXRlWigwKSBzY2FsZSgwLjEpO29wYWNpdHk6MDtmaWx0ZXI6YnJpZ2h0bmVzcygzKTt9IH0KCi8qIHRpbGUgbnVtYmVyIGZvbnQgc2l6ZSBiYXNlZCBvbiBkYXRhIGF0dHIgKi8KLnRpbGUgLm51bXsgZm9udC1zaXplOmluaGVyaXQ7IGxpbmUtaGVpZ2h0OjE7IHBvaW50ZXItZXZlbnRzOm5vbmU7IHBvc2l0aW9uOnJlbGF0aXZlOyB6LWluZGV4OjE7IHRleHQtc2hhZG93OjAgMXB4IDJweCByZ2JhKDAsMCwwLC4zNSk7IH0KCi8qIGNvbG91ciB0aGVtZXMgcGVyIHNpZ24gKi8KLnRpbGUtcG9zeyBiYWNrZ3JvdW5kOmxpbmVhci1ncmFkaWVudCgxNTBkZWcsIzM0ZDM5OSwjMDU5NjY5KTsgfQoudGlsZS1uZWd7IGJhY2tncm91bmQ6bGluZWFyLWdyYWRpZW50KDE1MGRlZywjZmI3MTg1LCNiZTE4NWQpOyB9Ci50aWxlLXplcm97IGJhY2tncm91bmQ6bGluZWFyLWdyYWRpZW50KDE1MGRlZywjODE4Y2Y4LCM0ZjQ2ZTUpOyB9CgovKiBoaW50IHB1bHNlICovCkBrZXlmcmFtZXMgaGludFB1bHNleyAwJSwxMDAle2ZpbHRlcjpicmlnaHRuZXNzKDEpO30gNTAle2ZpbHRlcjpicmlnaHRuZXNzKDEuNSk7fSB9Ci50aWxlLmhpbnR7IGFuaW1hdGlvbjpoaW50UHVsc2UgLjdzIGVhc2UtaW4tb3V0IDM7IH0KCi8qIHBhcnRpY2xlcyAqLwouc3Bhcmt7IHBvc2l0aW9uOmZpeGVkOyB6LWluZGV4OjYwOyBwb2ludGVyLWV2ZW50czpub25lOyBib3JkZXItcmFkaXVzOjUwJTsgfQoucmluZ3sgcG9zaXRpb246Zml4ZWQ7IHotaW5kZXg6NTk7IHBvaW50ZXItZXZlbnRzOm5vbmU7IGJvcmRlci1yYWRpdXM6NTAlOyBib3JkZXI6MnB4IHNvbGlkOyB9Ci5zY29yZS1mbHl7IHBvc2l0aW9uOmZpeGVkOyB6LWluZGV4OjYxOyBwb2ludGVyLWV2ZW50czpub25lOyBmb250LXdlaWdodDo5MDA7IGZvbnQtc2l6ZToyMHB4OyBhbmltYXRpb246Zmx5VXAgLjlzIGVhc2UgZm9yd2FyZHM7IH0KQGtleWZyYW1lcyBmbHlVcHsgMCV7b3BhY2l0eToxO3RyYW5zZm9ybTp0cmFuc2xhdGVZKDApIHNjYWxlKDEpO30gMTAwJXtvcGFjaXR5OjA7dHJhbnNmb3JtOnRyYW5zbGF0ZVkoLTQ1cHgpIHNjYWxlKDEuNCk7fSB9CgovKiBjb21ibyBiYWRnZSAqLwouY29tYm8tYmFkZ2V7IHBvc2l0aW9uOmZpeGVkOyB6LWluZGV4OjYyOyBwb2ludGVyLWV2ZW50czpub25lOyBmb250LXdlaWdodDo5MDA7IGZvbnQtc2l6ZToxN3B4OyBsZXR0ZXItc3BhY2luZzouNXB4OyBhbmltYXRpb246Y29tYm9BbmltIC45cyBlYXNlIGZvcndhcmRzOyB3aGl0ZS1zcGFjZTpub3dyYXA7IH0KQGtleWZyYW1lcyBjb21ib0FuaW17IDAle29wYWNpdHk6MDt0cmFuc2Zvcm06c2NhbGUoLjYpO30gMjAle29wYWNpdHk6MTt0cmFuc2Zvcm06c2NhbGUoMS4xOCk7fSA2MCV7b3BhY2l0eToxO3RyYW5zZm9ybTpzY2FsZSgxKTt9IDEwMCV7b3BhY2l0eTowO3RyYW5zZm9ybTp0cmFuc2xhdGVZKC0zMHB4KSBzY2FsZSguOSk7fSB9CgovKiDilIDilIAgT1ZFUkxBWVMg4pSA4pSAICovCi5vdmVybGF5eyBwb3NpdGlvbjpmaXhlZDsgaW5zZXQ6MDsgei1pbmRleDo4MDsgZGlzcGxheTpmbGV4OyBhbGlnbi1pdGVtczpjZW50ZXI7IGp1c3RpZnktY29udGVudDpjZW50ZXI7IGJhY2tncm91bmQ6cmdiYSgyLDcsMjAsLjc4KTsgYmFja2Ryb3AtZmlsdGVyOmJsdXIoN3B4KTsgYW5pbWF0aW9uOmZhZGVJbiAuMjVzIGVhc2U7IH0KLm92LWNhcmR7CiAgd2lkdGg6ODglOyBtYXgtd2lkdGg6MzQwcHg7IGJvcmRlci1yYWRpdXM6MjRweDsgcGFkZGluZzoyOHB4IDIycHg7IHRleHQtYWxpZ246Y2VudGVyOwogIGJhY2tncm91bmQ6bGluZWFyLWdyYWRpZW50KDE2NWRlZywgcmdiYSg4LDE4LDQ2LC45NyksIHJnYmEoMyw5LDI2LC45OCkpOwogIGJvcmRlcjoxcHggc29saWQgcmdiYSgyNTUsMjU1LDI1NSwuMTYpOyBib3gtc2hhZG93OjAgMzBweCA4MHB4IHJnYmEoMCwwLDAsLjU1KTsKICBhbmltYXRpb246Y2FyZFBvcCAuNHMgY3ViaWMtYmV6aWVyKC4yLC45LC4yNSwxLjMpOwp9CkBrZXlmcmFtZXMgY2FyZFBvcHsgZnJvbXt0cmFuc2Zvcm06c2NhbGUoLjgpO29wYWNpdHk6MDt9IHRve3RyYW5zZm9ybTpzY2FsZSgxKTtvcGFjaXR5OjE7fSB9Ci5vdi1pY29ueyBmb250LXNpemU6NTRweDsgbWFyZ2luLWJvdHRvbTo4cHg7IGZpbHRlcjpkcm9wLXNoYWRvdygwIDZweCAyMHB4IHJnYmEoNzgsMjMwLDE5NiwuNSkpOyB9Ci5vdi10aXRsZXsgZm9udC1zaXplOjIycHg7IGZvbnQtd2VpZ2h0OjkwMDsgbWFyZ2luLWJvdHRvbTo1cHg7IH0KLm92LXN1YnsgZm9udC1zaXplOjEzcHg7IGNvbG9yOnZhcigtLWRpbSk7IG1hcmdpbi1ib3R0b206MTZweDsgfQoub3YtYmlneyBmb250LXNpemU6MjhweDsgZm9udC13ZWlnaHQ6OTAwOyBjb2xvcjp2YXIoLS1taW50KTsgbWFyZ2luLWJvdHRvbTo0cHg7IH0KLm92LWJ0bnN7IGRpc3BsYXk6ZmxleDsgZmxleC1kaXJlY3Rpb246Y29sdW1uOyBnYXA6MTBweDsgbWFyZ2luLXRvcDoxNnB4OyB9Ci5jb25mZXR0aXsgcG9zaXRpb246Zml4ZWQ7IHotaW5kZXg6ODE7IHRvcDotMTBweDsgYm9yZGVyLXJhZGl1czoycHg7IHBvaW50ZXItZXZlbnRzOm5vbmU7IH0KCi8qIHR1dG9yaWFsIHBpbGwgKi8KLmhpbnQtYmFyeyB3aWR0aDoxMDAlOyBiYWNrZ3JvdW5kOnJnYmEoNzgsMjMwLDE5NiwuMSk7IGJvcmRlcjoxcHggc29saWQgcmdiYSg3OCwyMzAsMTk2LC4yMik7IGJvcmRlci1yYWRpdXM6MTRweDsgcGFkZGluZzo5cHggMTRweDsgZm9udC1zaXplOjExLjVweDsgY29sb3I6dmFyKC0tbWludCk7IHRleHQtYWxpZ246Y2VudGVyOyBtYXJnaW4tYm90dG9tOjEwcHg7IGRpcmVjdGlvbjpydGw7IH0KCjo6LXdlYmtpdC1zY3JvbGxiYXJ7IHdpZHRoOjVweDsgfQo6Oi13ZWJraXQtc2Nyb2xsYmFyLXRodW1ieyBiYWNrZ3JvdW5kOnJnYmEoMjU1LDI1NSwyNTUsLjE4KTsgYm9yZGVyLXJhZGl1czo0cHg7IH0KQG1lZGlhKG1heC13aWR0aDozODBweCl7IC50aXRsZXtmb250LXNpemU6MjhweDt9IH0KPC9zdHlsZT4KPC9oZWFkPgo8Ym9keT4KPGRpdiBpZD0iYXBwIj4KCjwhLS0g4pWQ4pWQIE1FTlUg4pWQ4pWQIC0tPgo8ZGl2IGNsYXNzPSJzY3JlZW4iIGlkPSJzY3ItbWVudSI+CiAgPGRpdiBjbGFzcz0ibG9nby13cmFwIj4KICAgIDxkaXYgY2xhc3M9ImxvZ28tZ2xvdyI+4p6VIOKeliDinKg8L2Rpdj4KICAgIDxkaXYgY2xhc3M9InRpdGxlIj7YstuM2LHZiCDYstuM2YY8L2Rpdj4KICAgIDxkaXYgY2xhc3M9InN1YnRpdGxlIj5aRVJPIFpFTiDigJQgTUlORCBSRUxBWCBQVVpaTEU8L2Rpdj4KICA8L2Rpdj4KICA8ZGl2IGNsYXNzPSJzdGF0LXJvdyI+CiAgICA8ZGl2IGNsYXNzPSJzYyI+PGIgaWQ9Im0tbHZsIj4xPC9iPjxzcGFuPtmF2YjYrNmI2K/bgSDZhNuM2YjZhDwvc3Bhbj48L2Rpdj4KICAgIDxkaXYgY2xhc3M9InNjIj48YiBpZD0ibS1zdGFycyI+MDwvYj48c3Bhbj7irZAg2LPYqtin2LHbkjwvc3Bhbj48L2Rpdj4KICAgIDxkaXYgY2xhc3M9InNjIj48YiBpZD0ibS1kb25lIj4wPC9iPjxzcGFuPtmF2qnZhdmEINi02K/bgTwvc3Bhbj48L2Rpdj4KICA8L2Rpdj4KICA8ZGl2IGNsYXNzPSJtZW51LWJ0bnMiPgogICAgPGJ1dHRvbiBjbGFzcz0iYnRuIGJ0bi1wcmltYXJ5IGJ0bi1ibG9jayIgaWQ9ImJ0bi1wbGF5Ij48c3Bhbj7ilrbvuI88L3NwYW4+INqp2r7bjNmE2YbYpyDYtNix2YjYuSDaqdix24zaujwvYnV0dG9uPgogICAgPGJ1dHRvbiBjbGFzcz0iYnRuIGJ0bi1naG9zdCBidG4tYmxvY2siIGlkPSJidG4tbGV2ZWxzIj48c3Bhbj7wn5e677iPPC9zcGFuPiDZhNuM2YjZhCDZhdmG2KrYrtioINqp2LHbjNq6PC9idXR0b24+CiAgICA8YnV0dG9uIGNsYXNzPSJidG4gYnRuLWdob3N0IGJ0bi1ibG9jayIgaWQ9ImJ0bi1yZXNldCI+PHNwYW4+8J+UhDwvc3Bhbj4g2b7bjNi0INix2YHYqiDYr9mI2KjYp9ix24Eg2LTYsdmI2Lkg2qnYsduM2ro8L2J1dHRvbj4KICA8L2Rpdj4KICA8ZGl2IGNsYXNzPSJ0b3Atcm93Ij4KICAgIDxidXR0b24gY2xhc3M9Imljb25idG4iIGlkPSJidG4tbXVzaWMtbSIgdGl0bGU9ItmF24zZiNiy2qkiPvCfjrU8L2J1dHRvbj4KICAgIDxidXR0b24gY2xhc3M9Imljb25idG4iIGlkPSJidG4tc2Z4LW0iIHRpdGxlPSLYotmI2KfYsiI+8J+UijwvYnV0dG9uPgogIDwvZGl2PgogIDxkaXYgc3R5bGU9Im1hcmdpbi10b3A6MThweDtmb250LXNpemU6MTFweDtjb2xvcjp2YXIoLS1kaW0yKTt0ZXh0LWFsaWduOmNlbnRlcjtkaXJlY3Rpb246cnRsO2xpbmUtaGVpZ2h0OjEuOTsiPgogICAg4p6VINin2YjYsSDinpYg2YjYp9mE24wg2bnYp9im2YTYsiDaqdmIINmF2YTYp9im24zauiDYrNmGINqp2Kcg2YXYrNmF2YjYuduBINi12YHYsSDbgdmIPGJyPtiv2Ygg2bnYp9im2YTbjNq6INmF2YbYqtiu2Kgg2qnYsduM2rog2KzbjNiz25IgKzMg2KfZiNixIC0zCiAgPC9kaXY+CjwvZGl2PgoKPCEtLSDilZDilZAgTEVWRUwgU0VMRUNUIOKVkOKVkCAtLT4KPGRpdiBjbGFzcz0ic2NyZWVuIGhpZGRlbiIgaWQ9InNjci1sZXZlbHMiPgogIDxkaXYgY2xhc3M9Imx2bC1oZWFkZXIiPgogICAgPGJ1dHRvbiBjbGFzcz0iaWNvbmJ0biIgaWQ9ImJ0bi1sdmwtYmFjayI+4p6h77iPPC9idXR0b24+CiAgICA8aDI+2YTbjNmI2YQg2YXZhtiq2K7YqCDaqdix24zaujwvaDI+CiAgICA8ZGl2IHN0eWxlPSJ3aWR0aDo0MnB4OyI+PC9kaXY+CiAgPC9kaXY+CiAgPGRpdiBjbGFzcz0ibHZsLWdyaWQiIGlkPSJsdmwtZ3JpZCI+PC9kaXY+CjwvZGl2PgoKPCEtLSDilZDilZAgR0FNRSDilZDilZAgLS0+CjxkaXYgY2xhc3M9InNjcmVlbiBoaWRkZW4iIGlkPSJzY3ItZ2FtZSI+CiAgPGRpdiBjbGFzcz0iZ2FtZS10b3AiPgogICAgPGRpdiBjbGFzcz0iUiI+CiAgICAgIDxidXR0b24gY2xhc3M9Imljb25idG4iIGlkPSJidG4tZ2FtZS1iYWNrIj7inqHvuI88L2J1dHRvbj4KICAgICAgPGRpdiBjbGFzcz0ibHZsLXBpbGwiPtmE24zZiNmEIDxzcGFuIGlkPSJnLWx2bCI+MTwvc3Bhbj48L2Rpdj4KICAgIDwvZGl2PgogICAgPGRpdiBjbGFzcz0iTCI+CiAgICAgIDxidXR0b24gY2xhc3M9Imljb25idG4iIGlkPSJidG4tbXVzaWMtZyI+8J+OtTwvYnV0dG9uPgogICAgICA8YnV0dG9uIGNsYXNzPSJpY29uYnRuIiBpZD0iYnRuLXNmeC1nIj7wn5SKPC9idXR0b24+CiAgICAgIDxidXR0b24gY2xhc3M9Imljb25idG4iIGlkPSJidG4taGludCI+8J+SoTwvYnV0dG9uPgogICAgICA8YnV0dG9uIGNsYXNzPSJpY29uYnRuIiBpZD0iYnRuLXJlc3RhcnQiPvCflIE8L2J1dHRvbj4KICAgIDwvZGl2PgogIDwvZGl2PgoKICA8ZGl2IGNsYXNzPSJoaW50LWJhciIgaWQ9ImhpbnQtYmFyIj4KICAgINiv2Ygg2bnYp9im2YTbjNq6INmF2YbYqtiu2Kgg2qnYsduM2rog2KzZhiDaqdinINmF2KzZhdmI2LnbgSDYtdmB2LEg24HZiCDigJQg2KzbjNiz25IgPGI+KzM8L2I+INin2YjYsSA8Yj4tMzwvYj4KICA8L2Rpdj4KCiAgPGRpdiBjbGFzcz0iaW5mby1yb3ciPgogICAgPGRpdiBjbGFzcz0iaW5mby1jaGlwIj48YiBpZD0iZy1sZWZ0Ij4wPC9iPjxzcGFuPtio2KfZgtuMINis2YjakduSPC9zcGFuPjwvZGl2PgogICAgPGRpdiBjbGFzcz0iaW5mby1jaGlwIj48YiBpZD0iZy1jb21ibyI+eDE8L2I+PHNwYW4+2qnZiNmF2KjZiDwvc3Bhbj48L2Rpdj4KICAgIDxkaXYgY2xhc3M9ImluZm8tY2hpcCI+PGIgaWQ9Imctc2NvcmUiPjA8L2I+PHNwYW4+2KfYs9qp2YjYsTwvc3Bhbj48L2Rpdj4KICAgIDxkaXYgY2xhc3M9ImluZm8tY2hpcCI+PGIgaWQ9ImctaGludHMiPjM8L2I+PHNwYW4+8J+SoSDYp9i02KfYsduSPC9zcGFuPjwvZGl2PgogIDwvZGl2PgoKICA8ZGl2IGNsYXNzPSJwcm9ncmVzcy10cmFjayI+PGRpdiBjbGFzcz0icHJvZ3Jlc3MtZmlsbCIgaWQ9InByb2dyZXNzLWZpbGwiIHN0eWxlPSJ3aWR0aDowJSI+PC9kaXY+PC9kaXY+CgogIDxkaXYgY2xhc3M9ImJvYXJkLXNjZW5lIj4KICAgIDxkaXYgY2xhc3M9ImJvYXJkLXdyYXAiPjxkaXYgaWQ9ImJvYXJkIj48L2Rpdj48L2Rpdj4KICA8L2Rpdj4KPC9kaXY+Cgo8L2Rpdj48IS0tICNhcHAgLS0+Cgo8c2NyaXB0PgooZnVuY3Rpb24oKXsKInVzZSBzdHJpY3QiOwoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIENPTlNUQU5UUwo9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KY29uc3QgVE9UQUxfTEVWRUxTID0gNDU7CmNvbnN0IFNUT1JFX0tFWSA9ICd6ZXJvemVuOnYxJzsKCmNvbnN0IENPTE9SU19QT1MgPSBbCiAgJ2xpbmVhci1ncmFkaWVudCgxNTBkZWcsIzM0ZDM5OSwjMDU5NjY5KScsCiAgJ2xpbmVhci1ncmFkaWVudCgxNTBkZWcsIzZlZTdiNywjMTBiOTgxKScsCiAgJ2xpbmVhci1ncmFkaWVudCgxNTBkZWcsI2E3ZjNkMCwjMzRkMzk5KScsCl07CmNvbnN0IENPTE9SU19ORUcgPSBbCiAgJ2xpbmVhci1ncmFkaWVudCgxNTBkZWcsI2ZiNzE4NSwjYmUxODVkKScsCiAgJ2xpbmVhci1ncmFkaWVudCgxNTBkZWcsI2Y0M2Y1ZSwjOWYxMjM5KScsCiAgJ2xpbmVhci1ncmFkaWVudCgxNTBkZWcsI2ZkYTRhZiwjZjQzZjVlKScsCl07CmNvbnN0IENPTE9SX1pFUk8gPSAnbGluZWFyLWdyYWRpZW50KDE1MGRlZywjODE4Y2Y4LCM0ZjQ2ZTUpJzsKCmZ1bmN0aW9uIGdyaWRTaXplKGx2bCl7CiAgaWYobHZsPD02KSByZXR1cm4gMzsKICBpZihsdmw8PTE0KSByZXR1cm4gNDsKICBpZihsdmw8PTI1KSByZXR1cm4gNTsKICBpZihsdmw8PTM1KSByZXR1cm4gNjsKICByZXR1cm4gNzsKfQpmdW5jdGlvbiBtYXhOdW0obHZsKXsgcmV0dXJuIE1hdGgubWluKDksIDIgKyBNYXRoLmZsb29yKGx2bC81KSk7IH0KZnVuY3Rpb24gaGFzWmVyb1RpbGUobHZsKXsgcmV0dXJuIGx2bCA+IDEwOyB9ICAgLy8gemVybyB0aWxlcyBhcHBlYXIgZnJvbSBsZXZlbCAxMQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIFNFRURFRCBSTkcKPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCmZ1bmN0aW9uIHJuZzMyKHNlZWQpewogIHJldHVybiAoKT0+ewogICAgc2VlZCB8PSAwOyBzZWVkID0gKHNlZWQgKyAweDZEMkI3OUY1KXwwOwogICAgbGV0IHQgPSBNYXRoLmltdWwoc2VlZF4oc2VlZD4+PjE1KSwgMXxzZWVkKTsKICAgIHQgPSAodCArIE1hdGguaW11bCh0Xih0Pj4+NyksIDYxfHQpKV50OwogICAgcmV0dXJuICgodF4odD4+PjE0KSk+Pj4wKSAvIDQyOTQ5NjcyOTY7CiAgfTsKfQpmdW5jdGlvbiByaShyLG4peyByZXR1cm4gTWF0aC5mbG9vcihyKCkqbik7IH0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICBMRVZFTCBHRU5FUkFUSU9OIChndWFyYW50ZWVkIHNvbHZhYmxlIOKAlCBwYWlycyBmaXJzdCkKPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCmZ1bmN0aW9uIGdlbmVyYXRlTGV2ZWwobHZsKXsKICBjb25zdCBOID0gZ3JpZFNpemUobHZsKTsKICBjb25zdCBteCA9IG1heE51bShsdmwpOwogIGNvbnN0IGNlbGxzID0gTipOOwogIGNvbnN0IHJuZyA9IHJuZzMyKGx2bCo2MTEzICsgMzEzMzcpOwogIGNvbnN0IHRpbGVzID0gW107CgogIC8vIEJ1aWxkIGV4YWN0IHBhaXJzIHNvIGV2ZXJ5IG5vbi1udWxsIHRpbGUgaGFzIGEgZ3VhcmFudGVlZCBwYXJ0bmVyLgogIC8vIEZvciBvZGQtY2VsbCBncmlkczogYWRkIG9uZSB6ZXJvIHRpbGUgKGJvdGggbGV2ZWxzIOKJpSAxMSBBTkQgdGhlIGdyaWQgaGFzIGFuIG9kZCBjZWxsIGNvdW50KTsKICAvLyBvdGhlcndpc2UgdGhlIGxhc3QgY2VsbCBzdGF5cyBudWxsIChlbXB0eSkuCiAgY29uc3Qgd2FudFplcm8gPSAoY2VsbHMgJSAyID09PSAxKSAmJiBoYXNaZXJvVGlsZShsdmwpOwogIGNvbnN0IHBhaXJzTmVlZGVkID0gTWF0aC5mbG9vcihjZWxscyAvIDIpOwoKICBmb3IobGV0IGkgPSAwOyBpIDwgcGFpcnNOZWVkZWQ7IGkrKyl7CiAgICBjb25zdCB2ID0gMSArIHJpKHJuZywgbXgpOwogICAgdGlsZXMucHVzaCh2LCAtdik7CiAgfQogIGlmKHdhbnRaZXJvKSB0aWxlcy5wdXNoKDApOwogIC8vIHRpbGVzLmxlbmd0aCBpcyBub3cgZWl0aGVyIGNlbGxzIChvZGQremVybykgb3IgY2VsbHMtMSAob2RkLCBubyB6ZXJvKSBvciBjZWxscyAoZXZlbikuCiAgLy8gV2UgcGFkIHJlbWFpbmluZyBzbG90cyB3aXRoIG51bGwgc28gdGhlIGdyaWQgYXJyYXkgYWx3YXlzIGhhcyBOKk4gZW50cmllcy4KICB3aGlsZSh0aWxlcy5sZW5ndGggPCBjZWxscykgdGlsZXMucHVzaChudWxsKTsKCiAgLy8gRmlzaGVyLVlhdGVzIHNodWZmbGUKICBmb3IobGV0IGkgPSB0aWxlcy5sZW5ndGggLSAxOyBpID4gMDsgaS0tKXsKICAgIGNvbnN0IGogPSByaShybmcsIGkgKyAxKTsKICAgIFt0aWxlc1tpXSwgdGlsZXNbal1dID0gW3RpbGVzW2pdLCB0aWxlc1tpXV07CiAgfQoKICAvLyBCdWlsZCAyLUQgZ3JpZCAobnVsbCDihpIgZW1wdHkgY2VsbCkKICBjb25zdCBncmlkID0gW107CiAgZm9yKGxldCByID0gMDsgciA8IE47IHIrKyl7CiAgICBncmlkLnB1c2godGlsZXMuc2xpY2UocipOLCAocisxKSpOKS5tYXAoKHYsIGNpKSA9PgogICAgICB2ID09PSBudWxsID8gbnVsbCA6IHsgdiwgaWQ6IHIrJ18nK2NpKydfJytNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zbGljZSgyKSB9CiAgICApKTsKICB9CgogIGNvbnN0IHBhaXJDb3VudCA9IHRpbGVzLmZpbHRlcih2ID0+IHYgIT09IG51bGwgJiYgdiAhPT0gMCkubGVuZ3RoIC8gMjsKICBjb25zdCB6ZXJvQ291bnQgPSB0aWxlcy5maWx0ZXIodiA9PiB2ID09PSAwKS5sZW5ndGg7CgogIHJldHVybiB7IE4sIGdyaWQsIHBhaXJDb3VudCwgemVyb0NvdW50LCB0b3RhbDogcGFpckNvdW50ICsgemVyb0NvdW50IH07Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICBQRVJTSVNURU5UIFNUT1JBR0UgIChsb2NhbFN0b3JhZ2UpCj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpsZXQgcHJvZyA9IHsgdW5sb2NrZWQ6MSwgc3RhcnM6e30sIHNmeDp0cnVlLCBtdXNpYzp0cnVlIH07CmZ1bmN0aW9uIGxvYWRQcm9nKCl7CiAgdHJ5eyBjb25zdCByPWxvY2FsU3RvcmFnZS5nZXRJdGVtKFNUT1JFX0tFWSk7IGlmKHIpIHByb2c9T2JqZWN0LmFzc2lnbihwcm9nLEpTT04ucGFyc2UocikpOyB9Y2F0Y2goZSl7fQogIHJlbmRlck1lbnVTdGF0cygpOwp9CmZ1bmN0aW9uIHNhdmVQcm9nKCl7IHRyeXsgbG9jYWxTdG9yYWdlLnNldEl0ZW0oU1RPUkVfS0VZLEpTT04uc3RyaW5naWZ5KHByb2cpKTsgfWNhdGNoKGUpe30gfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIEFVRElPICAoV2ViIEF1ZGlvIEFQSSwgemVybyBhc3NldHMpCj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpsZXQgYWN0eD1udWxsOwpmdW5jdGlvbiBlbnN1cmVBdWRpbygpewogIGlmKCFhY3R4KSB0cnl7IGFjdHg9bmV3KHdpbmRvdy5BdWRpb0NvbnRleHR8fHdpbmRvdy53ZWJraXRBdWRpb0NvbnRleHQpKCk7IH1jYXRjaChlKXsgYWN0eD1udWxsOyB9CiAgaWYoYWN0eCYmYWN0eC5zdGF0ZT09PSdzdXNwZW5kZWQnKSBhY3R4LnJlc3VtZSgpOwp9CmZ1bmN0aW9uIHBsYXlUb25lKGZyZXEsc3RhcnQsZHVyLHR5cGUsdm9sLGRldHVuZSl7CiAgaWYoIXByb2cuc2Z4fHwhYWN0eClyZXR1cm47CiAgY29uc3QgdDA9YWN0eC5jdXJyZW50VGltZStzdGFydDsKICBjb25zdCBvPWFjdHguY3JlYXRlT3NjaWxsYXRvcigpLCBnPWFjdHguY3JlYXRlR2FpbigpOwogIG8udHlwZT10eXBlfHwnc2luZSc7IG8uZnJlcXVlbmN5LnNldFZhbHVlQXRUaW1lKGZyZXEsdDApOwogIGlmKGRldHVuZSkgby5kZXR1bmUuc2V0VmFsdWVBdFRpbWUoZGV0dW5lLHQwKTsKICBnLmdhaW4uc2V0VmFsdWVBdFRpbWUoMCx0MCk7IGcuZ2Fpbi5saW5lYXJSYW1wVG9WYWx1ZUF0VGltZSh2b2x8fC4xNCx0MCsuMDE0KTsKICBnLmdhaW4uZXhwb25lbnRpYWxSYW1wVG9WYWx1ZUF0VGltZSguMDAwMSx0MCtkdXIpOwogIG8uY29ubmVjdChnKTsgZy5jb25uZWN0KGFjdHguZGVzdGluYXRpb24pOyBvLnN0YXJ0KHQwKTsgby5zdG9wKHQwK2R1cisuMDIpOwp9CmNvbnN0IFNGWCA9IHsKICBwaWNrKCl7IHBsYXlUb25lKDY2MCwwLC4wOSwndHJpYW5nbGUnLC4xMyk7IH0sCiAgbWF0Y2godil7CiAgICAvLyBoYXJtb25pYyBwYWlyIOKAlCBpbnRlcnZhbHMgYmFzZWQgb24gbWF0Y2hlZCBudW1iZXIKICAgIGNvbnN0IGJhc2UgPSA0NDArdio0MDsKICAgIHBsYXlUb25lKGJhc2UsMCwuMTgsJ3NpbmUnLC4xNik7CiAgICBwbGF5VG9uZShiYXNlKjEuNSwuMDQsLjE2LCd0cmlhbmdsZScsLjEwKTsKICB9LAogIGNvbWJvKG4peyBjb25zdCBmPVs1MjMsNjU5LDc4NCw5ODgsMTE3NSwxMzE5LDE1NjhdOyBmLnNsaWNlKDAsTWF0aC5taW4obisxLGYubGVuZ3RoKSkuZm9yRWFjaCgocCxpKT0+cGxheVRvbmUocCxpKi4wNSwuMjIsJ3NpbmUnLC4xNSkpOyB9LAogIHdyb25nKCl7IHBsYXlUb25lKDE2MCwwLC4xLCdzcXVhcmUnLC4wOSk7IHBsYXlUb25lKDEyMCwuMDYsLjEsJ3Nhd3Rvb3RoJywuMDcpOyB9LAogIHdpbigpeyBbNTIzLDY1OSw3ODQsMTA0NywxMzE5LDE1NjhdLmZvckVhY2goKGYsaSk9PnBsYXlUb25lKGYsaSouMDgsLjM1LCd0cmlhbmdsZScsLjE3KSk7IH0sCiAgaGludCgpeyBbODgwLDEzMjBdLmZvckVhY2goKGYsaSk9PnBsYXlUb25lKGYsaSouMDgsLjE4LCdzaW5lJywuMTIpKTsgfSwKfTsKCi8qIOKUgOKUgCBBbWJpZW50IE11c2ljIChsYXllcmVkIHNpbmUgcGFkcywgc2xvdyBldm9sdmluZykg4pSA4pSAICovCmxldCBtdXNpY05vZGVzPVtdLCBtdXNpY1J1bj1mYWxzZTsKY29uc3QgU0NBTEU9WzEzMC44LDE0Ni44LDE2NC44LDE3NC42LDE5NiwyMjAsMjQ2LjldOyAvLyBDMyBtYWpvcgpmdW5jdGlvbiBzdGFydE11c2ljKCl7CiAgaWYobXVzaWNSdW58fCFwcm9nLm11c2ljKXJldHVybjsgbXVzaWNSdW49dHJ1ZTsgZW5zdXJlQXVkaW8oKTsKICBmdW5jdGlvbiBsYXllcigpewogICAgaWYoIW11c2ljUnVufHwhYWN0eClyZXR1cm47CiAgICBjb25zdCBmPVNDQUxFW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSpTQ0FMRS5sZW5ndGgpXSooMStNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqMikpOwogICAgY29uc3Qgbz1hY3R4LmNyZWF0ZU9zY2lsbGF0b3IoKSwgZz1hY3R4LmNyZWF0ZUdhaW4oKSwgcmV2PWFjdHguY3JlYXRlR2FpbigpOwogICAgby50eXBlPSdzaW5lJzsgby5mcmVxdWVuY3kuc2V0VmFsdWVBdFRpbWUoZixhY3R4LmN1cnJlbnRUaW1lKTsKICAgIG8uZGV0dW5lLnNldFZhbHVlQXRUaW1lKChNYXRoLnJhbmRvbSgpLS41KSoxMixhY3R4LmN1cnJlbnRUaW1lKTsKICAgIGcuZ2Fpbi5zZXRWYWx1ZUF0VGltZSgwLGFjdHguY3VycmVudFRpbWUpOwogICAgY29uc3QgZHVyPTUrTWF0aC5yYW5kb20oKSo1OwogICAgZy5nYWluLmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKC4wMjIsYWN0eC5jdXJyZW50VGltZStkdXIqLjI1KTsKICAgIGcuZ2Fpbi5saW5lYXJSYW1wVG9WYWx1ZUF0VGltZSguMDEsYWN0eC5jdXJyZW50VGltZStkdXIqLjYpOwogICAgZy5nYWluLmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKDAsYWN0eC5jdXJyZW50VGltZStkdXIpOwogICAgby5jb25uZWN0KGcpOyBnLmNvbm5lY3QoYWN0eC5kZXN0aW5hdGlvbik7CiAgICBvLnN0YXJ0KGFjdHguY3VycmVudFRpbWUpOyBvLnN0b3AoYWN0eC5jdXJyZW50VGltZStkdXIpOwogICAgbXVzaWNOb2Rlcy5wdXNoKG8pOwogICAgc2V0VGltZW91dChsYXllciwgKDIuNStNYXRoLnJhbmRvbSgpKjIuNSkqMTAwMCk7CiAgfQogIGZvcihsZXQgaT0wO2k8MztpKyspIHNldFRpbWVvdXQobGF5ZXIsIGkqODAwKTsKfQpmdW5jdGlvbiBzdG9wTXVzaWMoKXsKICBtdXNpY1J1bj1mYWxzZTsKICBtdXNpY05vZGVzLmZvckVhY2gobj0+eyB0cnl7IG4uc3RvcCgpOyB9Y2F0Y2goZSl7fSB9KTsKICBtdXNpY05vZGVzPVtdOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAgU1RBVEUKPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCmxldCBsdmw9MSwgTj0zLCBncmlkPVtdLCBwYWlyQ291bnQ9MCwgY2xlYXJlZFBhaXJzPTAsIHNjb3JlPTAsIGNvbWJvPTEsIGhpbnRzPTM7CmxldCBzZWxlY3RlZD1udWxsOyAgIC8vIHtyLGN9CmxldCBib2FyZEVsOwoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIE5BVklHQVRJT04KPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCmNvbnN0IFNDUkVFTlM9e21lbnU6J3Njci1tZW51JyxsZXZlbHM6J3Njci1sZXZlbHMnLGdhbWU6J3Njci1nYW1lJ307CmZ1bmN0aW9uIHNob3cocyl7IE9iamVjdC52YWx1ZXMoU0NSRUVOUykuZm9yRWFjaChpZD0+ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpLmNsYXNzTGlzdC5hZGQoJ2hpZGRlbicpKTsgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoU0NSRUVOU1tzXSkuY2xhc3NMaXN0LnJlbW92ZSgnaGlkZGVuJyk7IH0KCmZ1bmN0aW9uIHJlbmRlck1lbnVTdGF0cygpewogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtLWx2bCcpLnRleHRDb250ZW50PXByb2cudW5sb2NrZWQ7CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ20tc3RhcnMnKS50ZXh0Q29udGVudD1PYmplY3QudmFsdWVzKHByb2cuc3RhcnMpLnJlZHVjZSgoYSxiKT0+YStiLDApOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtLWRvbmUnKS50ZXh0Q29udGVudD1PYmplY3Qua2V5cyhwcm9nLnN0YXJzKS5sZW5ndGg7CiAgdXBkYXRlSWNvbnMoKTsKfQpmdW5jdGlvbiB1cGRhdGVJY29ucygpewogIFsnbScsJ2cnXS5mb3JFYWNoKGs9PnsKICAgIGNvbnN0IG1zPWRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdidG4tbXVzaWMtJytrKSwgc3M9ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2J0bi1zZngtJytrKTsKICAgIGlmKG1zKXsgbXMudGV4dENvbnRlbnQ9cHJvZy5tdXNpYz8n8J+OtSc6J/CflIcnOyBtcy5jbGFzc0xpc3QudG9nZ2xlKCdvbicscHJvZy5tdXNpYyk7IH0KICAgIGlmKHNzKXsgc3MudGV4dENvbnRlbnQ9cHJvZy5zZng/J/CflIonOifwn5SIJzsgc3MuY2xhc3NMaXN0LnRvZ2dsZSgnb24nLHByb2cuc2Z4KTsgfQogIH0pOwp9CgpmdW5jdGlvbiByZW5kZXJMdmxHcmlkKCl7CiAgY29uc3QgZz1kb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbHZsLWdyaWQnKTsgZy5pbm5lckhUTUw9Jyc7CiAgZm9yKGxldCBpPTE7aTw9VE9UQUxfTEVWRUxTO2krKyl7CiAgICBjb25zdCBkPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpOwogICAgY29uc3QgZG9uZT0hIXByb2cuc3RhcnNbaV0sIGxvY2tlZD1pPnByb2cudW5sb2NrZWQ7CiAgICBkLmNsYXNzTmFtZT0nbGMgJysobG9ja2VkPydsb2NrZWQnOihkb25lPydkb25lJzooaT09PXByb2cudW5sb2NrZWQ/J2N1cic6JycpKSk7CiAgICBkLmlubmVySFRNTD1gPGRpdj4ke2l9PC9kaXY+YCsoZG9uZT9gPGRpdiBjbGFzcz0ic3RhciI+JHsn4q2QJy5yZXBlYXQocHJvZy5zdGFyc1tpXSl9PC9kaXY+YDonJyk7CiAgICBpZighbG9ja2VkKSBkLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywoKT0+eyBTRlgucGljaygpOyBzdGFydExldmVsKGkpOyB9KTsKICAgIGcuYXBwZW5kQ2hpbGQoZCk7CiAgfQp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAgR0FNRSBTVEFSVAo9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KZnVuY3Rpb24gc3RhcnRMZXZlbChsKXsKICBsdmw9bDsgc2VsZWN0ZWQ9bnVsbDsgc2NvcmU9MDsgY29tYm89MTsgY2xlYXJlZFBhaXJzPTA7IGhpbnRzPTM7CiAgY29uc3QgZ2VuPWdlbmVyYXRlTGV2ZWwobCk7CiAgTj1nZW4uTjsgZ3JpZD1nZW4uZ3JpZDsgcGFpckNvdW50PWdlbi5wYWlyQ291bnQgKyBnZW4uemVyb0NvdW50OwoKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZy1sdmwnKS50ZXh0Q29udGVudD1sOwogIHVwZGF0ZUh1ZCgpOwogIHJlbmRlckJvYXJkKCk7CiAgc2hvdygnZ2FtZScpOwogIHN0YXJ0TXVzaWMoKTsKfQoKZnVuY3Rpb24gdXBkYXRlSHVkKCl7CiAgY29uc3QgcmVtYWluaW5nPXBhaXJDb3VudC1jbGVhcmVkUGFpcnM7CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ctbGVmdCcpLnRleHRDb250ZW50PXJlbWFpbmluZzsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZy1jb21ibycpLnRleHRDb250ZW50PSd4Jytjb21ibzsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZy1zY29yZScpLnRleHRDb250ZW50PXNjb3JlOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdnLWhpbnRzJykudGV4dENvbnRlbnQ9aGludHM7CiAgY29uc3QgcGN0PXBhaXJDb3VudD9NYXRoLnJvdW5kKGNsZWFyZWRQYWlycy9wYWlyQ291bnQqMTAwKTowOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwcm9ncmVzcy1maWxsJykuc3R5bGUud2lkdGg9cGN0KyclJzsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIEJPQVJEIFJFTkRFUgo9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KZnVuY3Rpb24gY2VsbFB4KCl7CiAgY29uc3QgYXZhaWw9TWF0aC5taW4oNDAwLHdpbmRvdy5pbm5lcldpZHRoLTUyKTsKICByZXR1cm4gTWF0aC5tYXgoMzAsTWF0aC5taW4oNjYsTWF0aC5mbG9vcigoYXZhaWwtNSooTi0xKSkvTikpKTsKfQpmdW5jdGlvbiBudW1Gb250UHgoY3ApeyByZXR1cm4gTWF0aC5tYXgoMTMsTWF0aC5mbG9vcihjcCouMzgpKTsgfQoKZnVuY3Rpb24gdGlsZUNvbG9yKHYpewogIGlmKHY+MCkgcmV0dXJuIENPTE9SU19QT1NbTWF0aC5taW4odi0xLENPTE9SU19QT1MubGVuZ3RoLTEpXTsKICBpZih2PDApIHJldHVybiBDT0xPUlNfTkVHW01hdGgubWluKC12LTEsQ09MT1JTX05FRy5sZW5ndGgtMSldOwogIHJldHVybiBDT0xPUl9aRVJPOwp9CgpmdW5jdGlvbiByZW5kZXJCb2FyZCgpewogIGJvYXJkRWw9ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JvYXJkJyk7CiAgYm9hcmRFbC5pbm5lckhUTUw9Jyc7CiAgY29uc3QgY3A9Y2VsbFB4KCk7CiAgYm9hcmRFbC5zdHlsZS5ncmlkVGVtcGxhdGVDb2x1bW5zPWByZXBlYXQoJHtOfSwke2NwfXB4KWA7CiAgYm9hcmRFbC5zdHlsZS5ncmlkVGVtcGxhdGVSb3dzPWByZXBlYXQoJHtOfSwke2NwfXB4KWA7CiAgYm9hcmRFbC5zdHlsZS5nYXA9JzVweCc7CgogIGZvcihsZXQgcj0wO3I8TjtyKyspewogICAgZm9yKGxldCBjPTA7YzxOO2MrKyl7CiAgICAgIGNvbnN0IGNlbGw9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7CiAgICAgIGNlbGwuY2xhc3NOYW1lPSdjZWxsJzsgY2VsbC5zdHlsZS53aWR0aD1jcCsncHgnOyBjZWxsLnN0eWxlLmhlaWdodD1jcCsncHgnOwogICAgICBjb25zdCB0PWdyaWRbcl1bY107CiAgICAgIGlmKHQgIT09IG51bGwgJiYgdCAhPT0gdW5kZWZpbmVkKXsKICAgICAgICBjb25zdCB0aWxlPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpOwogICAgICAgIHRpbGUuY2xhc3NOYW1lPSd0aWxlICcrKHQudj4wPyd0aWxlLXBvcyc6dC52PDA/J3RpbGUtbmVnJzondGlsZS16ZXJvJyk7CiAgICAgICAgdGlsZS5kYXRhc2V0LnI9cjsgdGlsZS5kYXRhc2V0LmM9YzsKICAgICAgICB0aWxlLnN0eWxlLmJhY2tncm91bmQ9dGlsZUNvbG9yKHQudik7CiAgICAgICAgdGlsZS5zdHlsZS5mb250U2l6ZT1udW1Gb250UHgoY3ApKydweCc7CiAgICAgICAgY29uc3QgbGJsPSh0LnY+MD8nKyc6JycpK3QudjsKICAgICAgICB0aWxlLmlubmVySFRNTD1gPHNwYW4gY2xhc3M9Im51bSI+JHtsYmx9PC9zcGFuPmA7CiAgICAgICAgdGlsZS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsKCk9Pm9uVGlsZVRhcChyLGMpKTsKICAgICAgICBjZWxsLmFwcGVuZENoaWxkKHRpbGUpOwogICAgICB9CiAgICAgIGJvYXJkRWwuYXBwZW5kQ2hpbGQoY2VsbCk7CiAgICB9CiAgfQp9CgpmdW5jdGlvbiB0aWxlRWwocixjKXsgcmV0dXJuIGJvYXJkRWwucXVlcnlTZWxlY3RvcihgLnRpbGVbZGF0YS1yPSIke3J9Il1bZGF0YS1jPSIke2N9Il1gKTsgfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIEdBTUVQTEFZCj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpmdW5jdGlvbiBvblRpbGVUYXAocixjKXsKICBlbnN1cmVBdWRpbygpOwogIGNvbnN0IHQ9Z3JpZFtyXVtjXTsKICBpZighdCkgcmV0dXJuOwoKICAvLyBaZXJvIHRpbGUg4oCUIGF1dG8tcmVtb3ZlcyBpdHNlbGYKICBpZih0LnY9PT0wKXsKICAgIGNsZWFyVGlsZShyLGMsdHJ1ZSk7CiAgICBjb21ibysrOwogICAgc2NvcmUgKz0gNTAqY29tYm87CiAgICBjbGVhcmVkUGFpcnMrKzsKICAgIFNGWC5tYXRjaCgwKTsKICAgIHNwYXduU2NvcmVGbHkodGlsZUVsKHIsYyksJys1MCcpOwogICAgaWYoY29tYm8+MSkgc3Bhd25Db21ib0JhZGdlKHRpbGVFbChyLGMpKTsKICAgIHNldFRpbWVvdXQoKCk9PnsgYW5pbWF0ZVBvcChyLGMpOyB9LDEwKTsKICAgIHVwZGF0ZUh1ZCgpOwogICAgaWYoY2xlYXJlZFBhaXJzPj1wYWlyQ291bnQpIHNldFRpbWVvdXQod2luTGV2ZWwsNDIwKTsKICAgIHJldHVybjsKICB9CgogIGlmKCFzZWxlY3RlZCl7CiAgICAvLyBTZWxlY3QgdGhpcyB0aWxlCiAgICBzZWxlY3RlZD17cixjfTsKICAgIGNvbnN0IGVsPXRpbGVFbChyLGMpOwogICAgaWYoZWwpeyBlbC5jbGFzc0xpc3QuYWRkKCdzZWwnKTsgU0ZYLnBpY2soKTsgfQogICAgcmV0dXJuOwogIH0KCiAgLy8gU2Vjb25kIHRhcAogIGNvbnN0IHtyOnNyLGM6c2N9PXNlbGVjdGVkOwogIGlmKHNyPT09ciAmJiBzYz09PWMpewogICAgLy8gRGVzZWxlY3QKICAgIGNvbnN0IGVsPXRpbGVFbChyLGMpOyBpZihlbCkgZWwuY2xhc3NMaXN0LnJlbW92ZSgnc2VsJyk7CiAgICBzZWxlY3RlZD1udWxsOyByZXR1cm47CiAgfQoKICBjb25zdCBhPWdyaWRbc3JdW3NjXSwgYj1ncmlkW3JdW2NdOwogIGNvbnN0IGVsQT10aWxlRWwoc3Isc2MpLCBlbEI9dGlsZUVsKHIsYyk7CgogIGlmKGEgJiYgYiAmJiAoYS52K2Iudj09PTApKXsKICAgIC8vIE1BVENIIQogICAgaWYoZWxBKSBlbEEuY2xhc3NMaXN0LnJlbW92ZSgnc2VsJyk7CiAgICBjbGVhclRpbGUoc3Isc2MsZmFsc2UpOwogICAgY2xlYXJUaWxlKHIsYyxmYWxzZSk7CiAgICBjbGVhcmVkUGFpcnMrKzsKICAgIHNjb3JlICs9IE1hdGguYWJzKGEudikqMjAqY29tYm87CiAgICBTRlgubWF0Y2goTWF0aC5hYnMoYS52KSk7CiAgICBzcGF3blNjb3JlRmx5KGVsQiwnKycrTWF0aC5hYnMoYS52KSoyMCpjb21ibyk7CiAgICBpZihjb21ibz4xKSBzcGF3bkNvbWJvQmFkZ2UoZWxCKTsKICAgIHNwYXduUGFydGljbGVzKGVsQSxlbEIsYS52LGIudik7CiAgICBzZXRUaW1lb3V0KCgpPT57IGFuaW1hdGVQb3Aoc3Isc2MpOyBhbmltYXRlUG9wKHIsYyk7IH0sMTApOwogICAgY29tYm8rKzsKICAgIHNlbGVjdGVkPW51bGw7CiAgICB1cGRhdGVIdWQoKTsKICAgIGlmKGNsZWFyZWRQYWlycz49cGFpckNvdW50KSBzZXRUaW1lb3V0KHdpbkxldmVsLDQ4MCk7CiAgfSBlbHNlIHsKICAgIC8vIFdyb25nIHBhaXIKICAgIGNvbWJvPTE7CiAgICBTRlgud3JvbmcoKTsKICAgIGlmKGVsQSl7IGVsQS5jbGFzc0xpc3QucmVtb3ZlKCdzZWwnKTsgZWxBLmNsYXNzTGlzdC5yZW1vdmUoJ3dyb25nJyk7IHZvaWQgZWxBLm9mZnNldFdpZHRoOyBlbEEuY2xhc3NMaXN0LmFkZCgnd3JvbmcnKTsgfQogICAgaWYoZWxCKXsgZWxCLmNsYXNzTGlzdC5yZW1vdmUoJ3dyb25nJyk7IHZvaWQgZWxCLm9mZnNldFdpZHRoOyBlbEIuY2xhc3NMaXN0LmFkZCgnd3JvbmcnKTsgfQogICAgc2V0VGltZW91dCgoKT0+ewogICAgICBpZihlbEEpIGVsQS5jbGFzc0xpc3QucmVtb3ZlKCd3cm9uZycpOwogICAgICBpZihlbEIpIGVsQi5jbGFzc0xpc3QucmVtb3ZlKCd3cm9uZycpOwogICAgICBpZihlbEEpIGVsQS5jbGFzc0xpc3QuYWRkKCdzZWwnKTsgLy8ga2VlcCBBIHNlbGVjdGVkCiAgICB9LDM4MCk7CiAgICAvLyBLZWVwIEEgc2VsZWN0ZWQsIHN3aXRjaCBmb2N1cyB0byBuZXcgdGFwCiAgICBzZWxlY3RlZD17cixjfTsKICAgIGlmKGVsQil7IHNldFRpbWVvdXQoKCk9PnsgZWxCLmNsYXNzTGlzdC5hZGQoJ3NlbCcpOyB9LDQwMCk7IH0KICAgIHVwZGF0ZUh1ZCgpOwogIH0KfQoKZnVuY3Rpb24gY2xlYXJUaWxlKHIsYyxpc1plcm8pewogIGdyaWRbcl1bY109bnVsbDsKfQpmdW5jdGlvbiBhbmltYXRlUG9wKHIsYyl7CiAgY29uc3QgZWw9dGlsZUVsKHIsYyk7CiAgaWYoIWVsKXJldHVybjsKICBlbC5jbGFzc0xpc3QuYWRkKCdwb3BwaW5nJyk7CiAgc2V0VGltZW91dCgoKT0+ZWwucmVtb3ZlKCksNDUwKTsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIEhJTlQKPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCmZ1bmN0aW9uIHVzZUhpbnQoKXsKICBpZihoaW50czw9MCl7IFNGWC53cm9uZygpOyByZXR1cm47IH0KICAvLyBGaW5kIGEgdmFsaWQgcGFpcgogIGNvbnN0IGZsYXQ9W107CiAgZm9yKGxldCByPTA7cjxOO3IrKykgZm9yKGxldCBjPTA7YzxOO2MrKykgaWYoZ3JpZFtyXVtjXSkgZmxhdC5wdXNoKHtyLGMsdjpncmlkW3JdW2NdLnZ9KTsKICBmb3IobGV0IGk9MDtpPGZsYXQubGVuZ3RoO2krKyl7CiAgICBmb3IobGV0IGo9aSsxO2o8ZmxhdC5sZW5ndGg7aisrKXsKICAgICAgaWYoZmxhdFtpXS52K2ZsYXRbal0udj09PTApewogICAgICAgIGhpbnRzLS07CiAgICAgICAgU0ZYLmhpbnQoKTsKICAgICAgICB1cGRhdGVIdWQoKTsKICAgICAgICBjb25zdCBlYT10aWxlRWwoZmxhdFtpXS5yLGZsYXRbaV0uYyksIGViPXRpbGVFbChmbGF0W2pdLnIsZmxhdFtqXS5jKTsKICAgICAgICBpZihlYSl7IGVhLmNsYXNzTGlzdC5yZW1vdmUoJ2hpbnQnKTsgdm9pZCBlYS5vZmZzZXRXaWR0aDsgZWEuY2xhc3NMaXN0LmFkZCgnaGludCcpOyB9CiAgICAgICAgaWYoZWIpeyBlYSYmc2V0VGltZW91dCgoKT0+eyBlYi5jbGFzc0xpc3QucmVtb3ZlKCdoaW50Jyk7IHZvaWQgZWIub2Zmc2V0V2lkdGg7IGViLmNsYXNzTGlzdC5hZGQoJ2hpbnQnKTsgfSwxMDApOyB9CiAgICAgICAgcmV0dXJuOwogICAgICB9CiAgICB9CiAgICBpZihmbGF0W2ldLnY9PT0wKXsKICAgICAgaGludHMtLTsKICAgICAgU0ZYLmhpbnQoKTsKICAgICAgdXBkYXRlSHVkKCk7CiAgICAgIGNvbnN0IGVhPXRpbGVFbChmbGF0W2ldLnIsZmxhdFtpXS5jKTsKICAgICAgaWYoZWEpeyBlYS5jbGFzc0xpc3QucmVtb3ZlKCdoaW50Jyk7IHZvaWQgZWEub2Zmc2V0V2lkdGg7IGVhLmNsYXNzTGlzdC5hZGQoJ2hpbnQnKTsgfQogICAgICByZXR1cm47CiAgICB9CiAgfQogIFNGWC53cm9uZygpOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAgUEFSVElDTEVTICYgRlgKPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCmZ1bmN0aW9uIHNwYXduUGFydGljbGVzKGVsQSxlbEIsdmEsdmIpewogIFtlbEEsZWxCXS5mb3JFYWNoKChlbCxpZHgpPT57CiAgICBpZighZWwpcmV0dXJuOwogICAgY29uc3QgcmVjdD1lbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTsKICAgIGNvbnN0IGN4PXJlY3QubGVmdCtyZWN0LndpZHRoLzIsIGN5PXJlY3QudG9wK3JlY3QuaGVpZ2h0LzI7CiAgICBjb25zdCBjb2w9KGlkeD09PTA/dmE6dmIpPjA/JyMzNGQzOTknOicjZmI3MTg1JzsKICAgIC8vIHNwYXJrcwogICAgZm9yKGxldCBpPTA7aTw5O2krKyl7CiAgICAgIGNvbnN0IHM9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7CiAgICAgIHMuY2xhc3NOYW1lPSdzcGFyayc7CiAgICAgIGNvbnN0IHN6PTMrTWF0aC5yYW5kb20oKSo1OwogICAgICBzLnN0eWxlLmNzc1RleHQ9YHdpZHRoOiR7c3p9cHg7aGVpZ2h0OiR7c3p9cHg7bGVmdDoke2N4fXB4O3RvcDoke2N5fXB4O2JhY2tncm91bmQ6JHtjb2x9O2A7CiAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQocyk7CiAgICAgIGNvbnN0IGFuZz1NYXRoLnJhbmRvbSgpKk1hdGguUEkqMiwgZGlzdD0yNCtNYXRoLnJhbmRvbSgpKjQ0OwogICAgICBzLmFuaW1hdGUoW3t0cmFuc2Zvcm06J3RyYW5zbGF0ZSgwLDApJyxvcGFjaXR5OjF9LHt0cmFuc2Zvcm06YHRyYW5zbGF0ZSgke01hdGguY29zKGFuZykqZGlzdH1weCwke01hdGguc2luKGFuZykqZGlzdH1weClgLG9wYWNpdHk6MH1dLHtkdXJhdGlvbjozODArTWF0aC5yYW5kb20oKSoyMDAsZWFzaW5nOidlYXNlLW91dCd9KTsKICAgICAgc2V0VGltZW91dCgoKT0+cy5yZW1vdmUoKSw2MjApOwogICAgfQogICAgLy8gcmluZwogICAgY29uc3QgcmluZz1kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTsKICAgIHJpbmcuY2xhc3NOYW1lPSdyaW5nJzsKICAgIHJpbmcuc3R5bGUuY3NzVGV4dD1gbGVmdDoke2N4fXB4O3RvcDoke2N5fXB4O3dpZHRoOjRweDtoZWlnaHQ6NHB4O21hcmdpbjotMnB4IDAgMCAtMnB4O2JvcmRlci1jb2xvcjoke2NvbH07YDsKICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQocmluZyk7CiAgICByaW5nLmFuaW1hdGUoW3t0cmFuc2Zvcm06J3NjYWxlKDEpJyxvcGFjaXR5OjF9LHt0cmFuc2Zvcm06J3NjYWxlKDcpJyxvcGFjaXR5OjB9XSx7ZHVyYXRpb246NDgwLGVhc2luZzonZWFzZS1vdXQnfSk7CiAgICBzZXRUaW1lb3V0KCgpPT5yaW5nLnJlbW92ZSgpLDUyMCk7CiAgfSk7Cn0KCmZ1bmN0aW9uIHNwYXduU2NvcmVGbHkoZWwsdHh0KXsKICBpZighZWwpcmV0dXJuOwogIGNvbnN0IHJlY3Q9ZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7CiAgY29uc3QgZD1kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTsKICBkLmNsYXNzTmFtZT0nc2NvcmUtZmx5JzsKICBkLnN0eWxlLmNzc1RleHQ9YGxlZnQ6JHtyZWN0LmxlZnQrcmVjdC53aWR0aC8yLTE2fXB4O3RvcDoke3JlY3QudG9wfXB4O2NvbG9yOiNmYmJmMjQ7dGV4dC1zaGFkb3c6MCAycHggNnB4IHJnYmEoMCwwLDAsLjUpO2A7CiAgZC50ZXh0Q29udGVudD10eHQ7CiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChkKTsKICBzZXRUaW1lb3V0KCgpPT5kLnJlbW92ZSgpLDk1MCk7Cn0KCmZ1bmN0aW9uIHNwYXduQ29tYm9CYWRnZShlbCl7CiAgaWYoIWVsKXJldHVybjsKICBjb25zdCByZWN0PWVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpOwogIGNvbnN0IGQ9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7CiAgZC5jbGFzc05hbWU9J2NvbWJvLWJhZGdlJzsKICBkLnN0eWxlLmNzc1RleHQ9YGxlZnQ6JHtyZWN0LmxlZnQrcmVjdC53aWR0aC8yLTQwfXB4O3RvcDoke3JlY3QudG9wLTI4fXB4O2NvbG9yOiNjMDg0ZmM7dGV4dC1zaGFkb3c6MCAycHggOHB4IHJnYmEoMTkyLDEzMiwyNTIsLjYpO2A7CiAgZC50ZXh0Q29udGVudD0nQ09NQk8geCcrY29tYm8rJyEnOwogIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZCk7CiAgU0ZYLmNvbWJvKGNvbWJvKTsKICBzZXRUaW1lb3V0KCgpPT5kLnJlbW92ZSgpLDk2MCk7Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICBXSU4gLyBPVkVSTEFZCj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpmdW5jdGlvbiB3aW5MZXZlbCgpewogIFNGWC53aW4oKTsKICBjb25zdCBzdGFycz1jb21ibz49Nj8zOihjb21ibz49Mz8yOjEpOwogIHByb2cuc3RhcnNbbHZsXT1NYXRoLm1heChwcm9nLnN0YXJzW2x2bF18fDAsc3RhcnMpOwogIGlmKGx2bD09PXByb2cudW5sb2NrZWQmJmx2bDxUT1RBTF9MRVZFTFMpIHByb2cudW5sb2NrZWQ9bHZsKzE7CiAgc2F2ZVByb2coKTsKICBzcGF3bkNvbmZldHRpKCk7CiAgc2hvd092ZXJsYXkoewogICAgaWNvbjon8J+PhicsIHRpdGxlOifZhNuM2YjZhCDZhdqp2YXZhCEnLCBzdWI6J9i02KfZhtiv2KfYsSDigJQg2KLZviDZhtuSINiz2qnZiNmGINiz25Ig2K3ZhCDaqdixINmE24zYpycsCiAgICBiaWc6c2NvcmUrJ3B0cycsIHN0YXJzLAogICAgYnRuczpbCiAgICAgIGx2bDxUT1RBTF9MRVZFTFM/e2xibDon2Kfar9mE2Kcg2YTbjNmI2YQg4pa277iPJyxmbjooKT0+eyBjbG9zZU92KCk7IHN0YXJ0TGV2ZWwobHZsKzEpOyB9fTp7bGJsOifYqtmF2KfZhSDZhNuM2YjZhNiyINmF2qnZhdmEIPCfjoknLGZuOigpPT57IGNsb3NlT3YoKTsgc2hvdygnbWVudScpOyByZW5kZXJNZW51U3RhdHMoKTsgfX0sCiAgICAgIHtsYmw6J9mF24zZhtmIJyxmbjooKT0+eyBjbG9zZU92KCk7IHNob3coJ21lbnUnKTsgcmVuZGVyTWVudVN0YXRzKCk7IH0sZ2hvc3Q6dHJ1ZX0KICAgIF0KICB9KTsKfQpmdW5jdGlvbiBzaG93T3ZlcmxheShjZmcpewogIGNvbnN0IG92PWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpOyBvdi5jbGFzc05hbWU9J292ZXJsYXknOyBvdi5pZD0nYWN0aXZlLW92JzsKICBjb25zdCBzaD1jZmcuc3RhcnM/YDxkaXYgc3R5bGU9ImZvbnQtc2l6ZToyMnB4O21hcmdpbi1ib3R0b206NXB4OyI+JHsn4q2QJy5yZXBlYXQoY2ZnLnN0YXJzKX0keyfimIYnLnJlcGVhdCgzLWNmZy5zdGFycyl9PC9kaXY+YDonJzsKICBvdi5pbm5lckhUTUw9YDxkaXYgY2xhc3M9Im92LWNhcmQiPjxkaXYgY2xhc3M9Im92LWljb24iPiR7Y2ZnLmljb259PC9kaXY+PGRpdiBjbGFzcz0ib3YtdGl0bGUiPiR7Y2ZnLnRpdGxlfTwvZGl2PjxkaXYgY2xhc3M9Im92LXN1YiI+JHtjZmcuc3VifTwvZGl2PiR7c2h9PGRpdiBjbGFzcz0ib3YtYmlnIj4ke2NmZy5iaWd9PC9kaXY+PGRpdiBjbGFzcz0ib3YtYnRucyIgaWQ9Im92LWJ0bnMiPjwvZGl2PjwvZGl2PmA7CiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChvdik7CiAgY29uc3Qgd3JhcD1vdi5xdWVyeVNlbGVjdG9yKCcjb3YtYnRucycpOwogIGNmZy5idG5zLmZvckVhY2goYj0+ewogICAgY29uc3QgYnRuPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpOwogICAgYnRuLmNsYXNzTmFtZT0nYnRuIGJ0bi1ibG9jaycrKGIuZ2hvc3Q/JyBidG4tZ2hvc3QnOicgYnRuLXByaW1hcnknKTsKICAgIGJ0bi50ZXh0Q29udGVudD1iLmxibDsKICAgIGJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsKCk9PnsgU0ZYLnBpY2soKTsgYi5mbigpOyB9KTsKICAgIHdyYXAuYXBwZW5kQ2hpbGQoYnRuKTsKICB9KTsKfQpmdW5jdGlvbiBjbG9zZU92KCl7IGNvbnN0IG89ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FjdGl2ZS1vdicpOyBpZihvKW8ucmVtb3ZlKCk7IH0KCmZ1bmN0aW9uIHNwYXduQ29uZmV0dGkoKXsKICBjb25zdCBjb2xzPVsnIzRlZTZjNCcsJyMzOGJkZjgnLCcjYzA4NGZjJywnI2Y0NzJiNicsJyNmYmJmMjQnLCcjODZlZmFjJ107CiAgZm9yKGxldCBpPTA7aTw1NTtpKyspewogICAgY29uc3QgZWw9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7CiAgICBlbC5jbGFzc05hbWU9J2NvbmZldHRpJzsKICAgIGVsLnN0eWxlLmJhY2tncm91bmQ9Y29sc1tNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqY29scy5sZW5ndGgpXTsKICAgIGVsLnN0eWxlLmxlZnQ9TWF0aC5yYW5kb20oKSoxMDArJ3Z3JzsKICAgIGVsLnN0eWxlLndpZHRoPSg1K01hdGgucmFuZG9tKCkqNSkrJ3B4JzsgZWwuc3R5bGUuaGVpZ2h0PSg4K01hdGgucmFuZG9tKCkqOCkrJ3B4JzsKICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZWwpOwogICAgZWwuYW5pbWF0ZShbe3RyYW5zZm9ybTondHJhbnNsYXRlWSgwKSByb3RhdGUoMGRlZyknLG9wYWNpdHk6MX0se3RyYW5zZm9ybTpgdHJhbnNsYXRlWSgke3dpbmRvdy5pbm5lckhlaWdodCs1MH1weCkgcm90YXRlKCR7MzYwK01hdGgucmFuZG9tKCkqNDAwfWRlZylgLG9wYWNpdHk6Ljl9XSx7ZHVyYXRpb246MTUwMCtNYXRoLnJhbmRvbSgpKjExMDAsZWFzaW5nOidjdWJpYy1iZXppZXIoLjIsLjYsLjQsMSknfSk7CiAgICBzZXRUaW1lb3V0KCgpPT5lbC5yZW1vdmUoKSwyNzAwKTsKICB9Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICBXSVJFIFVQCj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYnRuLXBsYXknKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsKCk9PnsgU0ZYLnBpY2soKTsgZW5zdXJlQXVkaW8oKTsgc3RhcnRMZXZlbChwcm9nLnVubG9ja2VkKTsgfSk7CmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdidG4tbGV2ZWxzJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCgpPT57IFNGWC5waWNrKCk7IHJlbmRlckx2bEdyaWQoKTsgc2hvdygnbGV2ZWxzJyk7IH0pOwpkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYnRuLWx2bC1iYWNrJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCgpPT57IFNGWC5waWNrKCk7IHNob3coJ21lbnUnKTsgfSk7CmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdidG4tZ2FtZS1iYWNrJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCgpPT57IFNGWC5waWNrKCk7IHNob3coJ21lbnUnKTsgcmVuZGVyTWVudVN0YXRzKCk7IH0pOwpkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYnRuLXJlc3RhcnQnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsKCk9PnsgU0ZYLnBpY2soKTsgc3RhcnRMZXZlbChsdmwpOyB9KTsKZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2J0bi1oaW50JykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCgpPT51c2VIaW50KCkpOwpkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYnRuLXJlc2V0JykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCgpPT57CiAgaWYoY29uZmlybSgn2qnbjNinINii2b4g2YjYp9mC2LnbjCDYqtmF2KfZhSDZvtuM2LQg2LHZgdiqINix24zYs9iqINqp2LHZhtinINqG2Kfbgdiq25Ig24HbjNq62J8nKSl7CiAgICBwcm9nPXt1bmxvY2tlZDoxLHN0YXJzOnt9LHNmeDpwcm9nLnNmeCxtdXNpYzpwcm9nLm11c2ljfTsKICAgIHNhdmVQcm9nKCk7IHJlbmRlck1lbnVTdGF0cygpOwogIH0KfSk7ClsnbScsJ2cnXS5mb3JFYWNoKGs9PnsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYnRuLW11c2ljLScraykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCgpPT57IHByb2cubXVzaWM9IXByb2cubXVzaWM7IGVuc3VyZUF1ZGlvKCk7IHVwZGF0ZUljb25zKCk7IHNhdmVQcm9nKCk7IHByb2cubXVzaWM/c3RhcnRNdXNpYygpOnN0b3BNdXNpYygpOyB9KTsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYnRuLXNmeC0nK2spLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywoKT0+eyBwcm9nLnNmeD0hcHJvZy5zZng7IGVuc3VyZUF1ZGlvKCk7IFNGWC5waWNrKCk7IHVwZGF0ZUljb25zKCk7IHNhdmVQcm9nKCk7IH0pOwp9KTsKd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsKCk9PnsgaWYoIWRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzY3ItZ2FtZScpLmNsYXNzTGlzdC5jb250YWlucygnaGlkZGVuJykpIHJlbmRlckJvYXJkKCk7IH0pOwoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIElOSVQKPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCmxvYWRQcm9nKCk7CnNob3coJ21lbnUnKTsKCn0pKCk7Cjwvc2NyaXB0Pgo8L2JvZHk+CjwvaHRtbD4K";
const GAME_PUZZLE_B64 = "PCFET0NUWVBFIGh0bWw+CjxodG1sIGxhbmc9ImVuIj4KPGhlYWQ+CjxtZXRhIGNoYXJzZXQ9IlVURi04Ij4KPG1ldGEgbmFtZT0idmlld3BvcnQiIGNvbnRlbnQ9IndpZHRoPWRldmljZS13aWR0aCwgaW5pdGlhbC1zY2FsZT0xLjAsIG1heGltdW0tc2NhbGU9MS4wLCB1c2VyLXNjYWxhYmxlPW5vIj4KPHRpdGxlPlBpY3R1cmUgUHV6emxlPC90aXRsZT4KPHN0eWxlPgogIDpyb290ewogICAgLS1iZy0xOiMxQjFCMkY7CiAgICAtLWJnLTI6IzIzMjM0MjsKICAgIC0td29vZC0xOiM1YjNhMjk7CiAgICAtLXdvb2QtMjojM2MyNTE3OwogICAgLS1hbWJlcjojRkZCODRDOwogICAgLS10ZWFsOiMzRERDOTc7CiAgICAtLXBpbms6I0ZGNUQ4RjsKICAgIC0tY3JlYW06I0Y2RjFFNzsKICAgIC0taW5rOiNFREVCRjc7CiAgICAtLWluay1kaW06I0E5QTZDNDsKICAgIC0tZm9udC1kaXNwbGF5OidCYWxvbyAyJywnU2Vnb2UgVUkgUm91bmRlZCcsJ0FyaWFsIFJvdW5kZWQgTVQgQm9sZCcsc3lzdGVtLXVpLHNhbnMtc2VyaWY7CiAgICAtLWZvbnQtYm9keTpzeXN0ZW0tdWksLWFwcGxlLXN5c3RlbSwnU2Vnb2UgVUknLFJvYm90byxzYW5zLXNlcmlmOwogIH0KICAqe2JveC1zaXppbmc6Ym9yZGVyLWJveDstd2Via2l0LXRhcC1oaWdobGlnaHQtY29sb3I6dHJhbnNwYXJlbnQ7fQogIGh0bWwsYm9keXttYXJnaW46MDtwYWRkaW5nOjA7aGVpZ2h0OjEwMCU7b3ZlcmZsb3cteDpoaWRkZW47fQogIGJvZHl7CiAgICBiYWNrZ3JvdW5kOnJhZGlhbC1ncmFkaWVudChjaXJjbGUgYXQgNTAlIC0xMCUsICMyYzJjNTQgMCUsIHZhcigtLWJnLTEpIDU1JSwgIzEzMTMyMiAxMDAlKTsKICAgIGNvbG9yOnZhcigtLWluayk7CiAgICBmb250LWZhbWlseTp2YXIoLS1mb250LWJvZHkpOwogICAgbWluLWhlaWdodDoxMDB2aDsKICAgIGRpc3BsYXk6ZmxleDsKICAgIGZsZXgtZGlyZWN0aW9uOmNvbHVtbjsKICAgIGFsaWduLWl0ZW1zOmNlbnRlcjsKICAgIHBhZGRpbmc6MTZweCAxMnB4IDQwcHg7CiAgfQogIGgxLGgyLGgze2ZvbnQtZmFtaWx5OnZhcigtLWZvbnQtZGlzcGxheSk7bWFyZ2luOjAgMCA0cHg7bGV0dGVyLXNwYWNpbmc6LjNweDt9CiAgYnV0dG9ue2ZvbnQtZmFtaWx5OnZhcigtLWZvbnQtYm9keSk7fQogICNhcHB7d2lkdGg6MTAwJTttYXgtd2lkdGg6NjIwcHg7ZGlzcGxheTpmbGV4O2ZsZXgtZGlyZWN0aW9uOmNvbHVtbjthbGlnbi1pdGVtczpjZW50ZXI7fQoKICAuc2NyZWVue2Rpc3BsYXk6bm9uZTt3aWR0aDoxMDAlO2ZsZXgtZGlyZWN0aW9uOmNvbHVtbjthbGlnbi1pdGVtczpjZW50ZXI7YW5pbWF0aW9uOmZhZGVJbiAuMjVzIGVhc2U7fQogIC5zY3JlZW4uYWN0aXZle2Rpc3BsYXk6ZmxleDt9CiAgQGtleWZyYW1lcyBmYWRlSW57ZnJvbXtvcGFjaXR5OjA7dHJhbnNmb3JtOnRyYW5zbGF0ZVkoNnB4KTt9dG97b3BhY2l0eToxO3RyYW5zZm9ybTpub25lO319CgogIC50b3BiYXJ7d2lkdGg6MTAwJTtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2p1c3RpZnktY29udGVudDpzcGFjZS1iZXR3ZWVuO21hcmdpbi1ib3R0b206MTRweDt9CiAgLnRvcGJhciBoMXtmb250LXNpemU6MjZweDtiYWNrZ3JvdW5kOmxpbmVhci1ncmFkaWVudCg5MGRlZyx2YXIoLS1hbWJlciksdmFyKC0tcGluaykpOy13ZWJraXQtYmFja2dyb3VuZC1jbGlwOnRleHQ7YmFja2dyb3VuZC1jbGlwOnRleHQ7Y29sb3I6dHJhbnNwYXJlbnQ7fQogIC5iYWNrYnRue2JhY2tncm91bmQ6dmFyKC0tYmctMik7Y29sb3I6dmFyKC0taW5rKTtib3JkZXI6MXB4IHNvbGlkICMzYTNhNWM7Ym9yZGVyLXJhZGl1czoxMHB4O3BhZGRpbmc6OHB4IDE0cHg7Zm9udC1zaXplOjE0cHg7Y3Vyc29yOnBvaW50ZXI7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6NnB4O30KICAuYmFja2J0bjphY3RpdmV7dHJhbnNmb3JtOnNjYWxlKC45Nik7fQoKICAuc3VidGl0bGV7Y29sb3I6dmFyKC0taW5rLWRpbSk7Zm9udC1zaXplOjEzcHg7bWFyZ2luLWJvdHRvbToxOHB4O3RleHQtYWxpZ246Y2VudGVyO2xpbmUtaGVpZ2h0OjEuNTt9CgogIC8qIC0tLS0tLS0tLS0gY2F0ZWdvcnkgLyBwaWN0dXJlIGdyaWRzIC0tLS0tLS0tLS0gKi8KICAuZ3JpZC1jYXJkc3tkaXNwbGF5OmdyaWQ7Z3JpZC10ZW1wbGF0ZS1jb2x1bW5zOnJlcGVhdCgyLDFmcik7Z2FwOjEycHg7d2lkdGg6MTAwJTt9CiAgQG1lZGlhKG1pbi13aWR0aDo0ODBweCl7LmdyaWQtY2FyZHN7Z3JpZC10ZW1wbGF0ZS1jb2x1bW5zOnJlcGVhdCgzLDFmcik7fX0KCiAgLmNhdC1jYXJkewogICAgYmFja2dyb3VuZDpsaW5lYXItZ3JhZGllbnQoMTQ1ZGVnLHZhcigtLWJnLTIpLCMxYzFjMzQpOwogICAgYm9yZGVyOjFweCBzb2xpZCAjMzQzNDVhOwogICAgYm9yZGVyLXJhZGl1czoxNnB4OwogICAgcGFkZGluZzoxNnB4IDEwcHggMTJweDsKICAgIHRleHQtYWxpZ246Y2VudGVyOwogICAgY3Vyc29yOnBvaW50ZXI7CiAgICB0cmFuc2l0aW9uOnRyYW5zZm9ybSAuMTVzIGVhc2UsIGJveC1zaGFkb3cgLjE1cyBlYXNlOwogICAgZGlzcGxheTpmbGV4O2ZsZXgtZGlyZWN0aW9uOmNvbHVtbjthbGlnbi1pdGVtczpjZW50ZXI7Z2FwOjZweDsKICB9CiAgLmNhdC1jYXJkOmFjdGl2ZXt0cmFuc2Zvcm06c2NhbGUoLjk1KTt9CiAgLmNhdC1jYXJkOmhvdmVye2JveC1zaGFkb3c6MCA2cHggMThweCByZ2JhKDAsMCwwLC4zNSk7Ym9yZGVyLWNvbG9yOnZhcigtLWFtYmVyKTt9CiAgLmNhdC1jYXJkIC5pY3tmb250LXNpemU6MzRweDt9CiAgLmNhdC1jYXJkIC5ubXtmb250LXNpemU6MTIuNXB4O2ZvbnQtd2VpZ2h0OjYwMDtsaW5lLWhlaWdodDoxLjI1O30KCiAgLnBpYy1jYXJkewogICAgcG9zaXRpb246cmVsYXRpdmU7Ym9yZGVyLXJhZGl1czoxNHB4O292ZXJmbG93OmhpZGRlbjtjdXJzb3I6cG9pbnRlcjsKICAgIGFzcGVjdC1yYXRpbzoxLzE7YmFja2dyb3VuZDojMTExO2JvcmRlcjoycHggc29saWQgIzM0MzQ1YTsKICB9CiAgLnBpYy1jYXJkIGltZ3t3aWR0aDoxMDAlO2hlaWdodDoxMDAlO29iamVjdC1maXQ6Y292ZXI7ZGlzcGxheTpibG9jazt9CiAgLnBpYy1jYXJkOmFjdGl2ZXt0cmFuc2Zvcm06c2NhbGUoLjk1KTt9CiAgLnBpYy1jYXJkIC5udW17cG9zaXRpb246YWJzb2x1dGU7dG9wOjZweDtsZWZ0OjZweDtiYWNrZ3JvdW5kOnJnYmEoMCwwLDAsLjU1KTtjb2xvcjojZmZmO2ZvbnQtc2l6ZToxMXB4O3BhZGRpbmc6MnB4IDZweDtib3JkZXItcmFkaXVzOjZweDt9CgogIC51cGxvYWQtY2FyZHsKICAgIGRpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47YWxpZ24taXRlbXM6Y2VudGVyO2p1c3RpZnktY29udGVudDpjZW50ZXI7Z2FwOjZweDsKICAgIGFzcGVjdC1yYXRpbzoxLzE7Ym9yZGVyLXJhZGl1czoxNHB4O2JvcmRlcjoycHggZGFzaGVkICM0YTRhNzI7Y29sb3I6dmFyKC0taW5rLWRpbSk7CiAgICBmb250LXNpemU6MTJweDt0ZXh0LWFsaWduOmNlbnRlcjtjdXJzb3I6cG9pbnRlcjtiYWNrZ3JvdW5kOnZhcigtLWJnLTIpOwogIH0KICAudXBsb2FkLWNhcmQgLmlje2ZvbnQtc2l6ZToyNnB4O30KCiAgLyogLS0tLS0tLS0tLSBkaWZmaWN1bHR5IC0tLS0tLS0tLS0gKi8KICAuZGlmZi1saXN0e2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47Z2FwOjEycHg7d2lkdGg6MTAwJTttYXgtd2lkdGg6NDIwcHg7fQogIC5kaWZmLWNhcmR7CiAgICBkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2p1c3RpZnktY29udGVudDpzcGFjZS1iZXR3ZWVuOwogICAgYmFja2dyb3VuZDpsaW5lYXItZ3JhZGllbnQoMTQ1ZGVnLHZhcigtLWJnLTIpLCMxYzFjMzQpO2JvcmRlcjoxcHggc29saWQgIzM0MzQ1YTsKICAgIGJvcmRlci1yYWRpdXM6MTRweDtwYWRkaW5nOjE0cHggMThweDtjdXJzb3I6cG9pbnRlcjsKICB9CiAgLmRpZmYtY2FyZDphY3RpdmV7dHJhbnNmb3JtOnNjYWxlKC45Nyk7fQogIC5kaWZmLWNhcmQgLmxibHtmb250LWZhbWlseTp2YXIoLS1mb250LWRpc3BsYXkpO2ZvbnQtc2l6ZToxN3B4O30KICAuZGlmZi1jYXJkIC5zdWJ7Zm9udC1zaXplOjExLjVweDtjb2xvcjp2YXIoLS1pbmstZGltKTttYXJnaW4tdG9wOjJweDt9CiAgLmRpZmYtY2FyZCAucGlsbHtiYWNrZ3JvdW5kOnZhcigtLXRlYWwpO2NvbG9yOiMwYzJiMjE7Zm9udC13ZWlnaHQ6NzAwO2ZvbnQtc2l6ZToxMnB4O3BhZGRpbmc6NnB4IDEwcHg7Ym9yZGVyLXJhZGl1czoyMHB4O30KCiAgLyogLS0tLS0tLS0tLSBnYW1lIHNjcmVlbiAtLS0tLS0tLS0tICovCiAgLmdhbWUtaGVhZGVyewogICAgd2lkdGg6MTAwJTtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoxMnB4OwogICAgYmFja2dyb3VuZDp2YXIoLS1iZy0yKTtib3JkZXI6MXB4IHNvbGlkICMzNDM0NWE7Ym9yZGVyLXJhZGl1czoxNnB4OwogICAgcGFkZGluZzoxMHB4IDEycHg7bWFyZ2luLWJvdHRvbToxNHB4OwogIH0KICAjdGh1bWItd3JhcHsKICAgIHdpZHRoOjcwcHg7aGVpZ2h0OjcwcHg7Ym9yZGVyLXJhZGl1czoxMHB4O292ZXJmbG93OmhpZGRlbjtmbGV4LXNocmluazowOwogICAgYm9yZGVyOjJweCBzb2xpZCB2YXIoLS1hbWJlcik7Ym94LXNoYWRvdzowIDAgMCAzcHggcmdiYSgyNTUsMTg0LDc2LC4xNSk7CiAgfQogICN0aHVtYi13cmFwIGltZ3t3aWR0aDoxMDAlO2hlaWdodDoxMDAlO29iamVjdC1maXQ6Y292ZXI7fQogIC5odWR7ZmxleDoxO2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47Z2FwOjRweDt9CiAgLmh1ZC1yb3d7ZGlzcGxheTpmbGV4O2p1c3RpZnktY29udGVudDpzcGFjZS1iZXR3ZWVuO2FsaWduLWl0ZW1zOmNlbnRlcjtmb250LXNpemU6MTNweDt9CiAgLmh1ZC1zdGF0e2NvbG9yOnZhcigtLWluay1kaW0pO30KICAuaHVkLXN0YXQgYntjb2xvcjp2YXIoLS1pbmspO2ZvbnQtZmFtaWx5OnZhcigtLWZvbnQtZGlzcGxheSk7fQogIC5odWQtYnRuc3tkaXNwbGF5OmZsZXg7Z2FwOjZweDt9CiAgLmljb24tYnRuewogICAgYmFja2dyb3VuZDp2YXIoLS1iZy0xKTtib3JkZXI6MXB4IHNvbGlkICMzYTNhNWM7Y29sb3I6dmFyKC0taW5rKTsKICAgIGJvcmRlci1yYWRpdXM6MTBweDt3aWR0aDozNnB4O2hlaWdodDozNnB4O2ZvbnQtc2l6ZToxNnB4O2N1cnNvcjpwb2ludGVyOwogICAgZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyOwogIH0KICAuaWNvbi1idG46YWN0aXZle3RyYW5zZm9ybTpzY2FsZSguOSk7fQoKICAuYm9hcmQtZnJhbWV7CiAgICB3aWR0aDptaW4oOTJ2dyw0ODBweCk7cGFkZGluZzoxMHB4O2JvcmRlci1yYWRpdXM6MjBweDsKICAgIGJhY2tncm91bmQ6bGluZWFyLWdyYWRpZW50KDE0NWRlZyx2YXIoLS13b29kLTEpLHZhcigtLXdvb2QtMikpOwogICAgYm94LXNoYWRvdzowIDEwcHggMzBweCByZ2JhKDAsMCwwLC40NSksIGluc2V0IDAgMCAwIDRweCByZ2JhKDAsMCwwLC4yNSk7CiAgICBwb3NpdGlvbjpyZWxhdGl2ZTsKICB9CiAgLmJvYXJkLWZyYW1lOjpiZWZvcmUsLmJvYXJkLWZyYW1lOjphZnRlciwuYm9hcmQtZnJhbWUgLmNvcm5lci1sLC5ib2FyZC1mcmFtZSAuY29ybmVyLXJ7CiAgICBjb250ZW50OicnO3Bvc2l0aW9uOmFic29sdXRlO3dpZHRoOjEwcHg7aGVpZ2h0OjEwcHg7Ym9yZGVyLXJhZGl1czo1MCU7CiAgICBiYWNrZ3JvdW5kOnJhZGlhbC1ncmFkaWVudChjaXJjbGUgYXQgMzUlIDM1JSwjZThjOThhLCM4YTZhM2EpOwogIH0KICAuYm9hcmQtZnJhbWU6OmJlZm9yZXt0b3A6NnB4O2xlZnQ6NnB4O30KICAuYm9hcmQtZnJhbWU6OmFmdGVye3RvcDo2cHg7cmlnaHQ6NnB4O30KICAuYm9hcmQtZnJhbWUgLmNvcm5lci1se2JvdHRvbTo2cHg7bGVmdDo2cHg7fQogIC5ib2FyZC1mcmFtZSAuY29ybmVyLXJ7Ym90dG9tOjZweDtyaWdodDo2cHg7fQoKICAjYm9hcmR7CiAgICBkaXNwbGF5OmdyaWQ7CiAgICBncmlkLXRlbXBsYXRlLWNvbHVtbnM6cmVwZWF0KHZhcigtLW4pLDFmcik7CiAgICBncmlkLXRlbXBsYXRlLXJvd3M6cmVwZWF0KHZhcigtLW4pLDFmcik7CiAgICBnYXA6MnB4OwogICAgYXNwZWN0LXJhdGlvOjEvMTsKICAgIHdpZHRoOjEwMCU7CiAgICBiYWNrZ3JvdW5kOiMwMDA7CiAgICBib3JkZXItcmFkaXVzOjEwcHg7CiAgICBvdmVyZmxvdzpoaWRkZW47CiAgfQogIC5jZWxsewogICAgYmFja2dyb3VuZC1yZXBlYXQ6bm8tcmVwZWF0OwogICAgY3Vyc29yOnBvaW50ZXI7CiAgICBib3gtc2hhZG93Omluc2V0IDAgMCAwIDFweCByZ2JhKDAsMCwwLC4yNSk7CiAgICB0cmFuc2l0aW9uOnRyYW5zZm9ybSAuMTJzIGVhc2UsIGJveC1zaGFkb3cgLjJzIGVhc2UsIGZpbHRlciAuMnMgZWFzZTsKICB9CiAgLmNlbGwuc2VsZWN0ZWR7b3V0bGluZTozcHggc29saWQgdmFyKC0tYW1iZXIpO291dGxpbmUtb2Zmc2V0Oi0zcHg7dHJhbnNmb3JtOnNjYWxlKC45NCk7ei1pbmRleDoyO2ZpbHRlcjpicmlnaHRuZXNzKDEuMSk7fQogIC5jZWxsLmNvcnJlY3R7Ym94LXNoYWRvdzppbnNldCAwIDAgMCAycHggdmFyKC0tdGVhbCk7fQogIC5jZWxsLmRyYWdnaW5ne29wYWNpdHk6LjM1O30KICAuY2VsbC5oaW50e291dGxpbmU6M3B4IHNvbGlkIHZhcigtLXBpbmspO291dGxpbmUtb2Zmc2V0Oi0zcHg7fQoKICAucGF1c2VkLW92ZXJsYXl7CiAgICBwb3NpdGlvbjpmaXhlZDtpbnNldDowO2JhY2tncm91bmQ6cmdiYSgxMCwxMCwyMCwuODUpO3otaW5kZXg6NDA7CiAgICBkaXNwbGF5OmZsZXg7ZmxleC1kaXJlY3Rpb246Y29sdW1uO2FsaWduLWl0ZW1zOmNlbnRlcjtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyO2dhcDoxNHB4OwogIH0KICAucGF1c2VkLW92ZXJsYXkgaDJ7Zm9udC1zaXplOjI4cHg7fQoKICAvKiAtLS0tLS0tLS0tIG1vZGFsIC0tLS0tLS0tLS0gKi8KICAubW9kYWwtYmd7CiAgICBwb3NpdGlvbjpmaXhlZDtpbnNldDowO2JhY2tncm91bmQ6cmdiYSg2LDYsMTYsLjcyKTt6LWluZGV4OjUwOwogICAgZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyO3BhZGRpbmc6MjBweDsKICB9CiAgLm1vZGFsewogICAgYmFja2dyb3VuZDpsaW5lYXItZ3JhZGllbnQoMTYwZGVnLCMyNjI2NGEsIzFhMWEzMCk7Ym9yZGVyOjFweCBzb2xpZCAjM2QzZDY2OwogICAgYm9yZGVyLXJhZGl1czoyMHB4O3BhZGRpbmc6MjZweCAyMnB4O21heC13aWR0aDozNjBweDt3aWR0aDoxMDAlO3RleHQtYWxpZ246Y2VudGVyOwogICAgYm94LXNoYWRvdzowIDIwcHggNjBweCByZ2JhKDAsMCwwLC41KTsKICB9CiAgLm1vZGFsIC5iaWctZW1vaml7Zm9udC1zaXplOjUycHg7bWFyZ2luLWJvdHRvbTo2cHg7fQogIC5tb2RhbCBoMntmb250LXNpemU6MjRweDttYXJnaW4tYm90dG9tOjZweDt9CiAgLm1vZGFsIHB7Y29sb3I6dmFyKC0taW5rLWRpbSk7Zm9udC1zaXplOjE0cHg7bWFyZ2luOjRweCAwIDE2cHg7fQogIC5zdGF0LXJvd3tkaXNwbGF5OmZsZXg7anVzdGlmeS1jb250ZW50OmNlbnRlcjtnYXA6MjJweDttYXJnaW4tYm90dG9tOjE4cHg7fQogIC5zdGF0LWJveHtiYWNrZ3JvdW5kOnZhcigtLWJnLTEpO2JvcmRlci1yYWRpdXM6MTJweDtwYWRkaW5nOjEwcHggMTZweDt9CiAgLnN0YXQtYm94IC5ue2ZvbnQtZmFtaWx5OnZhcigtLWZvbnQtZGlzcGxheSk7Zm9udC1zaXplOjIwcHg7Y29sb3I6dmFyKC0tdGVhbCk7fQogIC5zdGF0LWJveCAubHtmb250LXNpemU6MTFweDtjb2xvcjp2YXIoLS1pbmstZGltKTt9CiAgLm1vZGFsLWJ0bnN7ZGlzcGxheTpmbGV4O2ZsZXgtZGlyZWN0aW9uOmNvbHVtbjtnYXA6MTBweDt9CiAgLmJ0bnsKICAgIGJvcmRlcjpub25lO2JvcmRlci1yYWRpdXM6MTJweDtwYWRkaW5nOjEycHggMTZweDtmb250LXNpemU6MTQuNXB4O2ZvbnQtd2VpZ2h0OjcwMDsKICAgIGN1cnNvcjpwb2ludGVyO2ZvbnQtZmFtaWx5OnZhcigtLWZvbnQtZGlzcGxheSk7bGV0dGVyLXNwYWNpbmc6LjNweDsKICB9CiAgLmJ0bi1wcmltYXJ5e2JhY2tncm91bmQ6bGluZWFyLWdyYWRpZW50KDkwZGVnLHZhcigtLWFtYmVyKSwjZmY5ZDVjKTtjb2xvcjojM2ExZTAwO30KICAuYnRuLXNlY29uZGFyeXtiYWNrZ3JvdW5kOnZhcigtLWJnLTEpO2NvbG9yOnZhcigtLWluayk7Ym9yZGVyOjFweCBzb2xpZCAjM2QzZDY2O30KICAuYnRuOmFjdGl2ZXt0cmFuc2Zvcm06c2NhbGUoLjk2KTt9CgogIC5jb25mZXR0aS1sYXllcntwb3NpdGlvbjpmaXhlZDtpbnNldDowO3BvaW50ZXItZXZlbnRzOm5vbmU7ei1pbmRleDo2MDtvdmVyZmxvdzpoaWRkZW47fQogIC5jb25mZXR0aXtwb3NpdGlvbjphYnNvbHV0ZTt0b3A6LTEwcHg7d2lkdGg6OHB4O2hlaWdodDoxNHB4O29wYWNpdHk6Ljk7YW5pbWF0aW9uOmZhbGwgbGluZWFyIGZvcndhcmRzO30KICBAa2V5ZnJhbWVzIGZhbGx7dG97dHJhbnNmb3JtOnRyYW5zbGF0ZVkoMTEwdmgpIHJvdGF0ZSg1NDBkZWcpO29wYWNpdHk6MDt9fQoKICAuYmVzdC1iYWRnZXttYXJnaW4tdG9wOjJweDtmb250LXNpemU6MTEuNXB4O2NvbG9yOnZhcigtLWFtYmVyKTt9CiAgLmZvb3Rlci1ub3Rle21hcmdpbi10b3A6MjZweDtjb2xvcjp2YXIoLS1pbmstZGltKTtmb250LXNpemU6MTFweDt0ZXh0LWFsaWduOmNlbnRlcjtsaW5lLWhlaWdodDoxLjY7fQo8L3N0eWxlPgo8L2hlYWQ+Cjxib2R5Pgo8ZGl2IGlkPSJhcHAiPgoKICA8IS0tIEhPTUUgLyBDQVRFR09SWSBTRUxFQ1QgLS0+CiAgPGRpdiBjbGFzcz0ic2NyZWVuIGFjdGl2ZSIgaWQ9InNjcmVlbi1ob21lIj4KICAgIDxkaXYgY2xhc3M9InRvcGJhciI+CiAgICAgIDxoMT7wn6epIFBpY3R1cmUgUHV6emxlPC9oMT4KICAgICAgPGJ1dHRvbiBjbGFzcz0iaWNvbi1idG4iIGlkPSJidG4tbXV0ZS1ob21lIiB0aXRsZT0iU291bmQiPvCflIo8L2J1dHRvbj4KICAgIDwvZGl2PgogICAgPGRpdiBjbGFzcz0ic3VidGl0bGUiPlBpY2sgYSBjYXRlZ29yeSwgY2hvb3NlIGEgcGljdHVyZSwgdGhlbiByZWJ1aWxkIGl0IHBpZWNlIGJ5IHBpZWNlLjwvZGl2PgogICAgPGRpdiBjbGFzcz0iZ3JpZC1jYXJkcyIgaWQ9ImNhdGVnb3J5LWdyaWQiPjwvZGl2PgogICAgPGRpdiBjbGFzcz0iZm9vdGVyLW5vdGUiPkFydHdvcmsgaXMgZ2VuZXJhdGVkIG9uLWRldmljZSBwZXIgY2F0ZWdvcnkuPGJyPldhbnQgYSByZWFsIHBob3RvIGluc3RlYWQ/IENob29zZSBhbnkgY2F0ZWdvcnksIHRoZW4gdGFwICJVcGxvYWQgeW91ciBvd24iLjwvZGl2PgogIDwvZGl2PgoKICA8IS0tIFBJQ1RVUkUgU0VMRUNUIC0tPgogIDxkaXYgY2xhc3M9InNjcmVlbiIgaWQ9InNjcmVlbi1waWN0dXJlcyI+CiAgICA8ZGl2IGNsYXNzPSJ0b3BiYXIiPgogICAgICA8YnV0dG9uIGNsYXNzPSJiYWNrYnRuIiBkYXRhLWdvPSJzY3JlZW4taG9tZSI+4oaQIEJhY2s8L2J1dHRvbj4KICAgICAgPGgxIGlkPSJwaWMtY2F0LXRpdGxlIiBzdHlsZT0iZm9udC1zaXplOjE4cHg7Ij48L2gxPgogICAgICA8c3BhbiBzdHlsZT0id2lkdGg6NzBweDsiPjwvc3Bhbj4KICAgIDwvZGl2PgogICAgPGRpdiBjbGFzcz0ic3VidGl0bGUiPkNob29zZSB0aGUgcGljdHVyZSB5b3Ugd2FudCB0byBzb2x2ZS48L2Rpdj4KICAgIDxkaXYgY2xhc3M9ImdyaWQtY2FyZHMiIGlkPSJwaWN0dXJlLWdyaWQiPjwvZGl2PgogIDwvZGl2PgoKICA8IS0tIERJRkZJQ1VMVFkgU0VMRUNUIC0tPgogIDxkaXYgY2xhc3M9InNjcmVlbiIgaWQ9InNjcmVlbi1kaWZmaWN1bHR5Ij4KICAgIDxkaXYgY2xhc3M9InRvcGJhciI+CiAgICAgIDxidXR0b24gY2xhc3M9ImJhY2tidG4iIGRhdGEtZ289InNjcmVlbi1waWN0dXJlcyI+4oaQIEJhY2s8L2J1dHRvbj4KICAgICAgPGgxIHN0eWxlPSJmb250LXNpemU6MThweDsiPkNob29zZSBkaWZmaWN1bHR5PC9oMT4KICAgICAgPHNwYW4gc3R5bGU9IndpZHRoOjcwcHg7Ij48L3NwYW4+CiAgICA8L2Rpdj4KICAgIDxkaXYgaWQ9InRodW1iLXdyYXAiIHN0eWxlPSJ3aWR0aDoxMjBweDtoZWlnaHQ6MTIwcHg7bWFyZ2luLWJvdHRvbToxOHB4OyI+CiAgICAgIDxpbWcgaWQ9ImRpZmYtcHJldmlldyIgc3JjPSIiIGFsdD0icHJldmlldyI+CiAgICA8L2Rpdj4KICAgIDxkaXYgY2xhc3M9ImRpZmYtbGlzdCIgaWQ9ImRpZmZpY3VsdHktbGlzdCI+PC9kaXY+CiAgPC9kaXY+CgogIDwhLS0gR0FNRSAtLT4KICA8ZGl2IGNsYXNzPSJzY3JlZW4iIGlkPSJzY3JlZW4tZ2FtZSI+CiAgICA8ZGl2IGNsYXNzPSJnYW1lLWhlYWRlciI+CiAgICAgIDxkaXYgaWQ9InRodW1iLXdyYXAiPjxpbWcgaWQ9InRodW1iIiBzcmM9IiIgYWx0PSJyZWZlcmVuY2UiPjwvZGl2PgogICAgICA8ZGl2IGNsYXNzPSJodWQiPgogICAgICAgIDxkaXYgY2xhc3M9Imh1ZC1yb3ciPjxzcGFuIGNsYXNzPSJodWQtc3RhdCI+4o+xIDxiIGlkPSJodWQtdGltZSI+MDA6MDA8L2I+PC9zcGFuPjxzcGFuIGNsYXNzPSJodWQtc3RhdCI+TW92ZXMgPGIgaWQ9Imh1ZC1tb3ZlcyI+MDwvYj48L3NwYW4+PC9kaXY+CiAgICAgICAgPGRpdiBjbGFzcz0iaHVkLXJvdyI+CiAgICAgICAgICA8c3BhbiBjbGFzcz0iaHVkLXN0YXQiIGlkPSJodWQtZGlmZi1sYWJlbCI+RWFzeSDCtyAzw5czPC9zcGFuPgogICAgICAgICAgPGRpdiBjbGFzcz0iaHVkLWJ0bnMiPgogICAgICAgICAgICA8YnV0dG9uIGNsYXNzPSJpY29uLWJ0biIgaWQ9ImJ0bi1oaW50IiB0aXRsZT0iSGludCI+8J+SoTwvYnV0dG9uPgogICAgICAgICAgICA8YnV0dG9uIGNsYXNzPSJpY29uLWJ0biIgaWQ9ImJ0bi1wYXVzZSIgdGl0bGU9IlBhdXNlIj7ij7g8L2J1dHRvbj4KICAgICAgICAgICAgPGJ1dHRvbiBjbGFzcz0iaWNvbi1idG4iIGlkPSJidG4tbXV0ZS1nYW1lIiB0aXRsZT0iU291bmQiPvCflIo8L2J1dHRvbj4KICAgICAgICAgIDwvZGl2PgogICAgICAgIDwvZGl2PgogICAgICA8L2Rpdj4KICAgIDwvZGl2PgogICAgPGRpdiBjbGFzcz0iYm9hcmQtZnJhbWUiPjxzcGFuIGNsYXNzPSJjb3JuZXItbCI+PC9zcGFuPjxzcGFuIGNsYXNzPSJjb3JuZXItciI+PC9zcGFuPgogICAgICA8ZGl2IGlkPSJib2FyZCI+PC9kaXY+CiAgICA8L2Rpdj4KICAgIDxkaXYgY2xhc3M9ImZvb3Rlci1ub3RlIj5UYXAgYSBwaWVjZSwgdGhlbiB0YXAgYW5vdGhlciB0byBzd2FwIHRoZW0uIE9uIGRlc2t0b3AgeW91IGNhbiBhbHNvIGRyYWcgcGllY2VzLjwvZGl2PgogIDwvZGl2PgoKPC9kaXY+Cgo8c2NyaXB0PgooZnVuY3Rpb24oKXsKInVzZSBzdHJpY3QiOwoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIDEuIENBVEVHT1JZIERBVEEgKyBQUk9DRURVUkFMIEFSVFdPUksgR0VORVJBVElPTgogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KY29uc3QgQ0FURUdPUklFUyA9IFsKICB7IGtleTona2lkcycsICAgICBuYW1lOidLaWRzICYgQ2FydG9vbnMnLCAgICAgICBpY29uOifwn4+wJyB9LAogIHsga2V5OidhbmltYWxzJywgIG5hbWU6J0FuaW1hbHMgJiBQZXRzJywgICAgICAgIGljb246J/CfpoEnIH0sCiAgeyBrZXk6J3ZlaGljbGVzJywgbmFtZTonVmVoaWNsZXMgJiBUb3lzJywgICAgICAgaWNvbjon8J+agCcgfSwKICB7IGtleTonbmF0dXJlJywgICBuYW1lOidOYXR1cmUgJiBMYW5kc2NhcGVzJywgICBpY29uOifwn4+U77iPJyB9LAogIHsga2V5OidvY2VhbicsICAgIG5hbWU6J1VuZGVyd2F0ZXIgTGlmZScsICAgICAgIGljb246J/CfkKAnIH0sCiAgeyBrZXk6J2xhbmRtYXJrJywgbmFtZTonSGlzdG9yaWNhbCBMYW5kbWFya3MnLCAgaWNvbjon8J+VjCcgfSwKICB7IGtleTonY2l0eScsICAgICBuYW1lOidNb2Rlcm4gQ2l0eXNjYXBlcycsICAgICBpY29uOifwn4yGJyB9LAogIHsga2V5OidhcnQnLCAgICAgIG5hbWU6J0FydCAmIFBhaW50aW5ncycsICAgICAgIGljb246J/CfjqgnIH0sCiAgeyBrZXk6J2Zvb2QnLCAgICAgbmFtZTonRm9vZCAmIExpZmVzdHlsZScsICAgICAgaWNvbjon8J+NlScgfSwKICB7IGtleTonY3VsdHVyZScsICBuYW1lOidDdWx0dXJhbCAmIExvY2FsJywgICAgICBpY29uOifwn6qFJyB9LApdOwpjb25zdCBQSUNTX1BFUl9DQVRFR09SWSA9IDEwOwpjb25zdCBJTUdfU0laRSA9IDY0MDsKCmZ1bmN0aW9uIG11bGJlcnJ5MzIoYSl7CiAgcmV0dXJuIGZ1bmN0aW9uKCl7CiAgICBhIHw9IDA7IGEgPSBhICsgMHg2RDJCNzlGNSB8IDA7CiAgICBsZXQgdCA9IE1hdGguaW11bChhIF4gYSA+Pj4gMTUsIDEgfCBhKTsKICAgIHQgPSB0ICsgTWF0aC5pbXVsKHQgXiB0ID4+PiA3LCA2MSB8IHQpIF4gdDsKICAgIHJldHVybiAoKHQgXiB0ID4+PiAxNCkgPj4+IDApIC8gNDI5NDk2NzI5NjsKICB9Owp9CmZ1bmN0aW9uIHJyKHJuZyxtaW4sbWF4KXsgcmV0dXJuIG1pbiArIHJuZygpKihtYXgtbWluKTsgfQpmdW5jdGlvbiBoc2woaCxzLGwpeyByZXR1cm4gYGhzbCgkeygoaCUzNjApKzM2MCklMzYwfSwke3N9JSwke2x9JSlgOyB9CgpmdW5jdGlvbiBmaWxsQmcoY3R4LHNpemUsYzEsYzIsdmVydGljYWwpewogIGNvbnN0IGcgPSB2ZXJ0aWNhbCA/IGN0eC5jcmVhdGVMaW5lYXJHcmFkaWVudCgwLDAsMCxzaXplKSA6IGN0eC5jcmVhdGVMaW5lYXJHcmFkaWVudCgwLDAsc2l6ZSwwKTsKICBnLmFkZENvbG9yU3RvcCgwLGMxKTsgZy5hZGRDb2xvclN0b3AoMSxjMik7CiAgY3R4LmZpbGxTdHlsZT1nOyBjdHguZmlsbFJlY3QoMCwwLHNpemUsc2l6ZSk7Cn0KZnVuY3Rpb24gY2lyYyhjdHgseCx5LHIsY29sb3IpeyBjdHguYmVnaW5QYXRoKCk7IGN0eC5hcmMoeCx5LHIsMCxNYXRoLlBJKjIpOyBjdHguZmlsbFN0eWxlPWNvbG9yOyBjdHguZmlsbCgpOyB9CmZ1bmN0aW9uIHRyaShjdHgscHRzLGNvbG9yKXsgY3R4LmJlZ2luUGF0aCgpOyBjdHgubW92ZVRvKHB0c1swXVswXSxwdHNbMF1bMV0pOyBmb3IobGV0IGk9MTtpPHB0cy5sZW5ndGg7aSsrKSBjdHgubGluZVRvKHB0c1tpXVswXSxwdHNbaV1bMV0pOyBjdHguY2xvc2VQYXRoKCk7IGN0eC5maWxsU3R5bGU9Y29sb3I7IGN0eC5maWxsKCk7IH0KZnVuY3Rpb24gcnJlY3QoY3R4LHgseSx3LGgscixjb2xvcil7CiAgY3R4LmJlZ2luUGF0aCgpOwogIGN0eC5tb3ZlVG8oeCtyLHkpOwogIGN0eC5hcmNUbyh4K3cseSx4K3cseStoLHIpOwogIGN0eC5hcmNUbyh4K3cseStoLHgseStoLHIpOwogIGN0eC5hcmNUbyh4LHkraCx4LHkscik7CiAgY3R4LmFyY1RvKHgseSx4K3cseSxyKTsKICBjdHguY2xvc2VQYXRoKCk7IGN0eC5maWxsU3R5bGU9Y29sb3I7IGN0eC5maWxsKCk7Cn0KCmNvbnN0IERSQVcgPSB7CiAga2lkcyhjdHgsUyxybmcpewogICAgY29uc3QgaDE9cnIocm5nLDE4MCwzMjApOwogICAgZmlsbEJnKGN0eCxTLGhzbChoMSw3MCw4OCksaHNsKGgxKzMwLDcwLDc4KSx0cnVlKTsKICAgIGZvcihsZXQgaT0wO2k8NDtpKyspeyBjb25zdCBjeD1ycihybmcsMCxTKSwgY3k9cnIocm5nLFMqMC4wNSxTKjAuMjgpLCByPXJyKHJuZywyMCw0MCk7CiAgICAgIGNpcmMoY3R4LGN4LGN5LHIsJ3JnYmEoMjU1LDI1NSwyNTUsLjg1KScpOyBjaXJjKGN0eCxjeCtyKjAuOCxjeSs0LHIqMC43LCdyZ2JhKDI1NSwyNTUsMjU1LC44NSknKTsgY2lyYyhjdHgsY3gtciowLjgsY3krNixyKjAuNiwncmdiYSgyNTUsMjU1LDI1NSwuODUpJyk7IH0KICAgIGNpcmMoY3R4LFMqMC44MixTKjAuMTYsUyowLjA3LGhzbCg1MCw5NSw3MCkpOwogICAgY29uc3QgZ3JvdW5kWT1TKjAuNzI7CiAgICBycmVjdChjdHgsMCxncm91bmRZLFMsUy1ncm91bmRZLDAsaHNsKDEyMCw0NSw1NSkpOwogICAgY29uc3QgYmFzZVg9UyowLjUsIGJhc2VXPVMqMC40LCBiYXNlWT1ncm91bmRZLVMqMC4yODsKICAgIHJyZWN0KGN0eCxiYXNlWC1iYXNlVy8yLGJhc2VZLGJhc2VXLFMqMC4yOCw2LGhzbCgzNDAsNjAsNzIpKTsKICAgIGNvbnN0IHRvd2Vycz1bWy0xLC0wLjU1XSxbMSwtMC41NV0sWzAsLTAuNzJdXTsKICAgIHRvd2Vycy5mb3JFYWNoKChbZHgsZHlmXSxpKT0+ewogICAgICBjb25zdCB0dz1TKjAuMTEsIHR4PWJhc2VYK2R4KmJhc2VXKjAuNDItdHcvMiwgdHk9YmFzZVkrZHlmKlMqMC4xODsKICAgICAgY29uc3QgY29sPWhzbChycihybmcsMCwzNjApLDcwLDc1KTsKICAgICAgcnJlY3QoY3R4LHR4LHR5LHR3LGJhc2VZLXR5KzEwLDQsY29sKTsKICAgICAgdHJpKGN0eCxbW3R4LTQsdHldLFt0eCt0dys0LHR5XSxbdHgrdHcvMix0eS10dyowLjldXSxoc2wocnIocm5nLDAsMzYwKSw3NSw1NSkpOwogICAgICB0cmkoY3R4LFtbYmFzZVgrZHgqYmFzZVcqMC40Mi0yLHR5LXR3KjAuOS0yXSxbYmFzZVgrZHgqYmFzZVcqMC40MisxNix0eS10dyowLjktMjJdLFtiYXNlWCtkeCpiYXNlVyowLjQyKzE2LHR5LXR3KjAuOS0yXV0saHNsKDAsNzAsNjApKTsKICAgIH0pOwogICAgZm9yKGxldCBpPTA7aTwxMDtpKyspeyBjb25zdCB4PXJyKHJuZywwLFMpLCB5PXJyKHJuZywwLFMqMC41KTsKICAgICAgY3R4LmZpbGxTdHlsZT1oc2woNTAsOTAsODApOyBjdHguZm9udD1gJHtycihybmcsMTAsMTgpfXB4IHNhbnMtc2VyaWZgOyBjdHguZmlsbFRleHQoJ+KcpicseCx5KTsgfQogIH0sCiAgYW5pbWFscyhjdHgsUyxybmcpewogICAgY29uc3QgaDE9cnIocm5nLDI1LDU1KTsKICAgIGZpbGxCZyhjdHgsUyxoc2woaDEsODAsODApLGhzbChoMS0xMCw3MCw2MCksdHJ1ZSk7CiAgICBjaXJjKGN0eCxTKjAuNzgsUyowLjE4LFMqMC4wOSxoc2woNDgsOTAsNjgpKTsKICAgIHJyZWN0KGN0eCwwLFMqMC42NixTLFMqMC4zNCwwLGhzbCg5NSw0NSw0NSkpOwogICAgZm9yKGxldCBpPTA7aTw0MDtpKyspeyBjb25zdCB4PXJyKHJuZywwLFMpLCB5PXJyKHJuZyxTKjAuNjgsUyowLjk4KTsKICAgICAgY3R4LnN0cm9rZVN0eWxlPWhzbCg5NSw0MCxycihybmcsMjUsNDApKTsgY3R4LmxpbmVXaWR0aD0yOyBjdHguYmVnaW5QYXRoKCk7IGN0eC5tb3ZlVG8oeCx5KTsgY3R4LmxpbmVUbyh4K3JyKHJuZywtNCw0KSx5LXJyKHJuZyw4LDE2KSk7IGN0eC5zdHJva2UoKTsgfQogICAgY29uc3Qga2luZD1NYXRoLmZsb29yKHJuZygpKjMpOwogICAgY29uc3QgY3g9UyowLjQ1LCBjeT1TKjAuNTU7CiAgICBjb25zdCBib2R5Q29sPWhzbChycihybmcsMjAsNDUpLDU1LHJyKHJuZyw0NSw2MCkpOwogICAgaWYoa2luZD09PTApeyAvLyBsaW9uCiAgICAgIGZvcihsZXQgaT0wO2k8MTY7aSsrKXsgY29uc3QgYT0oaS8xNikqTWF0aC5QSSoyOyBjaXJjKGN0eCxjeCtNYXRoLmNvcyhhKSpTKjAuMTYsY3krTWF0aC5zaW4oYSkqUyowLjE2LFMqMC4wNixoc2woMzAsNzAsNDIpKTsgfQogICAgICBjaXJjKGN0eCxjeCxjeSxTKjAuMTQsaHNsKDQwLDcwLDY4KSk7CiAgICAgIGNpcmMoY3R4LGN4LVMqMC4wNSxjeS1TKjAuMDIsUyowLjAxOCwnIzJiMWExMCcpOyBjaXJjKGN0eCxjeCtTKjAuMDUsY3ktUyowLjAyLFMqMC4wMTgsJyMyYjFhMTAnKTsKICAgICAgdHJpKGN0eCxbW2N4LTYsY3krUyowLjAzXSxbY3grNixjeStTKjAuMDNdLFtjeCxjeStTKjAuMDZdXSwnIzJiMWExMCcpOwogICAgfSBlbHNlIGlmKGtpbmQ9PT0xKXsgLy8gY2F0L2RvZyBmYWNlCiAgICAgIGNpcmMoY3R4LGN4LGN5LFMqMC4xNSxib2R5Q29sKTsKICAgICAgdHJpKGN0eCxbW2N4LVMqMC4xNCxjeS1TKjAuMTJdLFtjeC1TKjAuMDIsY3ktUyowLjEyXSxbY3gtUyowLjA5LGN5LVMqMC4yNF1dLGJvZHlDb2wpOwogICAgICB0cmkoY3R4LFtbY3grUyowLjE0LGN5LVMqMC4xMl0sW2N4K1MqMC4wMixjeS1TKjAuMTJdLFtjeCtTKjAuMDksY3ktUyowLjI0XV0sYm9keUNvbCk7CiAgICAgIGNpcmMoY3R4LGN4LVMqMC4wNSxjeS1TKjAuMDEsUyowLjAxNiwnIzJiMWExMCcpOyBjaXJjKGN0eCxjeCtTKjAuMDUsY3ktUyowLjAxLFMqMC4wMTYsJyMyYjFhMTAnKTsKICAgIH0gZWxzZSB7IC8vIGJpcmQKICAgICAgY2lyYyhjdHgsY3gsY3ksUyowLjExLGJvZHlDb2wpOwogICAgICBjaXJjKGN0eCxjeCtTKjAuMDksY3ktUyowLjA2LFMqMC4wNixib2R5Q29sKTsKICAgICAgdHJpKGN0eCxbW2N4K1MqMC4xNCxjeS1TKjAuMDZdLFtjeCtTKjAuMjIsY3ktUyowLjAzXSxbY3grUyowLjE0LGN5LVMqMC4wMV1dLGhzbCg0MCw5MCw1NSkpOwogICAgICB0cmkoY3R4LFtbY3gtUyowLjAyLGN5XSxbY3gtUyowLjIsY3krUyowLjA1XSxbY3gtUyowLjAyLGN5K1MqMC4wOF1dLGhzbChoMSsxMjAsNjAsNDUpKTsKICAgIH0KICB9LAogIHZlaGljbGVzKGN0eCxTLHJuZyl7CiAgICBmaWxsQmcoY3R4LFMsaHNsKDIwNSw3MCw3NSksaHNsKDIwNSw1MCw5MCksdHJ1ZSk7CiAgICBjaXJjKGN0eCxTKjAuMTUsUyowLjE1LFMqMC4wOCxoc2woNDgsOTAsNzApKTsKICAgIHJyZWN0KGN0eCwwLFMqMC43LFMsUyowLjMsMCxoc2woMCwwLDMyKSk7CiAgICBjdHguc3Ryb2tlU3R5bGU9JyNmNWQ5N2EnOyBjdHgubGluZVdpZHRoPTY7IGN0eC5zZXRMaW5lRGFzaChbMjYsMjBdKTsKICAgIGN0eC5iZWdpblBhdGgoKTsgY3R4Lm1vdmVUbygwLFMqMC44NSk7IGN0eC5saW5lVG8oUyxTKjAuODUpOyBjdHguc3Ryb2tlKCk7IGN0eC5zZXRMaW5lRGFzaChbXSk7CiAgICBjb25zdCBjb2w9aHNsKHJyKHJuZywwLDM2MCksNzUsNTUpOwogICAgaWYocm5nKCk8MC41KXsgLy8gY2FyCiAgICAgIGNvbnN0IHk9UyowLjYyOwogICAgICBycmVjdChjdHgsUyowLjE1LHksUyowLjcsUyowLjE0LDE0LGNvbCk7CiAgICAgIHJyZWN0KGN0eCxTKjAuMjgseS1TKjAuMTEsUyowLjQ0LFMqMC4xMywxMCxjb2wpOwogICAgICBycmVjdChjdHgsUyowLjMyLHktUyowLjA5LFMqMC4xNixTKjAuMDksNCxoc2woMjAwLDcwLDg4KSk7CiAgICAgIHJyZWN0KGN0eCxTKjAuNTIseS1TKjAuMDksUyowLjE2LFMqMC4wOSw0LGhzbCgyMDAsNzAsODgpKTsKICAgICAgY2lyYyhjdHgsUyowLjI4LHkrUyowLjE1LFMqMC4wNywnIzIyMicpOyBjaXJjKGN0eCxTKjAuNzIseStTKjAuMTUsUyowLjA3LCcjMjIyJyk7CiAgICAgIGNpcmMoY3R4LFMqMC4yOCx5K1MqMC4xNSxTKjAuMDMsJyM5OTknKTsgY2lyYyhjdHgsUyowLjcyLHkrUyowLjE1LFMqMC4wMywnIzk5OScpOwogICAgfSBlbHNlIHsgLy8gcm9ja2V0CiAgICAgIGNvbnN0IGN4PVMqMC41OwogICAgICB0cmkoY3R4LFtbY3gsUyowLjE4XSxbY3gtUyowLjA5LFMqMC40Ml0sW2N4K1MqMC4wOSxTKjAuNDJdXSxjb2wpOwogICAgICBycmVjdChjdHgsY3gtUyowLjA5LFMqMC40MixTKjAuMTgsUyowLjI4LDgsaHNsKDAsMCw4OCkpOwogICAgICB0cmkoY3R4LFtbY3gtUyowLjA5LFMqMC42XSxbY3gtUyowLjIsUyowLjcyXSxbY3gtUyowLjA5LFMqMC43XV0sY29sKTsKICAgICAgdHJpKGN0eCxbW2N4K1MqMC4wOSxTKjAuNl0sW2N4K1MqMC4yLFMqMC43Ml0sW2N4K1MqMC4wOSxTKjAuN11dLGNvbCk7CiAgICAgIGNpcmMoY3R4LGN4LFMqMC41LFMqMC4wMzUsaHNsKDIwNSw4MCw2MCkpOwogICAgICB0cmkoY3R4LFtbY3gtUyowLjA1LFMqMC43XSxbY3grUyowLjA1LFMqMC43XSxbY3gsUyowLjhdXSxoc2woMjQsOTAsNjApKTsKICAgIH0KICB9LAogIG5hdHVyZShjdHgsUyxybmcpewogICAgY29uc3QgaDE9cnIocm5nLDIwLDQ1KTsKICAgIGZpbGxCZyhjdHgsUyxoc2woaDEsODUsNzIpLGhzbChoMSs2MCw2MCw0NSksdHJ1ZSk7CiAgICBjaXJjKGN0eCxTKjAuNSxTKjAuNDIsUyowLjA5LGhzbCg0NSw5NSw3NSkpOwogICAgY29uc3QgbGF5ZXJzPTM7CiAgICBmb3IobGV0IGw9MDtsPGxheWVycztsKyspewogICAgICBjb25zdCBiYXNlWT1TKigwLjUrbCowLjE0KSwgYW1wPVMqMC4xLCBjb2w9aHNsKGgxKzkwLDI1LDI1LWwqNCk7CiAgICAgIGN0eC5iZWdpblBhdGgoKTsgY3R4Lm1vdmVUbygwLFMpOwogICAgICBsZXQgeD0wOwogICAgICB3aGlsZSh4PD1TKXsgY3R4LmxpbmVUbyh4LGJhc2VZIC0gTWF0aC5hYnMoTWF0aC5zaW4oeCowLjAyK2wpKSphbXAqcm5nKCkpOyB4Kz1TLzg7IH0KICAgICAgY3R4LmxpbmVUbyhTLFMpOyBjdHguY2xvc2VQYXRoKCk7IGN0eC5maWxsU3R5bGU9Y29sOyBjdHguZmlsbCgpOwogICAgfQogICAgcnJlY3QoY3R4LDAsUyowLjgsUyxTKjAuMiwwLGhzbChoMSsxODAsNDAsMzUpKTsKICAgIGN0eC5zdHJva2VTdHlsZT0ncmdiYSgyNTUsMjU1LDI1NSwuMjUpJzsgY3R4LmxpbmVXaWR0aD0yOwogICAgZm9yKGxldCBpPTA7aTw1O2krKyl7IGNvbnN0IHk9UyowLjgyK2kqODsgY3R4LmJlZ2luUGF0aCgpOyBjdHgubW92ZVRvKDAseSk7IGN0eC5saW5lVG8oUyx5K3JyKHJuZywtNCw0KSk7IGN0eC5zdHJva2UoKTsgfQogIH0sCiAgb2NlYW4oY3R4LFMscm5nKXsKICAgIGZpbGxCZyhjdHgsUyxoc2woMTk4LDgwLDYwKSxoc2woMjEwLDgwLDIwKSx0cnVlKTsKICAgIGZvcihsZXQgaT0wO2k8MTg7aSsrKXsgY2lyYyhjdHgscnIocm5nLDAsUykscnIocm5nLDAsUykscnIocm5nLDMsMTApLCdyZ2JhKDI1NSwyNTUsMjU1LC4zNSknKTsgfQogICAgcnJlY3QoY3R4LDAsUyowLjgyLFMsUyowLjE4LDAsaHNsKDM4LDQ1LDU1KSk7CiAgICBmb3IobGV0IGk9MDtpPDY7aSsrKXsgY29uc3QgeD1ycihybmcsUyowLjA1LFMqMC45NSksIHk9UyowLjgyOwogICAgICBjb25zdCBjb2w9aHNsKHJyKHJuZywwLDM2MCksNzAsNjApOwogICAgICBjdHguc3Ryb2tlU3R5bGU9Y29sOyBjdHgubGluZVdpZHRoPTY7CiAgICAgIGN0eC5iZWdpblBhdGgoKTsgY3R4Lm1vdmVUbyh4LHkpOyBjdHgucXVhZHJhdGljQ3VydmVUbyh4KzE0LHktMzAseCx5LTU1KTsgY3R4LnN0cm9rZSgpOwogICAgfQogICAgY29uc3QgY3g9UyowLjUsY3k9UyowLjQyLCBjb2w9aHNsKHJyKHJuZywwLDYwKSw4NSw1NSk7CiAgICBjdHguc2F2ZSgpOyBjdHgudHJhbnNsYXRlKGN4LGN5KTsKICAgIGN0eC5iZWdpblBhdGgoKTsgY3R4LmVsbGlwc2UoMCwwLFMqMC4xMyxTKjAuMDgsMCwwLE1hdGguUEkqMik7IGN0eC5maWxsU3R5bGU9Y29sOyBjdHguZmlsbCgpOwogICAgdHJpKGN0eCxbWy1TKjAuMTMsMF0sWy1TKjAuMiwtUyowLjA2XSxbLVMqMC4yLFMqMC4wNl1dLGNvbCk7CiAgICBjaXJjKGN0eCxTKjAuMDYsLVMqMC4wMixTKjAuMDEyLCcjMjIyJyk7CiAgICBjdHgucmVzdG9yZSgpOwogIH0sCiAgbGFuZG1hcmsoY3R4LFMscm5nKXsKICAgIGNvbnN0IGgxPXJyKHJuZywyMCw0MCk7CiAgICBmaWxsQmcoY3R4LFMsaHNsKGgxLDgwLDcwKSxoc2woaDErMjcwLDQwLDMwKSx0cnVlKTsKICAgIGNpcmMoY3R4LFMqMC43NSxTKjAuMyxTKjAuMDgsaHNsKDQ1LDkwLDcyKSk7CiAgICBycmVjdChjdHgsMCxTKjAuNzgsUyxTKjAuMjIsMCxoc2woMzgsMzUsNDUpKTsKICAgIGNvbnN0IGtpbmQ9TWF0aC5mbG9vcihybmcoKSozKTsKICAgIGNvbnN0IGNvbD0ncmdiYSgyMCwxNSwxMCwuODIpJzsKICAgIGlmKGtpbmQ9PT0wKXsgdHJpKGN0eCxbW1MqMC41LFMqMC4yOF0sW1MqMC4yMixTKjAuNzhdLFtTKjAuNzgsUyowLjc4XV0sY29sKTsgfQogICAgZWxzZSBpZihraW5kPT09MSl7IHJyZWN0KGN0eCxTKjAuMzUsUyowLjQ1LFMqMC4zLFMqMC4zMyw0LGNvbCk7IGN0eC5iZWdpblBhdGgoKTsgY3R4LmVsbGlwc2UoUyowLjUsUyowLjQyLFMqMC4xNixTKjAuMTQsMCxNYXRoLlBJLDApOyBjdHguZmlsbFN0eWxlPWNvbDsgY3R4LmZpbGwoKTsgfQogICAgZWxzZSB7IHJyZWN0KGN0eCxTKjAuNDQsUyowLjM1LFMqMC4xMixTKjAuNDMsNCxjb2wpOyB0cmkoY3R4LFtbUyowLjQ0LFMqMC4zNV0sW1MqMC41NixTKjAuMzVdLFtTKjAuNSxTKjAuMl1dLGNvbCk7IH0KICAgIGZvcihsZXQgaT0wO2k8NjtpKyspeyBjaXJjKGN0eCxTKigwLjQraSowLjA0KSxTKjAuNjgsUyowLjAxMiwncmdiYSgyNTUsMjIwLDE1MCwuNyknKTsgfQogICAgZm9yKGxldCBpPTA7aTwyMDtpKyspeyBjaXJjKGN0eCxycihybmcsMCxTKSxycihybmcsUyowLjgsUyksMS40LCdyZ2JhKDI1NSwyNTUsMjU1LC4yNSknKTsgfQogIH0sCiAgY2l0eShjdHgsUyxybmcpewogICAgZmlsbEJnKGN0eCxTLGhzbCgyNTAsNDUsMTUpLGhzbCgyODAsNTAsOCksdHJ1ZSk7CiAgICBmb3IobGV0IGk9MDtpPDQwO2krKyl7IGNpcmMoY3R4LHJyKHJuZywwLFMpLHJyKHJuZywwLFMqMC41KSxycihybmcsMC42LDEuNiksJ3JnYmEoMjU1LDI1NSwyNTUsLjcpJyk7IH0KICAgIGNpcmMoY3R4LFMqMC4xOCxTKjAuMTUsUyowLjA2LGhzbCg1MCw2MCw4NSkpOwogICAgbGV0IHg9MDsKICAgIHdoaWxlKHg8Uyl7CiAgICAgIGNvbnN0IHc9cnIocm5nLFMqMC4wNixTKjAuMTIpLCBoPXJyKHJuZyxTKjAuMjUsUyowLjU1KSwgeT1TLWg7CiAgICAgIHJyZWN0KGN0eCx4LHksdyxoLDIsaHNsKDIzMCwyNSxycihybmcsMTQsMjQpKSk7CiAgICAgIGZvcihsZXQgd3k9eSs4OyB3eTxTLTY7IHd5Kz0xMil7CiAgICAgICAgZm9yKGxldCB3eD14KzU7IHd4PHgrdy01OyB3eCs9MTApeyBpZihybmcoKTwwLjYpIGNpcmMoY3R4LHd4LHd5LDEuNCxoc2woNDgsOTAsNzApKTsgfQogICAgICB9CiAgICAgIHgrPXcrMzsKICAgIH0KICB9LAogIGFydChjdHgsUyxybmcpewogICAgZmlsbEJnKGN0eCxTLCcjZjRlZmU0JywnI2VmZTZkNCcsdHJ1ZSk7CiAgICBjb25zdCBwYWxldHRlPVtoc2wocnIocm5nLDAsMzYwKSw3MCw1NSksaHNsKHJyKHJuZywwLDM2MCksNzAsNTUpLGhzbChycihybmcsMCwzNjApLDcwLDU1KSxoc2wocnIocm5nLDAsMzYwKSw3MCw1NSldOwogICAgZm9yKGxldCBpPTA7aTw1O2krKyl7CiAgICAgIGN0eC5iZWdpblBhdGgoKTsKICAgICAgY29uc3QgY3g9cnIocm5nLFMqMC4xNSxTKjAuODUpLCBjeT1ycihybmcsUyowLjE1LFMqMC44NSk7CiAgICAgIGN0eC5tb3ZlVG8oY3gsY3kpOwogICAgICBmb3IobGV0IGE9MDthPE1hdGguUEkqMjthKz0wLjYpeyBjb25zdCByPXJyKHJuZyxTKjAuMDUsUyowLjE2KTsgY3R4LmxpbmVUbyhjeCtNYXRoLmNvcyhhKSpyLGN5K01hdGguc2luKGEpKnIpOyB9CiAgICAgIGN0eC5jbG9zZVBhdGgoKTsgY3R4LmZpbGxTdHlsZT1wYWxldHRlW2klcGFsZXR0ZS5sZW5ndGhdOyBjdHguZ2xvYmFsQWxwaGE9Ljc1OyBjdHguZmlsbCgpOyBjdHguZ2xvYmFsQWxwaGE9MTsKICAgIH0KICAgIGZvcihsZXQgaT0wO2k8NjtpKyspewogICAgICBjdHguc3Ryb2tlU3R5bGU9cGFsZXR0ZVtpJXBhbGV0dGUubGVuZ3RoXTsgY3R4LmxpbmVXaWR0aD1ycihybmcsNiwxNCk7IGN0eC5saW5lQ2FwPSdyb3VuZCc7CiAgICAgIGN0eC5iZWdpblBhdGgoKTsKICAgICAgY29uc3Qgc3g9cnIocm5nLDAsUyksIHN5PXJyKHJuZywwLFMpOwogICAgICBjdHgubW92ZVRvKHN4LHN5KTsKICAgICAgY3R4LnF1YWRyYXRpY0N1cnZlVG8oc3grcnIocm5nLC0xMDAsMTAwKSxzeStycihybmcsLTEwMCwxMDApLCBzeCtycihybmcsLTE2MCwxNjApLCBzeStycihybmcsLTE2MCwxNjApKTsKICAgICAgY3R4LnN0cm9rZSgpOwogICAgfQogIH0sCiAgZm9vZChjdHgsUyxybmcpewogICAgZmlsbEJnKGN0eCxTLCcjZmJmM2UzJywnI2YzZTJjMicsdHJ1ZSk7CiAgICBjaXJjKGN0eCxTKjAuNSxTKjAuNTIsUyowLjM0LCcjZmZmJyk7CiAgICBjaXJjKGN0eCxTKjAuNSxTKjAuNTIsUyowLjMyLGhzbCgzNSw2MCw5MCkpOwogICAgY29uc3Qga2luZD1NYXRoLmZsb29yKHJuZygpKjMpOwogICAgaWYoa2luZD09PTApeyAvLyBwaXp6YQogICAgICB0cmkoY3R4LFtbUyowLjUsUyowLjUyXSxbUyowLjI4LFMqMC4yMl0sW1MqMC43MixTKjAuMjJdXSxoc2woNDIsODAsNTgpKTsKICAgICAgZm9yKGxldCBpPTA7aTw2O2krKyl7IGNpcmMoY3R4LHJyKHJuZyxTKjAuMzUsUyowLjY1KSxycihybmcsUyowLjI4LFMqMC40OCksUyowLjAyLGhzbCgwLDY1LDUwKSk7IH0KICAgIH0gZWxzZSBpZihraW5kPT09MSl7IC8vIGNha2UKICAgICAgcnJlY3QoY3R4LFMqMC4zLFMqMC40MixTKjAuNCxTKjAuMTQsNCxoc2wocnIocm5nLDMwMCwzNDApLDYwLDcwKSk7CiAgICAgIHJyZWN0KGN0eCxTKjAuMzIsUyowLjMsUyowLjM2LFMqMC4xMiw0LGhzbChycihybmcsMjAsNTApLDcwLDY1KSk7CiAgICAgIGN0eC5iZWdpblBhdGgoKTsgY3R4Lm1vdmVUbyhTKjAuMyxTKjAuMyk7CiAgICAgIGZvcihsZXQgeD1TKjAuMzt4PD1TKjAuNzt4Kz1TKjAuMDQpeyBjdHgucXVhZHJhdGljQ3VydmVUbyh4K1MqMC4wMixTKjAuMjYseCtTKjAuMDQsUyowLjMpOyB9CiAgICAgIGN0eC5saW5lVG8oUyowLjcsUyowLjQyKTsgY3R4LmxpbmVUbyhTKjAuMyxTKjAuNDIpOyBjdHguY2xvc2VQYXRoKCk7IGN0eC5maWxsU3R5bGU9JyNmZmY4ZWUnOyBjdHguZmlsbCgpOwogICAgICBjaXJjKGN0eCxTKjAuNSxTKjAuMjcsUyowLjAyLGhzbCgwLDcwLDQ1KSk7CiAgICB9IGVsc2UgeyAvLyBjb2ZmZWUKICAgICAgcnJlY3QoY3R4LFMqMC4zNixTKjAuMzYsUyowLjI4LFMqMC4yNiw2LCcjZmZmJyk7CiAgICAgIGN0eC5iZWdpblBhdGgoKTsgY3R4LmFyYyhTKjAuNjYsUyowLjQ0LFMqMC4wNiwtTWF0aC5QSS8yLE1hdGguUEkvMik7IGN0eC5zdHJva2VTdHlsZT0nI2ZmZic7IGN0eC5saW5lV2lkdGg9NjsgY3R4LnN0cm9rZSgpOwogICAgICBjdHguc3Ryb2tlU3R5bGU9J3JnYmEoMjU1LDI1NSwyNTUsLjcpJzsgY3R4LmxpbmVXaWR0aD0zOwogICAgICBmb3IobGV0IGk9MDtpPDI7aSsrKXsgY3R4LmJlZ2luUGF0aCgpOyBjdHgubW92ZVRvKFMqKDAuNDQraSowLjA4KSxTKjAuMzQpOyBjdHgucXVhZHJhdGljQ3VydmVUbyhTKigwLjQyK2kqMC4wOCksUyowLjI4LFMqKDAuNDYraSowLjA4KSxTKjAuMjIpOyBjdHguc3Ryb2tlKCk7IH0KICAgIH0KICB9LAogIGN1bHR1cmUoY3R4LFMscm5nKXsKICAgIGNvbnN0IGgxPXJyKHJuZywwLDM2MCk7CiAgICBmaWxsQmcoY3R4LFMsaHNsKGgxLDc1LDYwKSxoc2woaDErODAsNzAsNDUpLHRydWUpOwogICAgY29uc3QgYm9yZGVyPVMqMC4wNjsKICAgIGN0eC5zdHJva2VTdHlsZT1oc2woaDErMTgwLDgwLDcwKTsgY3R4LmxpbmVXaWR0aD1ib3JkZXI7CiAgICBjdHguc3Ryb2tlUmVjdChib3JkZXIvMixib3JkZXIvMixTLWJvcmRlcixTLWJvcmRlcik7CiAgICBmb3IobGV0IGk9MDtpPE1hdGguZmxvb3IoUy8yNCk7aSsrKXsKICAgICAgY29uc3QgeD1pKjI0KzEyLCBjb2w9aHNsKChoMStpKjQwKSUzNjAsODUsNjUpOwogICAgICB0cmkoY3R4LFtbeCxib3JkZXJdLFt4LTgsMF0sW3grOCwwXV0sY29sKTsKICAgICAgdHJpKGN0eCxbW3gsUy1ib3JkZXJdLFt4LTgsU10sW3grOCxTXV0sY29sKTsKICAgIH0KICAgIGNvbnN0IGN4PVMvMiwgY3k9Uy8yOwogICAgZm9yKGxldCByaW5nPTA7IHJpbmc8NDsgcmluZysrKXsgY2lyYyhjdHgsY3gsY3ksUyowLjA1K3JpbmcqUyowLjA1LHJpbmclMj8gaHNsKGgxKzQwLDg1LDYwKTogaHNsKGgxKzIwMCw4MCw1NSkpOyB9CiAgICBmb3IobGV0IHA9MDtwPDEwO3ArKyl7IGNvbnN0IGE9KHAvMTApKk1hdGguUEkqMjsgY29uc3QgcHg9Y3grTWF0aC5jb3MoYSkqUyowLjIyLCBweT1jeStNYXRoLnNpbihhKSpTKjAuMjI7CiAgICAgIGNpcmMoY3R4LHB4LHB5LFMqMC4wMzUsaHNsKChoMStwKjM2KSUzNjAsODUsNjIpKTsgfQogIH0KfTsKCi8vIFNjYXR0ZXJzIGZhaW50IHVuaXF1ZSBzcGVja3MgYWNyb3NzIHRoZSBXSE9MRSBjYW52YXMgc28gdGhhdCBldmVuIGxhcmdlCi8vIGZsYXQgcmVnaW9ucyAocGxhaW4gc2t5LCByb2FkLCB3YWxscykgbmV2ZXIgbG9vayBpZGVudGljYWwgZnJvbSBjZWxsIHRvCi8vIGNlbGwgLS0gb3RoZXJ3aXNlIGEgc29sdmVkLWxvb2tpbmcgYm9hcmQgd2l0aCB0d28gaWRlbnRpY2FsIGJsYW5rIHBpZWNlcwovLyBzd2FwcGVkIGNhbiBsb29rICJkb25lIiB0byB0aGUgZXllIHdoaWxlIHRoZSBlbmdpbmUgY29ycmVjdGx5IGtub3dzIGl0Ci8vIGlzbid0LCBhbmQgdGhlIHBsYXllciBuZXZlciBzZWVzIHRoZSB3aW4gc2NyZWVuLgpmdW5jdGlvbiBncmFpbihjdHgsUyxybmcsY291bnQpewogIGZvcihsZXQgaT0wO2k8Y291bnQ7aSsrKXsKICAgIGNvbnN0IHg9cm5nKCkqUywgeT1ybmcoKSpTOwogICAgY29uc3Qgcj0wLjgrcm5nKCkqMS44OwogICAgY29uc3QgbGlnaHQ9cm5nKCk8MC41OwogICAgY29uc3QgYT0oMC4wNStybmcoKSowLjA3KS50b0ZpeGVkKDMpOwogICAgY3R4LmJlZ2luUGF0aCgpOyBjdHguYXJjKHgseSxyLDAsTWF0aC5QSSoyKTsKICAgIGN0eC5maWxsU3R5bGU9IGxpZ2h0PyBgcmdiYSgyNTUsMjU1LDI1NSwke2F9KWAgOiBgcmdiYSgwLDAsMCwke2F9KWA7CiAgICBjdHguZmlsbCgpOwogIH0KfQoKY29uc3QgaW1nQ2FjaGUgPSB7fTsKZnVuY3Rpb24gZ2V0SW1hZ2VVUkwoY2F0SWR4LCBwaWNJZHgsIHNpemUpewogIGNvbnN0IGtleSA9IGNhdElkeCsnXycrcGljSWR4KydfJytzaXplOwogIGlmKGltZ0NhY2hlW2tleV0pIHJldHVybiBpbWdDYWNoZVtrZXldOwogIGNvbnN0IGNhbnZhcz1kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTsKICBjYW52YXMud2lkdGg9c2l6ZTsgY2FudmFzLmhlaWdodD1zaXplOwogIGNvbnN0IGN0eD1jYW52YXMuZ2V0Q29udGV4dCgnMmQnKTsKICBjb25zdCBybmc9bXVsYmVycnkzMihjYXRJZHgqOTcrcGljSWR4KjEzMSs3KTsKICBjb25zdCBmbj1EUkFXW0NBVEVHT1JJRVNbY2F0SWR4XS5rZXldOwogIGZuKGN0eCxzaXplLHJuZyk7CiAgZ3JhaW4oY3R4LHNpemUscm5nLDU2MCk7CiAgY29uc3QgdXJsPWNhbnZhcy50b0RhdGFVUkwoJ2ltYWdlL2pwZWcnLDAuOSk7CiAgaW1nQ2FjaGVba2V5XT11cmw7CiAgcmV0dXJuIHVybDsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIDIuIEFVRElPIEVOR0lORSAoZnVsbHkgc3ludGhlc2l6ZWQg4oCUIG5vIGV4dGVybmFsIGZpbGVzKQogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KY29uc3QgQXVkaW8xID0gKGZ1bmN0aW9uKCl7CiAgbGV0IGN0eD1udWxsLCBzZnhHYWluPW51bGwsIGJnbUdhaW49bnVsbCwgYmdtU291cmNlPW51bGwsIGJnbUJ1ZmZlcj1udWxsLCBtdXRlZD1mYWxzZTsKCiAgZnVuY3Rpb24gZW5zdXJlKCl7CiAgICBpZighY3R4KXsKICAgICAgY3R4ID0gbmV3ICh3aW5kb3cuQXVkaW9Db250ZXh0fHx3aW5kb3cud2Via2l0QXVkaW9Db250ZXh0KSgpOwogICAgICBzZnhHYWluID0gY3R4LmNyZWF0ZUdhaW4oKTsgc2Z4R2Fpbi5nYWluLnZhbHVlPTE7IHNmeEdhaW4uY29ubmVjdChjdHguZGVzdGluYXRpb24pOwogICAgfQogICAgaWYoY3R4LnN0YXRlPT09J3N1c3BlbmRlZCcpIGN0eC5yZXN1bWUoKTsKICB9CgogIGZ1bmN0aW9uIHRvbmUoZnJlcSxzdGFydCxkdXIsdHlwZSx2b2wpewogICAgaWYobXV0ZWQgfHwgIWN0eCkgcmV0dXJuOwogICAgY29uc3Qgbz1jdHguY3JlYXRlT3NjaWxsYXRvcigpLCBnPWN0eC5jcmVhdGVHYWluKCk7CiAgICBvLnR5cGU9dHlwZTsgby5mcmVxdWVuY3kudmFsdWU9ZnJlcTsKICAgIGNvbnN0IHQwPWN0eC5jdXJyZW50VGltZStzdGFydDsKICAgIGcuZ2Fpbi5zZXRWYWx1ZUF0VGltZSgwLjAwMDEsdDApOwogICAgZy5nYWluLmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKHZvbCx0MCswLjAyKTsKICAgIGcuZ2Fpbi5leHBvbmVudGlhbFJhbXBUb1ZhbHVlQXRUaW1lKDAuMDAwMSx0MCtkdXIpOwogICAgby5jb25uZWN0KGcpLmNvbm5lY3Qoc2Z4R2Fpbik7CiAgICBvLnN0YXJ0KHQwKTsgby5zdG9wKHQwK2R1ciswLjA1KTsKICB9CgogIGZ1bmN0aW9uIGNsaWNrKCl7IGVuc3VyZSgpOyB0b25lKDc2MCwwLDAuMDgsJ3NpbmUnLDAuMTYpOyB9CgogIGZ1bmN0aW9uIHN3YXAoKXsKICAgIGlmKG11dGVkKSByZXR1cm47IGVuc3VyZSgpOwogICAgY29uc3Qgbz1jdHguY3JlYXRlT3NjaWxsYXRvcigpLCBmPWN0eC5jcmVhdGVCaXF1YWRGaWx0ZXIoKSwgZz1jdHguY3JlYXRlR2FpbigpOwogICAgby50eXBlPSdzYXd0b290aCc7IGYudHlwZT0nYmFuZHBhc3MnOwogICAgY29uc3QgdDA9Y3R4LmN1cnJlbnRUaW1lOwogICAgZi5mcmVxdWVuY3kuc2V0VmFsdWVBdFRpbWUoNDAwLHQwKTsgZi5mcmVxdWVuY3kuZXhwb25lbnRpYWxSYW1wVG9WYWx1ZUF0VGltZSgxNDAwLHQwKzAuMTIpOwogICAgby5mcmVxdWVuY3kuc2V0VmFsdWVBdFRpbWUoMjIwLHQwKTsgby5mcmVxdWVuY3kuZXhwb25lbnRpYWxSYW1wVG9WYWx1ZUF0VGltZSg2NDAsdDArMC4xMik7CiAgICBnLmdhaW4uc2V0VmFsdWVBdFRpbWUoMC4xOCx0MCk7IGcuZ2Fpbi5leHBvbmVudGlhbFJhbXBUb1ZhbHVlQXRUaW1lKDAuMDAwMSx0MCswLjE2KTsKICAgIG8uY29ubmVjdChmKS5jb25uZWN0KGcpLmNvbm5lY3Qoc2Z4R2Fpbik7CiAgICBvLnN0YXJ0KHQwKTsgby5zdG9wKHQwKzAuMTgpOwogIH0KCiAgZnVuY3Rpb24gdmljdG9yeSgpewogICAgZW5zdXJlKCk7CiAgICBjb25zdCBub3Rlcz1bNTIzLjI1LDY1OS4yNSw3ODMuOTksMTA0Ni41LDEzMTguNV07CiAgICBub3Rlcy5mb3JFYWNoKChmLGkpPT50b25lKGYsaSowLjExLDAuNCwndHJpYW5nbGUnLDAuMjIpKTsKICB9CgogIGZ1bmN0aW9uIGZhaWwoKXsKICAgIGVuc3VyZSgpOwogICAgY29uc3Qgbm90ZXM9WzM5MiwzNDkuMiwzMTEuMSwyNjEuNl07CiAgICBub3Rlcy5mb3JFYWNoKChmLGkpPT50b25lKGYsaSowLjIsMC40NSwnc2F3dG9vdGgnLDAuMTYpKTsKICB9CgogIGFzeW5jIGZ1bmN0aW9uIGJ1aWxkQmdtQnVmZmVyKCl7CiAgICBjb25zdCBkdXI9OCwgc3I9NDQxMDA7CiAgICBjb25zdCBvY3R4PW5ldyBPZmZsaW5lQXVkaW9Db250ZXh0KDEsc3IqZHVyLHNyKTsKICAgIGNvbnN0IGNob3Jkcz1bWzIyMCwyNzcuMTgsMzI5LjYzXSxbMTk2LDI0Ni45NCwyOTMuNjZdLFsxNzQuNjEsMjIwLDI2MS42M10sWzE5NiwyNDYuOTQsMzI5LjYzXV07CiAgICBjaG9yZHMuZm9yRWFjaCgoY2hvcmQsY2kpPT57CiAgICAgIGNvbnN0IHQwPWNpKjI7CiAgICAgIGNob3JkLmZvckVhY2goZnJlcT0+ewogICAgICAgIGNvbnN0IG89b2N0eC5jcmVhdGVPc2NpbGxhdG9yKCksIGc9b2N0eC5jcmVhdGVHYWluKCk7CiAgICAgICAgby50eXBlPSdzaW5lJzsgby5mcmVxdWVuY3kudmFsdWU9ZnJlcTsKICAgICAgICBnLmdhaW4uc2V0VmFsdWVBdFRpbWUoMCx0MCk7CiAgICAgICAgZy5nYWluLmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKDAuMDQ1LHQwKzAuNyk7CiAgICAgICAgZy5nYWluLmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKDAuMCx0MCsyKTsKICAgICAgICBvLmNvbm5lY3QoZykuY29ubmVjdChvY3R4LmRlc3RpbmF0aW9uKTsKICAgICAgICBvLnN0YXJ0KHQwKTsgby5zdG9wKHQwKzIpOwogICAgICB9KTsKICAgIH0pOwogICAgcmV0dXJuIGF3YWl0IG9jdHguc3RhcnRSZW5kZXJpbmcoKTsKICB9CgogIGFzeW5jIGZ1bmN0aW9uIHN0YXJ0QmdtKCl7CiAgICBlbnN1cmUoKTsKICAgIGlmKCFiZ21CdWZmZXIpIGJnbUJ1ZmZlciA9IGF3YWl0IGJ1aWxkQmdtQnVmZmVyKCk7CiAgICBpZihiZ21Tb3VyY2UpIHJldHVybjsKICAgIGJnbVNvdXJjZT1jdHguY3JlYXRlQnVmZmVyU291cmNlKCk7IGJnbVNvdXJjZS5idWZmZXI9YmdtQnVmZmVyOyBiZ21Tb3VyY2UubG9vcD10cnVlOwogICAgYmdtR2Fpbj1jdHguY3JlYXRlR2FpbigpOyBiZ21HYWluLmdhaW4udmFsdWU9IG11dGVkPzA6MC41OwogICAgYmdtU291cmNlLmNvbm5lY3QoYmdtR2FpbikuY29ubmVjdChjdHguZGVzdGluYXRpb24pOwogICAgYmdtU291cmNlLnN0YXJ0KCk7CiAgfQoKICBmdW5jdGlvbiBzdG9wQmdtKCl7IGlmKGJnbVNvdXJjZSl7IHRyeXtiZ21Tb3VyY2Uuc3RvcCgpO31jYXRjaChlKXt9IGJnbVNvdXJjZT1udWxsOyB9IH0KCiAgZnVuY3Rpb24gc2V0TXV0ZWQobSl7CiAgICBtdXRlZD1tOwogICAgaWYoYmdtR2FpbikgYmdtR2Fpbi5nYWluLnZhbHVlID0gbXV0ZWQ/MDowLjU7CiAgfQoKICByZXR1cm4geyBjbGljaywgc3dhcCwgdmljdG9yeSwgZmFpbCwgc3RhcnRCZ20sIHN0b3BCZ20sIHNldE11dGVkLCBlbnN1cmUsIGdldCBtdXRlZCgpe3JldHVybiBtdXRlZDt9IH07Cn0pKCk7CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAgMy4gTkFWSUdBVElPTgogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KZnVuY3Rpb24gc2hvdyhpZCl7CiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnNjcmVlbicpLmZvckVhY2gocz0+cy5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKSk7CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpLmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpOwp9CmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLWdvXScpLmZvckVhY2goYnRuPT57CiAgYnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywoKT0+ewogICAgaWYoYnRuLmRhdGFzZXQuZ289PT0nc2NyZWVuLXBpY3R1cmVzJykgc3RvcFRpbWVyKCk7CiAgICBzaG93KGJ0bi5kYXRhc2V0LmdvKTsKICB9KTsKfSk7CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAgNC4gQ0FURUdPUlkgKyBQSUNUVVJFIFNFTEVDVElPTgogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KbGV0IGN1cnJlbnRDYXQ9bnVsbCwgY3VycmVudFBpYz1udWxsLCBjdXJyZW50SW1hZ2VVUkw9bnVsbDsKCmZ1bmN0aW9uIHJlbmRlckNhdGVnb3JpZXMoKXsKICBjb25zdCB3cmFwPWRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjYXRlZ29yeS1ncmlkJyk7CiAgd3JhcC5pbm5lckhUTUw9Jyc7CiAgQ0FURUdPUklFUy5mb3JFYWNoKChjLGkpPT57CiAgICBjb25zdCBkaXY9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7CiAgICBkaXYuY2xhc3NOYW1lPSdjYXQtY2FyZCc7CiAgICBkaXYuaW5uZXJIVE1MPWA8ZGl2IGNsYXNzPSJpYyI+JHtjLmljb259PC9kaXY+PGRpdiBjbGFzcz0ibm0iPiR7Yy5uYW1lfTwvZGl2PmA7CiAgICBkaXYuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCgpPT57CiAgICAgIGN1cnJlbnRDYXQ9aTsKICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BpYy1jYXQtdGl0bGUnKS50ZXh0Q29udGVudD1jLm5hbWU7CiAgICAgIHJlbmRlclBpY3R1cmVzKGkpOwogICAgICBzaG93KCdzY3JlZW4tcGljdHVyZXMnKTsKICAgIH0pOwogICAgd3JhcC5hcHBlbmRDaGlsZChkaXYpOwogIH0pOwp9CgpmdW5jdGlvbiByZW5kZXJQaWN0dXJlcyhjYXRJZHgpewogIGNvbnN0IHdyYXA9ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BpY3R1cmUtZ3JpZCcpOwogIHdyYXAuaW5uZXJIVE1MPScnOwogIGZvcihsZXQgcD0wO3A8UElDU19QRVJfQ0FURUdPUlk7cCsrKXsKICAgIGNvbnN0IGNhcmQ9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7CiAgICBjYXJkLmNsYXNzTmFtZT0ncGljLWNhcmQnOwogICAgY29uc3QgdXJsPWdldEltYWdlVVJMKGNhdElkeCxwLDMyMCk7CiAgICBjYXJkLmlubmVySFRNTD1gPGltZyBzcmM9IiR7dXJsfSI+PHNwYW4gY2xhc3M9Im51bSI+IyR7cCsxfTwvc3Bhbj5gOwogICAgY2FyZC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsKCk9PnsKICAgICAgY3VycmVudFBpYz1wOwogICAgICBjdXJyZW50SW1hZ2VVUkw9Z2V0SW1hZ2VVUkwoY2F0SWR4LHAsSU1HX1NJWkUpOwogICAgICBvcGVuRGlmZmljdWx0eVNjcmVlbigpOwogICAgfSk7CiAgICB3cmFwLmFwcGVuZENoaWxkKGNhcmQpOwogIH0KICBjb25zdCB1cGxvYWRDYXJkPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpOwogIHVwbG9hZENhcmQuY2xhc3NOYW1lPSd1cGxvYWQtY2FyZCc7CiAgdXBsb2FkQ2FyZC5pbm5lckhUTUw9YDxkaXYgY2xhc3M9ImljIj7wn5O3PC9kaXY+PGRpdj5VcGxvYWQgeW91cjxicj5vd24gcGhvdG88L2Rpdj5gOwogIHVwbG9hZENhcmQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCgpPT5maWxlSW5wdXQuY2xpY2soKSk7CiAgd3JhcC5hcHBlbmRDaGlsZCh1cGxvYWRDYXJkKTsKfQoKY29uc3QgZmlsZUlucHV0PWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7CmZpbGVJbnB1dC50eXBlPSdmaWxlJzsgZmlsZUlucHV0LmFjY2VwdD0naW1hZ2UvKic7IGZpbGVJbnB1dC5zdHlsZS5kaXNwbGF5PSdub25lJzsKZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChmaWxlSW5wdXQpOwpmaWxlSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJyxlPT57CiAgY29uc3QgZmlsZT1lLnRhcmdldC5maWxlc1swXTsKICBpZighZmlsZSkgcmV0dXJuOwogIGNvbnN0IHJlYWRlcj1uZXcgRmlsZVJlYWRlcigpOwogIHJlYWRlci5vbmxvYWQ9ZXY9PnsKICAgIGN1cnJlbnRQaWM9J2N1c3RvbSc7CiAgICBjdXJyZW50SW1hZ2VVUkw9ZXYudGFyZ2V0LnJlc3VsdDsKICAgIG9wZW5EaWZmaWN1bHR5U2NyZWVuKCk7CiAgfTsKICByZWFkZXIucmVhZEFzRGF0YVVSTChmaWxlKTsKICBmaWxlSW5wdXQudmFsdWU9Jyc7Cn0pOwoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIDUuIERJRkZJQ1VMVFkgU0VMRUNUSU9OCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpjb25zdCBESUZGSUNVTFRJRVMgPSBbCiAge2xhYmVsOidFYXN5JywgICAgIG46MywgdGltZToxODAsICBzdWI6J0EgZ2VudGxlIHdhcm0tdXAnfSwKICB7bGFiZWw6J01lZGl1bScsICAgbjo0LCB0aW1lOjI0MCwgIHN1YjonQSBzb2xpZCBjaGFsbGVuZ2UnfSwKICB7bGFiZWw6J0FkdmFuY2VkJywgbjo2LCB0aW1lOjM2MCwgIHN1YjonRm9yIHNoYXJwIGV5ZXMnfSwKICB7bGFiZWw6J0hhcmQnLCAgICAgbjo4LCB0aW1lOjYwMCwgIHN1YjonUHV6emxlIG1hc3RlciB0ZXJyaXRvcnknfSwKXTsKCmZ1bmN0aW9uIG9wZW5EaWZmaWN1bHR5U2NyZWVuKCl7CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RpZmYtcHJldmlldycpLnNyYz1jdXJyZW50SW1hZ2VVUkw7CiAgY29uc3QgbGlzdD1kb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGlmZmljdWx0eS1saXN0Jyk7CiAgbGlzdC5pbm5lckhUTUw9Jyc7CiAgRElGRklDVUxUSUVTLmZvckVhY2goZD0+ewogICAgY29uc3QgZGl2PWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpOwogICAgZGl2LmNsYXNzTmFtZT0nZGlmZi1jYXJkJzsKICAgIGNvbnN0IGJlc3RLZXk9YmVzdFNjb3JlS2V5KGQubik7CiAgICBjb25zdCBiZXN0PWxvY2FsU3RvcmFnZS5nZXRJdGVtKGJlc3RLZXkpOwogICAgbGV0IGJlc3RIdG1sPScnOwogICAgaWYoYmVzdCl7CiAgICAgIGNvbnN0IGI9SlNPTi5wYXJzZShiZXN0KTsKICAgICAgYmVzdEh0bWw9YDxkaXYgY2xhc3M9ImJlc3QtYmFkZ2UiPvCfj4YgQmVzdDogJHtmb3JtYXRUaW1lKGIudGltZSl9IMK3ICR7Yi5tb3Zlc30gbW92ZXM8L2Rpdj5gOwogICAgfQogICAgZGl2LmlubmVySFRNTD1gPGRpdj48ZGl2IGNsYXNzPSJsYmwiPiR7ZC5sYWJlbH08L2Rpdj48ZGl2IGNsYXNzPSJzdWIiPiR7ZC5zdWJ9PC9kaXY+JHtiZXN0SHRtbH08L2Rpdj48ZGl2IGNsYXNzPSJwaWxsIj4ke2Qubn3DlyR7ZC5ufTwvZGl2PmA7CiAgICBkaXYuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCgpPT5zdGFydEdhbWUoZCkpOwogICAgbGlzdC5hcHBlbmRDaGlsZChkaXYpOwogIH0pOwogIHNob3coJ3NjcmVlbi1kaWZmaWN1bHR5Jyk7Cn0KCmZ1bmN0aW9uIGJlc3RTY29yZUtleShuKXsKICByZXR1cm4gYHB1enpsZV9iZXN0XyR7Y3VycmVudENhdH1fJHtjdXJyZW50UGljfV8ke259YDsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIDYuIEdBTUUgRU5HSU5FCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpsZXQgbj0zLCBvcmRlcj1bXSwgc2VsZWN0ZWRQb3M9bnVsbCwgbW92ZXM9MCwgdGltZUxlZnQ9MCwgdGltZUxpbWl0PTAsIHRpbWVySWQ9bnVsbCwgcGF1c2VkPWZhbHNlLCBhY3RpdmVEaWZmPW51bGw7CgpmdW5jdGlvbiBmb3JtYXRUaW1lKHQpewogIHQ9TWF0aC5tYXgoMCxNYXRoLnJvdW5kKHQpKTsKICBjb25zdCBtPU1hdGguZmxvb3IodC82MCksIHM9dCU2MDsKICByZXR1cm4gYCR7U3RyaW5nKG0pLnBhZFN0YXJ0KDIsJzAnKX06JHtTdHJpbmcocykucGFkU3RhcnQoMiwnMCcpfWA7Cn0KCmZ1bmN0aW9uIHNodWZmbGVkT3JkZXIoY291bnQpewogIGxldCBhcnI9Wy4uLkFycmF5KGNvdW50KS5rZXlzKCldOwogIGRvewogICAgZm9yKGxldCBpPWFyci5sZW5ndGgtMTtpPjA7aS0tKXsKICAgICAgY29uc3Qgaj1NYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqKGkrMSkpOwogICAgICBbYXJyW2ldLGFycltqXV09W2FycltqXSxhcnJbaV1dOwogICAgfQogIH0gd2hpbGUoY291bnQ+MSAmJiBhcnIuZXZlcnkoKHYsaSk9PnY9PT1pKSk7CiAgcmV0dXJuIGFycjsKfQoKZnVuY3Rpb24gc3RhcnRHYW1lKGRpZmYpewogIGFjdGl2ZURpZmY9ZGlmZjsKICBuPWRpZmYubjsgbW92ZXM9MDsgdGltZUxpbWl0PWRpZmYudGltZTsgdGltZUxlZnQ9ZGlmZi50aW1lOyBzZWxlY3RlZFBvcz1udWxsOyBwYXVzZWQ9ZmFsc2U7CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RodW1iJykuc3JjPWN1cnJlbnRJbWFnZVVSTDsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaHVkLWRpZmYtbGFiZWwnKS50ZXh0Q29udGVudD1gJHtkaWZmLmxhYmVsfSDCtyAke259w5cke259YDsKICB1cGRhdGVIdWQoKTsKICBidWlsZEJvYXJkKCk7CiAgc2hvdygnc2NyZWVuLWdhbWUnKTsKICBBdWRpbzEuc3RhcnRCZ20oKTsKICBzdGFydFRpbWVyKCk7Cn0KCmZ1bmN0aW9uIGJ1aWxkQm9hcmQoKXsKICBjb25zdCBib2FyZD1kb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYm9hcmQnKTsKICBib2FyZC5zdHlsZS5zZXRQcm9wZXJ0eSgnLS1uJyxuKTsKICBib2FyZC5pbm5lckhUTUw9Jyc7CiAgb3JkZXI9c2h1ZmZsZWRPcmRlcihuKm4pOwogIGZvcihsZXQgcG9zPTA7IHBvczxuKm47IHBvcysrKXsKICAgIGNvbnN0IGNlbGw9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7CiAgICBjZWxsLmNsYXNzTmFtZT0nY2VsbCc7CiAgICBjZWxsLmRhdGFzZXQucG9zPXBvczsKICAgIGNlbGwuZHJhZ2dhYmxlPXRydWU7CiAgICBzZXRQaWVjZShjZWxsLG9yZGVyW3Bvc10pOwogICAgYXR0YWNoQ2VsbEV2ZW50cyhjZWxsKTsKICAgIGJvYXJkLmFwcGVuZENoaWxkKGNlbGwpOwogIH0KfQoKZnVuY3Rpb24gc2V0UGllY2UoY2VsbCxwaWVjZUlkeCl7CiAgY2VsbC5kYXRhc2V0LnBpZWNlPXBpZWNlSWR4OwogIGNlbGwuc3R5bGUuYmFja2dyb3VuZEltYWdlPWB1cmwoJHtjdXJyZW50SW1hZ2VVUkx9KWA7CiAgY2VsbC5zdHlsZS5iYWNrZ3JvdW5kU2l6ZT1gJHtuKjEwMH0lICR7bioxMDB9JWA7CiAgY29uc3QgY29sPXBpZWNlSWR4JW4sIHJvdz1NYXRoLmZsb29yKHBpZWNlSWR4L24pOwogIGNvbnN0IHBvc1ggPSBuPT09MT8wOihjb2wqMTAwLyhuLTEpKTsKICBjb25zdCBwb3NZID0gbj09PTE/MDoocm93KjEwMC8obi0xKSk7CiAgY2VsbC5zdHlsZS5iYWNrZ3JvdW5kUG9zaXRpb249YCR7cG9zWH0lICR7cG9zWX0lYDsKICBjZWxsLmNsYXNzTGlzdC50b2dnbGUoJ2NvcnJlY3QnLCBwaWVjZUlkeD09PU51bWJlcihjZWxsLmRhdGFzZXQucG9zKSk7Cn0KCmZ1bmN0aW9uIGF0dGFjaENlbGxFdmVudHMoY2VsbCl7CiAgY2VsbC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsKCk9PnsKICAgIGlmKHBhdXNlZCkgcmV0dXJuOwogICAgY29uc3QgcG9zPU51bWJlcihjZWxsLmRhdGFzZXQucG9zKTsKICAgIGlmKHNlbGVjdGVkUG9zPT09bnVsbCl7CiAgICAgIHNlbGVjdGVkUG9zPXBvczsgY2VsbC5jbGFzc0xpc3QuYWRkKCdzZWxlY3RlZCcpOyBBdWRpbzEuY2xpY2soKTsKICAgIH0gZWxzZSBpZihzZWxlY3RlZFBvcz09PXBvcyl7CiAgICAgIGNlbGwuY2xhc3NMaXN0LnJlbW92ZSgnc2VsZWN0ZWQnKTsgc2VsZWN0ZWRQb3M9bnVsbDsKICAgIH0gZWxzZSB7CiAgICAgIHN3YXBDZWxscyhzZWxlY3RlZFBvcyxwb3MpOwogICAgICBjbGVhclNlbGVjdGlvbigpOwogICAgICBzZWxlY3RlZFBvcz1udWxsOwogICAgfQogIH0pOwogIGNlbGwuYWRkRXZlbnRMaXN0ZW5lcignZHJhZ3N0YXJ0JyxlPT57CiAgICBpZihwYXVzZWQpeyBlLnByZXZlbnREZWZhdWx0KCk7IHJldHVybjsgfQogICAgZS5kYXRhVHJhbnNmZXIuc2V0RGF0YSgndGV4dC9wbGFpbicsY2VsbC5kYXRhc2V0LnBvcyk7CiAgICBjZWxsLmNsYXNzTGlzdC5hZGQoJ2RyYWdnaW5nJyk7CiAgfSk7CiAgY2VsbC5hZGRFdmVudExpc3RlbmVyKCdkcmFnZW5kJywoKT0+Y2VsbC5jbGFzc0xpc3QucmVtb3ZlKCdkcmFnZ2luZycpKTsKICBjZWxsLmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdvdmVyJyxlPT5lLnByZXZlbnREZWZhdWx0KCkpOwogIGNlbGwuYWRkRXZlbnRMaXN0ZW5lcignZHJvcCcsZT0+ewogICAgZS5wcmV2ZW50RGVmYXVsdCgpOwogICAgaWYocGF1c2VkKSByZXR1cm47CiAgICBjb25zdCBmcm9tUG9zPU51bWJlcihlLmRhdGFUcmFuc2Zlci5nZXREYXRhKCd0ZXh0L3BsYWluJykpOwogICAgY29uc3QgdG9Qb3M9TnVtYmVyKGNlbGwuZGF0YXNldC5wb3MpOwogICAgaWYoZnJvbVBvcyE9PXRvUG9zKXsgc3dhcENlbGxzKGZyb21Qb3MsdG9Qb3MpOyBjbGVhclNlbGVjdGlvbigpOyBzZWxlY3RlZFBvcz1udWxsOyB9CiAgfSk7Cn0KCmZ1bmN0aW9uIGNsZWFyU2VsZWN0aW9uKCl7CiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmNlbGwuc2VsZWN0ZWQnKS5mb3JFYWNoKGM9PmMuY2xhc3NMaXN0LnJlbW92ZSgnc2VsZWN0ZWQnKSk7Cn0KCmZ1bmN0aW9uIHN3YXBDZWxscyhwb3NBLHBvc0IpewogIGNvbnN0IGNlbGxzPWRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdib2FyZCcpLmNoaWxkcmVuOwogIGNvbnN0IGE9Y2VsbHNbcG9zQV0sIGI9Y2VsbHNbcG9zQl07CiAgY29uc3QgcGE9TnVtYmVyKGEuZGF0YXNldC5waWVjZSksIHBiPU51bWJlcihiLmRhdGFzZXQucGllY2UpOwogIHNldFBpZWNlKGEscGIpOyBzZXRQaWVjZShiLHBhKTsKICBtb3ZlcysrOyB1cGRhdGVIdWQoKTsKICBBdWRpbzEuc3dhcCgpOwogIGNoZWNrV2luKCk7Cn0KCmZ1bmN0aW9uIHVwZGF0ZUh1ZCgpewogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdodWQtdGltZScpLnRleHRDb250ZW50PWZvcm1hdFRpbWUodGltZUxlZnQpOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdodWQtbW92ZXMnKS50ZXh0Q29udGVudD1tb3ZlczsKfQoKZnVuY3Rpb24gc3RhcnRUaW1lcigpewogIGNsZWFySW50ZXJ2YWwodGltZXJJZCk7CiAgdGltZXJJZD1zZXRJbnRlcnZhbCgoKT0+ewogICAgaWYocGF1c2VkKSByZXR1cm47CiAgICB0aW1lTGVmdC0tOwogICAgdXBkYXRlSHVkKCk7CiAgICBpZih0aW1lTGVmdDw9MCl7IHN0b3BUaW1lcigpOyBvblRpbWVVcCgpOyB9CiAgfSwxMDAwKTsKfQpmdW5jdGlvbiBzdG9wVGltZXIoKXsgY2xlYXJJbnRlcnZhbCh0aW1lcklkKTsgdGltZXJJZD1udWxsOyB9CgpmdW5jdGlvbiBjaGVja1dpbigpewogIGNvbnN0IGNlbGxzPVsuLi5kb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYm9hcmQnKS5jaGlsZHJlbl07CiAgY29uc3Qgc29sdmVkPWNlbGxzLmV2ZXJ5KGM9Pk51bWJlcihjLmRhdGFzZXQucGllY2UpPT09TnVtYmVyKGMuZGF0YXNldC5wb3MpKTsKICBpZihzb2x2ZWQpeyBzdG9wVGltZXIoKTsgb25XaW4oKTsgfQp9CgpmdW5jdGlvbiBvbldpbigpewogIGNvbnN0IHRpbWVUYWtlbj10aW1lTGltaXQtdGltZUxlZnQ7CiAgQXVkaW8xLnZpY3RvcnkoKTsKICBjb25zdCBiZXN0S2V5PWJlc3RTY29yZUtleShuKTsKICBjb25zdCBwcmV2UmF3PWxvY2FsU3RvcmFnZS5nZXRJdGVtKGJlc3RLZXkpOwogIGxldCBpc0Jlc3Q9ZmFsc2U7CiAgaWYoY3VycmVudFBpYyE9PSdjdXN0b20nKXsKICAgIGNvbnN0IHByZXY9cHJldlJhdz9KU09OLnBhcnNlKHByZXZSYXcpOm51bGw7CiAgICBpZighcHJldiB8fCBtb3ZlczxwcmV2Lm1vdmVzIHx8IChtb3Zlcz09PXByZXYubW92ZXMgJiYgdGltZVRha2VuPHByZXYudGltZSkpewogICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShiZXN0S2V5LEpTT04uc3RyaW5naWZ5KHttb3Zlcyx0aW1lOnRpbWVUYWtlbn0pKTsKICAgICAgaXNCZXN0PXRydWU7CiAgICB9CiAgfQogIHNob3dNb2RhbCh7CiAgICBlbW9qaTon8J+OiScsIHRpdGxlOidQdXp6bGUgU29sdmVkIScsCiAgICBtZXNzYWdlOiBpc0Jlc3Q/ICJOZXcgYmVzdCBzY29yZSBmb3IgdGhpcyBwaWN0dXJlISIgOiAiR3JlYXQgam9iIHBpZWNpbmcgdGhhdCB0b2dldGhlci4iLAogICAgc3RhdHM6WyB7bjpmb3JtYXRUaW1lKHRpbWVUYWtlbiksbDonVElNRSd9LCB7bjptb3ZlcyxsOidNT1ZFUyd9IF0sCiAgICBidXR0b25zOlsKICAgICAge2xhYmVsOidQbGF5IEFnYWluJywgcHJpbWFyeTp0cnVlLCBhY3Rpb246KCk9PnsgY2xvc2VNb2RhbCgpOyBzdGFydEdhbWUoYWN0aXZlRGlmZik7IH19LAogICAgICB7bGFiZWw6J0Nob29zZSBOZXcgUGljdHVyZScsIGFjdGlvbjooKT0+eyBjbG9zZU1vZGFsKCk7IHJlbmRlclBpY3R1cmVzKGN1cnJlbnRDYXQpOyBzaG93KCdzY3JlZW4tcGljdHVyZXMnKTsgfX0sCiAgICAgIHtsYWJlbDonSG9tZScsIGFjdGlvbjooKT0+eyBjbG9zZU1vZGFsKCk7IHNob3coJ3NjcmVlbi1ob21lJyk7IH19LAogICAgXQogIH0pOwogIGNvbmZldHRpQnVyc3QoKTsKfQoKZnVuY3Rpb24gb25UaW1lVXAoKXsKICBBdWRpbzEuZmFpbCgpOwogIHNob3dNb2RhbCh7CiAgICBlbW9qaTon4o+wJywgdGl0bGU6IlRpbWUncyBVcCEiLAogICAgbWVzc2FnZToiRG9uJ3Qgd29ycnkg4oCUIGV2ZXJ5IHB1enpsZSBtYXN0ZXIgc3RhcnRlZCBzb21ld2hlcmUuIEdpdmUgaXQgYW5vdGhlciBnby4iLAogICAgc3RhdHM6WyB7bjptb3ZlcyxsOidNT1ZFUyBNQURFJ30gXSwKICAgIGJ1dHRvbnM6WwogICAgICB7bGFiZWw6J1JldHJ5JywgcHJpbWFyeTp0cnVlLCBhY3Rpb246KCk9PnsgY2xvc2VNb2RhbCgpOyBzdGFydEdhbWUoYWN0aXZlRGlmZik7IH19LAogICAgICB7bGFiZWw6J0NoYW5nZSBEaWZmaWN1bHR5JywgYWN0aW9uOigpPT57IGNsb3NlTW9kYWwoKTsgb3BlbkRpZmZpY3VsdHlTY3JlZW4oKTsgfX0sCiAgICAgIHtsYWJlbDonSG9tZScsIGFjdGlvbjooKT0+eyBjbG9zZU1vZGFsKCk7IHNob3coJ3NjcmVlbi1ob21lJyk7IH19LAogICAgXQogIH0pOwp9CgovKiBwYXVzZSAqLwpkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYnRuLXBhdXNlJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCgpPT57CiAgcGF1c2VkPXRydWU7CiAgY29uc3Qgb3ZlcmxheT1kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTsKICBvdmVybGF5LmNsYXNzTmFtZT0ncGF1c2VkLW92ZXJsYXknOwogIG92ZXJsYXkuaWQ9J3BhdXNlLW92ZXJsYXknOwogIG92ZXJsYXkuaW5uZXJIVE1MPWA8aDI+4o+4IFBhdXNlZDwvaDI+PGJ1dHRvbiBjbGFzcz0iYnRuIGJ0bi1wcmltYXJ5IiBpZD0iYnRuLXJlc3VtZSI+UmVzdW1lPC9idXR0b24+YDsKICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKG92ZXJsYXkpOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdidG4tcmVzdW1lJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCgpPT57CiAgICBwYXVzZWQ9ZmFsc2U7CiAgICBvdmVybGF5LnJlbW92ZSgpOwogIH0pOwp9KTsKCi8qIGhpbnQ6IGJyaWVmbHkgcmV2ZWFscyBmdWxsIGltYWdlICovCmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdidG4taGludCcpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywoKT0+ewogIGNvbnN0IGJvYXJkPWRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdib2FyZCcpOwogIGJvYXJkLnN0eWxlLnRyYW5zaXRpb249J29wYWNpdHkgLjJzIGVhc2UnOwogIGNvbnN0IGltZz1kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTsKICBpbWcuc3JjPWN1cnJlbnRJbWFnZVVSTDsKICBpbWcuc3R5bGUucG9zaXRpb249J2Fic29sdXRlJzsgaW1nLnN0eWxlLmluc2V0PScwJzsgaW1nLnN0eWxlLndpZHRoPScxMDAlJzsgaW1nLnN0eWxlLmhlaWdodD0nMTAwJSc7CiAgaW1nLnN0eWxlLm9iamVjdEZpdD0nY292ZXInOyBpbWcuc3R5bGUuYm9yZGVyUmFkaXVzPScxMHB4JzsgaW1nLnN0eWxlLnpJbmRleD0nNSc7CiAgY29uc3QgZnJhbWU9Ym9hcmQucGFyZW50RWxlbWVudDsKICBmcmFtZS5zdHlsZS5wb3NpdGlvbj0ncmVsYXRpdmUnOwogIGZyYW1lLmFwcGVuZENoaWxkKGltZyk7CiAgc2V0VGltZW91dCgoKT0+aW1nLnJlbW92ZSgpLDEyMDApOwp9KTsKCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICA3LiBNT0RBTCArIENPTkZFVFRJCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpmdW5jdGlvbiBzaG93TW9kYWwoe2Vtb2ppLHRpdGxlLG1lc3NhZ2Usc3RhdHMsYnV0dG9uc30pewogIGNvbnN0IGJnPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpOwogIGJnLmNsYXNzTmFtZT0nbW9kYWwtYmcnOyBiZy5pZD0nYWN0aXZlLW1vZGFsJzsKICBjb25zdCBzdGF0c0h0bWw9KHN0YXRzfHxbXSkubWFwKHM9PmA8ZGl2IGNsYXNzPSJzdGF0LWJveCI+PGRpdiBjbGFzcz0ibiI+JHtzLm59PC9kaXY+PGRpdiBjbGFzcz0ibCI+JHtzLmx9PC9kaXY+PC9kaXY+YCkuam9pbignJyk7CiAgY29uc3QgYnRuc0h0bWw9KGJ1dHRvbnN8fFtdKS5tYXAoKGIsaSk9PmA8YnV0dG9uIGNsYXNzPSJidG4gJHtiLnByaW1hcnk/J2J0bi1wcmltYXJ5JzonYnRuLXNlY29uZGFyeSd9IiBkYXRhLWk9IiR7aX0iPiR7Yi5sYWJlbH08L2J1dHRvbj5gKS5qb2luKCcnKTsKICBiZy5pbm5lckhUTUw9YDxkaXYgY2xhc3M9Im1vZGFsIj4KICAgIDxkaXYgY2xhc3M9ImJpZy1lbW9qaSI+JHtlbW9qaX08L2Rpdj4KICAgIDxoMj4ke3RpdGxlfTwvaDI+CiAgICA8cD4ke21lc3NhZ2V9PC9wPgogICAgPGRpdiBjbGFzcz0ic3RhdC1yb3ciPiR7c3RhdHNIdG1sfTwvZGl2PgogICAgPGRpdiBjbGFzcz0ibW9kYWwtYnRucyI+JHtidG5zSHRtbH08L2Rpdj4KICA8L2Rpdj5gOwogIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoYmcpOwogIGJnLnF1ZXJ5U2VsZWN0b3JBbGwoJy5idG4nKS5mb3JFYWNoKChlbCxpKT0+ewogICAgZWwuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCgpPT5idXR0b25zW2ldLmFjdGlvbigpKTsKICB9KTsKfQpmdW5jdGlvbiBjbG9zZU1vZGFsKCl7CiAgY29uc3QgbT1kb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYWN0aXZlLW1vZGFsJyk7CiAgaWYobSkgbS5yZW1vdmUoKTsKfQoKZnVuY3Rpb24gY29uZmV0dGlCdXJzdCgpewogIGNvbnN0IGxheWVyPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpOwogIGxheWVyLmNsYXNzTmFtZT0nY29uZmV0dGktbGF5ZXInOwogIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQobGF5ZXIpOwogIGNvbnN0IGNvbG9ycz1bJyNGRkI4NEMnLCcjM0REQzk3JywnI0ZGNUQ4RicsJyM1REE5RkYnLCcjRkZFMDY2J107CiAgZm9yKGxldCBpPTA7aTw2MDtpKyspewogICAgY29uc3QgYz1kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTsKICAgIGMuY2xhc3NOYW1lPSdjb25mZXR0aSc7CiAgICBjLnN0eWxlLmxlZnQ9TWF0aC5yYW5kb20oKSoxMDArJ3Z3JzsKICAgIGMuc3R5bGUuYmFja2dyb3VuZD1jb2xvcnNbaSVjb2xvcnMubGVuZ3RoXTsKICAgIGMuc3R5bGUuYW5pbWF0aW9uRHVyYXRpb249KDIrTWF0aC5yYW5kb20oKSoxLjUpKydzJzsKICAgIGMuc3R5bGUuYW5pbWF0aW9uRGVsYXk9KE1hdGgucmFuZG9tKCkqMC40KSsncyc7CiAgICBsYXllci5hcHBlbmRDaGlsZChjKTsKICB9CiAgc2V0VGltZW91dCgoKT0+bGF5ZXIucmVtb3ZlKCksNDAwMCk7Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICA4LiBNVVRFIFRPR0dMRVMKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCmZ1bmN0aW9uIHdpcmVNdXRlQnV0dG9uKGJ0bil7CiAgYnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywoKT0+ewogICAgQXVkaW8xLmVuc3VyZSgpOwogICAgY29uc3Qgbm93TXV0ZWQ9IUF1ZGlvMS5tdXRlZDsKICAgIEF1ZGlvMS5zZXRNdXRlZChub3dNdXRlZCk7CiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcjYnRuLW11dGUtaG9tZSwjYnRuLW11dGUtZ2FtZScpLmZvckVhY2goYj0+Yi50ZXh0Q29udGVudCA9IG5vd011dGVkPyfwn5SHJzon8J+UiicpOwogICAgaWYoIW5vd011dGVkKSBBdWRpbzEuc3RhcnRCZ20oKTsKICB9KTsKfQp3aXJlTXV0ZUJ1dHRvbihkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYnRuLW11dGUtaG9tZScpKTsKd2lyZU11dGVCdXR0b24oZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2J0bi1tdXRlLWdhbWUnKSk7CgovKiBmaXJzdCB1c2VyIGludGVyYWN0aW9uIHVubG9ja3MgYXVkaW8gKyBzdGFydHMgYW1iaWVudCBiZ20gb24gaG9tZSBzY3JlZW4gKi8KbGV0IGF1ZGlvU3RhcnRlZD1mYWxzZTsKZG9jdW1lbnQuYm9keS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsZnVuY3Rpb24gdW5sb2NrKCl7CiAgaWYoYXVkaW9TdGFydGVkKSByZXR1cm47CiAgYXVkaW9TdGFydGVkPXRydWU7CiAgQXVkaW8xLmVuc3VyZSgpOwogIEF1ZGlvMS5zdGFydEJnbSgpOwp9LHtvbmNlOnRydWV9KTsKCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICA5LiBJTklUCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpyZW5kZXJDYXRlZ29yaWVzKCk7Cgp9KSgpOwo8L3NjcmlwdD4KPC9ib2R5Pgo8L2h0bWw+Cg==";
function openGame(which){
  const meta = which==='mosaic'
    ? { title:'💎 موزیک بلاکس — Mosaic Blocks', src:GAME_MOSAIC_B64 }
    : which==='zen'
    ? { title:'➕ زیرو زین — Zero Zen', src:GAME_ZEN_B64 }
    : which==='puzzle'
    ? { title:'🧩 پزل پکچر — Picture Puzzle', src:GAME_PUZZLE_B64 }
    : { title:'➤ ایرو فلو — Arrow Flow', src:GAME_ARROW_B64 };
  document.getElementById('gp-title').textContent = meta.title;
  const frame = document.getElementById('game-frame');
  frame.srcdoc = _b64ToUtf8(meta.src);
  document.getElementById('game-player').classList.add('open');
}
function closeGame(){
  document.getElementById('game-player').classList.remove('open');
  const frame = document.getElementById('game-frame');
  frame.srcdoc = '<!DOCTYPE html><html><body></body></html>';
  frame.src = 'about:blank';
}


// ══════════════════════════════
//  PROFIT REPORT
// ══════════════════════════════
function renderReport(){
  const yr=parseInt(document.getElementById('rpt-year').value)||new Date().getFullYear();
  const months=['جنوری','فروری','مارچ','اپریل','مئی','جون','جولائی','اگست','ستمبر','اکتوبر','نومبر','دسمبر'];

  let totalCollected=0,totalProfit=0,totalCusts=0;
  const rows=months.map((mn,mi)=>{
    const key=`${yr}-${String(mi+1).padStart(2,'0')}`;
    let collected=0,custSet=new Set();
    customers.forEach(c=>c.payments.forEach(p=>{
      if((p.date||'').startsWith(key)){collected+=p.amount;custSet.add(c.id);}
    }));
    const stockCost=stock.filter(s=>(s.addedAt||'').startsWith(key)).reduce((s,x)=>s+(x.cost*x.qty),0);
    const profit=collected-stockCost;
    totalCollected+=collected;totalProfit+=profit;totalCusts+=custSet.size;
    return {mn,collected,stockCost,profit,custs:custSet.size};
  });

  document.getElementById('rpt-summary').innerHTML=`
    <div class="sum-box"><div class="sv" style="font-size:14px">Rs.${fmt(totalCollected)}</div><div class="sl">کل وصولی</div></div>
    <div class="sum-box" style="border-left:1px solid var(--bd)"><div class="sv" style="font-size:14px;color:var(--g2)">Rs.${fmt(totalProfit)}</div><div class="sl">کل منافع</div></div>
    <div class="sum-box" style="border-left:1px solid var(--bd)"><div class="sv">${totalCusts}</div><div class="sl">ادائیگیاں</div></div>`;

  document.getElementById('rpt-tbody').innerHTML=rows.map(r=>`
    <tr>
      <td>${r.mn}</td>
      <td${r.collected>0?' style="color:var(--p1);font-weight:700"':''}>Rs. ${fmt(r.collected)}</td>
      <td>Rs. ${fmt(r.stockCost)}</td>
      <td style="color:${r.profit>=0?'var(--g2)':'var(--r2)'};font-weight:700">Rs. ${fmt(r.profit)}</td>
      <td>${r.custs}</td>
    </tr>`).join('');

  renderReportBarChart(rows);
}

// Pure CSS/HTML bar chart — no chart.js/canvas dependency so it can never
// break on Android WebView / offline-file loads.
function renderReportBarChart(rows){
  const el = document.getElementById('rpt-graph');
  if(!el) return;
  const maxVal = Math.max(1, ...rows.map(r=>r.collected));
  const shortMn = ['جن','فر','مار','اپر','مئی','جون','جول','اگ','ستم','اکت','نوم','دسم'];
  el.innerHTML = rows.map((r,i)=>{
    const h = Math.round((r.collected/maxVal)*130);
    const isPeak = r.collected===maxVal && maxVal>1;
    return `<div class="bar-chart-col${isPeak?' is-peak':''}">
      ${r.collected>0?`<div class="bar-chart-val">${r.collected>=1000?Math.round(r.collected/1000)+'K':fmt(r.collected)}</div>`:''}
      <div class="bar-chart-bar" style="height:${Math.max(h,r.collected>0?4:0)}px;"></div>
      <div class="bar-chart-lbl">${shortMn[i]}</div>
    </div>`;
  }).join('');
}
function initReport(){
  const sel=document.getElementById('rpt-year');
  const cur=new Date().getFullYear();
  sel.innerHTML='';
  for(let y=cur;y>=cur-3;y--){
    const o=document.createElement('option');
    o.value=y;o.textContent=y;
    sel.appendChild(o);
  }
  // Default the collection date-range to "this month so far".
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const fromEl = document.getElementById('rpt-from');
  const toEl   = document.getElementById('rpt-to');
  if(fromEl && !fromEl.value) fromEl.value = firstOfMonth.toISOString().split('T')[0];
  if(toEl   && !toEl.value)   toEl.value   = now.toISOString().split('T')[0];

  showReportView(1);
  renderReport();
  renderCollectionRange();
  renderDefaulterLedger();
  renderBusinessOverview();
}

// ── VIEW SWITCHER ──────────────────────────────────────────────
function showReportView(n){
  for(let i=1;i<=3;i++){
    const panel = document.getElementById('rpt-view-'+i);
    const btn   = document.getElementById('rpt-tab-btn-'+i);
    if(panel) panel.style.display = (i===n) ? 'block' : 'none';
    if(btn){ btn.classList.toggle('bp', i===n); btn.classList.toggle('ba', i!==n); }
  }
  if(n===2) renderDefaulterLedger();
  if(n===3) renderBusinessOverview();
}

// ── VIEW 1 (part 2): collection total over a chosen date range ──
function renderCollectionRange(){
  const fromEl = document.getElementById('rpt-from');
  const toEl   = document.getElementById('rpt-to');
  const el     = document.getElementById('rpt-range-summary');
  if(!fromEl || !toEl || !el) return;
  const from = fromEl.value ? new Date(fromEl.value) : null;
  const to   = toEl.value   ? new Date(toEl.value)   : null;
  if(to) to.setHours(23,59,59,999); // include the whole "to" day

  let total = 0, count = 0;
  const custSet = new Set();
  customers.forEach(c=>c.payments.forEach(p=>{
    const d = new Date(p.date || p.time);
    if((!from || d>=from) && (!to || d<=to)){
      total += p.amount;
      count++;
      custSet.add(c.id);
    }
  }));

  el.innerHTML = `
    <div class="sum-box"><div class="sv" style="color:var(--g2)">Rs.${fmt(total)}</div><div class="sl">کل وصولی (منتخب مدت)</div></div>
    <div class="sum-box" style="border-right:1px solid var(--bd)"><div class="sv">${count}</div><div class="sl">ادائیگیاں / ${custSet.size} کسٹمرز</div></div>`;
}

// ── VIEW 2: Pending / Defaulter Ledger ───────────────────────────
function renderDefaulterLedger(){
  const summaryEl = document.getElementById('rpt-defaulter-summary');
  const listEl    = document.getElementById('rpt-defaulter-list');
  if(!summaryEl || !listEl) return;

  const today = new Date(); today.setHours(0,0,0,0);
  const defaulters = [];
  customers.filter(c=>c.status==='active').forEach(c=>{
    const paid = c.payments.reduce((s,p)=>s+p.amount,0);
    const rem  = Math.max(0, c.mobile.remaining - paid);
    const paidCount = c.payments.length;
    const startD = new Date(c.mobile.startDate || new Date());
    const nextDue = new Date(startD);
    nextDue.setMonth(nextDue.getMonth()+paidCount+1);
    nextDue.setDate(c.mobile.dueDay || 10);
    const diffDays = Math.floor((today-nextDue)/(1000*60*60*24));
    if(diffDays > 0){ // genuinely missed the due date
      defaulters.push({c, rem, diffDays, nextDue});
    }
  });
  defaulters.sort((a,b)=>b.diffDays-a.diffDays);

  const totalPending = defaulters.reduce((s,x)=>s+x.rem,0);
  summaryEl.innerHTML = `
    <div class="sum-box"><div class="sv" style="color:var(--r2)">${defaulters.length}</div><div class="sl">نادہندہ کسٹمرز</div></div>
    <div class="sum-box" style="border-right:1px solid var(--bd)"><div class="sv" style="color:var(--r2)">Rs.${fmt(totalPending)}</div><div class="sl">کل بقایا مارکیٹ رقم</div></div>`;

  if(!defaulters.length){
    listEl.innerHTML = '<div class="empty"><div class="empty-ico"><i class="fa-solid fa-circle-check"></i></div><p>کوئی نادہندہ کسٹمر نہیں!</p></div>';
    return;
  }
  listEl.innerHTML = defaulters.map(({c,rem,diffDays,nextDue})=>{
    const dd = nextDue.getDate()+'/'+(nextDue.getMonth()+1)+'/'+nextDue.getFullYear();
    return `<div class="pitem" style="cursor:pointer;" onclick="showDetail(${c.id})">
      <div>
        <div style="font-weight:700;">${c.name}</div>
        <div class="pdate">${c.mobile.model} | <i class="fa-solid fa-phone"></i> ${c.phone} | واجب: ${dd}</div>
      </div>
      <div style="text-align:left;">
        <span class="pamt" style="color:var(--r2);">Rs. ${fmt(rem)}</span>
        <div style="font-size:11px;color:var(--r2);font-weight:700;">${diffDays} دن تاخیر</div>
      </div>
    </div>`;
  }).join('');
}

// ── VIEW 3: Business Overview ────────────────────────────────────
function renderBusinessOverview(){
  const el = document.getElementById('rpt-overview-grid');
  if(!el) return;

  const activeAgreements = customers.filter(c=>c.status==='active').length;
  const totalAgreements  = customers.length;
  const totalCapital     = customers.reduce((s,c)=>s+(c.mobile.price||0), 0); // capital invested in mobiles sold on installment
  const stockCapital     = stock.reduce((s,x)=>s+((x.cost||0)*(x.qty||0)), 0); // capital sitting in unsold stock
  const totalCollected   = customers.reduce((s,c)=>s+c.payments.reduce((ss,p)=>ss+p.amount,0), 0);
  const totalMarkup      = customers.reduce((s,c)=>s+(c.mobile.markup||0), 0); // total profit margin built into all agreements
  const totalRemaining   = customers.reduce((s,c)=>{
    const paid = c.payments.reduce((ss,p)=>ss+p.amount,0);
    return s + Math.max(0, c.mobile.remaining - paid);
  }, 0);

  const cards = [
    { label:'فعال معاہدے',        val: activeAgreements, color:'var(--p1)' },
    { label:'کل معاہدے (تمام وقت)', val: totalAgreements,  color:'var(--t1)' },
    { label:'کل سرمایہ کاری (موبائل)', val: 'Rs.'+fmt(totalCapital), color:'#6A1B9A' },
    { label:'اسٹاک میں سرمایہ',    val: 'Rs.'+fmt(stockCapital), color:'#00897B' },
    { label:'کل وصولی',            val: 'Rs.'+fmt(totalCollected), color:'var(--g2)' },
    { label:'کل منافع مارجن',      val: 'Rs.'+fmt(totalMarkup), color:'#FF6F00' },
    { label:'باقی وصولی (مارکیٹ میں)', val: 'Rs.'+fmt(totalRemaining), color:'var(--r2)' },
  ];
  el.innerHTML = cards.map((c,i)=>`
    <div class="sum-box" style="${i%2===0?'border-left:1px solid var(--bd);':''}${i>=2?'border-top:1px solid var(--bd);':''}padding:14px 10px;">
      <div class="sv" style="font-size:15px;color:${c.color};">${c.val}</div>
      <div class="sl">${c.label}</div>
    </div>`).join('');
}

// ══════════════════════════════
//  EXCEL EXPORT
// ══════════════════════════════
function exportExcel(type){
  let csv='',filename='';
  if(type==='customers'){
    filename='customers.csv';
    csv='نام,فون,CNIC,پتہ,موبائل,قیمت,ایڈوانس,ماہانہ,مہینے,اسٹیٹس\n';
    customers.forEach(c=>{
      csv+=`"${c.name}","${c.phone}","${c.cnic||''}","${c.addr||''}","${c.mobile.model}",${c.mobile.price},${c.mobile.advance},${c.mobile.monthly},${c.mobile.months},${c.status}\n`;
    });
  } else if(type==='payments'){
    filename='payments.csv';
    csv='کسٹمر,موبائل,رقم,تاریخ,نوٹ\n';
    customers.forEach(c=>c.payments.forEach(p=>{
      csv+=`"${c.name}","${c.mobile.model}",${p.amount},"${p.date||''}","${p.note||''}"\n`;
    }));
  } else {
    filename='stock.csv';
    csv='ماڈل,خریداری قیمت,فروخت قیمت,تعداد,IMEI,رنگ\n';
    stock.forEach(s=>{
      csv+=`"${s.model}",${s.cost},${s.price},${s.qty},"${s.imei||''}","${s.color||''}"\n`;
    });
  }
  const bom='\uFEFF';
  const blob=new Blob([bom+csv],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=filename;a.click();
  showToast('<i class="fa-solid fa-circle-check"></i> Excel فائل ڈاؤنلوڈ ہو گئی!');
}


// ══════════════════════════════
//  CUSTOMER AGREEMENT
// ══════════════════════════════
let agreementCust=null;
function showAgreement(id){
  const c=customers.find(x=>x.id===id);
  if(!c)return;
  agreementCust=c;
  const today=new Date();
  const dateStr=`${today.getDate()}/${today.getMonth()+1}/${today.getFullYear()}`;
  const startD=new Date(c.mobile.startDate||today);
  const endD=new Date(startD);
  endD.setMonth(endD.getMonth()+c.mobile.months);
  const endStr=`${endD.getDate()}/${endD.getMonth()+1}/${endD.getFullYear()}`;

  // Build the item-detail rows using the saved category's field config
  // (falls back gracefully for customers saved before the category system existed).
  const _cfg = CATEGORY_CONFIG[c.mobile.category] || null;
  const _idLabel = (_cfg && _cfg.idLabel) ? _cfg.idLabel.replace(' (اختیاری)','') : 'سیریل / شناخت نمبر';
  const _extraLabels = { size:'سائز/کپیسٹی', inverter:'انورٹر', warranty:'وارنٹی', color:'کلر', condition:'کنڈیشن', regno:'رجسٹریشن نمبر', modelyear:'ماڈل سال', wood:'لکڑی کی قسم', fabric:'کپڑا', };
  const _extraRowsHtml = Object.entries(c.mobile.extra||{}).filter(([,v])=>v).map(([k,v])=>
    `<div style="padding:6px 12px;border-bottom:1px solid #eee;border-left:1px solid #eee;"><b>${_extraLabels[k]||k}:</b> ${v}</div>`
  ).join('');

  document.getElementById('agreement-body').innerHTML=`
  <div id="agreement-content" style="font-family:'Jameel Noori Nastaleeq',serif;direction:rtl;padding:16px;line-height:2.2;font-size:13px;">
    <div style="text-align:center;border-bottom:2px solid #000;padding-bottom:12px;margin-bottom:14px;">
      <div style="font-size:20px;font-weight:900;"><i class="fa-solid fa-mobile-screen-button"></i> ${shopProfile.name}</div>
      <div style="font-size:12px;"><i class="fa-solid fa-phone"></i> ${shopProfile.phone}${shopProfile.email?' | '+shopProfile.email:''}</div>
      ${shopProfile.address?`<div style="font-size:12px;">📍 ${shopProfile.address}</div>`:''}
      <div style="font-size:16px;font-weight:800;margin-top:6px;">قسط معاہدہ فارم</div>
      <div style="font-size:12px;">تاریخ: ${dateStr}${c.grNo?` &nbsp;|&nbsp; رجسٹریشن نمبر: <b>${_formatGr(c.grNo)}</b>`:''}</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:12px;">
      <div style="border:1px solid #ccc;padding:6px 10px;"><b>خریدار کا نام:</b><br>${c.name}</div>
      <div style="border:1px solid #ccc;padding:6px 10px;"><b>موبائل نمبر:</b><br>${c.phone}</div>
      <div style="border:1px solid #ccc;padding:6px 10px;"><b>CNIC:</b><br>${c.cnic||'—'}</div>
      <div style="border:1px solid #ccc;padding:6px 10px;"><b>پتہ:</b><br>${c.addr||'—'}</div>
      ${c.guarantor?.name?`
      <div style="border:1px solid #ccc;padding:6px 10px;"><b>ضامن کا نام:</b><br>${c.guarantor.name}</div>
      <div style="border:1px solid #ccc;padding:6px 10px;"><b>ضامن کا نمبر:</b><br>${c.guarantor.phone||'—'}</div>`:``}
    </div>
    <div style="border:2px solid #000;border-radius:6px;overflow:hidden;margin-bottom:12px;">
      <div style="background:#0A2472;color:#fff;padding:8px 12px;font-weight:800;text-align:center;font-size:14px;">آئٹم کی تفصیل</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;">
        <div style="padding:6px 12px;border-bottom:1px solid #eee;border-left:1px solid #eee;"><b>کیٹیگری:</b> ${c.mobile.category||c.mobile.itemType||'—'}</div>
        <div style="padding:6px 12px;border-bottom:1px solid #eee;"><b>آئٹم:</b> ${c.mobile.item||c.mobile.itemType||'—'}</div>
        ${c.mobile.itemBrand?`<div style="padding:6px 12px;border-bottom:1px solid #eee;border-left:1px solid #eee;"><b>کمپنی/برانڈ:</b> ${c.mobile.itemBrand}</div>`:''}
        ${c.mobile.itemSpec?`<div style="padding:6px 12px;border-bottom:1px solid #eee;${c.mobile.itemBrand?'':'border-left:1px solid #eee;'}"><b>رام/اسٹوریج:</b> ${c.mobile.itemSpec}</div>`:''}
        <div style="padding:6px 12px;border-bottom:1px solid #eee;border-left:1px solid #eee;"><b>ماڈل نمبر/نام:</b> ${c.mobile.model||'—'}</div>
        <div style="padding:6px 12px;border-bottom:1px solid #eee;"><b>اصل قیمت:</b> Rs.${fmt(c.mobile.price)}</div>
        ${c.mobile.imei?`<div style="padding:6px 12px;border-bottom:1px solid #eee;border-left:1px solid #eee;${c.mobile.engineNo?'':'grid-column:1/-1;'}"><b>${_idLabel}:</b> ${c.mobile.imei}</div>`:''}
        ${c.mobile.engineNo?`<div style="padding:6px 12px;border-bottom:1px solid #eee;"><b>انجن نمبر:</b> ${c.mobile.engineNo}</div>`:''}
        ${_extraRowsHtml}
        <div style="padding:6px 12px;border-bottom:1px solid #eee;border-left:1px solid #eee;"><b>ایڈوانس:</b> Rs.${fmt(c.mobile.advance)}</div>
        <div style="padding:6px 12px;border-bottom:1px solid #eee;"><b>کل قیمت:</b> Rs.${fmt(c.mobile.total||c.mobile.price)}</div>
        <div style="padding:6px 12px;border-bottom:1px solid #eee;border-left:1px solid #eee;"><b>مہینے:</b> ${c.mobile.months}</div>
        <div style="padding:6px 12px;border-bottom:1px solid #eee;"><b>ماہانہ قسط:</b> Rs.${fmt(c.mobile.monthly)}</div>
        <div style="padding:6px 12px;border-left:1px solid #eee;"><b>آغاز:</b> ${c.mobile.startDate||dateStr}</div>
        <div style="padding:6px 12px;"><b>اختتام:</b> ${endStr}</div>
      </div>
    </div>
    ${tcEmbedEnabled ? `<div style="border:1px solid #ccc;padding:10px 12px;margin-bottom:12px;font-size:12px;border-radius:4px;background:#fffef0;">
      <b>شرائط و ضوابط:</b><br>${termsConditions.replace(/\n/g,'<br>')}
    </div>` : ''}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px;text-align:center;">
      <div style="padding-top:6px;">
        ${c.signatures?.customer ? `<img src="${c.signatures.customer}" style="max-height:70px;max-width:100%;border-bottom:1px solid #000;padding-bottom:4px;">` : `<div style="border-top:1px solid #000;padding-top:6px;"></div>`}
        <div style="margin-top:4px;"><b>خریدار کے دستخط</b><br><small>${c.name}</small></div>
      </div>
      <div style="padding-top:6px;">
        ${c.signatures?.shopkeeper ? `<img src="${c.signatures.shopkeeper}" style="max-height:70px;max-width:100%;border-bottom:1px solid #000;padding-bottom:4px;">` : `<div style="border-top:1px solid #000;padding-top:6px;"></div>`}
        <div style="margin-top:4px;"><b>دکاندار کے دستخط</b><br><small>${shopProfile.name}</small></div>
      </div>
    </div>
  </div>`;
  openMod('mod-agreement');
}
// ── Renders #agreement-content into a real PDF file (works even
// inside Android WebView apps, where window.print() often does
// nothing because the WebView has no print handler at all). ──
async function _generateAgreementPdfBlob(){
  const content=document.getElementById('agreement-content');
  if(!content || typeof html2canvas==='undefined' || !window.jspdf) return null;
  const canvas = await html2canvas(content, {scale:2, useCORS:true, backgroundColor:'#ffffff'});
  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF('p','pt','a4');
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const imgW = pageW;
  const imgH = canvas.height * imgW / canvas.width;
  let heightLeft = imgH, position = 0;
  pdf.addImage(imgData,'JPEG',0,position,imgW,imgH);
  heightLeft -= pageH;
  while(heightLeft > 0){
    position = heightLeft - imgH;
    pdf.addPage();
    pdf.addImage(imgData,'JPEG',0,position,imgW,imgH);
    heightLeft -= pageH;
  }
  return pdf.output('blob');
}
async function printAgreement(){
  const content=document.getElementById('agreement-content');
  if(!content)return;
  showToast('<i class="fa-solid fa-spinner fa-spin"></i> پرنٹ تیار ہو رہا ہے...');
  try{
    const blob = await _generateAgreementPdfBlob();
    if(blob){
      const url = URL.createObjectURL(blob);
      const win = window.open(url, '_blank');
      if(win){
        setTimeout(()=>URL.revokeObjectURL(url), 60000);
        return;
      }
      // popup blocked — fall back to a direct download so the user
      // can open it in their PDF viewer and print from there.
      const a=document.createElement('a');
      a.href=url; a.download='Agreement.pdf'; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(()=>URL.revokeObjectURL(url), 60000);
      showToast('<i class="fa-solid fa-file-pdf"></i> PDF ڈاؤن لوڈ ہو گئی — اسے کھول کر پرنٹ کریں');
      return;
    }
  }catch(e){ console.error(e); }
  // last-resort fallback: old browser print (works on desktop browsers)
  let pa=document.getElementById('print-area');
  pa.innerHTML=content.outerHTML;
  window.print();
}
// ── "PDF بھیجیں" — builds a real PDF (with both signatures) and
// hands it to the device share sheet so the user can attach it
// directly inside WhatsApp (or any other app). ──
async function sendAgreementPDFviaWhatsApp(){
  if(!agreementCust)return;
  showToast('<i class="fa-solid fa-spinner fa-spin"></i> PDF تیار ہو رہا ہے...');
  try{
    const blob = await _generateAgreementPdfBlob();
    if(!blob){ showToast('❌ PDF نہیں بن سکی، دوبارہ کوشش کریں', 'warn'); return; }
    const fileName = `Agreement-${(agreementCust.name||'Customer').replace(/[^a-zA-Z0-9ا-ی ]/g,'')}.pdf`;
    const file = new File([blob], fileName, {type:'application/pdf'});
    if(navigator.canShare && navigator.canShare({files:[file]})){
      await navigator.share({
        files:[file],
        title: `${shopProfile.name} — قسط معاہدہ`,
        text: `${agreementCust.name} کے لیے قسط معاہدہ`
      });
    } else {
      // Web Share API with files not available — download the PDF so
      // it can be attached manually, then open WhatsApp chat as well.
      const url = URL.createObjectURL(blob);
      const a=document.createElement('a');
      a.href=url; a.download=fileName; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(()=>URL.revokeObjectURL(url), 60000);
      showToast('<i class="fa-solid fa-file-pdf"></i> PDF ڈاؤن لوڈ ہو گئی — واٹس ایپ چیٹ میں اٹیچ کر کے بھیج دیں');
      shareAgreement();
    }
  }catch(e){
    console.error(e);
    showToast('❌ PDF بھیجنے میں مسئلہ ہوا', 'warn');
  }
}
// ── For customers whose number doesn't have WhatsApp — sends the
// same agreement summary as a normal SMS to the same number. ──
function shareAgreementSMS(){
  if(!agreementCust)return;
  const c=agreementCust;
  let txt = `${shopProfile.name} — قسط معاہدہ\n\n`;
  txt += `نام: ${c.name}\nنمبر: ${c.phone}\n`;
  if(c.cnic) txt += `CNIC: ${c.cnic}\n`;
  txt += `ماڈل: ${c.mobile.model}\n`;
  if(c.mobile.imei) txt += `سیریل نمبر: ${c.mobile.imei}\n`;
  txt += `اصل قیمت: Rs.${fmt(c.mobile.price)}\nایڈوانس: Rs.${fmt(c.mobile.advance)}\nکل قیمت: Rs.${fmt(c.mobile.total||c.mobile.price)}\nماہانہ قسط: Rs.${fmt(c.mobile.monthly)}\nمدت: ${c.mobile.months} ماہ\nآغاز: ${c.mobile.startDate||''}\n`;
  txt += `\n${shopProfile.name}: ${shopProfile.phone}`;
  const n=(c.wa||c.phone).replace(/[^0-9]/g,'');
  const num = n.startsWith('92') ? '0'+n.slice(2) : n;
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const smsUrl = isIOS ? `sms:${num}&body=${encodeURIComponent(txt)}` : `sms:${num}?body=${encodeURIComponent(txt)}`;
  // Assigning window.location.href directly is unreliable inside
  // Android WebView-wrapped apps (the sms: scheme often isn't
  // intercepted). Clicking a real anchor is handled more consistently.
  let opened = false;
  try{
    const a=document.createElement('a');
    a.href=smsUrl;
    a.style.display='none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    opened = true;
  }catch(e){ console.error(e); }
  // Always also copy the message, so if the SMS app doesn't open
  // automatically the user can still paste it in manually.
  setTimeout(()=>{
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(txt).then(()=>{
        showToast(`<i class="fa-solid fa-copy"></i> پیغام کاپی ہو گیا — اگر SMS ایپ خودکار نہ کھلے تو نمبر ${num} پر خود پیسٹ کر کے بھیج دیں`);
      }).catch(()=>{});
    } else if(!opened){
      showToast('❌ SMS نہیں کھل سکا — نمبر '+num+' پر خود پیغام بھیج دیں', 'warn');
    }
  }, 350);
}
function shareAgreement(){
  if(!agreementCust)return;
  const c=agreementCust;
  let txt = `<i class="fa-solid fa-mobile-screen-button"></i> *${shopProfile.name} — قسط معاہدہ*\n\n`;
  txt += `<i class="fa-solid fa-user"></i> *کسٹمر کی تفصیل*\n`;
  txt += `نام: ${c.name}\nنمبر: ${c.phone}\n`;
  if(c.cnic) txt += `CNIC: ${c.cnic}\n`;
  if(c.addr) txt += `پتہ: ${c.addr}\n`;
  if(c.guarantor?.name){
    txt += `\n🧑‍<i class="fa-solid fa-handshake"></i>‍🧑 *ضامن کی تفصیل*\n`;
    txt += `نام: ${c.guarantor.name}\n`;
    if(c.guarantor.phone) txt += `نمبر: ${c.guarantor.phone}\n`;
    if(c.guarantor.cnic)  txt += `CNIC: ${c.guarantor.cnic}\n`;
  }
  txt += `\n<i class="fa-solid fa-mobile-screen-button"></i> *موبائل کی تفصیل*\n`;
  txt += `ماڈل: ${c.mobile.model}\n`;
  if(c.mobile.imei) txt += `سیریل نمبر: ${c.mobile.imei}\n`;
  txt += `اصل قیمت: Rs.${fmt(c.mobile.price)}\nایڈوانس: Rs.${fmt(c.mobile.advance)}\nکل قیمت: Rs.${fmt(c.mobile.total||c.mobile.price)}\nماہانہ قسط: Rs.${fmt(c.mobile.monthly)}\nمدت: ${c.mobile.months} ماہ\nآغاز: ${c.mobile.startDate||''}\n`;
  if(tcEmbedEnabled){
    txt += `\n<i class="fa-solid fa-clipboard"></i> *شرائط و ضوابط*\n${termsConditions}\n`;
  }
  txt += `\n<i class="fa-solid fa-circle-check"></i> معاہدہ دونوں فریقین کے دستخط کے ساتھ محفوظ ہے\n<i class="fa-solid fa-phone"></i> ${shopProfile.name}: ${shopProfile.phone}`;
  const n=(c.wa||c.phone).replace(/[^0-9]/g,'');
  const i=n.startsWith('0')?'92'+n.slice(1):n;
  window.open(`https://wa.me/${i}?text=${encodeURIComponent(_cleanWaText(txt))}`,'_blank');
}

// ══════════════════════════════
//  WHATSAPP SCHEDULE REMINDER
//  Now routes through the dual-option modal (Text vs PDF/Media) instead
//  of firing WhatsApp text immediately.
// ══════════════════════════════
function sendScheduleReminder(id){
  openReminderChoice(id, 'schedule');
}

// ══════════════════════════════════════════════════════════════
// ── Override save() to trigger Firebase sync on every write ──
function save(){
  saveLocalData();
  const mobile = getSessionUid();
  if(mobile && (typeof _fbAutoSync === 'undefined' || _fbAutoSync)){
    _showSyncBadge('syncing');
    if(typeof fbSyncToCloud === 'function') fbSyncToCloud();
  }
}


function exportData(){ exportLocalJSON(); }

// ╔══════════════════════════════════════════════════════════════╗
//  BACKUP & RESTORE — Full Implementation
//  • Google Drive via GSI (google.accounts.oauth2) + Drive REST v3
//  • Local JSON export / import with FileReader
//  • CSV export
//  • Auto-sync on every save()
// ╚══════════════════════════════════════════════════════════════╝

/* ─── Config ─────────────────────────────────────────────────── */
const BACKUP_FILE_NAME  = 'shop_backup.json';
const DRIVE_SCOPE       = 'https://www.googleapis.com/auth/drive.appdata';
const DRIVE_UPLOAD_URL  = 'https://www.googleapis.com/upload/drive/v3/files';
const DRIVE_FILES_URL   = 'https://www.googleapis.com/drive/v3/files';

/* ─── State ──────────────────────────────────────────────────── */
let _gsiClient     = null;   // GSI token client instance
let _accessToken   = null;   // current OAuth bearer token
let _tokenExpiry   = 0;      // timestamp ms when token expires
let _autoTimer     = null;   // handle for 24-h interval
let _pendingImport = null;   // data waiting for user confirmation

/* ════════════════════════════════════════════════════════════════
   GOOGLE SCRIPTS — load GSI lazily (no blocking <script> in head)
   ════════════════════════════════════════════════════════════════ */
function _loadGSI(){
  return new Promise((resolve, reject)=>{
    if(window.google?.accounts?.oauth2){ resolve(); return; }
    const s = document.createElement('script');
    s.src   = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload  = resolve;
    s.onerror = ()=> reject(new Error('GSI script failed to load'));
    document.head.appendChild(s);
  });
}

/* ════════════════════════════════════════════════════════════════
   TOKEN HELPERS
   ════════════════════════════════════════════════════════════════ */
function _saveToken(access_token, expires_in){
  _accessToken = access_token;
  _tokenExpiry = Date.now() + (expires_in || 3600) * 1000 - 60000; // 1-min buffer
  localStorage.setItem('sms_gtoken', JSON.stringify({ access_token, expires_at: _tokenExpiry }));
}
function _loadToken(){
  try{
    const t = JSON.parse(localStorage.getItem('sms_gtoken') || 'null');
    if(t && t.access_token && t.expires_at > Date.now()){
      _accessToken = t.access_token;
      _tokenExpiry = t.expires_at;
    }
  } catch(e){}
}
function _clearToken(){
  _accessToken = null; _tokenExpiry = 0;
  localStorage.removeItem('sms_gtoken');
}
function _tokenOK(){ return !!_accessToken && Date.now() < _tokenExpiry; }
function _getClientId(){ return (localStorage.getItem('sms_gclientid') || '').trim(); }
function _authHeader(){ return { Authorization: 'Bearer ' + _accessToken }; }

/* ════════════════════════════════════════════════════════════════
   GOOGLE SIGN-IN  (GSI implicit flow — no redirect)
   ════════════════════════════════════════════════════════════════ */
async function gDriveSignIn(){
  const cid = _getClientId();
  if(!cid){ _openClientIdModal(); return; }

  // Show spinner while loading GSI
  _uiShowSigningIn(true);
  try{
    await _loadGSI();
  } catch(e){
    _uiShowSigningIn(false);
    showToast('<i class="fa-solid fa-circle-xmark"></i> Google script لوڈ نہ ہوا۔ انٹرنیٹ چیک کریں', 'warn');
    return;
  }

  _gsiClient = google.accounts.oauth2.initTokenClient({
    client_id : cid,
    scope     : DRIVE_SCOPE,
    callback  : (response)=>{
      _uiShowSigningIn(false);
      if(response.error){
        showToast('<i class="fa-solid fa-circle-xmark"></i> Sign-in ناکام: ' + response.error, 'warn');
        return;
      }
      _saveToken(response.access_token, response.expires_in);
      _onSignedIn();
    }
  });

  // 'consent' shows account-picker every time; use '' for silent if already granted
  _gsiClient.requestAccessToken({ prompt: 'consent' });
}

/* After successful sign-in: update UI + maybe start auto-backup */
function _onSignedIn(){
  _updateGDriveUI(true);
  showToast('<i class="fa-solid fa-circle-check"></i> Google Drive سے منسلک!');
  updateStatusBar();
  // restore auto-backup toggle state
  const tog = document.getElementById('auto-backup-toggle');
  const wasOn = localStorage.getItem('sms_auto_backup') === '1';
  if(tog) tog.checked = wasOn;
  if(wasOn) startAutoBackup();
}

/* ─── Sign Out ───────────────────────────────────────────────── */
function gDriveSignOut(){
  if(_accessToken && window.google?.accounts?.oauth2){
    try{ google.accounts.oauth2.revoke(_accessToken, ()=>{}); } catch(e){}
  }
  _clearToken();
  stopAutoBackup();
  _updateGDriveUI(false);
  showToast('<i class="fa-solid fa-hand"></i> Google Drive سے منقطع ہو گئے');
}

/* ─── UI helpers ─────────────────────────────────────────────── */
function _uiShowSigningIn(loading){
  const btn = document.getElementById('btn-gdrive-signin');
  if(!btn) return;
  btn.disabled = loading;
  btn.innerHTML = loading
    ? '<span style="animation:spin 1s linear infinite;display:inline-block"><i class="fa-solid fa-arrows-rotate"></i></span> Connecting…'
    : '<span style="font-size:18px;">🔑</span> Sign in with Google';
}

function _updateGDriveUI(isConnected){
  const show = (id, display)=>{
    const el = document.getElementById(id);
    if(el) el.style.display = display;
  };
  show('btn-gdrive-signin',  isConnected ? 'none'  : 'flex');
  show('btn-gdrive-backup',  isConnected ? 'flex'  : 'none');
  show('btn-gdrive-restore', isConnected ? 'flex'  : 'none');
  show('gdrive-auto-row',    isConnected ? 'block' : 'none');
  show('btn-gdrive-signout', isConnected ? 'flex'  : 'none');

  // Status dot colour
  const dot = document.getElementById('backup-status-dot');
  if(dot) dot.style.background = isConnected ? '#43A047' : '#ccc';
}

/* ════════════════════════════════════════════════════════════════
   STATUS BAR
   ════════════════════════════════════════════════════════════════ */
function updateStatusBar(){
  const ts  = localStorage.getItem('sms_last_backup_ts');
  const el  = document.getElementById('last-backup-txt');
  if(!el) return;
  if(!ts){ el.textContent = 'ابھی تک کوئی بیک اپ نہیں'; return; }
  const mins = Math.floor((Date.now() - parseInt(ts)) / 60000);
  const label = mins < 1     ? 'ابھی ابھی'
              : mins < 60    ? mins + ' منٹ پہلے'
              : mins < 1440  ? Math.floor(mins / 60) + ' گھنٹے پہلے'
              :                Math.floor(mins / 1440) + ' دن پہلے';
  el.textContent = 'آخری بیک اپ: ' + label;
}
// legacy alias
function updateBackupStatusBar(){ updateStatusBar(); }

/* ════════════════════════════════════════════════════════════════
   SYNC BADGE  — subtle top-centre toast for cloud events
   ════════════════════════════════════════════════════════════════ */
function _showSyncBadge(state /* 'syncing' | 'done' | 'error' */){
  let b = document.getElementById('cloud-sync-badge');
  if(!b){
    b = document.createElement('div');
    b.id = 'cloud-sync-badge';
    b.style.cssText = [
      'position:fixed','top:68px','left:50%','transform:translateX(-50%)',
      'background:rgba(26,115,232,0.94)','color:#fff',
      'padding:5px 16px','border-radius:20px',
      'font-size:11px','font-weight:700','letter-spacing:.5px',
      'z-index:9998','backdrop-filter:blur(8px)',
      'box-shadow:0 4px 16px rgba(26,115,232,0.45)',
      'display:flex','align-items:center','gap:6px',
      'transition:opacity .4s'
    ].join(';');
    document.body.appendChild(b);
  }
  b.style.opacity = '1';
  if(state === 'syncing'){
    b.innerHTML = '<span style="animation:spin 1s linear infinite;display:inline-block"><i class="fa-solid fa-arrows-rotate"></i></span>&nbsp;Syncing to Cloud…';
  } else if(state === 'done'){
    b.style.background = 'rgba(46,125,50,0.94)';
    b.innerHTML = '<i class="fa-solid fa-cloud"></i> &nbsp;Synced to Cloud ✓';
    setTimeout(()=>{ b.style.opacity='0'; setTimeout(()=>{ try{b.remove();}catch(e){} }, 450); }, 2800);
  } else {
    b.style.background = 'rgba(198,40,40,0.94)';
    b.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> &nbsp;Sync Failed';
    setTimeout(()=>{ b.style.opacity='0'; setTimeout(()=>{ try{b.remove();}catch(e){} }, 450); }, 3500);
  }
}

/* ════════════════════════════════════════════════════════════════
   BUILD BACKUP PAYLOAD
   ════════════════════════════════════════════════════════════════ */
function buildBackupData(){
  return {
    version         : 2,
    appName         : 'Shahid Mobile Shop',
    exportedAt      : new Date().toISOString(),
    customers       : typeof customers   !== 'undefined' ? customers   : [],
    stock           : typeof stock       !== 'undefined' ? stock       : [],
    shopNames       : typeof shopNames   !== 'undefined' ? shopNames   : {},
    shopProfile     : typeof shopProfile !== 'undefined' ? shopProfile : {},
    reminderTemplates: typeof reminderTemplates !== 'undefined' ? reminderTemplates : {},
  };
}

/* ════════════════════════════════════════════════════════════════
   CORE — syncDataToGoogleDrive(data?)
   Called automatically on every save(), and manually via button.
   Uses multipart upload so metadata (filename + parent) and file
   content are sent in one request.
   ════════════════════════════════════════════════════════════════ */
async function syncDataToGoogleDrive(jsonData){
  if(!_tokenOK()) return; // silently skip if not signed in

  const payload  = JSON.stringify(jsonData || buildBackupData(), null, 0);
  const token    = _accessToken;
  const boundary = 'sms_mpart_' + Date.now();

  try{
    /* ─── 1. Find existing file id ─── */
    const listRes = await fetch(
      `${DRIVE_FILES_URL}?spaces=appDataFolder&q=name%3D%27${BACKUP_FILE_NAME}%27&fields=files(id)`,
      { headers: _authHeader() }
    );
    if(!listRes.ok) throw new Error('Drive list: HTTP ' + listRes.status);
    const listJson = await listRes.json();
    const existingId = listJson.files && listJson.files.length ? listJson.files[0].id : null;

    /* ─── 2. Build multipart body ─── */
    const meta     = JSON.stringify({
      name    : BACKUP_FILE_NAME,
      mimeType: 'application/json',
      ...(existingId ? {} : { parents: ['appDataFolder'] })
    });
    const body = [
      `--${boundary}`,
      'Content-Type: application/json; charset=UTF-8',
      '',
      meta,
      `--${boundary}`,
      'Content-Type: application/json',
      '',
      payload,
      `--${boundary}--`
    ].join('\r\n');

    /* ─── 3. Upload (PATCH if exists, POST if new) ─── */
    const uploadUrl = existingId
      ? `${DRIVE_UPLOAD_URL}/${existingId}?uploadType=multipart`
      : `${DRIVE_UPLOAD_URL}?uploadType=multipart`;
    const method = existingId ? 'PATCH' : 'POST';

    const upRes = await fetch(uploadUrl, {
      method,
      headers: {
        ...(_authHeader()),
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body
    });
    if(!upRes.ok) throw new Error('Drive upload: HTTP ' + upRes.status);

    /* ─── 4. Success ─── */
    localStorage.setItem('sms_last_backup_ts', Date.now().toString());
    updateStatusBar();
    _showSyncBadge('done');

  } catch(err){
    console.warn('[GDrive sync]', err.message);
    _showSyncBadge('error');
  }
}

/* ─── Manual upload button ───────────────────────────────────── */
async function gDriveUpload(){
  if(!_tokenOK()){
    showToast('<i class="fa-solid fa-triangle-exclamation"></i> پہلے Google Sign In کریں', 'warn');
    return;
  }
  _showSyncBadge('syncing');
  await syncDataToGoogleDrive();
}

/* ─── Restore from Drive ─────────────────────────────────────── */
async function gDriveRestore(){
  if(!_tokenOK()){
    showToast('<i class="fa-solid fa-triangle-exclamation"></i> پہلے Google Sign In کریں', 'warn');
    return;
  }
  _showGDriveProgress('<i class="fa-solid fa-magnifying-glass"></i>', 'Searching Google Drive…', 'Looking for backup.json');
  try{
    const token = _accessToken;

    /* find the file */
    const lRes = await fetch(
      `${DRIVE_FILES_URL}?spaces=appDataFolder&q=name%3D%27${BACKUP_FILE_NAME}%27&fields=files(id,modifiedTime,size)`,
      { headers: _authHeader() }
    );
    if(!lRes.ok) throw new Error('HTTP ' + lRes.status);
    const lJson = await lRes.json();

    if(!lJson.files || !lJson.files.length){
      _closeGDriveProgress();
      showToast('<i class="fa-solid fa-circle-xmark"></i> Google Drive میں کوئی بیک اپ نہیں ملا', 'warn');
      return;
    }
    const f = lJson.files[0];
    _updateGDriveProgressText('<i class="fa-solid fa-download"></i>', 'Downloading backup…', `Modified: ${new Date(f.modifiedTime).toLocaleString()} | ${Math.round((f.size||0)/1024)} KB`);

    /* download content */
    const dRes = await fetch(
      `${DRIVE_FILES_URL}/${f.id}?alt=media`,
      { headers: _authHeader() }
    );
    if(!dRes.ok) throw new Error('HTTP ' + dRes.status);
    const data = await dRes.json();

    _closeGDriveProgress();

    /* validate */
    if(!Array.isArray(data.customers)) throw new Error('Invalid backup: customers missing');

    _pendingImport = data;
    document.getElementById('import-confirm-info').innerHTML =
      `<i class="fa-solid fa-cloud"></i> <b>Google Drive بیک اپ ملا</b><br>
       <i class="fa-solid fa-calendar-days"></i> ${new Date(f.modifiedTime).toLocaleString()}<br>
       <i class="fa-solid fa-users"></i> کسٹمرز: ${data.customers.length}<br>
       📦 اسٹاک: ${data.stock ? data.stock.length : 0}<br><br>
       <span style="color:#E65100;font-weight:700"><i class="fa-solid fa-triangle-exclamation"></i> موجودہ تمام ڈیٹا مٹ جائے گا!</span>`;
    openMod('mod-import-confirm');

  } catch(err){
    _closeGDriveProgress();
    showToast('<i class="fa-solid fa-circle-xmark"></i> Restore ناکام: ' + err.message, 'warn');
  }
}

/* ════════════════════════════════════════════════════════════════
   AUTO-BACKUP (24-hour interval)
   ════════════════════════════════════════════════════════════════ */
function toggleAutoBackup(on){
  _fbAutoSync = on; // drives the debounced real-time sync inside save()
  localStorage.setItem('sms_auto_sync', on ? '1' : '0');
  localStorage.setItem('sms_auto_backup', on ? '1' : '0');
  if(on){ startAutoBackup(); showToast('<i class="fa-solid fa-circle-check"></i> Auto Sync/Backup فعال'); }
  else  { stopAutoBackup();  showToast('🔕 Auto Sync/Backup بند'); }
}

function startAutoBackup(){
  stopAutoBackup();
  const lastTs  = parseInt(localStorage.getItem('sms_last_backup_ts') || '0');
  const elapsed = Date.now() - lastTs;
  const delay   = Math.max(10000, 86400000 - elapsed); // at least 10s

  _autoTimer = setTimeout(async()=>{
    if(_tokenOK()) await syncDataToGoogleDrive();
    _autoTimer = setInterval(async()=>{
      if(_tokenOK()) await syncDataToGoogleDrive();
    }, 86400000); // every 24 h
  }, delay);
}

function stopAutoBackup(){
  if(_autoTimer){ clearTimeout(_autoTimer); clearInterval(_autoTimer); _autoTimer = null; }
}

/* ════════════════════════════════════════════════════════════════
   GDrive auto-sync — piggy-backs on save() override above
   (Firebase override is declared earlier and is the active one)
   ════════════════════════════════════════════════════════════════ */
function _gdriveAutoSync(){
  if(_tokenOK()){
    _showSyncBadge('syncing');
    syncDataToGoogleDrive().catch(()=>{});
  }
}

/* ════════════════════════════════════════════════════════════════
   LOCAL EXPORT — JSON  (shop_backup.json)
   ════════════════════════════════════════════════════════════════ */
function exportLocalJSON(){
  const data     = buildBackupData();
  const jsonStr  = JSON.stringify(data, null, 2);
  const blob     = new Blob([jsonStr], { type: 'application/json' });
  const filename = 'shop_backup.json';

  // On mobile browsers that support Web Share API with files
  if(typeof navigator.canShare === 'function'){
    const file = new File([blob], filename, { type: 'application/json' });
    if(navigator.canShare({ files: [file] })){
      navigator.share({ files: [file], title: 'Shop Backup', text: 'Shahid Mobile Shop Backup' })
        .then(()=>{
          localStorage.setItem('sms_last_backup_ts', Date.now().toString());
          updateStatusBar();
          showToast('<i class="fa-solid fa-circle-check"></i> بیک اپ شیئر ہو گیا!');
        })
        .catch(()=> _triggerDownload(blob, filename));
      return;
    }
  }

  // Fallback: browser download
  _triggerDownload(blob, filename);
  localStorage.setItem('sms_last_backup_ts', Date.now().toString());
  updateStatusBar();
  showToast(`<i class="fa-solid fa-circle-check"></i> shop_backup.json ڈاؤنلوڈ ہو گئی (${data.customers.length} کسٹمرز)`);
}

/* ════════════════════════════════════════════════════════════════
   LOCAL EXPORT — CSV / Excel
   ════════════════════════════════════════════════════════════════ */
function exportLocalCSV(){
  const BOM = '\uFEFF';  // UTF-8 BOM so Excel reads Urdu correctly
  const header = ['نام','فون','CNIC','آئٹم ماڈل','قیمت','ایڈوانس','ماہانہ قسط','مہینے','ادا شدہ','باقی','اسٹیٹس'].join(',');
  const rows = (typeof customers !== 'undefined' ? customers : []).map(c =>{
    const paid = c.payments.reduce((s, p) => s + p.amount, 0);
    const rem  = Math.max(0, (c.mobile.remaining || 0) - paid);
    return [
      `"${c.name}"`,
      `"${c.phone}"`,
      `"${c.cnic  || ''}"`,
      `"${c.mobile.model}"`,
      c.mobile.price,
      c.mobile.advance,
      c.mobile.monthly,
      c.mobile.months,
      paid,
      rem,
      c.status
    ].join(',');
  });

  const csv  = BOM + header + '\n' + rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  _triggerDownload(blob, `customers_${new Date().toISOString().split('T')[0]}.csv`);
  showToast('<i class="fa-solid fa-circle-check"></i> CSV فائل ڈاؤنلوڈ ہو گئی!');
}

/* ════════════════════════════════════════════════════════════════
   LOCAL IMPORT — FileReader
   ════════════════════════════════════════════════════════════════ */
function importLocalJSON(event){
  const file = event.target.files[0];
  event.target.value = '';   // reset so same file can be re-selected

  if(!file){ return; }

  // Extension check
  if(!file.name.toLowerCase().endsWith('.json')){
    showToast('<i class="fa-solid fa-circle-xmark"></i> صرف .json فائل قبول ہوگی', 'warn');
    return;
  }
  // Size guard (20 MB max)
  if(file.size > 20 * 1024 * 1024){
    showToast('<i class="fa-solid fa-circle-xmark"></i> فائل بہت بڑی ہے (max 20 MB)', 'warn');
    return;
  }

  const reader = new FileReader();

  reader.onload = (e) => {
    let data;
    try{
      data = JSON.parse(e.target.result);
    } catch(parseErr){
      showToast('<i class="fa-solid fa-circle-xmark"></i> JSON parse خرابی: ' + parseErr.message, 'warn');
      return;
    }

    // Content validation
    if(!data || typeof data !== 'object'){
      showToast('<i class="fa-solid fa-circle-xmark"></i> فائل کا فارمیٹ غلط ہے', 'warn');
      return;
    }
    if(!Array.isArray(data.customers)){
      showToast('<i class="fa-solid fa-circle-xmark"></i> بیک اپ فائل میں customers نہیں ملے', 'warn');
      return;
    }

    _pendingImport = data;

    // Show confirmation modal with details
    const el = document.getElementById('import-confirm-info');
    if(el){
      el.innerHTML =
        `📁 <b>${file.name}</b> (${Math.round(file.size/1024)} KB)<br>
         <i class="fa-solid fa-users"></i> کسٹمرز: ${data.customers.length}<br>
         📦 اسٹاک: ${Array.isArray(data.stock) ? data.stock.length : 0}<br>
         <i class="fa-solid fa-calendar-days"></i> بیک اپ: ${data.exportedAt ? new Date(data.exportedAt).toLocaleString() : 'نامعلوم'}<br><br>
         <span style="color:#E65100;font-weight:700"><i class="fa-solid fa-triangle-exclamation"></i> موجودہ تمام ڈیٹا مٹ کر اس سے replace ہو جائے گا!</span>`;
    }
    openMod('mod-import-confirm');
  };

  reader.onerror = () => showToast('<i class="fa-solid fa-circle-xmark"></i> فائل پڑھنے میں خرابی ہوئی', 'warn');
  reader.readAsText(file, 'utf-8');
}

/* ─── Confirmed: overwrite localStorage & reload views ────────── */
function confirmImport(){
  if(!_pendingImport){ closeMod('mod-import-confirm'); return; }

  try{
    const d = _pendingImport;

    // Restore customers
    customers = Array.isArray(d.customers) ? d.customers : [];
    localStorage.setItem('sms2_customers', JSON.stringify(customers));

    // Restore stock (optional field)
    if(Array.isArray(d.stock)){
      stock = d.stock;
      localStorage.setItem('sms_stock', JSON.stringify(stock));
    }

    // Restore shop name (optional field)
    if(d.shopNames && typeof d.shopNames === 'object'){
      shopNames = d.shopNames;
      localStorage.setItem('sms_shopnames', JSON.stringify(shopNames));
      if(typeof applyShopName === 'function') applyShopName();
    }

    // Restore shop/profile settings (optional field)
    if(d.shopProfile && typeof d.shopProfile === 'object'){
      shopProfile = Object.assign({}, shopProfile, d.shopProfile);
      localStorage.setItem('sms_shop_profile', JSON.stringify(shopProfile));
      if(typeof applyShopProfile === 'function') applyShopProfile();
    }

    // Restore reminder templates (optional field)
    if(d.reminderTemplates && typeof d.reminderTemplates === 'object'){
      reminderTemplates = { ...DEFAULT_REMINDER_TEMPLATES, ...d.reminderTemplates };
      localStorage.setItem('sms_reminder_templates', JSON.stringify(reminderTemplates));
      if(typeof renderReminders === 'function') renderReminders();
    }

    _pendingImport = null;
    closeMod('mod-import-confirm');

    // Refresh all views
    if(typeof renderDash      === 'function') renderDash();
    if(typeof renderAlerts    === 'function') renderAlerts();
    if(typeof renderCustomers === 'function') renderCustomers();
    if(typeof renderReminders === 'function') renderReminders();
    updateStatusBar();

    showToast(`<i class="fa-solid fa-circle-check"></i> ڈیٹا بحال ہو گیا! ${customers.length} کسٹمرز لوڈ ہوئے`);

  } catch(err){
    showToast('<i class="fa-solid fa-circle-xmark"></i> Import خرابی: ' + err.message, 'warn');
  }
}

/* ════════════════════════════════════════════════════════════════
   CLEAR ALL DATA
   ════════════════════════════════════════════════════════════════ */
function clearAllData(){
  if(!confirm('⚠️ تمام ڈیٹا مٹ جائے گا!\nپہلے Export کریں۔ جاری رکھنا ہے؟')) return;
  if(!confirm('آخری تنبیہ: تمام کسٹمرز، ادائیگیاں اور اسٹاک مستقل حذف ہو جائیں گے!')) return;

  customers = [];
  stock     = [];
  _origSave();
  localStorage.setItem('sms_stock', '[]');

  if(typeof renderDash      === 'function') renderDash();
  if(typeof renderAlerts    === 'function') renderAlerts();
  if(typeof renderCustomers === 'function') try{ renderCustomers(); }catch(e){}
  showToast('<i class="fa-solid fa-trash"></i> تمام ڈیٹا صاف ہو گیا', 'warn');
}

/* ════════════════════════════════════════════════════════════════
   CLIENT-ID MODAL
   (Opens inside existing #mod-agreement so no new DOM needed)
   ════════════════════════════════════════════════════════════════ */
function _openClientIdModal(){
  const savedCid = _getClientId();
  document.getElementById('agreement-body').innerHTML = `
    <div style="font-family:'Poppins',sans-serif;direction:ltr;padding:2px;">

      <!-- Header -->
      <div style="background:linear-gradient(135deg,#1A73E8,#0D47A1);border-radius:14px;padding:18px;color:#fff;text-align:center;margin-bottom:18px;">
        <div style="font-size:40px;margin-bottom:8px;"><i class="fa-solid fa-cloud"></i></div>
        <div style="font-weight:800;font-size:17px;letter-spacing:.3px;">Google Drive Setup</div>
        <div style="font-size:11px;opacity:.75;margin-top:4px;">One-time configuration</div>
      </div>

      <!-- Instructions -->
      <ol style="font-size:12px;color:#37474F;line-height:2.2;padding-left:18px;margin-bottom:16px;">
        <li>Go to <a href="https://console.cloud.google.com" target="_blank" style="color:#1A73E8;font-weight:700;">console.cloud.google.com</a></li>
        <li>Create a project → <b>APIs &amp; Services</b> → <b>Enable</b> Google Drive API</li>
        <li><b>Credentials</b> → <b>Create OAuth 2.0 Client ID</b> → Web Application</li>
        <li>Add your app's URL to <b>Authorized JavaScript Origins</b></li>
        <li>Copy the <b>Client ID</b> and paste below</li>
      </ol>

      <!-- Warning -->
      <div style="background:#FFF3E0;border-left:3px solid #FF6F00;border-radius:8px;padding:10px 12px;margin-bottom:16px;font-size:11px;color:#E65100;">
        For APK builds add <code>file://</code> and <code>http://localhost</code> to Authorized Origins.
      </div>

      <!-- Input -->
      <label style="font-size:11px;font-weight:700;color:#0D47A1;display:block;margin-bottom:6px;">
        OAuth 2.0 Client ID:
      </label>
      <input
        id="gclient-input"
        type="text"
        value="${savedCid}"
        autocomplete="off"
        spellcheck="false"
        style="width:100%;padding:11px 13px;border:1.5px solid #BBDEFB;border-radius:9px;font-size:12px;direction:ltr;box-sizing:border-box;outline:none;font-family:monospace;"
        placeholder="000000000000-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com"
        oninput="document.getElementById('gclient-err').textContent=''">
      <div id="gclient-err" style="color:#E53935;font-size:11px;min-height:18px;margin:5px 0 14px;"></div>

      <!-- Buttons -->
      <div style="display:flex;gap:10px;">
        <button
          onclick="_applyClientId()"
          style="flex:1;padding:9px;background:linear-gradient(135deg,#1A73E8,#0D47A1);color:#fff;border:none;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;letter-spacing:.3px;">
          <i class="fa-solid fa-floppy-disk"></i> Save &amp; Connect
        </button>
        <button
          onclick="closeMod('mod-agreement')"
          style="flex:1;padding:9px;background:#ECEFF1;color:#546E7A;border:none;border-radius:10px;font-size:12px;font-weight:600;cursor:pointer;">
          ✕ Cancel
        </button>
      </div>

      <!-- Tip -->
      <div style="margin-top:14px;padding:10px 13px;background:#E8F5E9;border-left:3px solid #43A047;border-radius:8px;font-size:11px;color:#2E7D32;">
        💡 <b>Tip:</b> Without Google, Local Export/Import provides complete offline backup!
      </div>
    </div>`;
  openMod('mod-agreement');
}

function _applyClientId(){
  const input = document.getElementById('gclient-input');
  const errEl = document.getElementById('gclient-err');
  const val   = (input ? input.value : '').trim();

  if(!val){
    if(errEl) errEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Client ID خالی نہیں چھوڑ سکتے';
    return;
  }
  if(!val.endsWith('.apps.googleusercontent.com')){
    if(errEl) errEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> درست Client ID .apps.googleusercontent.com پر ختم ہوتی ہے';
    return;
  }

  localStorage.setItem('sms_gclientid', val);
  closeMod('mod-agreement');
  showToast('<i class="fa-solid fa-circle-check"></i> Client ID محفوظ! Google Sign-In شروع ہو رہا ہے…');
  setTimeout(gDriveSignIn, 350);
}

/* ════════════════════════════════════════════════════════════════
   GDRIVE PROGRESS MODAL HELPERS
   ════════════════════════════════════════════════════════════════ */
function _showGDriveProgress(icon, title, sub){
  const el = document.getElementById('mod-gdrive-progress');
  if(!el) return;
  const iEl = document.getElementById('gdrive-progress-icon');
  const tEl = document.getElementById('gdrive-progress-txt');
  const sEl = document.getElementById('gdrive-progress-sub');
  if(iEl) iEl.innerHTML = icon;
  if(tEl) tEl.textContent = title;
  if(sEl) sEl.textContent = sub;
  el.classList.add('open');
}
function _updateGDriveProgressText(icon, title, sub){ _showGDriveProgress(icon, title, sub); }
function _closeGDriveProgress(){
  const el = document.getElementById('mod-gdrive-progress');
  if(el) el.classList.remove('open');
}
// public aliases used in HTML onclick attrs
function showGDriveProgress(i,t,s){ _showGDriveProgress(i,t,s); }
function closeGDriveProgress(){ _closeGDriveProgress(); }

/* ─── Download blob helper ───────────────────────────────────── */
function _triggerDownload(blob, filename){
  const a = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 2000);
}
// legacy alias
function downloadFile(blob, name){ _triggerDownload(blob, name); }

/* ════════════════════════════════════════════════════════════════
   INIT — called once at app startup
   ════════════════════════════════════════════════════════════════ */
function initBackupUI(){
  _loadToken();           // restore token from localStorage
  updateStatusBar();      // show last-backup time
  _updateGDriveUI(_tokenOK()); // show/hide buttons based on token

  // Restore auto-backup if previously enabled
  if(_tokenOK() && localStorage.getItem('sms_auto_backup') === '1'){
    startAutoBackup();
  }

  // Silent re-auth: if Client ID is saved but token expired, try silently
  if(!_tokenOK() && _getClientId()){
    _loadGSI().then(()=>{
      if(!window.google?.accounts?.oauth2) return;
      const silentClient = google.accounts.oauth2.initTokenClient({
        client_id : _getClientId(),
        scope     : DRIVE_SCOPE,
        prompt    : '',   // empty = no dialog if already authorized
        callback  : (resp)=>{
          if(resp.error) return; // silently ignore; user can manually sign in
          _saveToken(resp.access_token, resp.expires_in);
          _updateGDriveUI(true);
          if(localStorage.getItem('sms_auto_backup') === '1') startAutoBackup();
          updateStatusBar();
        }
      });
      silentClient.requestAccessToken({ prompt: '' });
    }).catch(()=>{});
  }
}


// ══════════════════════════════
//  INIT
// ══════════════════════════════
document.getElementById('m-start').value = new Date().toISOString().split('T')[0];
document.getElementById('pay-date').value = new Date().toISOString().split('T')[0];
selectPlan(6, document.querySelectorAll('.plan-card')[2]);
if(typeof onCategoryChange === 'function') onCategoryChange();
_refreshGrBadge();

applyDark();
applyThemeColor(currentThemeIdx);
if(localStorage.getItem('sms_lang') === 'en'){ isUrdu = false; }
applyLang();
applyShopName();
applyShopProfile();
// ── Immediately show local data from localStorage ──
// This runs BEFORE Firebase loads so the dashboard is never empty.
// Firebase will merge/overwrite with cloud data in the background.
renderDash();
renderCustomers();
renderAlerts();

// ── Logo injection (splash screen only — header logo is now pure CSS) ──
const _splashLogoEl = document.getElementById('auth-splash-logo');
if(_splashLogoEl) _splashLogoEl.src = SM_PRO_LOGO_B64;

// ── Auth & Firebase (non-blocking) ──
// initAuthOverlay respects cached session — won't hide dashboard if
// the user was already logged in.
initAuthOverlay();
initBackupUI();

// Load Firebase after the UI is already visible (non-blocking)
setTimeout(()=>{ loadFirebaseSDK(); }, 100);

_navInit();
_updatePinUI();
