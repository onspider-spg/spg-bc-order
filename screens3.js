// Version 2.5 | 10 MAR 2026 | Siam Palette Group
// BC Order — screens3.js: Phase E — Browse V2 (Quota + Stock + Auto Calc)
// Fix: clear S._stockInput on new order + after submit success
// Overrides: renderBrowse, renderProducts, addToCart, removeFromBrowse,
//            toggleUrgentBrowse, renderCart, submitOrder, setDeliveryDate
// Rollback: remove <script src="screens3.js"> from index.html

// ═══════════════════════════════════════════════════════════════
// HELPERS — Quota lookup + Auto calc (pure functions, no DOM)
// ═══════════════════════════════════════════════════════════════

async function _loadQuotas() {
  if (S._quotaMap) return;
  try {
    const resp = await api('get_quotas');
    S._quotaMap = (resp.success && resp.data) ? resp.data : {};
  } catch(e) { S._quotaMap = {}; }
}

function _getQuota(productId) {
  if (!S._quotaMap || !S._quotaMap[productId]) return null;
  const d = new Date(S.deliveryDate + 'T00:00:00');
  if (isNaN(d.getTime())) return null;
  const jsDay = d.getDay();
  const dayIdx = jsDay === 0 ? 6 : jsDay - 1;
  const val = S._quotaMap[productId][dayIdx];
  return (val !== undefined && val !== null) ? val : null;
}

function _calcQty(quota, stock, minOrder, orderStep) {
  if (quota === null || quota === undefined) return 0;
  if (stock === null || stock === undefined || stock === '') return 0;
  const s = parseInt(stock);
  if (isNaN(s)) return 0;
  const raw = quota - s;
  if (raw <= 0) return 0;
  const min = minOrder || 1;
  const step = orderStep || 1;
  let qty = Math.max(min, raw);
  if (step > 1 && qty % step !== 0) qty = Math.ceil(qty / step) * step;
  return qty;
}

// ═══════════════════════════════════════════════════════════════
// RENDER BROWSE (override)
// ═══════════════════════════════════════════════════════════════

function renderBrowse() {
  if (S.editingOrderId) { S.editingOrderId = null; S.cart = []; S.headerNote = ''; }
  // Fresh start: clear stock input cache for new order
  if (!S.editingOrderId) S._stockInput = {};
  if (!S.deliveryDate) S.deliveryDate = tomorrowSydney();

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

  document.getElementById('catFilters').innerHTML = `
    <div class="filter-chip ${S.productFilter==='all'?'active':''}" onclick="S.productFilter='all';renderBrowse()">ทั้งหมด</div>
    ${S.categories.map(c => `<div class="filter-chip ${S.productFilter===c.cat_id?'active':''}" onclick="S.productFilter='${c.cat_id}';renderBrowse()">${catEmoji(c.cat_name)} ${c.cat_name}</div>`).join('')}
  `;

  if (!S._quotaMap) {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = '<div style="padding:20px;text-align:center"><div class="spinner"></div><div style="font-size:12px;color:var(--td);margin-top:8px">โหลดโควตา...</div></div>';
    _loadQuotas().then(() => renderProducts());
  } else {
    renderProducts();
  }
  updateCartBadge();
}

// ═══════════════════════════════════════════════════════════════
// RENDER PRODUCTS (override)
// ═══════════════════════════════════════════════════════════════

function renderProducts() {
  let prods = S.products.filter(p => p.is_active === true || p.is_active === 'TRUE');
  if (S.productFilter !== 'all') prods = prods.filter(p => p.cat_id === S.productFilter);
  if (S.productSearch) { const q = S.productSearch.toLowerCase(); prods = prods.filter(p => p.product_name.toLowerCase().includes(q)); }

  prods.sort((a, b) => {
    const aIn = S.cart.some(c => c.product_id === a.product_id) ? 0 : 1;
    const bIn = S.cart.some(c => c.product_id === b.product_id) ? 0 : 1;
    return aIn !== bIn ? aIn - bIn : a.product_name.localeCompare(b.product_name);
  });

  const grid = document.getElementById('productGrid');
  if (!prods.length) {
    grid.innerHTML = '<div class="empty"><div class="empty-icon">🔍</div><div class="empty-title">ไม่พบสินค้า</div></div>';
    updateCartFooter(); return;
  }

  grid.innerHTML = `<div style="display:flex;flex-direction:column;gap:4px;padding:0 4px 120px">${prods.map(p => _renderRow(p)).join('')}</div>`;
  updateCartFooter();
}

