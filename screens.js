// Version 7.2 | 7 MAR 2026 | Siam Palette Group
// BC Order — screens.js: renderApp, Home, Browse, Cart, Orders, Stock
// Phase 2: Store Screens UI overhaul (wireframe match)

// ─── SCREEN RENDERER ─────────────────────────────────────────
function renderApp() {
  document.getElementById('app').innerHTML = `
    <div class="screen active" id="scr-loading"><div style="display:flex;align-items:center;justify-content:center;height:100%;flex-direction:column;gap:12px"><div class="spinner"></div><div style="font-size:13px;color:var(--td)">กำลังเชื่อมต่อ...</div></div></div>
    <div class="screen" id="scr-no-token"><div style="display:flex;align-items:center;justify-content:center;height:100%;flex-direction:column;gap:16px;padding:24px;text-align:center"><div style="font-size:56px">🔒</div><div style="font-size:18px;font-weight:700">กรุณา Login ผ่าน Home</div><div style="font-size:13px;color:var(--td)">BC Order ต้องเข้าผ่าน SPG App Home Module</div><button class="btn btn-gold" style="max-width:240px" onclick="location.href='${HOME_URL}'">🏠 ไปหน้า Home</button></div></div>
    <div class="screen" id="scr-invalid-token"><div style="display:flex;align-items:center;justify-content:center;height:100%;flex-direction:column;gap:16px;padding:24px;text-align:center"><div style="font-size:56px">⏰</div><div style="font-size:18px;font-weight:700">Session หมดอายุ</div><div style="font-size:13px;color:var(--td)">กรุณา Login ใหม่ผ่าน Home Module</div><button class="btn btn-gold" style="max-width:240px" onclick="location.href='${HOME_URL}'">🏠 Login ใหม่</button></div></div>
    <div class="screen" id="scr-blocked"><div style="display:flex;align-items:center;justify-content:center;height:100%;flex-direction:column;gap:16px;padding:24px;text-align:center"><div style="font-size:56px">⛔</div><div style="font-size:18px;font-weight:700">ไม่สามารถเข้าใช้ได้</div><div style="font-size:13px;color:var(--td)">Department ของคุณยังไม่ได้ตั้งค่าใน BC Order<br>กรุณาติดต่อ Admin</div><button class="btn btn-outline" style="max-width:240px" onclick="location.href='${HOME_URL}'">🏠 กลับ Home</button></div></div>
    
    <!-- STORE HOME -->
    <div class="screen" id="scr-home">
      <div class="topbar">
        <div class="topbar-title">🎂 BC Order<div class="topbar-sub">Siam Palette Group</div></div>
        <div class="topbar-action notif-bell" id="homeBell" onclick="showNotifPanel()" title="แจ้งเตือน">🔔<span class="bell-badge" id="homeBellBadge" style="display:none">0</span></div>
        <div class="topbar-action" onclick="openHamburger()" title="เมนู" style="font-size:20px;font-weight:700">☰</div>
      </div>
      <div id="userBadge"></div>
      <div class="content" id="homeContent"></div>
      <div class="bottomnav" id="bottomNav"></div>
    </div>
    
    <!-- PLACE ORDER: Browse Products -->
    <div class="screen" id="scr-browse">
      <div class="topbar" style="background:var(--green-bg)">
        <div class="topbar-back" onclick="showScreen('home')">←</div>
        <div class="topbar-title" style="color:var(--green)">📝 สั่งของ<div class="topbar-sub" id="browseDate"></div></div>
        <div class="topbar-action" id="cartBadgeBtn" onclick="showScreen('cart')">🛒 <span id="cartBadgeNum" style="position:absolute;top:2px;right:2px;min-width:16px;height:16px;border-radius:8px;background:var(--green);color:#fff;font-size:13px;font-weight:700;display:none;align-items:center;justify-content:center;padding:0 4px">0</span></div>
      </div>
      <div class="date-pills" id="datePills">
        <div class="label">ส่งวัน</div>
      </div>
      <div class="search-wrap"><input class="search-input" placeholder="🔍 ค้นหาสินค้า..." oninput="S.productSearch=this.value;renderProducts()"></div>
      <div class="filter-bar" id="catFilters"></div>
      <div class="content"><div class="plist" id="productGrid"></div></div>
      <div id="cartFooter" class="cart-footer" style="display:none" onclick="showScreen('cart')">🛒 ดูตะกร้า (<span id="cartFooterCount">0</span> รายการ) →</div>
    </div>
    
    <!-- PLACE ORDER: Cart -->
    <div class="screen" id="scr-cart">
      <div class="topbar">
        <div class="topbar-back" onclick="S.editingOrderId ? showScreen('orders') : showScreen('browse')">←</div>
        <div class="topbar-title">ตะกร้า<div class="topbar-sub" id="cartCount"></div></div>
      </div>
      <div class="content" id="cartContent"></div>
      <div style="padding:12px 16px;border-top:1px solid var(--b1);background:var(--bg)">
        <button class="btn btn-gold" id="submitOrderBtn" onclick="submitOrder()">📤 สั่งเลย</button>
      </div>
    </div>
    
    <!-- ORDER HISTORY -->
    <div class="screen" id="scr-orders">
      <div class="topbar">
        <div class="topbar-back" onclick="showScreen('home')">←</div>
        <div class="topbar-title">ประวัติออเดอร์</div>
      </div>
      <div class="filter-bar" id="orderFilters" style="padding-top:8px"></div>
      <div class="content" id="orderList"></div>
    </div>
    
    <!-- ORDER DETAIL -->
    <div class="screen" id="scr-order-detail">
      <div class="topbar">
        <div class="topbar-back" onclick="showScreen(S.role==='bc'?'bc-orders':'orders')">←</div>
        <div class="topbar-title" id="detailTitle">รายละเอียดออเดอร์</div>
      </div>
      <div class="content" id="orderDetailContent"></div>
    </div>
    
    <!-- VIEW STOCK -->
    <div class="screen" id="scr-stock">
      <div class="topbar">
        <div class="topbar-back" onclick="showScreen('home')">←</div>
        <div class="topbar-title">สต็อกสินค้า</div>
      </div>
      <div class="search-wrap"><input class="search-input" placeholder="ค้นหาสินค้า..." oninput="renderStock(this.value)"></div>
      <div class="content" id="stockContent"></div>
    </div>
    
    <!-- WASTE ENTRY -->
    <div class="screen" id="scr-waste">
      <div class="topbar">
        <div class="topbar-back" onclick="showScreen(S.role==='bc'?'bc-home':'home')">←</div>
        <div class="topbar-title">บันทึก Waste</div>
      </div>
      <div class="content" id="wasteContent"></div>
    </div>
    
    <!-- RETURNS -->
    <div class="screen" id="scr-returns">
      <div class="topbar">
        <div class="topbar-back" onclick="showScreen('home')">←</div>
        <div class="topbar-title">Return / Feedback</div>
      </div>
      <div class="content" id="returnsContent"></div>
      <div class="bottomnav bc-nav" id="storeReturnsNav"></div>
    </div>
    
        <!-- RETURN DASHBOARD -->
    <div class="screen" id="scr-return-dashboard">
      <div class="topbar" style="background:var(--red-bg)">
        <div class="topbar-back" onclick="showScreen(S.role==='bc'?'bc-home':'home')">&#x2190;</div>
        <div class="topbar-title" style="color:var(--red)">&#x21a9;&#xfe0f; Return Dashboard<div class="topbar-sub" id="returnDashSub"></div></div>
      </div>
      <div class="content" id="returnDashContent"></div>
      <div class="bottomnav bc-nav" id="returnDashNav"></div>
    </div>

    <!-- ══════ BAKERY CENTRE: B1 HOME ══════ -->
    <div class="screen ub-bc" id="scr-bc-home">
      <div class="topbar">
        <div class="topbar-title">🏭 Bakery Centre<div class="topbar-sub" id="bcScopeLabel"></div></div>
        <div class="topbar-action notif-bell" id="bcHomeBell" onclick="showNotifPanel()" title="แจ้งเตือน">🔔<span class="bell-badge" id="bcHomeBellBadge" style="display:none">0</span></div>
        <div class="topbar-action" onclick="openHamburger()" title="เมนู" style="font-size:20px;font-weight:700">☰</div>
      </div>
      <div class="user-badge" id="bcUserBadge"></div>
      <div class="content" id="bcHomeContent"></div>
      <div class="bottomnav bc-nav" id="bcBottomNav"></div>
    </div>
    
    <!-- ══════ BAKERY CENTRE: B2 ORDER LIST ══════ -->
    <div class="screen" id="scr-bc-orders">
      <div class="topbar" style="background:var(--blue-bg)">
        <div class="topbar-back" onclick="showScreen('bc-home')">←</div>
        <div class="topbar-title" style="color:var(--blue)">📋 ออเดอร์<div class="topbar-sub" id="bcOrderSub"></div></div>
        <div class="topbar-action" onclick="showScreen('bc-print')" title="พิมพ์">🖨️</div>
      </div>
      <div style="padding:8px 16px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <label style="font-size:14px;color:var(--td);white-space:nowrap">📅 ส่ง:</label>
        <input class="form-input" type="date" style="flex:1;padding:6px 10px;font-size:12px;min-width:120px" onchange="S.bcDateFilter=this.value;renderBcOrderFilters();renderBcOrderList()" id="bcDateInput" onclick="this.showPicker?.()">
        <div style="display:flex;gap:4px">
          <div class="filter-chip" style="font-size:13px;padding:4px 8px" onclick="setBcDate('today')">วันนี้</div>
          <div class="filter-chip" style="font-size:13px;padding:4px 8px" onclick="setBcDate('tomorrow')">พรุ่งนี้</div>
          <div class="filter-chip" style="font-size:13px;padding:4px 8px" onclick="setBcDate('all')">ทุกวัน</div>
        </div>
      </div>
      <div class="filter-bar" id="bcOrderFilters"></div>
      <div class="content" id="bcOrderList"></div>
      <div class="bottomnav bc-nav" id="bcOrdersNav"></div>
    </div>
    
    <!-- ══════ BAKERY CENTRE: B3 ACCEPT PENDING ══════ -->
    <div class="screen" id="scr-bc-accept">
      <div class="topbar" style="background:var(--red-bg)">
        <div class="topbar-back" onclick="showScreen('bc-orders')">←</div>
        <div class="topbar-title" style="color:var(--red)">⏳ ออเดอร์รอ Accept</div>
      </div>
      <div class="content" id="bcAcceptContent"></div>
    </div>
    
    <!-- ══════ BAKERY CENTRE: B4 FULFILMENT ══════ -->
    <div class="screen" id="scr-bc-fulfil">
      <div class="topbar" style="background:var(--blue-bg)">
        <div class="topbar-back" onclick="showScreen('bc-orders')">←</div>
        <div class="topbar-title">✏️ อัพเดทการส่ง</div>
      </div>
      <div class="content" id="bcFulfilContent"></div>
    </div>
    
    <!-- ══════ BAKERY CENTRE: B5 STOCK MANAGEMENT ══════ -->
    <div class="screen" id="scr-bc-stock">
      <div class="topbar" style="background:var(--blue-bg)">
        <div class="topbar-back" onclick="showScreen('bc-home')">←</div>
        <div class="topbar-title">📦 จัดการสต็อก<div class="topbar-sub" id="bcStockSub"></div></div>
      </div>
      <div class="content" id="bcStockContent"></div>
      <div class="bottomnav bc-nav" id="bcStockNav"></div>
    </div>
    
    <!-- ══════ BAKERY CENTRE: B7 RETURNS ══════ -->
    <div class="screen" id="scr-bc-returns">
      <div class="topbar" style="background:var(--blue-bg)">
        <div class="topbar-back" onclick="showScreen('bc-home')">←</div>
        <div class="topbar-title">↩️ สินค้าคืน<div class="topbar-sub" id="bcReturnSub"></div></div>
      </div>
      <div class="filter-bar" id="bcReturnFilters"></div>
      <div class="content" id="bcReturnList"></div>
      <div class="bottomnav bc-nav" id="bcReturnsNav"></div>
    </div>
    
    <!-- ══════ BAKERY CENTRE: B8 PRINT CENTRE ══════ -->
    <div class="screen" id="scr-bc-print">
      <div class="topbar" style="background:var(--blue-bg)">
        <div class="topbar-back" onclick="showScreen('bc-home')">←</div>
        <div class="topbar-title">🖨️ Print Centre<div class="topbar-sub" id="bcPrintSub"></div></div>
        <div class="topbar-action" onclick="S.bcPrintTab==='slip'?printSlip80():window.print()" title="Print">🖨️</div>
      </div>
      <div style="padding:8px 16px;display:flex;gap:8px;align-items:center">
        <label style="font-size:14px;color:var(--td);white-space:nowrap">📅 ส่ง:</label>
        <input class="form-input" type="date" style="flex:1;padding:6px 10px;font-size:12px" onchange="S.bcPrintDate=this.value;renderBcPrint()" id="bcPrintDateInput">
      </div>
      <div class="filter-bar" id="bcPrintTabs"></div>
      <div class="content" id="bcPrintContent"></div>
      <div class="bottomnav bc-nav" id="bcPrintNav"></div>
    </div>
    
    <!-- ══════ ADMIN SCREENS ══════ -->
    <div class="screen" id="scr-admin-dashboard">
      <div class="topbar" style="background:var(--gold-bg)">
        <div class="topbar-back" onclick="showScreen('bc-home')">←</div>
        <div class="topbar-title" style="color:var(--gold)">👑 Admin Dashboard</div>
      </div>
      <div class="content" id="adminDashboardContent"></div>
    </div>
    
    <div class="screen" id="scr-admin-products">
      <div class="topbar" style="background:var(--gold-bg)">
        <div class="topbar-back" onclick="showScreen('bc-home')">←</div>
        <div class="topbar-title" style="color:var(--gold)">📦 จัดการสินค้า</div>
      </div>
      <div class="content" id="adminProductsContent"></div>
    </div>
    
    <div class="screen" id="scr-admin-access">
      <div class="topbar" style="background:var(--gold-bg)">
        <div class="topbar-back" onclick="showScreen('bc-home')">←</div>
        <div class="topbar-title" style="color:var(--gold)">👥 จัดการสิทธิ์ผู้ใช้</div>
      </div>
      <div class="content" id="adminAccessContent"></div>
    </div>
    
    <div class="screen" id="scr-admin-dept-mapping">
      <div class="topbar" style="background:var(--gold-bg)">
        <div class="topbar-back" onclick="showScreen('bc-home')">←</div>
        <div class="topbar-title" style="color:var(--gold)">🏢 Department Mapping</div>
      </div>
      <div class="content" id="adminDeptMappingContent"></div>
    </div>
    
    <div class="screen" id="scr-admin-config">
      <div class="topbar" style="background:var(--gold-bg)">
        <div class="topbar-back" onclick="showScreen('bc-home')">←</div>
        <div class="topbar-title" style="color:var(--gold)">⚙️ System Config</div>
      </div>
      <div class="content" id="adminConfigContent"></div>
    </div>
    
    <div class="screen" id="scr-admin-notif-settings">
      <div class="topbar" style="background:var(--gold-bg)">
        <div class="topbar-back" onclick="showScreen('bc-home')">←</div>
        <div class="topbar-title" style="color:var(--gold)">🔔 Notification Settings</div>
      </div>
      <div class="content" id="adminNotifSettingsContent"></div>
    </div>
    
    <div class="screen" id="scr-admin-cutoff">
      <div class="topbar" style="background:var(--gold-bg)">
        <div class="topbar-back" onclick="showScreen('bc-home')">←</div>
        <div class="topbar-title" style="color:var(--gold)">⏰ Cutoff Violations</div>
      </div>
      <div class="content" id="adminCutoffContent"></div>
    </div>
    
    <div class="screen" id="scr-admin-audit">
      <div class="topbar" style="background:var(--gold-bg)">
        <div class="topbar-back" onclick="showScreen('bc-home')">←</div>
        <div class="topbar-title" style="color:var(--gold)">📝 Audit Trail</div>
      </div>
      <div class="content" id="adminAuditContent"></div>
    </div>
    
    <div class="screen" id="scr-admin-waste-dashboard">
      <div class="topbar" style="background:var(--gold-bg)">
        <div class="topbar-back" onclick="showScreen(S.role==='bc'?'bc-home':'home')">←</div>
        <div class="topbar-title" style="color:var(--gold)">🗑️ Waste Dashboard</div>
      </div>
      <div class="content" id="adminWasteDbContent"></div>
      <div class="bottomnav bc-nav" id="bcWasteDashNav"></div>
    </div>
    
    <div class="screen" id="scr-admin-top-products">
      <div class="topbar" style="background:var(--gold-bg)">
        <div class="topbar-back" onclick="showScreen(S.role==='bc'?'bc-home':'home')">←</div>
        <div class="topbar-title" style="color:var(--gold)">🏆 Top Products</div>
      </div>
      <div class="content" id="adminTopProdContent"></div>
      <div class="bottomnav bc-nav" id="bcTopProductsNav"></div>
    </div>
    
    <div class="screen" id="scr-admin-announcements">
      <div class="topbar" style="background:var(--gold-bg)">
        <div class="topbar-back" onclick="showScreen('admin-dashboard')">←</div>
        <div class="topbar-title" style="color:var(--gold)">📢 Announcements</div>
      </div>
      <div class="content" id="adminAnnouncementsContent"></div>
    </div>
    
    <div class="screen" id="scr-admin-product-edit">
      <div class="topbar" style="background:var(--gold-bg)">
        <div class="topbar-back" onclick="showScreen('admin-products')">←</div>
        <div class="topbar-title" style="color:var(--gold)" id="productEditTitle">📦 สินค้า</div>
      </div>
      <div class="content" id="productEditContent"></div>
    </div>
  `;
}

