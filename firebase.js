//  FIREBASE CONFIG & INIT
// ══════════════════════════════════════════════════════════════
const firebaseConfig = {
  apiKey:            "AIzaSyDH4h8WeHDnqUh3_6naPAHUxxyBT5Xy12I",
  authDomain:        "webandapp-feadb.firebaseapp.com",
  projectId:         "webandapp-feadb",
  storageBucket:     "webandapp-feadb.firebasestorage.app",
  messagingSenderId: "373116824221",
  appId:             "1:373116824221:web:77d437d2123a02c57e8274",
  databaseURL:       "https://webandapp-feadb-default-rtdb.firebaseio.com"
};

// ── FIREBASE SDK CHECK ────────────────────────────────────────
// The three compat scripts (app / database / auth) are now loaded as
// normal static <script> tags in <head>, so by the time this inline
// script runs, `firebase` is guaranteed to already exist (the browser/
// WebView blocks on <head> scripts before parsing the rest of the page).
// We keep the function name so the existing loadFirebaseSDK() call at
// the bottom of the file keeps working unchanged.
function _loadScript(src){
  return new Promise((resolve, reject)=>{
    const s = document.createElement('script');
    s.src = src;
    s.onload = ()=> resolve();
    s.onerror = ()=> reject(new Error('Failed to load ' + src));
    document.head.appendChild(s);
  });
}
async function loadFirebaseSDK(){
  if(typeof firebase === 'undefined'){
    // Head scripts failed to load (no internet / CDN blocked on first run).
    window._fbSdkOk = false;
    console.warn('Firebase SDK not present — running in offline/local-only mode.');
    showToast('<i class="fa-solid fa-triangle-exclamation"></i> Firebase لوڈ نہ ہو سکا — انٹرنیٹ چیک کریں', 'warn');
  } else {
    window._fbSdkOk = true;
  }
  _initFirebase();
}

// Init Firebase
let _fbApp = null, _fbAuth = null, _fbDb = null;
let _fbAutoSync = localStorage.getItem('sms_auto_sync') !== '0'; // default ON
let _fbSyncDebounce = null;
let _fbReady = false;

function _initFirebase(){
  // Guard: if the Firebase compat scripts failed to load (no internet,
  // CDN blocked, etc.) 'firebase' will not exist on window at all.
  if(window._fbSdkOk === false || typeof firebase === 'undefined'){
    console.warn('Firebase SDK did not load — running in offline/local-only mode.');
    return;
  }
  try{
    if(!firebase.apps.length){
      _fbApp  = firebase.initializeApp(firebaseConfig);
    } else {
      _fbApp  = firebase.app();
    }
    _fbAuth = firebase.auth();
    // Ensures password-reset (and other auth) emails are sent in the
    // device's own language/locale instead of Firebase's default —
    // part of making the reset email actually arrive/render correctly.
    try{ _fbAuth.useDeviceLanguage(); } catch(e){}
    _fbDb   = firebase.database();

    // Enable offline persistence (Android APK support)
    try{ _fbDb.goOnline(); } catch(e){}

    // ★ KEEP USER LOGGED IN — EXPLICIT LOCAL PERSISTENCE ★
    // Web's default is already LOCAL, but Android WebViews / some
    // packaged-APK wrappers (and file:// contexts) can silently fall
    // back to SESSION/NONE, wiping the login on every app close. Setting
    // this explicitly — and BEFORE attaching onAuthStateChanged — is
    // what guarantees the user's session and login ID persist across
    // full app restarts and never has to be re-entered.
    _fbAuth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
      .catch(e=>console.warn('Auth persistence set failed (will still work in-session):', e))
      .finally(()=> _attachAuthStateListener());
  } catch(e){
    console.warn('Firebase init error:', e);
  }
}

