// Version 6.6.0 | 6 MAR 2026 | Siam Palette Group
// BC Order — app.js: Core, State, API, Loaders, Routing, Hamburger

// ═══════════════════════════════════════════════════════════════
// BC Order Module — Frontend SPA
// Phase B: Entry + Store Flow
// ═══════════════════════════════════════════════════════════════

// ─── CONFIG ──────────────────────────────────────────────────
const API_URL = 'https://ahvzblrfzhtrjhvbzdhg.supabase.co/functions/v1/bc-order';
const HOME_URL = 'https://onspider-spg.github.io/spg-home/';

// ─── CLIENT CACHE (localStorage + TTL) ──────────────────────
const _C = {
  get(k) {
    try {
      const r = JSON.parse(localStorage.getItem('bc_c_' + k));
      return r && Date.now() < r.x ? r.d : null;
    } catch { return null; }
  },
  set(k, d, mins) { 
    try { localStorage.setItem('bc_c_' + k, JSON.stringify({ d, x: Date.now() + mins * 60000 })); }
    catch {}
  },
  del(prefix) {
    Object.keys(localStorage).filter(k => k.startsWith('bc_c_' + (prefix||''))).forEach(k => localStorage.removeItem(k));
  }
};

// ─── STATE ───────────────────────────────────────────────────
const S = {
  token: '',
  session: null,
  deptMapping: null,  // {module_role, section_scope:[]}
  role: 'store',      // 'store' | 'bc' — derived from deptMapping
  categories: [],
  products: [],
  cart: [],          // [{product_id, product_name, qty, unit, is_urgent, note, section_id, min_order, order_step}]
  deliveryDate: '',
  headerNote: '',
  editingOrderId: null,  // set when editing existing order
  orders: [],
  currentOrder: null,
  stock: [],
  wasteLog: [],
  wasteSelectedCat: '',
  returns: [],
  notifications: [],
  dashboard: null,
  currentScreen: 'loading',
  currentParam: null,
  productSearch: '',
  productFilter: 'all',
  orderFilter: 'all',
  // BC-specific
  bcDateFilter: '',
  bcStatusFilter: 'all',
  fulfilmentItems: [],  // [{...item, ful_status:'full'|'partial'|'', qty_sent:N, ful_note:''}]
  fulfilmentBy: '',
  // BC Stock
  bcStockProduct: '',   // selected product_id
  bcStockAction: 'add', // 'add' | 'remove'
  bcStockQty: 0,
  bcStockNote: '',
  bcReturnFilter: 'open', // 'open' | 'all'
  bcPrintDate: '',
  bcPrintTab: 'production', // 'production' | 'slip'
  bcPrintStore: '',         // for slip view
  wasteDashDays: 30,       // waste dashboard period
  topProdDays: 30,         // top products period
  _announcements: [],      // cached for admin edit
  myPerms: [],             // user's allowed function_ids
};

// ─── HASH ROUTING ─────────────────────────────────────────────
const HASH_SCREENS = new Set([
  'home','browse','cart','orders','stock','waste','returns','return-dashboard',
  'order-detail',
  'bc-home','bc-orders','bc-accept','bc-fulfil','bc-stock','bc-returns','bc-print',
  'admin-dashboard','admin-products','admin-access','admin-dept-mapping',
  'admin-config','admin-notif-settings','admin-cutoff','admin-audit',
  'admin-waste-dashboard','admin-top-products','admin-announcements','admin-product-edit'
]);
let _skipHashChange = false;

// Parse hash: "#bc-orders" → {screen:'bc-orders', param:null}
//             "#order-detail/ORD-123" → {screen:'order-detail', param:'ORD-123'}
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