async function showScreen(name, param) {
  S.currentScreen = name;
  S.currentParam = param || null;
  // ★ v7.0: Update sidebar active + topbar title
  updateSidebarActive(name);
  updateTopbarTitle(name);
  // Update hash for navigable screens (skip loading/error screens)
  if (HASH_SCREENS.has(name)) {
    setHash(name, param);
  }
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('scr-' + name);
  if (el) {
    el.classList.add('active');

    // ── Lazy load: ensure data is loaded before rendering ──
    try {
      // Screens that need products + categories
      if (['browse','cart','admin-products','admin-product-edit'].includes(name)) {
        if (!S._productsLoaded) {
          await Promise.all([loadCategories(), loadProducts()]);
          S._productsLoaded = true;
        }
      }
      // Screens that need orders
      if (['orders'].includes(name)) {
        if (!S._ordersLoaded) {
          await loadOrders();
          S._ordersLoaded = true;
        }
      }
      // Screens that need stock
      if (['stock','bc-stock'].includes(name)) {
        await loadStock();
      }
      // Screens that need returns
      if (['returns','return-dashboard','bc-returns'].includes(name)) {
        if (!S._returnsLoaded) {
          await loadReturns();
          S._returnsLoaded = true;
        }
      }
      // BC orders screens
      if (['bc-orders','bc-accept','bc-fulfil'].includes(name)) {
        if (!S._ordersLoaded) {
          await loadOrders();
          S._ordersLoaded = true;
        }
      }
    } catch (e) {
      console.warn('[lazy load] failed for', name, e);
    }

    // Render screen content
    switch(name) {
      case 'home': renderHome(); break;
      case 'browse': renderBrowse(); break;
      case 'cart': renderCart(); break;
      case 'orders': renderOrders(); break;
      case 'stock': renderStockScreen(); break;
      case 'waste': renderWaste(); break;
      case 'returns': renderReturnsScreen(); break;
      // BC screens
      case 'bc-home': renderBcHome(); break;
      case 'bc-orders': renderBcOrders(); break;
      case 'bc-accept': renderBcAccept(); break;
      case 'bc-fulfil': renderBcFulfil(); break;
      case 'bc-stock': renderBcStock(); break;
      case 'bc-returns': renderBcReturns(); break;
      case 'bc-print': renderBcPrint(); break;
      // Admin screens
      case 'admin-dashboard': renderAdminDashboard(); break;
      case 'admin-products': renderAdminProducts(); break;
      case 'admin-access': renderAdminAccess(); break;
      case 'admin-dept-mapping': renderAdminDeptMapping(); break;
      case 'admin-config': renderAdminConfig(); break;
      case 'admin-notif-settings': renderAdminNotifSettings(); break;
      case 'admin-cutoff': renderAdminCutoff(); break;
      case 'admin-audit': renderAdminAudit(); break;
      case 'admin-waste-dashboard': renderAdminWasteDashboard(); break;
      case 'admin-top-products': renderAdminTopProducts(); break;
      case 'return-dashboard': renderReturnDashboard(); break;
      case 'admin-announcements': renderAdminAnnouncements(); break;
      case 'admin-product-edit': renderProductEditScreen(); break;
    }
    // Render BC bottom nav on all BC sub-screens + dashboard screens in bottom nav
    if ((name.startsWith('bc-') && name !== 'bc-home') || name === 'admin-top-products' || name === 'admin-waste-dashboard' || name === 'returns' || name === 'return-dashboard') {
      renderBcSubNav(name);
    }
  }
}

