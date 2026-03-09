// Version 1.0 | 9 MAR 2026 | Siam Palette Group
// BC Order — screens3.js: Phase E — Browse V2 (Quota + Stock + Auto Calc)
// Overrides: renderBrowse, renderProducts, addToCart, removeFromBrowse,
//            toggleUrgentBrowse, renderCart, submitOrder
// Rollback: remove <script src="screens3.js"> from index.html

// ═══════════════════════════════════════════════════════════════
// BROWSE V2 — Quota + Stock on Hand + Auto Calculate Order Qty
// ═══════════════════════════════════════════════════════════════

// ─── LOAD QUOTAS (called once per browse session) ────────────
async function loadQuotasForBrowse() {
  if (S._quotasLoaded && S._quotaMap) return;
  try {
    const resp = await api('get_quotas');
    if (resp.success) {
      S._quotaMap = resp.data || {};
      S._quotasLoaded = true;
    }
  } catch(e) {
    console.warn('[quota] load failed:', e);
    S._quotaMap = {};
  }
}

// ─── GET QUOTA for a product on delivery date ────────────────
function getQuotaForProduct(productId) {
  if (!S._quotaMap || !S._quotaMap[productId]) return null;
  // Determine day_of_week from delivery date (0=จันทร์ ถึง 6=อาทิตย์)
  const d = new Date(S.deliveryDate + 'T00:00:00');
  if (isNaN(d.getTime())) return null;
  // JS: 0=Sun,1=Mon,...,6=Sat → convert to our format: 0=Mon,...,6=Sun
  const jsDay = d.getDay(); // 0=Sun
  const dayIdx = jsDay === 0 ? 6 : jsDay - 1; // 0=Mon,...,6=Sun
  return S._quotaMap[productId][dayIdx] !== undefined ? S._quotaMap[productId][dayIdx] : null;
}

// ─── AUTO CALC ORDER QTY ─────────────────────────────────────
function calcOrderQty(quota, stockOnHand, minOrder, orderStep) {
  if (quota === null || quota === undefined) return 0;
  const stock = (stockOnHand !== null && stockOnHand !== undefined && stockOnHand !== '') ? parseInt(stockOnHand) : null;
  if (stock === null) return 0; // ยังไม่กรอก stock → ไม่คำนวณ
  const raw = Math.max(0, quota - stock);
  if (raw <= 0) return 0;
  // Round up to min_order and order_step
  const min = minOrder || 1;
  const step = orderStep || 1;
  let qty = Math.max(min, raw);
  // Round up to nearest step
  if (step > 1 && qty % step !== 0) {
    qty = Math.ceil(qty / step) * step;
  }
  return qty;
}

// ─── RENDER BROWSE (override) ────────────────────────────────
function renderBrowse() {
  // Clear edit mode when browsing for new order
  if (S.editingOrderId) {
    S.editingOrderId = null;
    S.cart = [];
    S.headerNote = '';
  }
  if (!S.deliveryDate) S.deliveryDate = tomorrowSydney();

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

  // Category filters
  document.getElementById('catFilters').innerHTML = `
    <div class="filter-chip ${S.productFilter==='all'?'active':''}" onclick="S.productFilter='all';renderBrowse()">ทั้งหมด</div>
    ${S.categories.map(c => `<div class="filter-chip ${S.productFilter===c.cat_id?'active':''}" onclick="S.productFilter='${c.cat_id}';renderBrowse()">${catEmoji(c.cat_name)} ${c.cat_name}</div>`).join('')}
  `;

  // Load quotas then render products
  const grid = document.getElementById('productGrid');
  if (!S._quotasLoaded) {
    grid.innerHTML = '<div style="padding:20px;text-align:center"><div class="spinner"></div><div style="font-size:12px;color:var(--td);margin-top:8px">โหลดโควตา...</div></div>';
    loadQuotasForBrowse().then(() => renderProducts());
  } else {
    renderProducts();
  }
  updateCartBadge();
}

