// Version 8.1 | 7 MAR 2026 | Siam Palette Group
// BC Order — admin.js: Admin Menu, A1-A9 Panels
// Phase 6: Admin screens + Product wireframe match

// ─── ADMIN SCREEN RENDERERS (A1-A9) ────────────────────────
function renderAdminDashboard() {
  const d = S.dashboard || {};
  const bs = d.by_status || {};
  const total = d.today_total || 0;
  const done = (bs.Fulfilled||0) + (bs.Delivered||0);
  const fulfilRate = total > 0 ? Math.round((done/total)*100) : 0;
  const orders = S.orders || [];

  // Store breakdown
  const stores = {};
  orders.forEach(o => {
    if (!stores[o.store_id]) stores[o.store_id] = { total:0, pending:0, ordered:0, progress:0, done:0 };
    stores[o.store_id].total++;
    if (o.status === 'Pending') stores[o.store_id].pending++;
    else if (o.status === 'Ordered') stores[o.store_id].ordered++;
    else if (o.status === 'InProgress') stores[o.store_id].progress++;
    else stores[o.store_id].done++;
  });

  // Status distribution
  const statusPct = (v) => total > 0 ? Math.round((v/total)*100) : 0;

  // Alerts (pending + urgent + stock OUT)
  const pendingOrders = orders.filter(o => o.status === 'Pending');
  const urgentOrders = orders.filter(o => (o.items||[]).some(i => i.is_urgent));
  const outStock = (S.stock||[]).filter(s => (s.stock_available||0) === 0);

  // Waste + Returns today
  const todayStr = todaySydney();
  const todayWaste = (S.wasteLog||[]).filter(w => w.waste_date === todayStr);
  const wasteQty = todayWaste.reduce((s,w) => s+(w.quantity||0), 0);
  const todayReturns = (S.returns||[]).filter(r => (r.created_at||'').startsWith(todayStr));
  const openReturns = (S.returns||[]).filter(r => r.status === 'Reported' || r.status === 'Received');

  document.getElementById('adminDashboardContent').innerHTML = `<div style="padding:16px 20px">
    <!-- Row 1: KPI -->
    <div class="dash-kpi" style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:6px;margin-bottom:8px">
      <div style="padding:12px;background:var(--gold-bg);border-radius:var(--rd2)">
        <div style="font-size:12px;color:var(--gold);font-weight:600;text-transform:uppercase">Total Orders</div>
        <div style="font-size:24px;font-weight:800;color:var(--gold)">${total}</div>
        <div style="display:flex;gap:4px;margin-top:4px;font-size:12px"><span style="color:var(--red);font-weight:600">⏳ ${bs.Pending||0}</span><span style="color:var(--blue)">📦 ${bs.Ordered||0}</span><span style="color:var(--orange)">🔄 ${bs.InProgress||0}</span><span style="color:var(--green)">✅ ${done}</span></div>
      </div>
      <div style="padding:12px;background:var(--green-bg);border-radius:var(--rd2);text-align:center">
        <div style="font-size:12px;color:var(--green);font-weight:600">FULFILMENT</div>
        <div style="font-size:26px;font-weight:800;color:var(--green)">${fulfilRate}%</div>
        <div style="height:4px;background:#c8e6c9;border-radius:2px;margin-top:3px"><div style="width:${fulfilRate}%;height:100%;background:var(--green);border-radius:2px"></div></div>
      </div>
      <div style="padding:12px;background:var(--red-bg);border-radius:var(--rd2);text-align:center">
        <div style="font-size:12px;color:var(--red);font-weight:600">CUTOFF</div>
        <div style="font-size:26px;font-weight:800;color:var(--red)">${d.cutoff_violations_today||0}</div>
      </div>
      <div style="padding:12px;background:var(--orange-bg);border-radius:var(--rd2);text-align:center">
        <div style="font-size:12px;color:var(--orange);font-weight:600">URGENT</div>
        <div style="font-size:26px;font-weight:800;color:var(--orange)">${d.urgent_items||0}</div>
      </div>
    </div>

    <!-- Row 2: Store Health + Status Distribution -->
    <div class="dash-2col" style="display:grid;grid-template-columns:3fr 2fr;gap:8px;margin-bottom:8px">
      <div style="background:#fff;border:1px solid var(--bd2);border-radius:var(--rd2);padding:10px">
        <div style="font-size:12px;font-weight:700;color:var(--t3);text-transform:uppercase;margin-bottom:6px">🏪 Store Health</div>
        ${Object.keys(stores).length === 0 ? '<div style="font-size:13px;color:var(--td);padding:8px 0">ยังไม่มีออเดอร์</div>' :
          Object.entries(stores).map(([sid, s]) => {
            const worst = s.pending > 0 ? 'var(--red)' : s.ordered > 0 ? 'var(--blue)' : s.progress > 0 ? 'var(--orange)' : 'var(--green)';
            const donePct = s.total > 0 ? Math.round((s.done/s.total)*100) : 0;
            return `<div style="margin-bottom:6px"><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:2px"><span style="font-weight:600">${getStoreName(sid)}</span><span>${s.total} orders</span></div>
              <div style="height:4px;background:var(--s2);border-radius:2px"><div style="width:${donePct}%;height:100%;background:${worst};border-radius:2px"></div></div>
              <div style="display:flex;gap:4px;font-size:12px;color:var(--t3);margin-top:1px">${s.pending?`<span style="color:var(--red)">●${s.pending} pending</span>`:''}${s.ordered?`<span style="color:var(--blue)">●${s.ordered} ordered</span>`:''}${s.progress?`<span style="color:var(--orange)">●${s.progress} progress</span>`:''}${s.done?`<span style="color:var(--green)">●${s.done} done</span>`:''}</div></div>`;
          }).join('')}
      </div>
      <div style="background:#fff;border:1px solid var(--bd2);border-radius:var(--rd2);padding:10px">
        <div style="font-size:12px;font-weight:700;color:var(--t3);text-transform:uppercase;margin-bottom:6px">📊 Status Distribution</div>
        <div style="display:flex;height:8px;border-radius:4px;overflow:hidden;margin-bottom:8px">${total>0?`<div style="width:${statusPct(bs.Pending||0)}%;background:var(--red)"></div><div style="width:${statusPct(bs.Ordered||0)}%;background:var(--blue)"></div><div style="width:${statusPct(bs.InProgress||0)}%;background:var(--orange)"></div><div style="width:${statusPct(done)}%;background:var(--green)"></div>`:'<div style="width:100%;background:var(--s2)"></div>'}</div>
        <div style="font-size:12px;line-height:2"><div style="display:flex;justify-content:space-between"><span><span style="color:var(--red)">●</span> Pending</span><span style="font-weight:700">${bs.Pending||0} (${statusPct(bs.Pending||0)}%)</span></div><div style="display:flex;justify-content:space-between"><span><span style="color:var(--blue)">●</span> Ordered</span><span style="font-weight:700">${bs.Ordered||0} (${statusPct(bs.Ordered||0)}%)</span></div><div style="display:flex;justify-content:space-between"><span><span style="color:var(--orange)">●</span> In Progress</span><span style="font-weight:700">${bs.InProgress||0} (${statusPct(bs.InProgress||0)}%)</span></div><div style="display:flex;justify-content:space-between"><span><span style="color:var(--green)">●</span> Done</span><span style="font-weight:700">${done} (${statusPct(done)}%)</span></div></div>
      </div>
    </div>

    <!-- Row 3: Needs Attention -->
    ${(pendingOrders.length + urgentOrders.length + outStock.length) > 0 ? `
    <div style="background:#fff;border:1px solid var(--bd2);border-radius:var(--rd2);padding:10px;margin-bottom:8px">
      <div style="font-size:12px;font-weight:700;color:var(--red);text-transform:uppercase;margin-bottom:6px">⚠️ Needs Attention</div>
      ${pendingOrders.map(o => `<div style="display:flex;align-items:center;gap:5px;padding:5px 8px;border-radius:var(--rd2);background:var(--red-bg);font-size:13px;color:var(--red);margin-bottom:3px;cursor:pointer" onclick="showBcAccept('${o.order_id}')">🚨 <b>${o.order_id} ${o.store_id}</b> — pending accept${o.is_cutoff_violation?' · cutoff ⚠️':''}</div>`).join('')}
      ${urgentOrders.slice(0,3).map(o => `<div style="display:flex;align-items:center;gap:5px;padding:5px 8px;border-radius:var(--rd2);background:#fef3c7;font-size:13px;color:#92400e;margin-bottom:3px">⚡ <b>${o.order_id} ${o.store_id}</b> — urgent items</div>`).join('')}
      ${outStock.slice(0,3).map(s => `<div style="display:flex;align-items:center;gap:5px;padding:5px 8px;border-radius:var(--rd2);background:var(--blue-bg);font-size:13px;color:var(--blue);margin-bottom:3px">📦 <b>${s.product_name}</b> — stock OUT</div>`).join('')}
    </div>` : ''}

    <!-- Row 4: Waste + Returns Today -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
      <div style="background:#fff;border:1px solid var(--bd2);border-radius:var(--rd2);padding:10px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><div style="font-size:12px;font-weight:700;color:var(--red);text-transform:uppercase">🗑️ Waste Today</div><div style="font-size:12px;color:var(--t4);cursor:pointer" onclick="showScreen('admin-waste-dashboard')">ดูทั้งหมด →</div></div>
        <div style="display:flex;gap:6px;margin-bottom:6px">
          <div style="flex:1;padding:8px;background:var(--red-bg);border-radius:6px;text-align:center"><div style="font-size:16px;font-weight:800;color:var(--red)">${todayWaste.length}</div><div style="font-size:12px;color:var(--red)">items</div></div>
          <div style="flex:1;padding:8px;background:var(--s1);border-radius:6px;text-align:center"><div style="font-size:16px;font-weight:800">${wasteQty}</div><div style="font-size:12px;color:var(--t3)">ชิ้น</div></div>
        </div>
        ${todayWaste.slice(0,3).map(w => { const pn = ((S.products||[]).find(p=>p.product_id===w.product_id)||{}).product_name||w.product_id; return `<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--bd2);font-size:12px"><span>● ${pn} ×${w.quantity}</span><span style="color:var(--red)">${w.reason}</span></div>`; }).join('')}
      </div>
      <div style="background:#fff;border:1px solid var(--bd2);border-radius:var(--rd2);padding:10px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><div style="font-size:12px;font-weight:700;color:var(--orange);text-transform:uppercase">↩️ Returns</div><div style="font-size:12px;color:var(--t4);cursor:pointer" onclick="showScreen('return-dashboard')">ดูทั้งหมด →</div></div>
        <div style="display:flex;gap:6px;margin-bottom:6px">
          <div style="flex:1;padding:8px;background:var(--orange-bg);border-radius:6px;text-align:center"><div style="font-size:16px;font-weight:800;color:var(--orange)">${todayReturns.length}</div><div style="font-size:12px;color:var(--orange)">today</div></div>
          <div style="flex:1;padding:8px;background:var(--red-bg);border-radius:6px;text-align:center"><div style="font-size:16px;font-weight:800;color:var(--red)">${openReturns.length}</div><div style="font-size:12px;color:var(--red)">open</div></div>
        </div>
      </div>
    </div>

    <!-- Row 5: Recent Activity + Quick Links -->
    <div class="dash-2col" style="display:grid;grid-template-columns:3fr 2fr;gap:8px">
      <div style="background:#fff;border:1px solid var(--bd2);border-radius:var(--rd2);padding:10px">
        <div style="font-size:12px;font-weight:700;color:var(--t3);text-transform:uppercase;margin-bottom:6px">🕐 Recent Activity</div>
        <div id="activityFeed" style="font-size:12px;color:var(--t3)">Loading...</div>
      </div>
      <div style="background:#fff;border:1px solid var(--bd2);border-radius:var(--rd2);padding:10px">
        <div style="font-size:12px;font-weight:700;color:var(--t3);text-transform:uppercase;margin-bottom:6px">🔗 Quick Links</div>
        <div style="display:flex;flex-direction:column;gap:4px">
          <div class="card" style="padding:12px 16px;margin:0" onclick="showScreen('admin-top-products')"><div style="display:flex;align-items:center;gap:6px"><span>🏆</span><span style="font-size:13px;font-weight:600">Top Products</span><span style="margin-left:auto;font-size:13px;color:var(--t4)">→</span></div></div>
          <div class="card" style="padding:12px 16px;margin:0" onclick="showScreen('admin-waste-dashboard')"><div style="display:flex;align-items:center;gap:6px"><span>🗑️</span><span style="font-size:13px;font-weight:600">Waste Dashboard</span><span style="margin-left:auto;font-size:13px;color:var(--t4)">→</span></div></div>
          <div class="card" style="padding:12px 16px;margin:0" onclick="showScreen('return-dashboard')"><div style="display:flex;align-items:center;gap:6px"><span>↩️</span><span style="font-size:13px;font-weight:600">Return Dashboard</span><span style="margin-left:auto;font-size:13px;color:var(--t4)">→</span></div></div>
          <div class="card" style="padding:12px 16px;margin:0" onclick="showScreen('admin-cutoff')"><div style="display:flex;align-items:center;gap:6px"><span>⏰</span><span style="font-size:13px;font-weight:600">Cutoff Violations</span><span style="margin-left:auto;font-size:13px;color:var(--t4)">→</span></div></div>
        </div>
      </div>
    </div>
  </div>`;

  // Async load activity feed — does NOT block dashboard render
  loadActivityFeed();
}

async function loadActivityFeed() {
  const el = document.getElementById('activityFeed');
  if (!el) return;
  try {
    const resp = await api('get_recent_activity');
    if (!resp.success || !resp.data.length) { el.textContent = 'ยังไม่มีกิจกรรม'; return; }
    const icons = { Pending:'⏳', Ordered:'📦', InProgress:'🔄', Fulfilled:'✅', Delivered:'🚚', Rejected:'❌', Cancelled:'🚫' };
    const colors = { Pending:'var(--red)', Ordered:'var(--blue)', InProgress:'var(--orange)', Fulfilled:'var(--green)', Delivered:'var(--green)', Rejected:'var(--red)', Cancelled:'var(--t4)' };
    el.innerHTML = resp.data.map(a => {
      const t = a.updated_at ? new Date(a.updated_at).toLocaleString('th-TH',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'short'}) : '—';
      return `<div style="display:flex;gap:6px;padding:3px 0;border-bottom:1px solid var(--bd2);align-items:center">
        <span style="color:var(--t4);min-width:50px;font-size:12px">${t}</span>
        <span>${icons[a.status]||'📋'}</span>
        <span style="flex:1"><b style="color:var(--gold)">${a.order_id}</b> ${a.store_id} — <b style="color:${colors[a.status]||'var(--t2)'}">${a.status}</b></span>
        <span style="font-size:12px;color:var(--t4)">${a.display_name||''}</span>
      </div>`;
    }).join('');
  } catch(e) { el.textContent = '—'; }
}

// ─── A3: Product Management ──────────────────────────────────
async function renderAdminProducts() {
  const el = document.getElementById('adminProductsContent');
  
  // Only load if not yet loaded (lazy load in showScreen handles first load)
  if (!S._productsLoaded) {
    el.innerHTML = '<div style="text-align:center;padding:40px"><div class="spinner"></div></div>';
    try { await loadProducts(); S._productsLoaded = true; } catch(e) {}
  }
  
  const prods = S.products || [];
  const active = prods.filter(p => p.is_active === true || p.is_active === 'TRUE');
  const inactive = prods.filter(p => p.is_active !== true && p.is_active !== 'TRUE');
  
  // Search state
  if (!S.adminProductSearch) S.adminProductSearch = '';
  if (!S.adminProductTab) S.adminProductTab = 'active';
  
  const tab = S.adminProductTab;
  const list = tab === 'active' ? active : inactive;
  const q = S.adminProductSearch.toLowerCase();
  const filtered = q ? list.filter(p => p.product_name.toLowerCase().includes(q)) : list;
  
  el.innerHTML = `
    <div style="padding:16px 20px">
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
        <div class="filter-chip ${tab==='active'?'active':''}" onclick="S.adminProductTab='active';renderAdminProducts()">Active (${active.length})</div>
        <div class="filter-chip ${tab==='inactive'?'active':''}" onclick="S.adminProductTab='inactive';renderAdminProducts()">Inactive (${inactive.length})</div>
        <div style="flex:1"></div>
        <button class="btn btn-gold btn-sm" onclick="showAddProductForm()">+ Add</button>
      </div>
      <input class="search-input" placeholder="🔍 ค้นหาสินค้า..." value="${S.adminProductSearch}" oninput="S.adminProductSearch=this.value;renderAdminProducts()" style="width:100%;margin-bottom:8px">

      ${filtered.length === 0 ? '<div class="empty"><div class="empty-icon">📦</div><div class="empty-title">ไม่พบสินค้า</div></div>' : `
      <div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;font-size:14px;min-width:700px">
        <thead><tr style="background:var(--s1)">
          <th style="padding:8px 16px;text-align:left;font-weight:600;font-size:13px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">สินค้า</th>
          <th style="padding:8px 16px;text-align:left;font-weight:600;font-size:13px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">Category</th>
          <th class="hide-m" style="padding:8px 16px;text-align:left;font-weight:600;font-size:13px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">Section</th>
          <th class="hide-m" style="padding:8px 16px;text-align:left;font-weight:600;font-size:13px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">Unit</th>
          <th class="hide-m" style="padding:8px 16px;text-align:center;font-weight:600;font-size:13px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">Min</th>
          <th class="hide-m" style="padding:8px 16px;text-align:center;font-weight:600;font-size:13px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">Step</th>
          <th class="hide-m" style="padding:8px 16px;text-align:center;font-weight:600;font-size:13px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">Max</th>
          <th class="hide-m" style="padding:8px 16px;text-align:center;font-weight:600;font-size:13px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">Stock?</th>
          <th style="padding:8px 16px;text-align:center;font-weight:600;font-size:13px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">Status</th>
          <th style="padding:8px 16px;text-align:center;font-weight:600;font-size:13px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)"></th>
        </tr></thead>
        <tbody>${filtered.map(p => {
          const isAct = p.is_active === true || p.is_active === 'TRUE';
          const catObj = (S.categories||[]).find(c => (c.cat_id||c.category_id) === (p.cat_id||p.category_id));
          const catName = catObj ? (catObj.cat_name||catObj.category_name) : (p.cat_id||'—');
          return `<tr>
            <td style="padding:8px 16px;border-bottom:1px solid var(--bd2);font-weight:600">${p.product_name}</td>
            <td style="padding:8px 16px;border-bottom:1px solid var(--bd2)">${catName}</td>
            <td class="hide-m" style="padding:8px 16px;border-bottom:1px solid var(--bd2)">${p.section_id||'—'}</td>
            <td class="hide-m" style="padding:8px 16px;border-bottom:1px solid var(--bd2)">${p.unit}</td>
            <td class="hide-m" style="padding:8px 16px;border-bottom:1px solid var(--bd2);text-align:center">${p.min_order||1}</td>
            <td class="hide-m" style="padding:8px 16px;border-bottom:1px solid var(--bd2);text-align:center">${p.order_step||1}</td>
            <td class="hide-m" style="padding:8px 16px;border-bottom:1px solid var(--bd2);text-align:center">${p.max_order||'—'}</td>
            <td class="hide-m" style="padding:8px 16px;border-bottom:1px solid var(--bd2);text-align:center">${p.allow_stock?'Yes':'No'}</td>
            <td style="padding:8px 16px;border-bottom:1px solid var(--bd2);text-align:center">${isAct ? '<span style="background:var(--green-bg);color:var(--green);padding:2px 8px;border-radius:10px;font-size:13px;font-weight:600">Active</span>' : '<span style="color:var(--t4);font-size:13px">Hidden</span>'}</td>
            <td style="padding:8px 16px;border-bottom:1px solid var(--bd2);text-align:center;cursor:pointer" onclick="showEditProductForm('${p.product_id}')">✏️</td>
          </tr>`;
        }).join('')}</tbody>
      </table></div>`}
    </div>`;
}

async function toggleProduct(productId, newActive) {
  if (!confirm(`${newActive ? 'เปิด' : 'ปิด'}สินค้านี้?`)) return;
  try {
    const resp = await api('update_product', { product_id: productId, is_active: newActive });
    toast(resp.message || 'อัพเดตแล้ว', 'success');
    await renderAdminProducts();
  } catch(e) { toast('เกิดข้อผิดพลาด', 'error'); }
}

// N-02: Add/Edit Product — Full-page
function showAddProductForm() {
  S._editProduct = null;
  S._editVisibility = [];
  showScreen('admin-product-edit');
}

function showEditProductForm(productId) {
  const prod = (S.products || []).find(p => p.product_id === productId);
  if (!prod) { toast('ไม่พบสินค้า', 'error'); return; }
  S._editProduct = prod;
  S._editVisibility = [];
  showScreen('admin-product-edit');
}

async function renderProductEditScreen() {
  const el = document.getElementById('productEditContent');
  const p = S._editProduct;
  const isEdit = !!p;

  document.getElementById('productEditTitle').textContent = isEdit ? '✏️ แก้ไขสินค้า' : '➕ เพิ่มสินค้าใหม่';

  // Load visibility if editing
  if (isEdit && S._editVisibility.length === 0) {
    el.innerHTML = '<div style="text-align:center;padding:40px"><div class="spinner"></div></div>';
    try {
      const resp = await api('get_product_visibility', null, { product_id: p.product_id });
      if (resp.success) S._editVisibility = resp.data || [];
    } catch(e) {}
  }

  const cats = S.categories || [];
  const sections = ['cake', 'sauce', 'bakery'];
  const unitOpts = ['pieces','pcs','loaves','btl','pack','kg','g'];
  const stores = [
    { id:'MNG', name:'MNG Haymarket', depts:['dessert','drink'] },
    { id:'ISH', name:'ISH Burwood', depts:['dessert','drink'] },
    { id:'GB',  name:'GB City', depts:['dessert','drink'] },
    { id:'TMC', name:'TMC', depts:['dessert','drink'] },
    { id:'RW',  name:'RW Marketplace', depts:['dessert','drink'] },
  ];

  const imgUrl = isEdit ? (p.image_url || '') : '';
  const catObj = isEdit ? (cats.find(c => (c.cat_id||c.category_id) === (p.cat_id||p.category_id))) : null;
  const catLabel = catObj ? (catObj.cat_name||catObj.category_name) : '';
  const isAct = isEdit && (p.is_active === true || p.is_active === 'TRUE');

  el.innerHTML = `
    <div style="padding:16px 20px">
      <!-- Preview Area -->
      <div style="display:flex;gap:12px;margin-bottom:16px">
        <div id="imgPreview" style="width:80px;height:80px;background:${isEdit?'var(--gold-bg)':'var(--s2)'};border:2px solid ${isEdit?'var(--gold)':'var(--bd)'};border-radius:var(--rd2);display:flex;align-items:center;justify-content:center;font-size:36px;flex-shrink:0;overflow:hidden">
          ${imgUrl ? `<img src="${imgUrl}" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.innerHTML='${prodEmoji(p?.product_name||'')}'" />` : `<span>${isEdit ? prodEmoji(p.product_name) : '📦'}</span>`}
        </div>
        <div style="flex:1;padding-top:4px">
          <div style="font-size:13px;color:var(--t3)">${isEdit ? '' : 'Preview — กรอกข้อมูลด้านล่าง'}</div>
          <div style="font-size:14px;font-weight:700;color:var(--t1);margin-top:2px" id="prdPreviewName">${isEdit ? p.product_name : 'ชื่อสินค้า...'}</div>
          <div style="font-size:13px;color:var(--t3);margin-top:2px" id="prdPreviewMeta">${isEdit ? `${catLabel} · ${p.section_id} · ${p.unit}` : 'Category · Section · Unit'}</div>
          ${isEdit ? `<div style="margin-top:4px"><span style="background:${isAct?'var(--green-bg)':'var(--red-bg)'};color:${isAct?'var(--green)':'var(--red)'};padding:2px 8px;border-radius:10px;font-size:13px;font-weight:600">${isAct?'Active':'Hidden'}</span></div>` : ''}
        </div>
      </div>

      <!-- Form Fields -->
      <div style="font-size:12px;font-weight:700;color:var(--t3);text-transform:uppercase;margin-bottom:8px">ข้อมูลสินค้า</div>

      <div class="form-group">
        <label class="form-label">❶ ชื่อสินค้า *</label>
        <input class="form-input" id="prdName" placeholder="เช่น Mango Sticky Rice" value="${isEdit ? p.product_name : ''}" oninput="document.getElementById('prdPreviewName').textContent=this.value||'ชื่อสินค้า...'">
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div class="form-group">
          <label class="form-label">❷ Category *</label>
          <select class="form-input" id="prdCat">
            <option value="">-- เลือก --</option>
            ${cats.map(c => `<option value="${c.cat_id||c.category_id}" ${isEdit && (p.cat_id||p.category_id)===(c.cat_id||c.category_id)?'selected':''}>${c.cat_name||c.category_name||c.cat_id}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">❸ Section *</label>
          <select class="form-input" id="prdSection">
            <option value="">-- เลือก --</option>
            ${sections.map(s => `<option value="${s}" ${isEdit && p.section_id===s?'selected':''}>${s}</option>`).join('')}
          </select>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
        <div class="form-group">
          <label class="form-label">❹ Unit *</label>
          <select class="form-input" id="prdUnit">
            ${unitOpts.map(u => `<option value="${u}" ${isEdit && p.unit===u?'selected':''}>${u}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">❺ Min Order *</label>
          <input class="form-input" type="number" id="prdMin" min="1" value="${isEdit ? p.min_order||1 : 1}">
        </div>
        <div class="form-group">
          <label class="form-label">❻ Order Step</label>
          <input class="form-input" type="number" id="prdStep" min="1" value="${isEdit ? p.order_step||1 : 1}">
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div class="form-group">
          <label class="form-label">❼ Max Order</label>
          <input class="form-input" type="number" id="prdMax" min="1" value="${isEdit ? p.max_order||100 : 100}">
        </div>
        <div class="form-group">
          <label class="form-label">❽ Allow Stock</label>
          <select class="form-input" id="prdStock">
            <option value="true" ${isEdit && p.allow_stock?'selected':''}>Yes</option>
            <option value="false" ${isEdit && !p.allow_stock?'selected':''}>No</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">❾ Description</label>
        <textarea class="form-input" id="prdDesc" rows="2" placeholder="รายละเอียดสินค้า..." style="resize:vertical">${isEdit ? p.description||'' : ''}</textarea>
      </div>

      <!-- Image Upload -->
      <div class="form-group">
        <label class="form-label">❿ รูปสินค้า</label>
        <div style="display:flex;align-items:center;gap:8px">
          <div style="width:48px;height:48px;background:var(--s2);border:1.5px solid var(--bd);border-radius:var(--rd2);display:flex;align-items:center;justify-content:center;font-size:20px;overflow:hidden" id="imgThumb">
            ${imgUrl ? `<img src="${imgUrl}" style="width:100%;height:100%;object-fit:cover" />` : '📷'}
          </div>
          <div>
            <label style="display:inline-flex;align-items:center;gap:4px;padding:6px 12px;border:1px solid var(--bd);border-radius:var(--rd2);font-size:14px;cursor:pointer;background:var(--bg)">
              📁 เลือกไฟล์
              <input type="file" accept="image/*" style="display:none" onchange="handleProductImage(this)">
            </label>
            <div style="font-size:13px;color:var(--t4);margin-top:2px">JPG, PNG · max 2MB · auto compress</div>
          </div>
        </div>
        <input type="hidden" id="prdImage" value="${imgUrl}">
      </div>

      <!-- Popup Notice -->
      <div class="form-group">
        <label class="form-label">⓫ Popup Notice <span style="font-size:13px;color:var(--t4)">(แสดงตอนเพิ่มลงตะกร้า)</span></label>
        <input class="form-input" id="prdPopupNotice" placeholder="เช่น สั่งล่วงหน้า 2 วัน" value="${isEdit ? p.popup_notice||'' : ''}">
      </div>

      <!-- Visibility Section -->
      <div style="font-size:12px;font-weight:700;color:var(--t3);text-transform:uppercase;margin:16px 0 4px">👁️ ร้านที่เห็นสินค้านี้</div>
      <div style="font-size:13px;color:var(--td);margin-bottom:8px">เลือกร้าน + แผนกที่สามารถสั่งสินค้านี้ได้ — สินค้าใหม่เปิดทุกร้านเป็น default</div>

      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:8px">
        <thead><tr style="background:var(--s1)">
          <th style="padding:8px 16px;text-align:left;font-weight:600;font-size:13px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">Store</th>
          <th style="padding:8px 16px;text-align:left;font-weight:600;font-size:13px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">Department</th>
          <th style="padding:8px 16px;text-align:center;font-weight:600;font-size:13px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">Visible?</th>
        </tr></thead>
        <tbody>${stores.map(store => {
          return store.depts.map(dept => {
            const vis = (S._editVisibility||[]).find(v => v.store_id === store.id && v.dept_id === dept);
            const checked = vis ? vis.is_active : (!isEdit);
            return `<tr>
              <td style="padding:8px 16px;border-bottom:1px solid var(--bd2);font-weight:600">${store.name}</td>
              <td style="padding:8px 16px;border-bottom:1px solid var(--bd2)">${dept}</td>
              <td style="padding:8px 16px;border-bottom:1px solid var(--bd2);text-align:center">
                <span style="color:${checked?'var(--green)':'var(--t4)'};font-size:14px;cursor:pointer" onclick="this.dataset.on=this.dataset.on==='1'?'0':'1';this.textContent=this.dataset.on==='1'?'☑':'☐';this.style.color=this.dataset.on==='1'?'var(--green)':'var(--t4)';document.getElementById('vis_${store.id}_${dept}').checked=this.dataset.on==='1'" data-on="${checked?'1':'0'}">${checked?'☑':'☐'}</span>
                <input type="checkbox" id="vis_${store.id}_${dept}" ${checked?'checked':''} style="display:none">
              </td>
            </tr>`;
          }).join('');
        }).join('')}</tbody>
      </table>

      <div style="display:flex;gap:8px;font-size:13px;margin-bottom:12px">
        <span style="color:var(--blue);cursor:pointer" onclick="toggleAllVis(true)">✅ เลือกทั้งหมด</span>
        <span style="color:var(--red);cursor:pointer" onclick="toggleAllVis(false)">❌ ยกเลิกทั้งหมด</span>
      </div>

      <!-- Submit Buttons -->
      <div style="display:flex;gap:8px">
        <button class="btn btn-gold" style="flex:2" onclick="submitProductEdit(${isEdit ? `'${p.product_id}'` : 'null'})">${isEdit ? '💾 บันทึกการแก้ไข' : '+ เพิ่มสินค้า'}</button>
        <button class="btn btn-outline" style="flex:1" onclick="showScreen('admin-products')">ยกเลิก</button>
      </div>
      ${isEdit ? `<button class="btn btn-outline" style="width:100%;margin-top:8px;color:var(--red);border-color:var(--red)" onclick="toggleProduct('${p.product_id}',${!isAct});showScreen('admin-products')">${isAct ? '🔇 ปิดสินค้านี้ (Deactivate)' : '🔔 เปิดสินค้านี้'}</button>` : ''}
    </div>`;
}

function previewProductImage(url) {
  const preview = document.getElementById('imgPreview');
  if (!preview) return;
  if (url && url.startsWith('http')) {
    preview.innerHTML = `<img src="${url}" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.innerHTML='❌'" />`;
  } else {
    const name = document.getElementById('prdName')?.value || '';
    preview.innerHTML = `<span style="font-size:36px">${prodEmoji(name) || '📦'}</span>`;
  }
}

