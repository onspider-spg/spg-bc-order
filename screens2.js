// Version 8.2 | 8 MAR 2026 | Siam Palette Group
// BC Order — screens2.js: Waste, Returns, BC Home, Print Slip
// Phase 3: Store Records UI overhaul (wireframe match)

// ─── RENDER: WASTE ───────────────────────────────────────────
function renderWaste() {
  const content = document.getElementById('wasteContent');
  content.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  
  loadWaste().catch(() => {}).finally(() => renderWasteList());
}

function renderWasteList() {
  const content = document.getElementById('wasteContent');
  const logs = S.wasteLog || [];

  // Category filter chips from logs
  const sections = [...new Set(logs.map(w => {
    const p = (S.products||[]).find(x => x.product_id === w.product_id);
    return p ? p.section_id : 'other';
  }))];

  // Filter by wasteSelectedCat
  let filtered = logs;
  if (S.wasteSelectedCat && S.wasteSelectedCat !== 'all') {
    filtered = logs.filter(w => {
      const p = (S.products||[]).find(x => x.product_id === w.product_id);
      return p && p.section_id === S.wasteSelectedCat;
    });
  }

  const reasonColor = r => r === 'Expired' ? 'var(--red)' : r === 'Damaged' ? 'var(--orange)' : r === 'Production Error' ? 'var(--purple)' : 'var(--td)';

  content.innerHTML = `<div style="padding:16px 20px">
    <!-- Filter Chips -->
    <div style="display:flex;gap:3px;margin-bottom:7px;flex-wrap:wrap">
      <span style="font-size:12px;padding:3px 10px;border-radius:14px;border:1px solid ${!S.wasteSelectedCat||S.wasteSelectedCat==='all'?'var(--gold)':'var(--bd)'};color:${!S.wasteSelectedCat||S.wasteSelectedCat==='all'?'#fff':'var(--t3)'};background:${!S.wasteSelectedCat||S.wasteSelectedCat==='all'?'var(--gold)':'#fff'};cursor:pointer" onclick="S.wasteSelectedCat='all';renderWasteList()">ทั้งหมด</span>
      ${sections.map(sec => `<span style="font-size:12px;padding:3px 10px;border-radius:14px;border:1px solid ${S.wasteSelectedCat===sec?'var(--gold)':'var(--bd)'};color:${S.wasteSelectedCat===sec?'#fff':'var(--t3)'};background:${S.wasteSelectedCat===sec?'var(--gold)':'#fff'};cursor:pointer" onclick="S.wasteSelectedCat='${sec}';renderWasteList()">${getCatName(sec)}</span>`).join('')}
    </div>

    <!-- Waste Table -->
    ${filtered.length === 0 ? '<div class="empty"><div class="empty-icon">✅</div><div class="empty-title">ยังไม่มีรายการ Waste</div><div class="empty-desc">14 วันล่าสุด</div></div>' : `
    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:8px">
      <thead><tr style="background:var(--s1)">
        <th style="padding:8px 16px;text-align:left;font-weight:600;font-size:12px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">วันที่</th>
        <th style="padding:8px 16px;text-align:left;font-weight:600;font-size:12px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">สินค้า</th>
        <th style="padding:8px 16px;text-align:center;font-weight:600;font-size:12px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">จำนวน</th>
        <th style="padding:8px 16px;text-align:left;font-weight:600;font-size:12px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">สาเหตุ</th>
        <th class="hide-m" style="padding:8px 16px;text-align:left;font-weight:600;font-size:12px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">ผลิต</th>
        <th class="hide-m" style="padding:8px 16px;text-align:left;font-weight:600;font-size:12px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)">โดย</th>
        <th style="padding:8px 16px;text-align:center;font-weight:600;font-size:12px;color:var(--t3);text-transform:uppercase;border-bottom:2px solid var(--bd)"></th>
      </tr></thead>
      <tbody>${filtered.map(w => {
        const pName = ((S.products||[]).find(p => p.product_id === w.product_id) || {}).product_name || w.product_id;
        const unit = ((S.products||[]).find(p => p.product_id === w.product_id) || {}).unit || '';
        const reasonMap = { Expired:'Expired', Damaged:'Damaged', 'Production Error':'Prod Error', Quality:'Quality' };
        return `<tr>
          <td style="padding:8px 16px;border-bottom:1px solid var(--bd2)">${formatDateAU(w.waste_date)}</td>
          <td style="padding:8px 16px;border-bottom:1px solid var(--bd2);font-weight:600">${prodEmoji(pName)} ${pName}</td>
          <td style="padding:8px 16px;border-bottom:1px solid var(--bd2);text-align:center;font-weight:700;color:var(--red)">−${w.quantity} ${unit}</td>
          <td style="padding:8px 16px;border-bottom:1px solid var(--bd2);color:${reasonColor(w.reason)}">${reasonMap[w.reason]||w.reason}</td>
          <td class="hide-m" style="padding:8px 16px;border-bottom:1px solid var(--bd2)">${w.production_date ? formatDateAU(w.production_date) : '—'}</td>
          <td class="hide-m" style="padding:8px 16px;border-bottom:1px solid var(--bd2)">${w.recorded_by||'—'}</td>
          <td style="padding:8px 16px;border-bottom:1px solid var(--bd2);text-align:center;white-space:nowrap"><span style="color:var(--blue);cursor:pointer" onclick="showWasteEdit('${w.waste_id}')">✏️</span> <span style="color:var(--red);cursor:pointer" onclick="deleteWaste('${w.waste_id}')">🗑️</span></td>
        </tr>`;
      }).join('')}</tbody>
    </table>`}

    <button class="btn btn-gold" style="margin-top:4px" onclick="showWasteForm()">+ บันทึกของเสียใหม่</button>
  </div>`;
}

