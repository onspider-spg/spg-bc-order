// Version 10.9.1 | 9 MAR 2026 | Siam Palette Group
// BC Order — app.js: Core, State, API, Loaders, Sidebar, Routing
// Fix: Set Quota label in sidebar + screen title

// ═══════════════════════════════════════════════════════════════
// BC Order Module — Frontend SPA
// v7.0: Sidebar layout (replaces hamburger + bottom nav)
// ═══════════════════════════════════════════════════════════════

// ─── CONFIG ──────────────────────────────────────────────────
const API_URL = 'https://ahvzblrfzhtrjhvbzdhg.supabase.co/functions/v1/bc-order';
const HOME_URL = 'https://onspider-spg.github.io/spg-home/';
const LOGOUT_URL = 'https://onspider-spg.github.io/spg-home/#logout';

// ─── CLIENT CACHE (localStorage + TTL) ──────────────────────
const _C = {
  get(k) {
    try { const r = JSON.parse(localStorage.getItem('bc_c_' + k)); return r && Date.now() < r.x ? r.d : null; } catch { return null; }
  },
  set(k, d, mins) {
    try { localStorage.setItem('bc_c_' + k, JSON.stringify({ d, x: Date.now() + mins * 60000 })); } catch {}
  },
  del(prefix) {
    Object.keys(localStorage).filter(k => k.startsWith('bc_c_' + (prefix||''))).forEach(k => localStorage.removeItem(k));
  }
};

// ─── STATE ───────────────────────────────────────────────────
const S = {
  token: '',
  session: null,
  deptMapping: null,
  role: 'store',
  sidebarRole: 'store', // 'store' | 'bc' | 'admin'
  categories: [],
  products: [],
  cart: [],
  deliveryDate: '',
  headerNote: '',
  editingOrderId: null,
  orders: [],
  currentOrder: null,
  stock: [],
  wasteLog: [],
  wasteSelectedCat: '',
  returns: [],
  notifications: [],
  dashboard: {},
  stores: [],
  departments: [],
  orderingChannels: [],
  currentScreen: 'loading',
  currentParam: null,
  productSearch: '',
  productFilter: 'all',
  orderFilter: 'all',
  bcDateFilter: '',
  bcStatusFilter: 'all',
  fulfilmentItems: [],
  fulfilmentBy: '',
  bcStockProduct: '',
  bcStockAction: 'add',
  bcStockQty: 0,
  bcStockNote: '',
  bcReturnFilter: 'all',
  bcPrintDate: '',
  bcPrintTab: 'production',
  bcPrintStore: '',
  bcPrintSections: [],
  bcPrintSelected: {},
  wasteDashDays: 30,
  topProdDays: 30,
  _announcements: [],
  myPerms: [],
};

// ─── HASH ROUTING ─────────────────────────────────────────────
const HASH_SCREENS = new Set([
  'home','browse','cart','orders','stock','store-quota','waste','returns','return-dashboard',
  'order-detail',
  'bc-home','bc-orders','bc-accept','bc-fulfil','bc-stock','bc-returns','bc-print',
  'admin-dashboard','admin-products','admin-access','admin-dept-mapping',
  'admin-config','admin-notif-settings','admin-cutoff','admin-audit','admin-visibility',
  'admin-waste-dashboard','admin-top-products','admin-announcements','admin-product-edit'
]);
let _skipHashChange = false;

function parseHash(hash) {
  const h = (hash || '').replace('#', '');
  const slashIdx = h.indexOf('/');
  if (slashIdx === -1) return { screen: h, param: null };
  return { screen: h.substring(0, slashIdx), param: decodeURIComponent(h.substring(slashIdx + 1)) };
}

function setHash(screen, param) {
  _skipHashChange = true;
  location.hash = param ? `${screen}/${encodeURIComponent(param)}` : screen;
  _skipHashChange = false;
}