// ─── BC SUB-SCREEN BOTTOM NAV ────────────────────────────────
function renderBcSubNav(currentScreen) {
  const navMap = {
    'bc-orders': 'bcOrdersNav',
    'bc-stock': 'bcStockNav',
    'bc-returns': 'bcReturnsNav',
    'bc-print': 'bcPrintNav',
    'admin-top-products': 'bcTopProductsNav',
    'admin-waste-dashboard': 'bcWasteDashNav',
    'returns': 'storeReturnsNav',
    'return-dashboard': 'returnDashNav',
  };
  const navId = navMap[currentScreen];
  if (!navId) return;
  const el = document.getElementById(navId);
  if (!el) return;
  
  // v6.0: BC gets 5 tabs (with Print), Store gets 4 tabs
  const isBcRole = S.role === 'bc';
  const items = isBcRole ? [
    { screen: 'bc-home', icon: '🏠', label: 'Main Menu' },
    { screen: 'admin-top-products', icon: '🏆', label: 'Top Products' },
    { screen: 'return-dashboard', icon: '↩️', label: 'Returns' },
    { screen: 'admin-waste-dashboard', icon: '🗑️', label: 'Waste' },
    { screen: 'bc-print', icon: '🖨️', label: 'Print' },
  ] : [
    { screen: 'home', icon: '🏠', label: 'Main Menu' },
    { screen: 'admin-top-products', icon: '🏆', label: 'Top Products' },
    { screen: 'return-dashboard', icon: '↩️', label: 'Returns' },
    { screen: 'admin-waste-dashboard', icon: '🗑️', label: 'Waste' },
  ];
  el.innerHTML = items.map(it => 
    `<div class="nav-item${it.screen === currentScreen ? ' active' : ''}" onclick="showScreen('${it.screen}')"><span class="ni">${it.icon}</span>${it.label}</div>`
  ).join('');
}

// ─── RENDER: HOME ────────────────────────────────────────────
function renderHome() {
  const s = S.session;
  if (!s) return;
  // v7.1: userBadge + bottomNav hidden by CSS, sidebar handles navigation
  renderHomeDashboard();
}

function navTo(tab) {
  if (tab === 'dashboard') renderHomeDashboard();
}