function handleProductImage(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  if (file.size > 2 * 1024 * 1024) { toast('ไฟล์ใหญ่เกิน 2MB', 'error'); return; }
  const reader = new FileReader();
  reader.onload = function(e) {
    document.getElementById('prdImage').value = e.target.result;
    const thumb = document.getElementById('imgThumb');
    if (thumb) thumb.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover">`;
    const preview = document.getElementById('imgPreview');
    if (preview) preview.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover">`;
  };
  reader.readAsDataURL(file);
}

function toggleAllVis(on) {
  document.querySelectorAll('[id^="vis_"]').forEach(el => { el.checked = on; });
  // Update visual checkboxes
  document.querySelectorAll('[data-on]').forEach(el => {
    el.dataset.on = on ? '1' : '0';
    el.textContent = on ? '☑' : '☐';
    el.style.color = on ? 'var(--green)' : 'var(--t4)';
  });
}

async function submitProductEdit(productId) {
  const isEdit = !!productId;
  const name = document.getElementById('prdName').value.trim();
  if (!name) { toast('กรุณาใส่ชื่อสินค้า', 'error'); return; }
  
  const body = {
    product_name: name,
    category_id: document.getElementById('prdCat').value,
    section_id: document.getElementById('prdSection').value,
    unit: document.getElementById('prdUnit').value || 'pieces',
    min_order: parseInt(document.getElementById('prdMin').value) || 1,
    max_order: parseInt(document.getElementById('prdMax').value) || 100,
    order_step: parseInt(document.getElementById('prdStep').value) || 1,
    allow_stock: document.getElementById('prdStock').value === 'true',
    description: document.getElementById('prdDesc').value || '',
    image_url: document.getElementById('prdImage').value.trim() || '',
    popup_notice: document.getElementById('prdPopupNotice')?.value || '',
  };
  
  if (isEdit) body.product_id = productId;
  
  // Collect visibility
  const stores = ['MNG','ISH','GB','TMC','RW'];
  const depts = ['dessert','drink'];
  const visibility = [];
  stores.forEach(sid => {
    depts.forEach(dept => {
      const cb = document.getElementById('vis_' + sid + '_' + dept);
      if (cb) {
        visibility.push({ store_id: sid, dept_id: dept, is_active: cb.checked });
      }
    });
  });
  
  try {
    // Save product
    const action = isEdit ? 'update_product' : 'create_product';
    const resp = await api(action, body);
    if (!resp.success) { toast(resp.message || 'เกิดข้อผิดพลาด', 'error'); return; }
    
    const pid = isEdit ? productId : resp.data?.product_id;
    
    // Save visibility
    if (pid && visibility.length > 0) {
      try {
        await api('update_product_visibility', { product_id: pid, visibility });
      } catch(e) { console.warn('Visibility update failed:', e); }
    }
    
    toast(resp.message || '✅ บันทึกเรียบร้อย', 'success');
    await loadProducts();
    showScreen('admin-products');
  } catch(e) {
    toast('❌ Error: ' + e.message, 'error');
  }
}