// ─── SIDEBAR CONFIG ─────────────────────────────────────────
const SB_CFG = {
  store: [
    { sec: 'Orders', open: true, items: [
      { scr: 'home', lbl: 'Main Menu' },
      { scr: 'browse', lbl: 'Create Order', action: 'startOrder', perm: 'fn_create_order' },
      { scr: 'orders', lbl: 'View Orders', badgeKey: 'orders', perm: 'fn_view_own_orders' },
      { scr: 'store-quota', lbl: 'Set Quota', perm: 'fn_create_order' },
    ]},
    { sec: 'Records', open: true, items: [
      { scr: 'waste', lbl: 'Waste Log', perm: 'fn_view_waste' },
      { scr: 'returns', lbl: 'Returns', perm: 'fn_view_returns' },
    ]},
    { sec: 'Dashboard', open: false, items: [
      { scr: 'admin-top-products', lbl: 'Top Products', perm: 'fn_view_all_orders' },
      { scr: 'return-dashboard', lbl: 'Return Dashboard', perm: 'fn_view_returns' },
      { scr: 'admin-waste-dashboard', lbl: 'Waste Dashboard', perm: 'fn_view_waste' },
    ]},
    { sec: 'Admin', open: false, items: [
      { scr: 'admin-products', lbl: 'Manage Products', perm: 'fn_manage_products' },
      { scr: 'admin-visibility', lbl: 'Manage Visibility', perm: 'fn_manage_visibility' },
    ]},
  ],
  bc: [
    { sec: 'Orders', open: true, items: [
      { scr: 'bc-home', lbl: 'Main Menu' },
      { scr: 'bc-orders', lbl: 'View Orders', badgeKey: 'orders', perm: 'fn_view_all_orders' },
      { scr: 'bc-stock', lbl: 'Manage Stock', perm: 'fn_view_stock' },
      { scr: 'bc-print', lbl: 'Print Centre', perm: 'fn_view_production' },
    ]},
    { sec: 'Records', open: true, items: [
      { scr: 'waste', lbl: 'Waste Log', perm: 'fn_view_waste' },
      { scr: 'bc-returns', lbl: 'Incoming Returns', badgeKey: 'returns', perm: 'fn_view_returns' },
    ]},
    { sec: 'Dashboard', open: false, items: [
      { scr: 'admin-top-products', lbl: 'Top Products', perm: 'fn_view_all_orders' },
      { scr: 'admin-waste-dashboard', lbl: 'Waste Dashboard', perm: 'fn_view_waste' },
      { scr: 'return-dashboard', lbl: 'Return Dashboard', perm: 'fn_view_returns' },
    ]},
    { sec: 'Admin', open: false, items: [
      { scr: 'admin-products', lbl: 'Manage Products', perm: 'fn_manage_products' },
      { scr: 'admin-visibility', lbl: 'Manage Visibility', perm: 'fn_manage_visibility' },
    ]},
  ],
  admin: [
    { sec: 'Admin', open: true, items: [
      { scr: 'admin-dashboard', lbl: 'Dashboard' },
      { scr: 'admin-products', lbl: 'Manage Products', perm: 'fn_manage_products' },
    ]},
    { sec: 'Orders', open: true, items: [
      { scr: 'bc-orders', lbl: 'View Orders', badgeKey: 'orders', perm: 'fn_view_all_orders' },
      { scr: 'bc-stock', lbl: 'Manage Stock', perm: 'fn_view_stock' },
      { scr: 'bc-print', lbl: 'Print Centre', perm: 'fn_view_production' },
    ]},
    { sec: 'Records', open: false, items: [
      { scr: 'waste', lbl: 'Waste Log', perm: 'fn_view_waste' },
      { scr: 'bc-returns', lbl: 'Incoming Returns', perm: 'fn_view_returns' },
    ]},
    { sec: 'Reports', open: false, items: [
      { scr: 'admin-top-products', lbl: 'Top Products', perm: 'fn_view_all_orders' },
      { scr: 'admin-cutoff', lbl: 'Cutoff Violations', perm: 'fn_view_all_orders' },
      { scr: 'admin-waste-dashboard', lbl: 'Waste Dashboard', perm: 'fn_view_waste' },
      { scr: 'return-dashboard', lbl: 'Return Dashboard', perm: 'fn_view_returns' },
    ]},
    { sec: 'Settings', open: false, items: [
      { scr: 'admin-access', lbl: 'User Access', perm: 'fn_manage_permissions' },
      { scr: 'admin-visibility', lbl: 'Manage Visibility', perm: 'fn_manage_visibility' },
      { scr: 'admin-dept-mapping', lbl: 'Dept Mapping', perm: 'fn_manage_dept_mapping' },
      { scr: 'admin-config', lbl: 'System Config', perm: 'fn_manage_permissions' },
      { scr: 'admin-notif-settings', lbl: 'Notification Settings', perm: 'fn_manage_notifications' },
      { scr: 'admin-audit', lbl: 'Audit Trail', perm: 'fn_view_audit_log' },
    ]},
  ],
};