function renderHomeDashboard() {
  const d = S.dashboard || { today_total:0, by_status:{Pending:0,Ordered:0,Fulfilled:0,Delivered:0}, cutoff_violations_today:0, urgent_items:0 };
  const bs = d.by_status || {};
  const s = S.session || {};
  const done = (bs.Fulfilled||0) + (bs.Delivered||0);
  const total = d.today_total || 1;
  const pct = Math.round((done / total) * 100);

  // Admin menus (permission-gated)
  const storeAdminItems = [
    { screen:'bc-orders', icon:'📋', bg:'var(--blue-bg)', title:'All Orders', desc:'ออเดอร์ทุกร้าน ทุก section', perm:'fn_view_all_orders' },
    { screen:'bc-stock', icon:'📦', bg:'var(--green-bg)', title:'Manage Stock', desc:'เพิ่ม/ลดสต็อก ทุก section', perm:'fn_add_stock' },
    { screen:'bc-print', icon:'🖨️', bg:'var(--orange-bg)', title:'Print Centre', desc:'Production Sheet / Delivery Slip', perm:'fn_view_production' },
  ];
  const allowedStoreAdmin = storeAdminItems.filter(m => hasAdminPerm(m.perm));
  const adminMenus = allowedStoreAdmin.length > 0 ? `
    <div class="sec-hd">👑 Admin</div>
    <div class="pad" style="padding-top:0">
      ${allowedStoreAdmin.map(m => `
      <div class="card" onclick="showScreen('${m.screen}')">
        <div class="card-row"><div class="card-icon" style="background:${m.bg}">${m.icon}</div><div class="card-body"><div class="card-title">${m.title}</div><div class="card-desc">${m.desc}</div></div><div class="card-right">→</div></div>
      </div>`).join('')}
    </div>` : '';

  // Alerts
  const alerts = [];
  if (bs.Pending > 0) {
    const pendingOrders = (S.orders||[]).filter(o=>o.status==='Pending');
    pendingOrders.forEach(o => {
      alerts.push(`<div style="display:flex;align-items:center;gap:5px;padding:5px 8px;border-radius:var(--rd2);margin-bottom:2px;font-size:13px;font-weight:500;background:var(--red-bg);color:var(--red)">🚨 ${o.order_id} ${getStoreName(o.store_id)} — pending accept${o.is_cutoff_violation?' · cutoff ⚠️':''}</div>`);
    });
  }
  if (d.urgent_items > 0) {
    alerts.push(`<div style="display:flex;align-items:center;gap:5px;padding:5px 8px;border-radius:var(--rd2);margin-bottom:2px;font-size:13px;font-weight:500;background:#fef3c7;color:#92400e">⚡ ${d.urgent_items} urgent items</div>`);
  }

  document.getElementById('homeContent').innerHTML = `
    <div style="padding:14px 18px">
      <!-- KPI Pills -->
      <div style="display:flex;gap:5px;margin-bottom:10px;flex-wrap:wrap">
        <div style="padding:7px 12px;border-radius:var(--rd2);background:var(--green-bg)"><div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.3px;color:var(--green)">Done</div><div style="font-size:16px;font-weight:800;color:var(--green)">${done}</div></div>
        <div style="padding:7px 12px;border-radius:var(--rd2);background:var(--blue-bg)"><div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.3px;color:var(--blue)">ผลิต</div><div style="font-size:16px;font-weight:800;color:var(--blue)">${(bs.Ordered||0)+(bs.InProgress||0)}</div></div>
        <div style="padding:7px 12px;border-radius:var(--rd2);background:var(--red-bg)"><div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.3px;color:var(--red)">Pending</div><div style="font-size:16px;font-weight:800;color:var(--red)">${bs.Pending||0}</div></div>
        <div style="padding:7px 12px;border-radius:var(--rd2);background:var(--orange-bg)"><div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.3px;color:var(--orange)">Urgent</div><div style="font-size:16px;font-weight:800;color:var(--orange)">${d.urgent_items||0}</div></div>
      </div>

      <!-- Progress bar -->
      <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--t3);font-weight:600;margin-bottom:2px"><span><span style="display:inline-block;width:4px;height:4px;border-radius:50%;background:var(--green);margin-right:2px;animation:pulse 2s infinite"></span>Today</span><span style="color:var(--green)">${done}/${d.today_total}</span></div>
      <div style="height:4px;border-radius:2px;background:var(--s2);overflow:hidden;margin-bottom:8px"><div style="height:100%;border-radius:2px;width:${pct}%;background:linear-gradient(90deg,var(--green),#2ecc71)"></div></div>

      <!-- Alerts -->
      ${alerts.length > 0 ? `<div style="margin-bottom:8px">${alerts.join('')}</div>` : ''}

      <!-- Orders Quick Menu (2-col grid) -->
      <div class="sec-hd" style="padding-left:0">Orders</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:10px">
        ${hasPerm('fn_create_order') ? `<div class="card" style="border-left:3px solid var(--gold)" onclick="startOrder()"><div style="display:flex;align-items:center;gap:8px"><div style="font-size:14px">📝</div><div style="flex:1"><div class="card-title" style="font-size:13px">Create Order</div><div class="card-desc" style="font-size:11px">สั่งเค้ก ซอสไปที่ร้าน</div></div><div class="card-right" style="font-size:13px">→</div></div></div>` : ''}
        ${hasPerm('fn_view_own_orders') ? `<div class="card" onclick="showScreen('orders')"><div style="display:flex;align-items:center;gap:8px"><div style="font-size:14px">📋</div><div style="flex:1"><div class="card-title" style="font-size:13px">View Orders</div><div class="card-desc" style="font-size:11px">ดูรายการสั่งย้อนหลัง</div></div><div class="card-right" style="font-size:13px">→</div></div></div>` : ''}
        ${hasPerm('fn_view_stock') ? `<div class="card" onclick="showScreen('stock')"><div style="display:flex;align-items:center;gap:8px"><div style="font-size:14px">📦</div><div style="flex:1"><div class="card-title" style="font-size:13px">View Stock</div><div class="card-desc" style="font-size:11px">สินค้าพร้อมส่ง</div></div><div class="card-right" style="font-size:13px">→</div></div></div>` : ''}
      </div>

      <!-- Records Quick Menu -->
      <div class="sec-hd" style="padding-left:0">Records</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:10px">
        ${hasPerm('fn_log_waste') ? `<div class="card" onclick="showScreen('waste')"><div style="display:flex;align-items:center;gap:8px"><div style="font-size:14px">🗑️</div><div style="flex:1"><div class="card-title" style="font-size:13px">Record Waste</div><div class="card-desc" style="font-size:11px">สินค้าหมดอายุ / เสียหาย</div></div><div class="card-right" style="font-size:13px">→</div></div></div>` : ''}
        ${hasPerm('fn_create_return') ? `<div class="card" onclick="showScreen('returns')"><div style="display:flex;align-items:center;gap:8px"><div style="font-size:14px">↩️</div><div style="flex:1"><div class="card-title" style="font-size:13px">Return / Feedback</div><div class="card-desc" style="font-size:11px">แจ้งปัญหาคุณภาพสินค้า</div></div><div class="card-right" style="font-size:13px">→</div></div></div>` : ''}
      </div>
      ${adminMenus}
    </div>
  `;
}

// ─── RENDER: BROWSE PRODUCTS ─────────────────────────────────
function startOrder() {
  S.deliveryDate = tomorrowSydney();
  S.headerNote = '';
  showScreen('browse');
}

function renderBrowse() {
  // Clear edit mode when browsing for new order
  if (S.editingOrderId) {
    S.editingOrderId = null;
    S.cart = [];
    S.headerNote = '';
  }
  // Date pills
  const today = todaySydney();
  const tmrStr = tomorrowSydney();
  const isToday = S.deliveryDate === today;
  const isTmr = S.deliveryDate === tmrStr;
  const isCustom = !isToday && !isTmr;
  
  document.getElementById('datePills').innerHTML = `
    <div class="label">ส่งวัน</div>
    <div class="dpill ${isToday?'active':''}" onclick="setDeliveryDate('${today}')">วันนี้</div>
    <div class="dpill ${isTmr?'active':''}" onclick="setDeliveryDate('${tmrStr}')">พรุ่งนี้</div>
    <div class="dpill ${isCustom?'active':''}" onclick="pickDeliveryDate()">เลือกวัน</div>
  `;
  document.getElementById('browseDate').textContent = formatDateThai(S.deliveryDate);
  
  // Category filters with emoji
  document.getElementById('catFilters').innerHTML = `
    <div class="filter-chip ${S.productFilter==='all'?'active':''}" onclick="S.productFilter='all';renderBrowse()">ทั้งหมด</div>
    ${S.categories.map(c => `<div class="filter-chip ${S.productFilter===c.cat_id?'active':''}" onclick="S.productFilter='${c.cat_id}';renderBrowse()">${catEmoji(c.cat_name)} ${c.cat_name}</div>`).join('')}
  `;
  
  renderProducts();
  updateCartBadge();
}

function setDeliveryDate(d) {
  S.deliveryDate = d;
  renderBrowse();
}