// ─── Single product row (extracted for DOM patching) ─────────
function _renderRow(p) {
  const inCart = S.cart.find(c => c.product_id === p.product_id);
  const qty = inCart ? inCart.qty : 0;
  // Read stock from S._stockInput first (persists even when not in cart)
  if (!S._stockInput) S._stockInput = {};
  const stockVal = S._stockInput[p.product_id] ?? (inCart ? inCart.stock_on_hand : null);
  const quota = _getQuota(p.product_id);
  const qNum = (quota !== null) ? quota : 0;
  const sVal = (stockVal !== null && stockVal !== undefined) ? stockVal : '';
  const autoQty = _calcQty(qNum, stockVal, p.min_order, p.order_step);

  const isInCart = qty > 0;
  const cardBg = isInCart ? '#f0fdf4' : '#fff';
  const cardBdr = isInCart ? '#bbf7d0' : 'var(--bd2)';

  // Calc note (shows when min/step kicks in)
  let calcNote = '';
  if (sVal !== '' && autoQty > 0) {
    const raw = Math.max(0, qNum - parseInt(sVal));
    if (autoQty > raw) {
      calcNote = `<div style="font-size:11px;color:var(--t3);margin-top:4px;padding:0 8px">💡 need ${raw} → min ${p.min_order||1}/step ${p.order_step||1} → <b>${autoQty}</b></div>`;
    }
  }

  const stockBdr = sVal === '' ? 'var(--orange)' : '#94a3b8';

  return `<div id="row-${p.product_id}" style="border:1px solid ${cardBdr};background:${cardBg};border-radius:12px;padding:12px">
    <div style="display:flex;align-items:center;gap:10px">
      ${p.image_url ? `<div style="width:36px;height:36px;border-radius:8px;overflow:hidden;flex-shrink:0;background:var(--s1);display:flex;align-items:center;justify-content:center">${prodImg(p, 36)}</div>` : ''}
      <div style="flex:1;min-width:0">
        <div style="font-size:14px;font-weight:700;line-height:1.3">${p.product_name}</div>
      </div>
      ${isInCart ? `<div style="width:28px;height:28px;border-radius:50%;background:${inCart.is_urgent?'var(--orange)':'var(--s2)'};display:flex;align-items:center;justify-content:center;font-size:12px;cursor:pointer;${inCart.is_urgent?'':'opacity:.35'}" onclick="toggleUrgentBrowse('${p.product_id}')">⚡</div>` : ''}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1.5fr 1.2fr;gap:6px;margin-top:8px;background:var(--s1);border-radius:10px;padding:10px 12px;align-items:center">
      <div style="text-align:center">
        <div style="font-size:11px;color:var(--t3);margin-bottom:2px">โควตา</div>
        <div style="font-size:18px;font-weight:800;color:var(--blue)">${qNum}</div>
      </div>
      <div style="text-align:center">
        <div style="font-size:11px;color:var(--t3);margin-bottom:2px">สต็อก</div>
        <input type="number" min="0" inputmode="numeric" value="${sVal}" placeholder="—"
          style="width:64px;padding:6px 4px;border:1.5px solid ${stockBdr};border-radius:8px;font-size:18px;font-weight:700;text-align:center;background:#fff"
          onfocus="this.select()" onchange="_onStock('${p.product_id}',this.value)" onclick="event.stopPropagation()">
      </div>
      <div style="text-align:center">
        <div style="font-size:11px;color:var(--t3);margin-bottom:2px">สั่ง</div>
        <div style="display:flex;align-items:center;justify-content:center;gap:4px">
          <div style="width:24px;height:24px;border-radius:50%;border:1.5px solid ${isInCart?'var(--green)':'var(--bd)'};display:flex;align-items:center;justify-content:center;font-size:12px;color:${isInCart?'var(--green)':'var(--t4)'};cursor:pointer;font-weight:700" onclick="removeFromBrowse('${p.product_id}')">−</div>
          <div style="font-size:18px;font-weight:800;min-width:24px;text-align:center;color:${qty>0?'var(--t)':'var(--t4)'}">${qty}</div>
          <div style="width:24px;height:24px;border-radius:50%;border:1.5px solid ${isInCart?'var(--green)':'var(--bd)'};display:flex;align-items:center;justify-content:center;font-size:12px;color:${isInCart?'var(--green)':'var(--t2)'};cursor:pointer;font-weight:700" onclick="addToCart('${p.product_id}')">+</div>
        </div>
      </div>
    </div>
    ${calcNote}
  </div>`;
}

