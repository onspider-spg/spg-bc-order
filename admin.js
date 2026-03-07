// Version 6.5.5 | 6 MAR 2026 | Siam Palette Group
// BC Order — admin.js: Admin Menu, A1-A9 Panels

// ─── ADMIN SCREEN RENDERERS (A1-A9) ────────────────────────
function renderAdminDashboard() {
  const d = S.dashboard || {};
  const bs = d.by_status || {};
  const total = d.today_total || 0;
  const fulfilRate = total > 0 ? Math.round(((bs.Delivered||0)/(total))*100) : 0;
  document.getElementById('adminDashboardContent').innerHTML = `
    <div class="sec-hd">📊 ภาพรวมวันนี้ — ทุกร้าน</div>
    <div class="sum-grid">
      <div class="sum-card"><div class="sum-num">${total}</div><div class="sum-label">ออเดอร์</div></div>
      <div class="sum-card"><div class="sum-num" style="color:var(--orange)">${bs.Pending||0}</div><div class="sum-label">Pending</div></div>
      <div class="sum-card"><div class="sum-num" style="color:var(--blue)">${bs.Ordered||0}</div><div class="sum-label">Ordered</div></div>
      <div class="sum-card"><div class="sum-num" style="color:var(--green)">${(bs.Fulfilled||0)+(bs.Delivered||0)}</div><div class="sum-label">Done</div></div>
    </div>
    <div class="sec-hd">📈 Performance</div>
    <div class="pad">
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <div class="card" style="flex:1;min-width:140px;text-align:center;padding:16px">
          <div style="font-size:28px;font-weight:700;color:var(--green)">${fulfilRate}%</div>
          <div style="font-size:11px;color:var(--td)">Fulfilment Rate</div>
        </div>
        <div class="card" style="flex:1;min-width:140px;text-align:center;padding:16px">
          <div style="font-size:28px;font-weight:700;color:var(--red)">${d.cutoff_violations_today||0}</div>
          <div style="font-size:11px;color:var(--td)">Cutoff Violations</div>
        </div>
        <div class="card" style="flex:1;min-width:140px;text-align:center;padding:16px">
          <div style="font-size:28px;font-weight:700;color:var(--orange)">${d.urgent_items||0}</div>
          <div style="font-size:11px;color:var(--td)">URGENT Items</div>
        </div>
      </div>
    </div>
    <div class="sec-hd">🏪 Orders by Store</div>
    <div class="pad">${renderStoreBreakdown()}</div>
    <div class="sec-hd">🔗 Quick Links</div>
    <div class="pad" style="padding-top:0;display:flex;gap:8px">
      <div class="card" style="flex:1;text-align:center;padding:14px;cursor:pointer" onclick="showScreen('admin-waste-dashboard')">
        <div style="font-size:22px">🗑️</div>
        <div style="font-size:11px;font-weight:600;margin-top:4px">Waste</div>
      </div>
      <div class="card" style="flex:1;text-align:center;padding:14px;cursor:pointer" onclick="showScreen('admin-top-products')">
        <div style="font-size:22px">🏆</div>
        <div style="font-size:11px;font-weight:600;margin-top:4px">Top Products</div>
      </div>
      <div class="card" style="flex:1;text-align:center;padding:14px;cursor:pointer" onclick="showScreen('admin-announcements')">
        <div style="font-size:22px">📢</div>
        <div style="font-size:11px;font-weight:600;margin-top:4px">Announcements</div>
      </div>
    </div>`;
}

function renderStoreBreakdown() {
  const orders = S.orders || [];
  const stores = {};
  orders.forEach(o => {
    if (!stores[o.store_id]) stores[o.store_id] = { total:0, pending:0, ordered:0, done:0 };
    stores[o.store_id].total++;
    if (o.status === 'Pending') stores[o.store_id].pending++;
    else if (o.status === 'Ordered') stores[o.store_id].ordered++;
    else stores[o.store_id].done++;
  });
  if (Object.keys(stores).length === 0) return '<div style="color:var(--td);font-size:12px;padding:12px">ยังไม่มีออเดอร์วันนี้</div>';
  return Object.entries(stores).map(([sid, s]) => `
    <div class="card" style="margin-bottom:6px">
      <div class="card-row">
        <div class="card-body">
          <div class="card-title">${getStoreName(sid)}</div>
          <div class="card-desc">${s.total} orders · ${s.pending} pending · ${s.ordered} ordered · ${s.done} done</div>
        </div>
      </div>
    </div>`).join('');
}