function showWasteForm(editData) {
  const isEdit = !!editData;
  const title = isEdit ? '✏️ แก้ไข Waste' : '🗑️ บันทึกของเสีย';
  const btnLabel = isEdit ? '💾 บันทึกการแก้ไข' : '💾 บันทึก';
  const btnAction = isEdit ? `saveWasteEdit('${editData.waste_id}')` : 'submitWaste()';
  
  // W-01 fix: Filter products by dept scope (not category)
  let wasteProducts = (S.products || []).filter(p => p.is_active === true || p.is_active === 'TRUE');
  const dm = S.deptMapping || {};
  if (dm.module_role === 'bc_production' || dm.module_role === 'bc_management') {
    // BC role: filter by section_scope
    const scope = dm.section_scope || [];
    if (scope.length > 0) {
      wasteProducts = wasteProducts.filter(p => scope.includes(p.section_id));
    }
  }
  // Store role: show all active products (no section filter needed)
  
  showDialog(`
    <div style="font-size:16px;font-weight:700;margin-bottom:16px">${title}</div>
    
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--b1);margin-bottom:12px">
      <span style="font-size:12px;color:var(--td)">ผู้บันทึก</span>
      <span style="font-size:12px;font-weight:600;color:var(--gold)">${S.session?.display_name || S.session?.user_id || 'auto'}</span>
    </div>
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--b1);margin-bottom:16px">
      <span style="font-size:12px;color:var(--td)">วันที่</span>
      <span style="font-size:12px;font-weight:600;color:var(--gold)">${todaySydney()} (auto)</span>
    </div>
    
    <div style="font-size:14px;font-weight:600;color:var(--td);margin-bottom:8px">เลือกสินค้า</div>
    <select class="form-input" id="wasteProduct" ${isEdit ? 'disabled style="opacity:.6"' : ''}>
      <option value="">🔍 เลือกสินค้า...</option>
      ${isEdit ? 
        `<option value="${editData.product_id}" selected>${prodEmoji((S.products.find(p=>p.product_id===editData.product_id)||{}).product_name||editData.product_id)} ${(S.products.find(p=>p.product_id===editData.product_id)||{}).product_name||editData.product_id}</option>` :
        wasteProducts.map(p => `<option value="${p.product_id}">${prodEmoji(p.product_name)} ${p.product_name} (${p.unit}) — ${p.section_id}</option>`).join('')
      }
    </select>
    ${wasteProducts.length === 0 && !isEdit ? '<div style="font-size:13px;color:var(--red);margin-top:4px">⚠️ ไม่พบสินค้าสำหรับ scope นี้</div>' : ''}
    
    <div class="form-group" style="margin-top:12px">
      <label class="form-label">จำนวน</label>
      <input class="form-input" type="number" id="wasteQty" min="1" placeholder="0" value="${isEdit ? editData.quantity : ''}" style="font-size:16px">
    </div>
    <div class="form-group">
      <label class="form-label">วันล็อคผลิต</label>
      <input class="form-input" type="date" id="wasteProdDate" value="${isEdit ? editData.production_date||'' : ''}" onclick="this.showPicker?.()">
    </div>
    <div class="form-group">
      <label class="form-label">สาเหตุ</label>
      <select class="form-input" id="wasteReason">
        <option value="Expired" ${isEdit && editData.reason==='Expired' ? 'selected' : ''}>Expired (หมดอายุ)</option>
        <option value="Damaged" ${isEdit && editData.reason==='Damaged' ? 'selected' : ''}>Damaged (เสียหาย)</option>
        <option value="Production Error" ${isEdit && editData.reason==='Production Error' ? 'selected' : ''}>Production Error (ผลิตเสีย)</option>
        <option value="Quality" ${isEdit && editData.reason==='Quality' ? 'selected' : ''}>Quality (คุณภาพไม่ผ่าน)</option>
      </select>
    </div>
    <div style="display:flex;gap:8px;margin-top:8px">
      <button class="btn btn-outline" style="flex:1" onclick="closeDialog()">ยกเลิก</button>
      <button class="btn btn-gold" style="flex:1" onclick="${btnAction}">${btnLabel}</button>
    </div>
  `);
}

function selectWasteCat(catId, keepProduct) {
  S.wasteSelectedCat = catId;
  // Update chip styles
  document.querySelectorAll('#wasteCatChips .filter-chip').forEach(el => {
    el.classList.toggle('bc-active', el.dataset.cat === catId);
  });
  
  // Filter products by category
  if (!keepProduct) {
    const filtered = S.products.filter(p => p.category_id === catId);
    const sel = document.getElementById('wasteProduct');
    if (sel && !sel.disabled) {
      sel.innerHTML = '<option value="">🔍 ค้นหา / เลือกสินค้า</option>' +
        filtered.map(p => `<option value="${p.product_id}">${prodEmoji(p.product_name)} ${p.product_name} (${p.unit})</option>`).join('');
    }
  }
}

function showWasteEdit(wasteId) {
  const w = (S.wasteLog || []).find(x => x.waste_id === wasteId);
  if (!w) { toast('ไม่พบข้อมูล', 'error'); return; }
  showWasteForm(w);
}

async function submitWaste() {
  const productId = document.getElementById('wasteProduct').value;
  const qty = document.getElementById('wasteQty').value;
  const reason = document.getElementById('wasteReason').value;
  const prodDate = document.getElementById('wasteProdDate').value;
  
  if (!productId || !qty) { toast('กรุณาเลือกสินค้าและจำนวน', 'error'); return; }
  
  try {
    const resp = await api('create_waste', {
      product_id: productId,
      quantity: parseInt(qty),
      reason: reason,
      production_date: prodDate,
    });
    toast(resp.message || '✅ บันทึกแล้ว', resp.success ? 'success' : 'error');
  } catch(e) {
    toast('❌ บันทึกไม่สำเร็จ', 'error');
  }
  
  closeDialog();
  if (S.currentScreen === 'waste') renderWaste();
}

async function saveWasteEdit(wasteId) {
  const qty = document.getElementById('wasteQty').value;
  const reason = document.getElementById('wasteReason').value;
  const prodDate = document.getElementById('wasteProdDate').value;
  
  if (!qty) { toast('กรุณาใส่จำนวน', 'error'); return; }
  
  try {
    const resp = await api('edit_waste', {
      waste_id: wasteId,
      quantity: parseInt(qty),
      reason: reason,
      production_date: prodDate,
    });
    toast(resp.message || '✅ แก้ไขแล้ว', resp.success ? 'success' : 'error');
  } catch(e) {
    toast('❌ แก้ไขไม่สำเร็จ', 'error');
  }
  
  closeDialog();
  if (S.currentScreen === 'waste') renderWaste();
}

async function deleteWaste(wasteId) {
  if (!confirm('ลบ waste ' + wasteId + ' ?')) return;
  try {
    const resp = await api('delete_waste', { waste_id: wasteId });
    toast(resp.message || '✅ ลบแล้ว', resp.success ? 'success' : 'error');
  } catch(e) {
    toast('❌ ลบไม่สำเร็จ', 'error');
  }
  if (S.currentScreen === 'waste') renderWaste();
}

// ─── RENDER: RETURNS ─────────────────────────────────────────

// v7.1: Store Returns — card list with border-left color + action buttons per card
function renderReturnsScreen() {
  const content = document.getElementById('returnsContent');
  const items = S.returns || [];

  const borderMap = { Reported:'var(--orange)', Received:'var(--blue)', Returning:'var(--orange)', Reworked:'var(--green)', Wasted:'var(--red)' };
  const isResolved = st => st === 'Reworked' || st === 'Wasted';

  content.innerHTML = `<div style="padding:16px 20px">
    <button class="btn btn-gold" style="margin-bottom:10px" onclick="showReturnForm()">➕ แจ้ง Return ใหม่</button>
    <div style="font-size:13px;font-weight:700;margin-bottom:6px">📋 รายการ Return (${items.length})</div>

    ${items.length === 0 ?
      '<div class="empty" style="padding:24px"><div class="empty-icon">✅</div><div class="empty-title">ไม่มี Return</div></div>' :
      `<div style="display:flex;flex-direction:column;gap:5px">${items.map(r => {
        const bdr = borderMap[r.status] || 'var(--bd)';
        const canEdit = r.status === 'Reported';
        const resolved = isResolved(r.status);
        const pName = r.product_name || r.product_id;
        const statusTag = returnStatusTag(r.status || 'Reported');
        const actionLabel = r.action === 'return_to_bakery' ? 'ส่งคืน BC' : r.action === 'discard_at_store' ? 'ทิ้งที่ร้าน' : '';

        return `<div style="padding:10px 12px;border:1px solid var(--bd2);border-left:3px solid ${bdr};border-radius:0 var(--rd) var(--rd) 0;${resolved?'opacity:.6':''}cursor:pointer">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
            <span style="font-size:13px;font-weight:700;color:${resolved?'var(--t3)':'var(--gold)'}">${r.return_id}</span>
            ${statusTag}
          </div>
          <div style="font-size:14px;font-weight:600">${prodEmoji(pName)} ${pName} ×${r.quantity} ${r.unit||''}</div>
          <div style="font-size:12px;color:var(--t3);margin-top:2px">${r.issue_type||''} · ${actionLabel} · ${formatDateAU(r.created_at)}</div>
          <div style="display:flex;gap:5px;margin-top:6px">
            <button class="btn btn-outline btn-sm" style="padding:3px 10px;font-size:12px" onclick="event.stopPropagation();showReturnDetail('${r.return_id}')">👁️ ดู Detail</button>
            ${canEdit ? `<button class="btn btn-outline btn-sm" style="padding:3px 10px;font-size:12px;color:var(--gold);border-color:var(--gold)" onclick="event.stopPropagation();showEditReturnForm('${r.return_id}')">✏️ แก้ไข</button>` :
              resolved ? '<span style="font-size:12px;color:var(--t4);padding:4px 0">✅ BC ดำเนินการแล้ว</span>' :
              '<span style="font-size:12px;color:var(--t4);padding:4px 0">🔒 BC รับแล้ว — แก้ไขไม่ได้</span>'}
          </div>
        </div>`;
      }).join('')}</div>`
    }
  </div>`;
}