const SCREEN_TITLES = {
  'home':'Main Menu','browse':'Create Order','cart':'Cart','orders':'View Orders',
  'order-detail':'Order Detail','stock':'View Stock','store-quota':'Set Quota','waste':'Waste Log','returns':'Returns',
  'return-dashboard':'Return Dashboard',
  'bc-home':'Main Menu','bc-orders':'View Orders','bc-accept':'Accept Order',
  'bc-fulfil':'Fulfil & Deliver','bc-stock':'Manage Stock','bc-returns':'Incoming Returns','bc-print':'Print Centre',
  'admin-dashboard':'Dashboard','admin-products':'Manage Products','admin-product-edit':'Edit Product',
  'admin-access':'User Access','admin-dept-mapping':'Dept Mapping','admin-config':'System Config',
  'admin-notif-settings':'Notification Settings','admin-cutoff':'Cutoff Violations',
  'admin-audit':'Audit Trail','admin-visibility':'Manage Visibility','admin-waste-dashboard':'Waste Dashboard',
  'admin-top-products':'Top Products','admin-announcements':'Announcements',
  'loading':'Loading...','no-token':'Login Required','invalid-token':'Session Expired','blocked':'Access Denied',
};

// ─── ENTRY FLOW ──────────────────────────────────────────────
async function init() {
  _C.del('prods'); // Always fresh products on page load
  renderApp();
  showScreen('loading');

  const params = new URLSearchParams(window.location.search);
  S.token = params.get('token') || localStorage.getItem('spg_token') || '';
  const demoMode = params.get('demo');

  if (!S.token && !demoMode) { showScreen('no-token'); return; }

  if (S.token) {
    localStorage.setItem('spg_token', S.token);
    if (params.has('token')) {
      window.history.replaceState({}, '', window.location.pathname + window.location.hash);
    }
  }

  try {
    if (API_URL && S.token) {
      const resp = await api('init_lite');
      if (!resp.success) {
        localStorage.removeItem('spg_token');
        showScreen('invalid-token');
        return;
      }
      if (!S.session) { showScreen('invalid-token'); return; }
      S.myPerms = resp.permissions || [];
      S.stores = resp.stores || [];
      S.departments = resp.departments || [];
      S.orderingChannels = resp.orderingChannels || [];
      await routeToHome();
      // Async: load dashboard + notifications after render (non-blocking)
      loadDashboard().then(() => {
        if (S.currentScreen === 'home') renderHomeDashboard();
        if (S.currentScreen === 'admin-dashboard') renderAdminDashboard();
      }).catch(() => {});
      loadNotifications().then(() => checkNotifications()).catch(() => {});
    } else {
      const role = (demoMode === 'bc') ? 'bc' : 'store';
      S.session = getMockSession(role);
      loadMockData(role);
      await routeToHome();
    }
  } catch (err) {
    console.error('Init error:', err);
    const role = (demoMode === 'bc') ? 'bc' : 'store';
    S.session = getMockSession(role);
    loadMockData(role);
    await routeToHome();
  }
}