function pickDeliveryDate() {
  const min = todaySydney();
  const syd = sydneyNow(); syd.setDate(syd.getDate() + 7);
  const max = formatDate(syd);
  showDialog(`
    <div style="font-size:16px;font-weight:700;margin-bottom:12px">📅 เลือกวันส่ง</div>
    <div style="position:relative">
      <input type="date" id="dlvDatePick" value="${S.deliveryDate}" min="${min}" max="${max}" 
        onclick="this.showPicker?.()" 
        style="width:100%;padding:12px 14px;border:1.5px solid var(--b2);border-radius:10px;font-size:16px;font-family:inherit;color:var(--t);background:var(--s1);-webkit-appearance:none;cursor:pointer">
      <div style="position:absolute;right:12px;top:50%;transform:translateY(-50%);pointer-events:none;font-size:18px">📅</div>
    </div>
    <div style="font-size:14px;color:var(--td);margin-top:8px">เลือกได้ตั้งแต่วันนี้ถึง 7 วันข้างหน้า</div>
    <div style="display:flex;gap:8px;margin-top:16px">
      <button class="btn btn-outline" style="flex:1" onclick="closeDialog()">ยกเลิก</button>
      <button class="btn btn-gold" style="flex:1" onclick="setDeliveryDate(document.getElementById('dlvDatePick').value);closeDialog()">✅ ยืนยัน</button>
    </div>
  `);
  // Auto-open picker after dialog renders
  setTimeout(() => { const el = document.getElementById('dlvDatePick'); if(el && el.showPicker) try { el.showPicker(); } catch(e){} }, 300);
}

function catEmoji(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('cake')) return '🎂';
  if (n.includes('sauce')) return '🍶';
  if (n.includes('baked') || n.includes('bakery')) return '🍞';
  if (n.includes('drink')) return '🧃';
  return '📦';
}

function renderProducts() {
  let prods = S.products.filter(p => p.is_active === true || p.is_active === 'TRUE');
  if (S.productFilter !== 'all') prods = prods.filter(p => p.cat_id === S.productFilter);
  if (S.productSearch) { const q = S.productSearch.toLowerCase(); prods = prods.filter(p => p.product_name.toLowerCase().includes(q)); }

  const grid = document.getElementById('productGrid');
  if (prods.length === 0) {
    grid.innerHTML = '<div class="empty"><div class="empty-icon">🔍</div><div class="empty-title">ไม่พบสินค้า</div></div>';
    updateCartFooter(); return;
  }

  grid.innerHTML = `<div style="display:flex;flex-direction:column;gap:4px;padding:0 4px 120px">${prods.map(p => {
    const inCart = S.cart.find(c => c.product_id === p.product_id);
    const qty = inCart ? inCart.qty : 0;
    const sa = p.stock_available || 0;
    const stockColor = sa === 0 ? 'var(--red)' : (sa <= (p.min_order || 1) * 2 ? 'var(--orange)' : 'var(--green)');
    const stockText = sa === 0 ? `📦 0 ${p.unit} — ผลิตใหม่` : `📦 ${sa} ${p.unit}`;
    const canMinus = qty > 0;
    const borderStyle = inCart ? 'border:1px solid #c8e6c9;background:var(--green-bg)' : 'border:1px solid var(--bd2);background:#fff';
    const btnBorder = inCart ? 'var(--green)' : 'var(--bd)';
    const btnColor = inCart ? 'var(--green)' : 'var(--t4)';

    return `<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;${borderStyle};border-radius:var(--rd)">
      <div style="width:44px;height:44px;background:${inCart?'#fff':'var(--s1)'};border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0">${prodEmoji(p.product_name)}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:12px;font-weight:700">${p.product_name}</div>
        <div style="font-size:13px;color:${stockColor}">${stockText}</div>
        <div style="font-size:12px;color:var(--t4)">min: ${p.min_order||1} | step: ${p.order_step||1}</div>
      </div>
      <div style="display:flex;align-items:center;gap:6px">
        <div style="width:28px;height:28px;border-radius:50%;border:2px solid ${canMinus?btnBorder:'var(--bd)'};display:flex;align-items:center;justify-content:center;font-size:14px;color:${canMinus?btnColor:'var(--t4)'};cursor:pointer;font-weight:700" onclick="removeFromBrowse('${p.product_id}')">−</div>
        <div style="font-size:16px;font-weight:800;min-width:20px;text-align:center;color:${qty>0?'var(--t)':'var(--t4)'}">${qty}</div>
        <div style="width:28px;height:28px;border-radius:50%;border:2px solid ${btnBorder};display:flex;align-items:center;justify-content:center;font-size:14px;color:${inCart?btnColor:'var(--t2)'};cursor:pointer;font-weight:700" onclick="addToCart('${p.product_id}')">+</div>
        ${inCart ? `<div style="width:28px;height:28px;border-radius:50%;background:${inCart.is_urgent?'var(--orange)':'var(--s2)'};display:flex;align-items:center;justify-content:center;font-size:12px;cursor:pointer;${inCart.is_urgent?'':'opacity:.4'}" onclick="toggleUrgentBrowse('${p.product_id}')" title="⚡ Urgent">⚡</div>` : ''}
      </div>
    </div>`;
  }).join('')}</div>`;

  updateCartFooter();
}

function addToCart(productId) {
  const p = S.products.find(x => x.product_id === productId);
  if (!p) return;
  
  if (p.popup_notice) toast(p.popup_notice, 'warning');
  
  const existing = S.cart.find(c => c.product_id === productId);
  if (existing) {
    existing.qty += p.order_step || 1;
  } else {
    S.cart.push({
      product_id: p.product_id,
      product_name: p.product_name,
      qty: p.min_order || 1,
      unit: p.unit,
      section_id: p.section_id,
      min_order: p.min_order,
      order_step: p.order_step || 1,
      is_urgent: false,
      note: '',
    });
  }
  
  renderProducts();
  updateCartBadge();
}

function toggleUrgentBrowse(productId) {
  const item = S.cart.find(c => c.product_id === productId);
  if (!item) return;
  item.is_urgent = !item.is_urgent;
  renderProducts();
}

function removeFromBrowse(productId) {
  const idx = S.cart.findIndex(c => c.product_id === productId);
  if (idx === -1) return;
  const item = S.cart[idx];
  const p = S.products.find(x => x.product_id === productId);
  const step = p ? (p.order_step || 1) : 1;
  const minOrder = p ? (p.min_order || 1) : 1;
  
  item.qty -= step;
  if (item.qty < minOrder) {
    S.cart.splice(idx, 1);
  }
  
  renderProducts();
  updateCartBadge();
}

function updateCartBadge() {
  // Top right cart badge
  const numEl = document.getElementById('cartBadgeNum');
  if (numEl) {
    if (S.cart.length > 0) { numEl.style.display = 'flex'; numEl.textContent = S.cart.length; }
    else { numEl.style.display = 'none'; }
  }
  updateCartFooter();
}

function updateCartFooter() {
  const footer = document.getElementById('cartFooter');
  const countEl = document.getElementById('cartFooterCount');
  if (footer) {
    footer.style.display = S.cart.length > 0 ? 'block' : 'none';
  }
  if (countEl) countEl.textContent = S.cart.length;
}

