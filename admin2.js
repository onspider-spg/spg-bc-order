// Version 10.4 | 8 MAR 2026 | Siam Palette Group
// BC Order — admin2.js: WasteDash, TopProducts, Announcements, BC Orders, BC Fulfil, BC Stock, BC Returns, Print
// Fix: Print section filter, tab selected state, cleaner print header

// ─── B-04: WASTE DASHBOARD ──────────────────────────────────
async function renderAdminWasteDashboard() {
  const el = document.getElementById('adminWasteDbContent');
  el.innerHTML = '<div style="text-align:center;padding:40px"><div class="spinner"></div></div>';
  
  if (!S.wasteDashFrom) { const d = new Date(); d.setDate(d.getDate() - 30); S.wasteDashFrom = d.toISOString().split('T')[0]; }
  if (!S.wasteDashTo) S.wasteDashTo = new Date().toISOString().split('T')[0];
  
  try {
    const resp = await api('get_waste_dashboard', null, { from_date: S.wasteDashFrom, to_date: S.wasteDashTo });
    if (!resp.success) { el.innerHTML = '<div class="pad" style="color:var(--red)">❌ ' + (resp.message || resp.error) + '</div>'; return; }
    
    const d = resp.data;
    const sm = d.summary;
    const reasonColors = { Expired:'#ef4444', Damaged:'#f97316', Return:'#8b5cf6', Other:'#6b7280' };
    const reasonLabels = { Expired:'หมดอายุ', Damaged:'เสียหาย', Return:'จาก Return' };
    
    // Date range selector
    let html = `
      <div style="display:flex;align-items:center;gap:6px;padding:8px 16px;font-size:12px">
        <span style="color:var(--t3)">📅</span>
        <input class="form-input" type="date" style="flex:1;padding:6px 10px;font-size:12px" value="${S.wasteDashFrom}" onchange="S.wasteDashFrom=this.value;renderAdminWasteDashboard()">
        <span style="color:var(--t4)">→</span>
        <input class="form-input" type="date" style="flex:1;padding:6px 10px;font-size:12px" value="${S.wasteDashTo}" onchange="S.wasteDashTo=this.value;renderAdminWasteDashboard()">
        <span style="font-size:12px;color:var(--blue);cursor:pointer;white-space:nowrap" onclick="S.wasteDashFrom=todaySydney();S.wasteDashTo=todaySydney();renderAdminWasteDashboard()">วันนี้</span>
        <span style="font-size:12px;color:var(--blue);cursor:pointer;white-space:nowrap" onclick="const d=new Date();d.setDate(d.getDate()-30);S.wasteDashFrom=d.toISOString().split('T')[0];S.wasteDashTo=new Date().toISOString().split('T')[0];renderAdminWasteDashboard()">30 วัน</span>
      </div>`;
    
    // Summary cards
    html += `
      <div class="sec-hd">📊 สรุปภาพรวม (${S.wasteDashFrom} → ${S.wasteDashTo})</div>
      <div class="sum-grid">
        <div class="sum-card" style="border-left:3px solid var(--red)">
          <div class="sum-val" style="color:var(--red)">${sm.today_qty}</div>
          <div class="sum-lbl">ทิ้งวันนี้</div>
          <div style="font-size:13px;color:var(--td)">${sm.today_records} รายการ</div>
        </div>
        <div class="sum-card" style="border-left:3px solid var(--orange)">
          <div class="sum-val" style="color:var(--orange)">${sm.week_qty}</div>
          <div class="sum-lbl">7 วันล่าสุด</div>
          <div style="font-size:13px;color:var(--td)">${sm.week_records} รายการ</div>
        </div>
        <div class="sum-card" style="border-left:3px solid var(--blue)">
          <div class="sum-val">${sm.total_qty}</div>
          <div class="sum-lbl">ทั้งหมด</div>
          <div style="font-size:13px;color:var(--td)">${sm.total_records} รายการ</div>
        </div>
        <div class="sum-card" style="border-left:3px solid var(--gold)">
          <div class="sum-val">${sm.total_records > 0 ? Math.round(sm.total_qty / Math.max(1, Math.round((new Date(S.wasteDashTo)-new Date(S.wasteDashFrom))/(86400000)))) : 0}</div>
          <div class="sum-lbl">เฉลี่ย/วัน</div>
        </div>
      </div>`;
    
    // By Reason
    const reasons = Object.entries(d.byReason).sort((a,b) => b[1].qty - a[1].qty);
    const maxReasonQty = reasons.length ? reasons[0][1].qty : 1;
    html += `<div class="sec-hd">📋 แยกตามสาเหตุ</div><div class="pad" style="padding-top:0">`;
    reasons.forEach(([reason, v]) => {
      const pct = Math.round((v.qty / maxReasonQty) * 100);
      const color = reasonColors[reason] || '#6b7280';
      const label = reasonLabels[reason] || reason;
      html += `
        <div style="margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:3px">
            <span style="font-weight:600">${label}</span>
            <span style="color:var(--td)">${v.qty} ชิ้น (${v.count} ครั้ง)</span>
          </div>
          <div style="background:var(--s2);border-radius:4px;height:14px;overflow:hidden">
            <div style="background:${color};height:100%;width:${pct}%;border-radius:4px;transition:width 0.5s"></div>
          </div>
        </div>`;
    });
    html += '</div>';
    
    // Top Products
    const topP = d.topProducts || [];
    const maxProdQty = topP.length ? topP[0].qty : 1;
    html += `<div class="sec-hd">🏆 Top Waste สินค้า</div><div class="pad" style="padding-top:0">`;
    topP.forEach((p, idx) => {
      const pct = Math.round((p.qty / maxProdQty) * 100);
      const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '#'+(idx+1);
      html += `
        <div style="margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:3px">
            <span>${medal} <strong>${p.name}</strong> <span style="color:var(--td);font-size:13px">${p.section}</span></span>
            <span style="color:var(--red);font-weight:600">${p.qty} ชิ้น</span>
          </div>
          <div style="background:var(--s2);border-radius:4px;height:10px;overflow:hidden">
            <div style="background:var(--red);opacity:${1 - idx*0.08};height:100%;width:${pct}%;border-radius:4px;transition:width 0.5s"></div>
          </div>
        </div>`;
    });
    if (!topP.length) html += '<div style="text-align:center;color:var(--td);font-size:12px;padding:16px">ไม่มีข้อมูล</div>';
    html += '</div>';
    
    // By Source
    const sources = Object.entries(d.bySource).sort((a,b) => b[1].qty - a[1].qty);
    if (sources.length > 1) {
      const maxSrcQty = sources[0][1].qty || 1;
      const srcIcons = { bakery:'🏭', MC:'🥭', ISH:'🍣', GB:'🥞', RW:'🍜', TM:'🧀' };
      html += `<div class="sec-hd">🏬 แยกตามแหล่ง</div><div class="pad" style="padding-top:0">`;
      sources.forEach(([src, v]) => {
        const pct = Math.round((v.qty / maxSrcQty) * 100);
        const icon = srcIcons[src] || '📍';
        html += `
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <span style="font-size:16px">${icon}</span>
            <div style="flex:1">
              <div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:2px">
                <span style="font-weight:600">${src === 'bakery' ? 'Bakery Centre' : getStoreName(src) || src}</span>
                <span style="color:var(--td)">${v.qty} (${v.count})</span>
              </div>
              <div style="background:var(--s2);border-radius:3px;height:8px;overflow:hidden">
                <div style="background:var(--blue);height:100%;width:${pct}%;border-radius:3px"></div>
              </div>
            </div>
          </div>`;
      });
      html += '</div>';
    }
    
    // Daily Trend (bar chart)
    const trend = d.dailyTrend || [];
    const maxDay = Math.max(...trend.map(t => t.qty), 1);
    const recentTrend = trend.slice(-14);
    html += `<div class="sec-hd">📈 แนวโน้มรายวัน</div>
      <div class="pad" style="padding-top:0;overflow-x:auto">
        <div style="display:flex;align-items:flex-end;gap:3px;height:120px;min-width:${recentTrend.length * 24}px">`;
    recentTrend.forEach(t => {
      const h = t.qty > 0 ? Math.max(Math.round((t.qty / maxDay) * 100), 4) : 0;
      const isToday = t.date === todaySydney();
      const dayLabel = t.date.slice(8);
      html += `
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;min-width:20px">
          <div style="font-size:12px;color:var(--td);margin-bottom:2px">${t.qty || ''}</div>
          <div style="width:100%;max-width:24px;height:${h}px;background:${isToday ? 'var(--red)' : 'var(--blue)'};border-radius:3px 3px 0 0;transition:height 0.5s"></div>
          <div style="font-size:12px;color:var(--td);margin-top:2px;${isToday?'font-weight:700;color:var(--red)':''}">${dayLabel}</div>
        </div>`;
    });
    html += `</div>
      <div style="font-size:12px;color:var(--td);text-align:center;margin-top:6px">← เก่ากว่า · ล่าสุด →</div>
    </div>`;
    
    el.innerHTML = html;
    
  } catch(e) {
    el.innerHTML = '<div class="pad" style="color:var(--red)">❌ Error: ' + e.message + '</div>';
  }
}