async function routeToHome() {
  const dm = S.deptMapping;
  if (dm && dm.module_role === 'not_applicable') { showScreen('blocked'); return; }

  // Determine role
  if (dm && (dm.module_role === 'bc_production' || dm.module_role === 'bc_management')) {
    S.role = 'bc';
  } else {
    S.role = 'store';
  }

  // Determine sidebar role (admin overrides)
  const tierLevel = parseInt((S.session?.tier_id || 'T9').replace('T', ''));
  S.sidebarRole = tierLevel <= 2 ? 'admin' : S.role;

  // ★ Render sidebar + topbar
  renderSidebar();
  renderGlobalTopbar();

  // Check hash for deep link
  const { screen: initScreen, param: initParam } = parseHash(location.hash);
  if (initScreen && HASH_SCREENS.has(initScreen)) {
    const isBcScreen = initScreen.startsWith('bc-') || initScreen.startsWith('admin-');
    const isStoreOnly = ['home','browse','cart','orders','stock','returns'].includes(initScreen);
    if (S.role === 'bc' && isStoreOnly && initScreen !== 'waste') {
      showScreen('bc-home');
    } else if (S.role === 'store' && isBcScreen) {
      showScreen('home');
    } else {
      await handleDeepLink(initScreen, initParam);
    }
  } else {
    if (S.sidebarRole === 'admin') showScreen('admin-dashboard');
    else if (S.role === 'bc') showScreen('bc-home');
    else showScreen('home');
  }

  checkNotifications();
  startPolling();
  startSessionMonitor();

  window.addEventListener('hashchange', () => {
    if (_skipHashChange) return;
    const { screen: hash, param: hashParam } = parseHash(location.hash);
    if (hash && HASH_SCREENS.has(hash) && (hash !== S.currentScreen || hashParam !== S.currentParam)) {
      handleDeepLink(hash, hashParam);
    }
  });
}

// ─── DEEP LINK ──────────────────────────────────────────────
async function handleDeepLink(screen, param) {
  if (param) {
    switch(screen) {
      case 'order-detail': return viewOrder(param);
      case 'bc-accept': return showBcAccept(param);
      case 'bc-fulfil': return showBcFulfil(param);
    }
  }
  showScreen(screen, param);
}

// ─── API HELPER ──────────────────────────────────────────────
async function api(action, body = null, extraParams = {}) {
  const params = new URLSearchParams({ action, token: S.token, ...extraParams });
  const url = API_URL + '?' + params.toString();
  try {
    const opts = body ? { method: 'POST', body: JSON.stringify(body) } : {};
    const resp = await fetch(url, opts);
    const data = await resp.json();
    if (data.session) S.session = data.session;
    if (data.deptMapping) S.deptMapping = data.deptMapping;
    if (!data.success && data.error === 'INVALID_SESSION') {
      localStorage.removeItem('spg_token');
      showScreen('invalid-token');
      return data;
    }
    return data;
  } catch (err) {
    console.error('API error:', err);
    return { success: false, error: 'NETWORK', message: err.message };
  }
}

// ─── DATA LOADERS ────────────────────────────────────────────
async function loadCategories() {
  const cached = _C.get('cats');
  if (cached) { S.categories = cached; return; }
  const resp = await api('get_categories');
  if (resp.success) { S.categories = resp.data; _C.set('cats', resp.data, 1440); }
}

async function loadProducts() {
  const cached = _C.get('prods');
  if (cached) { S.products = cached; return; }
  const resp = await api('get_products', null, { include_stock: 'true' });
  if (resp.success) { S.products = (resp.data||[]).sort((a,b) => (a.product_name||'').localeCompare(b.product_name||'')); _C.set('prods', S.products, 5); }
}

async function loadDashboard() {
  try {
    const resp = await api('get_dashboard');
    if (resp.success) { S.dashboard = resp.data; return; }
  } catch(e) {}
  const today = todaySydney();
  const todayOrders = (S.orders || []).filter(o => o.delivery_date === today);
  S.dashboard = {
    today_total: todayOrders.length,
    by_status: { Pending: todayOrders.filter(o => o.status === 'Pending').length, Ordered: todayOrders.filter(o => o.status === 'Ordered').length, InProgress: todayOrders.filter(o => o.status === 'InProgress').length, Fulfilled: todayOrders.filter(o => o.status === 'Fulfilled').length, Delivered: todayOrders.filter(o => o.status === 'Delivered').length },
    cutoff_violations_today: todayOrders.filter(o => o.is_cutoff_violation).length,
    urgent_items: 0,
  };
}