function _attachAuthStateListener(){
  try{
    // Monitor online/offline
    firebase.database().ref('.info/connected').on('value', snap=>{
      const online = snap.val() === true;
      _updateOnlineIndicator(online);
    });

    _fbReady = true;
    // Single source of truth for auth state: fires on fresh login/register,
    // on logout, and on page reload if a session is already persisted.
    let _authStateSeenOnce = false;
    _fbAuth.onAuthStateChanged(async (user)=>{
      const isFirstCallback = !_authStateSeenOnce;
      _authStateSeenOnce = true;

      if(user){
        localStorage.setItem('sms_session_uid', user.uid);
        localStorage.setItem('sms_session_email', user.email || '');
        const overlay = document.getElementById('auth-overlay');
        if(overlay) overlay.style.display = 'none';
        // ★ PIN APP-LOCK ★
        // Even though Firebase has restored the session, if the user has
        // switched on PIN lock we still gate the dashboard behind the
        // PIN screen before showing any data on screen.
        _maybeShowPinLock();
        _updatePinUI();
        await _hardLoginSync(user.uid, user.email);
        if(typeof showSc === 'function') showSc('dash');
      } else {
        // IMPORTANT: Firebase can fire this callback with `user === null`
        // ONCE, transiently, before it has finished restoring a persisted
        // session from disk — a well-known SDK quirk. If we treated that
        // as a real logout, we'd wipe all local customer data and boot
        // the user to the login screen even though they never logged
        // out — exactly matching "dashboard shows 0 despite data
        // existing". So: if this is the very first callback AND we have
        // a cached session from last time, give the real restore a short
        // grace period before believing it's a genuine logout.
        const cachedUid = localStorage.getItem('sms_session_uid');
        if(isFirstCallback && cachedUid){
          // Firebase sometimes fires null ONCE on startup before restoring
          // the real session — extend grace to 3s on mobile/slow connections.
          setTimeout(()=>{
            if(!_fbAuth.currentUser){
              // Still genuinely no session after grace — real logout.
              _doLoggedOutUI();
            }
            // else: real session callback already handled it above — do nothing.
          }, 3000);
          // IMPORTANT: keep showing whatever is in localStorage while waiting.
          // Do NOT hide the dashboard or reset data here.
          return;
        }
        // No cached session at all and not signed in → show login.
        _doLoggedOutUI();
      }
    });
  } catch(e){
    console.warn('Firebase auth-state listener error:', e);
  }
}

function _doLoggedOutUI(){
  // SAFETY: never wipe local data if customer records exist —
  // this guards against the Firebase "transient null" quirk on
  // app startup (SDK fires null once before restoring the session).
  const hadCustomers = customers.length > 0;

  localStorage.removeItem('sms_session_uid');
  localStorage.removeItem('sms_session_email');

  // Only clear data if we had none to begin with (genuine new logout).
  // If records exist, keep them so the user does not lose data.
  if(!hadCustomers){
    _resetLocalUserData();
  }
  _refreshAllViews();
  // Only force the fullscreen login overlay open if there's nothing to
  // show without it. If local data exists, stay on the dashboard —
  // forcing login here would hide correctly-rendered data behind the
  // login screen (same bug as initAuthOverlay had).
  if(!hadCustomers){
    const overlay = document.getElementById('auth-overlay');
    if(overlay) overlay.style.display = 'flex';
    showAuthMode('login');
  }
  _updatePinUI();
}

// Wait (with timeout) for Firebase to finish loading — used by login/register
// flows so a fresh page load doesn't race the dynamic SDK download.
function _waitForFb(timeoutMs){
  return new Promise(resolve=>{
    const start = Date.now();
    (function poll(){
      if(_fbReady || window._fbSdkOk === false) return resolve(_fbReady);
      if(Date.now() - start > (timeoutMs||6000)) return resolve(false);
      setTimeout(poll, 150);
    })();
  });
}

// ── ONLINE INDICATOR ────────────────────────────────────────
function _updateOnlineIndicator(online){
  const el = document.getElementById('fb-online-indicator');
  const dot = document.getElementById('backup-status-dot');
  const bar = document.getElementById('backup-status-bar');
  const icon = document.getElementById('backup-status-icon');
  const title = document.getElementById('backup-status-title');

  if(el){
    el.textContent = online ? '🟢 آن لائن' : '🔴 آف لائن';
  }
  if(getSessionUid()){
    if(online){
      if(dot) dot.style.background = '#43A047';
      if(bar) bar.style.background = 'linear-gradient(135deg,#E8F5E9,#F1F8E9)';
      if(icon) icon.innerHTML = '<i class="fa-solid fa-cloud"></i>';
      if(title){ title.innerHTML = 'Cloud Synced <i class="fa-solid fa-circle-check"></i>'; title.style.color = '#1B5E20'; }
    } else {
      if(dot) dot.style.background = '#FF6F00';
      if(bar) bar.style.background = 'linear-gradient(135deg,#FFF8E1,#FFF3E0)';
      if(icon) icon.textContent = '📴';
      if(title){ title.textContent = 'Offline ⏳ — ڈیٹا مقامی محفوظ'; title.style.color = '#E65100'; }
    }
  } else {
    if(dot) dot.style.background = '#ccc';
    if(icon) icon.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i>';
    if(title){ title.textContent = 'Cloud Sync Status'; title.style.color = '#0D47A1'; }
  }
}