// ─── RENDER PRODUCTS (override) — Quota + Stock input ────────
function renderProducts() {
  let prods = S.products.filter(p => p.is_active === true || p.is_active === 'TRUE');
  if (S.productFilter !== 'all') prods = prods.filter(p => p.cat_id === S.productFilter);
  if (S.productSearch) { const q = S.productSearch.toLowerCase(); prods = prods.filter(p => p.product_name.toLowerCase().includes(q)); }

  // Sort: in-cart first, then A-Z
  prods.sort((a, b) => {
    const aInCart = S.cart.some(c => c.product_id === a.product_id) ? 0 : 1;
    const bInCart = S.cart.some(c => c.product_id === b.product_id) ? 0 : 1;
    if (aInCart !== bInCart) return aInCart - bInCart;
    return a.product_name.localeCompare(b.product_name);
  });

  const grid = document.getElementById('productGrid');
  if (prods.length === 0) {
    grid.innerHTML = '<div class="empty"><div class="empty-icon">🔍</div><div class="empty-title">ไม่พบสินค้า</div></div>';
    updateCartFooter(); return;
  }

  grid.innerHTML = `<div style="display:flex;flex-direction:column;gap:4px;padding:0 4px 120px">${prods.map(p => {
    const inCart = S.cart.find(c => c.product_id === p.product_id);
    const qty = inCart ? inCart.qty : 0;
    const stockOnHand = inCart ? inCart.stock_on_hand : null;
    const quota = getQuotaForProduct(p.product_id);
    const hasQuota = quota !== null && quota > 0;
    const borderStyle = inCart ? 'border:1px solid #c8e6c9;background:var(--green-bg)' : 'border:1px solid var(--bd2);background:#fff';

    // Quota badge
    const quotaBadge = hasQuota
      ? `<span style="font-size:11px;padding:1px 6px;border-radius:4px;background:var(--blue-bg);color:var(--blue);font-weight:600">โควตา ${quota}</span>`
      : '';

    // Stock on hand input
    const stockInput = hasQuota
      ? `<div style="display:flex;align-items:center;gap:4px;margin-top:4px">
          <span style="font-size:11px;color:var(--t3);white-space:nowrap">สต็อก:</span>
          <input type="number" min="0" inputmode="numeric" 
            value="${stockOnHand !== null && stockOnHand !== undefined ? stockOnHand : ''}" 
            placeholder="กรอก"
            style="width:60px;padding:4px 6px;border:1.5px solid var(--bd);border-radius:6px;font-size:13px;font-weight:600;text-align:center"
            onfocus="this.select()"
            onchange="updateStockOnHand('${p.product_id}',this.value)"
            onclick="event.stopPropagation()">
          <span style="font-size:11px;color:var(--t4)">${p.unit || ''}</span>
        </div>`
      : '';

    // Auto calc line
    let autoCalcLine = '';
    if (hasQuota && stockOnHand !== null && stockOnHand !== undefined && stockOnHand !== '') {
      const autoQty = calcOrderQty(quota, stockOnHand, p.min_order, p.order_step);
      autoCalcLine = `<div style="font-size:11px;color:var(--blue);margin-top:2px">สั่ง = ${quota} − ${stockOnHand} = <b>${autoQty}</b> ${p.unit || ''}</div>`;
    }

    // +/- buttons (same as before)
    const canMinus = qty > 0;
    const btnBorder = inCart ? 'var(--green)' : 'var(--bd)';
    const btnColor = inCart ? 'var(--green)' : 'var(--t4)';

    return `<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;${borderStyle};border-radius:var(--rd)">
      ${p.image_url ? `<div style="width:44px;height:44px;background:var(--s1);border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden">${prodImg(p, 44)}</div>` : ''}
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
          <span style="font-size:12px;font-weight:700">${p.product_name}</span>
          ${quotaBadge}
        </div>
        <div style="font-size:12px;color:var(--t4)">min: ${p.min_order||1} | step: ${p.order_step||1}</div>
        ${stockInput}
        ${autoCalcLine}
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

// ─── UPDATE STOCK ON HAND → auto calc + add to cart ──────────
function updateStockOnHand(productId, val) {
  const p = S.products.find(x => x.product_id === productId);
  if (!p) return;

  const stockVal = (val !== '' && val !== null && val !== undefined) ? parseInt(val) : null;
  const quota = getQuotaForProduct(productId);
  const autoQty = calcOrderQty(quota, stockVal, p.min_order, p.order_step);

  const existing = S.cart.find(c => c.product_id === productId);

  if (autoQty > 0) {
    // Add or update cart
    if (existing) {
      existing.qty = autoQty;
      existing.stock_on_hand = stockVal;
    } else {
      S.cart.push({
        product_id: p.product_id,
        product_name: p.product_name,
        qty: autoQty,
        unit: p.unit,
        section_id: p.section_id,
        min_order: p.min_order,
        order_step: p.order_step || 1,
        is_urgent: false,
        note: '',
        stock_on_hand: stockVal,
      });
    }
  } else {
    // Auto calc = 0 → remove from cart (stock >= quota)
    if (existing) {
      existing.stock_on_hand = stockVal;
      existing.qty = 0;
      const idx = S.cart.indexOf(existing);
      if (idx >= 0) S.cart.splice(idx, 1);
    }
  }

  renderProducts();
  updateCartBadge();
}

// ─── ADD TO CART (override) — respects stock_on_hand ─────────
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
      stock_on_hand: null,
    });
  }

  renderProducts();
  updateCartBadge();
}