// ─── B-05: TOP PRODUCTS DASHBOARD ───────────────────────────
async function renderAdminTopProducts() {
  const el = document.getElementById('adminTopProdContent');
  el.innerHTML = '<div style="text-align:center;padding:40px"><div class="spinner"></div></div>';
  
  if (!S.topProdFrom) { const d = new Date(); d.setDate(d.getDate() - 30); S.topProdFrom = d.toISOString().split('T')[0]; }
  if (!S.topProdTo) S.topProdTo = new Date().toISOString().split('T')[0];
  if (!S.topProdStore) S.topProdStore = 'ALL';
  
  try {
    const qp = { from_date: S.topProdFrom, to_date: S.topProdTo };
    if (S.topProdStore !== 'ALL') qp.store = S.topProdStore;
    const resp = await api('get_top_products', null, qp);
    if (!resp.success) { el.innerHTML = '<div class="pad" style="color:var(--red)">❌ ' + (resp.message || resp.error) + '</div>'; return; }
    
    const d = resp.data;
    const sectionIcons = { cake:'🎂', sauce:'🫕', baked:'🍞', other:'📦' };
    const sectionColors = { cake:'#f59e0b', sauce:'#8b5cf6', baked:'#f97316', other:'#6b7280' };
    
    // Date range selector
    let html = `
      <div style="display:flex;align-items:center;gap:6px;padding:8px 16px;font-size:12px">
        <span style="color:var(--t3)">📅</span>
        <input class="form-input" type="date" style="flex:1;padding:6px 10px;font-size:12px" value="${S.topProdFrom}" onchange="S.topProdFrom=this.value;renderAdminTopProducts()">
        <span style="color:var(--t4)">→</span>
        <input class="form-input" type="date" style="flex:1;padding:6px 10px;font-size:12px" value="${S.topProdTo}" onchange="S.topProdTo=this.value;renderAdminTopProducts()">
        <span style="font-size:12px;color:var(--blue);cursor:pointer;white-space:nowrap" onclick="S.topProdFrom=todaySydney();S.topProdTo=todaySydney();renderAdminTopProducts()">วันนี้</span>
        <span style="font-size:12px;color:var(--blue);cursor:pointer;white-space:nowrap" onclick="const d=new Date();d.setDate(d.getDate()-30);S.topProdFrom=d.toISOString().split('T')[0];S.topProdTo=new Date().toISOString().split('T')[0];renderAdminTopProducts()">30 วัน</span>
      </div>
      ${S.role === 'bc' ? `<div class="filter-bar" style="margin-top:0">
        <div class="filter-chip ${S.topProdStore==='ALL'?'active':''}" onclick="S.topProdStore='ALL';renderAdminTopProducts()">ทุกร้าน</div>
        ${(S.stores||[]).filter(s => !['BC'].includes(s.store_id) && (S.orderingChannels||[]).some(ch => ch.store_id === s.store_id && ch.is_active)).map(s => `<div class="filter-chip ${S.topProdStore===s.store_id?'active':''}" onclick="S.topProdStore='${s.store_id}';renderAdminTopProducts()">${s.store_id}</div>`).join('')}
      </div>` : ''}`;
    
    // Summary cards — wireframe 3-col KPI
    html += `
      <div style="padding:0 16px 10px"><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px">
        <div style="padding:10px;background:var(--gold-bg);border-radius:var(--rd2);text-align:center">
          <div style="font-size:12px;color:var(--gold);font-weight:600">Total Ordered</div>
          <div style="font-size:22px;font-weight:800;color:var(--gold)">${(d.total_qty||0).toLocaleString()}</div>
          <div style="font-size:12px;color:var(--gold)">ชิ้น · ${S.topProdFrom} → ${S.topProdTo}</div>
        </div>
        <div style="padding:10px;background:var(--s1);border-radius:var(--rd2);text-align:center">
          <div style="font-size:12px;color:var(--t3);font-weight:600">Total Orders</div>
          <div style="font-size:22px;font-weight:800">${d.total_orders||0}</div>
          <div style="font-size:12px;color:var(--t3)">orders</div>
        </div>
        <div style="padding:10px;background:var(--blue-bg);border-radius:var(--rd2);text-align:center">
          <div style="font-size:12px;color:var(--blue);font-weight:600">Products Active</div>
          <div style="font-size:22px;font-weight:800;color:var(--blue)">${(d.products||[]).length}</div>
          <div style="font-size:12px;color:var(--blue)">of ${S.products.length}</div>
        </div>
      </div></div>`;
    
    // Top Products Ranked
    const topP = d.products || [];
    const maxQty = topP.length ? topP[0].qty_ordered : 1;
    html += `<div class="sec-hd">🏆 สินค้ายอดนิยม (Top 20)</div><div class="pad" style="padding-top:0">`;
    if (!topP.length) {
      html += '<div style="text-align:center;color:var(--td);font-size:12px;padding:16px">ไม่มีข้อมูล</div>';
    } else {
      // v6.4.1: resolve product name from S.products if backend returned product_id as name
      topP.forEach(p => {
        if (!p.name || p.name === p.product_id) {
          const lp = (S.products || []).find(x => x.product_id === p.product_id);
          if (lp) p.name = lp.product_name || p.name;
        }
      });
      topP.forEach((p, idx) => {
        const pct = Math.round((p.qty_ordered / maxQty) * 100);
        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '#'+(idx+1);
        const secIcon = sectionIcons[p.section] || '📦';
        const storeBreakdown = (p.by_store || []).map(s =>
          `<span style="background:var(--s1);color:var(--t3);padding:1px 5px;border-radius:3px;font-size:12px">${s.store_id}: ${s.qty}</span>`
        ).join('');
        html += `
          <div style="margin-bottom:10px">
            <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:3px">
              <div style="display:flex;align-items:center;gap:6px"><span style="font-size:14px">${medal}</span><span style="font-size:14px;font-weight:700">${p.name}</span><span style="font-size:12px;color:var(--t4)">${p.section} · ${p.unit}</span></div>
              <div style="text-align:right"><span style="font-size:14px;font-weight:800;color:var(--gold)">${p.qty_ordered}</span><span style="font-size:12px;color:var(--t3)"> ชิ้น · ${p.order_count} orders</span></div>
            </div>
            <div style="height:8px;background:var(--s2);border-radius:4px;overflow:hidden"><div style="width:${pct}%;height:100%;background:linear-gradient(90deg,var(--gold),#e8a820);border-radius:4px;transition:width .5s"></div></div>
            ${storeBreakdown ? `<div style="display:flex;gap:4px;margin-top:3px;flex-wrap:wrap">${storeBreakdown}</div>` : ''}
          </div>`;
      });
    }
    html += '</div>';
    
    // By Section
    const sections = d.bySection || [];
    if (sections.length > 0) {
      const maxSecQty = sections[0].qty_ordered || 1;
      html += `<div class="sec-hd">📦 แยกตาม Section</div><div class="pad" style="padding-top:0">`;
      sections.forEach(s => {
        const pct = Math.round((s.qty_ordered / maxSecQty) * 100);
        const icon = sectionIcons[s.section_id] || '📦';
        const color = sectionColors[s.section_id] || '#6b7280';
        html += `
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
            <span style="font-size:20px">${icon}</span>
            <div style="flex:1">
              <div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:2px">
                <span style="font-weight:600">${s.section_id.toUpperCase()}</span>
                <span style="color:var(--td)">${s.qty_ordered} ชิ้น · ${s.product_count} สินค้า</span>
              </div>
              <div style="background:var(--s2);border-radius:4px;height:10px;overflow:hidden">
                <div style="background:${color};height:100%;width:${pct}%;border-radius:4px"></div>
              </div>
            </div>
          </div>`;
      });
      html += '</div>';
    }
    
    // By Store
    const stores = d.byStore || [];
    if (stores.length > 0) {
      const maxStoreQty = stores[0].qty_ordered || 1;
      const storeIcons = { MC:'🥭', ISH:'🍣', GB:'🥞', RW:'🍜', TM:'🧀' };
      html += `<div class="sec-hd">🏬 แยกตามร้าน</div><div class="pad" style="padding-top:0">`;
      stores.forEach((s, idx) => {
        const pct = Math.round((s.qty_ordered / maxStoreQty) * 100);
        const icon = storeIcons[s.store_id] || '🏪';
        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '#'+(idx+1);
        html += `
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
            <span style="font-size:16px">${icon}</span>
            <div style="flex:1">
              <div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:2px">
                <span>${medal} <strong>${getStoreName(s.store_id) || s.store_id}</strong></span>
                <span style="color:var(--td)">${s.qty_ordered} ชิ้น · ${s.order_count} orders</span>
              </div>
              <div style="background:var(--s2);border-radius:3px;height:10px;overflow:hidden">
                <div style="background:var(--blue);opacity:${1 - idx*0.12};height:100%;width:${pct}%;border-radius:3px"></div>
              </div>
            </div>
          </div>`;
      });
      html += '</div>';
    }
    
    // Daily Trend
    const trend = d.dailyTrend || [];
    if (trend.length > 0) {
      const maxDay = Math.max(...trend.map(t => t.qty), 1);
      const recentTrend = trend.slice(-14);
      html += `<div class="sec-hd">📈 แนวโน้มการสั่งรายวัน</div>
        <div class="pad" style="padding-top:0;overflow-x:auto">
          <div style="display:flex;align-items:flex-end;gap:3px;height:120px;min-width:${recentTrend.length * 24}px">`;
      recentTrend.forEach(t => {
        const h = t.qty > 0 ? Math.max(Math.round((t.qty / maxDay) * 100), 4) : 0;
        const isToday = t.date === todaySydney();
        const dayLabel = t.date.slice(8);
        html += `
          <div style="flex:1;display:flex;flex-direction:column;align-items:center;min-width:20px">
            <div style="font-size:12px;color:var(--td);margin-bottom:2px">${t.qty || ''}</div>
            <div style="width:100%;max-width:24px;height:${h}px;background:${isToday ? 'var(--green)' : 'var(--blue)'};border-radius:3px 3px 0 0;transition:height 0.5s"></div>
            <div style="font-size:12px;color:var(--td);margin-top:2px;${isToday?'font-weight:700;color:var(--green)':''}">${dayLabel}</div>
          </div>`;
      });
      html += `</div>
        <div style="font-size:12px;color:var(--td);text-align:center;margin-top:6px">← เก่ากว่า · ล่าสุด →</div>
      </div>`;
    }
    
    el.innerHTML = html;
    
  } catch(e) {
    el.innerHTML = '<div class="pad" style="color:var(--red)">❌ Error: ' + e.message + '</div>';
  }
}

// ─── A-01: ANNOUNCEMENT MANAGEMENT ──────────────────────────
async function renderAdminAnnouncements() {
  const el = document.getElementById('adminAnnouncementsContent');
  el.innerHTML = '<div style="text-align:center;padding:40px"><div class="spinner"></div></div>';
  
  try {
    const resp = await api('get_announcements');
    if (!resp.success) { el.innerHTML = '<div class="pad" style="color:var(--red)">❌ ' + (resp.message || resp.error) + '</div>'; return; }
    
    const today = todaySydney();
    const notifs = resp.data || [];
    S._announcements = notifs; // cache for edit lookups
    const active = notifs.filter(n => n.is_active && (!n.start_date || n.start_date <= today) && (!n.end_date || n.end_date >= today));
    const scheduled = notifs.filter(n => n.is_active && n.start_date && n.start_date > today);
    const expired = notifs.filter(n => !n.is_active || (n.end_date && n.end_date < today));
    
    el.innerHTML = `<div style="padding:16px 20px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div style="font-size:13px;font-weight:700;color:var(--t3);text-transform:uppercase">📢 Announcements</div>
        <button class="btn btn-green btn-sm" onclick="showAnnouncementForm()">+ สร้างประกาศ</button>
      </div>

      ${notifs.length === 0 ? '<div class="empty"><div class="empty-icon">📢</div><div class="empty-title">ยังไม่มีประกาศ</div></div>' : `
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead><tr style="background:var(--s1)">
          <th style="padding:8px 16px;text-align:left;font-weight:600;font-size:12px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">Title</th>
          <th style="padding:8px 16px;text-align:left;font-weight:600;font-size:12px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">Priority</th>
          <th style="padding:8px 16px;text-align:left;font-weight:600;font-size:12px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">Target</th>
          <th style="padding:8px 16px;text-align:left;font-weight:600;font-size:12px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">Expires</th>
          <th style="padding:8px 16px;text-align:center;font-weight:600;font-size:12px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">Active</th>
          <th style="padding:8px 16px;text-align:center;font-weight:600;font-size:12px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)"></th>
        </tr></thead>
        <tbody>${notifs.map(n => {
          const isAct = n.is_active && (!n.end_date || n.end_date >= today);
          const priColor = n.type === 'urgent' || n.priority === 'high' ? 'var(--red)' : 'var(--blue)';
          const priLabel = n.type === 'urgent' || n.priority === 'high' ? 'High' : 'Normal';
          const targetLabel = n.audience === 'all' ? 'all' : n.audience === 'store' ? 'store' : n.audience === 'bakery' ? 'bc' : n.audience || '—';
          return `<tr style="${!isAct?'opacity:.6':''}">
            <td style="padding:8px 16px;border-bottom:1px solid var(--bd2);font-weight:600">${n.title||'—'}</td>
            <td style="padding:8px 16px;border-bottom:1px solid var(--bd2)"><span style="color:${priColor};font-weight:600">${priLabel}</span></td>
            <td style="padding:8px 16px;border-bottom:1px solid var(--bd2)">${targetLabel}</td>
            <td style="padding:8px 16px;border-bottom:1px solid var(--bd2)">${n.end_date ? formatDateAU(n.end_date) : '—'}</td>
            <td style="padding:8px 16px;border-bottom:1px solid var(--bd2);text-align:center;color:${isAct?'var(--green)':'var(--td)'}">${isAct?'✓':'—'}</td>
            <td style="padding:8px 16px;border-bottom:1px solid var(--bd2);text-align:center"><button class="btn btn-outline btn-sm" style="padding:2px 5px;font-size:12px" onclick="showAnnouncementForm('${n.notif_id}')">✏️</button></td>
          </tr>`;
        }).join('')}</tbody>
      </table>`}
    </div>`;
  } catch(e) {
    el.innerHTML = '<div class="pad" style="color:var(--red)">❌ Error: ' + e.message + '</div>';
  }
}