async function loadOrders(status = '', dateFrom = '', dateTo = '') {
  const params = { limit: '200' };
  if (status && status !== 'all') params.status = status;
  if (dateFrom) params.date_from = dateFrom;
  else if (S.role === 'store') {
    const d = sydneyNow(); d.setDate(d.getDate() - 14);
    params.date_from = formatDate(d);
  }
  if (dateTo) params.date_to = dateTo;
  const resp = await api('get_orders', null, params);
  if (resp.success) S.orders = resp.data;
  else S.orders = [];
}

async function loadOrderDetail(orderId) {
  const resp = await api('get_order_detail', null, { order_id: orderId });
  if (resp.success) S.currentOrder = resp.data;
}

async function loadStock() {
  const resp = await api('get_stock');
  if (resp.success) S.stock = resp.data;
}

async function loadWaste() {
  const d = sydneyNow(); d.setDate(d.getDate() - 14);
  const resp = await api('get_waste_log', null, { date_from: formatDate(d) });
  if (resp.success) S.wasteLog = resp.data;
}

async function loadReturns() {
  const resp = await api('get_returns');
  if (resp.success) S.returns = resp.data;
}

async function loadNotifications() {
  const resp = await api('get_notifications');
  if (resp.success) S.notifications = resp.data;
}

async function loadMyPermissions() {
  try {
    const resp = await api('get_my_permissions');
    if (resp.success) { S.myPerms = resp.data || []; return; }
  } catch(e) {}
  S.myPerms = [
    'fn_create_order','fn_edit_order','fn_cancel_order','fn_view_own_orders','fn_view_all_orders',
    'fn_accept_pending','fn_update_fulfilment','fn_mark_delivered',
    'fn_view_production','fn_view_delivery_slip',
    'fn_view_stock','fn_add_stock','fn_remove_stock',
    'fn_log_waste','fn_view_waste','fn_create_return','fn_resolve_return','fn_view_returns',
    'fn_manage_products','fn_manage_notifications','fn_manage_permissions',
    'fn_manage_config','fn_manage_dept_mapping'
  ];
}

function hasPerm(fnId) {
  const tierLevel = parseInt((S.session?.tier_id || 'T9').replace('T',''));
  if (tierLevel <= 2) return true;
  return S.myPerms.includes(fnId);
}
function hasAdminPerm(fnId) { return S.myPerms.includes(fnId); }

// ─── MOCK DATA ───────────────────────────────────────────────
function getMockSession(role) {
  if (role === 'bc') {
    return { valid:true, account_id:'ACC-010', user_id:'USR-020', display_name:'เชฟโอ', full_name:'Chef Oh', tier_id:'T4', tier_level:4, account_type:'group', store_id:'BC', dept_id:'cake', access_level:'edit' };
  }
  return { valid:true, account_id:'ACC-002', user_id:'USR-005', display_name:'Junnie', full_name:'Junnie Smith', tier_id:'T3', tier_level:3, account_type:'group', store_id:'MNG', dept_id:'dessert', access_level:'edit' };
}

function loadMockData(role) {
  S.stores = [{ store_id:'MNG', store_name:'Mango Coco' }, { store_id:'ISH', store_name:'Issho Cafe' }, { store_id:'GB', store_name:'Golden Brown' }, { store_id:'TMC', store_name:'The Melting Cheese' }, { store_id:'BC', store_name:'Bakery Centre' }];
  S.departments = [{ dept_id:'dessert', dept_name:'Dessert' }, { dept_id:'drink', dept_name:'Drink' }];
  S.orderingChannels = S.stores.filter(s => s.store_id !== 'BC').flatMap(s => S.departments.map(d => ({ store_id: s.store_id, dept_id: d.dept_id, is_active: true })));
  S.categories = [
    { cat_id:'CAT-CAKE', cat_name:'Cake', section_id:'cake', sort_order:1 },
    { cat_id:'CAT-SAUCE', cat_name:'Sauce', section_id:'sauce', sort_order:2 },
    { cat_id:'CAT-BAKED', cat_name:'Baked Goods', section_id:'sauce', sort_order:3 },
  ];
  S.products = [
    { product_id:'PRD-001', product_name:'Carrot Cake', cat_id:'CAT-CAKE', section_id:'cake', unit:'pieces', min_order:3, order_step:1, allow_stock:true, stock_available:12, popup_notice:'สั่งล่วงหน้า 1 วัน', is_active:true },
    { product_id:'PRD-002', product_name:'Chocolate Cake', cat_id:'CAT-CAKE', section_id:'cake', unit:'pieces', min_order:2, order_step:1, allow_stock:true, stock_available:8, is_active:true },
    { product_id:'PRD-007', product_name:'Thai Tea Latte', cat_id:'CAT-SAUCE', section_id:'sauce', unit:'bottles', min_order:5, order_step:1, allow_stock:true, stock_available:15, is_active:true },
  ];
  if (role === 'bc') {
    S.deptMapping = { module_role:'bc_production', section_scope:['cake'] };
  } else {
    S.deptMapping = { module_role:'store', section_scope:[] };
  }
  S.dashboard = { today_total:7, by_status:{ Pending:1, Ordered:3, InProgress:1, Fulfilled:1, Delivered:1 }, cutoff_violations_today:1, urgent_items:2 };
  S.orders = [];
  S.returns = [];
}

