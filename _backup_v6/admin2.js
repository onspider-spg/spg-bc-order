// Version 6.5.5 | 6 MAR 2026 | Siam Palette Group
// BC Order — admin2.js: Dashboards, Announcements, BC Orders, Manage Products

// ─── B-04: WASTE DASHBOARD ──────────────────────────────────
async function renderAdminWasteDashboard() {
  const el = document.getElementById('adminWasteDbContent');
  el.innerHTML = '<div style="text-align:center;padding:40px"><div class="spinner"></div></div>';
  
  if (!S.wasteDashDays) S.wasteDashDays = 30;
  
  try {
    const resp = await api('get_waste_dashboard', null, { days: String(S.wasteDashDays) });
    if (!resp.success) { el.innerHTML = '<div class="pad" style="color:var(--red)">❌ ' + (resp.message || resp.error) + '</div>'; return; }
    
    const d = resp.data;
    const sm = d.summary;
    const reasonColors = { Expired:'#ef4444', Damaged:'#f97316', Return:'#8b5cf6', Other:'#6b7280' };
    const reasonLabels = { Expired:'หมดอายุ', Damaged:'เสียหาย', Return:'จาก Return' };
    
    // Period selector
    let html = `
      <div class="filter-bar">
        <div class="filter-chip ${S.wasteDashDays===7?'active':''}" onclick="S.wasteDashDays=7;renderAdminWasteDashboard()">7 วัน</div>
        <div class="filter-chip ${S.wasteDashDays===14?'active':''}" onclick="S.wasteDashDays=14;renderAdminWasteDashboard()">14 วัน</div>
        <div class="filter-chip ${S.wasteDashDays===30?'active':''}" onclick="S.wasteDashDays=30;renderAdminWasteDashboard()">30 วัน</div>
      </div>`;
    
    // Summary cards
    html += `
      <div class="sec-hd">📊 สรุปภาพรวม (${S.wasteDashDays} วัน)</div>
      <div class="sum-grid">
        <div class="sum-card" style="border-left:3px solid var(--red)">
          <div class="sum-val" style="color:var(--red)">${sm.today_qty}</div>
          <div class="sum-lbl">ทิ้งวันนี้</div>
          <div style="font-size:9px;color:var(--td)">${sm.today_records} รายการ</div>
        </div>
        <div class="sum-card" style="border-left:3px solid var(--orange)">
          <div class="sum-val" style="color:var(--orange)">${sm.week_qty}</div>
          <div class="sum-lbl">7 วันล่าสุด</div>
          <div style="font-size:9px;color:var(--td)">${sm.week_records} รายการ</div>
        </div>
        <div class="sum-card" style="border-left:3px solid var(--blue)">
          <div class="sum-val">${sm.total_qty}</div>
          <div class="sum-lbl">ทั้งหมด ${S.wasteDashDays} วัน</div>
          <div style="font-size:9px;color:var(--td)">${sm.total_records} รายการ</div>
        </div>
        <div class="sum-card" style="border-left:3px solid var(--gold)">
          <div class="sum-val">${sm.total_records > 0 ? Math.round(sm.total_qty / S.wasteDashDays) : 0}</div>
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
          <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px">
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
          <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px">
            <span>${medal} <strong>${p.name}</strong> <span style="color:var(--td);font-size:9px">${p.section}</span></span>
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
              <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px">
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
    const recentTrend = trend.slice(-Math.min(S.wasteDashDays, 14));
    html += `<div class="sec-hd">📈 แนวโน้มรายวัน</div>
      <div class="pad" style="padding-top:0;overflow-x:auto">
        <div style="display:flex;align-items:flex-end;gap:3px;height:120px;min-width:${recentTrend.length * 24}px">`;
    recentTrend.forEach(t => {
      const h = t.qty > 0 ? Math.max(Math.round((t.qty / maxDay) * 100), 4) : 0;
      const isToday = t.date === todaySydney();
      const dayLabel = t.date.slice(8);
      html += `
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;min-width:20px">
          <div style="font-size:8px;color:var(--td);margin-bottom:2px">${t.qty || ''}</div>
          <div style="width:100%;max-width:24px;height:${h}px;background:${isToday ? 'var(--red)' : 'var(--blue)'};border-radius:3px 3px 0 0;transition:height 0.5s"></div>
          <div style="font-size:7px;color:var(--td);margin-top:2px;${isToday?'font-weight:700;color:var(--red)':''}">${dayLabel}</div>
        </div>`;
    });
    html += `</div>
      <div style="font-size:8px;color:var(--td);text-align:center;margin-top:6px">← เก่ากว่า · ล่าสุด →</div>
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
  
  if (!S.topProdDays) S.topProdDays = 30;
  if (!S.topProdStore) S.topProdStore = 'ALL';
  
  try {
    const qp = { days: String(S.topProdDays) };
    if (S.topProdStore !== 'ALL') qp.store = S.topProdStore;
    const resp = await api('get_top_products', null, qp);
    if (!resp.success) { el.innerHTML = '<div class="pad" style="color:var(--red)">❌ ' + (resp.message || resp.error) + '</div>'; return; }
    
    const d = resp.data;
    const sectionIcons = { cake:'🎂', sauce:'🫕', baked:'🍞', other:'📦' };
    const sectionColors = { cake:'#f59e0b', sauce:'#8b5cf6', baked:'#f97316', other:'#6b7280' };
    
    // Period selector
    let html = `
      <div class="filter-bar">
        <div class="filter-chip ${S.topProdDays===7?'active':''}" onclick="S.topProdDays=7;renderAdminTopProducts()">7 วัน</div>
        <div class="filter-chip ${S.topProdDays===14?'active':''}" onclick="S.topProdDays=14;renderAdminTopProducts()">14 วัน</div>
        <div class="filter-chip ${S.topProdDays===30?'active':''}" onclick="S.topProdDays=30;renderAdminTopProducts()">30 วัน</div>
      </div>
      ${S.role === 'bc' ? `<div class="filter-bar" style="margin-top:0">
        <div class="filter-chip ${S.topProdStore==='ALL'?'active':''}" onclick="S.topProdStore='ALL';renderAdminTopProducts()">ทุกร้าน</div>
        <div class="filter-chip ${S.topProdStore==='MNG'?'active':''}" onclick="S.topProdStore='MNG';renderAdminTopProducts()">MNG</div>
        <div class="filter-chip ${S.topProdStore==='ISH'?'active':''}" onclick="S.topProdStore='ISH';renderAdminTopProducts()">ISH</div>
        <div class="filter-chip ${S.topProdStore==='GB'?'active':''}" onclick="S.topProdStore='GB';renderAdminTopProducts()">GB</div>
        <div class="filter-chip ${S.topProdStore==='TMC'?'active':''}" onclick="S.topProdStore='TMC';renderAdminTopProducts()">TMC</div>
      </div>` : ''}`;
    
    // Summary cards
    html += `
      <div class="sec-hd">📊 สรุปภาพรวม (${S.topProdDays} วัน)</div>
      <div class="sum-grid">
        <div class="sum-card" style="border-left:3px solid var(--blue)">
          <div class="sum-val" style="color:var(--blue)">${d.total_orders}</div>
          <div class="sum-lbl">ออเดอร์ทั้งหมด</div>
        </div>
        <div class="sum-card" style="border-left:3px solid var(--green)">
          <div class="sum-val" style="color:var(--green)">${d.total_qty}</div>
          <div class="sum-lbl">จำนวนสั่งรวม</div>
        </div>
        <div class="sum-card" style="border-left:3px solid var(--gold)">
          <div class="sum-val">${d.products.length}</div>
          <div class="sum-lbl">สินค้าที่มีการสั่ง</div>
        </div>
        <div class="sum-card" style="border-left:3px solid var(--orange)">
          <div class="sum-val">${d.total_orders > 0 ? Math.round(d.total_qty / d.total_orders) : 0}</div>
          <div class="sum-lbl">เฉลี่ย/ออเดอร์</div>
        </div>
      </div>`;
    
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
        const secColor = sectionColors[p.section] || '#6b7280';
        const fulfilPct = p.qty_ordered > 0 ? Math.round((p.qty_sent / p.qty_ordered) * 100) : 0;
        html += `
          <div style="margin-bottom:12px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
              <span style="font-size:12px">${medal} <strong>${p.name}</strong></span>
              <span style="font-size:11px;color:var(--green);font-weight:600">${p.qty_ordered} ${p.unit}</span>
            </div>
            <div style="background:var(--s2);border-radius:4px;height:14px;overflow:hidden;margin-bottom:3px">
              <div style="background:${secColor};height:100%;width:${pct}%;border-radius:4px;transition:width 0.5s"></div>
            </div>
            <div style="display:flex;gap:8px;font-size:9px;color:var(--td)">
              <span>${secIcon} ${p.section}</span>
              <span>📋 ${p.order_count} orders</span>
              <span>🏪 ${p.store_count} stores</span>
              <span>📤 ส่ง ${fulfilPct}%</span>
              ${p.urgent_count > 0 ? `<span style="color:var(--red)">⚡ ${p.urgent_count} urgent</span>` : ''}
            </div>
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
              <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px">
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
              <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px">
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
      const recentTrend = trend.slice(-Math.min(S.topProdDays, 14));
      html += `<div class="sec-hd">📈 แนวโน้มการสั่งรายวัน</div>
        <div class="pad" style="padding-top:0;overflow-x:auto">
          <div style="display:flex;align-items:flex-end;gap:3px;height:120px;min-width:${recentTrend.length * 24}px">`;
      recentTrend.forEach(t => {
        const h = t.qty > 0 ? Math.max(Math.round((t.qty / maxDay) * 100), 4) : 0;
        const isToday = t.date === todaySydney();
        const dayLabel = t.date.slice(8);
        html += `
          <div style="flex:1;display:flex;flex-direction:column;align-items:center;min-width:20px">
            <div style="font-size:8px;color:var(--td);margin-bottom:2px">${t.qty || ''}</div>
            <div style="width:100%;max-width:24px;height:${h}px;background:${isToday ? 'var(--green)' : 'var(--blue)'};border-radius:3px 3px 0 0;transition:height 0.5s"></div>
            <div style="font-size:7px;color:var(--td);margin-top:2px;${isToday?'font-weight:700;color:var(--green)':''}">${dayLabel}</div>
          </div>`;
      });
      html += `</div>
        <div style="font-size:8px;color:var(--td);text-align:center;margin-top:6px">← เก่ากว่า · ล่าสุด →</div>
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
    
    let html = `
      <div class="pad">
        <button class="btn btn-gold" style="width:100%" onclick="showAnnouncementForm()">➕ สร้างประกาศใหม่</button>
      </div>`;
    
    // Active
    html += `<div class="sec-hd">📢 กำลังแสดง (${active.length})</div>`;
    if (active.length === 0) {
      html += '<div style="text-align:center;padding:16px;color:var(--td);font-size:12px">ไม่มีประกาศที่แสดงอยู่</div>';
    } else {
      html += '<div class="pad" style="padding-top:0">';
      active.forEach(n => { html += renderAnnouncementCard(n, 'active'); });
      html += '</div>';
    }
    
    // Scheduled
    if (scheduled.length > 0) {
      html += `<div class="sec-hd">⏰ ตั้งเวลาไว้ (${scheduled.length})</div><div class="pad" style="padding-top:0">`;
      scheduled.forEach(n => { html += renderAnnouncementCard(n, 'scheduled'); });
      html += '</div>';
    }
    
    // Expired / Inactive
    if (expired.length > 0) {
      html += `<div class="sec-hd">🔇 หมดอายุ / ปิดแล้ว (${expired.length})</div><div class="pad" style="padding-top:0">`;
      expired.forEach(n => { html += renderAnnouncementCard(n, 'expired'); });
      html += '</div>';
    }
    
    el.innerHTML = html;
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
            <div style="font-size:11px;color:var(--td);margin-top:2px">${n.message}</div>
          </div>
          <div style="display:flex;gap:6px;flex-shrink:0">
            <div style="font-size:18px;cursor:pointer" onclick="showAnnouncementForm('${n.notif_id}')" title="แก้ไข">✏️</div>
            <div style="font-size:18px;cursor:pointer" onclick="toggleAnnouncement('${n.notif_id}', ${!n.is_active})" title="${n.is_active ? 'ปิด' : 'เปิด'}">${n.is_active ? '🔇' : '🔔'}</div>
            <div style="font-size:18px;cursor:pointer" onclick="deleteAnnouncement('${n.notif_id}')" title="ลบ">🗑️</div>
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;font-size:9px;color:var(--td)">
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
  // Smart default: today if has orders, else tomorrow, else all
  if (!S.bcDateFilter) {
    const today = todaySydney();
    const tmr = tomorrowSydney();
    const scope = S.deptMapping ? S.deptMapping.section_scope : [];
    const todayN = filterOrdersByDateAndScope(today, scope).length;
    const tmrN = filterOrdersByDateAndScope(tmr, scope).length;
    S.bcDateFilter = todayN > 0 ? today : tmrN > 0 ? tmr : (S.orders.length > 0 ? 'all' : today);
  }
  
  const scope = S.deptMapping ? S.deptMapping.section_scope : [];
  
  document.getElementById('bcDateInput').value = S.bcDateFilter === 'all' ? '' : S.bcDateFilter;
  document.getElementById('bcOrderSub').textContent = getScopeLabel();
  renderBcOrderFilters();
  renderBcOrderList();
}

function renderBcOrderFilters() {
  // Count orders by status for this date
  const scope = S.deptMapping ? S.deptMapping.section_scope : [];
  const dated = filterOrdersByDateAndScope(S.bcDateFilter, scope);
  const counts = { all:dated.length, Pending:0, Ordered:0, InProgress:0, Fulfilled:0, Delivered:0 };
  dated.forEach(o => { if (counts[o.status] !== undefined) counts[o.status]++; });

  const chips = [
    { key:'all', label:`ทั้งหมด (${counts.all})`, color:'' },
    { key:'Pending', label:`Pending (${counts.Pending})`, color:'var(--red)' },
    { key:'Ordered', label:`Ordered (${counts.Ordered})`, color:'var(--blue)' },
    { key:'InProgress', label:`In Prog (${counts.InProgress})`, color:'var(--orange)' },
    { key:'Fulfilled', label:`Done (${counts.Fulfilled + counts.Delivered})`, color:'var(--green)' },
  ];

  document.getElementById('bcOrderFilters').innerHTML = chips.map(c =>
    `<div class="filter-chip ${S.bcStatusFilter===c.key?'bc-active':''}" onclick="S.bcStatusFilter='${c.key}';renderBcOrderList()">${c.label}</div>`
  ).join('');
}

function setBcDate(mode) {
  if (mode === 'today') S.bcDateFilter = todaySydney();
  else if (mode === 'tomorrow') S.bcDateFilter = tomorrowSydney();
  else S.bcDateFilter = 'all';
  document.getElementById('bcDateInput').value = S.bcDateFilter === 'all' ? '' : S.bcDateFilter;
  renderBcOrderFilters();
  renderBcOrderList();
}

function filterOrdersByDateAndScope(date, scope) {
  let orders = date === 'all' ? [...S.orders] : S.orders.filter(o => o.delivery_date === date);
  // BC section_scope filter: only show orders that have items in our scope
  if (scope && scope.length > 0) {
    orders = orders.filter(o => {
      // B-02 fix: if items not loaded yet (undefined or null), keep the order visible
      if (!o.items) return true;
      if (o.items.length === 0) return true;  // items loaded but empty → still show
      return o.items.some(it => scope.includes(it.section_id));
    });
  }
  return orders;
}

function renderBcOrderList() {
  const scope = S.deptMapping ? S.deptMapping.section_scope : [];
  let orders = filterOrdersByDateAndScope(S.bcDateFilter, scope);

  // Status filter
  if (S.bcStatusFilter !== 'all') {
    if (S.bcStatusFilter === 'Fulfilled') {
      orders = orders.filter(o => o.status === 'Fulfilled' || o.status === 'Delivered');
    } else {
      orders = orders.filter(o => o.status === S.bcStatusFilter);
    }
  }

  const el = document.getElementById('bcOrderList');
  if (!orders.length) {
    const totalLoaded = S.orders ? S.orders.length : 0;
    el.innerHTML = `<div class="empty">
      <div class="empty-icon">📋</div>
      <div class="empty-title">ไม่มีออเดอร์</div>
      <div class="empty-desc">ไม่พบออเดอร์สำหรับ${S.bcDateFilter === 'all' ? 'ช่วงนี้' : 'วันที่ ' + formatDateThai(S.bcDateFilter)}</div>
      ${totalLoaded > 0 && S.bcDateFilter !== 'all' ? `<div style="margin-top:12px"><button class="btn btn-outline btn-sm" onclick="S.bcDateFilter='all';document.getElementById('bcDateInput').value='';renderBcOrderFilters();renderBcOrderList()">📋 ดูทั้งหมด (${totalLoaded} orders)</button></div>` : ''}
      <div style="margin-top:8px"><button class="btn btn-outline btn-sm" onclick="renderBcOrders()">🔄 โหลดใหม่</button></div>
    </div>`;
    return;
  }

  // Group by store
  const byStore = {};
  orders.forEach(o => { if (!byStore[o.store_id]) byStore[o.store_id] = []; byStore[o.store_id].push(o); });

  let html = '';
  Object.keys(byStore).sort().forEach(sid => {
    html += `<div class="ord-store-hd">🏪 ${getStoreName(sid)} (${sid})</div>`;
    byStore[sid].forEach(o => {
      const bdr = 'bdr-' + o.status.toLowerCase().replace('inprogress','progress');
      // Filter items by section_scope for display
      let items = o.items || [];
      if (scope.length > 0) items = items.filter(it => scope.includes(it.section_id));

      // Tap → Pending goes to accept, Ordered/InProgress to fulfilment, Done to detail
      let tapAction;
      if (o.status === 'Pending') tapAction = `showBcAccept('${o.order_id}')`;
      else if (o.status === 'Ordered' || o.status === 'InProgress') tapAction = `showBcFulfil('${o.order_id}')`;
      else tapAction = `viewOrderDetail('${o.order_id}')`;

      html += `<div class="ord-card" onclick="${tapAction}">
        <div class="ord-left ${bdr}">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div>
              <div style="font-size:11px;font-weight:600">${getDeptName(o.dept_id)} — ${o.display_name || o.user_id}</div>
              <div style="font-size:9px;color:var(--td)">${o.order_id}</div>
            </div>
            <span class="status ${statusClass(o.status)}">${o.status === 'InProgress' ? 'In Progress' : o.status}</span>
          </div>
          ${o.header_note ? `<div style="font-size:9px;color:var(--cyan);margin-top:3px">📝 ${o.header_note}</div>` : ''}
          ${o.is_cutoff_violation ? '<div class="tag tag-orange" style="margin-top:3px;font-size:9px">⚠️ Cutoff violation</div>' : ''}
          ${items.length ? `<div style="margin-top:6px;border-top:1px solid var(--b1);padding-top:6px">` +
            items.map(it =>
              `<div style="display:flex;justify-content:space-between;font-size:11px;padding:1px 0">
                <span>${it.product_name}${it.is_urgent ? ' <span style="color:var(--red)">⚡</span>' : ''}</span>
                <span style="font-weight:700">×${it.qty_ordered}</span>
              </div>` +
              (it.note ? `<div style="font-size:9px;color:var(--cyan);padding-left:4px">📝 ${it.note}</div>` : '')
            ).join('') + `</div>` : ''}
        </div>
      </div>`;
    });
  });
  el.innerHTML = html;

  // Also update filter counts
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
    viewOrderDetail(orderId);
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
  el.innerHTML = `<div class="pad">
    <div style="padding:10px 14px;background:var(--red-bg);border-radius:8px;font-size:11px;color:var(--red);margin-bottom:14px">
      ⚠️ ออเดอร์นี้สั่งหลัง 5AM <strong>(${orderTime})</strong> สำหรับส่งวันนี้<br>กรุณา Accept หรือ Reject
    </div>

    <div class="card" style="border-left:3px solid var(--red)">
      <div style="font-size:14px;font-weight:700">${o.order_id}</div>
      <div style="font-size:11px;color:var(--td);margin-top:4px">
        ${getStoreName(o.store_id)}-${getDeptName(o.dept_id)} · ${o.display_name || o.user_id}
      </div>
      <div style="font-size:10px;color:var(--td);margin-top:2px">
        สั่ง: ${orderTime} · ส่ง: ${formatDateThai(o.delivery_date)}
      </div>
      ${o.header_note ? `<div style="font-size:10px;color:var(--cyan);margin-top:4px">📝 ${o.header_note}</div>` : ''}

      ${items.length ? `<div style="margin-top:8px;border-top:1px solid var(--b1);padding-top:8px">` +
        items.map(it =>
          `<div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0">
            <span>${prodEmoji(it.product_name)} ${it.product_name}${it.is_urgent ? ' <span style="color:var(--red)">⚡</span>' : ''}</span>
            <span style="font-weight:700">×${it.qty_ordered}</span>
          </div>` +
          (it.note ? `<div style="font-size:9px;color:var(--cyan);padding-left:24px">📝 ${it.note}</div>` : '')
        ).join('') + `</div>` : ''}
    </div>

    <div style="margin-top:16px;display:flex;flex-direction:column;gap:8px">
      <button class="btn btn-green" id="btnAccept" onclick="acceptPending('${o.order_id}')">✅ Accept — รับออเดอร์</button>
      <button class="btn btn-outline" style="color:var(--red)" onclick="rejectPending('${o.order_id}')">❌ Reject — ปฏิเสธ</button>
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
    toast('✅ Accept เรียบร้อย (Demo)', 'success');
  }

  // Update local state
  const o = S.orders.find(x => x.order_id === id);
  if (o) o.status = 'Ordered';

  setTimeout(() => showScreen('bc-orders'), 800);
}

async function rejectPending(id) {
  if (!confirm('ปฏิเสธออเดอร์ ' + id + ' ?\n\nร้านจะต้องสั่งใหม่')) return;

  try {
    const r = await api('delete_order', { order_id: id });
    toast(r.message || '❌ ปฏิเสธแล้ว', r.success ? 'warning' : 'error');
  } catch (e) {
    toast('❌ ปฏิเสธแล้ว (Demo)', 'warning');
  }

  // Remove from local state
  S.orders = S.orders.filter(o => o.order_id !== id);

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

  let html = `<div class="pad" style="padding-bottom:8px">
    <div style="font-size:12px;font-weight:600">${getStoreName(o.store_id)}-${getDeptName(o.dept_id)} · ${o.display_name || o.user_id}</div>
    <div style="font-size:10px;color:var(--td)">${o.order_id} · ส่ง ${formatDateThai(o.delivery_date)}</div>
    ${o.header_note ? `<div style="font-size:10px;color:var(--cyan);margin-top:3px">📝 ${o.header_note}</div>` : ''}
    <div class="form-group" style="margin-top:10px;margin-bottom:0">
      <label class="form-label" style="color:var(--cyan)">ส่งโดย (Fulfilled by)</label>
      <select class="form-input" style="font-size:12px" onchange="S.fulfilmentBy=this.value">
        <option value="${S.session.user_id}">${S.session.display_name} (${S.session.dept_id})</option>
      </select>
    </div>
  </div>`;

  S.fulfilmentItems.forEach((item, i) => {
    const isFull = item.ful_status === 'full';
    const isPart = item.ful_status === 'partial';

    html += `<div class="ful-item" style="border-left:3px solid ${isFull ? 'var(--green)' : isPart ? 'var(--red)' : 'var(--b2)'}">
      <div class="ful-head">
        <div class="ful-info">
          <div style="font-size:13px;font-weight:600">${prodEmoji(item.product_name)} ${item.product_name}${item.is_urgent ? ' <span style="color:var(--red)">⚡</span>' : ''}</div>
          <div style="font-size:10px;color:var(--td)">สั่ง: ${item.qty_ordered} ${item.unit}</div>
          ${item.note ? `<div style="font-size:9px;color:var(--cyan)">📝 ${item.note}</div>` : ''}
        </div>
        <div class="ful-btns">
          <div class="ful-btn ${isFull ? 'sel-full' : ''}" onclick="setFulfilment(${i},'full')" title="ส่งครบ">✓</div>
          <div class="ful-btn ${isPart ? 'sel-part' : ''}" onclick="setFulfilment(${i},'partial')" title="ส่งไม่ครบ/ไม่ได้">✗</div>
        </div>
      </div>`;

    if (isFull) {
      html += `<div class="ful-ok">✅ ส่งครบ: ${item.qty_ordered} ${item.unit}</div>`;
    }
    if (isPart) {
      html += `<div class="ful-partial">
        <div class="form-group" style="margin-bottom:8px">
          <label class="form-label">จำนวนที่ส่งจริง *</label>
          <div class="qty-sel" style="justify-content:flex-start">
            <div class="qty-btn" onclick="fulQty(${i},-1)">−</div>
            <div class="qty-num" style="color:var(--red)">${item.qty_sent}</div>
            <div class="qty-btn" onclick="fulQty(${i},1)">+</div>
            <span style="font-size:10px;color:var(--td);margin-left:4px">/ ${item.qty_ordered} ${item.unit}</span>
          </div>
        </div>
        <div class="form-group" style="margin-bottom:0">
          <label class="form-label">เหตุผล *</label>
          <input class="form-input" style="border-color:var(--red);font-size:12px" value="${item.ful_note}" 
            oninput="S.fulfilmentItems[${i}].ful_note=this.value;const b=document.getElementById('btnFulfilSubmit');if(b)b.disabled=S.fulfilmentItems.some(x=>!x.ful_status)||S.fulfilmentItems.some(x=>x.ful_status==='partial'&&!x.ful_note)" placeholder="เช่น หมด flour ทำได้แค่ 2">
        </div>
      </div>`;
    }
    html += `</div>`;
  });

  // Submit area
  const canSubmit = done === total && total > 0;
  const partialMissingNote = S.fulfilmentItems.some(i => i.ful_status === 'partial' && !i.ful_note);

  html += `<div class="pad">
    <div style="font-size:10px;color:var(--td);margin-bottom:8px">อัพเดทแล้ว: ${done}/${total} items</div>
    <button class="btn btn-blue" id="btnFulfilSubmit" onclick="submitFulfilment()" 
      ${!canSubmit || partialMissingNote ? 'disabled' : ''}>
      💾 บันทึก
    </button>
    ${partialMissingNote ? '<div style="font-size:10px;color:var(--red);margin-top:6px;text-align:center">⚠️ กรุณากรอกเหตุผลสำหรับรายการที่ส่งไม่ครบ</div>' : ''}
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

async function submitFulfilment() {
  const btn = document.getElementById('btnFulfilSubmit');
  if (btn) btn.disabled = true;

  let allSuccess = true;
  for (const item of S.fulfilmentItems) {
    try {
      const r = await api('update_fulfilment', {
        item_id: item.item_id,
        fulfilment_status: item.ful_status,
        qty_sent: item.qty_sent,
        note: item.ful_note,
        fulfilled_by: S.fulfilmentBy,
      });
      if (r && !r.success) allSuccess = false;
    } catch (e) {
      // Demo mode: continue
    }
  }

  toast(allSuccess ? '✅ อัปเดตเรียบร้อย' : '⚠️ บางรายการมีปัญหา', allSuccess ? 'success' : 'warning');

  // Update local order status
  const allFull = S.fulfilmentItems.every(i => i.ful_status === 'full');
  const o = S.orders.find(x => x.order_id === S.currentOrder.order_id);
  if (o) o.status = allFull ? 'Fulfilled' : 'InProgress';

  setTimeout(() => showScreen('bc-orders'), 800);
}

// ─── B5: BC STOCK MANAGEMENT ────────────────────────────────
function renderBcStock() {
  const scope = S.deptMapping ? S.deptMapping.section_scope : [];
  document.getElementById('bcStockSub').textContent = getScopeLabel();

  // Load stock if empty
  if (!S.stock.length) {
    S.stock = S.products.filter(p => p.allow_stock).map(p => ({
      product_id: p.product_id, product_name: p.product_name,
      unit: p.unit, section_id: p.section_id,
      stock_actual: p.stock_available || 0, stock_available: p.stock_available || 0,
    }));
  }

  // Filter by scope
  let items = S.stock;
  if (scope.length > 0) items = items.filter(s => scope.includes(s.section_id));

  // Sort: low stock first
  items.sort((a, b) => a.stock_actual - b.stock_actual);

  // Product dropdown options
  const opts = items.map(p =>
    `<option value="${p.product_id}" ${p.product_id === S.bcStockProduct ? 'selected' : ''}>${prodEmoji(p.product_name)} ${p.product_name} (${p.stock_actual} ${p.unit})</option>`
  ).join('');

  const el = document.getElementById('bcStockContent');
  el.innerHTML = `
    <div class="pad" style="padding-bottom:8px">
      <div class="sec-hd" style="padding-left:0">สต็อกจริง (Actual)</div>
    </div>
    <div style="padding:0 16px 12px">
      ${items.map(s => {
        const color = s.stock_actual <= 5 ? 'var(--red)' : s.stock_actual <= 15 ? 'var(--orange)' : 'var(--t)';
        return `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--b1);font-size:12px">
          <span>${prodEmoji(s.product_name)} ${s.product_name}</span>
          <span style="font-weight:700;color:${color}">${s.stock_actual} ${s.unit}</span>
        </div>`;
      }).join('')}
    </div>

    <div class="pad" style="padding-top:4px">
      <div class="sec-hd" style="padding-left:0">เพิ่ม/ลด สต็อก</div>
      <div class="form-group">
        <label class="form-label">สินค้า</label>
        <select class="form-input" onchange="S.bcStockProduct=this.value;S.bcStockQty=1">
          <option value="">— เลือกสินค้า —</option>
          ${opts}
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">ประเภท</label>
        <div style="display:flex;gap:8px">
          <button class="btn ${S.bcStockAction==='add'?'btn-green':'btn-outline'}" style="flex:1;padding:8px" 
            onclick="S.bcStockAction='add';renderBcStock()">➕ เพิ่ม</button>
          <button class="btn ${S.bcStockAction==='remove'?'btn-red':'btn-outline'}" style="flex:1;padding:8px" 
            onclick="S.bcStockAction='remove';renderBcStock()">➖ ลด</button>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">จำนวน</label>
        <div class="qty-sel" style="justify-content:flex-start">
          <div class="qty-btn" onclick="bcStockQty(-1)">−</div>
          <div class="qty-num" style="color:${S.bcStockAction==='remove'?'var(--red)':'var(--green)'}">${S.bcStockQty}</div>
          <div class="qty-btn" onclick="bcStockQty(1)">+</div>
          <div class="qty-btn" onclick="bcStockQty(5)" style="font-size:11px;width:36px;border-radius:6px">+5</div>
          <div class="qty-btn" onclick="bcStockQty(10)" style="font-size:11px;width:36px;border-radius:6px">+10</div>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">หมายเหตุ</label>
        <input class="form-input" placeholder="เช่น Morning batch, นับสต็อก" 
          value="${S.bcStockNote}" onchange="S.bcStockNote=this.value">
      </div>

      <button class="btn ${S.bcStockAction==='add'?'btn-green':'btn-red'}" id="btnBcStock"
        onclick="submitBcStock()" ${!S.bcStockProduct||S.bcStockQty<1?'disabled':''}>
        💾 บันทึก ${S.bcStockAction==='add'?'เพิ่ม':'ลด'}สต็อก
      </button>
    </div>`;
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
    toast(`✅ ${S.bcStockAction==='add'?'เพิ่ม':'ลด'}สต็อกเรียบร้อย (Demo)`, 'success');
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
  document.getElementById('bcReturnSub').textContent = getScopeLabel();

  const scope = S.deptMapping ? S.deptMapping.section_scope : [];
  let items = S.returns || [];
  if (scope.length > 0) items = items.filter(r => scope.includes(r.section_id));

  // Counts
  const open = items.filter(r => r.status === 'Reported' || r.status === 'Received');
  const countOpen = open.length;
  const countAll = items.length;

  // Filter chips
  document.getElementById('bcReturnFilters').innerHTML = `
    <div class="filter-chip ${S.bcReturnFilter==='open'?'bc-active':''}" onclick="S.bcReturnFilter='open';renderBcReturns()">Open (${countOpen})</div>
    <div class="filter-chip ${S.bcReturnFilter==='all'?'bc-active':''}" onclick="S.bcReturnFilter='all';renderBcReturns()">ทั้งหมด (${countAll})</div>`;

  // Apply filter
  if (S.bcReturnFilter === 'open') items = open;

  // Sort newest first
  items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const el = document.getElementById('bcReturnList');
  if (!items.length) {
    el.innerHTML = '<div class="empty"><div class="empty-icon">↩️</div><div class="empty-title">ไม่มีสินค้าคืน</div><div class="empty-desc">ยังไม่มีรายการสำหรับ section นี้</div></div>';
    return;
  }

  el.innerHTML = items.map(r => {
    const borderColor = r.status === 'Returning' ? 'var(--red)' : r.status === 'Received' ? 'var(--blue)' : 'var(--green)';
    const statusTag = returnStatusTag(r.status);

    let actions = '';
    if (r.status === 'Reported') {
      actions = `<div style="display:flex;gap:6px;margin-top:8px">
        <button class="btn btn-blue btn-sm" style="flex:1" onclick="receiveReturn('${r.return_id}')">📥 รับของ (Receive)</button>
      </div>`;
    } else if (r.status === 'Received') {
      actions = `<div style="display:flex;gap:6px;margin-top:8px">
        <button class="btn btn-green btn-sm" style="flex:1" onclick="resolveReturn('${r.return_id}','Reworked')">🔧 ทำใหม่</button>
        <button class="btn btn-red btn-sm" style="flex:1" onclick="resolveReturn('${r.return_id}','Wasted')">🗑️ ทิ้ง</button>
      </div>`;
    }

    return `<div style="margin:0 16px 8px;padding:12px;border:1px solid var(--b1);border-radius:var(--radius);border-left:3px solid ${borderColor}">
      <div style="font-size:12px;font-weight:600">${r.return_id} · ${prodEmoji(r.product_name)} ${r.product_name} ×${r.qty}</div>
      <div style="font-size:10px;color:var(--td);margin-top:3px">${getStoreName(r.store_id)}-${getDeptName(r.dept_id)} · ${r.reported_by} · ${r.reason}: ${r.detail}</div>
      <div style="margin-top:6px">${statusTag}</div>
      ${r.failure_reason ? `<div style="font-size:9px;color:var(--td);margin-top:4px">📋 ${r.failure_reason}</div>` : ''}
      ${actions}
    </div>`;
  }).join('');
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
    toast('📥 รับของเรียบร้อย (Demo)', 'success');
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
    toast(`✅ ${isWaste ? 'บันทึกทิ้ง + WasteLog' : 'ทำใหม่เรียบร้อย'} (Demo)`, 'success');
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
  // N-01 fix: ensure orders are loaded before rendering
  try { await loadOrders(); } catch(e) { console.warn('Print: loadOrders failed:', e); }
  
  if (!S.bcPrintDate) {
    S.bcPrintDate = tomorrowSydney();
  }
  document.getElementById('bcPrintDateInput').value = S.bcPrintDate;
  document.getElementById('bcPrintSub').textContent = getScopeLabel();

  // Tabs
  document.getElementById('bcPrintTabs').innerHTML = `
    <div class="filter-chip ${S.bcPrintTab==='production'?'bc-active':''}" onclick="S.bcPrintTab='production';renderBcPrint()">📄 Production Sheet</div>
    <div class="filter-chip ${S.bcPrintTab==='slip'?'bc-active':''}" onclick="S.bcPrintTab='slip';renderBcPrint()">🧾 Delivery Slip</div>`;

  if (S.bcPrintTab === 'production') renderProductionSheet();
  else renderDeliverySlip();
}

// ─── B8: PRODUCTION SHEET ───
function renderProductionSheet() {
  const scope = S.deptMapping ? S.deptMapping.section_scope : [];
  const orders = filterOrdersByDateAndScope(S.bcPrintDate, scope);

  // Collect all items across orders, filter by scope
  const allItems = [];
  orders.forEach(o => {
    (o.items || []).forEach(it => {
      if (scope.length === 0 || scope.includes(it.section_id)) {
        allItems.push({ ...it, store_id: o.store_id, order_id: o.order_id, dept_id: o.dept_id, header_note: o.header_note, display_name: o.display_name });
      }
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

  // Always show all 4 stores
  const allStores = ['MNG','ISH','GB','TMC'];
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
  const now = new Date().toLocaleString('en-GB', { timeZone:'Australia/Sydney', day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' });
  const sectionTitle = scope.length ? scope.map(s => s.toUpperCase()).join(' + ') : 'ALL';

  let html = `<div class="print-area">
    <div style="text-align:center;margin-bottom:10px">
      <div style="font-size:14px;font-weight:700">PRODUCTION SHEET — ${sectionTitle}</div>
      <div style="font-size:9px;color:#888">Delivery Date: ${formatDateThai(S.bcPrintDate)} | Printed: ${now}</div>
      <div style="font-size:9px;color:#555;margin-top:2px">Orders: ${orderIds.length} รายการ (${orderIds.join(', ')})</div>
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
    html += `<div style="margin-top:8px;font-size:10px;color:#555;border-top:1px dashed #ddd;padding-top:6px">`;
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
  const storeList = [...storeSet].sort();

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

      bySection[sec][deptKey].push({ ...it, itemNoteIdx, order_id: o.order_id });
    });
  });

  const now = new Date().toLocaleString('en-GB', { timeZone:'Australia/Sydney', day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' });
  const sectionIcons = { cake:'🎂', sauce:'🫕', other:'📦' };

  html += `<div class="slip-wrap">
    <div class="slip-hd">
      <div style="font-size:16px;font-weight:700">${S.bcPrintStore}</div>
      <div>${getStoreName(S.bcPrintStore)}</div>
      <div style="font-size:8px;color:#888">Delivery: ${formatDateThai(S.bcPrintDate)}</div>
      <div style="font-size:7px;color:#555;margin-top:2px">Orders: ${orderIds.length} (${orderIds.join(', ')})</div>
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
        if (it.fulfilment_status === 'full') qtyStr = `${it.qty_ordered} → <strong>${it.qty_sent} ✓</strong>`;
        else if (it.fulfilment_status === 'partial') qtyStr = `${it.qty_ordered} → <strong style="color:#dc2626">${it.qty_sent} ✗</strong>`;
        else qtyStr = `${it.qty_ordered} → ___`;
        html += `<div class="slip-row"><span>${nameStr}</span><span>${qtyStr}</span></div>`;
      });
    });
  });

  // Footnotes
  const hasNotes = itemNotes.length > 0 || orderNotes.length > 0;
  if (hasNotes) {
    html += `<div style="margin:8px 0;border-top:1px dashed #ccc;padding-top:4px;font-size:8px;color:#555">`;
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
    <div style="font-size:7px;color:#aaa;margin-top:4px;text-align:center">Printed: ${now}</div>
  </div></div>`;
  html += `<div style="text-align:center;padding:12px" class="no-print">
    <button class="btn btn-primary" onclick="printSlip80()" style="font-size:14px;padding:10px 24px">🖨️ พิมพ์ Delivery Slip (80mm Thermal)</button>
  </div>`;

  document.getElementById('bcPrintContent').innerHTML = html;
}