function renderAnnouncementCard(n, status) {
  const audienceLabels = { all:'👥 ทุกคน', store:'🏪 ร้านค้าทั้งหมด', bakery:'🏭 Bakery เท่านั้น' };
  const audienceLabel = audienceLabels[n.audience] || '🏪 ' + (getStoreName(n.audience) || n.audience);
  const statusColor = status === 'active' ? 'var(--green)' : status === 'scheduled' ? 'var(--blue)' : 'var(--td)';
  const statusIcon = status === 'active' ? '🟢' : status === 'scheduled' ? '🔵' : '⚫';
  const opacity = status === 'expired' ? 'opacity:0.6;' : '';
  
  return `
    <div class="card" style="margin-bottom:8px;${opacity}">
      <div style="padding:12px">
        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:6px">
          <div>
            <div style="font-size:13px;font-weight:700">${statusIcon} ${n.title || 'ไม่มีหัวข้อ'}</div>
            <div style="font-size:14px;color:var(--td);margin-top:2px">${n.message}</div>
          </div>
          <div style="display:flex;gap:6px;flex-shrink:0">
            <div style="font-size:18px;cursor:pointer" onclick="showAnnouncementForm('${n.notif_id}')" title="แก้ไข">✏️</div>
            <div style="font-size:18px;cursor:pointer" onclick="toggleAnnouncement('${n.notif_id}', ${!n.is_active})" title="${n.is_active ? 'ปิด' : 'เปิด'}">${n.is_active ? '🔇' : '🔔'}</div>
            <div style="font-size:18px;cursor:pointer" onclick="deleteAnnouncement('${n.notif_id}')" title="ลบ">🗑️</div>
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;font-size:13px;color:var(--td)">
          <span>${audienceLabel}</span>
          <span>📋 ${n.type || 'broadcast'}</span>
          ${n.start_date ? `<span>🟢 เริ่ม ${n.start_date}</span>` : '<span>🟢 เริ่มทันที</span>'}
          ${n.end_date ? `<span>🔴 หมด ${n.end_date}</span>` : '<span>♾️ ไม่หมดอายุ</span>'}
          ${n.created_by ? `<span>👤 ${n.created_by}</span>` : ''}
        </div>
      </div>
    </div>`;
}

function showAnnouncementForm(editId) {
  const isEdit = !!editId;
  const existing = isEdit ? (S._announcements || []).find(n => n.notif_id === editId) : null;
  
  // If editing, we need data — fetch first
  if (isEdit && !existing) {
    // Re-fetch then try again
    api('get_announcements').then(resp => {
      if (resp.success) {
        S._announcements = resp.data;
        showAnnouncementForm(editId);
      }
    });
    return;
  }
  
  const title = existing ? existing.title : '';
  const message = existing ? existing.message : '';
  const audience = existing ? existing.audience : 'all';
  const type = existing ? (existing.type || 'broadcast') : 'broadcast';
  const startDate = existing ? (existing.start_date || '') : '';
  const endDate = existing ? (existing.end_date || '') : '';
  
  showDialog(`
    <div style="font-size:16px;font-weight:700;margin-bottom:12px">${isEdit ? '✏️ แก้ไขประกาศ' : '📢 สร้างประกาศใหม่'}</div>
    
    <div class="form-group">
      <label class="form-label">หัวข้อ *</label>
      <input class="form-input" id="annTitle" value="${title}" placeholder="เช่น ระบบอัพเดตใหม่">
    </div>
    
    <div class="form-group">
      <label class="form-label">ข้อความ *</label>
      <textarea class="form-input" id="annMessage" rows="3" placeholder="รายละเอียดประกาศ...">${message}</textarea>
    </div>
    
    <div class="form-group">
      <label class="form-label">ผู้รับ</label>
      <select class="form-input" id="annAudience">
        <option value="all" ${audience==='all'?'selected':''}>👥 ทุกคน</option>
        <option value="store" ${audience==='store'?'selected':''}>🏪 ร้านค้าทั้งหมด</option>
        <option value="bakery" ${audience==='bakery'?'selected':''}>🏭 Bakery เท่านั้น</option>
        <option value="MC" ${audience==='MC'?'selected':''}>🥭 Mango Coco</option>
        <option value="ISH" ${audience==='ISH'?'selected':''}>🍣 Issho Cafe</option>
        <option value="GB" ${audience==='GB'?'selected':''}>🥞 Golden Brown</option>
        <option value="RW" ${audience==='RW'?'selected':''}>🍜 Red Wok</option>
        <option value="TM" ${audience==='TM'?'selected':''}>🧀 Melting Cheese</option>
      </select>
    </div>
    
    <div class="form-group">
      <label class="form-label">ประเภท</label>
      <select class="form-input" id="annType">
        <option value="broadcast" ${type==='broadcast'?'selected':''}>📢 ประกาศทั่วไป</option>
        <option value="info" ${type==='info'?'selected':''}>ℹ️ ข้อมูล</option>
        <option value="warning" ${type==='warning'?'selected':''}>⚠️ เตือน</option>
        <option value="urgent" ${type==='urgent'?'selected':''}>🔥 ด่วน</option>
      </select>
    </div>
    
    <div style="display:flex;gap:8px">
      <div class="form-group" style="flex:1">
        <label class="form-label">วันเริ่ม (ว่าง = ทันที)</label>
        <input class="form-input" id="annStart" type="date" value="${startDate}">
      </div>
      <div class="form-group" style="flex:1">
        <label class="form-label">วันหมดอายุ (ว่าง = ไม่หมด)</label>
        <input class="form-input" id="annEnd" type="date" value="${endDate}">
      </div>
    </div>
    
    <div style="display:flex;gap:8px;margin-top:12px">
      <button class="btn btn-outline" style="flex:1" onclick="closeDialog()">ยกเลิก</button>
      <button class="btn btn-gold" style="flex:1" onclick="submitAnnouncement(${isEdit ? `'${editId}'` : 'null'})">${isEdit ? '💾 บันทึก' : '📢 สร้างเลย'}</button>
    </div>
  `, { wide: true });
}

async function submitAnnouncement(editId) {
  const title = document.getElementById('annTitle').value.trim();
  const message = document.getElementById('annMessage').value.trim();
  if (!title || !message) { toast('กรุณากรอกหัวข้อและข้อความ', 'error'); return; }
  
  const body = {
    title, message,
    audience: document.getElementById('annAudience').value,
    type: document.getElementById('annType').value,
    start_date: document.getElementById('annStart').value || null,
    end_date: document.getElementById('annEnd').value || null,
  };
  
  const action = editId ? 'update_announcement' : 'create_announcement';
  if (editId) body.notif_id = editId;
  
  const resp = await api(action, body);
  if (resp.success) {
    toast(resp.message, 'success');
    closeDialog();
    // Reload notifications globally so bell updates
    await loadNotifications();
    checkNotifications();
    renderAdminAnnouncements();
  } else {
    toast('❌ ' + (resp.message || resp.error), 'error');
  }
}

async function toggleAnnouncement(notifId, newState) {
  const resp = await api('update_announcement', { notif_id: notifId, is_active: newState });
  if (resp.success) {
    toast(newState ? '🔔 เปิดประกาศแล้ว' : '🔇 ปิดประกาศแล้ว', 'success');
    await loadNotifications();
    checkNotifications();
    renderAdminAnnouncements();
  } else {
    toast('❌ ' + (resp.message || resp.error), 'error');
  }
}

function deleteAnnouncement(notifId) {
  showDialog(`
    <div style="text-align:center">
      <div style="font-size:36px;margin-bottom:8px">🗑️</div>
      <div style="font-size:14px;font-weight:700">ลบประกาศนี้?</div>
      <div style="font-size:12px;color:var(--td);margin-top:4px">ลบแล้วกู้คืนไม่ได้</div>
      <div style="display:flex;gap:8px;margin-top:16px">
        <button class="btn btn-outline" style="flex:1" onclick="closeDialog()">ยกเลิก</button>
        <button class="btn" style="flex:1;background:var(--red);color:#fff" onclick="confirmDeleteAnnouncement('${notifId}')">🗑️ ลบเลย</button>
      </div>
    </div>
  `);
}

async function confirmDeleteAnnouncement(notifId) {
  const resp = await api('delete_announcement', { notif_id: notifId });
  if (resp.success) {
    toast(resp.message, 'success');
    closeDialog();
    await loadNotifications();
    checkNotifications();
    renderAdminAnnouncements();
  } else {
    toast('❌ ' + (resp.message || resp.error), 'error');
  }
}

// ─── B2: BC ORDER LIST ──────────────────────────────────────
async function renderBcOrders() {
  try { await loadOrders(); } catch(e) { console.warn('loadOrders failed:', e); }
  if (!S.bcDateFrom) S.bcDateFrom = todaySydney();
  if (!S.bcDateTo) S.bcDateTo = tomorrowSydney();
  
  const fromEl = document.getElementById('bcDateFromInput');
  const toEl = document.getElementById('bcDateToInput');
  if (fromEl) fromEl.value = S.bcDateFrom;
  if (toEl) toEl.value = S.bcDateTo;
  document.getElementById('bcOrderSub').textContent = getScopeLabel();
  renderBcOrderFilters();
  renderBcOrderList();
}

function renderBcOrderFilters() {
  const scope = S.deptMapping ? S.deptMapping.section_scope : [];
  const dated = filterOrdersByDateRangeAndScope(S.bcDateFrom, S.bcDateTo, scope);
  const counts = { all:dated.length, Pending:0, Ordered:0, InProgress:0, Fulfilled:0, Delivered:0, Rejected:0, Cancelled:0 };
  dated.forEach(o => { if (counts[o.status] !== undefined) counts[o.status]++; });

  const chips = [
    { key:'all', label:`ทั้งหมด (${counts.all})` },
    { key:'Pending', label:`Pending (${counts.Pending})` },
    { key:'Ordered', label:`Ordered (${counts.Ordered})` },
    { key:'InProgress', label:`In Prog (${counts.InProgress})` },
    { key:'Fulfilled', label:`Done (${counts.Fulfilled + counts.Delivered})` },
  ];
  if (counts.Rejected > 0) chips.push({ key:'Rejected', label:`Rejected (${counts.Rejected})` });
  if (counts.Cancelled > 0) chips.push({ key:'Cancelled', label:`Cancelled (${counts.Cancelled})` });

  document.getElementById('bcOrderFilters').innerHTML = chips.map(c =>
    `<div class="filter-chip ${S.bcStatusFilter===c.key?'bc-active':''}" onclick="S.bcStatusFilter='${c.key}';renderBcOrderList()">${c.label}</div>`
  ).join('');
}