// ─── ENTRY FLOW ──────────────────────────────────────────────
async function init() {
  renderApp();
  showScreen('loading');
  
  // Extract token from URL
  const params = new URLSearchParams(window.location.search);
  S.token = params.get('token') || localStorage.getItem('spg_token') || '';
  const demoMode = params.get('demo'); // ?demo=bc or ?demo=store
  
  if (!S.token && !demoMode) {
    showScreen('no-token');
    return;
  }
  
  // Store token
  if (S.token) {
    localStorage.setItem('spg_token', S.token);
    if (params.has('token')) {
      window.history.replaceState({}, '', window.location.pathname + window.location.hash);
    }
  }
  
  try {
    if (API_URL && S.token) {
      // ─── REAL MODE: init_lite — only what Home needs ───
      const resp = await api('init_lite');
      if (!resp.success) {
        console.error('❌ init_lite failed:', resp.error, resp.message);
        localStorage.removeItem('spg_token');
        showScreen('invalid-token');
        return;
      }
      if (!S.session) {
        showScreen('invalid-token');
        return;
      }
      
      // Assign Home data only — no products/orders/returns/stock
      S.notifications = resp.notifications || [];
      S.myPerms = resp.permissions || [];
      S.dashboard = resp.dashboard || {};
      
      await routeToHome();
    } else {
      // ─── DEMO MODE ───
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
  // Check dept mapping
  const dm = S.deptMapping;
  if (dm && dm.module_role === 'not_applicable') {
    showScreen('blocked');
    return;
  }
  
  // Determine role from deptMapping
  if (dm && (dm.module_role === 'bc_production' || dm.module_role === 'bc_management')) {
    S.role = 'bc';
  } else {
    S.role = 'store';
  }
  
  // Check if URL has a hash to restore (deep-link)
  const { screen: initScreen, param: initParam } = parseHash(location.hash);
  if (initScreen && HASH_SCREENS.has(initScreen)) {
    // Validate: store users can't access bc- screens (except waste), bc users can't access store-only screens
    const isBcScreen = initScreen.startsWith('bc-') || initScreen.startsWith('admin-');
    const isStoreOnly = ['home','browse','cart','orders','stock','returns'].includes(initScreen);
    
    if (S.role === 'bc' && isStoreOnly && initScreen !== 'waste') {
      showScreen('bc-home');
    } else if (S.role === 'store' && isBcScreen) {
      showScreen('home');
    } else {
      // Handle deep links with params
      await handleDeepLink(initScreen, initParam);
    }
  } else {
    // Default: route to role home
    if (S.role === 'bc') {
      showScreen('bc-home');
    } else {
      showScreen('home');
    }
  }
  
  checkNotifications();
  startPolling(); // B-01: begin auto-refresh
  startSessionMonitor(); // session expiry monitor

  // Listen for hash changes (browser back/forward)
  window.addEventListener('hashchange', () => {
    if (_skipHashChange) return;
    const { screen: hash, param: hashParam } = parseHash(location.hash);
    if (hash && HASH_SCREENS.has(hash) && (hash !== S.currentScreen || hashParam !== S.currentParam)) {
      handleDeepLink(hash, hashParam);
    }
  });
}

// ─── DEEP LINK HANDLER ──────────────────────────────────────
async function handleDeepLink(screen, param) {
  // Screens that need a param to load properly
  if (param) {
    switch(screen) {
      case 'order-detail':
        return viewOrder(param); // loads order + shows detail
      case 'bc-accept':
        return showBcAccept(param); // loads order + shows accept
      case 'bc-fulfil':
        return showBcFulfil(param); // loads order + shows fulfil
    }
  }
  // All other screens: just show
  showScreen(screen, param);
}

// ─── API HELPER ──────────────────────────────────────────────
async function api(action, body = null, extraParams = {}) {
  const params = new URLSearchParams({ action, token: S.token, ...extraParams });
  const url = API_URL + '?' + params.toString();
  
  try {
    const opts = body ? {
      method: 'POST',
      body: JSON.stringify(body)
    } : {};
    
    const resp = await fetch(url, opts);
    const data = await resp.json();
    
    // Store session if returned
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
  if (resp.success) { S.products = resp.data; _C.set('prods', resp.data, 60); }
}

async function loadDashboard() {
  try {
    const resp = await api('get_dashboard');
    if (resp.success) { S.dashboard = resp.data; return; }
    console.warn('[loadDashboard] FAILED:', resp.error, resp.message);
  } catch(e) { console.warn('[loadDashboard] exception:', e); }
  
  // Fallback: compute from loaded orders
  const today = todaySydney();
  const todayOrders = (S.orders || []).filter(o => o.delivery_date === today);
  S.dashboard = {
    today_total: todayOrders.length,
    by_status: {
      Pending: todayOrders.filter(o => o.status === 'Pending').length,
      Ordered: todayOrders.filter(o => o.status === 'Ordered').length,
      InProgress: todayOrders.filter(o => o.status === 'InProgress').length,
      Fulfilled: todayOrders.filter(o => o.status === 'Fulfilled').length,
      Delivered: todayOrders.filter(o => o.status === 'Delivered').length,
    },
    cutoff_violations_today: todayOrders.filter(o => o.is_cutoff_violation).length,
    urgent_items: 0,
  };
}

async function loadOrders(status = '') {
  const params = { limit: '100' };
  if (status && status !== 'all') params.status = status;
  
  // S-06: Store users see last 14 days by default
  if (S.role === 'store') {
    const d = sydneyNow();
    d.setDate(d.getDate() - 14);
    params.date_from = formatDate(d);
  }
  
  const resp = await api('get_orders', null, params);
  if (resp.success) {
    S.orders = resp.data;
    console.log(`[loadOrders] loaded ${S.orders.length} orders`);
  } else {
    console.warn('[loadOrders] FAILED:', resp.error, resp.message);
    S.orders = [];
  }
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
  // S-08: Only load last 14 days of waste
  const d = sydneyNow();
  d.setDate(d.getDate() - 14);
  const dateFrom = formatDate(d);
  const resp = await api('get_waste_log', null, { date_from: dateFrom });
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
  // Fallback: if endpoint not available, grant all perms so menus still show
  // (actual permission check happens on backend when action is performed)
  S.myPerms = [
    'fn_create_order','fn_edit_order','fn_cancel_order','fn_view_own_orders','fn_view_all_orders',
    'fn_accept_pending','fn_update_fulfilment','fn_mark_delivered',
    'fn_view_production','fn_view_delivery_slip',
    'fn_view_stock','fn_add_stock','fn_remove_stock',
    'fn_log_waste','fn_view_waste','fn_create_return','fn_resolve_return','fn_view_returns',
    'fn_manage_products','fn_manage_notifications','fn_manage_permissions',
    'fn_manage_config','fn_manage_dept_mapping'
  ];
  console.warn('loadMyPermissions fallback: granting all (backend endpoint not deployed yet)');
}

function hasPerm(fnId) {
  // T1/T2 always have access to operational functions
  const tierLevel = parseInt((S.session?.tier_id || 'T9').replace('T',''));
  if (tierLevel <= 2) return true;
  return S.myPerms.includes(fnId);
}
function hasAdminPerm(fnId) {
  // v6.4.3: strict check — ALL tiers must have real permission for admin menus
  return S.myPerms.includes(fnId);
}

// ─── MOCK DATA (for demo without backend) ────────────────────
function getMockSession(role) {
  if (role === 'bc') {
    return {
      valid: true, account_id: 'ACC-010', user_id: 'USR-020',
      display_name: 'Somchai', full_name: 'Somchai Baker',
      tier_id: 'T4', tier_level: 4, account_type: 'group',
      store_id: 'BC', dept_id: 'cake',
      access_level: 'edit',
    };
  }
  return {
    valid: true, account_id: 'ACC-002', user_id: 'USR-005',
    display_name: 'Joy', full_name: 'Joyful Smith',
    tier_id: 'T5', tier_level: 5, account_type: 'group',
    store_id: 'MNG', dept_id: 'dessert',
    access_level: 'edit',
  };
}

function loadMockData(role) {
  S.categories = [
    { cat_id: 'CAT-CAKE', cat_name: 'Cake', section_id: 'cake', sort_order: 1 },
    { cat_id: 'CAT-SAUCE', cat_name: 'Sauce', section_id: 'sauce', sort_order: 2 },
    { cat_id: 'CAT-BAKED', cat_name: 'Baked Goods', section_id: 'sauce', sort_order: 3 },
  ];
  S.products = [
    { product_id:'PRD-001', product_name:'Carrot Cake', cat_id:'CAT-CAKE', section_id:'cake', unit:'pieces', min_order:3, order_step:1, allow_stock:true, stock_available:12, popup_notice:'สั่งล่วงหน้า 1 วัน', is_active:true },
    { product_id:'PRD-002', product_name:'Chocolate Cake', cat_id:'CAT-CAKE', section_id:'cake', unit:'pieces', min_order:2, order_step:1, allow_stock:true, stock_available:8, popup_notice:'', is_active:true },
    { product_id:'PRD-003', product_name:'Cheesecake', cat_id:'CAT-CAKE', section_id:'cake', unit:'pieces', min_order:2, order_step:1, allow_stock:true, stock_available:5, popup_notice:'', is_active:true },
    { product_id:'PRD-004', product_name:'Banana Bread', cat_id:'CAT-CAKE', section_id:'cake', unit:'loaves', min_order:2, order_step:2, allow_stock:true, stock_available:6, popup_notice:'', is_active:true },
    { product_id:'PRD-005', product_name:'Croissant', cat_id:'CAT-CAKE', section_id:'cake', unit:'pieces', min_order:6, order_step:3, allow_stock:true, stock_available:18, popup_notice:'', is_active:true },
    { product_id:'PRD-006', product_name:'Muffin Blueberry', cat_id:'CAT-CAKE', section_id:'cake', unit:'pieces', min_order:4, order_step:2, allow_stock:true, stock_available:10, popup_notice:'', is_active:true },
    { product_id:'PRD-007', product_name:'Thai Tea Latte', cat_id:'CAT-SAUCE', section_id:'sauce', unit:'bottles', min_order:5, order_step:1, allow_stock:true, stock_available:15, popup_notice:'', is_active:true },
    { product_id:'PRD-008', product_name:'Mango Sauce', cat_id:'CAT-SAUCE', section_id:'sauce', unit:'bottles', min_order:3, order_step:1, allow_stock:true, stock_available:7, popup_notice:'', is_active:true },
    { product_id:'PRD-009', product_name:'Chocolate Sauce', cat_id:'CAT-SAUCE', section_id:'sauce', unit:'bottles', min_order:3, order_step:1, allow_stock:true, stock_available:4, popup_notice:'', is_active:true },
    { product_id:'PRD-010', product_name:'Caramel Sauce', cat_id:'CAT-SAUCE', section_id:'sauce', unit:'bottles', min_order:3, order_step:1, allow_stock:true, stock_available:9, popup_notice:'', is_active:true },
    { product_id:'PRD-011', product_name:'Apple Crumble', cat_id:'CAT-BAKED', section_id:'sauce', unit:'pieces', min_order:2, order_step:1, allow_stock:true, stock_available:3, popup_notice:'', is_active:true },
    { product_id:'PRD-012', product_name:'Scone Plain', cat_id:'CAT-BAKED', section_id:'sauce', unit:'pieces', min_order:4, order_step:2, allow_stock:true, stock_available:14, popup_notice:'', is_active:true },
  ];
  if (role === 'bc') {
    const deptId = S.session.dept_id;
    const sc = deptId === 'bakery' ? ['cake','sauce'] : [deptId];
    S.deptMapping = { module_role: deptId === 'bakery' ? 'bc_management' : 'bc_production', section_scope: sc };
  } else {
    S.deptMapping = { module_role: 'store', section_scope: [] };
  }
  S.dashboard = { today_total: 7, by_status: { Pending:1, Ordered:3, InProgress:1, Fulfilled:1, Delivered:1 }, cutoff_violations_today:1, urgent_items:2 };
  S.orders = [
    { order_id:'ORD-20260302-001', store_id:'MNG', dept_id:'dessert', user_id:'USR-005', display_name:'Somjai', order_date:'2026-03-01', delivery_date:'2026-03-02', status:'Pending', is_cutoff_violation:true, header_note:'', created_at:'2026-03-01T06:15:00Z',
      items:[
        { item_id:'ITM-000001', product_id:'PRD-001', product_name:'Carrot Cake', section_id:'cake', qty_ordered:6, unit:'pieces', is_urgent:true, note:'ตัดเป็น 8 ชิ้น' },
        { item_id:'ITM-000002', product_id:'PRD-002', product_name:'Chocolate Cake', section_id:'cake', qty_ordered:4, unit:'pieces', is_urgent:false, note:'' },
      ]},
    { order_id:'ORD-20260302-002', store_id:'MNG', dept_id:'front', user_id:'USR-006', display_name:'Nong', order_date:'2026-03-01', delivery_date:'2026-03-02', status:'Ordered', is_cutoff_violation:false, header_note:'Deliver by 10:30', created_at:'2026-03-01T04:30:00Z',
      items:[
        { item_id:'ITM-000003', product_id:'PRD-004', product_name:'Banana Bread', section_id:'cake', qty_ordered:8, unit:'loaves', is_urgent:false, note:'' },
      ]},
    { order_id:'ORD-20260302-003', store_id:'ISH', dept_id:'kitchen', user_id:'USR-012', display_name:'Karn', order_date:'2026-03-01', delivery_date:'2026-03-02', status:'Ordered', is_cutoff_violation:false, header_note:'', created_at:'2026-03-01T03:20:00Z',
      items:[
        { item_id:'ITM-000004', product_id:'PRD-001', product_name:'Carrot Cake', section_id:'cake', qty_ordered:4, unit:'pieces', is_urgent:false, note:'' },
      ]},
    { order_id:'ORD-20260302-004', store_id:'GB', dept_id:'dessert', user_id:'USR-015', display_name:'Pim', order_date:'2026-03-01', delivery_date:'2026-03-02', status:'InProgress', is_cutoff_violation:false, header_note:'', created_at:'2026-03-01T02:10:00Z',
      items:[
        { item_id:'ITM-000005', product_id:'PRD-002', product_name:'Chocolate Cake', section_id:'cake', qty_ordered:3, unit:'pieces', is_urgent:false, note:'' },
        { item_id:'ITM-000006', product_id:'PRD-005', product_name:'Croissant', section_id:'cake', qty_ordered:12, unit:'pieces', is_urgent:true, note:'' },
      ]},
    { order_id:'ORD-20260302-005', store_id:'TMC', dept_id:'front', user_id:'USR-018', display_name:'Fern', order_date:'2026-03-01', delivery_date:'2026-03-02', status:'Ordered', is_cutoff_violation:false, header_note:'', created_at:'2026-03-01T04:00:00Z',
      items:[
        { item_id:'ITM-000007', product_id:'PRD-006', product_name:'Muffin Blueberry', section_id:'cake', qty_ordered:8, unit:'pieces', is_urgent:false, note:'' },
        { item_id:'ITM-000008', product_id:'PRD-007', product_name:'Thai Tea Latte', section_id:'sauce', qty_ordered:6, unit:'bottles', is_urgent:false, note:'' },
      ]},
    { order_id:'ORD-20260301-010', store_id:'MNG', dept_id:'dessert', user_id:'USR-005', display_name:'Somjai', order_date:'2026-02-28', delivery_date:'2026-03-01', status:'Fulfilled', is_cutoff_violation:false, header_note:'', created_at:'2026-02-28T04:15:00Z',
      items:[
        { item_id:'ITM-000009', product_id:'PRD-001', product_name:'Carrot Cake', section_id:'cake', qty_ordered:4, unit:'pieces', is_urgent:false, note:'', fulfilment_status:'full', qty_sent:4 },
      ]},
    { order_id:'ORD-20260301-011', store_id:'ISH', dept_id:'kitchen', user_id:'USR-012', display_name:'Karn', order_date:'2026-02-28', delivery_date:'2026-03-01', status:'Delivered', is_cutoff_violation:false, header_note:'', created_at:'2026-02-28T03:00:00Z',
      items:[
        { item_id:'ITM-000010', product_id:'PRD-004', product_name:'Banana Bread', section_id:'cake', qty_ordered:6, unit:'loaves', is_urgent:false, note:'', fulfilment_status:'full', qty_sent:6 },
      ]},
  ];
  S.returns = [
    { return_id:'RTN-000003', order_id:'ORD-20260301-010', item_id:'ITM-000009', product_id:'PRD-001', product_name:'Carrot Cake', section_id:'cake', qty:2, unit:'pieces', store_id:'MNG', dept_id:'dessert', reported_by:'Somjai', reason:'Quality', detail:'เค้กยุบ', status:'Returning', created_at:'2026-03-01T09:30:00Z' },
    { return_id:'RTN-000002', order_id:'ORD-20260301-010', item_id:'ITM-000009', product_id:'PRD-001', product_name:'Carrot Cake', section_id:'cake', qty:1, unit:'pieces', store_id:'MNG', dept_id:'dessert', reported_by:'Somjai', reason:'Damaged', detail:'แตกระหว่างขนส่ง', status:'Received', created_at:'2026-02-28T14:00:00Z' },
    { return_id:'RTN-000001', order_id:'ORD-20260301-011', item_id:'ITM-000010', product_id:'PRD-007', product_name:'Thai Tea Latte', section_id:'sauce', qty:4, unit:'bottles', store_id:'MNG', dept_id:'dessert', reported_by:'Somjai', reason:'Quality', detail:'ซอสเหลว', status:'Received', created_at:'2026-02-28T10:00:00Z' },
    { return_id:'RTN-000000', order_id:'ORD-20260228-005', item_id:'ITM-000005', product_id:'PRD-002', product_name:'Chocolate Cake', section_id:'cake', qty:2, unit:'pieces', store_id:'GB', dept_id:'dessert', reported_by:'Pim', reason:'Wrong item', detail:'สั่ง Carrot ได้ Chocolate', status:'Reworked', created_at:'2026-02-27T11:00:00Z' },
  ];
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

// ─── SCREEN RENDERER ─────────────────────────────────────────

// ─── HAMBURGER MENU ─────────────────────────────────────────
function openHamburger() {
  const s = S.session || {};
  const tierBg = parseInt((s.tier_id||'T9').replace('T','')) <= 2 ? 'var(--gold)' : 'var(--blue)';
  
  document.getElementById('hmHeader').innerHTML = `
    <div style="display:flex;align-items:center;gap:12px">
      <div style="width:44px;height:44px;border-radius:50%;background:${tierBg};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:18px">${(s.display_name||'?').charAt(0)}</div>
      <div>
        <div style="font-weight:700;font-size:15px">${s.display_name || 'User'}</div>
        <div style="font-size:11px;color:var(--td)">${s.store_id||''} · ${s.dept_id||''}</div>
        <div style="font-size:10px;margin-top:2px"><span style="background:${tierBg};color:#fff;padding:2px 8px;border-radius:10px;font-weight:600">${s.tier_id||'?'}</span></div>
      </div>
    </div>`;
  
  document.getElementById('hmBody').innerHTML = `
    <div class="hm-item" onclick="location.href='${HOME_URL}'">
      <div class="hm-item-icon">🏠</div>
      <div>กลับหน้า Home</div>
    </div>
    <div class="hm-item" onclick="showProfileInfo()">
      <div class="hm-item-icon">👤</div>
      <div>ข้อมูลโปรไฟล์</div>
    </div>
    <div class="hm-item" onclick="showNotifPanel();closeHamburger()">
      <div class="hm-item-icon">🔔</div>
      <div>แจ้งเตือน</div>
    </div>
    <div style="height:1px;background:var(--b2);margin:8px 0"></div>
    <div class="hm-item hm-item-danger" onclick="doLogout()">
      <div class="hm-item-icon">🚪</div>
      <div>ออกจากระบบ</div>
    </div>
    <div style="padding:16px;font-size:9px;color:var(--td);text-align:center">BC Order v5 · SPG © 2026</div>
  `;
  
  document.getElementById('hmOverlay').classList.add('show');
  document.getElementById('hmPanel').classList.add('show');
}

function closeHamburger() {
  document.getElementById('hmPanel').classList.remove('show');
  document.getElementById('hmOverlay').classList.remove('show');
}

function showProfileInfo() {
  closeHamburger();
  const s = S.session || {};
  showDialog(`
    <div style="text-align:center;margin-bottom:16px">
      <div style="width:64px;height:64px;border-radius:50%;background:var(--gold);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:28px;margin:0 auto 8px">${(s.display_name||'?').charAt(0)}</div>
      <div style="font-size:16px;font-weight:700">${s.display_name || '-'}</div>
      <div style="font-size:12px;color:var(--td)">${s.full_name || ''}</div>
    </div>
    <div style="background:var(--s2);border-radius:12px;padding:12px;font-size:12px">
      <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--b1)"><span style="color:var(--td)">User ID</span><span style="font-weight:600">${s.user_id || '-'}</span></div>
      <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--b1)"><span style="color:var(--td)">Account</span><span style="font-weight:600">${s.account_id || '-'}</span></div>
      <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--b1)"><span style="color:var(--td)">Store</span><span style="font-weight:600">${getStoreName(s.store_id) || s.store_id || '-'}</span></div>
      <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--b1)"><span style="color:var(--td)">Department</span><span style="font-weight:600">${s.dept_id || '-'}</span></div>
      <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--b1)"><span style="color:var(--td)">Tier</span><span style="font-weight:600">${s.tier_id || '-'}</span></div>
      <div style="display:flex;justify-content:space-between;padding:4px 0"><span style="color:var(--td)">Role</span><span style="font-weight:600">${S.deptMapping?.module_role || S.role || '-'}</span></div>
      ${s.expires_at ? `<div style="display:flex;justify-content:space-between;padding:4px 0;border-top:1px solid var(--b1)"><span style="color:var(--td)">Session หมดอายุ</span><span style="font-weight:600;font-size:10px">${new Date(s.expires_at).toLocaleString('th-TH', {timeZone:'Australia/Sydney'})}</span></div>` : ''}
    </div>
    <button class="btn btn-outline" style="width:100%;margin-top:12px" onclick="closeDialog()">ปิด</button>
  `);
}

function doLogout() {
  closeHamburger();
  localStorage.removeItem('spg_token');
  _C.del(); // clear all BC cache
  S.token = null;
  S.session = {};
  location.href = HOME_URL;
}

// ─── HELPERS ─────────────────────────────────────────────────
function sydneyNow() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Australia/Sydney' }));
}

function formatDate(d) {
  if (typeof d === 'string') return d;
  // Read date parts directly — caller must pass sydneyNow() for Sydney dates
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todaySydney() {
  return formatDate(sydneyNow());
}

function tomorrowSydney() {
  const d = sydneyNow();
  d.setDate(d.getDate() + 1);
  return formatDate(d);
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
  return d.toLocaleDateString('en-AU', {
    day: '2-digit',
    month: 'short'
  });
}

function getStoreName(id) {
  const map = { MNG:'Mango Coco', ISH:'Issho Cafe', GB:'Golden Brown', TMC:'The Melting Cheese', BC:'Bakery Centre', ALL:'ทุกร้าน' };
  return map[id] || id;
}

function getDeptName(id) {
  const map = { dessert:'Dessert', front:'Front', kitchen:'Kitchen', drink:'Drink', cake:'Cake', sauce:'Sauce', bakery:'Bakery', ALL:'All' };
  return map[id] || id;
}

function getCatName(sectionId) {
  if (sectionId === 'cake') return 'Cake';
  if (sectionId === 'sauce') return 'Sauce';
  return sectionId;
}

function statusClass(s) {
  const map = { Pending:'st-pending', Ordered:'st-ordered', InProgress:'st-progress', Fulfilled:'st-fulfilled', Delivered:'st-delivered' };
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
  const t = document.createElement('div');
  t.className = 'toast toast-' + type;
  t.innerHTML = msg;
  wrap.appendChild(t);
  setTimeout(() => { t.style.opacity='0'; t.style.transform='translateY(-20px)'; setTimeout(() => t.remove(), 300); }, 3000);
}

// Dialog

function showDialog(html) {
  document.getElementById('dialogContent').innerHTML = html;
  document.getElementById('overlay').classList.add('show');
}

function closeDialog() {
  document.getElementById('overlay').classList.remove('show');
}