// ─── PRODUCT EMOJI MAP ───────────────────────────────────────
function prodEmoji(name) {
  const n = (name||'').toLowerCase();
  if (n.includes('carrot')) return '🥕';
  if (n.includes('chocolate') && n.includes('cake')) return '🍫';
  if (n.includes('cheese')) return '🧀';
  if (n.includes('banana')) return '🍌';
  if (n.includes('croissant')) return '🥐';
  if (n.includes('muffin')) return '🧁';
  if (n.includes('thai tea')) return '🧋';
  if (n.includes('mango')) return '🥭';
  if (n.includes('chocolate') && n.includes('sauce')) return '🍫';
  if (n.includes('caramel')) return '🍯';
  if (n.includes('apple')) return '🍎';
  if (n.includes('scone')) return '🫓';
  return '🎂';
}

function prodImg(p, size) {
  const sz = size || 44;
  if (p && p.image_url) return `<img src="${p.image_url}" style="width:${sz}px;height:${sz}px;border-radius:10px;object-fit:cover" loading="lazy" onerror="this.style.display='none'">`;
  return '';
}

// ═══════════════════════════════════════════════════════════════
// SIDEBAR + GLOBAL TOPBAR (v7.0 — replaces hamburger + bottom nav)
// ═══════════════════════════════════════════════════════════════

function renderSidebar() {
  const el = document.getElementById('sidebar');
  if (!el) return;
  const s = S.session || {};
  const cfg = SB_CFG[S.sidebarRole] || SB_CFG.store;
  const isBc = S.role === 'bc';
  const avClass = isBc ? ' bc' : '';

  let sectionsHtml = '';
  cfg.forEach((g, gi) => {
    const visibleItems = g.items.filter(it => !it.perm || hasPerm(it.perm));
    if (visibleItems.length === 0) return; // hide empty sections
    const itemsHtml = visibleItems.map(it => {
      const isActive = it.scr === S.currentScreen;
      const badge = it.badgeKey ? getBadgeCount(it.badgeKey) : 0;
      return `<div class="sb-item${isActive ? ' act' : ''}" data-scr="${it.scr}" onclick="${it.action ? it.action + '()' : "showScreen('" + it.scr + "')"};closeSidebar()">${it.lbl}${badge > 0 ? `<span class="sb-badge">${badge}</span>` : ''}</div>`;
    }).join('');
    const isOpen = g.open;
    sectionsHtml += `<div class="sb-sec${isOpen ? ' open' : ''}">
      <div class="sb-sec-hd" onclick="this.parentElement.classList.toggle('open')">${g.sec}<span class="sb-arrow">▾</span></div>
      <div class="sb-sec-body">${itemsHtml}</div>
    </div><div class="sb-divider"></div>`;
  });

  el.innerHTML = `
    <div class="sb-hd"><div class="sb-profile"><div class="sb-av${avClass}">${(s.display_name||'?').charAt(0)}</div><div><div class="sb-name">${s.display_name || 'User'}</div><div class="sb-meta">${s.tier_id||''} · ${getStoreName(s.store_id)} ${s.dept_id ? '· '+s.dept_id : ''}</div></div></div></div>
    <div class="sb-body">${sectionsHtml}</div>
    <div class="sb-ft"><div class="sb-ft-item" onclick="location.href='${HOME_URL}'">Home</div><div class="sb-ft-item logout" onclick="doLogout()">Log out</div></div>`;
}