// ─── DOM patch — update single row ──────────────────────────
function _patchRow(productId) {
  const el = document.getElementById('row-' + productId);
  const p = S.products.find(x => x.product_id === productId);
  if (!el || !p) { renderProducts(); return; }
  el.outerHTML = _renderRow(p);
  updateCartBadge();
}

// ─── Stock on hand input handler ────────────────────────────
function _onStock(productId, val) {
  const p = S.products.find(x => x.product_id === productId);
  if (!p) return;
  if (!S._stockInput) S._stockInput = {};
  const stockVal = (val !== '' && val !== null && val !== undefined) ? parseInt(val) : null;
  // Always persist stock input (survives cart removal)
  if (stockVal !== null) S._stockInput[productId] = stockVal;
  else delete S._stockInput[productId];

  const qNum = _getQuota(productId) ?? 0;
  const autoQty = _calcQty(qNum, stockVal, p.min_order, p.order_step);
  const idx = S.cart.findIndex(c => c.product_id === productId);

  if (autoQty > 0) {
    if (idx >= 0) { S.cart[idx].qty = autoQty; S.cart[idx].stock_on_hand = stockVal; }
    else {
      S.cart.push({
        product_id: p.product_id, product_name: p.product_name,
        qty: autoQty, unit: p.unit, section_id: p.section_id,
        min_order: p.min_order, order_step: p.order_step || 1,
        is_urgent: false, note: '', stock_on_hand: stockVal,
      });
    }
  } else {
    if (idx >= 0) { S.cart.splice(idx, 1); }
  }

  _patchRow(productId);
}

// ═══════════════════════════════════════════════════════════════
// ADD / REMOVE / TOGGLE (overrides)
// ═══════════════════════════════════════════════════════════════

function addToCart(productId) {
  const p = S.products.find(x => x.product_id === productId);
  if (!p) return;
  if (p.popup_notice) toast(p.popup_notice, 'warning');
  if (!S._stockInput) S._stockInput = {};
  const soh = S._stockInput[productId] ?? null;
  const existing = S.cart.find(c => c.product_id === productId);
  if (existing) { existing.qty += p.order_step || 1; if (soh !== null) existing.stock_on_hand = soh; }
  else {
    S.cart.push({
      product_id: p.product_id, product_name: p.product_name,
      qty: p.min_order || 1, unit: p.unit, section_id: p.section_id,
      min_order: p.min_order, order_step: p.order_step || 1,
      is_urgent: false, note: '', stock_on_hand: soh,
    });
  }
  _patchRow(productId);
}

function removeFromBrowse(productId) {
  const idx = S.cart.findIndex(c => c.product_id === productId);
  if (idx === -1) return;
  const item = S.cart[idx];
  const p = S.products.find(x => x.product_id === productId);
  item.qty -= (p ? (p.order_step || 1) : 1);
  if (item.qty < (p ? (p.min_order || 1) : 1)) S.cart.splice(idx, 1);
  _patchRow(productId);
}

function toggleUrgentBrowse(productId) {
  const item = S.cart.find(c => c.product_id === productId);
  if (!item) return;
  item.is_urgent = !item.is_urgent;
  _patchRow(productId);
}

// ═══════════════════════════════════════════════════════════════
// RENDER CART (override) — show stock + quota per item
// ═══════════════════════════════════════════════════════════════