// ─── A6: User Access Management ──────────────────────────────
async function renderAdminAccess() {
  const el = document.getElementById('adminAccessContent');
  el.innerHTML = '<div style="text-align:center;padding:40px"><div class="spinner"></div></div>';
  
  try {
    const resp = await api('get_permissions');
    if (!resp.success) { el.innerHTML = '<div class="pad" style="color:var(--red)">❌ ' + resp.error + '</div>'; return; }
    
    const { functions, matrix } = resp.data;
    const tiers = ['T1','T2','T3','T4','T5','T6','T7'];
    
    el.innerHTML = `
      <div style="padding:8px 12px;font-size:13px;color:var(--td)">กดเพื่อ toggle ON/OFF — เฉพาะ T1/T2 เท่านั้น</div>
      <div style="overflow-x:auto;padding:0 8px">
        <table style="width:100%;border-collapse:collapse;font-size:14px;min-width:500px">
          <thead>
            <tr style="background:var(--s2)">
              <th style="padding:8px;text-align:left;font-weight:600;position:sticky;left:0;background:var(--s2);z-index:1">Function</th>
              ${tiers.map(t => `<th style="padding:8px;text-align:center;font-weight:600;min-width:36px">${t}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${functions.map(fn => `<tr style="border-bottom:1px solid var(--s2)">
              <td style="padding:8px 16px;font-weight:500;position:sticky;left:0;background:var(--bg);z-index:1;font-size:13px" title="${fn.description||''}">${fn.function_name || fn.function_id}</td>
              ${tiers.map(t => {
                const allowed = matrix[fn.function_id] && matrix[fn.function_id][t];
                return `<td style="padding:6px;text-align:center">
                  <div onclick="togglePermission('${fn.function_id}','${t}',${!allowed})" 
                    style="cursor:pointer;width:28px;height:28px;border-radius:6px;display:inline-flex;align-items:center;justify-content:center;font-size:12px;
                    background:${allowed?'var(--green-bg)':'var(--s2)'};color:${allowed?'var(--green)':'var(--tm)'}">${allowed?'✅':'—'}</div>
                </td>`;
              }).join('')}
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  } catch(e) {
    el.innerHTML = '<div class="pad" style="color:var(--red)">❌ Error: ' + e.message + '</div>';
  }
}

async function togglePermission(functionId, tierId, newAllowed) {
  const label = functionId + ' × ' + tierId + ' → ' + (newAllowed ? 'ON' : 'OFF');
  if (!confirm('เปลี่ยนสิทธิ์?\n' + label)) return;
  try {
    const resp = await api('update_permission', { function_id: functionId, tier_id: tierId, allowed: newAllowed });
    toast(resp.message || label, 'success');
    await renderAdminAccess();
  } catch(e) { toast('เกิดข้อผิดพลาด', 'error'); }
}

// ─── A8: Department Mapping ──────────────────────────────────
async function renderAdminDeptMapping() {
  const el = document.getElementById('adminDeptMappingContent');
  el.innerHTML = '<div style="text-align:center;padding:40px"><div class="spinner"></div></div>';
  
  try {
    const resp = await api('get_dept_mappings');
    if (!resp.success) { el.innerHTML = '<div class="pad" style="color:var(--red)">❌ ' + resp.error + '</div>'; return; }
    
    const mappings = resp.data || [];
    const roleColors = { store:'var(--blue)', bc_production:'var(--green)', bc_management:'var(--gold)', all:'var(--purple)' };
    
    el.innerHTML = `<div style="padding:16px 20px">
      <div style="font-size:13px;font-weight:700;color:var(--t3);text-transform:uppercase;margin-bottom:6px">🏢 Department → Module Role Mapping (${mappings.length})</div>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead><tr style="background:var(--s1)">
          <th style="padding:8px 16px;text-align:left;font-weight:600;font-size:12px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">Dept</th>
          <th style="padding:8px 16px;text-align:left;font-weight:600;font-size:12px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">Module Role</th>
          <th style="padding:8px 16px;text-align:left;font-weight:600;font-size:12px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">Section Scope</th>
          <th style="padding:8px 16px;text-align:center;font-weight:600;font-size:12px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">Active</th>
          <th style="padding:8px 16px;text-align:center;font-weight:600;font-size:12px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)"></th>
        </tr></thead>
        <tbody>${mappings.map(m => {
          const roleColor = roleColors[m.module_role] || 'var(--td)';
          const isNA = m.module_role === 'not_applicable';
          return `<tr style="${m.is_active?'':'opacity:.5'}">
            <td style="padding:8px 16px;border-bottom:1px solid var(--bd2);font-weight:600">${m.dept_id}</td>
            <td style="padding:8px 16px;border-bottom:1px solid var(--bd2)"><span style="background:${roleColor}20;color:${roleColor};padding:1px 5px;border-radius:3px;font-size:12px;font-weight:600">${m.module_role}</span></td>
            <td style="padding:8px 16px;border-bottom:1px solid var(--bd2)">${m.section_scope||'—'}</td>
            <td style="padding:8px 16px;border-bottom:1px solid var(--bd2);text-align:center;color:${m.is_active?'var(--green)':'var(--red)'};cursor:pointer" onclick="toggleDeptActive('${m.dept_id}',${!m.is_active})">${m.is_active?'ON':'OFF'}</td>
            <td style="padding:8px 16px;border-bottom:1px solid var(--bd2);text-align:center"><button class="btn btn-outline btn-sm" style="padding:2px 5px;font-size:12px" onclick="editDeptMapping('${m.dept_id}','${m.module_role}','${m.section_scope||''}',${!!m.is_active})">✏️</button></td>
          </tr>`;
        }).join('')}</tbody>
      </table>
    </div>`;
  } catch(e) {
    el.innerHTML = '<div class="pad" style="color:var(--red)">❌ Error: ' + e.message + '</div>';
  }
}

function editDeptMapping(deptId, role, scope, active) {
  showDialog(`
    <div style="font-size:16px;font-weight:700;margin-bottom:12px">✏️ แก้ ${deptId}</div>
    <div class="form-group">
      <label class="form-label">Module Role</label>
      <select id="editRole" class="form-input">
        <option value="store" ${role==='store'?'selected':''}>store</option>
        <option value="bc_production" ${role==='bc_production'?'selected':''}>bc_production</option>
        <option value="bc_management" ${role==='bc_management'?'selected':''}>bc_management</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Section Scope (comma-separated)</label>
      <input id="editScope" class="form-input" value="${scope}" placeholder="cake, sauce">
    </div>
    <div style="display:flex;gap:8px;margin-top:16px">
      <button class="btn btn-outline" style="flex:1" onclick="closeDialog()">ยกเลิก</button>
      <button class="btn btn-gold" style="flex:1" onclick="saveDeptMapping('${deptId}')">💾 บันทึก</button>
    </div>
  `);
}

async function saveDeptMapping(deptId) {
  const role = document.getElementById('editRole').value;
  const scope = document.getElementById('editScope').value;
  closeDialog();
  try {
    const resp = await api('update_dept_mapping', { dept_id: deptId, module_role: role, section_scope: scope });
    toast(resp.message || 'อัพเดตแล้ว', 'success');
    await renderAdminDeptMapping();
  } catch(e) { toast('เกิดข้อผิดพลาด', 'error'); }
}

async function toggleDeptActive(deptId, newActive) {
  if (!confirm(`${newActive?'เปิด':'ปิด'} dept ${deptId}?`)) return;
  try {
    const resp = await api('update_dept_mapping', { dept_id: deptId, is_active: newActive });
    toast(resp.message || 'อัพเดตแล้ว', 'success');
    await renderAdminDeptMapping();
  } catch(e) { toast('เกิดข้อผิดพลาด', 'error'); }
}

// ─── A5: System Config (Editable) ────────────────────────────
async function renderAdminConfig() {
  const el = document.getElementById('adminConfigContent');
  el.innerHTML = '<div style="text-align:center;padding:40px"><div class="spinner"></div></div>';
  
  let config = {};
  try {
    const resp = await api('get_config');
    if (resp.success) config = resp.data;
  } catch(e) {}
  
  const items = [
    { key:'cutoff_time', label:'⏰ Cutoff Time', desc:'สั่งหลังเวลานี้ → Pending', type:'time' },
    { key:'delivery_days', label:'📅 Delivery Days', desc:'วันที่เปิดให้สั่ง', type:'text' },
    { key:'store_data_days', label:'📊 Store Data Days', desc:'จำนวนวันที่แสดงข้อมูล', type:'number' },
    { key:'auto_refresh_seconds', label:'🔄 Auto Refresh (วินาที)', desc:'รีเฟรชอัตโนมัติ', type:'number' },
  ];
  
  el.innerHTML = `<div style="padding:16px 20px">
    <div style="font-size:13px;font-weight:700;color:var(--t3);text-transform:uppercase;margin-bottom:6px">⚙️ System Configuration</div>
    ${items.map(i => `<div style="display:flex;align-items:center;justify-content:space-between;padding:7px 10px;border-bottom:1px solid var(--bd2)">
      <div><div style="font-size:13px;font-weight:500">${i.label}</div><div style="font-size:12px;color:var(--t3)">${i.desc}</div></div>
      <div style="font-size:13px;font-weight:700;color:var(--gold)">${config[i.key]||'—'} <span style="font-size:12px;color:var(--blue);cursor:pointer" onclick="editConfig('${i.key}','${config[i.key]||''}','${i.type}')">✏️</span></div>
    </div>`).join('')}
  </div>`;
}

function editConfig(key, current, type) {
  showDialog(`
    <div style="font-size:16px;font-weight:700;margin-bottom:12px">✏️ แก้ ${key}</div>
    <div class="form-group">
      <input id="editConfigVal" class="form-input" type="${type}" value="${current}" placeholder="ใส่ค่าใหม่">
    </div>
    <div style="display:flex;gap:8px;margin-top:16px">
      <button class="btn btn-outline" style="flex:1" onclick="closeDialog()">ยกเลิก</button>
      <button class="btn btn-gold" style="flex:1" onclick="saveConfig('${key}')">💾 บันทึก</button>
    </div>
  `);
}

async function saveConfig(key) {
  const val = document.getElementById('editConfigVal').value;
  closeDialog();
  try {
    const resp = await api('update_config', { config_key: key, config_value: val });
    toast(resp.message || 'อัพเดตแล้ว', 'success');
    await renderAdminConfig();
  } catch(e) { toast('เกิดข้อผิดพลาด', 'error'); }
}

// ─── A4: Notification Settings ───────────────────────────────
async function renderAdminNotifSettings() {
  const el = document.getElementById('adminNotifSettingsContent');
  el.innerHTML = '<div style="text-align:center;padding:40px"><div class="spinner"></div></div>';
  
  try {
    const resp = await api('get_notif_settings');
    if (!resp.success) { el.innerHTML = '<div class="pad" style="color:var(--red)">❌ ' + resp.error + '</div>'; return; }
    
    const settings = resp.data || {};
    
    const groups = [
      { title:'🏪 Store Notifications', items:[
        { key:'notif_store_new_order', label:'ออเดอร์ใหม่', desc:'แจ้งเมื่อสั่งออเดอร์สำเร็จ' },
        { key:'notif_store_order_status', label:'สถานะเปลี่ยน', desc:'แจ้งเมื่อ BC อัพเดตสถานะ' },
        { key:'notif_store_cutoff_warning', label:'เตือน Cutoff', desc:'เตือนก่อน cutoff 30 นาที' },
      ]},
      { title:'🏭 BC Notifications', items:[
        { key:'notif_bc_new_order', label:'ออเดอร์เข้า', desc:'แจ้งเมื่อร้านสั่งของใหม่' },
        { key:'notif_bc_order_status', label:'สถานะเปลี่ยน', desc:'แจ้งเมื่อ fulfil/deliver' },
        { key:'notif_bc_cutoff_alert', label:'Cutoff Violation', desc:'แจ้งเมื่อมีการสั่งหลัง cutoff' },
        { key:'notif_bc_stock_low', label:'Stock ต่ำ', desc:'แจ้งเมื่อสต็อกต่ำกว่า threshold' },
      ]},
      { title:'👑 Admin', items:[
        { key:'notif_admin_daily_summary', label:'Daily Summary', desc:'สรุปรายวันส่งให้ admin' },
      ]},
    ];
    
    el.innerHTML = `<div style="padding:16px 20px">
      <div style="font-size:13px;font-weight:700;color:var(--t3);text-transform:uppercase;margin-bottom:2px">🔔 Notification Settings</div>
      <div style="font-size:12px;color:var(--t3);margin-bottom:6px">กดเพื่อ toggle ON/OFF</div>
      ${groups.map(g => `
        <div style="font-size:13px;font-weight:600;color:var(--t3);margin:8px 0 4px">${g.title}</div>
        ${g.items.map(i => {
          const on = settings[i.key] !== false;
          return `<div style="display:flex;align-items:center;justify-content:space-between;padding:7px 10px;border-bottom:1px solid var(--bd2)">
            <div><div style="font-size:13px;font-weight:500">${i.label}</div><div style="font-size:12px;color:var(--t3)">${i.desc}</div></div>
            <div onclick="toggleNotifSetting('${i.key}',${!on})" style="cursor:pointer;width:32px;height:18px;border-radius:9px;background:${on?'var(--green)':'var(--bd)'};position:relative;flex-shrink:0">
              <div style="width:14px;height:14px;border-radius:50%;background:#fff;position:absolute;top:2px;${on?'right:2px':'left:2px'};box-shadow:0 1px 3px rgba(0,0,0,.2)"></div>
            </div>
          </div>`;
        }).join('')}
      `).join('')}
    </div>`;
  } catch(e) {
    el.innerHTML = '<div class="pad" style="color:var(--red)">❌ Error: ' + e.message + '</div>';
  }
}

async function toggleNotifSetting(key, enabled) {
  try {
    const resp = await api('update_notif_setting', { config_key: key, enabled });
    toast(resp.message || (enabled?'เปิด':'ปิด') + 'แล้ว', 'success');
    await renderAdminNotifSettings();
  } catch(e) { toast('เกิดข้อผิดพลาด', 'error'); }
}

// ─── A2: Cutoff Violations ───────────────────────────────────
function renderAdminCutoff() {
  const orders = S.orders || [];
  const violations = orders.filter(o => o.is_cutoff_violation);

  document.getElementById('adminCutoffContent').innerHTML = `<div style="padding:16px 20px">
    <div style="font-size:13px;font-weight:700;color:var(--t3);text-transform:uppercase;margin-bottom:6px">⏰ Cutoff Violations (${violations.length})</div>
    ${violations.length === 0 ? '<div class="empty"><div class="empty-icon">✅</div><div class="empty-title">ไม่มี violation</div></div>' : `
    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:8px">
      <thead><tr style="background:var(--s1)">
        <th style="padding:8px 16px;text-align:left;font-weight:600;font-size:12px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">Order ID</th>
        <th style="padding:8px 16px;text-align:left;font-weight:600;font-size:12px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">Store</th>
        <th style="padding:8px 16px;text-align:left;font-weight:600;font-size:12px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">สั่งเมื่อ</th>
        <th style="padding:8px 16px;text-align:left;font-weight:600;font-size:12px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">วันส่ง</th>
        <th style="padding:8px 16px;text-align:left;font-weight:600;font-size:12px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">สั่งโดย</th>
        <th style="padding:8px 16px;text-align:left;font-weight:600;font-size:12px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">Status</th>
      </tr></thead>
      <tbody>${violations.map(o => `<tr style="cursor:pointer;border-left:3px solid var(--red)" onclick="viewOrderDetail('${o.order_id}')">
        <td style="padding:8px 16px;border-bottom:1px solid var(--bd2);font-weight:700;color:var(--gold)">${o.order_id}</td>
        <td style="padding:8px 16px;border-bottom:1px solid var(--bd2);font-weight:600">${getStoreName(o.store_id)}</td>
        <td style="padding:8px 16px;border-bottom:1px solid var(--bd2);font-size:12px">${o.created_at ? new Date(o.created_at).toLocaleString('th-TH',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'short'}) : '—'}</td>
        <td style="padding:8px 16px;border-bottom:1px solid var(--bd2)">${formatDateAU(o.delivery_date)}</td>
        <td style="padding:8px 16px;border-bottom:1px solid var(--bd2)">${o.display_name||o.created_by||'—'}</td>
        <td style="padding:8px 16px;border-bottom:1px solid var(--bd2)"><span class="status ${statusClass(o.status)}">${o.status}</span></td>
      </tr>`).join('')}</tbody>
    </table>`}
  </div>`;
}

// ─── A9: Audit Trail ─────────────────────────────────────────
async function renderAdminAudit() {
  const el = document.getElementById('adminAuditContent');
  el.innerHTML = '<div style="text-align:center;padding:40px"><div class="spinner"></div></div>';

  if (!S.auditFilter) S.auditFilter = 'all';
  const filter = S.auditFilter;

  try {
    const filterParams = filter !== 'all' ? { target_type: filter } : {};
    const resp = await api('get_audit_log', null, filterParams);

    if (!resp.success) { el.innerHTML = '<div class="pad" style="color:var(--red)">❌ ' + (resp.message || resp.error) + '</div>'; return; }

    const logs = resp.data || [];
    const typeColors = {
      update_permission: { bg:'var(--purple-bg)', color:'var(--purple)', label:'🔒 permission' },
      update_dept_mapping: { bg:'var(--blue-bg)', color:'var(--blue)', label:'🏢 dept' },
      update_config: { bg:'var(--orange-bg)', color:'var(--orange)', label:'⚙️ config' },
      update_notif_setting: { bg:'var(--green-bg)', color:'var(--green)', label:'🔔 notif' },
      update_product: { bg:'rgba(8,145,178,.1)', color:'var(--blue)', label:'📦 product' },
    };

    el.innerHTML = `<div style="padding:16px 20px">
      <div style="display:flex;gap:3px;margin-bottom:7px;flex-wrap:wrap">
        <span class="filter-chip ${filter==='all'?'active':''}" onclick="S.auditFilter='all';renderAdminAudit()">ทั้งหมด</span>
        <span class="filter-chip ${filter==='permission'?'active':''}" onclick="S.auditFilter='permission';renderAdminAudit()">🔒 สิทธิ์</span>
        <span class="filter-chip ${filter==='dept_mapping'?'active':''}" onclick="S.auditFilter='dept_mapping';renderAdminAudit()">🏢 Dept</span>
        <span class="filter-chip ${filter==='config'?'active':''}" onclick="S.auditFilter='config';renderAdminAudit()">⚙️ Config</span>
        <span class="filter-chip ${filter==='product'?'active':''}" onclick="S.auditFilter='product';renderAdminAudit()">📦 Product</span>
      </div>

      ${logs.length === 0 ? '<div class="empty"><div class="empty-icon">📝</div><div class="empty-title">ยังไม่มีบันทึก</div></div>' : `
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead><tr style="background:var(--s1)">
          <th style="padding:8px 16px;text-align:left;font-weight:600;font-size:12px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">เวลา</th>
          <th style="padding:8px 16px;text-align:left;font-weight:600;font-size:12px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">Action</th>
          <th style="padding:8px 16px;text-align:left;font-weight:600;font-size:12px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">Target</th>
          <th style="padding:8px 16px;text-align:left;font-weight:600;font-size:12px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">เปลี่ยนจาก</th>
          <th style="padding:8px 16px;text-align:left;font-weight:600;font-size:12px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">เปลี่ยนเป็น</th>
          <th style="padding:8px 16px;text-align:left;font-weight:600;font-size:12px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">โดย</th>
        </tr></thead>
        <tbody>${logs.map(l => {
          const tc = typeColors[l.action_type] || { bg:'var(--s2)', color:'var(--td)', label:l.action_type };
          return `<tr>
            <td style="padding:8px 16px;border-bottom:1px solid var(--bd2);font-size:12px">${l.changed_at ? new Date(l.changed_at).toLocaleString('th-TH',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}) : '—'}</td>
            <td style="padding:8px 16px;border-bottom:1px solid var(--bd2)"><span style="background:${tc.bg};color:${tc.color};padding:1px 4px;border-radius:3px;font-size:12px;font-weight:600">${tc.label}</span></td>
            <td style="padding:8px 16px;border-bottom:1px solid var(--bd2);font-size:12px">${l.target_id||'—'}</td>
            <td style="padding:8px 16px;border-bottom:1px solid var(--bd2);color:var(--red);font-size:12px">${truncate(l.old_value,30)||'—'}</td>
            <td style="padding:8px 16px;border-bottom:1px solid var(--bd2);color:var(--green);font-size:12px">${truncate(l.new_value,30)||'—'}</td>
            <td style="padding:8px 16px;border-bottom:1px solid var(--bd2)">${l.changed_by_name||l.changed_by||'—'}</td>
          </tr>`;
        }).join('')}</tbody>
      </table>`}
    </div>`;
  } catch(e) {
    el.innerHTML = '<div class="pad" style="color:var(--red)">❌ Error: ' + e.message + '</div>';
  }
}

function truncate(s, n) { return s && s.length > n ? s.substring(0, n) + '...' : s; }