function getBadgeCount(key) {
  if (key === 'orders') {
    const bs = S.dashboard?.by_status || {};
    return (bs.Pending || 0) + (bs.Ordered || 0);
  }
  if (key === 'returns') {
    return (S.returns || []).filter(r => r.status === 'Reported' || r.status === 'Returning').length;
  }
  return 0;
}

function updateSidebarActive(screenName) {
  document.querySelectorAll('.sb-item').forEach(el => {
    el.classList.toggle('act', el.dataset.scr === screenName);
  });
}

function renderGlobalTopbar() {
  const el = document.getElementById('globalTopbar');
  if (!el) return;
  const s = S.session || {};
  const isBc = S.role === 'bc';
  const avClass = isBc ? ' bc' : '';
  const title = SCREEN_TITLES[S.currentScreen] || 'สั่งของเบเกอรี่';
  const hasNotif = (S.notifications || []).length > 0;

  el.innerHTML = `
    <div class="g-tb-ham" onclick="toggleSidebar()"><div class="g-tb-ham-lines"><span></span><span></span><span></span></div></div>
    <div class="g-tb-logo" onclick="location.href='${HOME_URL}'" title="กลับ Home">SPG</div>
    <div class="g-tb-title">สั่งของเบเกอรี่ <span style="color:var(--t4);font-weight:400">:</span> <span style="color:var(--gold)" id="gtbScreenTitle">${title}</span><div class="g-tb-sub">${s.display_name || ''} · ${s.tier_id || ''}</div></div>
    <div class="g-tb-bell" onclick="showNotifPanel()">🔔${hasNotif ? '<span class="g-tb-dot"></span>' : ''}</div>
    <div class="g-tb-av${avClass}" onclick="showProfileInfo()" style="cursor:pointer">${(s.display_name||'?').charAt(0)}</div>`;
}

function updateTopbarTitle(screenName) {
  const el = document.getElementById('gtbScreenTitle');
  if (el) el.textContent = SCREEN_TITLES[screenName] || screenName;
}

// ─── SIDEBAR TOGGLE ─────────────────────────────────────────
function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  const ov = document.getElementById('sbOverlay');
  if (!sb) return;
  const isOpen = sb.classList.contains('open');
  sb.classList.toggle('open', !isOpen);
  if (ov) ov.classList.toggle('show', !isOpen);
}

function closeSidebar() {
  const sb = document.getElementById('sidebar');
  const ov = document.getElementById('sbOverlay');
  if (sb) sb.classList.remove('open');
  if (ov) ov.classList.remove('show');
}

// ─── BACKWARD COMPAT (old code may call these) ──────────────
function openHamburger() { toggleSidebar(); }
function closeHamburger() { closeSidebar(); }

function showProfileInfo() {
  closeSidebar();
  const s = S.session || {};
  showDialog(`
    <div style="text-align:center;margin-bottom:16px">
      <div style="width:64px;height:64px;border-radius:50%;background:var(--gold);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:28px;margin:0 auto 8px">${(s.display_name||'?').charAt(0)}</div>
      <div style="font-size:16px;font-weight:700">${s.display_name || '-'}</div>
      <div style="font-size:12px;color:var(--td)">${s.full_name || ''}</div>
    </div>
    <div style="background:var(--s2);border-radius:12px;padding:12px;font-size:12px">
      <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--bd2)"><span style="color:var(--td)">User ID</span><span style="font-weight:600">${s.user_id || '-'}</span></div>
      <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--bd2)"><span style="color:var(--td)">Account</span><span style="font-weight:600">${s.account_id || '-'}</span></div>
      <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--bd2)"><span style="color:var(--td)">Store</span><span style="font-weight:600">${getStoreName(s.store_id) || s.store_id || '-'}</span></div>
      <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--bd2)"><span style="color:var(--td)">Department</span><span style="font-weight:600">${s.dept_id || '-'}</span></div>
      <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--bd2)"><span style="color:var(--td)">Tier</span><span style="font-weight:600">${s.tier_id || '-'}</span></div>
      <div style="display:flex;justify-content:space-between;padding:4px 0"><span style="color:var(--td)">Role</span><span style="font-weight:600">${S.deptMapping?.module_role || S.role || '-'}</span></div>
    </div>
    <button class="btn btn-outline" style="width:100%;margin-top:12px" onclick="closeDialog()">ปิด</button>`);
}