function renderCart() {
  document.getElementById('cartCount').textContent = S.cart.length + ' รายการ';
  const content = document.getElementById('cartContent');
  if (!S.cart.length) {
    content.innerHTML = '<div class="empty"><div class="empty-icon">🛒</div><div class="empty-title">ตะกร้าว่าง</div><div class="empty-desc">กดสินค้าเพื่อเพิ่ม</div></div>';
    return;
  }
  if (S.editingOrderId) document.getElementById('cartCount').textContent = S.cart.length + ' รายการ · ✏️ ' + S.editingOrderId;

  const totalPcs = S.cart.reduce((s,c) => s + c.qty, 0);
  const urgentCount = S.cart.filter(c => c.is_urgent).length;

  content.innerHTML = `
    <div style="padding:16px 20px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
        <div class="date-badge">📅 ส่งวันที่ ${formatDateThai(S.deliveryDate)}</div>
        <button class="btn btn-outline btn-sm" onclick="changeDeliveryDate()">เปลี่ยน</button>
      </div>
      ${S.editingOrderId && S.deliveryDate === todaySydney() ? `<div style="padding:12px 16px;background:var(--orange-bg);border:1px solid #f0d8a0;border-radius:var(--rd2);font-size:12px;color:var(--orange);margin-bottom:10px">⚠️ <b>หมายเหตุ:</b> ถ้าแก้ไข order หลัง cutoff time → status จะเปลี่ยนจาก <b>Ordered → Pending</b> โดยอัตโนมัติ</div>` : ''}
      ${S.cart.map((item, idx) => {
        const isFulfilled = S.editingOrderId && item.fulfilment_status;
        const quota = _getQuota(item.product_id);
        const tags = [];
        if (item.stock_on_hand !== null && item.stock_on_hand !== undefined) tags.push('📦 สต็อก: ' + item.stock_on_hand);
        if (quota !== null) tags.push('โควตา: ' + quota);
        const infoLine = tags.length ? `<div style="font-size:12px;color:var(--blue)">${tags.join(' · ')}</div>` : '';
        return `<div style="padding:12px 0;border-bottom:1px solid var(--bd2)"><div style="display:flex;align-items:flex-start;gap:10px">
          ${(S.products.find(x=>x.product_id===item.product_id)||{}).image_url ? `<div style="width:40px;height:40px;background:var(--s1);border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden">${prodImg(S.products.find(x=>x.product_id===item.product_id), 40)}</div>` : ''}
          <div style="flex:1;min-width:0">
            <div style="font-size:12px;font-weight:700">${item.product_name}${isFulfilled ? ' <span style="font-size:12px;padding:2px 6px;border-radius:6px;background:var(--green-bg);color:var(--green)">✅ ทำแล้ว</span>' : ''}</div>
            <div style="font-size:13px;color:var(--t3)">${item.unit} · ขั้นต่ำ ${item.min_order}${item.order_step>1?' · step '+item.order_step:''}${isFulfilled ? ' · sent:'+item.qty_sent : ''}</div>
            ${infoLine}
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
        </div></div>`;
      }).join('')}
      <div style="margin-top:14px"><div style="font-size:13px;color:var(--t3);margin-bottom:4px">📝 โน้ตสำหรับ Order ทั้งหมด</div>
        <textarea class="form-input" rows="2" placeholder="เช่น ส่งตอน 10:30" style="resize:vertical;font-size:13px" onchange="S.headerNote=this.value">${S.headerNote}</textarea>
      </div>
      <div style="padding:12px 16px;background:var(--s1);border-radius:var(--rd2);display:flex;justify-content:space-between;font-size:13px;font-weight:600;margin:10px 0 8px"><span>${S.cart.length} รายการ · ${totalPcs} ชิ้น</span>${urgentCount > 0 ? `<span style="color:var(--red)">${urgentCount} urgent</span>` : ''}</div>
      <div style="display:flex;gap:5px">
        <button class="btn btn-gold" id="submitOrderBtn" style="flex:1;padding:10px;font-size:12px" onclick="submitOrder()">📤 ${S.editingOrderId ? 'บันทึกการแก้ไข' : 'สั่งเลย'}</button>
        <button class="btn btn-outline" style="flex:0.5;padding:10px;font-size:13px" onclick="${S.editingOrderId ? "showScreen('orders')" : "showScreen('browse')"}">← ${S.editingOrderId ? 'ยกเลิก' : 'เลือกเพิ่ม'}</button>
      </div>
    </div>`;
}