// ══════════════════════════════
//  EMAIL + PASSWORD AUTH SYSTEM (Firebase Authentication)
// ══════════════════════════════
function togglePasswordVisibility(inputId, iconId){
  const input = document.getElementById(inputId);
  const icon = document.getElementById(iconId);
  if(!input) return;
  if(input.type === 'password'){
    input.type = 'text';
    if(icon){
      icon.classList.remove('fa-eye');
      icon.classList.add('fa-eye-slash');
    }
  } else {
    input.type = 'password';
    if(icon){
      icon.classList.remove('fa-eye-slash');
      icon.classList.add('fa-eye');
    }
  }
}

function getSessionUid(){ return localStorage.getItem('sms_session_uid') || null; }
function getSessionEmail(){ return localStorage.getItem('sms_session_email') || null; }
function _fbUserPath(uid){ return 'backups/users/' + uid; }

function _stripHtml(s){ return String(s||'').replace(/<[^>]*>/g, ''); }
function _friendlyAuthError(e){
  const code = (e && e.code) || '';
  const map = {
    'auth/email-already-in-use' : '<i class="fa-solid fa-triangle-exclamation"></i> یہ ای میل پہلے سے رجسٹرڈ ہے — لاگ ان کریں',
    'auth/invalid-email'        : '<i class="fa-solid fa-triangle-exclamation"></i> درست ای میل ایڈریس درج کریں',
    'auth/weak-password'        : '<i class="fa-solid fa-triangle-exclamation"></i> پاس ورڈ کم از کم 6 حروف کا ہونا چاہیے',
    'auth/user-not-found'       : '<i class="fa-solid fa-circle-xmark"></i> اکاؤنٹ نہیں ملا — پہلے رجسٹر کریں',
    'auth/wrong-password'       : '<i class="fa-solid fa-circle-xmark"></i> پاس ورڈ غلط ہے',
    'auth/invalid-credential'   : '<i class="fa-solid fa-circle-xmark"></i> ای میل یا پاس ورڈ غلط ہے',
    'auth/too-many-requests'    : '<i class="fa-solid fa-triangle-exclamation"></i> بہت زیادہ کوششیں — کچھ دیر بعد کوشش کریں',
    'auth/network-request-failed':'<i class="fa-solid fa-circle-xmark"></i> انٹرنیٹ کنیکشن چیک کریں',
  };
  return map[code] || ('<i class="fa-solid fa-circle-xmark"></i> ' + (e && e.message ? e.message : 'نامعلوم خرابی'));
}

// ── AUTH OVERLAY ──────────────────────────────────────────────
// Showing/hiding + data sync is driven by onAuthStateChanged once
// Firebase finishes loading (see _initFirebase). This just sets the
// default visible tab so there's no flash of the wrong form.
function initAuthOverlay(){
  // Only show the login overlay if there is genuinely no cached session
  // AND no local data on this device. A device that already has customer
  // records (added before logging in, or after Chrome cleared the
  // Firebase session/cookies) must NEVER be blocked from seeing its own
  // local data behind a mandatory login screen — that was causing
  // "dashboard shows 0 / customer list empty" even though the data was
  // sitting correctly in localStorage the whole time.
  const cachedUid = localStorage.getItem('sms_session_uid');
  const hasLocalData = customers.length > 0;
  const overlay   = document.getElementById('auth-overlay');
  if(cachedUid || hasLocalData){
    // Session exists, OR this device already has real data —
    // hide overlay and show dashboard with local data immediately.
    if(overlay) overlay.style.display = 'none';
    // Show local data immediately; Firebase will merge cloud data when ready.
    _refreshAllViews();
  } else {
    // No session ever AND no local data — genuinely a fresh device, show login.
    if(overlay) overlay.style.display = 'flex';
    showAuthMode('login');
  }
}