function doLogout() {
  closeSidebar();
  localStorage.removeItem('spg_token');
  _C.del();
  S.token = null;
  S.session = {};
  location.href = LOGOUT_URL;
}

// ─── HELPERS ─────────────────────────────────────────────────
function sydneyNow() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Australia/Sydney' }));
}

function formatDate(d) {
  if (typeof d === 'string') return d;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todaySydney() { return formatDate(sydneyNow()); }

function tomorrowSydney() {
  const d = sydneyNow(); d.setDate(d.getDate() + 1); return formatDate(d);
}

function formatDateThai(str) {
  if (!str) return '';
  const d = new Date(str + 'T00:00:00');
  const months = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
}

function formatDateAU(str) {
  if (!str) return '';
  const d = new Date(str + 'T00:00:00');
  return d.toLocaleDateString('en-AU', { day: '2-digit', month: 'short' });
}

function getStoreName(id) {
  if (!id) return '';
  if (id === 'ALL') return 'ทุกร้าน';
  const s = (S.stores || []).find(s => s.store_id === id);
  return s ? s.store_name : id;
}

function getDeptName(id) {
  if (!id) return '';
  if (id === 'ALL') return 'All';
  const d = (S.departments || []).find(d => d.dept_id === id);
  return d ? d.dept_name : id;
}

function getCatName(sectionId) {
  if (sectionId === 'cake') return 'Cake';
  if (sectionId === 'sauce') return 'Sauce';
  return sectionId;
}

function statusClass(s) {
  const map = { Pending:'st-pending', Ordered:'st-ordered', InProgress:'st-progress', Fulfilled:'st-fulfilled', Delivered:'st-delivered', Rejected:'st-rejected', Cancelled:'st-cancelled' };
  return map[s] || '';
}

function getScopeLabel() {
  const dm = S.deptMapping;
  if (!dm || !dm.section_scope || !dm.section_scope.length) return 'All';
  return dm.section_scope.map(s => getCatName(s)).join(', ');
}

// Toast
function toast(msg, type='success') {
  const wrap = document.getElementById('toastWrap');
  if (!wrap) return;
  const t = document.createElement('div');
  t.className = 'toast toast-' + type;
  t.innerHTML = msg;
  wrap.appendChild(t);
  setTimeout(() => { t.style.opacity='0'; t.style.transform='translateY(-20px)'; setTimeout(() => t.remove(), 300); }, 3000);
}

// ─── SECTION FILTER (shared across all pages) ─────────────
const SEC_ICONS = { cake:'🎂', sauce:'🍶', tart:'🥧', bread:'🍞', bakery:'🍞' };

function toggleSF(key, sec, fn) {
  if (!S[key]) S[key] = [];
  const idx = S[key].indexOf(sec);
  if (idx >= 0) S[key].splice(idx, 1); else S[key].push(sec);
  if (typeof window[fn] === 'function') window[fn]();
}

function sfChips(key, sections, fn) {
  if (!S[key]) S[key] = [];
  const sel = S[key];
  return `<div class="filter-bar" style="flex-wrap:wrap">
    <div class="filter-chip ${sel.length===0?'active':''}" onclick="S.${key}=[];${fn}()">ทั้งหมด</div>
    ${sections.map(sec => `<div class="filter-chip ${sel.includes(sec)?'active':''}" onclick="toggleSF('${key}','${sec}','${fn}')">${SEC_ICONS[sec]||'📦'} ${sec}</div>`).join('')}
  </div>`;
}

function sfFilter(key, items, field) {
  if (!S[key] || S[key].length === 0) return items;
  return items.filter(i => S[key].includes(i[field]));
}

// Dialog
function showDialog(html) {
  document.getElementById('dialogContent').innerHTML = html;
  document.getElementById('overlay').classList.add('show');
}

function closeDialog() {
  document.getElementById('overlay').classList.remove('show');
}