function setBcDate(mode) {
  if (mode === 'today') { S.bcDateFrom = todaySydney(); S.bcDateTo = todaySydney(); }
  else if (mode === 'tomorrow') { S.bcDateFrom = tomorrowSydney(); S.bcDateTo = tomorrowSydney(); }
  else { S.bcDateFrom = ''; S.bcDateTo = ''; }
  const fromEl = document.getElementById('bcDateFromInput');
  const toEl = document.getElementById('bcDateToInput');
  if (fromEl) fromEl.value = S.bcDateFrom;
  if (toEl) toEl.value = S.bcDateTo;
  renderBcOrderFilters();
  renderBcOrderList();
}

function filterOrdersByDateRangeAndScope(from, to, scope) {
  let orders = S.orders || [];
  if (from) orders = orders.filter(o => o.delivery_date >= from);
  if (to) orders = orders.filter(o => o.delivery_date <= to);
  if (scope && scope.length > 0) {
    orders = orders.filter(o => {
      if (!o.items) return true;
      if (o.items.length === 0) return true;
      return o.items.some(it => scope.includes(it.section_id));
    });
  }
  return orders;
}

// Single-date version for Print Centre
function filterOrdersByDateAndScope(date, scope) {
  return filterOrdersByDateRangeAndScope(date, date, scope);
}

function renderBcOrderList() {
  const scope = S.deptMapping ? S.deptMapping.section_scope : [];
  let orders = filterOrdersByDateRangeAndScope(S.bcDateFrom, S.bcDateTo, scope);

  if (S.bcStatusFilter !== 'all') {
    if (S.bcStatusFilter === 'Fulfilled') {
      orders = orders.filter(o => o.status === 'Fulfilled' || o.status === 'Delivered');
    } else {
      orders = orders.filter(o => o.status === S.bcStatusFilter);
    }
  }

  // Section filter
  const secSet = new Set();
  orders.forEach(o => (o.items||[]).forEach(it => { if (it.section_id) secSet.add(it.section_id); }));
  const sections = [...secSet].sort();
  const secEl = document.getElementById('bcOrderSecFilter');
  if (secEl && sections.length > 1) secEl.innerHTML = sfChips('sf_bcorders', sections, 'renderBcOrderList');
  else if (secEl) secEl.innerHTML = '';
  if (S.sf_bcorders && S.sf_bcorders.length > 0) {
    orders = orders.filter(o => (o.items||[]).some(it => S.sf_bcorders.includes(it.section_id)));
  }

  const el = document.getElementById('bcOrderList');
  if (!orders.length) {
    const totalLoaded = S.orders ? S.orders.length : 0;
    el.innerHTML = `<div class="empty"><div class="empty-icon">📋</div><div class="empty-title">ไม่มีออเดอร์</div>
      ${totalLoaded > 0 ? `<div style="margin-top:12px"><button class="btn btn-outline btn-sm" onclick="S.bcDateFrom='';S.bcDateTo='';setBcDate('all')">📋 ดูทั้งหมด (${totalLoaded} orders)</button></div>` : ''}
      <div style="margin-top:8px"><button class="btn btn-outline btn-sm" onclick="renderBcOrders()">🔄 โหลดใหม่</button></div></div>`;
    return;
  }

  const bdrMap = { Pending:'var(--red)', Ordered:'var(--blue)', InProgress:'var(--orange)', Fulfilled:'var(--green)', Delivered:'var(--green)', Rejected:'var(--red)', Cancelled:'var(--t4)' };
  const isMob = window.innerWidth < 768;

  if (isMob) {
    // ── MOBILE: Card layout ──
    el.innerHTML = `<div style="padding:8px 16px;display:flex;flex-direction:column;gap:6px">${orders.map(o => {
      const bdr = bdrMap[o.status] || 'var(--bd)';
      const isDone = o.status === 'Fulfilled' || o.status === 'Delivered';
      let items = o.items || [];
      if (scope.length > 0) items = items.filter(it => scope.includes(it.section_id));
      const items3 = items.slice(0,3).map(i => `${(i.product_name||'').split(' ')[0]} ×${i.qty_ordered}${i.is_urgent?'⚡':''}`).join(', ');
      const more = items.length > 3 ? ` +${items.length - 3}` : '';

      let tapAction;
      if (o.status === 'Pending') tapAction = `showBcAccept('${o.order_id}')`;
      else if (o.status === 'Ordered' || o.status === 'InProgress') tapAction = `showBcFulfil('${o.order_id}')`;
      else tapAction = `viewOrder('${o.order_id}')`;

      return `<div style="padding:12px;border:1px solid var(--bd2);border-left:3px solid ${bdr};border-radius:0 var(--rd2) var(--rd2) 0;cursor:pointer;${isDone?'opacity:.7':''}" onclick="${tapAction}">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
          <a href="#order-detail/${o.order_id}" onclick="event.stopPropagation()" style="font-size:13px;font-weight:700;color:var(--gold);text-decoration:none">${o.order_id}</a>
          <span class="status ${statusClass(o.status)}">${o.status}</span>
        </div>
        <div style="font-size:13px;color:var(--t2)">${o.store_id} · ส่ง ${formatDateAU(o.delivery_date)} · ${o.display_name||''}</div>
        <div style="font-size:12px;color:var(--t3);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${items3}${more}</div>
      </div>`;
    }).join('')}
    <div style="font-size:12px;color:var(--t3);text-align:center;padding:6px">แสดง ${orders.length} orders</div>
    </div>`;
  } else {
    // ── DESKTOP: Table layout (unchanged) ──
    el.innerHTML = `<div style="padding:4px 16px;overflow-x:auto">
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead><tr style="background:var(--s1)">
        <th style="padding:8px 16px;text-align:left;font-weight:600;font-size:12px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">Order ID</th>
        <th style="padding:8px 16px;text-align:left;font-weight:600;font-size:12px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">Store</th>
        <th style="padding:8px 16px;text-align:left;font-weight:600;font-size:12px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">Order</th>
        <th style="padding:8px 16px;text-align:left;font-weight:600;font-size:12px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">Delivery</th>
        <th style="padding:8px 16px;text-align:left;font-weight:600;font-size:12px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">Items</th>
        <th style="padding:8px 16px;text-align:left;font-weight:600;font-size:12px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">Status</th>
        <th style="padding:8px 16px;text-align:center;font-weight:600;font-size:12px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">Cutoff</th>
        <th style="padding:8px 16px;text-align:left;font-weight:600;font-size:12px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">By</th>
      </tr></thead>
      <tbody>${orders.map(o => {
        const bdr = bdrMap[o.status] || 'var(--bd)';
        const isDone = o.status === 'Fulfilled' || o.status === 'Delivered';
        const isRejected = o.status === 'Rejected';
        let items = o.items || [];
        if (scope.length > 0) items = items.filter(it => scope.includes(it.section_id));
        const itemsSummary = items.map(i => `${(i.product_name||'').split(' ')[0]} ×${i.qty_ordered}${i.is_urgent?'⚡':''}`).join(', ') || '—';

        let tapAction;
        if (o.status === 'Pending') tapAction = `showBcAccept('${o.order_id}')`;
        else if (o.status === 'Ordered' || o.status === 'InProgress') tapAction = `showBcFulfil('${o.order_id}')`;
        else tapAction = `viewOrder('${o.order_id}')`;

        return `<tr style="cursor:pointer;border-left:3px solid ${bdr};${isDone?'opacity:.7':''}${isRejected?'opacity:.5':''}" onclick="${tapAction}">
          <td style="padding:8px 16px;border-bottom:1px solid var(--bd2)"><a href="#order-detail/${o.order_id}" onclick="event.stopPropagation()" style="font-weight:700;color:var(--gold);text-decoration:none">${o.order_id}</a></td>
          <td style="padding:8px 16px;border-bottom:1px solid var(--bd2);font-weight:600">${o.store_id}</td>
          <td style="padding:8px 16px;border-bottom:1px solid var(--bd2)">${formatDateAU(o.order_date)}</td>
          <td style="padding:8px 16px;border-bottom:1px solid var(--bd2)">${formatDateAU(o.delivery_date)}</td>
          <td style="padding:8px 16px;border-bottom:1px solid var(--bd2);font-size:12px">${itemsSummary}</td>
          <td style="padding:8px 16px;border-bottom:1px solid var(--bd2)"><span class="status ${statusClass(o.status)}">${o.status === 'InProgress' ? 'In Progress' : o.status}</span></td>
          <td style="padding:8px 16px;border-bottom:1px solid var(--bd2);text-align:center">${o.is_cutoff_violation?'<span style="font-size:12px;background:var(--orange-bg);color:var(--orange);padding:1px 4px;border-radius:3px">⚠️</span>':'—'}</td>
          <td style="padding:8px 16px;border-bottom:1px solid var(--bd2);font-size:12px">${o.display_name||o.user_id||'—'}</td>
        </tr>`;
      }).join('')}</tbody>
    </table>
    <div style="font-size:12px;color:var(--t3);text-align:center;padding:6px">แสดง ${orders.length} orders</div>
  </div>`;
  }

  renderBcOrderFilters();
}

// ─── B3: ACCEPT PENDING ─────────────────────────────────────
async function showBcAccept(orderId) {
  // Load full order detail with items from API
  try {
    const resp = await api('get_order_detail', null, { order_id: orderId });
    if (resp.success) {
      S.currentOrder = { ...resp.data.order, items: resp.data.items };
      // Also update local S.orders cache with items
      const idx = S.orders.findIndex(o => o.order_id === orderId);
      if (idx >= 0) S.orders[idx].items = resp.data.items;
    }
  } catch(e) {
    S.currentOrder = S.orders.find(o => o.order_id === orderId);
  }

  if (!S.currentOrder || S.currentOrder.status !== 'Pending') {
    viewOrder(orderId);
    return;
  }
  showScreen('bc-accept', orderId);
}

function renderBcAccept() {
  const o = S.currentOrder;
  if (!o) { showScreen('bc-orders'); return; }

  const scope = S.deptMapping ? S.deptMapping.section_scope : [];
  let items = o.items || [];
  if (scope.length > 0) items = items.filter(it => scope.includes(it.section_id));

  // Extract order time from created_at
  const orderTime = o.created_at ? o.created_at.split('T')[1].substring(0, 5) : '—';

  const el = document.getElementById('bcAcceptContent');
  el.innerHTML = `<div style="padding:16px 20px">
    <div style="padding:12px 16px;background:var(--red-bg);border-radius:var(--rd2);margin-bottom:8px;font-size:13px;color:var(--red);font-weight:600">
      ${o.order_id} · ${getStoreName(o.store_id)} · ${o.display_name||o.user_id} · ส่ง ${formatDateAU(o.delivery_date)} ${o.is_cutoff_violation ? '· <span class="status st-pending">cutoff violation</span>' : ''}
    </div>
    ${o.header_note ? `<div style="background:var(--s1);border-radius:6px;padding:7px;margin-bottom:8px;font-size:13px">📝 ${o.header_note}</div>` : ''}

    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:8px">
      <thead><tr style="background:var(--s1)">
        <th style="padding:8px 16px;text-align:left;font-weight:600;font-size:12px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">สินค้า</th>
        <th class="hide-m" style="padding:8px 16px;text-align:left;font-weight:600;font-size:12px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">Section</th>
        <th style="padding:8px 16px;text-align:center;font-weight:600;font-size:12px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">จำนวน</th>
        <th style="padding:8px 16px;text-align:center;font-weight:600;font-size:12px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">⚡</th>
        <th class="hide-m" style="padding:8px 16px;text-align:left;font-weight:600;font-size:12px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">Note</th>
      </tr></thead>
      <tbody>${items.map(it => `<tr>
        <td style="padding:8px 16px;border-bottom:1px solid var(--bd2);font-weight:600">${it.product_name}</td>
        <td class="hide-m" style="padding:8px 16px;border-bottom:1px solid var(--bd2)">${it.section_id||''}</td>
        <td style="padding:8px 16px;border-bottom:1px solid var(--bd2);text-align:center;font-weight:700">${it.qty_ordered} ${it.unit||''}</td>
        <td style="padding:8px 16px;border-bottom:1px solid var(--bd2);text-align:center;color:var(--red);font-weight:700">${it.is_urgent?'⚡ YES':'—'}</td>
        <td class="hide-m" style="padding:8px 16px;border-bottom:1px solid var(--bd2);font-size:12px">${it.item_note||it.note||'—'}</td>
      </tr>`).join('')}</tbody>
    </table>

    <div style="display:flex;gap:5px;margin-top:8px">
      <button class="btn btn-green" style="flex:1" id="btnAccept" onclick="acceptPending('${o.order_id}')">✓ Accept ทั้งหมด</button>
      <button class="btn btn-red" style="flex:1" onclick="rejectPending('${o.order_id}')">✕ Reject</button>
      <button class="btn btn-outline" style="color:var(--red);border-color:var(--red)" onclick="bcCancelOrder('${o.order_id}')">🚫 Cancel</button>
      <button class="btn btn-outline" onclick="showScreen('bc-orders')">← กลับ</button>
    </div>
  </div>`;
}