// ═══════════════════════════════════════════════════════════════
// SUBMIT ORDER (override) — includes stock_on_hand
// ═══════════════════════════════════════════════════════════════

async function submitOrder() {
  if (!S.cart.length) return;

  // Validate: stock_on_hand must be filled for every item
  const missing = S.cart.filter(c => !c.fulfilment_status && (c.stock_on_hand === null || c.stock_on_hand === undefined));
  if (missing.length > 0) {
    toast('⚠️ กรุณากรอกสต็อกให้ครบทุกรายการก่อนสั่ง (' + missing.length + ' รายการยังไม่กรอก)', 'warning');
    return;
  }

  const btn = document.getElementById('submitOrderBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px"></div> กำลังส่ง...'; }

  const isEdit = !!S.editingOrderId;
  if (isEdit) {
    const items = S.cart.filter(c => !c.fulfilment_status).map(c => ({
      item_id: c.item_id, product_id: c.product_id, qty: c.qty,
      is_urgent: c.is_urgent, note: c.note, stock_on_hand: c.stock_on_hand ?? null,
    }));
    try {
      const resp = await api('edit_order', { order_id: S.editingOrderId, delivery_date: S.deliveryDate, header_note: S.headerNote, items });
      if (resp.success) {
        toast(resp.message || '✅ แก้ไขเรียบร้อย!', 'success');
        S.cart = []; S.headerNote = ''; S.editingOrderId = null;
        S._stockInput = {}; // clear stock cache
        setTimeout(() => showScreen('orders'), 1500);
      } else {
        toast(resp.message || 'เกิดข้อผิดพลาด', 'error');
        if (btn) { btn.disabled = false; btn.innerHTML = '💾 บันทึกการแก้ไข'; }
      }
    } catch(e) {
      toast('❌ แก้ไขไม่สำเร็จ', 'error');
      S.cart = []; S.editingOrderId = null;
      setTimeout(() => showScreen('orders'), 1500);
    }
  } else {
    const items = S.cart.map(c => ({
      product_id: c.product_id, qty: c.qty, is_urgent: c.is_urgent,
      note: c.note, stock_on_hand: c.stock_on_hand ?? null,
    }));
    try {
      const resp = await api('create_order', { delivery_date: S.deliveryDate, header_note: S.headerNote, items });
      if (resp.success) {
        toast(resp.message || '✅ สั่งเรียบร้อย!', 'success');
        S.cart = []; S.headerNote = '';
        S._quotaMap = null; // reset for fresh data next order
        S._stockInput = {}; // clear stock cache
        setTimeout(async () => {
          try { await loadOrders(); } catch(e) {}
          try { await loadDashboard(); } catch(e) {}
          showScreen('home');
        }, 1500);
      } else {
        toast(resp.message || 'เกิดข้อผิดพลาด', 'error');
        if (btn) { btn.disabled = false; btn.innerHTML = '📤 สั่งเลย'; }
      }
    } catch(e) {
      toast('❌ สั่งไม่สำเร็จ', 'error');
      S.cart = [];
      setTimeout(() => showScreen('home'), 1500);
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// SET DELIVERY DATE (override) — recalc cart for new day
// ═══════════════════════════════════════════════════════════════

function setDeliveryDate(d) {
  S.deliveryDate = d;
  S.cart.forEach(item => {
    if (item.stock_on_hand === null || item.stock_on_hand === undefined) return;
    const p = S.products.find(x => x.product_id === item.product_id);
    if (!p) return;
    const newQty = _calcQty(_getQuota(item.product_id), item.stock_on_hand, p.min_order, p.order_step);
    item.qty = newQty > 0 ? newQty : 0;
  });
  S.cart = S.cart.filter(c => c.qty > 0);
  renderBrowse();
}