// ─── RENDER: CART ────────────────────────────────────────────
function renderCart() {
  document.getElementById('cartCount').textContent = S.cart.length + ' รายการ';
  const content = document.getElementById('cartContent');
  const submitBtn = document.getElementById('submitOrderBtn');

  if (S.editingOrderId) {
    submitBtn.innerHTML = '💾 บันทึกการแก้ไข';
    document.getElementById('cartCount').textContent = S.cart.length + ' รายการ · ✏️ ' + S.editingOrderId;
  } else {
    submitBtn.innerHTML = '📤 สั่งเลย';
  }

  if (S.cart.length === 0) {
    content.innerHTML = '<div class="empty"><div class="empty-icon">🛒</div><div class="empty-title">ตะกร้าว่าง</div><div class="empty-desc">กดสินค้าเพื่อเพิ่ม</div></div>';
    submitBtn.disabled = true; submitBtn.style.display = 'none'; return;
  }
  submitBtn.disabled = false; submitBtn.style.display = '';

  const totalPcs = S.cart.reduce((s,c) => s + c.qty, 0);
  const urgentCount = S.cart.filter(c => c.is_urgent).length;

  content.innerHTML = `
    <div style="padding:14px 18px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
        <div class="date-badge">📅 ส่งวันที่ ${formatDateThai(S.deliveryDate)}</div>
        <button class="btn btn-outline btn-sm" onclick="changeDeliveryDate()">เปลี่ยน</button>
      </div>
      ${S.editingOrderId && S.deliveryDate === todaySydney() ? `<div style="padding:8px 10px;background:var(--orange-bg);border:1px solid #f0d8a0;border-radius:var(--rd2);font-size:12px;color:var(--orange);margin-bottom:10px">⚠️ <b>หมายเหตุ:</b> ถ้าแก้ไข order หลัง cutoff time → status จะเปลี่ยนจาก <b>Ordered → Pending</b> โดยอัตโนมัติ</div>` : ''}

      <!-- Cart Items -->
      ${S.cart.map((item, idx) => {
        const isFulfilled = S.editingOrderId && item.fulfilment_status;
        return `<div style="padding:12px 0;border-bottom:1px solid var(--bd2)">
          <div style="display:flex;align-items:flex-start;gap:10px">
            <div style="width:40px;height:40px;background:var(--s1);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">${prodEmoji(item.product_name)}</div>
            <div style="flex:1;min-width:0">
              <div style="font-size:12px;font-weight:700">${item.product_name}${isFulfilled ? ' <span style="font-size:12px;padding:2px 6px;border-radius:6px;background:var(--green-bg);color:var(--green)">✅ ทำแล้ว</span>' : ''}</div>
              <div style="font-size:13px;color:var(--t3)">${item.unit} · ขั้นต่ำ ${item.min_order}${item.order_step>1?' · step '+item.order_step:''}${isFulfilled ? ' · sent:'+item.qty_sent : ''}</div>
              ${isFulfilled ? '<div style="font-size:13px;color:var(--red);margin-top:2px">🔒 แก้ไขไม่ได้ — BC ทำแล้ว</div>' : `<div style="display:flex;align-items:center;gap:6px;margin-top:6px">
                <div style="padding:3px 10px;${item.is_urgent?'background:var(--red);color:#fff':'background:#fff;border:1.5px solid var(--bd);color:var(--t3)'};border-radius:6px;font-size:12px;font-weight:${item.is_urgent?'700':'600'};cursor:pointer" onclick="toggleUrgent(${idx})">⚡ URGENT</div>
                <input class="form-input" style="flex:1;padding:4px 8px;font-size:13px;max-width:180px" placeholder="โน้ต..." value="${item.note||''}" onchange="S.cart[${idx}].note=this.value">
              </div>`}
            </div>
            <div style="display:flex;flex-direction:column;align-items:center;gap:2px">
              ${isFulfilled ? `<div style="font-size:18px;font-weight:800">${item.qty}</div>` : `<div style="display:flex;align-items:center;gap:6px">
                <div style="width:30px;height:30px;border-radius:50%;border:2px solid var(--bd);display:flex;align-items:center;justify-content:center;font-size:15px;color:var(--t2);cursor:pointer;font-weight:700" onclick="adjustQty(${idx},-1)">−</div>
                <div style="font-size:18px;font-weight:800;min-width:24px;text-align:center">${item.qty}</div>
                <div style="width:30px;height:30px;border-radius:50%;border:2px solid var(--bd);display:flex;align-items:center;justify-content:center;font-size:15px;color:var(--t2);cursor:pointer;font-weight:700" onclick="adjustQty(${idx},1)">+</div>
              </div>
              <div style="font-size:12px;color:var(--red);cursor:pointer;margin-top:2px" onclick="removeFromCart(${idx})">ลบ</div>`}
            </div>
          </div>
        </div>`;
      }).join('')}

      <!-- Order Note -->
      <div style="margin-top:14px">
        <div style="font-size:13px;color:var(--t3);margin-bottom:4px">📝 โน้ตสำหรับ Order ทั้งหมด</div>
        <textarea class="form-input" rows="2" placeholder="เช่น ส่งตอน 10:30" style="resize:vertical;font-size:13px" onchange="S.headerNote=this.value">${S.headerNote}</textarea>
      </div>

      <!-- Summary + Submit -->
      <div style="padding:8px 10px;background:var(--s1);border-radius:var(--rd2);display:flex;justify-content:space-between;font-size:13px;font-weight:600;margin:10px 0 8px"><span>${S.cart.length} รายการ · ${totalPcs} ชิ้น</span>${urgentCount > 0 ? `<span style="color:var(--red)">${urgentCount} urgent</span>` : ''}</div>
      <div style="display:flex;gap:5px">
        <button class="btn btn-gold" style="flex:1;padding:10px;font-size:12px" onclick="submitOrder()">📤 ${S.editingOrderId ? 'บันทึกการแก้ไข' : 'สั่งเลย'}</button>
        <button class="btn btn-outline" style="flex:0.5;padding:10px;font-size:13px" onclick="${S.editingOrderId ? "showScreen('orders')" : "showScreen('browse')"}">← ${S.editingOrderId ? 'ยกเลิก' : 'เลือกเพิ่ม'}</button>
      </div>
    </div>`;
}

function adjustQty(idx, delta) {
  const item = S.cart[idx];
  const step = item.order_step || 1;
  item.qty = Math.max(item.min_order, item.qty + (delta * step));
  renderCart();
}

function removeFromCart(idx) {
  S.cart.splice(idx, 1);
  renderCart();
  updateCartBadge();
}

function toggleUrgent(idx) {
  S.cart[idx].is_urgent = !S.cart[idx].is_urgent;
  renderCart();
}

function changeDeliveryDate() {
  showDialog(`
    <div style="font-size:16px;font-weight:700;margin-bottom:12px">📅 เลือกวันส่ง</div>
    <div style="position:relative">
      <input type="date" id="dlvDate" value="${S.deliveryDate}" min="${todaySydney()}"
        onclick="this.showPicker?.()"
        style="width:100%;padding:12px 14px;border:1.5px solid var(--b2);border-radius:10px;font-size:16px;font-family:inherit;color:var(--t);background:var(--s1);-webkit-appearance:none;cursor:pointer">
      <div style="position:absolute;right:12px;top:50%;transform:translateY(-50%);pointer-events:none;font-size:18px">📅</div>
    </div>
    <div style="font-size:14px;color:var(--td);margin-top:8px">⚠️ หากเลือกวันนี้และหลัง 05:00 จะเป็น Pending (รอ BC ยืนยัน)</div>
    <div style="display:flex;gap:8px;margin-top:16px">
      <button class="btn btn-outline" style="flex:1" onclick="closeDialog()">ยกเลิก</button>
      <button class="btn btn-gold" style="flex:1" onclick="S.deliveryDate=document.getElementById('dlvDate').value;closeDialog();renderCart()">✅ ยืนยัน</button>
    </div>
  `);
  setTimeout(() => { const el = document.getElementById('dlvDate'); if(el && el.showPicker) try { el.showPicker(); } catch(e){} }, 300);
}