async function acceptPending(id) {
  const btn = document.getElementById('btnAccept');
  if (btn) btn.disabled = true;

  try {
    const r = await api('accept_pending', { order_id: id });
    toast(r.message || '✅ Accept เรียบร้อย', r.success ? 'success' : 'error');
  } catch (e) {
    toast('❌ Accept ไม่สำเร็จ: ' + (e.message||'ลองใหม่'), 'error');
    if (btn) btn.disabled = false;
    return;
  }

  // Update local state
  const o = S.orders.find(x => x.order_id === id);
  if (o) o.status = 'Ordered';

  setTimeout(() => showScreen('bc-orders'), 800);
}

async function rejectPending(id) {
  const reason = prompt('เหตุผลที่ปฏิเสธ:');
  if (reason === null) return;

  try {
    const r = await api('reject_order', { order_id: id, reason: reason || '' });
    toast(r.message || '❌ ปฏิเสธแล้ว', r.success ? 'warning' : 'error');
  } catch (e) {
    toast('❌ ไม่สำเร็จ: ' + (e.message||'ลองใหม่'), 'error');
    return;
  }

  const o = S.orders.find(x => x.order_id === id);
  if (o) o.status = 'Rejected';

  setTimeout(() => showScreen('bc-orders'), 800);
}

async function bcCancelOrder(id) {
  const reason = prompt('เหตุผลที่ยกเลิก:');
  if (reason === null) return;

  try {
    const r = await api('cancel_order', { order_id: id, reason: reason || '' });
    toast(r.message || '🚫 ยกเลิกแล้ว', r.success ? 'warning' : 'error');
    if (!r.success) return;
  } catch (e) {
    toast('❌ ไม่สำเร็จ: ' + (e.message||'ลองใหม่'), 'error');
    return;
  }

  const o = S.orders.find(x => x.order_id === id);
  if (o) o.status = 'Cancelled';

  setTimeout(() => showScreen('bc-orders'), 800);
}

// ─── B4: FULFILMENT UPDATE ──────────────────────────────────
async function showBcFulfil(orderId) {
  // Load full order detail with items from API
  try {
    const resp = await api('get_order_detail', null, { order_id: orderId });
    if (resp.success) {
      S.currentOrder = { ...resp.data.order, items: resp.data.items };
      const idx = S.orders.findIndex(o => o.order_id === orderId);
      if (idx >= 0) S.orders[idx].items = resp.data.items;
    }
  } catch(e) {
    S.currentOrder = S.orders.find(o => o.order_id === orderId);
  }

  if (!S.currentOrder) return;

  // Build fulfilment state from order items
  const scope = S.deptMapping ? S.deptMapping.section_scope : [];
  let items = S.currentOrder.items || [];
  if (scope.length > 0) items = items.filter(it => scope.includes(it.section_id));

  S.fulfilmentItems = items.map(it => ({
    ...it,
    ful_status: it.fulfilment_status === 'full' ? 'full' : (it.fulfilment_status === 'partial' ? 'partial' : ''),
    qty_sent: it.qty_sent || 0,
    ful_note: it.note_fulfilment || '',
  }));
  S.fulfilmentBy = S.session.user_id;

  showScreen('bc-fulfil', orderId);
}

function renderBcFulfil() {
  const o = S.currentOrder;
  if (!o) { showScreen('bc-orders'); return; }

  const done = S.fulfilmentItems.filter(i => i.ful_status).length;
  const total = S.fulfilmentItems.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const allDone = done === total && total > 0;
  const allFull = S.fulfilmentItems.every(i => i.ful_status === 'full');
  const partialMissingNote = S.fulfilmentItems.some(i => i.ful_status === 'partial' && !i.ful_note);
  const isFulfilled = o.status === 'Fulfilled';

  let html = `<div style="padding:16px 20px">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><button class="btn btn-outline btn-sm" onclick="showScreen('bc-orders')">←</button><div style="font-size:12px;font-weight:700;color:var(--gold)">${o.order_id}</div><span class="status ${statusClass(o.status)}" style="margin-left:auto">${o.status === 'InProgress' ? 'In Progress' : o.status}</span></div>
    <div style="font-size:13px;color:var(--t3);margin-bottom:6px">${getStoreName(o.store_id)} · ${o.display_name||o.user_id} · ส่ง ${formatDateAU(o.delivery_date)}</div>
    ${o.header_note ? `<div style="background:var(--s1);border-radius:6px;padding:6px;margin-bottom:6px;font-size:13px">📝 ${o.header_note}</div>` : ''}

    <!-- Progress -->
    <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;margin-bottom:3px"><span>${done} / ${total} items</span><span style="color:var(--green)">${pct}%</span></div>
    <div style="height:5px;border-radius:3px;background:var(--s2);overflow:hidden;margin-bottom:10px"><div style="height:100%;border-radius:3px;width:${pct}%;background:linear-gradient(90deg,var(--green),#2ecc71);transition:width .3s"></div></div>
  </div>`;

  // Items
  html += `<div style="padding:0 18px">`;
  S.fulfilmentItems.forEach((item, i) => {
    const isFull = item.ful_status === 'full';
    const isPart = item.ful_status === 'partial';
    const borderColor = isFull ? 'var(--green)' : isPart ? 'var(--orange)' : 'var(--bd)';

    html += `<div style="display:flex;align-items:center;gap:8px;padding:12px 16px;background:${isFull?'var(--green-bg)':'#fff'};border-left:4px solid ${borderColor};border-radius:0 var(--rd2) var(--rd2) 0;border:1px solid var(--bd2);border-left:4px solid ${borderColor};margin-bottom:4px">
      <div style="flex:1;min-width:0">
        <div style="font-size:14px;font-weight:700">${item.product_name} ${item.is_urgent?'<span style="color:var(--red)">⚡</span>':''}</div>
        ${item.note||item.item_note ? `<div style="font-size:12px;color:var(--t3)">📝 ${item.note||item.item_note}</div>` : ''}
      </div>
      <div style="text-align:center;min-width:50px">
        <div style="font-size:20px;font-weight:800">${isFull ? item.qty_ordered : isPart ? item.qty_sent : item.qty_ordered}</div>
        <div style="font-size:12px;color:${isPart?'var(--orange)':'var(--t3)'}">${isPart ? '/ '+item.qty_ordered+' '+item.unit : item.unit}</div>
      </div>
      ${isFull ? `<div style="background:var(--green);color:#fff;padding:6px 10px;border-radius:8px;font-size:14px;font-weight:700;min-width:32px;text-align:center;cursor:pointer" onclick="setFulfilment(${i},'full')">✓</div>` :
        isPart ? `<div style="background:var(--orange);color:#fff;padding:6px 10px;border-radius:8px;font-size:14px;font-weight:700;min-width:32px;text-align:center;cursor:pointer" onclick="setFulfilment(${i},'partial')">✕</div>` :
        `<div style="display:flex;gap:3px">
          <div style="background:var(--green);color:#fff;padding:8px 12px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;min-width:38px;text-align:center" onclick="setFulfilment(${i},'full')">✓</div>
          <div style="background:var(--orange);color:#fff;padding:8px 12px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;min-width:38px;text-align:center" onclick="setFulfilment(${i},'partial')">✕</div>
        </div>`}
    </div>`;

    if (isPart) {
      html += `<div style="padding:8px 14px;margin-bottom:4px;background:var(--orange-bg);border-radius:var(--rd2)">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          <label style="font-size:13px;font-weight:600;color:var(--orange)">จำนวนจริง:</label>
          <div style="display:flex;align-items:center;gap:6px">
            <div style="width:28px;height:28px;border-radius:50%;border:2px solid var(--bd);display:flex;align-items:center;justify-content:center;font-size:14px;cursor:pointer;font-weight:700" onclick="fulQty(${i},-1)">−</div>
            <div style="font-size:16px;font-weight:800;color:var(--red);min-width:24px;text-align:center">${item.qty_sent}</div>
            <div style="width:28px;height:28px;border-radius:50%;border:2px solid var(--bd);display:flex;align-items:center;justify-content:center;font-size:14px;cursor:pointer;font-weight:700" onclick="fulQty(${i},1)">+</div>
            <span style="font-size:12px;color:var(--t3)">/ ${item.qty_ordered} ${item.unit}</span>
          </div>
        </div>
        <input class="form-input" style="font-size:13px;border-color:var(--orange)" value="${item.ful_note}" 
          oninput="S.fulfilmentItems[${i}].ful_note=this.value" placeholder="เหตุผล (จำเป็น)...">
      </div>`;
    }
  });
  html += `</div>`;

  // Bottom actions
  const canDeliver = isFulfilled || o.status === 'Delivered';
  html += `<div style="padding:16px 20px;display:flex;flex-direction:column;gap:5px">
    <button class="btn btn-blue" onclick="submitFulfilment(false)">💾 บันทึกระหว่างทาง</button>
    ${allDone && !isFulfilled ? `<button class="btn btn-green" onclick="submitFulfilment(true)" ${partialMissingNote ? 'disabled' : ''}>✅ Fulfil ครบ</button>` : ''}
    <button class="btn btn-outline" style="color:var(--purple);border-color:var(--purple);${!canDeliver?'opacity:.4':''}" ${!canDeliver?'disabled':''} onclick="markDelivered('${o.order_id}')">🚚 Mark as Delivered</button>
    <button class="btn btn-outline" style="color:var(--red);border-color:var(--red)" onclick="bcCancelOrder('${o.order_id}')">🚫 Cancel Order</button>
  </div>`;

  document.getElementById('bcFulfilContent').innerHTML = html;
}

function setFulfilment(i, status) {
  const item = S.fulfilmentItems[i];
  // Toggle: tap same button again → clear
  if (item.ful_status === status) {
    item.ful_status = '';
    item.qty_sent = 0;
    item.ful_note = '';
  } else {
    item.ful_status = status;
    if (status === 'full') {
      item.qty_sent = item.qty_ordered;
      item.ful_note = '';
    } else {
      item.qty_sent = 0;
    }
  }
  renderBcFulfil();
}