function showReturnForm() {
  showDialog(`
    <div style="font-size:16px;font-weight:700;margin-bottom:16px">↩️ แจ้ง Return / Feedback</div>
    <div class="form-group">
      <label class="form-label">❶ สินค้า *</label>
      <select class="form-input" id="rtnProduct">
        <option value="">-- เลือก --</option>
        ${S.products.map(p => `<option value="${p.product_id}">${prodEmoji(p.product_name)} ${p.product_name} (${p.unit})</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">❷ จำนวนที่มีปัญหา *</label>
      <input class="form-input" type="number" id="rtnQty" min="1" placeholder="0" style="font-size:16px">
    </div>
    <div class="form-group">
      <label class="form-label">❸ ประเภทปัญหา</label>
      <select class="form-input" id="rtnIssue">
        <option value="quality">Quality (คุณภาพ)</option>
        <option value="quantity">Wrong quantity (จำนวนผิด)</option>
        <option value="wrong_product">Wrong product (สินค้าผิด)</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">❹ รายละเอียด</label>
      <textarea class="form-input" id="rtnDesc" placeholder="อธิบายปัญหา..."></textarea>
    </div>
    <div class="form-group">
      <label class="form-label">❺ Production Date (วันผลิตจากฉลาก)</label>
      <input class="form-input" type="date" id="rtnProdDate" onclick="this.showPicker?.()">
    </div>
    <div class="form-group">
      <label class="form-label">❻ การจัดการ</label>
      <select class="form-input" id="rtnAction">
        <option value="return_to_bakery">ส่งคืน BC</option>
        <option value="discard_at_store">ทิ้งที่ร้าน</option>
      </select>
    </div>
    <div style="display:flex;gap:8px;margin-top:8px">
      <button class="btn btn-outline" style="flex:1" onclick="closeDialog()">ยกเลิก</button>
      <button class="btn btn-gold" style="flex:1" onclick="submitReturn()">📤 ส่ง Return</button>
    </div>
  `);
}

async function submitReturn() {
  const data = {
    item_id: 'ITM-000000', // simplified
    product_id: document.getElementById('rtnProduct').value,
    quantity: parseInt(document.getElementById('rtnQty').value),
    issue_type: document.getElementById('rtnIssue').value,
    description: document.getElementById('rtnDesc').value,
    production_date: document.getElementById('rtnProdDate').value,
    action: document.getElementById('rtnAction').value,
  };
  
  if (!data.product_id || !data.quantity) {
    toast('กรุณากรอกข้อมูลให้ครบ', 'error');
    return;
  }
  
  try {
    const resp = await api('report_return', data);
    toast(resp.message || '✅ แจ้งแล้ว', resp.success ? 'success' : 'error');
    if (resp.success) await loadReturns();
  } catch(e) {
    toast('❌ เกิดข้อผิดพลาด: ' + (e.message||'ลองใหม่'), 'error');
  }
  
  closeDialog();
  renderReturnsScreen();
}


// v6.3.2: Return detail dialog (Store)
function showReturnDetail(returnId) {
  const r = (S.returns || []).find(x => x.return_id === returnId);
  if (!r) { toast('ไม่พบข้อมูล', 'error'); return; }

  const canEdit = r.status === 'Reported';
  const pName = r.product_name || r.product_id;
  const statusTag = returnStatusTag(r.status || 'Reported');

  const statusHistory = [
    `<div style="display:flex;gap:8px;align-items:center;margin-bottom:6px">
      <div style="width:8px;height:8px;border-radius:50%;background:var(--orange)"></div>
      <span style="font-size:14px"><strong>Reported</strong> — ${r.reported_by || 'Store'} · ${formatDate(r.created_at)}</span>
    </div>`,
    r.status !== 'Reported' ? `<div style="display:flex;gap:8px;align-items:center;margin-bottom:6px">
      <div style="width:8px;height:8px;border-radius:50%;background:var(--blue)"></div>
      <span style="font-size:14px"><strong>Received</strong> — BC ${r.resolved_by||''} · ${formatDate(r.resolved_at||r.updated_at)}</span>
    </div>` : '',
    (r.status === 'Reworked' || r.status === 'Wasted') ? `<div style="display:flex;gap:8px;align-items:center;margin-bottom:6px">
      <div style="width:8px;height:8px;border-radius:50%;background:${r.status==='Wasted'?'var(--red)':'var(--green)'}"></div>
      <span style="font-size:14px"><strong>${r.status}</strong> — ${r.resolved_by||'BC'} ${r.failure_reason ? '· '+r.failure_reason : ''}</span>
    </div>` : '',
  ].filter(Boolean).join('');

  showDialog(`
    <div class="dialog-title">↩️ ${r.return_id}</div>
    <div style="margin-bottom:12px">${statusTag}</div>
    <div style="font-size:13px;font-weight:600;margin-bottom:4px">${prodEmoji(pName)} ${pName}</div>
    <div style="font-size:14px;color:var(--td);margin-bottom:12px">
      จำนวน: ${r.quantity} · ${r.issue_type || ''}<br>
      ${r.description || r.detail || ''}<br>
      ${r.action === 'return_to_bakery' ? '📦 ส่งคืน BC' : '🗑️ ทิ้งที่ร้าน'}<br>
      ${r.production_date ? 'Production date: '+r.production_date : ''}
    </div>
    <div style="font-size:12px;font-weight:600;margin-bottom:6px">📊 Status Timeline</div>
    <div style="padding-left:4px;margin-bottom:16px">${statusHistory}</div>
    ${canEdit ? `<button class="btn btn-gold" onclick="showEditReturnForm('${r.return_id}')">✏️ แก้ไข</button>` : '<div style="font-size:13px;color:var(--td);text-align:center">BC ดำเนินการแล้ว ไม่สามารถแก้ไขได้</div>'}
    <button class="btn btn-outline" style="margin-top:8px" onclick="closeDialog()">← ปิด</button>
  `);
}

// v6.3.2: Edit return form (Store)
function showEditReturnForm(returnId) {
  closeDialog();
  const r = (S.returns || []).find(x => x.return_id === returnId);
  if (!r) return;

  showDialog(`
    <div class="dialog-title">✏️ แก้ไข ${r.return_id}</div>
    <div class="form-group">
      <label class="form-label">สินค้า</label>
      <select class="form-input" id="editRtnProduct">
        ${S.products.map(p => `<option value="${p.product_id}" ${p.product_id===r.product_id?'selected':''}>${p.product_name}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">จำนวน</label>
      <input class="form-input" type="number" id="editRtnQty" value="${r.quantity}" min="1">
    </div>
    <div class="form-group">
      <label class="form-label">ประเภทปัญหา</label>
      <select class="form-input" id="editRtnIssue">
        <option value="quality" ${r.issue_type==='quality'?'selected':''}>Quality</option>
        <option value="quantity" ${r.issue_type==='quantity'?'selected':''}>Wrong quantity</option>
        <option value="wrong_product" ${r.issue_type==='wrong_product'?'selected':''}>Wrong product</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">รายละเอียด</label>
      <textarea class="form-input" id="editRtnDesc">${r.description || r.detail || ''}</textarea>
    </div>
    <div style="display:flex;gap:8px;margin-top:8px">
      <button class="btn btn-outline" style="flex:1" onclick="closeDialog()">ยกเลิก</button>
      <button class="btn btn-gold" style="flex:1" onclick="submitEditReturn('${r.return_id}')">💾 บันทึก</button>
    </div>
  `);
}

async function submitEditReturn(returnId) {
  const body = {
    return_id: returnId,
    product_id: document.getElementById('editRtnProduct').value,
    quantity: parseInt(document.getElementById('editRtnQty').value),
    issue_type: document.getElementById('editRtnIssue').value,
    description: document.getElementById('editRtnDesc').value,
  };
  try {
    const resp = await api('edit_return', body);
    toast(resp.message || '✅ แก้ไขแล้ว', resp.success ? 'success' : 'error');
    if (resp.success) await loadReturns();
  } catch(e) {
    toast('❌ แก้ไขไม่สำเร็จ: ' + (e.message||'ลองใหม่'), 'error');
  }
  closeDialog();
  renderReturnsScreen();
}

// v6.3.2: Return Dashboard
async function renderReturnDashboard() {
  document.getElementById('returnDashSub').textContent = getScopeLabel();
  const el = document.getElementById('returnDashContent');
  el.innerHTML = '<div style="text-align:center;padding:40px"><div class="spinner"></div></div>';

  if (!S.returnDashDays) S.returnDashDays = 30;

  try {
    const resp = await api('get_return_dashboard', null, { days: String(S.returnDashDays) });
    if (!resp.success) { el.innerHTML = '<div class="pad" style="color:var(--red)">❌ ' + (resp.message || resp.error) + '</div>'; return; }

    const d = resp.data;
    const bs = d.byStatus || {};

    let html = `
      <div class="filter-bar">
        <div class="filter-chip ${S.returnDashDays===7?'active':''}" onclick="S.returnDashDays=7;renderReturnDashboard()">7 วัน</div>
        <div class="filter-chip ${S.returnDashDays===14?'active':''}" onclick="S.returnDashDays=14;renderReturnDashboard()">14 วัน</div>
        <div class="filter-chip ${S.returnDashDays===30?'active':''}" onclick="S.returnDashDays=30;renderReturnDashboard()">30 วัน</div>
      </div>`;

    // Summary cards — wireframe style
    html += `
      <div style="padding:0 16px 10px"><div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:6px">
        <div style="padding:10px;background:var(--red-bg);border-radius:var(--rd2);text-align:center">
          <div style="font-size:12px;color:var(--red);font-weight:600">TOTAL</div>
          <div style="font-size:22px;font-weight:800;color:var(--red)">${d.summary.total}</div>
        </div>
        <div style="padding:10px;background:var(--orange-bg);border-radius:var(--rd2);text-align:center">
          <div style="font-size:12px;color:var(--orange);font-weight:600">Reported</div>
          <div style="font-size:22px;font-weight:800;color:var(--orange)">${bs.Reported||0}</div>
        </div>
        <div style="padding:10px;background:var(--blue-bg);border-radius:var(--rd2);text-align:center">
          <div style="font-size:12px;color:var(--blue);font-weight:600">Received</div>
          <div style="font-size:22px;font-weight:800;color:var(--blue)">${bs.Received||0}</div>
        </div>
        <div style="padding:10px;background:var(--green-bg);border-radius:var(--rd2);text-align:center">
          <div style="font-size:12px;color:var(--green);font-weight:600">Resolved</div>
          <div style="font-size:22px;font-weight:800;color:var(--green)">${(bs.Reworked||0)+(bs.Wasted||0)}</div>
        </div>
      </div></div>`;

    // By Store
    const stores = d.byStore || [];
    if (stores.length > 0) {
      html += `<div class="sec-hd">🏪 แยกตามร้าน</div><div class="pad" style="padding-top:0">`;
      stores.forEach(s => {
        html += `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--b1)">
          <span style="font-size:12px;font-weight:600">${getStoreName(s.store_id)}</span>
          <span style="font-size:12px"><strong>${s.count}</strong> รายการ · ${s.qty} ชิ้น</span>
        </div>`;
      });
      html += '</div>';
    }

    // By Reason
    const reasons = d.byReason || [];
    if (reasons.length > 0) {
      const maxR = reasons[0].count;
      html += `<div class="sec-hd">⚠️ สาเหตุที่พบบ่อย</div><div class="pad" style="padding-top:0">`;
      const reasonColors = { quality: 'var(--red)', quantity: 'var(--orange)', wrong_product: 'var(--purple)', Other: 'var(--td)' };
      reasons.forEach(r => {
        const pct = Math.round((r.count / maxR) * 100);
        const color = reasonColors[r.reason] || 'var(--blue)';
        html += `<div style="margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px">
            <span>${r.reason}</span><span style="font-weight:600">${r.count} · ${r.qty} ชิ้น</span>
          </div>
          <div style="background:var(--s2);border-radius:4px;height:10px;overflow:hidden">
            <div style="background:${color};height:100%;width:${pct}%;border-radius:4px"></div>
          </div>
        </div>`;
      });
      html += '</div>';
    }

    // Top Returned Products
    const topP = d.topProducts || [];
    if (topP.length > 0) {
      html += `<div class="sec-hd">🔄 สินค้าที่ถูก Return บ่อย</div><div class="pad" style="padding-top:0">`;
      topP.forEach((p, idx) => {
        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '#'+(idx+1);
        html += `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--b1)">
          <span style="font-size:12px">${medal} <strong>${p.name}</strong> <span style="color:var(--td);font-size:13px">${p.section}</span></span>
          <span style="font-size:12px;color:var(--red);font-weight:600">${p.qty} ชิ้น (${p.count}x)</span>
        </div>`;
      });
      html += '</div>';
    }

    el.innerHTML = html;
  } catch(e) {
    // Fallback: build dashboard from local S.returns data
    const items = S.returns || [];
    el.innerHTML = `
      <div class="pad">
        <div class="sec-hd">📊 Return Dashboard</div>
        <div class="sum-grid">
          <div class="sum-card" style="border-left:3px solid var(--red)">
            <div class="sum-val">${items.length}</div><div class="sum-lbl">Returns ทั้งหมด</div>
          </div>
          <div class="sum-card" style="border-left:3px solid var(--orange)">
            <div class="sum-val">${items.filter(r=>r.status==='Reported').length}</div><div class="sum-lbl">Reported</div>
          </div>
          <div class="sum-card" style="border-left:3px solid var(--blue)">
            <div class="sum-val">${items.filter(r=>r.status==='Received').length}</div><div class="sum-lbl">Received</div>
          </div>
          <div class="sum-card" style="border-left:3px solid var(--green)">
            <div class="sum-val">${items.filter(r=>r.status==='Reworked'||r.status==='Wasted').length}</div><div class="sum-lbl">Resolved</div>
          </div>
        </div>
        <div style="font-size:13px;color:var(--td);text-align:center;padding:12px">⚠️ ข้อมูลจาก local cache · ใช้ API สำหรับรายงานแบบเต็ม</div>
      </div>`;
  }
}



// ═══════════════════════════════════════════════════════════════
// BAKERY CENTRE SCREENS (Phase C)
// ═══════════════════════════════════════════════════════════════

// ─── B1: BC HOME ────────────────────────────────────────────
function renderBcHome() {
  const s = S.session; if (!s) return;
  const dm = S.deptMapping || {};
  const scope = (dm.section_scope || []).join(', ') || 'all';

  const d = S.dashboard || { today_total:0, by_status:{}, cutoff_violations_today:0, urgent_items:0 };
  const bs = d.by_status || {};
  const done = (bs.Fulfilled||0) + (bs.Delivered||0);
  const total = d.today_total || 1;
  const pct = Math.round((done / total) * 100);
  const bcAdminMenus = getBcAdminMenus();

  // Alerts
  const alerts = [];
  if (bs.Pending > 0) alerts.push(`<div style="display:flex;align-items:center;gap:5px;padding:5px 8px;border-radius:var(--rd2);margin-bottom:2px;font-size:13px;font-weight:500;background:var(--red-bg);color:var(--red)">🚨 ${bs.Pending} order pending accept</div>`);
  if (d.urgent_items > 0) alerts.push(`<div style="display:flex;align-items:center;gap:5px;padding:5px 8px;border-radius:var(--rd2);margin-bottom:2px;font-size:13px;font-weight:500;background:#fef3c7;color:#92400e">⚡ ${d.urgent_items} urgent items</div>`);

  document.getElementById('bcHomeContent').innerHTML = `<div style="padding:16px 20px">
    <!-- KPI Pills -->
    <div style="display:flex;gap:5px;margin-bottom:10px;flex-wrap:wrap">
      <div style="padding:7px 12px;border-radius:var(--rd2);background:var(--red-bg)"><div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.3px;color:var(--red)">Pending</div><div style="font-size:16px;font-weight:800;color:var(--red)">${bs.Pending||0}</div></div>
      <div style="padding:7px 12px;border-radius:var(--rd2);background:var(--blue-bg)"><div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.3px;color:var(--blue)">Ordered</div><div style="font-size:16px;font-weight:800;color:var(--blue)">${bs.Ordered||0}</div></div>
      <div style="padding:7px 12px;border-radius:var(--rd2);background:var(--orange-bg)"><div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.3px;color:var(--orange)">In Progress</div><div style="font-size:16px;font-weight:800;color:var(--orange)">${bs.InProgress||0}</div></div>
      <div style="padding:7px 12px;border-radius:var(--rd2);background:var(--green-bg)"><div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.3px;color:var(--green)">Done</div><div style="font-size:16px;font-weight:800;color:var(--green)">${done}</div></div>
    </div>

    <!-- Progress bar -->
    <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--t3);font-weight:600;margin-bottom:2px"><span><span style="display:inline-block;width:4px;height:4px;border-radius:50%;background:var(--green);margin-right:2px"></span>Today</span><span style="color:var(--green)">${done}/${d.today_total}</span></div>
    <div style="height:4px;border-radius:2px;background:var(--s2);overflow:hidden;margin-bottom:8px"><div style="height:100%;border-radius:2px;width:${pct}%;background:linear-gradient(90deg,var(--green),#2ecc71)"></div></div>

    ${alerts.length > 0 ? `<div style="margin-bottom:8px">${alerts.join('')}</div>` : ''}

    <!-- Orders -->
    <div class="sec-hd" style="padding-left:0">Orders</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:10px">
      <div class="card" style="border-left:3px solid var(--blue)" onclick="showScreen('bc-orders')"><div style="display:flex;align-items:center;gap:8px"><div style="font-size:14px">📋</div><div style="flex:1"><div class="card-title" style="font-size:13px">View Orders</div><div class="card-desc" style="font-size:12px">ออเดอร์ ${scope} ทั้งหมด</div></div><div class="card-right" style="font-size:13px">→</div></div></div>
      <div class="card" onclick="showScreen('bc-stock')"><div style="display:flex;align-items:center;gap:8px"><div style="font-size:14px">📦</div><div style="flex:1"><div class="card-title" style="font-size:13px">Manage Stock</div><div class="card-desc" style="font-size:12px">เพิ่ม/ลดสต็อก</div></div><div class="card-right" style="font-size:13px">→</div></div></div>
      <div class="card" onclick="showScreen('bc-print')"><div style="display:flex;align-items:center;gap:8px"><div style="font-size:14px">🖨️</div><div style="flex:1"><div class="card-title" style="font-size:13px">Print Centre</div><div class="card-desc" style="font-size:12px">Production / Delivery Slip</div></div><div class="card-right" style="font-size:13px">→</div></div></div>
    </div>

    <!-- Records -->
    <div class="sec-hd" style="padding-left:0">Records</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:10px">
      <div class="card" onclick="showScreen('waste')"><div style="display:flex;align-items:center;gap:8px"><div style="font-size:14px">🗑️</div><div style="flex:1"><div class="card-title" style="font-size:13px">Record Waste</div><div class="card-desc" style="font-size:12px">ผลิตเสีย / เสียหาย / หมดอายุ</div></div><div class="card-right" style="font-size:13px">→</div></div></div>
      <div class="card" onclick="showScreen('bc-returns')"><div style="display:flex;align-items:center;gap:8px"><div style="font-size:14px">↩️</div><div style="flex:1"><div class="card-title" style="font-size:13px">Incoming Returns</div><div class="card-desc" style="font-size:12px">รับ-จัดการ return จากร้าน</div></div><div class="card-right" style="font-size:13px">→</div></div></div>
    </div>

    <!-- Dashboard -->
    <div class="sec-hd" style="padding-left:0">Dashboard</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:10px">
      <div class="card" onclick="showScreen('admin-top-products')"><div style="display:flex;align-items:center;gap:8px"><div style="font-size:14px">🏆</div><div style="flex:1"><div class="card-title" style="font-size:13px">Top Products</div><div class="card-desc" style="font-size:12px">สินค้ายอดนิยม</div></div><div class="card-right" style="font-size:13px">→</div></div></div>
      <div class="card" onclick="showScreen('admin-waste-dashboard')"><div style="display:flex;align-items:center;gap:8px"><div style="font-size:14px">🗑️</div><div style="flex:1"><div class="card-title" style="font-size:13px">Waste Dashboard</div><div class="card-desc" style="font-size:12px">สรุปของเสีย</div></div><div class="card-right" style="font-size:13px">→</div></div></div>
      <div class="card" onclick="showScreen('return-dashboard')"><div style="display:flex;align-items:center;gap:8px"><div style="font-size:14px">↩️</div><div style="flex:1"><div class="card-title" style="font-size:13px">Return Dashboard</div><div class="card-desc" style="font-size:12px">สรุป return ทั้งหมด</div></div><div class="card-right" style="font-size:13px">→</div></div></div>
    </div>

    ${bcAdminMenus}
  </div>`;
}
function getBcAdminMenus() {
  const s = S.session || {};
  const dm = S.deptMapping || {};
  const isBC = dm.module_role === 'bc_production' || dm.module_role === 'bc_management';
  const isMgmt = s.dept_id === 'management' || s.dept_id === 'bakery' || dm.module_role === 'bc_management';

  // Build scope label for dashboards
  let scopeLabel = '';
  if (isBC && isMgmt) {
    scopeLabel = 'ทุกร้าน · ทุก section';
  } else if (isBC) {
    const sc = (dm.section_scope || []).join(', ') || 'all';
    scopeLabel = `ทุกร้าน · section: ${sc}`;
  } else if (isMgmt) {
    scopeLabel = `${s.store_id} · ทุกแผนก`;
  } else {
    scopeLabel = `${s.store_id} / ${getDeptName(s.dept_id)}`;
  }

  // ── Group 1: Dashboard-type → ALWAYS visible (no tier check) ──
  const dashboardMenus = [
    { screen:'admin-dashboard', icon:'📊', bg:'var(--gold-bg)', title:'Dashboard', desc:`ภาพรวม — ${scopeLabel}` },
    { screen:'admin-top-products', icon:'🏆', bg:'var(--green-bg)', title:'Top Products', desc:`สินค้ายอดนิยม — ${scopeLabel}` },
    { screen:'admin-cutoff', icon:'⏰', bg:'var(--red-bg)', title:'Cutoff Violations', desc:`สั่งหลัง cutoff — ${scopeLabel}` },
    { screen:'admin-waste-dashboard', icon:'🗑️', bg:'var(--red-bg)', title:'Waste Dashboard', desc:`สรุปของเสีย — ${scopeLabel}` },
    { screen:'return-dashboard', icon:'↩️', bg:'var(--purple-bg)', title:'Return Dashboard', desc:`สินค้าส่งคืน — ${scopeLabel}` },
  ];

  // ── Group 2: Admin functions → tier-gated (hide if no permission) ──
  const adminMenus = [
    { screen:'admin-products', icon:'📦', bg:'var(--blue-bg)', title:'Manage Products', desc:'เพิ่ม/แก้/ปิด สินค้า ทุก section', perm:'fn_manage_products' },
    { screen:'admin-access', icon:'👥', bg:'var(--purple-bg)', title:'User Access', desc:'จัดการสิทธิ์ Function × Tier', perm:'fn_manage_permissions' },
    { screen:'admin-dept-mapping', icon:'🏢', bg:'var(--green-bg)', title:'Department Mapping', desc:'Dept → Role + Section scope', perm:'fn_manage_dept_mapping' },
    { screen:'admin-config', icon:'⚙️', bg:'var(--s2)', title:'System Config', desc:'Cutoff, Delivery, Auto Refresh', perm:'fn_manage_config' },
    { screen:'admin-notif-settings', icon:'🔔', bg:'var(--orange-bg)', title:'Notification Settings', desc:'เปิด/ปิดแจ้งเตือนตาม role', perm:'fn_manage_notifications' },
    { screen:'admin-audit', icon:'📝', bg:'rgba(8,145,178,0.1)', title:'Audit Trail', desc:'ประวัติเปลี่ยนสิทธิ์ + mapping', perm:'fn_view_all_orders' },
    { screen:'admin-announcements', icon:'📢', bg:'var(--gold-bg)', title:'Announcements', desc:'ตั้งประกาศ แจ้งเตือน กำหนด auto-expire', perm:'fn_manage_notifications' },
  ];
  const allowedAdmin = adminMenus.filter(m => hasAdminPerm(m.perm));

  const renderCard = (m) => `
    <div class="card" onclick="showScreen('${m.screen}')"><div style="display:flex;align-items:center;gap:8px"><div style="font-size:14px">${m.icon}</div><div style="flex:1"><div class="card-title" style="font-size:13px">${m.title}</div><div class="card-desc" style="font-size:12px">${m.desc}</div></div><div class="card-right" style="font-size:13px">→</div></div></div>`;

  let html = '';

  if (allowedAdmin.length > 0) {
    html += `
    <div style="padding:12px 16px;background:var(--purple-bg);border:1px dashed var(--purple);border-radius:var(--rd2);font-size:12px;color:var(--purple);margin-top:4px;margin-bottom:8px">👑 <b>Admin</b></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:10px">
      ${allowedAdmin.map(renderCard).join('')}
    </div>`;
  }

  return html;
}


// ─── PRINT SLIP 80x80mm ───────────────────────────────────
function printSlip80() {
  // v6.4: 80mm thermal print - body class constrains width + @page hint
  document.body.classList.add('slip-mode');
  const style = document.createElement('style');
  style.id = 'slip-page-style';
  style.textContent = '@page{size:80mm auto;margin:2mm}';
  document.head.appendChild(style);
  window.print();
  setTimeout(() => {
    document.body.classList.remove('slip-mode');
    const el = document.getElementById('slip-page-style');
    if (el) el.remove();
  }, 1500);
}

// ─── NOTIFICATIONS CHECK ─────────────────────────────────────
// ─── NOTIFICATION DISMISS SYSTEM ─────────────────────────────
// v6.4.4.4: Dismissed = {notif_id: timestamp} for 7-day expiry
function getDismissedMap() {
  try {
    const key = 'bc_dismissed_notifs_' + (S.session?.user_id || 'anon');
    const raw = JSON.parse(localStorage.getItem(key) || '{}');
    // Migrate: old array format → new object format
    if (Array.isArray(raw)) {
      const map = {};
      raw.forEach(id => { map[id] = Date.now(); });
      saveDismissedMap(map);
      return map;
    }
    return raw;
  } catch { return {}; }
}

function saveDismissedMap(map) {
  try {
    const key = 'bc_dismissed_notifs_' + (S.session?.user_id || 'anon');
    localStorage.setItem(key, JSON.stringify(map));
  } catch {}
}

// Compat wrapper: returns array of dismissed IDs (still within 7 days)
function getDismissedIds() {
  const map = getDismissedMap();
  const now = Date.now();
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
  return Object.keys(map).filter(id => (now - map[id]) < SEVEN_DAYS);
}

// Hidden = permanently deleted by user
function getHiddenIds() {
  try {
    const key = 'bc_hidden_notifs_' + (S.session?.user_id || 'anon');
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch { return []; }
}

function saveHiddenIds(ids) {
  try {
    const key = 'bc_hidden_notifs_' + (S.session?.user_id || 'anon');
    localStorage.setItem(key, JSON.stringify(ids));
  } catch {}
}

function saveDismissedIds(ids) {
  // Convert array calls to map format (set timestamp = now for new entries)
  const map = getDismissedMap();
  ids.forEach(id => { if (!map[id]) map[id] = Date.now(); });
  saveDismissedMap(map);
}

// v6.4.4: Generate live notifications from pending orders & returns
// v6.4.4.1: Personal notification preferences (localStorage per user)
function getNotifPrefs() {
  try {
    const key = 'bc_notif_prefs_' + (S.session?.user_id || 'anon');
    const stored = JSON.parse(localStorage.getItem(key) || '{}');
    // Defaults: all ON
    return {
      pending_order: stored.pending_order !== false,
      return_reported: stored.return_reported !== false,
      return_received: stored.return_received !== false,
      broadcast: stored.broadcast !== false,
    };
  } catch { return { pending_order:true, return_reported:true, return_received:true, broadcast:true }; }
}

function saveNotifPrefs(prefs) {
  try {
    const key = 'bc_notif_prefs_' + (S.session?.user_id || 'anon');
    localStorage.setItem(key, JSON.stringify(prefs));
  } catch {}
}

function buildLiveNotifs() {
  const notifs = [];
  const isBc = S.role === 'bc';
  const prefs = getNotifPrefs();

  // 1. Pending orders
  if (prefs.pending_order) {
    (S.orders || []).forEach(o => {
      if (o.status === 'Pending') {
        const items = o.items ? o.items.length : (o.item_count || '?');
        notifs.push({
          notif_id: 'live-pending-' + o.order_id,
          type: 'pending_order',
          title: 'PENDING ORDER !!',
          message: `${o.order_id} · ${getStoreName(o.store_id)} · ${items} รายการ`,
          created_at: o.created_at,
          _live: true, _ref_type: 'order', _ref_id: o.order_id
        });
      }
    });
  }

  // 2. Returns status=Reported
  if (prefs.return_reported) {
    (S.returns || []).forEach(r => {
      if (r.status === 'Reported') {
        notifs.push({
          notif_id: 'live-return-rpt-' + r.return_id,
          type: 'return_reported',
          title: 'RETURN REQUEST !!',
          message: `${r.return_id} · ${r.product_name || r.product_id} ×${r.quantity} · ${getStoreName(r.store_id)}`,
          created_at: r.created_at,
          _live: true, _ref_type: 'return', _ref_id: r.return_id
        });
      }
    });
  }

  // 3. Returns status=Received → BC only
  if (prefs.return_received) {
    (S.returns || []).forEach(r => {
      if (r.status === 'Received' && isBc) {
        notifs.push({
          notif_id: 'live-return-rcv-' + r.return_id,
          type: 'return_received',
          title: 'RETURN RECEIVED !!',
          message: `${r.return_id} · ${r.product_name || r.product_id} ×${r.quantity} · รับของแล้ว รอ Rework/Waste`,
          created_at: r.created_at,
          _live: true, _ref_type: 'return', _ref_id: r.return_id
        });
      }
    });
  }

  return notifs;
}

// v6.4.4: Get all notifications (broadcast + live), respecting user prefs
// v6.4.4.4: Filter out hidden (deleted) notifications
function getAllNotifs() {
  const prefs = getNotifPrefs();
  const broadcasts = prefs.broadcast ? (S.notifications || []) : [];
  const hidden = getHiddenIds();
  return [...broadcasts, ...buildLiveNotifs()].filter(n => !hidden.includes(n.notif_id));
}

function getUnreadNotifs() {
  const dismissed = getDismissedIds();
  return getAllNotifs().filter(n => !dismissed.includes(n.notif_id));
}

function dismissNotif(notifId) {
  const map = getDismissedMap();
  if (!map[notifId]) map[notifId] = Date.now();
  saveDismissedMap(map);
  checkNotifications();
  const ov = document.getElementById('overlay');
  if (ov && ov.classList.contains('show')) showNotifPanel();
}

function undismissNotif(notifId) {
  const map = getDismissedMap();
  delete map[notifId];
  saveDismissedMap(map);
  checkNotifications();
  const ov = document.getElementById('overlay');
  if (ov && ov.classList.contains('show')) showNotifPanel();
}

function hideNotif(notifId) {
  const hidden = getHiddenIds();
  if (!hidden.includes(notifId)) hidden.push(notifId);
  saveHiddenIds(hidden);
  checkNotifications();
  const ov = document.getElementById('overlay');
  if (ov && ov.classList.contains('show')) showNotifPanel();
}

function dismissAllNotifs() {
  const map = getDismissedMap();
  getAllNotifs().forEach(n => {
    if (n.notif_id && !map[n.notif_id]) map[n.notif_id] = Date.now();
  });
  saveDismissedMap(map);
  checkNotifications();
  showNotifPanel();
}

let _toastShownIds = new Set(); // track per-session toast shown

function checkNotifications() {
  const unread = getUnreadNotifs();
  const count = unread.length;
  
  // Update bell badges on both home screens
  ['homeBellBadge','bcHomeBellBadge'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (count > 0) { el.style.display = 'flex'; el.textContent = count > 9 ? '9+' : count; }
      else { el.style.display = 'none'; }
    }
  });
  
  // v6.4.4: Show toast for NEW unread (once per session per notif_id)
  unread.forEach(n => {
    if (n.notif_id && !_toastShownIds.has(n.notif_id)) {
      _toastShownIds.add(n.notif_id);
      const icon = n.type === 'pending_order' ? '📋' : n.type === 'return_reported' ? '↩️' : n.type === 'return_received' ? '📥' : '📢';
      setTimeout(() => toast(icon + ' ' + (n.title || n.message), 'warning'), 500);
    }
  });
}

function showNotifPanel() {
  const dismissed = getDismissedIds();
  const allNotifs = getAllNotifs();
  const unread = allNotifs.filter(n => !dismissed.includes(n.notif_id));
  const read = allNotifs.filter(n => dismissed.includes(n.notif_id));
  
  // v6.4.4.4: Sort by date (newest first) within each group
  const byDate = (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0);
  unread.sort(byDate);
  read.sort(byDate);
  
  const typeIcon = (n) => n.type === 'pending_order' ? '📋' : n.type === 'return_reported' ? '↩️' : n.type === 'return_received' ? '📥' : n.type === 'broadcast' ? '📢' : '🔔';
  
  const renderItem = (n, isRead) => {
    const bg = isRead ? '' : 'background:var(--gold-bg);';
    const opa = isRead ? 'opacity:0.6;' : '';
    const envelope = isRead ? '📧' : '✉️';
    const envAction = isRead ? `undismissNotif('${n.notif_id}')` : `dismissNotif('${n.notif_id}')`;
    // v6.4.4.3: Clickable ref link for orders/returns
    let msgHtml = n.message;
    if (n._ref_type === 'order' && n._ref_id) {
      msgHtml = n.message.replace(n._ref_id, `<span style="color:var(--blue);text-decoration:underline;cursor:pointer;font-weight:600" onclick="closeDialog();viewOrderDetail('${n._ref_id}')">${n._ref_id}</span>`);
    } else if (n._ref_type === 'return' && n._ref_id) {
      msgHtml = n.message.replace(n._ref_id, `<span style="color:var(--blue);text-decoration:underline;cursor:pointer;font-weight:600" onclick="closeDialog();showReturnDetail('${n._ref_id}')">${n._ref_id}</span>`);
    }
    return `<div style="display:flex;align-items:start;padding:12px 16px;border-bottom:1px solid var(--b1);${bg}${opa}">
      <div style="flex:1">
        <div style="font-size:12px;font-weight:600">${typeIcon(n)} ${n.title || n.type}</div>
        <div style="font-size:14px;color:var(--td);margin-top:2px">${msgHtml}</div>
        ${n.created_at ? `<div style="font-size:13px;color:var(--tm);margin-top:4px">${new Date(n.created_at).toLocaleString('th-TH')}</div>` : ''}
      </div>
      <div style="display:flex;gap:2px;flex-shrink:0;align-items:center">
        <div onclick="${envAction}" style="cursor:pointer;font-size:18px;padding:2px 4px" title="${isRead ? 'Mark unread' : 'Mark read'}">${envelope}</div>
        <div onclick="hideNotif('${n.notif_id}')" style="cursor:pointer;font-size:14px;padding:2px 4px;color:var(--red)" title="Delete">🗑️</div>
      </div>
    </div>`;
  };
  
  let items = '';
  
  if (unread.length === 0 && read.length === 0) {
    items = '<div style="text-align:center;padding:40px 20px;color:var(--td)"><div style="font-size:36px;margin-bottom:8px">🔔</div>No notifications</div>';
  } else {
    if (unread.length > 0) {
      items += `<div style="padding:6px 16px;font-size:13px;color:var(--gold);background:var(--gold-bg);font-weight:600">NEW (${unread.length})</div>`;
      items += unread.map(n => renderItem(n, false)).join('');
    }
    if (read.length > 0) {
      items += `<div style="padding:6px 16px;font-size:13px;color:var(--td);background:var(--s2)">READ (${read.length})</div>`;
      items += read.map(n => renderItem(n, true)).join('');
    }
  }
  
  const isT1 = (S.session?.tier_id || '').toUpperCase() === 'T1';
  
  showDialog(`
    <div style="text-align:center;margin-bottom:12px"><span style="font-size:20px">🔔</span> <span style="font-size:16px;font-weight:700">Notifications</span> ${unread.length > 0 ? `<span style="background:var(--red);color:#fff;border-radius:10px;padding:2px 8px;font-size:13px;margin-left:4px">${unread.length} new</span>` : ''}</div>
    <div style="max-height:60vh;overflow-y:auto;border-radius:8px;border:1px solid var(--b1)">${items}</div>
    <div style="display:flex;gap:8px;margin-top:12px">
      ${unread.length > 0 ? `<button class="btn btn-gold" style="flex:1" onclick="dismissAllNotifs()">✓ Read all</button>` : ''}
      ${isT1 ? `<button class="btn btn-outline" style="flex:1" onclick="showNotifSettings()">⚙️ Settings</button>` : ''}
      <button class="btn btn-outline" style="flex:1" onclick="closeDialog()">Close</button>
    </div>
  `);
}

// v6.4.4.1: Personal notification settings dialog
function showNotifSettings() {
  const prefs = getNotifPrefs();
  const isBc = S.role === 'bc';

  const items = [
    { key:'pending_order', icon:'📋', label:'ออเดอร์ Pending', desc:'แจ้งเมื่อมีออเดอร์สถานะ Pending' },
    { key:'return_reported', icon:'↩️', label:'Return ใหม่ (Reported)', desc:'แจ้งเมื่อมีสินค้า return เข้า' },
  ];
  if (isBc) {
    items.push({ key:'return_received', icon:'📥', label:'Return รอจัดการ (Received)', desc:'แจ้งเมื่อ return รับของแล้ว รอ Rework/Waste' });
  }
  items.push({ key:'broadcast', icon:'📢', label:'ประกาศทั่วไป', desc:'แจ้งเตือนจากระบบ / Admin' });

  const toggleHtml = items.map(i => {
    const on = prefs[i.key];
    return `<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--b1)">
      <div style="flex:1">
        <div style="font-size:12px;font-weight:600">${i.icon} ${i.label}</div>
        <div style="font-size:13px;color:var(--td);margin-top:2px">${i.desc}</div>
      </div>
      <div onclick="toggleNotifPref('${i.key}',${!on})" style="cursor:pointer;width:48px;height:28px;border-radius:14px;position:relative;flex-shrink:0;margin-left:12px;
        background:${on?'var(--green)':'var(--b2)'};transition:.2s">
        <div style="position:absolute;top:2px;${on?'right:2px':'left:2px'};width:24px;height:24px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.2);transition:.2s"></div>
      </div>
    </div>`;
  }).join('');

  showDialog(`
    <div style="text-align:center;margin-bottom:12px"><span style="font-size:20px">⚙️</span> <span style="font-size:16px;font-weight:700">ตั้งค่าแจ้งเตือน</span></div>
    <div style="padding:0 4px">${toggleHtml}</div>
    <div style="margin-top:16px">
      <button class="btn btn-gold" onclick="showNotifPanel()">← กลับ</button>
    </div>
  `);
}

function toggleNotifPref(key, enabled) {
  const prefs = getNotifPrefs();
  prefs[key] = enabled;
  saveNotifPrefs(prefs);
  toast((enabled ? 'เปิด' : 'ปิด') + 'แจ้งเตือนแล้ว', 'success');
  showNotifSettings(); // re-render toggle
  checkNotifications(); // update badge
}

// B-01: Auto-poll notifications + dashboard every 60s
let _pollInterval = null;
function startPolling() {
  if (_pollInterval) clearInterval(_pollInterval);
  _pollInterval = setInterval(async () => {
    try {
      // Only refresh data that's already loaded (lazy load compatible)
      await loadNotifications();
      if (S._ordersLoaded) await loadOrders();
      if (S._returnsLoaded) await loadReturns();
      checkNotifications();
      if (S.currentScreen === 'home' || S.currentScreen === 'bc-home') {
        await loadDashboard();
        if (S.currentScreen === 'home') renderHomeDashboard();
      }
    } catch(e) { /* silent fail */ }
  }, 60000);
}

function stopPolling() {
  if (_pollInterval) { clearInterval(_pollInterval); _pollInterval = null; }
}

// ─── SESSION MONITOR ────────────────────────────────────────
let _sessionCheckInterval = null;
function startSessionMonitor() {
  if (_sessionCheckInterval) clearInterval(_sessionCheckInterval);
  _sessionCheckInterval = setInterval(() => {
    const expiresAt = S.session?.expires_at;
    if (!expiresAt) return;
    
    const remaining = new Date(expiresAt).getTime() - Date.now();
    const mins = Math.round(remaining / 60000);
    
    if (remaining <= 0) {
      // Session expired
      clearInterval(_sessionCheckInterval);
      stopPolling();
      localStorage.removeItem('spg_token');
      showScreen('invalid-token');
      toast('⏰ Session หมดอายุ กรุณา login ใหม่', 'error');
    } else if (remaining <= 10 * 60000 && remaining > 9.5 * 60000) {
      // 10 min warning
      toast(`⏰ Session จะหมดอายุใน ${mins} นาที`, 'warning');
    }
  }, 30000); // check every 30s
}