// ─── REMOVE FROM BROWSE (override) ──────────────────────────
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

// ─── TOGGLE URGENT (override) ───────────────────────────────
function toggleUrgentBrowse(productId) {
  const item = S.cart.find(c => c.product_id === productId);
  if (!item) return;
  item.is_urgent = !item.is_urgent;
  renderProducts();
}

// ─── RENDER CART (override) — shows stock_on_hand ────────────
function renderCart() {
  document.getElementById('cartCount').textContent = S.cart.length + ' รายการ';
  const content = document.getElementById('cartContent');

  if (S.cart.length === 0) {
    content.innerHTML = '<div class="empty"><div class="empty-icon">🛒</div><div class="empty-title">ตะกร้าว่าง</div><div class="empty-desc">กดสินค้าเพื่อเพิ่ม</div></div>';
    return;
  }

  if (S.editingOrderId) {
    document.getElementById('cartCount').textContent = S.cart.length + ' รายการ · ✏️ ' + S.editingOrderId;
  }

  const totalPcs = S.cart.reduce((s,c) => s + c.qty, 0);
  const urgentCount = S.cart.filter(c => c.is_urgent).length;

  content.innerHTML = `
    <div style="padding:16px 20px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
        <div class="date-badge">📅 ส่งวันที่ ${formatDateThai(S.deliveryDate)}</div>
        <button class="btn btn-outline btn-sm" onclick="changeDeliveryDate()">เปลี่ยน</button>
      </div>
      ${S.editingOrderId && S.deliveryDate === todaySydney() ? `<div style="padding:12px 16px;background:var(--orange-bg);border:1px solid #f0d8a0;border-radius:var(--rd2);font-size:12px;color:var(--orange);margin-bottom:10px">⚠️ <b>หมายเหตุ:</b> ถ้าแก้ไข order หลัง cutoff time → status จะเปลี่ยนจาก <b>Ordered → Pending</b> โดยอัตโนมัติ</div>` : ''}

      <!-- Cart Items -->
      ${S.cart.map((item, idx) => {
        const isFulfilled = S.editingOrderId && item.fulfilment_status;
        const stockLine = (item.stock_on_hand !== null && item.stock_on_hand !== undefined)
          ? `<div style="font-size:12px;color:var(--blue)">📦 สต็อก: ${item.stock_on_hand} ${item.unit || ''}</div>`
          : '';
        const quota = getQuotaForProduct(item.product_id);
        const quotaLine = (quota !== null)
          ? `<div style="font-size:12px;color:var(--t3)">โควตา: ${quota}</div>`
          : '';

        return `<div style="padding:12px 0;border-bottom:1px solid var(--bd2)">
          <div style="display:flex;align-items:flex-start;gap:10px">
            ${(S.products.find(x=>x.product_id===item.product_id)||{}).image_url ? `<div style="width:40px;height:40px;background:var(--s1);border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden">${prodImg(S.products.find(x=>x.product_id===item.product_id), 40)}</div>` : ''}
            <div style="flex:1;min-width:0">
              <div style="font-size:12px;font-weight:700">${item.product_name}${isFulfilled ? ' <span style="font-size:12px;padding:2px 6px;border-radius:6px;background:var(--green-bg);color:var(--green)">✅ ทำแล้ว</span>' : ''}</div>
              <div style="font-size:13px;color:var(--t3)">${item.unit} · ขั้นต่ำ ${item.min_order}${item.order_step>1?' · step '+item.order_step:''}${isFulfilled ? ' · sent:'+item.qty_sent : ''}</div>
              ${stockLine}
              ${quotaLine}
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
      <div style="padding:12px 16px;background:var(--s1);border-radius:var(--rd2);display:flex;justify-content:space-between;font-size:13px;font-weight:600;margin:10px 0 8px"><span>${S.cart.length} รายการ · ${totalPcs} ชิ้น</span>${urgentCount > 0 ? `<span style="color:var(--red)">${urgentCount} urgent</span>` : ''}</div>
      <div style="display:flex;gap:5px">
        <button class="btn btn-gold" id="submitOrderBtn" style="flex:1;padding:10px;font-size:12px" onclick="submitOrder()">📤 ${S.editingOrderId ? 'บันทึกการแก้ไข' : 'สั่งเลย'}</button>
        <button class="btn btn-outline" style="flex:0.5;padding:10px;font-size:13px" onclick="${S.editingOrderId ? "showScreen('orders')" : "showScreen('browse')"}">← ${S.editingOrderId ? 'ยกเลิก' : 'เลือกเพิ่ม'}</button>
      </div>
    </div>`;
}

// ─── SUBMIT ORDER (override) — includes stock_on_hand ────────
async function submitOrder() {
  if (S.cart.length === 0) return;

  const submitBtn = document.getElementById('submitOrderBtn');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px"></div> กำลังส่ง...'; }

  const isEdit = !!S.editingOrderId;

  if (isEdit) {
    const editableItems = S.cart.filter(c => !c.fulfilment_status);
    const body = {
      order_id: S.editingOrderId,
      delivery_date: S.deliveryDate,
      header_note: S.headerNote,
      items: editableItems.map(c => ({
        item_id: c.item_id,
        product_id: c.product_id,
        qty: c.qty,
        is_urgent: c.is_urgent,
        note: c.note,
        stock_on_hand: (c.stock_on_hand !== null && c.stock_on_hand !== undefined) ? c.stock_on_hand : null,
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
        if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = '💾 บันทึกการแก้ไข'; }
      }
    } catch (err) {
      toast('❌ แก้ไขไม่สำเร็จ', 'error');
      S.cart = [];
      S.editingOrderId = null;
      setTimeout(() => showScreen('orders'), 1500);
    }
  } else {
    const body = {
      delivery_date: S.deliveryDate,
      header_note: S.headerNote,
      items: S.cart.map(c => ({
        product_id: c.product_id,
        qty: c.qty,
        is_urgent: c.is_urgent,
        note: c.note,
        stock_on_hand: (c.stock_on_hand !== null && c.stock_on_hand !== undefined) ? c.stock_on_hand : null,
      }))
    };

    try {
      const resp = await api('create_order', body);
      if (resp.success) {
        toast(resp.message || '✅ สั่งเรียบร้อย!', 'success');
        S.cart = [];
        S.headerNote = '';
        S._quotasLoaded = false; // reset quota cache for next order
        setTimeout(async () => {
          try { await loadOrders(); } catch(e) {}
          try { await loadDashboard(); } catch(e) {}
          showScreen('home');
        }, 1500);
      } else {
        toast(resp.message || 'เกิดข้อผิดพลาด', 'error');
        if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = '📤 สั่งเลย'; }
      }
    } catch (err) {
      toast('❌ สั่งไม่สำเร็จ', 'error');
      S.cart = [];
      setTimeout(() => showScreen('home'), 1500);
    }
  }
}

// ─── setDeliveryDate (override) — reset quota on date change ─
function setDeliveryDate(d) {
  S.deliveryDate = d;
  // Recalculate all cart items based on new day's quota
  S.cart.forEach(item => {
    const p = S.products.find(x => x.product_id === item.product_id);
    if (p && item.stock_on_hand !== null && item.stock_on_hand !== undefined) {
      const quota = getQuotaForProduct(item.product_id);
      const newQty = calcOrderQty(quota, item.stock_on_hand, p.min_order, p.order_step);
      if (newQty > 0) {
        item.qty = newQty;
      } else {
        item.qty = 0; // will be cleaned up
      }
    }
  });
  // Remove items with qty = 0
  S.cart = S.cart.filter(c => c.qty > 0);
  renderBrowse();
}