function fulQty(i, d) {
  const item = S.fulfilmentItems[i];
  // partial: 0 to qty_ordered-1 (can't be full qty, that's "full")
  item.qty_sent = Math.max(0, Math.min(item.qty_ordered - 1, item.qty_sent + d));
  renderBcFulfil();
}

async function submitFulfilment(isFinal) {
  toast('⏳ กำลังบันทึก...', 'info');

  // Parallel submit all items
  const results = await Promise.all(S.fulfilmentItems.map(item =>
    api('update_fulfilment', {
      item_id: item.item_id,
      fulfilment_status: item.ful_status || '',
      qty_sent: item.qty_sent || 0,
      note: item.ful_note || '',
      fulfilled_by: S.fulfilmentBy,
    }).catch(() => ({ success: false }))
  ));

  const allSuccess = results.every(r => r && r.success);
  toast(allSuccess ? '✅ อัปเดตเรียบร้อย' : '⚠️ บางรายการมีปัญหา', allSuccess ? 'success' : 'warning');

  // Update local order status
  const allDone = S.fulfilmentItems.every(i => i.ful_status);
  const o = S.orders.find(x => x.order_id === S.currentOrder.order_id);
  if (o) o.status = allDone ? 'Fulfilled' : 'InProgress';
  if (S.currentOrder) S.currentOrder.status = allDone ? 'Fulfilled' : 'InProgress';

  // Stay on page to show Delivered button, or go back
  if (allDone || isFinal) {
    renderBcFulfil(); // re-render with Delivered button enabled
  } else {
    setTimeout(() => showScreen('bc-orders'), 800);
  }
}

// v7.1: Mark Delivered (UI stub — connects to existing API)
async function markDelivered(orderId) {
  if (!confirm('ยืนยัน Mark as Delivered สำหรับ ' + orderId + ' ?')) return;
  try {
    const r = await api('mark_delivered', { order_id: orderId });
    toast(r.message || '🚚 Delivered!', r.success ? 'success' : 'error');
  } catch(e) {
    toast('❌ Deliver ไม่สำเร็จ', 'error'); return;
  }
  const o = S.orders.find(x => x.order_id === orderId);
  if (o) o.status = 'Delivered';
  setTimeout(() => showScreen('bc-orders'), 800);
}

// ─── B5: BC STOCK MANAGEMENT ────────────────────────────────
function renderBcStock() {
  const scope = S.deptMapping ? S.deptMapping.section_scope : [];

  if (!S.stock.length) {
    S.stock = S.products.filter(p => p.allow_stock).map(p => ({
      product_id: p.product_id, product_name: p.product_name,
      unit: p.unit, section_id: p.section_id, cat_id: p.cat_id,
      stock_actual: p.stock_available || 0, stock_available: p.stock_available || 0,
    }));
  }

  let items = S.stock;
  if (scope.length > 0) items = items.filter(s => scope.includes(s.section_id));
  items.sort((a, b) => a.product_name.localeCompare(b.product_name));

  // Category chips
  const cats = [...new Set(items.map(s => s.section_id))];

  const el = document.getElementById('bcStockContent');
  el.innerHTML = `<div style="padding:16px 20px">
    <!-- Scope indicator -->
    <div style="padding:6px 10px;background:var(--blue-bg);border-radius:var(--rd2);margin-bottom:8px;font-size:12px;color:var(--blue);display:flex;justify-content:space-between">
      <span>👤 ${S.session?.display_name||''} · <b>${S.deptMapping?.module_role||''}</b> · scope: <b>${getScopeLabel()}</b></span>
      <span>allow_stock · ${items.length} สินค้า</span>
    </div>

    <input class="search-input" placeholder="🔍 ค้นหาชื่อสินค้า..." oninput="filterBcStock(this.value)" style="margin-bottom:8px;width:100%">
    <div id="bcStockSecFilter"></div>
    <div id="bcStockTable"></div>

    <button class="btn btn-blue" style="margin-top:8px" onclick="showBcStockPopup()">+ เพิ่ม/ลดสต็อก</button>
  </div>`;

  renderBcStockTable(items);
}

function filterBcStock(q) {
  const scope = S.deptMapping ? S.deptMapping.section_scope : [];
  let items = S.stock;
  if (scope.length > 0) items = items.filter(s => scope.includes(s.section_id));
  if (q) items = items.filter(s => s.product_name.toLowerCase().includes(q.toLowerCase()));

  // Section filter chips
  const sections = [...new Set(items.map(s => s.section_id).filter(Boolean))].sort();
  const secEl = document.getElementById('bcStockSecFilter');
  if (secEl && sections.length > 1) secEl.innerHTML = sfChips('sf_bcstock', sections, 'renderBcStock');
  else if (secEl) secEl.innerHTML = '';
  items = sfFilter('sf_bcstock', items, 'section_id');
  items.sort((a, b) => a.product_name.localeCompare(b.product_name));

  renderBcStockTable(items);
}

function renderBcStockTable(items) {
  const el = document.getElementById('bcStockTable');
  if (!el) return;
  el.innerHTML = `
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead><tr style="background:var(--s1)">
        <th style="padding:8px 16px;text-align:left;font-weight:600;font-size:12px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">สินค้า</th>
        <th class="hide-m" style="padding:8px 16px;text-align:left;font-weight:600;font-size:12px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">Category</th>
        <th class="hide-m" style="padding:8px 16px;text-align:left;font-weight:600;font-size:12px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">Unit</th>
        <th class="hide-m" style="padding:8px 16px;text-align:right;font-weight:600;font-size:12px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">Actual</th>
        <th style="padding:8px 16px;text-align:right;font-weight:600;font-size:12px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">Available</th>
        <th style="padding:8px 16px;text-align:center;font-weight:600;font-size:12px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">Status</th>
        <th style="padding:8px 16px;text-align:center;font-weight:600;font-size:12px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)"></th>
      </tr></thead>
      <tbody>${items.map(s => {
        const sa = Math.max(0, s.stock_available || 0);
        const actual = Math.max(0, s.stock_actual || sa);
        const min2 = 4;
        const statusLbl = actual === 0 ? 'OUT' : (actual <= min2 ? 'LOW' : 'OK');
        const statusCls = actual === 0 ? 'background:var(--red-bg);color:var(--red)' : (actual <= min2 ? 'background:#fef3c7;color:#92400e' : 'background:var(--green-bg);color:var(--green)');
        const numColor = actual === 0 ? 'var(--red)' : (actual <= min2 ? 'var(--orange)' : 'var(--green)');
        return `<tr>
          <td style="padding:8px 16px;border-bottom:1px solid var(--bd2);font-weight:600">${s.product_name}</td>
          <td class="hide-m" style="padding:8px 16px;border-bottom:1px solid var(--bd2)">${getCatName(s.section_id)}</td>
          <td class="hide-m" style="padding:8px 16px;border-bottom:1px solid var(--bd2)">${s.unit}</td>
          <td class="hide-m" style="padding:8px 16px;border-bottom:1px solid var(--bd2);text-align:right;font-weight:700;color:${numColor}">${actual}</td>
          <td style="padding:8px 16px;border-bottom:1px solid var(--bd2);text-align:right">${sa}</td>
          <td style="padding:8px 16px;border-bottom:1px solid var(--bd2);text-align:center"><span style="font-size:12px;font-weight:600;padding:2px 6px;border-radius:6px;${statusCls}">${statusLbl}</span></td>
          <td style="padding:8px 16px;border-bottom:1px solid var(--bd2);text-align:center"><button class="btn btn-outline btn-sm" style="padding:3px 8px;font-size:12px" onclick="showBcStockPopup('${s.product_id}')">+/−</button></td>
        </tr>`;
      }).join('')}</tbody>
    </table>`;
}