function showAuthMode(mode){
  ['login','register','forgot'].forEach(m=>{
    const el = document.getElementById('auth-' + m);
    if(el) el.style.display = (m===mode) ? 'flex' : 'none';
  });
  const err = document.getElementById('auth-error');
  if(err) err.textContent = '';
  const msg = document.getElementById('auth-forgot-msg');
  if(msg) msg.textContent = '';
}

const _EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── REGISTER ──────────────────────────────────────────────────
async function authRegister(){
  const email = (document.getElementById('auth-reg-email').value || '').trim();
  const pass  = document.getElementById('auth-reg-pass').value || '';
  const pass2 = document.getElementById('auth-reg-pass2').value || '';
  const err   = document.getElementById('auth-error');

  if(!_EMAIL_RE.test(email)){ err.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> درست ای میل ایڈریس درج کریں'; return; }
  if(pass.length < 6){ err.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> پاس ورڈ کم از کم 6 حروف کا ہونا چاہیے'; return; }
  if(pass !== pass2){ err.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> دونوں پاس ورڈ ایک جیسے نہیں ہیں'; return; }
  err.textContent = '⏳ انتظار کریں…';

  const fbOk = await _waitForFb(6000);
  if(!fbOk || !_fbAuth){ err.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> انٹرنیٹ کنیکشن چیک کریں'; return; }

  try{
    try{ await _fbAuth.setPersistence(firebase.auth.Auth.Persistence.LOCAL); }catch(e){}
    await _fbAuth.createUserWithEmailAndPassword(email, pass);
    showToast('<i class="fa-solid fa-circle-check"></i> اکاؤنٹ بن گیا! خوش آمدید');
    // onAuthStateChanged fires automatically from here and runs _hardLoginSync
  } catch(e){
    err.innerHTML = _friendlyAuthError(e);
  }
}

// ── LOGIN ─────────────────────────────────────────────────────
async function authLogin(){
  const email = (document.getElementById('auth-login-email').value || '').trim();
  const pass  = document.getElementById('auth-login-pass').value || '';
  const err   = document.getElementById('auth-error');

  if(!_EMAIL_RE.test(email)){ err.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> درست ای میل ایڈریس درج کریں'; return; }
  if(!pass){ err.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> پاس ورڈ درج کریں'; return; }
  err.textContent = '⏳ انتظار کریں…';

  const fbOk = await _waitForFb(6000);
  if(!fbOk || !_fbAuth){ err.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> انٹرنیٹ کنیکشن چیک کریں'; return; }

  try{
    // Belt-and-suspenders: re-assert LOCAL persistence immediately before
    // signing in, so the session is guaranteed to survive app close/reopen
    // even if init ran before the SDK was fully ready.
    try{ await _fbAuth.setPersistence(firebase.auth.Auth.Persistence.LOCAL); }catch(e){}
    await _fbAuth.signInWithEmailAndPassword(email, pass);
    showToast('<i class="fa-solid fa-hand"></i> خوش آمدید!');
    // onAuthStateChanged fires automatically from here and runs _hardLoginSync
  } catch(e){
    err.innerHTML = _friendlyAuthError(e);
  }
}

// ── FORGOT PASSWORD (Firebase sends the reset email itself) ───
function showForgotPassword(){ showAuthMode('forgot'); }

async function sendPasswordReset(){
  const email = (document.getElementById('auth-forgot-email').value || '').trim();
  const err   = document.getElementById('auth-error');
  const msg   = document.getElementById('auth-forgot-msg');
  if(!_EMAIL_RE.test(email)){ err.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> درست ای میل ایڈریس درج کریں'; return; }
  err.textContent = '';

  const fbOk = await _waitForFb(6000);
  if(!fbOk || !_fbAuth){ err.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> انٹرنیٹ کنیکشن چیک کریں'; return; }

  // Belt-and-suspenders: useDeviceLanguage() is already set once at
  // Firebase init, but re-assert it right before sending in case this
  // Auth instance was somehow re-created since then.
  try{ _fbAuth.useDeviceLanguage(); } catch(e){}

  try{
    // actionCodeSettings gives Firebase a valid, whitelisted continue URL
    // (your own authDomain) to embed in the reset link — without this,
    // some Firebase projects silently refuse to deliver the email as a
    // security precaution.
    const actionCodeSettings = {
      url: 'https://' + firebaseConfig.authDomain + '/',
      handleCodeInApp: false
    };
    await _fbAuth.sendPasswordResetEmail(email, actionCodeSettings);
    _passwordResetSucceeded(msg);
  } catch(e1){
    // If actionCodeSettings itself is the problem (e.g. the authDomain
    // isn't in the project's authorized-domains list yet), fall back to
    // the plain, no-frills call exactly as Firebase's own docs show it —
    // this alone is enough to send the email in the vast majority of
    // projects.
    console.warn('[password reset] actionCodeSettings attempt failed:', e1.code, e1.message);
    try{
      await _fbAuth.sendPasswordResetEmail(email);
      _passwordResetSucceeded(msg);
    } catch(e2){
      err.innerHTML = _friendlyAuthError(e2);
      // Surface the EXACT Firebase error so it can be debugged/reported
      // instead of only ever seeing a generic friendly message.
      alert('Password reset failed:\n\nCode: ' + (e2.code || 'unknown') + '\nMessage: ' + (e2.message || e2));
      console.error('[password reset] final failure:', e2);
    }
  }
}

function _passwordResetSucceeded(msg){
  const text = 'ری سیٹ لنک آپ کے ای میل پر بھیج دیا گیا ہے، اپنا اسپیم (Spam) فولڈر بھی چیک کریں';
  if(msg) msg.textContent = text;
  showToast('<i class="fa-solid fa-circle-check"></i> ' + text);
}

// ══════════════════════════════════════════════════════════════
//  ★ CRITICAL PRIVACY FIX ★
//  Wipes ALL of the previous user's app data from memory AND
//  localStorage. Used on logout, and as the very first step of
//  every login, so one account's data can never bleed into
//  another's — either on-screen or when it gets auto-synced up
//  to the new account's Firebase path.
// ══════════════════════════════════════════════════════════════
function _resetLocalUserData(){
  customers = [];
  stock = [];
  shopNames = { ur: 'شاہد موبائل شاپ', en: 'Shahid Mobile Shop', sub: 'INSTALLMENT MANAGEMENT SYSTEM' };
  shopProfile = { name: '', phone: '', address: '', email: '', logo: '', location: '', locationMapUrl: '' };
  reminderTemplates = { ...DEFAULT_REMINDER_TEMPLATES };

  localStorage.setItem('sms2_customers', '[]');
  localStorage.setItem('sms_stock', '[]');
  localStorage.setItem('sms_shopnames', JSON.stringify(shopNames));
  localStorage.setItem('sms_shop_profile', JSON.stringify(shopProfile));
  localStorage.setItem('sms_reminder_templates', JSON.stringify(reminderTemplates));
}

function _persistAllLocalData(){
  localStorage.setItem('sms2_customers', JSON.stringify(customers));
  localStorage.setItem('sms_stock', JSON.stringify(stock));
  localStorage.setItem('sms_shopnames', JSON.stringify(shopNames));
  localStorage.setItem('sms_shop_profile', JSON.stringify(shopProfile));
  localStorage.setItem('sms_reminder_templates', JSON.stringify(reminderTemplates));
}

function _refreshAllViews(){
  if(typeof renderDash === 'function') try{ renderDash(); }catch(e){}
  if(typeof renderAlerts === 'function') try{ renderAlerts(); }catch(e){}
  if(typeof renderCustomers === 'function') try{ renderCustomers(); }catch(e){}
  if(typeof renderReminders === 'function') try{ renderReminders(); }catch(e){}
  if(typeof applyShopName === 'function') try{ applyShopName(); }catch(e){}
  if(typeof applyShopProfile === 'function') try{ applyShopProfile(); }catch(e){}
  if(typeof updateStatusBar === 'function') try{ updateStatusBar(); }catch(e){}
  // Rebind "Collect Installment" dropdown + its detail labels to the
  // freshly-synced customers array — without this, the dropdown could
  // keep stale options after a Firebase login/merge and show dashes.
  if(typeof popPaySel === 'function' && document.getElementById('pay-sel')) try{ popPaySel(); }catch(e){}
  if(typeof renderPlanSummary === 'function') try{ renderPlanSummary(); }catch(e){}
}

// ── LOGOUT: hard reset, then blank UI back to Login Screen ─────
async function authLogout(){
  const ok = (typeof swalConfirm === 'function')
    ? await swalConfirm('لاگ آؤٹ کرنا ہے؟', 'آپ کا موجودہ لاگ ان سیشن ختم ہو جائے گا', 'warning', 'جی ہاں، لاگ آؤٹ کریں', 'منسوخ کریں')
    : confirm('لاگ آؤٹ کرنا ہے؟');
  if(!ok) return;

  // Stop any pending debounced sync from firing after we've wiped data
  if(_fbSyncDebounce) clearTimeout(_fbSyncDebounce);

  // 1. Completely wipe this user's data — memory + localStorage
  _resetLocalUserData();

  // 2. Force every screen to reflect the now-empty state
  _refreshAllViews();

  // 3. Clear the local session markers
  localStorage.removeItem('sms_session_uid');
  localStorage.removeItem('sms_session_email');
  const badge = document.getElementById('fb-user-badge');
  const info  = document.getElementById('fb-user-info');
  if(badge) badge.textContent = '';
  if(info)  info.innerHTML = '';

  // Also dismiss the PIN lock screen if it happened to be up
  const pinLock = document.getElementById('pin-lock-screen');
  if(pinLock) pinLock.style.display = 'none';

  showToast('<i class="fa-solid fa-hand"></i> لاگ آؤٹ ہو گیا — ڈیٹا صاف کر دیا گیا');

  // 4. Actually sign out of Firebase (onAuthStateChanged will also
  //    fire and confirm the blank state, harmless if it runs twice)
  if(_fbAuth){ _fbAuth.signOut().catch(e=>console.warn('[signOut]', e.message)); }

  // 5. Blank UI back to the Login Screen
  document.getElementById('auth-overlay').style.display = 'flex';
  showAuthMode('login');
}

// ── LOGIN SYNC: safely fetch this account's data from Firebase ──
// (backups/users/{uid}/shopData + /profile) and only overwrite local
// state once that fetch genuinely succeeds — see the full explanation
// inside the function below.
async function _hardLoginSync(uid, email){
  // IMPORTANT: do NOT touch local data yet. The previous version reset
  // everything to empty here BEFORE attempting the Firebase fetch, so
  // a slow/failed connection (very common on mobile data) would
  // silently wipe out the shop's existing records with nothing to
  // restore them. We only overwrite local state once a real fetch has
  // actually completed successfully, below.

  const displayEmail = email || getSessionEmail() || '';
  const badge = document.getElementById('fb-user-badge');
  const info  = document.getElementById('fb-user-info');
  if(badge){ badge.innerHTML = '<i class="fa-solid fa-envelope"></i> ' + displayEmail; }
  if(info)  info.innerHTML = `<i class="fa-solid fa-circle-check"></i> منسلک: <b><i class="fa-solid fa-envelope"></i> ${displayEmail}</b>`;
  const tog = document.getElementById('auto-backup-toggle');
  if(tog) tog.checked = _fbAutoSync;
  _updateOnlineIndicator(navigator.onLine);

  // Slower timeout than before — mobile data / first cold start can
  // genuinely take a few seconds to establish the Firebase connection.
  const fbOk = await _waitForFb(15000);
  if(!fbOk || !_fbDb){
    // Could not reach Firebase in time — leave whatever is already on
    // this device untouched rather than erasing it, and let the
    // regular auto-sync retry once connectivity returns.
    console.warn('[hard login sync] Firebase unreachable — keeping existing local data.');
    showToast('<i class="fa-solid fa-triangle-exclamation"></i> Cloud سے رابطہ نہ ہو سکا — مقامی ڈیٹا دکھایا جا رہا ہے', 'warn');
    _refreshAllViews();
    return;
  }

  try{
    // Deep fetch: pull this account's FULL saved state from
    // backups/users/{uid}/shopData + /profile in one go.
    const [shopSnap, profSnap] = await Promise.all([
      _fbDb.ref(_fbUserPath(uid) + '/shopData').once('value'),
      _fbDb.ref(_fbUserPath(uid) + '/profile').once('value')
    ]);
    const data = shopSnap.val();

    // Merge strategy:
    // • If cloud has data → use cloud data (authoritative).
    // • If cloud returns null/empty AND local has records → keep local.
    //   (Prevents wiping a shop's data when logging in on a new device
    //    before the first cloud sync, or after a Firebase data reset.)
    const cloudHasCustomers = data && Array.isArray(data.customers) && data.customers.length > 0;
    const localHasCustomers = customers.length > 0;

    if(cloudHasCustomers || !localHasCustomers){
      // Cloud wins when it has real data, OR when local is also empty.
      customers         = (data && Array.isArray(data.customers)) ? data.customers : [];
      stock             = (data && Array.isArray(data.stock))     ? data.stock     : [];
      shopNames         = (data && data.shopNames) ? data.shopNames : shopNames;
      reminderTemplates = { ...DEFAULT_REMINDER_TEMPLATES, ...((data && data.reminderTemplates) || {}) };
    } else {
      // Cloud is empty but local has records → keep local and push to cloud.
      console.log('[hard login sync] Cloud empty but local has data — keeping local and syncing up.');
      setTimeout(()=> fbSyncToCloud(), 2000);
    }

    const prof = profSnap.val();
    if(prof) shopProfile = Object.assign({}, shopProfile, prof);

    _persistAllLocalData(); // localStorage now completely mirrors the cloud
  } catch(e){
    console.warn('[hard login sync]', e.message);
    showToast('<i class="fa-solid fa-triangle-exclamation"></i> ڈیٹا لوڈ کرنے میں مسئلہ پیش آیا — مقامی ڈیٹا برقرار ہے', 'warn');
  }

  _refreshAllViews(); // reflect the newly-fetched state immediately
  localStorage.setItem('sms_last_backup_ts', Date.now().toString());
}

async function fbSyncToCloud(){
  const mobile = getSessionUid();
  if(!mobile || !_fbDb) return;
  try{
    const rawData = (typeof buildBackupData === 'function') ? buildBackupData() : {};
    const cleanData = JSON.parse(JSON.stringify(rawData));
    cleanData.syncedAt = new Date().toISOString();

    await _fbDb.ref(_fbUserPath(mobile) + '/shopData').set(cleanData);
    localStorage.setItem('sms_last_backup_ts', Date.now().toString());
    updateStatusBar();
    _showSyncBadge('done');
    console.log('[Firebase Sync] Realtime Database updated successfully for user:', mobile);
  } catch(e){
    console.error('[Firebase sync error]', e);
    _showSyncBadge('error');
  }
}

function fbManualSync(){
  const mobile = getSessionUid();
  if(!mobile){ showToast('<i class="fa-solid fa-triangle-exclamation"></i> پہلے لاگ ان کریں', 'warn'); return; }
  _showSyncBadge('syncing');
  fbSyncToCloud();
}

// ── LOAD FROM CLOUD ──────────────────────────────────────────
async function _fbLoadFromCloud(silent){
  const mobile = getSessionUid();
  if(!mobile || !_fbDb) return;
  try{
    const snap = await _fbDb.ref(_fbUserPath(mobile) + '/shopData').once('value');
    const data = snap.val();
    if(!data){ if(!silent) showToast('ℹ️ Cloud پر ابھی کوئی ڈیٹا نہیں'); return; }

    const localTs = parseInt(localStorage.getItem('sms_last_backup_ts') || '0');
    const cloudTs = data.syncedAt ? new Date(data.syncedAt).getTime() : 0;
    if(!silent && cloudTs <= localTs && customers.length > 0){
      showToast('ℹ️ مقامی ڈیٹا Cloud سے زیادہ تازہ ہے');
      return;
    }

    if(Array.isArray(data.customers)){
      customers = data.customers;
      localStorage.setItem('sms2_customers', JSON.stringify(customers));
    }
    if(Array.isArray(data.stock)){
      stock = data.stock;
      localStorage.setItem('sms_stock', JSON.stringify(stock));
    }
    if(data.shopNames){
      shopNames = data.shopNames;
      localStorage.setItem('sms_shopnames', JSON.stringify(shopNames));
      if(typeof applyShopName === 'function') applyShopName();
    }
    if(data.reminderTemplates){
      reminderTemplates = { ...DEFAULT_REMINDER_TEMPLATES, ...data.reminderTemplates };
      localStorage.setItem('sms_reminder_templates', JSON.stringify(reminderTemplates));
      if(typeof renderReminders === 'function') renderReminders();
    }
    renderDash(); renderAlerts();
    try{ renderCustomers(); } catch(e){}
    localStorage.setItem('sms_last_backup_ts', Date.now().toString());
    updateStatusBar();
    showToast('<i class="fa-solid fa-circle-check"></i> Cloud سے ڈیٹا لوڈ ہو گیا!');
  } catch(e){
    console.warn('[FB load]', e.message);
  }
}

async function fbRestoreFromCloud(){
  const mobile = getSessionUid();
  if(!mobile){ showToast('<i class="fa-solid fa-triangle-exclamation"></i> پہلے لاگ ان کریں', 'warn'); return; }
  const ok = (typeof swalConfirm === 'function')
    ? await swalConfirm('Cloud سے ڈیٹا بحال کریں؟', 'Cloud سے ڈیٹا لوڈ ہو گا اور موجودہ مقامی ڈیٹا Replace ہو جائے گا۔', 'question', 'جی ہاں، بحال کریں', 'منسوخ کریں')
    : confirm('Cloud سے ڈیٹا لوڈ ہو گا اور موجودہ ڈیٹا replace ہو جائے گا۔ جاری رکھنا ہے؟');
  if(!ok) return;
  showToast('⏳ Cloud سے لوڈ ہو رہا ہے…');
  if(!_fbDb) return;
  try{
    const snap = await _fbDb.ref(_fbUserPath(mobile) + '/shopData').once('value');
    const data = snap.val();
    if(!data){ showToast('<i class="fa-solid fa-circle-xmark"></i> Cloud پر کوئی ڈیٹا نہیں', 'warn'); return; }
    if(Array.isArray(data.customers)){
      customers = data.customers;
      localStorage.setItem('sms2_customers', JSON.stringify(customers));
    }
    if(Array.isArray(data.stock)){
      stock = data.stock;
      localStorage.setItem('sms_stock', JSON.stringify(stock));
    }
    if(data.shopNames){
      shopNames = data.shopNames;
      localStorage.setItem('sms_shopnames', JSON.stringify(shopNames));
      if(typeof applyShopName === 'function') applyShopName();
    }
    if(data.reminderTemplates){
      reminderTemplates = { ...DEFAULT_REMINDER_TEMPLATES, ...data.reminderTemplates };
      localStorage.setItem('sms_reminder_templates', JSON.stringify(reminderTemplates));
      if(typeof renderReminders === 'function') renderReminders();
    }
    try{
      const profSnap = await _fbDb.ref(_fbUserPath(mobile) + '/profile').once('value');
      const prof = profSnap.val();
      if(prof){
        shopProfile = Object.assign({}, shopProfile, prof);
        localStorage.setItem('sms_shop_profile', JSON.stringify(shopProfile));
        if(typeof applyShopProfile === 'function') applyShopProfile();
      }
    } catch(e){ console.warn('[profile restore]', e.message); }
    renderDash(); renderAlerts();
    try{ renderCustomers(); } catch(e){}
    localStorage.setItem('sms_last_backup_ts', Date.now().toString());
    updateStatusBar();
    showToast(`<i class="fa-solid fa-circle-check"></i> بحال! ${customers.length} کسٹمرز لوڈ ہوئے`);
  } catch(e){
    showToast('<i class="fa-solid fa-circle-xmark"></i> Cloud load ناکام: ' + e.message, 'warn');
  }
}

// ── AUTO-SYNC HOOK ────────────────────────────────────────────
// NOTE: the real toggleAutoBackup() implementation lives further down
// (merged with the 24-hour Auto Backup timer) — a duplicate definition
// used to live here and silently shadow it, meaning the debounced
// real-time sync flag below was never actually toggled by the UI.
