// Version 6.6.0 | 6 MAR 2026 | Siam Palette Group
// BC Order — screens.js: renderApp, Home, Browse, Cart, Orders, Stock

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
        <div class="topbar-action" id="cartBadgeBtn" onclick="showScreen('cart')">🛒 <span id="cartBadgeNum" style="position:absolute;top:2px;right:2px;min-width:16px;height:16px;border-radius:8px;background:var(--green);color:#fff;font-size:9px;font-weight:700;display:none;align-items:center;justify-content:center;padding:0 4px">0</span></div>
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
        <label style="font-size:11px;color:var(--td);white-space:nowrap">📅 ส่ง:</label>
        <input class="form-input" type="date" style="flex:1;padding:6px 10px;font-size:12px;min-width:120px" onchange="S.bcDateFilter=this.value;renderBcOrderFilters();renderBcOrderList()" id="bcDateInput" onclick="this.showPicker?.()">
        <div style="display:flex;gap:4px">
          <div class="filter-chip" style="font-size:10px;padding:4px 8px" onclick="setBcDate('today')">วันนี้</div>
          <div class="filter-chip" style="font-size:10px;padding:4px 8px" onclick="setBcDate('tomorrow')">พรุ่งนี้</div>
          <div class="filter-chip" style="font-size:10px;padding:4px 8px" onclick="setBcDate('all')">ทุกวัน</div>
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
        <label style="font-size:11px;color:var(--td);white-space:nowrap">📅 ส่ง:</label>
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
        if (!S.products || !S.products.length) {
          el.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:200px"><div class="spinner"></div></div>';
          await Promise.all([loadCategories(), loadProducts()]);
        }
      }
      // Screens that need orders
      if (['orders'].includes(name)) {
        if (!S.orders || !S.orders.length) {
          el.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:200px"><div class="spinner"></div></div>';
          await loadOrders();
        }
      }
      // Screens that need stock
      if (['stock','bc-stock'].includes(name)) {
        el.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:200px"><div class="spinner"></div></div>';
        await loadStock();
      }
      // Screens that need returns
      if (['returns','return-dashboard','bc-returns'].includes(name)) {
        if (!S.returns || !S.returns.length) {
          el.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:200px"><div class="spinner"></div></div>';
          await loadReturns();
        }
      }
      // BC orders screens
      if (['bc-orders','bc-accept','bc-fulfil'].includes(name)) {
        if (!S.orders || !S.orders.length) {
          el.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:200px"><div class="spinner"></div></div>';
          await loadOrders();
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
  
  // User badge
  document.getElementById('userBadge').innerHTML = `
    <div class="user-badge">
      <div class="user-avatar">${s.display_name.charAt(0)}</div>
      <div class="user-info">
        <div class="user-name">${s.display_name}</div>
        <div class="user-meta">${getStoreName(s.store_id)} · ${getDeptName(s.dept_id)}</div>
      </div>
      <span class="user-tier">${s.tier_id}</span>
    </div>`;
  
  // Bottom nav — v6.0: dashboard-focused tabs
  document.getElementById('bottomNav').innerHTML = `
    <div class="nav-item active" onclick="navTo('dashboard')"><span class="ni">🏠</span>Main Menu</div>
    <div class="nav-item" onclick="showScreen('admin-top-products')"><span class="ni">🏆</span>Top Products</div>
    <div class="nav-item" onclick="showScreen('return-dashboard')"><span class="ni">↩️</span>Returns</div>
    <div class="nav-item" onclick="showScreen('admin-waste-dashboard')"><span class="ni">🗑️</span>Waste</div>
  `;
  
  renderHomeDashboard();
}

function navTo(tab) {
  document.querySelectorAll('.nav-item').forEach((n,i) => n.classList.toggle('active', 
    (tab==='dashboard' && i===0) || (tab==='order' && i===1) || (tab==='history' && i===2) || (tab==='stock' && i===3) || (tab==='waste' && i===4)));
  if (tab === 'dashboard') renderHomeDashboard();
}

function renderHomeDashboard() {
  const d = S.dashboard || { today_total:0, by_status:{Pending:0,Ordered:0,Fulfilled:0,Delivered:0}, cutoff_violations_today:0, urgent_items:0 };
  const bs = d.by_status || {};
  const s = S.session || {};
  const tierLevel = s.tier_level || 99;
  
  // Admin menus based on permissions
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
  
  document.getElementById('homeContent').innerHTML = `
    <div class="sec-hd">📊 Today Delivery</div>
    <div class="sum-grid">
      <div class="sum-card sum-gold"><div class="sum-num">${d.today_total}</div><div class="sum-label">ออเดอร์ทั้งหมด</div></div>
      <div class="sum-card sum-green"><div class="sum-num">${(bs.Fulfilled||0)+(bs.Delivered||0)}</div><div class="sum-label">เสร็จแล้ว</div></div>
      <div class="sum-card sum-blue"><div class="sum-num">${bs.Ordered||0}</div><div class="sum-label">กำลังผลิต</div></div>
      <div class="sum-card ${d.cutoff_violations_today>0?'sum-red':''}"><div class="sum-num">${bs.Pending||0}</div><div class="sum-label">รอ BC ยืนยัน</div></div>
    </div>
    
    ${d.urgent_items > 0 ? `<div style="padding:0 16px 8px"><div class="tag tag-red" style="font-size:12px;padding:6px 14px">⚡ URGENT: ${d.urgent_items} รายการ</div></div>` : ''}
    ${d.cutoff_violations_today > 0 ? `<div style="padding:0 16px 12px"><div class="tag tag-orange" style="font-size:11px;padding:5px 12px">⚠️ Cutoff violation: ${d.cutoff_violations_today} ครั้ง</div></div>` : ''}
    
    <div class="sec-hd">⚡ Quick Menu</div>
    <div class="pad" style="padding-top:0">
      ${hasPerm('fn_create_order') ? `<div class="card" onclick="startOrder()">
        <div class="card-row"><div class="card-icon" style="background:var(--gold-bg)">📝</div><div class="card-body"><div class="card-title">Create Order</div><div class="card-desc">สั่ง Cake / Sauce ไปร้าน</div></div><div class="card-right">→</div></div>
      </div>` : ''}
      ${hasPerm('fn_view_own_orders') ? `<div class="card" onclick="showScreen('orders')">
        <div class="card-row"><div class="card-icon" style="background:var(--blue-bg)">📋</div><div class="card-body"><div class="card-title">View Orders</div><div class="card-desc">ดูรายการสั่งย้อนหลัง</div></div><div class="card-right">→</div></div>
      </div>` : ''}
      ${hasPerm('fn_view_stock') ? `<div class="card" onclick="showScreen('stock')">
        <div class="card-row"><div class="card-icon" style="background:var(--green-bg)">📦</div><div class="card-body"><div class="card-title">View Stock</div><div class="card-desc">สินค้าพร้อมส่ง</div></div><div class="card-right">→</div></div>
      </div>` : ''}
      ${hasPerm('fn_log_waste') ? `<div class="card" onclick="showScreen('waste')">
        <div class="card-row"><div class="card-icon" style="background:var(--purple-bg)">🗑️</div><div class="card-body"><div class="card-title">Record Waste</div><div class="card-desc">สินค้าหมดอายุ / เสียหาย</div></div><div class="card-right">→</div></div>
      </div>` : ''}
      ${hasPerm('fn_create_return') ? `<div class="card" onclick="showScreen('returns')">
        <div class="card-row"><div class="card-icon" style="background:var(--red-bg)">↩️</div><div class="card-body"><div class="card-title">Return / Feedback</div><div class="card-desc">แจ้งปัญหาคุณภาพ</div></div><div class="card-right">→</div></div>
      </div>` : ''}
    </div>
    ${adminMenus}
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
    <div style="font-size:11px;color:var(--td);margin-top:8px">เลือกได้ตั้งแต่วันนี้ถึง 7 วันข้างหน้า</div>
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
  
  if (S.productFilter !== 'all') {
    prods = prods.filter(p => p.cat_id === S.productFilter);
  }
  
  if (S.productSearch) {
    const q = S.productSearch.toLowerCase();
    prods = prods.filter(p => p.product_name.toLowerCase().includes(q));
  }
  
  const grid = document.getElementById('productGrid');
  if (prods.length === 0) {
    grid.innerHTML = '<div class="empty"><div class="empty-icon">🔍</div><div class="empty-title">ไม่พบสินค้า</div></div>';
    updateCartFooter();
    return;
  }
  
  grid.innerHTML = prods.map(p => {
    const inCart = S.cart.find(c => c.product_id === p.product_id);
    const qty = inCart ? inCart.qty : 0;
    const sa = p.stock_available || 0;
    const stockClass = sa === 0 ? 'out' : (sa <= (p.min_order || 1) * 2 ? 'low' : 'ok');
    const stockIcon = sa === 0 ? '🚫' : (stockClass === 'low' ? '⚠️' : '📦');
    const canMinus = qty > 0;
    
    return `<div class="plist-item ${inCart?'in-cart':''}">
      <div class="plist-img">${prodEmoji(p.product_name)}</div>
      <div class="plist-info">
        <div class="plist-name">${p.product_name}</div>
        <div class="plist-stock ${stockClass}">${stockIcon} ${sa} ${p.unit}</div>
        <div class="plist-meta">min: ${p.min_order || 1} | step: ${p.order_step || 1}</div>
      </div>
      <div class="plist-ctrl">
        <div class="plist-btn ${canMinus?'active':'disabled'}" onclick="removeFromBrowse('${p.product_id}')">−</div>
        <div class="plist-qty">${qty}</div>
        <div class="plist-btn ${sa>0?'':'disabled'}" onclick="addToCart('${p.product_id}')">+</div>
        ${inCart ? `<div class="plist-urgent ${inCart.is_urgent?'on':''}" onclick="toggleUrgentBrowse('${p.product_id}')" title="ด่วน">⚡</div>` : ''}
      </div>
    </div>`;
  }).join('');
  
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
  
  // Edit mode indicator
  if (S.editingOrderId) {
    submitBtn.innerHTML = '💾 บันทึกการแก้ไข';
    document.getElementById('cartCount').textContent = S.cart.length + ' รายการ · ✏️ ' + S.editingOrderId;
  } else {
    submitBtn.innerHTML = '📤 สั่งเลย';
  }
  
  if (S.cart.length === 0) {
    content.innerHTML = '<div class="empty"><div class="empty-icon">🛒</div><div class="empty-title">ตะกร้าว่าง</div><div class="empty-desc">กดสินค้าเพื่อเพิ่ม</div></div>';
    document.getElementById('submitOrderBtn').disabled = true;
    document.getElementById('submitOrderBtn').style.display = 'none';
    return;
  }
  document.getElementById('submitOrderBtn').disabled = false;
  document.getElementById('submitOrderBtn').style.display = '';
  
  content.innerHTML = `
    <div style="padding:12px 16px;display:flex;align-items:center;gap:8px">
      <div class="date-badge">📅 ส่งวันที่ ${formatDateThai(S.deliveryDate)}</div>
      <button class="btn btn-outline btn-sm" onclick="changeDeliveryDate()">เปลี่ยน</button>
    </div>
    ${S.editingOrderId && S.deliveryDate === todaySydney() ? `
    <div style="padding:0 16px 8px"><div style="background:var(--red-bg);border:1px solid #fecaca;border-radius:8px;padding:10px;font-size:11px;color:var(--red)">
      ⚠️ <b>วันส่งเป็นวันนี้</b> — ถ้าเลย cutoff (05:00) order จะเปลี่ยนเป็น <b>Pending</b> ต้องรอ BC ยืนยันใหม่
    </div></div>` : ''}
    ${S.cart.map((item, idx) => {
      const isFulfilled = S.editingOrderId && item.fulfilment_status;
      return `
      <div class="cart-item" ${isFulfilled ? 'style="opacity:.6;background:var(--s2)"' : ''}>
        <div style="font-size:24px">${prodEmoji(item.product_name)}</div>
        <div class="cart-item-info">
          <div class="cart-item-name">${item.product_name} ${isFulfilled ? '<span class="tag tag-green" style="font-size:8px">✅ ทำแล้ว</span>' : ''}</div>
          <div class="cart-item-meta">${item.unit} · ขั้นต่ำ ${item.min_order}${item.order_step>1?' · ×'+item.order_step:''}${isFulfilled ? ' · sent:'+item.qty_sent : ''}</div>
          ${isFulfilled ? '<div style="font-size:10px;color:var(--red);margin-top:2px">🔒 แก้ไขไม่ได้ — BC ทำแล้ว</div>' : `
          <div class="cart-item-actions">
            <span class="urgent-chip ${item.is_urgent?'on':''}" onclick="toggleUrgent(${idx})">⚡ URGENT</span>
            <input class="note-mini" placeholder="โน้ต..." value="${item.note}" onchange="S.cart[${idx}].note=this.value" style="max-width:160px">
          </div>`}
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
          ${isFulfilled ? `<div class="qty-num" style="font-size:16px">${item.qty}</div>` : `
          <div class="qty-sel">
            <div class="qty-btn" onclick="adjustQty(${idx},-1)">−</div>
            <div class="qty-num">${item.qty}</div>
            <div class="qty-btn" onclick="adjustQty(${idx},1)">+</div>
          </div>
          <div style="font-size:9px;color:var(--red);cursor:pointer" onclick="removeFromCart(${idx})">ลบ</div>`}
        </div>
      </div>`;
    }).join('')}
    <div class="form-group" style="padding:12px 16px">
      <label class="form-label">📝 โน้ตสำหรับ Order ทั้งหมด</label>
      <input class="form-input" placeholder="เช่น ส่งตอน 10:30" value="${S.headerNote}" onchange="S.headerNote=this.value">
    </div>
  `;
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
    <div style="font-size:11px;color:var(--td);margin-top:8px">⚠️ หากเลือกวันนี้และหลัง 05:00 จะเป็น Pending (รอ BC ยืนยัน)</div>
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
  
  // Filters
  document.getElementById('orderFilters').innerHTML = `
    <div class="filter-chip ${S.orderFilter==='all'?'active':''}" onclick="S.orderFilter='all';filterOrders()">All</div>
    <div class="filter-chip ${S.orderFilter==='Pending'?'active':''}" onclick="S.orderFilter='Pending';filterOrders()">⏳ Pending</div>
    <div class="filter-chip ${S.orderFilter==='Ordered'?'active':''}" onclick="S.orderFilter='Ordered';filterOrders()">📦 Ordered</div>
    <div class="filter-chip ${S.orderFilter==='Fulfilled'?'active':''}" onclick="S.orderFilter='Fulfilled';filterOrders()">✅ Fulfilled</div>
    <div class="filter-chip ${S.orderFilter==='Delivered'?'active':''}" onclick="S.orderFilter='Delivered';filterOrders()">🚚 Delivered</div>
  `;
  
  filterOrders();
}

function filterOrders() {
  const content = document.getElementById('orderList');
  let orders = S.orders;
  if (S.orderFilter !== 'all') orders = orders.filter(o => o.status === S.orderFilter);
  
  // Update active filter
  document.querySelectorAll('#orderFilters .filter-chip').forEach(c => {
    c.classList.toggle('active', c.textContent.includes(S.orderFilter === 'all' ? 'All' : S.orderFilter));
  });
  
  if (orders.length === 0) {
    content.innerHTML = '<div class="empty"><div class="empty-icon">📋</div><div class="empty-title">ไม่มีออเดอร์</div></div>';
    return;
  }
  
  content.innerHTML = `<div class="pad" style="padding-top:8px">${orders.map(o => `
    <div class="card" onclick="viewOrder('${o.order_id}')">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <span style="font-size:12px;font-weight:700;color:var(--gold)">${o.order_id}</span>
        <span class="status ${statusClass(o.status)}">${o.status}</span>
      </div>
      <div style="font-size:11px;color:var(--td)">📅 Order Date : ${formatDateAU(o.order_date)} · Delivery By : ${formatDateAU(o.delivery_date)}</div>
      ${o.is_cutoff_violation ? '<div class="tag tag-orange" style="margin-top:4px;font-size:9px">⚠️ Cutoff Violation</div>' : ''}
      ${o.header_note ? `<div style="font-size:10px;color:var(--td);margin-top:4px">📝 ${o.header_note}</div>` : ''}
    </div>
  `).join('')}
  ${S.role === 'store' ? `<div style="text-align:center;padding:16px;color:var(--tm);font-size:11px">แสดง 14 วันล่าสุด (${orders.length} orders)</div>` : ''}
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
    <div class="pad">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <span class="status ${statusClass(o.status)}" style="font-size:12px;padding:5px 14px">${o.status}</span>
        ${o.is_cutoff_violation ? '<span class="tag tag-orange">⚠️ Cutoff</span>' : ''}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">
        <div><div style="font-size:10px;color:var(--tm)">สั่งเมื่อ</div><div style="font-size:12px;font-weight:600">${formatDateThai(o.order_date)}</div></div>
        <div><div style="font-size:10px;color:var(--tm)">วันส่ง</div><div style="font-size:12px;font-weight:600">${formatDateThai(o.delivery_date)}</div></div>
      </div>
      ${o.header_note ? `<div style="background:var(--s1);border-radius:8px;padding:10px;margin-bottom:12px;font-size:12px">📝 ${o.header_note}</div>` : ''}
      
      <div style="font-size:13px;font-weight:700;margin-bottom:8px">รายการสินค้า (${items.length})</div>
      ${items.length > 0 ? items.map(item => `
        <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--b1)">
          <div style="font-size:20px">${prodEmoji(item.product_name)}</div>
          <div style="flex:1">
            <div style="font-size:13px;font-weight:600">${item.product_name||item.product_id}</div>
            <div style="font-size:10px;color:var(--td)">${item.unit||''} ${item.is_urgent?'<span class="tag tag-red" style="font-size:8px">⚡ URGENT</span>':''}</div>
            ${item.item_note ? `<div style="font-size:10px;color:var(--td)">📝 ${item.item_note}</div>` : ''}
          </div>
          <div style="text-align:right">
            <div style="font-size:14px;font-weight:700">${item.qty_ordered}</div>
            ${item.fulfilment_status ? `<div style="font-size:10px;color:${item.fulfilment_status==='full'?'var(--green)':'var(--red)'}">${item.fulfilment_status} (${item.qty_sent||0})</div>` : ''}
          </div>
        </div>
      `).join('') : '<div style="font-size:12px;color:var(--tm);padding:16px 0">ไม่มีรายการ</div>'}
      
      ${['Pending','Ordered'].includes(o.status) ? `
        <div style="margin-top:16px;display:flex;gap:8px">
          <button class="btn btn-outline" style="flex:1" onclick="editOrder('${o.order_id}')">✏️ แก้ไข</button>
          <button class="btn btn-red btn-sm" onclick="deleteOrder('${o.order_id}')">🗑️ ลบ</button>
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
  
  content.innerHTML = `<div class="pad" style="padding-top:4px">${items.map(s => `
    <div class="card">
      <div class="card-row">
        <div style="font-size:24px">${prodEmoji(s.product_name)}</div>
        <div class="card-body">
          <div class="card-title">${s.product_name}</div>
          <div class="card-desc">${s.unit} · ${getCatName(s.section_id)}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:20px;font-weight:800;color:${s.stock_available>5?'var(--green)':s.stock_available>0?'var(--orange)':'var(--red)'}">${s.stock_available}</div>
          <div style="font-size:9px;color:var(--td)">Available</div>
        </div>
      </div>
    </div>
  `).join('')}</div>`;
}