function showBcStockPopup(preselect) {
  const scope = S.deptMapping ? S.deptMapping.section_scope : [];
  let items = [...S.stock];
  if (scope.length > 0) items = items.filter(s => scope.includes(s.section_id));
  items.sort((a,b) => a.product_name.localeCompare(b.product_name));

  S.bcStockProduct = preselect || '';
  S.bcStockQty = 1;
  S.bcStockAction = 'add';
  S.bcStockNote = '';

  showDialog(`
    <div style="font-size:16px;font-weight:700;margin-bottom:12px">📦 เพิ่ม/ลดสต็อก</div>
    <div class="form-group">
      <label class="form-label">สินค้า</label>
      <select class="form-input" onchange="S.bcStockProduct=this.value" id="bcStockSelect">
        <option value="">— เลือกสินค้า —</option>
        ${items.map(p => `<option value="${p.product_id}" ${p.product_id===preselect?'selected':''}>${p.product_name} (${p.stock_actual} ${p.unit})</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">ประเภท</label>
      <div style="display:flex;gap:8px">
        <button class="btn btn-green" style="flex:1;padding:8px" id="bcStAdd" onclick="S.bcStockAction='add';document.getElementById('bcStAdd').className='btn btn-green';document.getElementById('bcStRm').className='btn btn-outline'">➕ เพิ่ม</button>
        <button class="btn btn-outline" style="flex:1;padding:8px" id="bcStRm" onclick="S.bcStockAction='remove';document.getElementById('bcStRm').className='btn btn-red';document.getElementById('bcStAdd').className='btn btn-outline'">➖ ลด</button>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">จำนวน</label>
      <input class="form-input" type="number" min="1" value="1" id="bcStQtyInput" style="font-size:16px" oninput="S.bcStockQty=parseInt(this.value)||0">
    </div>
    <div class="form-group">
      <label class="form-label">หมายเหตุ</label>
      <input class="form-input" placeholder="เช่น Morning batch" onchange="S.bcStockNote=this.value">
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-outline" style="flex:1" onclick="closeDialog()">ยกเลิก</button>
      <button class="btn btn-gold" style="flex:1" onclick="submitBcStock();closeDialog()">💾 บันทึก</button>
    </div>
  `);
}

function bcStockQty(d) {
  S.bcStockQty = Math.max(0, S.bcStockQty + d);
  renderBcStock();
}

async function submitBcStock() {
  if (!S.bcStockProduct || S.bcStockQty < 1) return;
  const btn = document.getElementById('btnBcStock');
  if (btn) btn.disabled = true;

  const action = S.bcStockAction === 'add' ? 'add_stock' : 'remove_stock';

  try {
    const r = await api(action, {
      product_id: S.bcStockProduct,
      quantity: S.bcStockQty,
      note: S.bcStockNote,
    });
    toast(r.message || `✅ ${S.bcStockAction==='add'?'เพิ่ม':'ลด'}สต็อกเรียบร้อย`, r.success ? 'success' : 'error');
  } catch (e) {
    toast('❌ อัพเดทสต็อกไม่สำเร็จ', 'error'); return;
  }

  // Update local stock
  const s = S.stock.find(x => x.product_id === S.bcStockProduct);
  if (s) {
    s.stock_actual += (S.bcStockAction === 'add' ? S.bcStockQty : -S.bcStockQty);
    if (s.stock_actual < 0) s.stock_actual = 0;
  }

  // Reset form
  S.bcStockQty = 0;
  S.bcStockNote = '';

  setTimeout(() => renderBcStock(), 500);
}

// ─── B7: BC RETURNS MANAGEMENT ──────────────────────────────
function renderBcReturns() {
  const scope = S.deptMapping ? S.deptMapping.section_scope : [];
  let items = S.returns || [];
  if (scope.length > 0) items = items.filter(r => scope.includes(r.section_id));

  const open = items.filter(r => r.status === 'Reported' || r.status === 'Received');
  const resolved = items.filter(r => r.status === 'Reworked' || r.status === 'Wasted');

  document.getElementById('bcReturnFilters').innerHTML = `
    <div class="filter-chip ${S.bcReturnFilter==='open'?'active':''}" onclick="S.bcReturnFilter='open';renderBcReturns()">Open (${open.length})</div>
    <div class="filter-chip ${S.bcReturnFilter==='resolved'?'active':''}" onclick="S.bcReturnFilter='resolved';renderBcReturns()">Resolved (${resolved.length})</div>
    <div class="filter-chip ${S.bcReturnFilter==='all'?'active':''}" onclick="S.bcReturnFilter='all';renderBcReturns()">ทั้งหมด (${items.length})</div>`;

  if (S.bcReturnFilter === 'open') items = open;
  else if (S.bcReturnFilter === 'resolved') items = resolved;
  items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const borderMap = { Reported:'var(--orange)', Received:'var(--blue)', Reworked:'var(--green)', Wasted:'var(--red)' };

  const el = document.getElementById('bcReturnList');
  if (!items.length) {
    el.innerHTML = '<div class="empty"><div class="empty-icon">↩️</div><div class="empty-title">ไม่มีสินค้าคืน</div></div>';
    return;
  }

  el.innerHTML = `<div style="display:flex;flex-direction:column;gap:4px;padding:0 16px 16px">${items.map(r => {
    const bdr = borderMap[r.status] || 'var(--bd)';
    const statusTag = returnStatusTag(r.status);
    const pName = r.product_name || r.product_id;

    let actions = '';
    if (r.status === 'Reported') {
      actions = `<div style="display:flex;gap:4px;margin-top:6px">
        <button class="btn btn-green btn-sm" style="padding:5px 14px;font-size:13px" onclick="showReceivePopup('${r.return_id}')">📦 Receive</button>
        <button class="btn btn-outline btn-sm" style="padding:5px 10px;font-size:13px" onclick="showReturnDetail('${r.return_id}')">👁️ Detail</button>
      </div>`;
    } else if (r.status === 'Received') {
      actions = `<div style="display:flex;gap:4px;margin-top:6px">
        <button class="btn btn-green btn-sm" style="padding:5px 14px;font-size:13px" onclick="resolveReturn('${r.return_id}','Reworked')">✅ Rework</button>
        <button class="btn btn-red btn-sm" style="padding:5px 14px;font-size:13px" onclick="resolveReturn('${r.return_id}','Wasted')">🗑️ Waste</button>
        <button class="btn btn-outline btn-sm" style="padding:5px 10px;font-size:13px" onclick="showReturnDetail('${r.return_id}')">👁️ Detail</button>
      </div>`;
    } else {
      actions = `<div style="display:flex;gap:4px;margin-top:6px">
        <button class="btn btn-outline btn-sm" style="padding:5px 10px;font-size:13px" onclick="showReturnDetail('${r.return_id}')">👁️ Detail</button>
      </div>`;
    }

    return `<div style="padding:10px 12px;border:1px solid var(--bd2);border-left:4px solid ${bdr};border-radius:0 var(--rd2) var(--rd2) 0">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
        <span style="font-size:13px;font-weight:700;color:var(--gold)">${r.return_id}</span>
        ${statusTag}
      </div>
      <div style="font-size:12px;font-weight:700">${pName} ×${r.quantity||r.qty} ${r.unit||''}</div>
      <div style="font-size:12px;color:var(--t3);margin-top:2px">จาก <b>${getStoreName(r.store_id)}</b> · ${r.issue_type||''} · ${r.action === 'return_to_bakery' ? 'ส่งคืน BC' : r.action === 'discard_at_store' ? 'ทิ้งที่ร้าน' : ''} · ${formatDateAU(r.created_at)}</div>
      ${r.failure_reason ? `<div style="font-size:12px;color:var(--td);margin-top:3px">📋 ${r.failure_reason}</div>` : ''}
      ${actions}
    </div>`;
  }).join('')}</div>`;
}

// Receive popup (BC clicks "📦 Receive")
function showReceivePopup(returnId) {
  const r = (S.returns || []).find(x => x.return_id === returnId);
  if (!r) return;
  const pName = r.product_name || r.product_id;
  showDialog(`
    <div style="font-size:14px;font-weight:700;margin-bottom:6px">📦 Receive Return</div>
    <div style="font-size:13px;font-weight:600;margin-bottom:4px">${pName} ×${r.quantity||r.qty} ${r.unit||''} — ${r.return_id}</div>
    <div style="font-size:13px;color:var(--t3);margin-bottom:8px">จาก ${getStoreName(r.store_id)} · ${r.issue_type||''} · ${formatDateAU(r.created_at)}</div>
    <div style="padding:8px 16px;background:var(--blue-bg);border-radius:var(--rd2);font-size:13px;color:var(--blue);margin-bottom:8px">ยืนยันว่า BC ได้รับสินค้าคืนแล้ว → status จะเปลี่ยนเป็น <b>Received</b></div>
    <div style="display:flex;gap:6px">
      <button class="btn btn-outline" style="flex:1" onclick="closeDialog()">ยกเลิก</button>
      <button class="btn btn-green" style="flex:1" onclick="receiveReturn('${r.return_id}');closeDialog()">📦 ยืนยันรับ</button>
    </div>
  `);
}

function returnStatusTag(s) {
  const map = {
    Reported: '<span class="tag tag-orange">📦 Reported</span>',
    Received: '<span class="tag tag-blue">📥 Received</span>',
    Reworked: '<span class="tag tag-green">🔧 Reworked</span>',
    Wasted: '<span class="tag tag-red">🗑️ Wasted</span>',
  };
  return map[s] || `<span class="tag">${s}</span>`;
}

async function receiveReturn(id) {
  try {
    const r = await api('resolve_return', { return_id: id, status: 'Received' });
    toast(r.message || '📥 รับของเรียบร้อย', r.success ? 'success' : 'error');
  } catch (e) {
    toast('❌ รับของไม่สำเร็จ: ' + (e.message||'ลองใหม่'), 'error');
    return;
  }

  const ret = S.returns.find(x => x.return_id === id);
  if (ret) ret.status = 'Received';
  renderBcReturns();
}

async function resolveReturn(id, status) {
  const isWaste = status === 'Wasted';
  let failureReason = '';

  if (isWaste) {
    failureReason = prompt('เหตุผลที่ทิ้ง:');
    if (failureReason === null) return; // cancelled
    if (!failureReason) { toast('⚠️ กรุณากรอกเหตุผล', 'warning'); return; }
  } else {
    failureReason = prompt('หมายเหตุ (ถ้ามี):') || '';
  }

  try {
    const r = await api('resolve_return', {
      return_id: id,
      status: status,
      failure_reason: failureReason,
      resolved_by: S.session.user_id,
    });
    toast(r.message || `✅ ${isWaste ? 'บันทึกทิ้ง + WasteLog' : 'ทำใหม่เรียบร้อย'}`, r.success ? 'success' : 'error');
  } catch (e) {
    toast('❌ ไม่สำเร็จ: ' + (e.message||'ลองใหม่'), 'error');
    return;
  }

  const ret = S.returns.find(x => x.return_id === id);
  if (ret) {
    ret.status = status;
    ret.failure_reason = failureReason;
  }

  renderBcReturns();
}

// ─── B8-B9: PRINT CENTRE ────────────────────────────────────
async function renderBcPrint() {
  try { await loadOrders(); } catch(e) { console.warn('Print: loadOrders failed:', e); }

  if (!S.bcPrintDate) S.bcPrintDate = tomorrowSydney();
  if (!S.bcPrintSections) S.bcPrintSections = []; // empty = all

  document.getElementById('bcPrintDateInput').value = S.bcPrintDate;

  // Available sections from orders
  const scope = S.deptMapping ? S.deptMapping.section_scope : [];
  const allOrders = filterOrdersByDateAndScope(S.bcPrintDate, scope);
  const secSet = new Set();
  allOrders.forEach(o => (o.items||[]).forEach(it => { if (it.section_id) secSet.add(it.section_id); }));
  const sections = [...secSet].sort();

  // Section filter chips
  const secIcons = { cake:'🎂', sauce:'🍶', tart:'🥧', bread:'🍞', bakery:'🍞' };
  const sectionFilterHtml = sections.length > 0 ? `<div class="filter-bar" style="padding:4px 16px 8px">
    <div class="filter-chip ${S.bcPrintSections.length===0?'active':''}" onclick="S.bcPrintSections=[];renderBcPrint()">ทั้งหมด</div>
    ${sections.map(sec => {
      const isActive = S.bcPrintSections.length > 0 && S.bcPrintSections.includes(sec);
      return `<div class="filter-chip ${isActive?'active':''}" onclick="setPrintSection('${sec}')">${secIcons[sec]||'📦'} ${sec}</div>`;
    }).join('')}
  </div>` : '';

  // Tabs — use 'active' class (not 'bc-active')
  document.getElementById('bcPrintTabs').innerHTML = `
    <div class="filter-chip ${S.bcPrintTab==='production'?'active':''}" onclick="S.bcPrintTab='production';renderBcPrint()">📄 Production Sheet</div>
    <div class="filter-chip ${S.bcPrintTab==='slip'?'active':''}" onclick="S.bcPrintTab='slip';renderBcPrint()">🧾 Delivery Slip</div>`;

  // Insert section filter into dedicated container
  const secFilterEl = document.getElementById('bcPrintSectionFilter');
  if (secFilterEl) secFilterEl.innerHTML = sectionFilterHtml;

  if (S.bcPrintTab === 'production') renderProductionSheet();
  else renderDeliverySlip();
}

function setPrintSection(sec) {
  if (!S.bcPrintSections) S.bcPrintSections = [];
  const idx = S.bcPrintSections.indexOf(sec);
  if (idx >= 0) S.bcPrintSections.splice(idx, 1); else S.bcPrintSections.push(sec);
  renderBcPrint();
}

// ─── B8: PRODUCTION SHEET ───
function renderProductionSheet() {
  const scope = S.deptMapping ? S.deptMapping.section_scope : [];
  const orders = filterOrdersByDateAndScope(S.bcPrintDate, scope);

  // Collect all items — filter by scope + section checkboxes
  const allItems = [];
  orders.forEach(o => {
    (o.items || []).forEach(it => {
      if (scope.length > 0 && !scope.includes(it.section_id)) return;
      if (S.bcPrintSections.length > 0 && !S.bcPrintSections.includes(it.section_id)) return;
      allItems.push({ ...it, store_id: o.store_id, order_id: o.order_id, dept_id: o.dept_id, header_note: o.header_note, display_name: o.display_name });
    });
  });

  if (!allItems.length) {
    document.getElementById('bcPrintContent').innerHTML = `<div class="empty">
      <div class="empty-icon">📄</div>
      <div class="empty-title">ไม่มีข้อมูล</div>
      <div class="empty-desc">ไม่มีออเดอร์สำหรับ ${formatDateThai(S.bcPrintDate)}</div>
      <div style="display:flex;gap:8px;margin-top:12px;justify-content:center">
        <button class="btn btn-outline btn-sm" onclick="S.bcPrintDate=todaySydney();renderBcPrint()">📅 ดูวันนี้</button>
        <button class="btn btn-outline btn-sm" onclick="renderBcPrint()">🔄 โหลดใหม่</button>
      </div>
    </div>`;
    return;
  }

  // Always show stores that have orders (dynamic from DB)
  const activeChannelStores = new Set((S.orderingChannels||[]).filter(ch => ch.is_active).map(ch => ch.store_id));
  const allStores = (S.stores||[]).filter(s => !['BC'].includes(s.store_id) && activeChannelStores.has(s.store_id)).map(s => s.store_id);
  const prodSet = new Set();
  allItems.forEach(it => { prodSet.add(it.product_name); });
  const products = [...prodSet].sort();

  // Build pivot: {product: {store: {qty, urgent}}}
  const pivot = {};
  const itemNotes = []; // item-level notes: [{idx, product, store, text}]
  const orderNotes = []; // order-level notes: [{order_id, store, dept, text}]
  const seenOrderNotes = new Set();
  let noteIdx = 0;

  products.forEach(p => { pivot[p] = { total:0, urgent:false, stores:{} }; });

  allItems.forEach(it => {
    const row = pivot[it.product_name];
    if (!row.stores[it.store_id]) row.stores[it.store_id] = { qty:0, urgent:false, noteIdx:[] };
    const cell = row.stores[it.store_id];
    cell.qty += it.qty_ordered;
    row.total += it.qty_ordered;
    if (it.is_urgent) { cell.urgent = true; row.urgent = true; }
    // Item note
    if (it.item_note) {
      noteIdx++;
      cell.noteIdx.push(noteIdx);
      itemNotes.push({ idx: noteIdx, product: it.product_name, store: it.store_id, text: it.item_note });
    }
    // Order note (collect once per order)
    if (it.header_note && !seenOrderNotes.has(it.order_id)) {
      seenOrderNotes.add(it.order_id);
      orderNotes.push({ order_id: it.order_id, store: it.store_id, dept: it.dept_id, name: it.display_name || '', text: it.header_note });
    }
  });

  // Unique order IDs
  const orderIds = [...new Set(allItems.map(it => it.order_id))].sort();

  // Render
  const sectionTitle = S.bcPrintSections.length > 0 ? S.bcPrintSections.map(s => s.toUpperCase()).join(' + ') : (scope.length ? scope.map(s => s.toUpperCase()).join(' + ') : 'ALL');
  const nowFull = new Date().toLocaleString('en-GB', { timeZone:'Australia/Sydney', day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' });

  let html = `<div class="print-area">
    <div style="text-align:center;margin-bottom:10px">
      <div class="print-only" style="display:none;font-size:13px;color:#888;text-align:right">สั่งของเบเกอรี่ — Siam Palette Group</div>
      <div style="font-size:14px;font-weight:700">PRODUCTION SHEET — ${sectionTitle}</div>
      <div style="font-size:13px;color:#888">Delivery: ${formatDateThai(S.bcPrintDate)} | Printed: ${nowFull}</div>
      <div style="font-size:12px;color:var(--t3);margin-top:2px">Orders: ${orderIds.join(', ')}</div>
    </div>
    <table class="ptbl">
      <thead><tr><th style="text-align:left">Product</th><th>Total</th>${allStores.map(s => `<th>${s}</th>`).join('')}</tr></thead><tbody>`;

  products.forEach(p => {
    const row = pivot[p];
    html += `<tr class="${row.urgent ? 'urg' : ''}">
      <td style="text-align:left"><strong>${p}</strong></td>
      <td><strong>${row.total}</strong></td>`;
    allStores.forEach(s => {
      const cell = row.stores[s];
      if (!cell || cell.qty === 0) { html += '<td style="color:#ccc">—</td>'; return; }
      let v = String(cell.qty);
      if (cell.urgent) v += '*';
      if (cell.noteIdx.length) v += `<sup>${cell.noteIdx.join(',')}</sup>`;
      html += `<td>${v}</td>`;
    });
    html += '</tr>';
  });

  html += '</tbody></table>';

  // Footnotes section
  const hasNotes = itemNotes.length > 0 || orderNotes.length > 0;
  if (hasNotes) {
    html += `<div style="margin-top:8px;font-size:13px;color:#555;border-top:1px dashed #ddd;padding-top:6px">`;
    html += `<div>* = URGENT ⚡</div>`;
    // Item notes
    if (itemNotes.length) {
      html += `<div style="margin-top:4px;font-weight:600">Item Notes:</div>`;
      itemNotes.forEach(n => {
        html += `<div>(${n.idx}) ${n.store} — ${n.product}: ${n.text}</div>`;
      });
    }
    // Order notes
    if (orderNotes.length) {
      html += `<div style="margin-top:4px;font-weight:600">Order Notes:</div>`;
      orderNotes.forEach(n => {
        html += `<div>${n.order_id} | ${n.store}/${n.dept}${n.name ? ' — '+n.name : ''}: ${n.text}</div>`;
      });
    }
    html += `</div>`;
  }

  html += '</div>';
  html += `<div style="text-align:center;padding:12px" class="no-print">
    <button class="btn btn-primary" onclick="window.print()" style="font-size:14px;padding:10px 24px">🖨️ พิมพ์ Production Sheet</button>
  </div>`;

  document.getElementById('bcPrintContent').innerHTML = html;
}

// ─── B9: DELIVERY SLIP ───
function renderDeliverySlip() {
  const scope = S.deptMapping ? S.deptMapping.section_scope : [];
  const orders = filterOrdersByDateAndScope(S.bcPrintDate, scope);

  // Get unique stores
  const storeSet = new Set();
  orders.forEach(o => storeSet.add(o.store_id));
  const storeList = [...storeSet].sort((a,b) => getStoreName(a).localeCompare(getStoreName(b)));

  if (!storeList.length) {
    document.getElementById('bcPrintContent').innerHTML = '<div class="empty"><div class="empty-icon">🧾</div><div class="empty-title">ไม่มีข้อมูล</div><div class="empty-desc">ไม่มีออเดอร์สำหรับวันที่เลือก</div></div>';
    return;
  }

  // Default to first store
  if (!S.bcPrintStore || !storeSet.has(S.bcPrintStore)) S.bcPrintStore = storeList[0];

  // Store selector
  let html = `<div style="padding:0 16px 8px">
    <select class="form-input" style="font-size:12px" onchange="S.bcPrintStore=this.value;renderDeliverySlip()">
      ${storeList.map(s => `<option value="${s}" ${s===S.bcPrintStore?'selected':''}>${getStoreName(s)} (${s})</option>`).join('')}
    </select>
  </div>`;

  // Filter orders for selected store
  const storeOrders = orders.filter(o => o.store_id === S.bcPrintStore);
  const orderIds = storeOrders.map(o => o.order_id).sort();

  // Collect notes (2 types)
  const itemNotes = []; // {idx, product, text}
  const orderNotes = []; // {order_id, dept, name, text}
  const seenOrderNotes = new Set();
  let noteIdx = 0;

  // Group by section → dept → orderer
  const bySection = {};
  storeOrders.forEach(o => {
    (o.items || []).forEach(it => {
      if (scope.length > 0 && !scope.includes(it.section_id)) return;
      if (S.bcPrintSections.length > 0 && !S.bcPrintSections.includes(it.section_id)) return;
      const sec = it.section_id || 'other';
      if (!bySection[sec]) bySection[sec] = {};
      const deptKey = `${getDeptName(o.dept_id)} (${o.display_name || o.user_id})`;
      if (!bySection[sec][deptKey]) bySection[sec][deptKey] = [];

      let itemNoteIdx = [];
      if (it.item_note) {
        noteIdx++;
        itemNoteIdx.push(noteIdx);
        itemNotes.push({ idx: noteIdx, product: it.product_name, text: it.item_note });
      }

      // Order note (once per order)
      if (o.header_note && !seenOrderNotes.has(o.order_id)) {
        seenOrderNotes.add(o.order_id);
        orderNotes.push({ order_id: o.order_id, dept: o.dept_id, name: o.display_name || '', text: o.header_note });
      }

      bySection[sec][deptKey].push({ ...it, itemNoteIdx, order_id: o.order_id, _orderStatus: o.status });
    });
  });

  const now = new Date().toLocaleString('en-GB', { timeZone:'Australia/Sydney', day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' });
  const sectionIcons = { cake:'🎂', sauce:'🫕', tart:'🥧', bread:'🍞', bakery:'🍞', other:'📦' };

  html += `<div class="slip-wrap">
    <div class="slip-hd">
      <div style="font-size:16px;font-weight:700">${getStoreName(S.bcPrintStore)}</div>
      <div style="font-size:12px;color:#888">Delivery: ${formatDateThai(S.bcPrintDate)} | Printed: ${now}</div>
      <div style="font-size:11px;color:#aaa;margin-top:2px">Orders: ${orderIds.join(', ')}</div>
    </div>`;

  // Render sections
  Object.keys(bySection).sort().forEach(sec => {
    html += `<div class="slip-sec">═══ ${sectionIcons[sec]||'📦'} ${sec.toUpperCase()} ═══</div>`;
    const depts = bySection[sec];
    Object.keys(depts).sort().forEach(dept => {
      html += `<div class="slip-dept">--- ${dept} ---</div>`;
      depts[dept].forEach(it => {
        const urgent = it.is_urgent ? '⭐ ' : '';
        const noteRef = it.itemNoteIdx.length ? `<sup>${it.itemNoteIdx.join(',')}</sup>` : '';
        const nameStr = `${urgent}<strong>${it.product_name}</strong>${noteRef}`;
        let qtyStr;
        if (it._orderStatus === 'Cancelled') qtyStr = `${it.qty_ordered} → <strong style="color:#dc2626">X</strong>`;
        else if (it.fulfilment_status === 'full') qtyStr = `${it.qty_ordered} → <strong>${it.qty_sent} ✓</strong>`;
        else if (it.fulfilment_status === 'partial') qtyStr = `${it.qty_ordered} → <strong style="color:#dc2626">${it.qty_sent} ✗</strong>`;
        else qtyStr = `${it.qty_ordered} → ___`;
        html += `<div class="slip-row"><span>${nameStr}</span><span>${qtyStr}</span></div>`;
      });
    });
  });

  // Footnotes
  const hasNotes = itemNotes.length > 0 || orderNotes.length > 0;
  if (hasNotes) {
    html += `<div style="margin:8px 0;border-top:1px dashed #ccc;padding-top:4px;font-size:12px;color:#555">`;
    if (itemNotes.length) {
      html += `<div style="font-weight:600">Item Notes:</div>`;
      itemNotes.forEach(n => { html += `<div>(${n.idx}) ${n.product}: ${n.text}</div>`; });
    }
    if (orderNotes.length) {
      html += `<div style="font-weight:600;margin-top:2px">Order Notes:</div>`;
      orderNotes.forEach(n => { html += `<div>${n.order_id} | ${n.dept}${n.name ? ' — '+n.name : ''}: ${n.text}</div>`; });
    }
    html += `</div>`;
  }

  html += `<div class="slip-foot">
    Packed by: ____________<br>
    Checked by: ___________<br>
    <div style="font-size:12px;color:#aaa;margin-top:4px;text-align:center">Printed: ${now}</div>
  </div></div>`;
  html += `<div style="text-align:center;padding:12px" class="no-print">
    <button class="btn btn-primary" onclick="printSlip80()" style="font-size:14px;padding:10px 24px">🖨️ พิมพ์ Delivery Slip (80mm Thermal)</button>
  </div>`;

  document.getElementById('bcPrintContent').innerHTML = html;
}