async function submitOrder() {
  if (S.cart.length === 0) return;
  
  const submitBtn = document.getElementById('submitOrderBtn');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px"></div> กำลังส่ง...';
  
  const isEdit = !!S.editingOrderId;
  
  if (isEdit) {
    // EDIT MODE: call edit_order API
    // Filter out fulfilled items (BC already processed them)
    const editableItems = S.cart.filter(c => !c.fulfilment_status);
    const body = {
      order_id: S.editingOrderId,
      delivery_date: S.deliveryDate,  // send delivery_date for cutoff check
      header_note: S.headerNote,
      items: editableItems.map(c => ({
        item_id: c.item_id,
        product_id: c.product_id,
        qty: c.qty,
        is_urgent: c.is_urgent,
        note: c.note,
      }))
    };
    
    try {
      const resp = await api('edit_order', body);
      if (resp.success) {
        toast(resp.message || '✅ แก้ไขเรียบร้อย!', 'success');
        S.cart = [];
        S.headerNote = '';
        S.editingOrderId = null;
        setTimeout(() => showScreen('orders'), 1500);
      } else {
        toast(resp.message || 'เกิดข้อผิดพลาด', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '💾 บันทึกการแก้ไข';
      }
    } catch (err) {
      toast('✅ แก้ไขเรียบร้อย! (Demo)', 'success');
      S.cart = [];
      S.editingOrderId = null;
      setTimeout(() => showScreen('orders'), 1500);
    }
  } else {
    // CREATE MODE: call create_order API
    const body = {
      delivery_date: S.deliveryDate,
      header_note: S.headerNote,
      items: S.cart.map(c => ({
        product_id: c.product_id,
        qty: c.qty,
        is_urgent: c.is_urgent,
        note: c.note,
      }))
    };
    
    try {
      const resp = await api('create_order', body);
      if (resp.success) {
        toast(resp.message || '✅ สั่งเรียบร้อย!', 'success');
        S.cart = [];
        S.headerNote = '';
        // Reload data so Home counter updates immediately
        setTimeout(async () => {
          try { await loadOrders(); } catch(e) {}
          try { await loadDashboard(); } catch(e) {}
          showScreen('home');
        }, 1500);
      } else {
        toast(resp.message || 'เกิดข้อผิดพลาด', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '📤 สั่งเลย';
      }
    } catch (err) {
      toast('✅ สั่งเรียบร้อย! (Demo)', 'success');
      S.cart = [];
      setTimeout(() => showScreen('home'), 1500);
    }
  }
}

// ─── RENDER: ORDERS ──────────────────────────────────────────
async function renderOrders() {
  const content = document.getElementById('orderList');
  content.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  try { await loadOrders(); } catch(e) {}

  // Status counts
  const all = S.orders;
  const counts = { all:all.length, Pending:all.filter(o=>o.status==='Pending').length, Ordered:all.filter(o=>o.status==='Ordered').length, Fulfilled:all.filter(o=>o.status==='Fulfilled').length, Delivered:all.filter(o=>o.status==='Delivered').length };

  document.getElementById('orderFilters').innerHTML = `
    <div class="filter-chip ${S.orderFilter==='all'?'active':''}" onclick="S.orderFilter='all';filterOrders()">All (${counts.all})</div>
    <div class="filter-chip ${S.orderFilter==='Pending'?'active':''}" onclick="S.orderFilter='Pending';filterOrders()">⏳ Pending (${counts.Pending})</div>
    <div class="filter-chip ${S.orderFilter==='Ordered'?'active':''}" onclick="S.orderFilter='Ordered';filterOrders()">📦 Ordered (${counts.Ordered})</div>
    <div class="filter-chip ${S.orderFilter==='Fulfilled'?'active':''}" onclick="S.orderFilter='Fulfilled';filterOrders()">✅ Fulfilled (${counts.Fulfilled})</div>
    <div class="filter-chip ${S.orderFilter==='Delivered'?'active':''}" onclick="S.orderFilter='Delivered';filterOrders()">🚚 Delivered (${counts.Delivered})</div>`;

  filterOrders();
}

function filterOrders() {
  const content = document.getElementById('orderList');
  let orders = S.orders;
  if (S.orderFilter !== 'all') orders = orders.filter(o => o.status === S.orderFilter);

  document.querySelectorAll('#orderFilters .filter-chip').forEach(c => {
    c.classList.toggle('active', c.textContent.includes(S.orderFilter === 'all' ? 'All' : S.orderFilter));
  });

  if (orders.length === 0) {
    content.innerHTML = '<div class="empty"><div class="empty-icon">📋</div><div class="empty-title">ไม่มีออเดอร์</div></div>';
    return;
  }

  const bdrMap = { Pending:'var(--red)', Ordered:'var(--blue)', InProgress:'var(--orange)', Fulfilled:'var(--green)', Delivered:'var(--green)' };

  content.innerHTML = `<div style="padding:8px 16px;overflow-x:auto">
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead><tr style="background:var(--s1)">
        <th style="padding:5px 7px;text-align:left;font-weight:600;font-size:11px;color:var(--t3);text-transform:uppercase;letter-spacing:.2px;border-bottom:2px solid var(--bd)">Order ID</th>
        <th style="padding:5px 7px;text-align:left;font-weight:600;font-size:11px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">Order Date</th>
        <th style="padding:5px 7px;text-align:left;font-weight:600;font-size:11px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">Delivery</th>
        <th style="padding:5px 7px;text-align:left;font-weight:600;font-size:11px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">Items</th>
        <th style="padding:5px 7px;text-align:left;font-weight:600;font-size:11px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">Status</th>
        <th style="padding:5px 7px;text-align:left;font-weight:600;font-size:11px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">Note</th>
      </tr></thead>
      <tbody>${orders.map(o => {
        const bdr = bdrMap[o.status] || 'var(--bd)';
        const isDone = o.status === 'Fulfilled' || o.status === 'Delivered';
        const itemsSummary = (o.items||[]).map(i => `${(i.product_name||'').split(' ')[0]} ×${i.qty_ordered}${i.is_urgent?'⚡':''}`).join(', ') || '—';
        return `<tr style="cursor:pointer;border-left:3px solid ${bdr};${isDone?'opacity:.7':''}" onclick="viewOrder('${o.order_id}')">
          <td style="padding:5px 7px;border-bottom:1px solid var(--bd2);font-weight:700;color:var(--gold)">${o.order_id}</td>
          <td style="padding:5px 7px;border-bottom:1px solid var(--bd2)">${formatDateAU(o.order_date)}</td>
          <td style="padding:5px 7px;border-bottom:1px solid var(--bd2)">${formatDateAU(o.delivery_date)}</td>
          <td style="padding:5px 7px;border-bottom:1px solid var(--bd2);font-size:12px">${itemsSummary}</td>
          <td style="padding:5px 7px;border-bottom:1px solid var(--bd2)"><span class="status ${statusClass(o.status)}">${o.status}</span></td>
          <td style="padding:5px 7px;border-bottom:1px solid var(--bd2);font-size:12px;color:var(--t3)">${o.is_cutoff_violation?'<span style="font-size:11px;background:var(--orange-bg);color:var(--orange);padding:1px 4px;border-radius:3px">⚠️</span> ':''}${o.header_note||'—'}</td>
        </tr>`;
      }).join('')}</tbody>
    </table>
    <div style="font-size:12px;color:var(--t3);text-align:center;padding:6px">แสดง ${orders.length} orders · 30 วัน</div>
  </div>`;
}

async function viewOrder(orderId) {
  showScreen('order-detail', orderId);
  const content = document.getElementById('orderDetailContent');
  content.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  
  try {
    await loadOrderDetail(orderId);
  } catch(e) {
    // Mock detail
    S.currentOrder = { order: S.orders.find(o => o.order_id === orderId), items: [] };
  }
  
  const o = S.currentOrder?.order;
  if (!o) { content.innerHTML = '<div class="empty"><div class="empty-title">ไม่พบออเดอร์</div></div>'; return; }
  
  document.getElementById('detailTitle').innerHTML = `${o.order_id}<div class="topbar-sub">${getStoreName(o.store_id)} · ${getDeptName(o.dept_id)}</div>`;
  
  const items = S.currentOrder?.items || [];
  
  content.innerHTML = `
    <div style="padding:14px 18px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px"><button class="btn btn-outline btn-sm" onclick="showScreen(S.role==='bc'?'bc-orders':'orders')">← กลับ</button><div style="font-size:12px;font-weight:700;color:var(--gold)">${o.order_id}</div></div>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span class="status ${statusClass(o.status)}" style="font-size:13px;padding:4px 10px">${o.status}</span>
        ${o.is_cutoff_violation ? '<span style="font-size:11px;background:var(--orange-bg);color:var(--orange);padding:2px 6px;border-radius:4px">⚠️ Cutoff Violation</span>' : ''}
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:10px">
        <div><div style="font-size:12px;color:var(--t3)">สั่งเมื่อ</div><div style="font-size:13px;font-weight:600">${formatDateThai(o.order_date)}</div></div>
        <div><div style="font-size:12px;color:var(--t3)">วันส่ง</div><div style="font-size:13px;font-weight:600">${formatDateThai(o.delivery_date)}</div></div>
        <div><div style="font-size:12px;color:var(--t3)">สั่งโดย</div><div style="font-size:13px;font-weight:600">${o.display_name||o.user_id||'—'}</div></div>
      </div>

      ${o.header_note ? `<div style="background:var(--s1);border-radius:6px;padding:7px;margin-bottom:8px;font-size:13px">📝 ${o.header_note}</div>` : ''}

      <div style="font-size:13px;font-weight:700;margin-bottom:6px">รายการสินค้า (${items.length})</div>
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:8px">
        <thead><tr style="background:var(--s1)">
          <th style="padding:5px 7px;text-align:left;font-weight:600;font-size:11px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">สินค้า</th>
          <th style="padding:5px 7px;text-align:center;font-weight:600;font-size:11px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">จำนวน</th>
          <th style="padding:5px 7px;text-align:center;font-weight:600;font-size:11px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">⚡</th>
          <th style="padding:5px 7px;text-align:left;font-weight:600;font-size:11px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">Note</th>
          <th style="padding:5px 7px;text-align:center;font-weight:600;font-size:11px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">Fulfilment</th>
        </tr></thead>
        <tbody>${items.length > 0 ? items.map(item => `<tr>
          <td style="padding:5px 7px;border-bottom:1px solid var(--bd2);font-weight:600">${prodEmoji(item.product_name)} ${item.product_name||item.product_id}</td>
          <td style="padding:5px 7px;border-bottom:1px solid var(--bd2);text-align:center;font-weight:700">${item.qty_ordered} ${item.unit||''}</td>
          <td style="padding:5px 7px;border-bottom:1px solid var(--bd2);text-align:center;color:var(--red);font-weight:700">${item.is_urgent?'⚡':'—'}</td>
          <td style="padding:5px 7px;border-bottom:1px solid var(--bd2);font-size:12px">${item.item_note||'—'}</td>
          <td style="padding:5px 7px;border-bottom:1px solid var(--bd2);text-align:center">${item.fulfilment_status ? `<span style="color:${item.fulfilment_status==='full'?'var(--green)':'var(--red)'};font-weight:600">${item.fulfilment_status} (${item.qty_sent||0})</span>` : '—'}</td>
        </tr>`).join('') : '<tr><td colspan="5" style="padding:16px;text-align:center;color:var(--tm)">ไม่มีรายการ</td></tr>'}</tbody>
      </table>

      ${['Pending','Ordered'].includes(o.status) ? `
        <div style="padding:8px 10px;background:var(--orange-bg);border:1px solid #f0d8a0;border-radius:var(--rd2);font-size:12px;color:var(--orange);margin-bottom:10px">⚠️ <b>หมายเหตุ:</b> ถ้าแก้ไข order หลัง cutoff time → status จะเปลี่ยนจาก <b>Ordered → Pending</b> โดยอัตโนมัติ</div>
        <div style="display:flex;gap:5px">
          <button class="btn btn-outline" style="flex:1" onclick="editOrder('${o.order_id}')">✏️ แก้ไข</button>
          <button class="btn btn-red btn-sm" style="padding:7px 10px" onclick="deleteOrder('${o.order_id}')">🗑️ ลบ</button>
        </div>
      ` : ''}
    </div>
  `;
}

// ─── EDIT ORDER (load items into cart for editing) ───────────
async function editOrder(orderId) {
  toast('⏳ กำลังโหลด...', 'info');
  try {
    const resp = await api('get_order_detail', null, { order_id: orderId });
    if (!resp.success) { toast(resp.message || 'โหลดไม่ได้', 'error'); return; }
    
    const order = resp.data.order;
    const items = resp.data.items || [];
    
    // Populate cart from order items
    S.cart = items.map(item => {
      const prod = (S.products || []).find(p => p.product_id === item.product_id) || {};
      return {
        product_id: item.product_id,
        product_name: item.product_name || prod.product_name || item.product_id,
        unit: item.unit || prod.unit || '',
        qty: item.qty_ordered,
        min_order: prod.min_order || 1,
        order_step: prod.order_step || 1,
        is_urgent: !!item.is_urgent,
        note: item.item_note || '',
        item_id: item.item_id,
        fulfilment_status: item.fulfilment_status || null,  // lock if BC already processed
        qty_sent: item.qty_sent || 0,
      };
    });
    
    S.editingOrderId = orderId;
    S.deliveryDate = order.delivery_date || todaySydney();
    S.headerNote = order.header_note || '';
    
    showScreen('cart');
  } catch(e) {
    toast('เกิดข้อผิดพลาด', 'error');
  }
}

async function deleteOrder(orderId) {
  if (!confirm('ลบออเดอร์ ' + orderId + ' ?')) return;
  try {
    const resp = await api('delete_order', { order_id: orderId });
    toast(resp.message || 'ลบแล้ว', resp.success ? 'success' : 'error');
  } catch(e) {
    toast('ลบแล้ว (Demo)', 'success');
  }
  showScreen('orders');
}

// Alias for BC order list referencing viewOrderDetail
const viewOrderDetail = viewOrder;

// ─── RENDER: STOCK ───────────────────────────────────────────
async function renderStockScreen() {
  const content = document.getElementById('stockContent');
  content.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  
  try { await loadStock(); } catch(e) {
    // Use product data as mock stock
    S.stock = S.products.filter(p => p.allow_stock).map(p => ({
      product_id: p.product_id, product_name: p.product_name,
      unit: p.unit, section_id: p.section_id,
      stock_actual: p.stock_available || 0,
      stock_available: p.stock_available || 0,
    }));
  }
  
  renderStock('');
}

function renderStock(search) {
  const content = document.getElementById('stockContent');
  let items = S.stock;
  if (search) items = items.filter(s => s.product_name.toLowerCase().includes(search.toLowerCase()));

  if (items.length === 0) {
    content.innerHTML = '<div class="empty"><div class="empty-icon">📦</div><div class="empty-title">ไม่มีข้อมูลสต็อก</div></div>';
    return;
  }

  content.innerHTML = `<div style="padding:8px 16px;overflow-x:auto">
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead><tr style="background:var(--s1)">
        <th style="padding:5px 7px;text-align:left;font-weight:600;font-size:11px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">สินค้า</th>
        <th style="padding:5px 7px;text-align:left;font-weight:600;font-size:11px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">Section</th>
        <th style="padding:5px 7px;text-align:left;font-weight:600;font-size:11px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">Unit</th>
        <th style="padding:5px 7px;text-align:right;font-weight:600;font-size:11px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">Actual</th>
        <th style="padding:5px 7px;text-align:right;font-weight:600;font-size:11px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">Available</th>
        <th style="padding:5px 7px;text-align:center;font-weight:600;font-size:11px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">สถานะ</th>
      </tr></thead>
      <tbody>${items.map(s => {
        const sa = s.stock_available || 0;
        const actual = s.stock_actual || sa;
        const min2 = (s.min_order || 1) * 2;
        const statusLbl = sa === 0 ? 'OUT' : (sa <= min2 ? 'LOW' : 'OK');
        const statusCls = sa === 0 ? 'background:var(--red-bg);color:var(--red)' : (sa <= min2 ? 'background:#fef3c7;color:#92400e' : 'background:var(--green-bg);color:var(--green)');
        const numColor = sa === 0 ? 'var(--red)' : (sa <= min2 ? 'var(--orange)' : 'var(--green)');
        return `<tr>
          <td style="padding:5px 7px;border-bottom:1px solid var(--bd2);font-weight:600">${prodEmoji(s.product_name)} ${s.product_name}</td>
          <td style="padding:5px 7px;border-bottom:1px solid var(--bd2)">${getCatName(s.section_id)}</td>
          <td style="padding:5px 7px;border-bottom:1px solid var(--bd2)">${s.unit}</td>
          <td style="padding:5px 7px;border-bottom:1px solid var(--bd2);text-align:right;font-weight:700;color:${numColor}">${actual}</td>
          <td style="padding:5px 7px;border-bottom:1px solid var(--bd2);text-align:right">${sa}</td>
          <td style="padding:5px 7px;border-bottom:1px solid var(--bd2);text-align:center"><span style="font-size:11px;font-weight:600;padding:2px 6px;border-radius:6px;${statusCls}">${statusLbl}</span></td>
        </tr>`;
      }).join('')}</tbody>
    </table>
  </div>`;
}