// ─── A3: Product Management ──────────────────────────────────
async function renderAdminProducts() {
  const el = document.getElementById('adminProductsContent');
  el.innerHTML = '<div style="text-align:center;padding:40px"><div class="spinner"></div></div>';
  
  // Reload products to get latest
  try { await loadProducts(); } catch(e) {}
  
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
    <div style="display:flex;gap:8px;padding:12px;align-items:center">
      <div class="dpill ${tab==='active'?'active':''}" onclick="S.adminProductTab='active';renderAdminProducts()">Active (${active.length})</div>
      <div class="dpill ${tab==='inactive'?'active':''}" onclick="S.adminProductTab='inactive';renderAdminProducts()">Inactive (${inactive.length})</div>
      <div style="flex:1"></div>
      <button class="btn btn-gold btn-sm" onclick="showAddProductForm()">+ Add</button>
    </div>
    <div class="search-wrap"><input class="search-input" placeholder="🔍 ค้นหาสินค้า..." value="${S.adminProductSearch}" oninput="S.adminProductSearch=this.value;renderAdminProducts()"></div>
    <div class="pad" style="padding-top:0">
      ${filtered.length === 0 ? '<div style="text-align:center;padding:30px;color:var(--td);font-size:12px">ไม่พบสินค้า</div>' :
      filtered.map(p => {
        const isAct = p.is_active === true || p.is_active === 'TRUE';
        return `<div class="card" style="margin-bottom:4px">
          <div class="card-row">
            <div class="card-icon" style="background:var(--s2)">${prodEmoji(p.product_name)}</div>
            <div class="card-body">
              <div class="card-title">${p.product_name}</div>
              <div class="card-desc">${p.cat_id||p.category_id||'-'} · ${p.unit} · min:${p.min_order} step:${p.order_step||1} · ${p.section_id||'-'}</div>
            </div>
            <div style="display:flex;gap:6px;align-items:center">
              <div onclick="showEditProductForm('${p.product_id}')" style="cursor:pointer;font-size:9px;padding:4px 8px;border-radius:8px;background:var(--blue-bg);color:var(--blue);font-weight:600">✏️</div>
              <div onclick="toggleProduct('${p.product_id}',${!isAct})" style="cursor:pointer;font-size:9px;padding:4px 10px;border-radius:10px;background:${isAct?'var(--green-bg)':'var(--red-bg)'};color:${isAct?'var(--green)':'var(--red)'};font-weight:600">${isAct?'✅ Active':'❌ Off'}</div>
            </div>
          </div>
        </div>`;
      }).join('')}
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
  
  document.getElementById('productEditTitle').textContent = isEdit ? '✏️ ' + p.product_name : '➕ เพิ่มสินค้าใหม่';
  
  // Load visibility if editing
  if (isEdit && S._editVisibility.length === 0) {
    el.innerHTML = '<div style="text-align:center;padding:40px"><div class="spinner"></div></div>';
    try {
      const resp = await api('get_product_visibility', null, { product_id: p.product_id });
      if (resp.success) S._editVisibility = resp.data || [];
    } catch(e) {}
  }
  
  const cats = S.categories || [];
  const sections = ['cake', 'sauce'];
  const stores = [
    { id:'MNG', name:'🥭 Mango Coco', depts:['dessert','drink'] },
    { id:'ISH', name:'🍣 Issho Cafe', depts:['dessert','drink'] },
    { id:'GB',  name:'🥞 Golden Brown', depts:['dessert','drink'] },
    { id:'TMC', name:'🧀 Melting Cheese', depts:['dessert','drink'] },
    { id:'RW',  name:'🍜 Red Wok', depts:['dessert','drink'] },
  ];
  
  const imgUrl = isEdit ? (p.image_url || '') : '';
  
  el.innerHTML = `
    <div class="pad">
      ${isEdit ? `<div style="font-size:10px;color:var(--td);margin-bottom:12px;background:var(--s2);padding:8px 12px;border-radius:8px">🆔 ${p.product_id}</div>` : ''}
      
      <!-- Image Preview -->
      <div style="text-align:center;margin-bottom:16px">
        <div id="imgPreview" style="width:120px;height:120px;border-radius:16px;margin:0 auto 8px;background:var(--s2);display:flex;align-items:center;justify-content:center;overflow:hidden;border:2px dashed var(--b2)">
          ${imgUrl ? `<img src="${imgUrl}" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.innerHTML='${prodEmoji(isEdit ? p.product_name : '')}'" />` : `<span style="font-size:48px">${isEdit ? prodEmoji(p.product_name) : '📦'}</span>`}
        </div>
      </div>
      
      <div class="form-group">
        <label class="form-label">🖼️ Image URL</label>
        <input class="form-input" id="prdImage" placeholder="https://example.com/image.jpg" value="${imgUrl}" oninput="previewProductImage(this.value)">
        <div style="font-size:9px;color:var(--td);margin-top:2px">วาง URL รูปสินค้า จะแสดงในหน้าสั่งของ + Production Sheet</div>
      </div>
      
      <div class="form-group">
        <label class="form-label">ชื่อสินค้า *</label>
        <input class="form-input" id="prdName" placeholder="เช่น Carrot Cake" value="${isEdit ? p.product_name : ''}">
      </div>
      
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div class="form-group">
          <label class="form-label">Category</label>
          <select class="form-input" id="prdCat">
            ${cats.map(c => `<option value="${c.cat_id||c.category_id}" ${isEdit && (p.cat_id||p.category_id)===(c.cat_id||c.category_id)?'selected':''}>${c.cat_name||c.category_name||c.cat_id}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Section (ทีมผลิต) *</label>
          <select class="form-input" id="prdSection">
            ${sections.map(s => `<option value="${s}" ${isEdit && p.section_id===s?'selected':''}>${s === 'cake' ? '🎂 cake' : '🫕 sauce'}</option>`).join('')}
          </select>
        </div>
      </div>
      
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
        <div class="form-group">
          <label class="form-label">หน่วย</label>
          <input class="form-input" id="prdUnit" placeholder="pieces" value="${isEdit ? p.unit||'pieces' : 'pieces'}">
        </div>
        <div class="form-group">
          <label class="form-label">สั่งขั้นต่ำ</label>
          <input class="form-input" type="number" id="prdMin" min="1" value="${isEdit ? p.min_order||1 : 1}">
        </div>
        <div class="form-group">
          <label class="form-label">Step</label>
          <input class="form-input" type="number" id="prdStep" min="1" value="${isEdit ? p.order_step||1 : 1}">
        </div>
      </div>
      
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div class="form-group">
          <label class="form-label">สั่งสูงสุด</label>
          <input class="form-input" type="number" id="prdMax" min="1" value="${isEdit ? p.max_order||100 : 100}">
        </div>
        <div class="form-group">
          <label class="form-label">Allow Stock</label>
          <select class="form-input" id="prdStock">
            <option value="true" ${isEdit && p.allow_stock?'selected':''}>Yes</option>
            <option value="false" ${isEdit && !p.allow_stock?'selected':''}>No</option>
          </select>
        </div>
      </div>
      
      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea class="form-input" id="prdDesc" rows="2" placeholder="รายละเอียดสินค้า">${isEdit ? p.description||'' : ''}</textarea>
      </div>
    </div>
    
    <!-- Visibility Section -->
    <div class="sec-hd">👁️ ร้านที่เห็นสินค้านี้</div>
    <div class="pad" style="padding-top:0">
      <div style="font-size:10px;color:var(--td);margin-bottom:8px">เลือกร้าน + แผนกที่สามารถสั่งสินค้านี้ได้</div>
      ${stores.map(store => {
        return store.depts.map(dept => {
          const vis = S._editVisibility.find(v => v.store_id === store.id && v.dept_id === dept);
          const checked = vis ? vis.is_active : (!isEdit); // new product = all checked by default
          return `
          <div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--s2)">
            <input type="checkbox" id="vis_${store.id}_${dept}" ${checked ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--gold)">
            <label for="vis_${store.id}_${dept}" style="flex:1;font-size:12px;cursor:pointer">
              <span style="font-weight:600">${store.name}</span>
              <span style="color:var(--td);font-size:10px"> · ${dept}</span>
            </label>
          </div>`;
        }).join('');
      }).join('')}
      <div style="display:flex;gap:8px;margin-top:8px">
        <div style="font-size:10px;color:var(--blue);cursor:pointer" onclick="toggleAllVis(true)">✅ เลือกทั้งหมด</div>
        <div style="font-size:10px;color:var(--red);cursor:pointer" onclick="toggleAllVis(false)">❌ ยกเลิกทั้งหมด</div>
      </div>
    </div>
    
    <!-- Submit -->
    <div class="pad" style="padding-bottom:40px">
      <button class="btn btn-gold" style="width:100%;padding:14px" onclick="submitProductEdit(${isEdit ? `'${p.product_id}'` : 'null'})">${isEdit ? '💾 บันทึกการแก้ไข' : '➕ เพิ่มสินค้า'}</button>
      ${isEdit ? `<button class="btn btn-outline" style="width:100%;margin-top:8px;color:var(--red);border-color:var(--red)" onclick="toggleProduct('${p.product_id}',${!(p.is_active===true||p.is_active==='TRUE')});showScreen('admin-products')">${p.is_active===true||p.is_active==='TRUE' ? '🔇 ปิดสินค้านี้' : '🔔 เปิดสินค้านี้'}</button>` : ''}
    </div>
  `;
}

function previewProductImage(url) {
  const preview = document.getElementById('imgPreview');
  if (!preview) return;
  if (url && url.startsWith('http')) {
    preview.innerHTML = `<img src="${url}" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.innerHTML='❌'" />`;
  } else {
    const name = document.getElementById('prdName')?.value || '';
    preview.innerHTML = `<span style="font-size:48px">${prodEmoji(name) || '📦'}</span>`;
  }
}

function toggleAllVis(on) {
  document.querySelectorAll('[id^="vis_"]').forEach(el => { el.checked = on; });
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
      <div style="padding:8px 12px;font-size:10px;color:var(--td)">กดเพื่อ toggle ON/OFF — เฉพาะ T1/T2 เท่านั้น</div>
      <div style="overflow-x:auto;padding:0 8px">
        <table style="width:100%;border-collapse:collapse;font-size:11px;min-width:500px">
          <thead>
            <tr style="background:var(--s2)">
              <th style="padding:8px;text-align:left;font-weight:600;position:sticky;left:0;background:var(--s2);z-index:1">Function</th>
              ${tiers.map(t => `<th style="padding:8px;text-align:center;font-weight:600;min-width:36px">${t}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${functions.map(fn => `<tr style="border-bottom:1px solid var(--s2)">
              <td style="padding:6px 8px;font-weight:500;position:sticky;left:0;background:var(--bg);z-index:1;font-size:10px" title="${fn.description||''}">${fn.function_name || fn.function_id}</td>
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
    
    el.innerHTML = `
      <div class="sec-hd">🏢 Department Mappings (${mappings.length})</div>
      <div class="pad">
        ${mappings.map(m => `<div class="card" style="margin-bottom:6px;${m.is_active?'':'opacity:.5;border-left:3px solid var(--red)'}">
          <div class="card-row">
            <div class="card-body">
              <div class="card-title">${m.dept_id}</div>
              <div class="card-desc">
                <span style="padding:1px 6px;border-radius:4px;font-size:9px;font-weight:600;background:${(roleColors[m.module_role]||'var(--td)')+'20'};color:${roleColors[m.module_role]||'var(--td)'}">${m.module_role}</span>
                · scope: <strong>${m.section_scope || '-'}</strong>
              </div>
            </div>
            <div style="display:flex;gap:4px;flex-shrink:0">
              <div onclick="editDeptMapping('${m.dept_id}','${m.module_role}','${m.section_scope||''}',${!!m.is_active})" style="cursor:pointer;font-size:12px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:6px;background:var(--s2)">✏️</div>
              <div onclick="toggleDeptActive('${m.dept_id}',${!m.is_active})" style="cursor:pointer;font-size:9px;padding:4px 8px;border-radius:8px;font-weight:600;
                background:${m.is_active?'var(--green-bg)':'var(--red-bg)'};color:${m.is_active?'var(--green)':'var(--red)'}">${m.is_active?'ON':'OFF'}</div>
            </div>
          </div>
        </div>`).join('')}
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
  
  el.innerHTML = `
    <div class="sec-hd">⚙️ System Configuration</div>
    <div class="pad">
      ${items.map(i => `<div class="card" style="padding:16px;margin-bottom:8px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
          <div style="font-size:12px;font-weight:600">${i.label}</div>
          <div onclick="editConfig('${i.key}','${config[i.key]||''}','${i.type}')" style="cursor:pointer;font-size:10px;padding:2px 8px;border-radius:6px;background:var(--gold-bg);color:var(--gold);font-weight:600">✏️ แก้</div>
        </div>
        <div style="font-size:18px;font-weight:700;color:var(--blue)">${config[i.key] || '-'}</div>
        <div style="font-size:10px;color:var(--td);margin-top:2px">${i.desc}</div>
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
    
    el.innerHTML = `
      <div style="padding:8px 12px;font-size:10px;color:var(--td)">กดเพื่อ toggle ON/OFF</div>
      ${groups.map(g => `
        <div class="sec-hd">${g.title}</div>
        <div class="pad" style="padding-top:0">
          ${g.items.map(i => {
            const on = settings[i.key] !== false;
            return `<div class="card" style="margin-bottom:4px">
              <div class="card-row">
                <div class="card-body">
                  <div class="card-title">${i.label}</div>
                  <div class="card-desc">${i.desc}</div>
                </div>
                <div onclick="toggleNotifSetting('${i.key}',${!on})" style="cursor:pointer;width:48px;height:28px;border-radius:14px;position:relative;
                  background:${on?'var(--green)':'var(--b2)'};transition:.2s">
                  <div style="position:absolute;top:2px;${on?'right:2px':'left:2px'};width:24px;height:24px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.2);transition:.2s"></div>
                </div>
              </div>
            </div>`;
          }).join('')}
        </div>
      `).join('')}`;
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
  
  // Group by created_by
  const byUser = {};
  violations.forEach(o => {
    const u = o.created_by || 'ไม่ทราบ';
    if (!byUser[u]) byUser[u] = [];
    byUser[u].push(o);
  });
  
  document.getElementById('adminCutoffContent').innerHTML = `
    <div class="sec-hd">⏰ Cutoff Violations (${violations.length})</div>
    <div class="pad">
      ${violations.length === 0 ? '<div style="text-align:center;padding:30px;color:var(--td);font-size:12px">✅ ไม่มี violation</div>' : `
        <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
          ${Object.entries(byUser).map(([user, arr]) => `
            <div class="card" style="flex:1;min-width:120px;padding:12px;text-align:center">
              <div style="font-size:24px;font-weight:700;color:var(--red)">${arr.length}</div>
              <div style="font-size:11px;color:var(--td)">${user}</div>
            </div>
          `).join('')}
        </div>
        ${violations.map(o => `<div class="card" style="margin-bottom:4px;border-left:3px solid var(--red)">
          <div class="card-row">
            <div class="card-body">
              <div class="card-title">${o.order_id}</div>
              <div class="card-desc">${getStoreName(o.store_id)} · ${o.created_by||'-'} · ${new Date(o.created_at).toLocaleString('th-TH')}</div>
            </div>
            <div style="font-size:9px;padding:2px 8px;border-radius:10px;background:var(--red-bg);color:var(--red)">${o.status}</div>
          </div>
        </div>`).join('')}
      `}
    </div>`;
}

// ─── A9: Audit Trail ─────────────────────────────────────────
async function renderAdminAudit() {
  const el = document.getElementById('adminAuditContent');
  el.innerHTML = '<div style="text-align:center;padding:40px"><div class="spinner"></div></div>';
  
  if (!S.auditFilter) S.auditFilter = 'all';
  
  try {
    const filterParams = filter !== 'all' ? { target_type: filter } : {};
    const resp = await api('get_audit_log', null, filterParams);
    
    if (!resp.success) { el.innerHTML = '<div class="pad" style="color:var(--red)">❌ ' + (resp.message || resp.error) + '</div>'; return; }
    
    const logs = resp.data || [];
    const typeColors = {
      update_permission: { bg:'var(--purple-bg)', color:'var(--purple)', icon:'🔒' },
      update_dept_mapping: { bg:'var(--blue-bg)', color:'var(--blue)', icon:'🏢' },
      update_config: { bg:'var(--orange-bg)', color:'var(--orange)', icon:'⚙️' },
      update_notif_setting: { bg:'var(--green-bg)', color:'var(--green)', icon:'🔔' },
      update_product: { bg:'var(--cyan)', color:'var(--cyan)', icon:'📦' },
    };
    
    el.innerHTML = `
      <div class="filter-bar">
        <div class="filter-chip ${filter==='all'?'active':''}" onclick="S.auditFilter='all';renderAdminAudit()">ทั้งหมด</div>
        <div class="filter-chip ${filter==='permission'?'active':''}" onclick="S.auditFilter='permission';renderAdminAudit()">🔒 สิทธิ์</div>
        <div class="filter-chip ${filter==='dept_mapping'?'active':''}" onclick="S.auditFilter='dept_mapping';renderAdminAudit()">🏢 Dept</div>
        <div class="filter-chip ${filter==='config'?'active':''}" onclick="S.auditFilter='config';renderAdminAudit()">⚙️ Config</div>
        <div class="filter-chip ${filter==='product'?'active':''}" onclick="S.auditFilter='product';renderAdminAudit()">📦 Product</div>
      </div>
      <div class="pad" style="padding-top:0">
        ${logs.length === 0 ? '<div style="text-align:center;padding:30px;color:var(--td);font-size:12px">📝 ยังไม่มีบันทึก</div>' :
        logs.map(l => {
          const tc = typeColors[l.action_type] || { bg:'var(--s2)', color:'var(--td)', icon:'📝' };
          return `<div class="card" style="margin-bottom:4px">
            <div class="card-row">
              <div class="card-icon" style="background:${tc.bg};font-size:16px">${tc.icon}</div>
              <div class="card-body">
                <div class="card-title" style="font-size:11px">${l.action_type} · ${l.target_id}</div>
                <div class="card-desc">${l.changed_by_name || l.changed_by} · ${new Date(l.changed_at).toLocaleString('th-TH')}</div>
                <div style="font-size:9px;color:var(--tm);margin-top:2px;word-break:break-all">
                  ${l.old_value ? '<span style="color:var(--red)">−</span> ' + truncate(l.old_value, 60) : ''}
                  ${l.new_value ? ' <span style="color:var(--green)">+</span> ' + truncate(l.new_value, 60) : ''}
                </div>
              </div>
            </div>
          </div>`;
        }).join('')}
      </div>`;
  } catch(e) {
    el.innerHTML = '<div class="pad" style="color:var(--red)">❌ Error: ' + e.message + '</div>';
  }
}

function truncate(s, n) { return s && s.length > n ? s.substring(0, n) + '...' : s; }

