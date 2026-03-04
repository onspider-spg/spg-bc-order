// ═══════════════════════════════════════════════════════════════
// BC Order Module — Supabase Edge Function
// Version 6.2 | Dashboard scope filtering + return order_id optional
// Siam Palette Group
// ═══════════════════════════════════════════════════════════════
// Deploy: supabase functions deploy bc-order --no-verify-jwt
// ═══════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── CORS ────────────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

// ─── TIMEZONE HELPER (Australia/Sydney) ──────────────────────
function sydneyNow(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Australia/Sydney' }));
}

function sydneyDateStr(): string {
  const d = sydneyNow();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

function sydneyTimeStr(): string {
  const d = sydneyNow();
  return String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
}

function getNextDayStr(): string {
  const d = sydneyNow();
  d.setDate(d.getDate() + 1);
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}


// ═══════════════════════════════════════════════════════════════
// 1. SESSION VALIDATION (reads sessions table directly!)
// ═══════════════════════════════════════════════════════════════

// v6.4.4.4: Per-account, per-module tier override (SPG Module Tier spec)
async function resolveEffectiveTier(
  accountId: string,
  moduleId: string,
  globalTierId: string
): Promise<string> {
  const { data } = await db
    .from('account_module_access')
    .select('module_tier')
    .eq('account_id', accountId)
    .eq('module_id', moduleId)
    .eq('is_active', true)
    .single();
  return data?.module_tier || globalTierId;
}

async function validateSession(token: string) {
  if (!token) return { valid: false, message: 'No token provided' };

  // Read session directly from shared sessions table
  const { data: ses } = await db.from('sessions')
    .select('*')
    .eq('session_id', token)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (!ses) return { valid: false, message: 'Session not found or expired' };

  // Get account info
  const { data: acc } = await db.from('accounts')
    .select('*')
    .eq('account_id', ses.account_id)
    .single();

  // Get user info
  const { data: usr } = await db.from('users')
    .select('*')
    .eq('user_id', ses.user_id)
    .single();

  if (!acc || !usr) return { valid: false, message: 'Account/User not found' };

  // v6.4.4.4: Resolve effective tier for BC Order module
  const effectiveTier = await resolveEffectiveTier(acc.account_id, 'bc_order', acc.tier_id);

  // Get effective tier level (ตรงกับ Home pattern)
  const { data: effTier } = await db.from('access_tiers')
    .select('tier_level')
    .eq('tier_id', effectiveTier)
    .single();
  const effTierLevel = effTier?.tier_level || 99;

  // T1 = super_admin always (ตรงกับ Home: effTierLevel === 1 → super_admin)
  let accessLevel: string;
  if (effTierLevel === 1) {
    accessLevel = 'super_admin';
  } else {
    const { data: modAccess } = await db.from('module_permissions')
      .select('access_level')
      .eq('tier_id', effectiveTier)
      .eq('module_id', 'bc_order')
      .single();
    accessLevel = modAccess?.access_level || 'no_access';
  }

  return {
    valid: true,
    account_id: acc.account_id,
    user_id: usr.user_id,
    display_name: usr.display_name,
    full_name: usr.full_name,
    tier_id: effectiveTier,           // ← effective tier (override or global)
    global_tier_id: acc.tier_id,      // ← original global tier (always preserved)
    account_type: acc.account_type,
    store_id: acc.store_id,
    dept_id: acc.dept_id,
    access_level: accessLevel,
    expires_at: ses.expires_at,
  };
}


// ═══════════════════════════════════════════════════════════════
// 2. PERMISSION SYSTEM (3-Layer)
// ═══════════════════════════════════════════════════════════════

async function checkPermission(session: any, functionId: string) {
  if (session.access_level === 'no_access') return { allowed: false, reason: 'No access to BC Order' };
  if (session.access_level === 'super_admin' || session.access_level === 'admin') return { allowed: true };

  const writeFunctions = [
    'fn_create_order','fn_edit_order','fn_delete_order','fn_cancel_order',
    'fn_accept_pending','fn_update_fulfilment','fn_mark_delivered',
    'fn_add_stock','fn_remove_stock',
    'fn_create_waste','fn_log_waste','fn_report_return','fn_resolve_return',
    'fn_manage_products','fn_manage_notifications','fn_manage_user_access',
    'fn_manage_config','fn_manage_dept_mapping'
  ];

  if (session.access_level === 'view' && writeFunctions.includes(functionId)) {
    return { allowed: false, reason: 'View-only access' };
  }

  const { data: perm } = await db.from('bc_tier_function_permission')
    .select('allowed')
    .eq('tier_id', session.tier_id)
    .eq('function_id', functionId)
    .single();

  if (!perm) {
    console.warn(`[checkPermission] NO RECORD: tier=${session.tier_id}, function=${functionId}`);
    return { allowed: false, reason: 'Permission not configured for tier ' + session.tier_id };
  }
  if (!perm.allowed) console.log(`[checkPermission] DENIED: tier=${session.tier_id}, function=${functionId}`);
  return perm.allowed ? { allowed: true } : { allowed: false, reason: 'Not allowed for tier ' + session.tier_id };
}

async function getDeptMapping(deptId: string) {
  if (deptId === 'ALL') return { module_role: 'all', section_scope: [], dept_id: 'ALL' };

  const { data } = await db.from('bc_dept_scope_mapping')
    .select('*')
    .eq('dept_id', deptId)
    .eq('is_active', true)
    .single();

  if (!data) return null;
  return {
    ...data,
    section_scope: data.section_scope ? String(data.section_scope).split(',').map((s: string) => s.trim()) : [],
  };
}

async function getVisibleProductIds(session: any, deptMapping: any) {
  if (session.store_id === 'ALL' && session.dept_id === 'ALL') return null;

  if (deptMapping.module_role === 'store') {
    const { data } = await db.from('bc_product_visibility')
      .select('product_id')
      .eq('is_active', true)
      .eq('store_id', session.store_id)
      .eq('dept_id', session.dept_id);
    return new Set((data || []).map((r: any) => r.product_id));
  }

  if (deptMapping.module_role === 'bc_production' || deptMapping.module_role === 'bc_management') {
    const scope = deptMapping.section_scope;
    const { data } = await db.from('bc_products')
      .select('product_id')
      .eq('is_active', true)
      .in('section_id', scope);
    return new Set((data || []).map((r: any) => r.product_id));
  }

  return new Set<string>();
}


// ═══════════════════════════════════════════════════════════════
// 3. STOCK HELPERS
// ═══════════════════════════════════════════════════════════════

async function getStockMap() {
  const { data: ledger } = await db.from('bc_stock_ledger')
    .select('product_id, movement_type, quantity');
  
  const map: Record<string, { actual: number, available: number }> = {};
  
  (ledger || []).forEach((e: any) => {
    if (!map[e.product_id]) map[e.product_id] = { actual: 0, available: 0 };
    const qty = Number(e.quantity) || 0;
    if (e.movement_type === 'order_hold' || e.movement_type === 'order_release') {
      map[e.product_id].available += qty;
    } else {
      map[e.product_id].actual += qty;
      map[e.product_id].available += qty;
    }
  });
  return map;
}

async function addStockMovement(productId: string, sectionId: string, movementType: string, quantity: number, referenceId: string, note: string, userId: string) {
  const { data: lastRow } = await db.from('bc_stock_ledger').select('ledger_id').order('created_at', { ascending: false }).limit(1);
  const nextNum = lastRow && lastRow.length > 0 ? parseInt(lastRow[0].ledger_id.replace('STK-','')) + 1 : 1;
  const ledgerId = 'STK-' + String(nextNum).padStart(6, '0');
  
  await db.from('bc_stock_ledger').insert({
    ledger_id: ledgerId, product_id: productId, section_id: sectionId,
    movement_type: movementType, quantity, reference_id: referenceId,
    note, recorded_by: userId
  });
}

async function getConfigValue(key: string): Promise<string> {
  const { data } = await db.from('bc_config').select('config_value').eq('config_key', key).single();
  return data?.config_value || '';
}

async function getConfigNum(key: string, def: number): Promise<number> {
  const val = await getConfigValue(key);
  return val ? parseInt(val) : def;
}


// ═══════════════════════════════════════════════════════════════
// 4. HANDLER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

// ─── Health ──────────────────────────────────────────────────
function h_health() {
  return json({ status: 'ok', module: 'bc_order', version: '2.0-supabase', timestamp: new Date().toISOString() });
}

// ─── GET Categories ──────────────────────────────────────────
async function h_getCategories() {
  // Map to frontend field names
  const { data } = await db.from('bc_categories').select('*').eq('is_active', true).order('sort_order');
  const mapped = (data || []).map((c: any) => ({
    cat_id: c.category_id, cat_name: c.category_name,
    section_id: c.section_id, sort_order: c.sort_order,
  }));
  return json({ success: true, data: mapped });
}

// ─── GET Products ────────────────────────────────────────────
async function h_getProducts(session: any, deptMapping: any, params: URLSearchParams) {
  // No strict permission check - anyone with module access can view products
  const { data: allProducts } = await db.from('bc_products').select('*').eq('is_active', true).order('sort_order');
  const visibleIds = await getVisibleProductIds(session, deptMapping);
  
  let products = allProducts || [];
  if (visibleIds !== null) {
    products = products.filter((p: any) => visibleIds.has(p.product_id));
  }

  const stockMap = params.get('include_stock') === 'true' ? await getStockMap() : {};

  const mapped = products.map((p: any) => ({
    ...p,
    cat_id: p.category_id,
    stock_actual: stockMap[p.product_id]?.actual || 0,
    stock_available: stockMap[p.product_id]?.available || 0,
  }));

  return json({ success: true, data: mapped, count: mapped.length });
}

// ─── GET Stock ───────────────────────────────────────────────
async function h_getStock(session: any, deptMapping: any) {
  const perm = await checkPermission(session, 'fn_view_stock');
  if (!perm.allowed) return json({ success: false, error: 'PERMISSION_DENIED', message: perm.reason }, 403);

  const stockMap = await getStockMap();
  const visibleIds = await getVisibleProductIds(session, deptMapping);

  const { data: prods } = await db.from('bc_products').select('*').eq('is_active', true).eq('allow_stock', true);
  
  let products = (prods || []).filter((p: any) => visibleIds === null || visibleIds.has(p.product_id));

  const stockData = products.map((p: any) => ({
    product_id: p.product_id, product_name: p.product_name, section_id: p.section_id, unit: p.unit,
    stock_actual: stockMap[p.product_id]?.actual || 0,
    stock_available: stockMap[p.product_id]?.available || 0,
  }));

  const isBC = deptMapping.module_role === 'bc_production' || deptMapping.module_role === 'bc_management';
  return json({ success: true, data: stockData, view_mode: isBC ? 'actual' : 'available', count: stockData.length });
}

// ─── GET Orders ──────────────────────────────────────────────
async function h_getOrders(session: any, deptMapping: any, params: URLSearchParams) {
  const perm = await checkPermission(session, 'fn_view_own_orders');
  if (!perm.allowed) return json({ success: false, error: 'PERMISSION_DENIED', message: perm.reason }, 403);

  let query = db.from('bc_orders').select('*').order('created_at', { ascending: false });

  // Store users: filter by their store + dept
  // BC users / ALL: see ALL stores
  if (deptMapping.module_role === 'store') {
    if (session.store_id !== 'ALL') query = query.eq('store_id', session.store_id);
    if (session.dept_id !== 'ALL') query = query.eq('dept_id', session.dept_id);
  }
  if (params.get('status')) query = query.eq('status', params.get('status'));
  if (params.get('date_from')) query = query.gte('delivery_date', params.get('date_from'));
  if (params.get('date_to')) query = query.lte('delivery_date', params.get('date_to'));

  // History limit (days)
  const historyDays = session.store_id === 'ALL' ? await getConfigNum('admin_history_days', 365) : await getConfigNum('store_history_days', 30);
  const cutoff = sydneyNow();
  cutoff.setDate(cutoff.getDate() - historyDays);
  query = query.gte('created_at', cutoff.toISOString());

  const { data: orders, error: ordErr } = await query;
  if (ordErr) console.error('get_orders query error:', ordErr);
  let result = orders || [];

  console.log(`[get_orders] role=${deptMapping.module_role}, scope=${JSON.stringify(deptMapping.section_scope)}, raw_orders=${result.length}`);

  // Attach items for BC users and 'all' role
  const isBCRole = deptMapping.module_role === 'bc_production' || deptMapping.module_role === 'bc_management' || deptMapping.module_role === 'all';
  if (isBCRole && result.length > 0) {
    const scope = deptMapping.section_scope || [];
    const hasScope = scope.length > 0 && deptMapping.module_role !== 'all';
    const orderIds = result.map((o: any) => o.order_id);

    console.log(`[get_orders:BC] scope=${JSON.stringify(scope)}, hasScope=${hasScope}, orderIds=${JSON.stringify(orderIds.slice(0,5))}`);

    const { data: allItems, error: itemErr } = await db.from('bc_order_items')
      .select('item_id, order_id, product_id, section_id, qty_ordered, qty_sent, is_urgent, item_note, fulfilment_status')
      .in('order_id', orderIds);
    
    if (itemErr) console.error('[get_orders:BC] items query error:', itemErr);
    console.log(`[get_orders:BC] allItems=${(allItems||[]).length}, sections=${JSON.stringify([...new Set((allItems||[]).map((i:any)=>i.section_id))])}`);
    
    // Attach product names
    const pIds = [...new Set((allItems || []).map((i: any) => i.product_id))];
    const { data: prods } = await db.from('bc_products').select('product_id, product_name, unit').in('product_id', pIds.length ? pIds : ['_none_']);
    const prodMap: Record<string, any> = {};
    (prods || []).forEach((p: any) => prodMap[p.product_id] = p);
    
    const itemsByOrder: Record<string, any[]> = {};
    let keptCount = 0, skippedCount = 0;
    (allItems || []).forEach((i: any) => {
      // If scope is defined, filter by section. If empty scope or 'all', show everything.
      if (hasScope && !scope.includes(i.section_id)) {
        skippedCount++;
        return;
      }
      keptCount++;
      i.product_name = prodMap[i.product_id]?.product_name || '';
      i.unit = prodMap[i.product_id]?.unit || '';
      if (!itemsByOrder[i.order_id]) itemsByOrder[i.order_id] = [];
      itemsByOrder[i.order_id].push(i);
    });
    
    console.log(`[get_orders:BC] kept=${keptCount}, skipped=${skippedCount}, ordersWithItems=${Object.keys(itemsByOrder).length}`);
    
    // Only keep orders that have items (after scope filter)
    if (hasScope) {
      const validIds = new Set(Object.keys(itemsByOrder));
      const beforeCount = result.length;
      result = result.filter((o: any) => validIds.has(o.order_id));
      console.log(`[get_orders:BC] orders before=${beforeCount}, after=${result.length}, validIds=${JSON.stringify([...validIds].slice(0,5))}`);
    }
    result.forEach((o: any) => { o.items = itemsByOrder[o.order_id] || []; });
  }

  // Also attach items for store users (so they can see their order details in list)
  if (deptMapping.module_role === 'store' && result.length > 0) {
    const orderIds = result.map((o: any) => o.order_id);
    const { data: items } = await db.from('bc_order_items')
      .select('item_id, order_id, product_id, section_id, qty_ordered, qty_sent, is_urgent, item_note, fulfilment_status')
      .in('order_id', orderIds);
    
    const pIds = [...new Set((items || []).map((i: any) => i.product_id))];
    const { data: prods } = await db.from('bc_products').select('product_id, product_name, unit').in('product_id', pIds.length ? pIds : ['_none_']);
    const prodMap: Record<string, any> = {};
    (prods || []).forEach((p: any) => prodMap[p.product_id] = p);
    
    const itemsByOrder: Record<string, any[]> = {};
    (items || []).forEach((i: any) => {
      i.product_name = prodMap[i.product_id]?.product_name || '';
      i.unit = prodMap[i.product_id]?.unit || '';
      if (!itemsByOrder[i.order_id]) itemsByOrder[i.order_id] = [];
      itemsByOrder[i.order_id].push(i);
    });
    result.forEach((o: any) => { o.items = itemsByOrder[o.order_id] || []; });
  }

  // Pagination
  const page = parseInt(params.get('page') || '1');
  const limit = Math.min(parseInt(params.get('limit') || '20'), 100);
  const start = (page - 1) * limit;
  const paged = result.slice(start, start + limit);

  return json({ success: true, data: paged, total: result.length, page, limit, pages: Math.ceil(result.length / limit) });
}

// ─── GET Order Detail ────────────────────────────────────────
async function h_getOrderDetail(session: any, deptMapping: any, params: URLSearchParams) {
  const perm = await checkPermission(session, 'fn_view_own_orders');
  if (!perm.allowed) return json({ success: false, error: 'PERMISSION_DENIED', message: perm.reason }, 403);

  const orderId = params.get('order_id');
  if (!orderId) return json({ success: false, error: 'MISSING_PARAM', message: 'order_id required' }, 400);

  const { data: order } = await db.from('bc_orders').select('*').eq('order_id', orderId).single();
  if (!order) return json({ success: false, error: 'NOT_FOUND' }, 404);

  // Store users: can only see own store. BC users: can see all (filtered by section later)
  if (deptMapping.module_role === 'store' && session.store_id !== 'ALL' && order.store_id !== session.store_id) {
    return json({ success: false, error: 'SCOPE_DENIED' }, 403);
  }

  let { data: items } = await db.from('bc_order_items').select('*').eq('order_id', orderId);
  items = items || [];

  // BC section filter
  if (deptMapping.module_role === 'bc_production' || deptMapping.module_role === 'bc_management') {
    items = items.filter((i: any) => deptMapping.section_scope.includes(i.section_id));
  }

  // Attach product names
  const productIds = [...new Set(items.map((i: any) => i.product_id))];
  const { data: prods } = await db.from('bc_products').select('product_id, product_name, unit').in('product_id', productIds.length ? productIds : ['_none_']);
  const prodMap: Record<string, any> = {};
  (prods || []).forEach((p: any) => prodMap[p.product_id] = p);

  items = items.map((item: any) => ({
    ...item,
    product_name: prodMap[item.product_id]?.product_name || '',
    unit: prodMap[item.product_id]?.unit || '',
  }));

  // Attach returns
  const { data: returns } = await db.from('bc_returns').select('*').eq('order_id', orderId);
  const returnMap: Record<string, any[]> = {};
  (returns || []).forEach((r: any) => {
    const key = r.order_id + '_' + r.item_id;
    if (!returnMap[key]) returnMap[key] = [];
    returnMap[key].push(r);
  });

  items = items.map((item: any) => ({
    ...item,
    returns: returnMap[item.order_id + '_' + item.item_id] || [],
    has_return: (returnMap[item.order_id + '_' + item.item_id] || []).length > 0,
  }));

  return json({ success: true, data: { order, items } });
}

// ─── POST Create Order ──────────────────────────────────────
async function h_createOrder(session: any, deptMapping: any, body: any) {
  const perm = await checkPermission(session, 'fn_create_order');
  if (!perm.allowed) return json({ success: false, error: 'PERMISSION_DENIED', message: perm.reason }, 403);

  if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
    return json({ success: false, error: 'INVALID_DATA', message: 'items array required' }, 400);
  }

  const deliveryDate = body.delivery_date || getNextDayStr();
  const orderDate = sydneyDateStr();
  const now = new Date().toISOString();

  // Cutoff check
  let status = 'Ordered';
  let isCutoffViolation = false;

  if (deliveryDate === orderDate) {
    const cutoffTime = await getConfigValue('cutoff_time') || '05:00';
    const currentTime = sydneyTimeStr();
    if (currentTime > cutoffTime) {
      status = 'Pending';
      isCutoffViolation = true;
    }
  }

  // Generate order ID
  const dateStr = sydneyDateStr().replace(/-/g, '');
  const prefix = await getConfigValue('order_id_prefix') || 'ORD';
  const { data: todayOrders } = await db.from('bc_orders').select('order_id').like('order_id', `${prefix}-${dateStr}%`);
  const num = (todayOrders?.length || 0) + 1;
  const orderId = `${prefix}-${dateStr}-${String(num).padStart(3, '0')}`;

  // Validate items
  const productIds = body.items.map((i: any) => i.product_id);
  const { data: prods } = await db.from('bc_products').select('*').in('product_id', productIds);
  const prodMap: Record<string, any> = {};
  (prods || []).forEach((p: any) => prodMap[p.product_id] = p);

  const visibleIds = await getVisibleProductIds(session, deptMapping);

  const validatedItems: any[] = [];
  for (const item of body.items) {
    const prod = prodMap[item.product_id];
    if (!prod) return json({ success: false, error: 'INVALID_PRODUCT', message: 'Product not found: ' + item.product_id }, 400);
    if (!prod.is_active) return json({ success: false, error: 'INACTIVE_PRODUCT', message: 'Product inactive: ' + item.product_id }, 400);
    if (visibleIds !== null && !visibleIds.has(item.product_id)) {
      return json({ success: false, error: 'PRODUCT_NOT_VISIBLE', message: 'Product not available for your dept' }, 400);
    }

    const qty = parseInt(item.qty);
    if (!qty || qty < prod.min_order) {
      return json({ success: false, error: 'MIN_ORDER', message: prod.product_name + ': minimum ' + prod.min_order }, 400);
    }
    if (prod.order_step > 1 && qty % prod.order_step !== 0) {
      return json({ success: false, error: 'ORDER_STEP', message: prod.product_name + ': multiples of ' + prod.order_step }, 400);
    }

    validatedItems.push({
      product_id: item.product_id,
      section_id: prod.section_id,
      qty_ordered: qty,
      is_urgent: item.is_urgent || false,
      item_note: item.note || '',
    });
  }

  // Insert order
  await db.from('bc_orders').insert({
    order_id: orderId, store_id: session.store_id, dept_id: session.dept_id,
    user_id: session.user_id, display_name: session.display_name,
    order_date: orderDate, delivery_date: deliveryDate,
    status, is_cutoff_violation: isCutoffViolation,
    header_note: body.header_note || '',
  });

  // Insert items + stock holds
  const itemIds: string[] = [];
  const { data: lastItem } = await db.from('bc_order_items').select('item_id').order('item_id', { ascending: false }).limit(1);
  let itemNum = lastItem && lastItem.length > 0 ? parseInt(lastItem[0].item_id.replace('ITM-','')) + 1 : 1;

  for (const item of validatedItems) {
    const itemId = 'ITM-' + String(itemNum++).padStart(6, '0');
    itemIds.push(itemId);
    
    await db.from('bc_order_items').insert({
      item_id: itemId, order_id: orderId, product_id: item.product_id,
      section_id: item.section_id, qty_ordered: item.qty_ordered,
      is_urgent: item.is_urgent, item_note: item.item_note,
    });

    // Stock hold
    const prod = prodMap[item.product_id];
    if (prod?.allow_stock) {
      await addStockMovement(item.product_id, item.section_id, 'order_hold', -item.qty_ordered, itemId, 'Order hold: ' + orderId, session.user_id);
    }
  }

  return json({
    success: true,
    data: { order_id: orderId, status, is_cutoff_violation: isCutoffViolation, items_count: validatedItems.length, item_ids: itemIds },
    message: status === 'Pending' ? '⚠️ สั่งหลัง cutoff — รอ BC ยืนยัน' : '✅ สั่งเรียบร้อย!'
  });
}

// ─── POST Edit Order ─────────────────────────────────────────
async function h_editOrder(session: any, _dm: any, body: any) {
  const perm = await checkPermission(session, 'fn_edit_order');
  if (!perm.allowed) return json({ success: false, error: 'PERMISSION_DENIED', message: perm.reason }, 403);

  const orderId = body.order_id;
  if (!orderId) return json({ success: false, error: 'MISSING_PARAM', message: 'order_id required' }, 400);

  const { data: order } = await db.from('bc_orders').select('*').eq('order_id', orderId).single();
  if (!order) return json({ success: false, error: 'NOT_FOUND' }, 404);
  if (!['Pending', 'Ordered'].includes(order.status)) {
    return json({ success: false, error: 'CANNOT_EDIT', message: 'Cannot edit order in status: ' + order.status }, 400);
  }
  if (session.store_id !== 'ALL' && order.store_id !== session.store_id) {
    return json({ success: false, error: 'SCOPE_DENIED' }, 403);
  }

  const orderUpdates: any = { updated_at: new Date().toISOString() };
  let newStatus = order.status;
  let statusChanged = false;

  // S-02 fix: Handle delivery_date change + cutoff check
  if (body.delivery_date && body.delivery_date !== order.delivery_date) {
    orderUpdates.delivery_date = body.delivery_date;
    
    // Check cutoff: if new date is today and current time > cutoff → Pending
    const now = sydneyNow();
    const todayStr = now.toISOString().slice(0, 10);
    const hours = now.getHours().toString().padStart(2, '0');
    const mins = now.getMinutes().toString().padStart(2, '0');
    const currentTime = `${hours}:${mins}`;
    const cutoffTime = await getConfigValue('cutoff_time') || '05:00';
    
    if (body.delivery_date === todayStr && currentTime > cutoffTime) {
      newStatus = 'Pending';
      orderUpdates.status = 'Pending';
      orderUpdates.is_cutoff_violation = true;
      statusChanged = true;
    }
  }

  if (body.header_note !== undefined) {
    orderUpdates.header_note = body.header_note;
  }

  // Update order header
  await db.from('bc_orders').update(orderUpdates).eq('order_id', orderId);

  // S-02 fix: Update items but SKIP items with fulfilment_status (BC already processed)
  if (body.items && Array.isArray(body.items)) {
    for (const update of body.items) {
      // Check if item has been fulfilled
      const { data: existingItem } = await db.from('bc_order_items')
        .select('fulfilment_status')
        .eq('item_id', update.item_id)
        .eq('order_id', orderId)
        .single();
      
      if (existingItem?.fulfilment_status) {
        continue; // Skip fulfilled items
      }

      const updates: any = {};
      if (update.qty !== undefined) updates.qty_ordered = parseInt(update.qty);
      if (update.is_urgent !== undefined) updates.is_urgent = update.is_urgent;
      if (update.note !== undefined) updates.item_note = update.note;
      if (Object.keys(updates).length > 0) {
        await db.from('bc_order_items').update(updates).eq('item_id', update.item_id).eq('order_id', orderId);
      }
    }
  }

  const message = statusChanged 
    ? '⚠️ แก้ไขแล้ว — เปลี่ยนวันส่งหลัง cutoff → status เป็น Pending รอ BC ยืนยัน'
    : '✅ แก้ไขออเดอร์เรียบร้อย';
  
  return json({ success: true, message, data: { order_id: orderId, status: newStatus, status_changed: statusChanged } });
}

// ─── POST Delete Order ───────────────────────────────────────
async function h_deleteOrder(session: any, _dm: any, body: any) {
  const perm = await checkPermission(session, 'fn_cancel_order');
  if (!perm.allowed) return json({ success: false, error: 'PERMISSION_DENIED', message: perm.reason }, 403);

  const orderId = body.order_id;
  if (!orderId) return json({ success: false, error: 'MISSING_PARAM' }, 400);

  const { data: order } = await db.from('bc_orders').select('*').eq('order_id', orderId).single();
  if (!order) return json({ success: false, error: 'NOT_FOUND' }, 404);
  if (!['Pending', 'Ordered'].includes(order.status)) {
    return json({ success: false, error: 'CANNOT_DELETE', message: 'Cannot delete order in status: ' + order.status }, 400);
  }
  if (session.store_id !== 'ALL' && order.store_id !== session.store_id) {
    return json({ success: false, error: 'SCOPE_DENIED' }, 403);
  }

  // Release stock holds
  const { data: items } = await db.from('bc_order_items').select('*').eq('order_id', orderId);
  const productIds = (items || []).map((i: any) => i.product_id);
  const { data: prods } = await db.from('bc_products').select('product_id, allow_stock, section_id').in('product_id', productIds.length ? productIds : ['_none_']);
  const prodMap: Record<string, any> = {};
  (prods || []).forEach((p: any) => prodMap[p.product_id] = p);

  for (const item of (items || [])) {
    const prod = prodMap[item.product_id];
    if (prod?.allow_stock) {
      await addStockMovement(item.product_id, item.section_id, 'order_release', item.qty_ordered, item.item_id, 'Cancelled: ' + orderId, session.user_id);
    }
  }

  // Delete (CASCADE handles items)
  await db.from('bc_orders').delete().eq('order_id', orderId);
  return json({ success: true, message: '✅ ลบออเดอร์เรียบร้อย', data: { order_id: orderId } });
}

// ─── POST Create Waste ───────────────────────────────────────
async function h_createWaste(session: any, deptMapping: any, body: any) {
  const perm = await checkPermission(session, 'fn_log_waste');
  if (!perm.allowed) return json({ success: false, error: 'PERMISSION_DENIED', message: perm.reason }, 403);

  if (!body.product_id || !body.quantity || !body.reason) {
    return json({ success: false, error: 'MISSING_FIELDS', message: 'product_id, quantity, reason required' }, 400);
  }

  const { data: lastWaste } = await db.from('bc_waste_log').select('waste_id').order('created_at', { ascending: false }).limit(1);
  const nextNum = lastWaste && lastWaste.length > 0 ? parseInt(lastWaste[0].waste_id.replace('WST-','')) + 1 : 1;
  const wasteId = 'WST-' + String(nextNum).padStart(6, '0');

  let sourceType = '', sourceStoreId = '', sourceDeptId = '', sourceSectionId = '';
  if (deptMapping.module_role === 'store') {
    sourceType = 'store'; sourceStoreId = session.store_id; sourceDeptId = session.dept_id;
  } else {
    sourceType = 'bakery';
    const { data: prod } = await db.from('bc_products').select('section_id').eq('product_id', body.product_id).single();
    sourceSectionId = prod?.section_id || '';
  }

  await db.from('bc_waste_log').insert({
    waste_id: wasteId, product_id: body.product_id, quantity: parseInt(body.quantity),
    waste_date: sydneyDateStr(), production_date: body.production_date || '',
    source_type: sourceType, source_store_id: sourceStoreId, source_dept_id: sourceDeptId,
    source_section_id: sourceSectionId, reason: body.reason, recorded_by: session.user_id,
  });

  return json({ success: true, message: '✅ บันทึก waste เรียบร้อย', data: { waste_id: wasteId } });
}

// ─── EDIT Waste ──────────────────────────────────────────────
async function h_editWaste(session: any, _dm: any, body: any) {
  const perm = await checkPermission(session, 'fn_log_waste');
  if (!perm.allowed) return json({ success: false, error: 'PERMISSION_DENIED', message: perm.reason }, 403);

  if (!body.waste_id) return json({ success: false, error: 'MISSING_PARAM', message: 'waste_id required' }, 400);

  const { data: waste } = await db.from('bc_waste_log').select('*').eq('waste_id', body.waste_id).single();
  if (!waste) return json({ success: false, error: 'NOT_FOUND' }, 404);

  const updates: any = {};
  if (body.quantity !== undefined) updates.quantity = parseInt(body.quantity);
  if (body.reason !== undefined) updates.reason = body.reason;
  if (body.production_date !== undefined) updates.production_date = body.production_date;

  if (Object.keys(updates).length === 0) return json({ success: false, error: 'NO_CHANGES' }, 400);

  await db.from('bc_waste_log').update(updates).eq('waste_id', body.waste_id);
  return json({ success: true, message: '✅ แก้ไข waste เรียบร้อย' });
}

// ─── DELETE Waste ─────────────────────────────────────────────
async function h_deleteWaste(session: any, _dm: any, body: any) {
  const perm = await checkPermission(session, 'fn_log_waste');
  if (!perm.allowed) return json({ success: false, error: 'PERMISSION_DENIED', message: perm.reason }, 403);

  if (!body.waste_id) return json({ success: false, error: 'MISSING_PARAM', message: 'waste_id required' }, 400);

  const { data: waste } = await db.from('bc_waste_log').select('waste_id').eq('waste_id', body.waste_id).single();
  if (!waste) return json({ success: false, error: 'NOT_FOUND' }, 404);

  await db.from('bc_waste_log').delete().eq('waste_id', body.waste_id);
  return json({ success: true, message: '✅ ลบ waste เรียบร้อย' });
}

// ─── GET Waste Log ───────────────────────────────────────────
async function h_getWasteLog(session: any, deptMapping: any, params: URLSearchParams) {
  const perm = await checkPermission(session, 'fn_view_waste');
  if (!perm.allowed) return json({ success: false, error: 'PERMISSION_DENIED', message: perm.reason }, 403);

  let query = db.from('bc_waste_log').select('*').order('created_at', { ascending: false });

  if (session.store_id !== 'ALL') {
    if (deptMapping.module_role === 'store') {
      query = query.eq('source_store_id', session.store_id);
    } else if (deptMapping.module_role === 'bc_production' || deptMapping.module_role === 'bc_management') {
      query = query.eq('source_type', 'bakery').in('source_section_id', deptMapping.section_scope);
    }
  }

  if (params.get('date_from')) query = query.gte('waste_date', params.get('date_from'));
  if (params.get('date_to')) query = query.lte('waste_date', params.get('date_to'));

  const { data } = await query;
  return json({ success: true, data: data || [], count: (data || []).length });
}

// ─── GET Waste Dashboard (Admin) ────────────────────────────
async function h_getWasteDashboard(session: any, _dm: any, params: URLSearchParams) {
  // v6.0: No admin check — everyone can see, filtered by scope
  const days = parseInt(params.get('days') || '30');
  const cutoff = sydneyNow();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  const { data: logs } = await db.from('bc_waste_log').select('*').gte('waste_date', cutoffStr).order('waste_date', { ascending: true });
  let all = logs || [];

  // v6.0: Scope filtering
  const moduleRole = _dm?.module_role || 'store';
  const sectionScope: string[] = _dm?.section_scope ? (typeof _dm.section_scope === 'string' ? _dm.section_scope.split(',') : _dm.section_scope) : [];
  
  if (moduleRole === 'bc_management') {
    // See everything
  } else if (moduleRole === 'bc_production' && sectionScope.length > 0) {
    // BC production: filter by section via product lookup
    const pIds = [...new Set(all.map((w: any) => w.product_id))];
    if (pIds.length > 0) {
      const { data: prods } = await db.from('bc_products').select('product_id, section_id').in('product_id', pIds);
      const sectionProdIds = new Set((prods || []).filter((p: any) => sectionScope.includes(p.section_id)).map((p: any) => p.product_id));
      all = all.filter((w: any) => sectionProdIds.has(w.product_id));
    }
  } else if (session.store_id && session.store_id !== 'ALL') {
    // Store user: filter by store
    all = all.filter((w: any) => w.source_store_id === session.store_id || w.source_type === 'bakery');
  }

  // Attach product names
  const pIds = [...new Set(all.map((w: any) => w.product_id))];
  const { data: prods } = await db.from('bc_products').select('product_id, product_name, unit, section_id').in('product_id', pIds.length ? pIds : ['_none_']);
  const prodMap: Record<string, any> = {};
  (prods || []).forEach((p: any) => prodMap[p.product_id] = p);

  const today = sydneyDateStr();
  const weekAgo = sydneyNow();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekStr = weekAgo.toISOString().split('T')[0];

  const todayLogs = all.filter((w: any) => w.waste_date === today);
  const weekLogs = all.filter((w: any) => w.waste_date >= weekStr);

  // Summary
  const summary = {
    total_records: all.length,
    total_qty: all.reduce((s: number, w: any) => s + (w.quantity || 0), 0),
    today_records: todayLogs.length,
    today_qty: todayLogs.reduce((s: number, w: any) => s + (w.quantity || 0), 0),
    week_records: weekLogs.length,
    week_qty: weekLogs.reduce((s: number, w: any) => s + (w.quantity || 0), 0),
  };

  // By reason
  const byReason: Record<string, { count: number; qty: number }> = {};
  all.forEach((w: any) => {
    const r = w.reason || 'Other';
    if (!byReason[r]) byReason[r] = { count: 0, qty: 0 };
    byReason[r].count++;
    byReason[r].qty += w.quantity || 0;
  });

  // By product (top 10)
  const byProduct: Record<string, { name: string; count: number; qty: number; section: string }> = {};
  all.forEach((w: any) => {
    const pid = w.product_id;
    if (!byProduct[pid]) {
      const p = prodMap[pid];
      byProduct[pid] = { name: p?.product_name || pid, count: 0, qty: 0, section: p?.section_id || '' };
    }
    byProduct[pid].count++;
    byProduct[pid].qty += w.quantity || 0;
  });
  const topProducts = Object.values(byProduct).sort((a: any, b: any) => b.qty - a.qty).slice(0, 10);

  // By source (store vs bakery)
  const bySource: Record<string, { count: number; qty: number }> = {};
  all.forEach((w: any) => {
    const src = w.source_type === 'store' ? (w.source_store_id || 'store') : 'bakery';
    if (!bySource[src]) bySource[src] = { count: 0, qty: 0 };
    bySource[src].count++;
    bySource[src].qty += w.quantity || 0;
  });

  // Daily trend (last N days)
  const dailyTrend: Record<string, number> = {};
  // Initialize all days
  for (let i = 0; i < days; i++) {
    const d = sydneyNow();
    d.setDate(d.getDate() - i);
    dailyTrend[d.toISOString().split('T')[0]] = 0;
  }
  all.forEach((w: any) => {
    if (dailyTrend[w.waste_date] !== undefined) dailyTrend[w.waste_date] += w.quantity || 0;
  });

  return json({
    success: true,
    data: {
      summary, byReason, topProducts, bySource,
      dailyTrend: Object.entries(dailyTrend).sort().map(([date, qty]) => ({ date, qty })),
      period_days: days,
    }
  });
}

// ─── GET Top Products (Admin) ────────────────────────────────
async function h_getTopProducts(session: any, _dm: any, params: URLSearchParams) {
  // v6.0: No admin check — everyone can see, filtered by scope
  const days = parseInt(params.get('days') || '30');
  const cutoff = sydneyNow();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  // v6.0: Scope filtering for orders
  const moduleRole = _dm?.module_role || 'store';
  const sectionScope: string[] = _dm?.section_scope ? (typeof _dm.section_scope === 'string' ? _dm.section_scope.split(',') : _dm.section_scope) : [];

  // Get orders in range (store-scoped if needed)
  let orderQuery = db.from('bc_orders').select('order_id, store_id, delivery_date, status')
    .gte('delivery_date', cutoffStr);
  
  // Store users: filter by their store
  if (moduleRole === 'store' && session.store_id && session.store_id !== 'ALL') {
    orderQuery = orderQuery.eq('store_id', session.store_id);
  }
  // v6.4: BC users can filter by specific store via ?store= param
  const storeFilter = params.get('store');
  if (storeFilter && storeFilter !== 'ALL') {
    orderQuery = orderQuery.eq('store_id', storeFilter);
  }

  const { data: orders } = await orderQuery;
  const orderMap: Record<string, any> = {};
  (orders || []).forEach((o: any) => orderMap[o.order_id] = o);
  const orderIds = Object.keys(orderMap);

  if (orderIds.length === 0) {
    return json({ success: true, data: { products: [], byStore: [], bySection: [], dailyTrend: [], period_days: days, total_orders: 0 } });
  }

  // Get all items for these orders
  const { data: rawItems } = await db.from('bc_order_items')
    .select('item_id, order_id, product_id, section_id, qty_ordered, qty_sent, is_urgent')
    .in('order_id', orderIds);

  // v6.0: BC production scope filter on items
  let items = rawItems || [];
  if (moduleRole === 'bc_production' && sectionScope.length > 0) {
    items = items.filter((i: any) => sectionScope.includes(i.section_id));
  }

  // Get product info
  const pIds = [...new Set((items || []).map((i: any) => i.product_id))];
  const { data: prods } = await db.from('bc_products').select('product_id, product_name, unit, section_id, cat_id')
    .in('product_id', pIds.length ? pIds : ['_none_']);
  const prodMap: Record<string, any> = {};
  (prods || []).forEach((p: any) => prodMap[p.product_id] = p);

  // Aggregate by product
  const byProd: Record<string, { name: string; section: string; cat: string; unit: string; qty_ordered: number; qty_sent: number; order_count: number; urgent_count: number; stores: Set<string> }> = {};
  (items || []).forEach((i: any) => {
    const pid = i.product_id;
    const ord = orderMap[i.order_id];
    if (!ord) return;
    if (!byProd[pid]) {
      const p = prodMap[pid];
      byProd[pid] = { name: p?.product_name || pid, section: p?.section_id || '', cat: p?.cat_id || '', unit: p?.unit || '',
        qty_ordered: 0, qty_sent: 0, order_count: 0, urgent_count: 0, stores: new Set() };
    }
    byProd[pid].qty_ordered += i.qty_ordered || 0;
    byProd[pid].qty_sent += i.qty_sent || 0;
    byProd[pid].order_count++;
    if (i.is_urgent) byProd[pid].urgent_count++;
    byProd[pid].stores.add(ord.store_id);
  });

  const products = Object.entries(byProd)
    .map(([pid, v]) => ({ product_id: pid, ...v, store_count: v.stores.size, stores: undefined }))
    .sort((a, b) => b.qty_ordered - a.qty_ordered);

  // Aggregate by store
  const byStore: Record<string, { qty_ordered: number; order_count: number; item_count: number }> = {};
  (items || []).forEach((i: any) => {
    const ord = orderMap[i.order_id];
    if (!ord) return;
    const sid = ord.store_id;
    if (!byStore[sid]) byStore[sid] = { qty_ordered: 0, order_count: 0, item_count: 0 };
    byStore[sid].qty_ordered += i.qty_ordered || 0;
    byStore[sid].item_count++;
  });
  // Count unique orders per store
  const storeOrderSets: Record<string, Set<string>> = {};
  (items || []).forEach((i: any) => {
    const ord = orderMap[i.order_id];
    if (!ord) return;
    if (!storeOrderSets[ord.store_id]) storeOrderSets[ord.store_id] = new Set();
    storeOrderSets[ord.store_id].add(i.order_id);
  });
  Object.keys(byStore).forEach(sid => { byStore[sid].order_count = storeOrderSets[sid]?.size || 0; });

  const storeRanking = Object.entries(byStore)
    .map(([sid, v]) => ({ store_id: sid, ...v }))
    .sort((a, b) => b.qty_ordered - a.qty_ordered);

  // Aggregate by section
  const bySection: Record<string, { qty_ordered: number; product_count: number }> = {};
  (items || []).forEach((i: any) => {
    const sec = i.section_id || 'other';
    if (!bySection[sec]) bySection[sec] = { qty_ordered: 0, product_count: 0 };
    bySection[sec].qty_ordered += i.qty_ordered || 0;
  });
  // Count unique products per section
  const secProdSets: Record<string, Set<string>> = {};
  (items || []).forEach((i: any) => {
    const sec = i.section_id || 'other';
    if (!secProdSets[sec]) secProdSets[sec] = new Set();
    secProdSets[sec].add(i.product_id);
  });
  Object.keys(bySection).forEach(sec => { bySection[sec].product_count = secProdSets[sec]?.size || 0; });

  const sectionRanking = Object.entries(bySection)
    .map(([sec, v]) => ({ section_id: sec, ...v }))
    .sort((a, b) => b.qty_ordered - a.qty_ordered);

  // Daily trend (total qty ordered per day)
  const dailyTrend: Record<string, number> = {};
  for (let i = 0; i < days; i++) {
    const d = sydneyNow(); d.setDate(d.getDate() - i);
    dailyTrend[d.toISOString().split('T')[0]] = 0;
  }
  (items || []).forEach((i: any) => {
    const ord = orderMap[i.order_id];
    if (!ord) return;
    if (dailyTrend[ord.delivery_date] !== undefined) dailyTrend[ord.delivery_date] += i.qty_ordered || 0;
  });

  return json({
    success: true,
    data: {
      products: products.slice(0, 20),
      byStore: storeRanking,
      bySection: sectionRanking,
      dailyTrend: Object.entries(dailyTrend).sort().map(([date, qty]) => ({ date, qty })),
      period_days: days,
      total_orders: orderIds.length,
      total_items: (items || []).length,
      total_qty: (items || []).reduce((s: number, i: any) => s + (i.qty_ordered || 0), 0),
    }
  });
}

// ─── POST Report Return ──────────────────────────────────────
async function h_reportReturn(session: any, _dm: any, body: any) {
  const perm = await checkPermission(session, 'fn_create_return');
  if (!perm.allowed) return json({ success: false, error: 'PERMISSION_DENIED', message: perm.reason }, 403);

  // v6.0: order_id is optional
  const required = ['product_id', 'quantity', 'issue_type', 'description', 'action'];
  for (const field of required) {
    if (!body[field]) return json({ success: false, error: 'MISSING_FIELD', message: field + ' required' }, 400);
  }

  if (!['return_to_bakery', 'discard_at_store'].includes(body.action)) {
    return json({ success: false, error: 'INVALID_ACTION' }, 400);
  }

  const { data: lastRtn } = await db.from('bc_returns').select('return_id').order('created_at', { ascending: false }).limit(1);
  const nextNum = lastRtn && lastRtn.length > 0 ? parseInt(lastRtn[0].return_id.replace('RTN-','')) + 1 : 1;
  const returnId = 'RTN-' + String(nextNum).padStart(6, '0');

  await db.from('bc_returns').insert({
    return_id: returnId, order_id: body.order_id || null, item_id: body.item_id || null,
    product_id: body.product_id, store_id: session.store_id, dept_id: session.dept_id,
    reported_by: session.user_id, quantity: parseInt(body.quantity),
    issue_type: body.issue_type, description: body.description,
    production_date: body.production_date || '', action: body.action, status: 'Reported',
  });

  // Auto-waste if discard_at_store
  if (body.action === 'discard_at_store') {
    const { data: lastW } = await db.from('bc_waste_log').select('waste_id').order('created_at', { ascending: false }).limit(1);
    const wNum = lastW && lastW.length > 0 ? parseInt(lastW[0].waste_id.replace('WST-','')) + 1 : 1;
    await db.from('bc_waste_log').insert({
      waste_id: 'WST-' + String(wNum).padStart(6, '0'),
      product_id: body.product_id, quantity: parseInt(body.quantity),
      waste_date: sydneyDateStr(), production_date: body.production_date || '',
      source_type: 'return_store', source_store_id: session.store_id, source_dept_id: session.dept_id,
      reason: 'ReturnDiscard', return_id: returnId, recorded_by: session.user_id,
    });
  }

  return json({ success: true, message: '✅ รายงาน Return เรียบร้อย', data: { return_id: returnId } });
}

// ─── GET Returns ─────────────────────────────────────────────
async function h_getReturns(session: any, _dm: any, params: URLSearchParams) {
  const perm = await checkPermission(session, 'fn_view_returns');
  if (!perm.allowed) return json({ success: false, error: 'PERMISSION_DENIED', message: perm.reason }, 403);

  let query = db.from('bc_returns').select('*').order('created_at', { ascending: false });
  
  // v6.2: Scope filtering - BC sees all (filtered by section), store sees own
  const moduleRole = _dm?.module_role || 'store';
  if (moduleRole === 'bc_management') {
    // See everything
  } else if (moduleRole === 'bc_production') {
    const sectionScope: string[] = _dm?.section_scope ? (typeof _dm.section_scope === 'string' ? _dm.section_scope.split(',') : _dm.section_scope) : [];
    if (sectionScope.length > 0) {
      const { data: secProds } = await db.from('bc_products').select('product_id').in('section_id', sectionScope);
      const prodIds = (secProds || []).map((p: any) => p.product_id);
      if (prodIds.length > 0) query = query.in('product_id', prodIds);
    }
  } else {
    if (session.store_id && session.store_id !== 'ALL') {
      query = query.eq('store_id', session.store_id);
    }
  }
  
  if (params.get('status')) query = query.eq('status', params.get('status'));

  const { data: returns } = await query;
  
  // Enrich with product names
  const pIds = [...new Set((returns || []).map((r: any) => r.product_id))];
  let prodMap: Record<string, any> = {};
  if (pIds.length > 0) {
    const { data: prods } = await db.from('bc_products').select('product_id, product_name, unit, section_id').in('product_id', pIds);
    (prods || []).forEach((p: any) => prodMap[p.product_id] = p);
  }
  
  const enriched = (returns || []).map((r: any) => ({
    ...r,
    product_name: prodMap[r.product_id]?.product_name || r.product_id,
    unit: prodMap[r.product_id]?.unit || '',
    section_id: prodMap[r.product_id]?.section_id || r.section_id || '',
  }));

  return json({ success: true, data: enriched, count: enriched.length });
}


// ─── BC Fulfilment: Accept Pending ───────────────────────────
async function h_acceptPending(session: any, _dm: any, body: any) {
  const perm = await checkPermission(session, 'fn_accept_pending');
  if (!perm.allowed) return json({ success: false, error: 'PERMISSION_DENIED', message: perm.reason }, 403);

  const orderId = body.order_id;
  if (!orderId) return json({ success: false, error: 'MISSING_PARAM' }, 400);

  await db.from('bc_orders').update({
    status: 'Ordered', accepted_by: session.user_id, accepted_at: new Date().toISOString(), updated_at: new Date().toISOString()
  }).eq('order_id', orderId);

  return json({ success: true, message: '✅ Accept pending order', data: { order_id: orderId } });
}

// ─── BC Fulfilment: Update Fulfilment ────────────────────────
async function h_updateFulfilment(session: any, _dm: any, body: any) {
  const perm = await checkPermission(session, 'fn_update_fulfilment');
  if (!perm.allowed) return json({ success: false, error: 'PERMISSION_DENIED', message: perm.reason }, 403);

  if (!body.item_id || !body.fulfilment_status) {
    return json({ success: false, error: 'MISSING_FIELDS' }, 400);
  }

  // Get item to determine qty
  const { data: item } = await db.from('bc_order_items').select('*').eq('item_id', body.item_id).single();
  if (!item) return json({ success: false, error: 'NOT_FOUND' }, 404);

  const now = new Date().toISOString();
  const qtySent = body.fulfilment_status === 'full' ? item.qty_ordered : (parseInt(body.qty_sent) || 0);

  await db.from('bc_order_items').update({
    fulfilment_status: body.fulfilment_status, qty_sent: qtySent,
    fulfilment_note: body.note || '', fulfilled_by: session.user_id, fulfilled_at: now,
  }).eq('item_id', body.item_id);

  // Check if all items fulfilled
  const { data: allItems } = await db.from('bc_order_items').select('fulfilment_status').eq('order_id', item.order_id);
  const allDone = (allItems || []).every((i: any) => ['full', 'partial', 'zero'].includes(i.fulfilment_status));
  const newStatus = allDone ? 'Fulfilled' : 'InProgress';

  await db.from('bc_orders').update({ status: newStatus, updated_at: now }).eq('order_id', item.order_id);

  return json({ success: true, message: '✅ อัปเดต fulfilment', data: { item_id: body.item_id, status: body.fulfilment_status } });
}

// ─── BC Fulfilment: Mark Delivered ───────────────────────────
async function h_markDelivered(session: any, _dm: any, body: any) {
  const perm = await checkPermission(session, 'fn_mark_delivered');
  if (!perm.allowed) return json({ success: false, error: 'PERMISSION_DENIED', message: perm.reason }, 403);

  const orderId = body.order_id;
  if (!orderId) return json({ success: false, error: 'MISSING_PARAM' }, 400);

  const now = new Date().toISOString();
  await db.from('bc_orders').update({
    status: 'Delivered', delivered_by: session.user_id, delivered_at: now, updated_at: now,
  }).eq('order_id', orderId);

  // Stock: release holds + deduct sent
  const { data: items } = await db.from('bc_order_items').select('*').eq('order_id', orderId);
  const productIds = (items || []).map((i: any) => i.product_id);
  const { data: prods } = await db.from('bc_products').select('product_id, allow_stock').in('product_id', productIds.length ? productIds : ['_none_']);
  const prodMap: Record<string, any> = {};
  (prods || []).forEach((p: any) => prodMap[p.product_id] = p);

  for (const item of (items || [])) {
    if (prodMap[item.product_id]?.allow_stock) {
      await addStockMovement(item.product_id, item.section_id, 'order_release', item.qty_ordered, item.item_id, 'Deliver release: ' + orderId, session.user_id);
      if (item.qty_sent > 0) {
        await addStockMovement(item.product_id, item.section_id, 'deliver_deduct', -item.qty_sent, item.item_id, 'Delivered: ' + orderId, session.user_id);
      }
    }
  }

  return json({ success: true, message: '✅ Marked as delivered', data: { order_id: orderId } });
}

// ─── Stock: Add / Remove ─────────────────────────────────────
async function h_addStock(session: any, _dm: any, body: any) {
  const perm = await checkPermission(session, 'fn_add_stock');
  if (!perm.allowed) return json({ success: false, error: 'PERMISSION_DENIED' }, 403);
  if (!body.product_id || !body.quantity) return json({ success: false, error: 'MISSING_FIELDS' }, 400);

  const { data: prod } = await db.from('bc_products').select('section_id').eq('product_id', body.product_id).single();
  if (!prod) return json({ success: false, error: 'INVALID_PRODUCT' }, 400);

  await addStockMovement(body.product_id, prod.section_id, 'add', parseInt(body.quantity), '', body.note || 'Stock added', session.user_id);
  return json({ success: true, message: '✅ เพิ่มสต็อกเรียบร้อย' });
}

async function h_removeStock(session: any, _dm: any, body: any) {
  const perm = await checkPermission(session, 'fn_remove_stock');
  if (!perm.allowed) return json({ success: false, error: 'PERMISSION_DENIED' }, 403);
  if (!body.product_id || !body.quantity) return json({ success: false, error: 'MISSING_FIELDS' }, 400);

  const { data: prod } = await db.from('bc_products').select('section_id').eq('product_id', body.product_id).single();
  if (!prod) return json({ success: false, error: 'INVALID_PRODUCT' }, 400);

  await addStockMovement(body.product_id, prod.section_id, 'remove', -Math.abs(parseInt(body.quantity)), '', body.note || 'Stock removed', session.user_id);
  return json({ success: true, message: '✅ ลดสต็อกเรียบร้อย' });
}

// ─── Resolve Return ──────────────────────────────────────────
async function h_resolveReturn(session: any, _dm: any, body: any) {
  const perm = await checkPermission(session, 'fn_resolve_return');
  if (!perm.allowed) return json({ success: false, error: 'PERMISSION_DENIED' }, 403);
  if (!body.return_id || !body.status) return json({ success: false, error: 'MISSING_FIELDS' }, 400);

  const now = new Date().toISOString();
  const { data: rtn } = await db.from('bc_returns').select('*').eq('return_id', body.return_id).single();
  if (!rtn) return json({ success: false, error: 'NOT_FOUND' }, 404);

  await db.from('bc_returns').update({
    status: body.status, failure_reason: body.failure_reason || '',
    resolved_by: session.user_id, resolved_at: now, updated_at: now,
  }).eq('return_id', body.return_id);

  // Auto-waste if Wasted
  if (body.status === 'Wasted') {
    const { data: lastW } = await db.from('bc_waste_log').select('waste_id').order('created_at', { ascending: false }).limit(1);
    const wNum = lastW && lastW.length > 0 ? parseInt(lastW[0].waste_id.replace('WST-','')) + 1 : 1;
    await db.from('bc_waste_log').insert({
      waste_id: 'WST-' + String(wNum).padStart(6, '0'),
      product_id: rtn.product_id, quantity: rtn.quantity,
      waste_date: sydneyDateStr(), production_date: rtn.production_date || '',
      source_type: 'return_bakery', reason: 'ReturnDiscard', return_id: body.return_id,
      recorded_by: session.user_id,
    });
  }

  return json({ success: true, message: '✅ Resolve return', data: { return_id: body.return_id } });
}

// ─── GET Config ──────────────────────────────────────────────
// v6.2: Edit Return (Store)
async function h_editReturn(session: any, _dm: any, body: any) {
  const perm = await checkPermission(session, 'fn_create_return');
  if (!perm.allowed) return json({ success: false, error: 'PERMISSION_DENIED' }, 403);
  if (!body.return_id) return json({ success: false, error: 'MISSING_RETURN_ID' }, 400);

  const { data: rtn } = await db.from('bc_returns').select('*').eq('return_id', body.return_id).single();
  if (!rtn) return json({ success: false, error: 'NOT_FOUND' }, 404);
  if (rtn.status !== 'Reported') return json({ success: false, error: 'CANNOT_EDIT', message: 'BC already processed' }, 400);
  if (rtn.store_id !== session.store_id && session.store_id !== 'ALL') return json({ success: false, error: 'NOT_YOUR_RETURN' }, 403);

  const updates: any = { updated_at: new Date().toISOString() };
  if (body.quantity) updates.quantity = parseInt(body.quantity);
  if (body.issue_type) updates.issue_type = body.issue_type;
  if (body.description) updates.description = body.description;
  if (body.product_id) updates.product_id = body.product_id;

  await db.from('bc_returns').update(updates).eq('return_id', body.return_id);
  return json({ success: true, message: 'Updated', data: { return_id: body.return_id } });
}

// v6.2: Return Dashboard
async function h_getReturnDashboard(session: any, _dm: any, params: URLSearchParams) {
  const days = parseInt(params.get('days') || '30');
  const cutoff = sydneyNow(); cutoff.setDate(cutoff.getDate() - days);
  const { data: returns } = await db.from('bc_returns').select('*').gte('created_at', cutoff.toISOString()).order('created_at', { ascending: false });
  let all = returns || [];
  const moduleRole = _dm?.module_role || 'store';
  if (moduleRole === 'bc_management') { /* see all */ }
  else if (moduleRole === 'bc_production') {
    const ss: string[] = _dm?.section_scope ? (typeof _dm.section_scope === 'string' ? _dm.section_scope.split(',') : _dm.section_scope) : [];
    if (ss.length > 0) {
      const pIds = [...new Set(all.map((r: any) => r.product_id))];
      if (pIds.length > 0) {
        const { data: prods } = await db.from('bc_products').select('product_id, section_id').in('product_id', pIds);
        const ok = new Set((prods || []).filter((p: any) => ss.includes(p.section_id)).map((p: any) => p.product_id));
        all = all.filter((r: any) => ok.has(r.product_id));
      }
    }
  } else {
    if (session.store_id && session.store_id !== 'ALL') all = all.filter((r: any) => r.store_id === session.store_id);
  }
  const pIds = [...new Set(all.map((r: any) => r.product_id))];
  let pm: Record<string, any> = {};
  if (pIds.length > 0) {
    const { data: prods } = await db.from('bc_products').select('product_id, product_name, section_id').in('product_id', pIds);
    (prods || []).forEach((p: any) => pm[p.product_id] = p);
  }
  const byStatus: Record<string, number> = {};
  all.forEach((r: any) => { byStatus[r.status] = (byStatus[r.status] || 0) + 1; });
  const byStore: Record<string, { count: number; qty: number }> = {};
  all.forEach((r: any) => { const s = r.store_id || '?'; if (!byStore[s]) byStore[s] = { count: 0, qty: 0 }; byStore[s].count++; byStore[s].qty += r.quantity || 0; });
  const byReason: Record<string, { count: number; qty: number }> = {};
  all.forEach((r: any) => { const rs = r.issue_type || 'Other'; if (!byReason[rs]) byReason[rs] = { count: 0, qty: 0 }; byReason[rs].count++; byReason[rs].qty += r.quantity || 0; });
  const byProd: Record<string, { name: string; count: number; qty: number; section: string }> = {};
  all.forEach((r: any) => { const pid = r.product_id; if (!byProd[pid]) { const p = pm[pid]; byProd[pid] = { name: p?.product_name || pid, count: 0, qty: 0, section: p?.section_id || '' }; } byProd[pid].count++; byProd[pid].qty += r.quantity || 0; });
  const topProducts = Object.values(byProd).sort((a: any, b: any) => b.qty - a.qty).slice(0, 10);
  return json({ success: true, data: {
    summary: { total: all.length, total_qty: all.reduce((s: number, r: any) => s + (r.quantity || 0), 0) },
    byStatus,
    byStore: Object.entries(byStore).map(([sid, v]) => ({ store_id: sid, ...v })).sort((a: any, b: any) => b.count - a.count),
    byReason: Object.entries(byReason).map(([r, v]) => ({ reason: r, ...v })).sort((a: any, b: any) => b.count - a.count),
    topProducts, period_days: days,
  }});
}

async function h_getConfig(session: any, deptMapping: any) {
  const { data } = await db.from('bc_config').select('config_key, config_value');
  const config: Record<string, string> = {};
  (data || []).forEach((r: any) => config[r.config_key] = r.config_value);
  return json({ success: true, data: config, session, deptMapping });
}

// ─── GET Notifications ───────────────────────────────────────
async function h_getNotifications(session: any) {
  const today = sydneyDateStr();
  const { data } = await db.from('bc_notifications').select('*').eq('is_active', true).order('created_at', { ascending: false });
  
  // Auto-deactivate expired notifications
  const expired = (data || []).filter((n: any) => n.end_date && n.end_date < today);
  if (expired.length > 0) {
    const expiredIds = expired.map((n: any) => n.notif_id);
    await db.from('bc_notifications').update({ is_active: false }).in('notif_id', expiredIds);
    console.log(`[notifications] Auto-deactivated ${expiredIds.length} expired notifications`);
  }
  
  const filtered = (data || []).filter((n: any) => {
    if (n.start_date && n.start_date > today) return false;
    if (n.end_date && n.end_date < today) return false;
    if (n.audience === 'all') return true;
    if (n.audience === 'store' && session.store_id !== 'BC') return true;
    if (n.audience === 'bakery' && session.store_id === 'BC') return true;
    if (n.audience === session.store_id) return true;
    return false;
  });

  return json({ success: true, data: filtered });
}

// ─── Admin: GET All Announcements (for management) ──────────
async function h_getAnnouncements(session: any) {
  if (!isAdmin(session)) return json({ success: false, error: 'ADMIN_ONLY' }, 403);
  const { data } = await db.from('bc_notifications').select('*').order('created_at', { ascending: false });
  return json({ success: true, data: data || [] });
}

// ─── Admin: Create Announcement ──────────────────────────────
async function h_createAnnouncement(session: any, body: any) {
  if (!isAdmin(session)) return json({ success: false, error: 'ADMIN_ONLY' }, 403);
  
  if (!body.title || !body.message) {
    return json({ success: false, error: 'MISSING_FIELDS', message: 'title, message required' }, 400);
  }

  // Generate ID
  const { data: last } = await db.from('bc_notifications').select('notif_id').order('created_at', { ascending: false }).limit(1);
  const nextNum = last && last.length > 0 ? parseInt(last[0].notif_id.replace('NTF-','')) + 1 : 1;
  const notifId = 'NTF-' + String(nextNum).padStart(4, '0');

  await db.from('bc_notifications').insert({
    notif_id: notifId,
    type: body.type || 'broadcast',
    title: body.title,
    message: body.message,
    audience: body.audience || 'all',
    start_date: body.start_date || null,
    end_date: body.end_date || null,
    is_active: true,
    created_by: session.user_id,
    created_at: new Date().toISOString(),
  });

  return json({ success: true, message: '✅ สร้าง Announcement เรียบร้อย', data: { notif_id: notifId } });
}

// ─── Admin: Update Announcement ──────────────────────────────
async function h_updateAnnouncement(session: any, body: any) {
  if (!isAdmin(session)) return json({ success: false, error: 'ADMIN_ONLY' }, 403);
  if (!body.notif_id) return json({ success: false, error: 'MISSING_PARAM' }, 400);

  const updates: any = {};
  if (body.title !== undefined) updates.title = body.title;
  if (body.message !== undefined) updates.message = body.message;
  if (body.audience !== undefined) updates.audience = body.audience;
  if (body.start_date !== undefined) updates.start_date = body.start_date || null;
  if (body.end_date !== undefined) updates.end_date = body.end_date || null;
  if (body.is_active !== undefined) updates.is_active = body.is_active;
  if (body.type !== undefined) updates.type = body.type;

  if (Object.keys(updates).length === 0) return json({ success: false, error: 'NO_CHANGES' }, 400);

  await db.from('bc_notifications').update(updates).eq('notif_id', body.notif_id);
  await logAudit(session, 'update_announcement', 'notification', body.notif_id, null, updates);

  return json({ success: true, message: '✅ อัพเดตเรียบร้อย' });
}

// ─── Admin: Delete Announcement ──────────────────────────────
async function h_deleteAnnouncement(session: any, body: any) {
  if (!isAdmin(session)) return json({ success: false, error: 'ADMIN_ONLY' }, 403);
  if (!body.notif_id) return json({ success: false, error: 'MISSING_PARAM' }, 400);

  await db.from('bc_notifications').delete().eq('notif_id', body.notif_id);
  return json({ success: true, message: '✅ ลบเรียบร้อย' });
}

// ─── GET Dashboard ───────────────────────────────────────────
async function h_getDashboard(session: any, deptMapping: any) {
  // Dashboard is viewable by anyone who can see orders (own or all)
  const perm = await checkPermission(session, 'fn_view_own_orders');
  if (!perm.allowed) return json({ success: false, error: 'PERMISSION_DENIED', message: perm.reason }, 403);

  const today = sydneyDateStr();
  let query = db.from('bc_orders').select('*');
  
  // Store users: filter by their store only
  // BC users: see ALL stores
  if (deptMapping.module_role === 'store' && session.store_id !== 'ALL') {
    query = query.eq('store_id', session.store_id);
  }

  const { data: orders } = await query;
  let todayOrders = (orders || []).filter((o: any) => o.delivery_date === today || o.order_date === today);

  // BC production: filter by section_scope (only count orders with items in their section)
  const isBCScoped = (deptMapping.module_role === 'bc_production' || deptMapping.module_role === 'bc_management') 
    && deptMapping.section_scope && deptMapping.section_scope.length > 0;
  
  if (isBCScoped && todayOrders.length > 0) {
    const todayIds = todayOrders.map((o: any) => o.order_id);
    const { data: items } = await db.from('bc_order_items')
      .select('order_id, section_id, is_urgent')
      .in('order_id', todayIds);
    
    const scope = deptMapping.section_scope;
    const orderHasSection = new Set<string>();
    let urgentCount = 0;
    (items || []).forEach((i: any) => {
      if (scope.includes(i.section_id)) {
        orderHasSection.add(i.order_id);
        if (i.is_urgent) urgentCount++;
      }
    });
    
    todayOrders = todayOrders.filter((o: any) => orderHasSection.has(o.order_id));
    
    const dashboard = {
      today_total: todayOrders.length,
      by_status: {
        Pending: todayOrders.filter((o: any) => o.status === 'Pending').length,
        Ordered: todayOrders.filter((o: any) => o.status === 'Ordered').length,
        InProgress: todayOrders.filter((o: any) => o.status === 'InProgress').length,
        Fulfilled: todayOrders.filter((o: any) => o.status === 'Fulfilled').length,
        Delivered: todayOrders.filter((o: any) => o.status === 'Delivered').length,
      },
      cutoff_violations_today: todayOrders.filter((o: any) => o.is_cutoff_violation).length,
      urgent_items: urgentCount,
    };
    return json({ success: true, data: dashboard });
  }

  const dashboard = {
    today_total: todayOrders.length,
    by_status: {
      Pending: todayOrders.filter((o: any) => o.status === 'Pending').length,
      Ordered: todayOrders.filter((o: any) => o.status === 'Ordered').length,
      InProgress: todayOrders.filter((o: any) => o.status === 'InProgress').length,
      Fulfilled: todayOrders.filter((o: any) => o.status === 'Fulfilled').length,
      Delivered: todayOrders.filter((o: any) => o.status === 'Delivered').length,
    },
    cutoff_violations_today: todayOrders.filter((o: any) => o.is_cutoff_violation).length,
    urgent_items: 0,
  };

  const todayIds = todayOrders.map((o: any) => o.order_id);
  if (todayIds.length > 0) {
    const { data: items } = await db.from('bc_order_items').select('is_urgent').in('order_id', todayIds);
    dashboard.urgent_items = (items || []).filter((i: any) => i.is_urgent).length;
  }

  return json({ success: true, data: dashboard });
}


// ═══════════════════════════════════════════════════════════════
// 4B. ADMIN ENDPOINTS (A4, A6, A8, A9 + Config/Product)
// ═══════════════════════════════════════════════════════════════

// Helper: check admin (T1/T2)
function isAdmin(session: any) {
  const tier = parseInt((session.tier_id || 'T9').replace('T', ''));
  return tier <= 2;
}

// Helper: log audit trail
async function logAudit(session: any, actionType: string, targetType: string, targetId: string, oldValue: any, newValue: any) {
  try {
    await db.from('bc_audit_log').insert({
      action_type: actionType,
      target_type: targetType,
      target_id: targetId,
      old_value: JSON.stringify(oldValue),
      new_value: JSON.stringify(newValue),
      changed_by: session.staff_id,
      changed_by_name: session.display_name,
      changed_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error('Audit log failed:', e);
  }
}

// ─── GET My Permissions (for menu visibility) ───────────────
async function h_getMyPermissions(session: any) {
  const { data } = await db.from('bc_tier_function_permission')
    .select('function_id')
    .eq('tier_id', session.tier_id)
    .eq('allowed', true);
  
  const fns = (data || []).map((r: any) => r.function_id);
  return json({ success: true, data: fns, tier: session.tier_id });
}

// ─── A6: GET All Permissions ─────────────────────────────────
async function h_getPermissions(session: any) {
  if (!isAdmin(session)) return json({ success: false, error: 'ADMIN_ONLY' }, 403);

  // Get all functions
  const { data: functions } = await db.from('bc_functions')
    .select('*')
    .order('sort_order', { ascending: true });

  // Get all permissions
  const { data: permissions } = await db.from('bc_tier_function_permission')
    .select('*');

  // Build matrix: { function_id: { T1: true, T2: false, ... } }
  const matrix: Record<string, Record<string, boolean>> = {};
  (permissions || []).forEach((p: any) => {
    if (!matrix[p.function_id]) matrix[p.function_id] = {};
    matrix[p.function_id][p.tier_id] = p.allowed;
  });

  return json({ success: true, data: { functions: functions || [], matrix } });
}

// ─── A6: UPDATE Permission Toggle ────────────────────────────
async function h_updatePermission(session: any, body: any) {
  if (!isAdmin(session)) return json({ success: false, error: 'ADMIN_ONLY' }, 403);
  
  const { function_id, tier_id, allowed } = body;
  if (!function_id || !tier_id) return json({ success: false, error: 'MISSING_PARAMS' }, 400);

  // Get current value for audit
  const { data: current } = await db.from('bc_tier_function_permission')
    .select('allowed')
    .eq('function_id', function_id)
    .eq('tier_id', tier_id)
    .single();

  const oldVal = current ? current.allowed : null;
  const newVal = !!allowed;

  if (current) {
    // Update existing
    await db.from('bc_tier_function_permission')
      .update({ allowed: newVal })
      .eq('function_id', function_id)
      .eq('tier_id', tier_id);
  } else {
    // Insert new
    await db.from('bc_tier_function_permission')
      .insert({ function_id, tier_id, allowed: newVal });
  }

  await logAudit(session, 'update_permission', 'permission', `${function_id}:${tier_id}`, { allowed: oldVal }, { allowed: newVal });

  return json({ success: true, message: `✅ ${function_id} × ${tier_id} → ${newVal}` });
}

// ─── A8: GET All Dept Mappings ───────────────────────────────
async function h_getDeptMappings(session: any) {
  if (!isAdmin(session)) return json({ success: false, error: 'ADMIN_ONLY' }, 403);

  const { data } = await db.from('bc_dept_scope_mapping')
    .select('*')
    .order('dept_id');

  return json({ success: true, data: data || [] });
}

// ─── A8: UPDATE Dept Mapping ─────────────────────────────────
async function h_updateDeptMapping(session: any, body: any) {
  if (!isAdmin(session)) return json({ success: false, error: 'ADMIN_ONLY' }, 403);

  const { dept_id, module_role, section_scope, is_active } = body;
  if (!dept_id) return json({ success: false, error: 'MISSING_PARAMS' }, 400);

  // Get current for audit
  const { data: current } = await db.from('bc_dept_scope_mapping')
    .select('*')
    .eq('dept_id', dept_id)
    .single();

  const updates: any = {};
  if (module_role !== undefined) updates.module_role = module_role;
  if (section_scope !== undefined) updates.section_scope = section_scope;
  if (is_active !== undefined) updates.is_active = is_active;

  if (current) {
    await db.from('bc_dept_scope_mapping')
      .update(updates)
      .eq('dept_id', dept_id);
  } else {
    await db.from('bc_dept_scope_mapping')
      .insert({ dept_id, module_role: module_role || 'store', section_scope: section_scope || '', is_active: is_active !== false });
  }

  await logAudit(session, 'update_dept_mapping', 'dept_mapping', dept_id, current, { ...current, ...updates });

  return json({ success: true, message: `✅ Updated ${dept_id}` });
}

// ─── A4: GET Notification Settings ───────────────────────────
async function h_getNotifSettings(session: any) {
  if (!isAdmin(session)) return json({ success: false, error: 'ADMIN_ONLY' }, 403);

  // Read from bc_config with notif_ prefix
  const { data } = await db.from('bc_config')
    .select('config_key, config_value')
    .like('config_key', 'notif_%');

  const settings: Record<string, boolean> = {};
  (data || []).forEach((r: any) => {
    settings[r.config_key] = r.config_value === 'true' || r.config_value === '1';
  });

  // Define all possible notification settings with defaults
  const allKeys = [
    'notif_store_new_order', 'notif_store_order_status', 'notif_store_cutoff_warning',
    'notif_bc_new_order', 'notif_bc_order_status', 'notif_bc_cutoff_alert',
    'notif_bc_stock_low', 'notif_admin_daily_summary',
  ];

  const result: Record<string, boolean> = {};
  allKeys.forEach(k => result[k] = settings[k] !== undefined ? settings[k] : true);

  return json({ success: true, data: result });
}

// ─── A4: UPDATE Notification Setting ─────────────────────────
async function h_updateNotifSetting(session: any, body: any) {
  if (!isAdmin(session)) return json({ success: false, error: 'ADMIN_ONLY' }, 403);

  const { config_key, enabled } = body;
  if (!config_key || !config_key.startsWith('notif_')) return json({ success: false, error: 'INVALID_KEY' }, 400);

  const newVal = enabled ? 'true' : 'false';
  
  // Upsert
  const { data: existing } = await db.from('bc_config')
    .select('config_value')
    .eq('config_key', config_key)
    .single();

  if (existing) {
    await db.from('bc_config')
      .update({ config_value: newVal })
      .eq('config_key', config_key);
  } else {
    await db.from('bc_config')
      .insert({ config_key, config_value: newVal });
  }

  await logAudit(session, 'update_notif_setting', 'config', config_key, { value: existing?.config_value }, { value: newVal });

  return json({ success: true, message: `✅ ${config_key} → ${newVal}` });
}

// ─── A5: UPDATE Config ───────────────────────────────────────
async function h_updateConfig(session: any, body: any) {
  if (!isAdmin(session)) return json({ success: false, error: 'ADMIN_ONLY' }, 403);

  const { config_key, config_value } = body;
  if (!config_key) return json({ success: false, error: 'MISSING_PARAMS' }, 400);

  const { data: existing } = await db.from('bc_config')
    .select('config_value')
    .eq('config_key', config_key)
    .single();

  if (existing) {
    await db.from('bc_config')
      .update({ config_value })
      .eq('config_key', config_key);
  } else {
    await db.from('bc_config')
      .insert({ config_key, config_value });
  }

  await logAudit(session, 'update_config', 'config', config_key, { value: existing?.config_value }, { value: config_value });

  return json({ success: true, message: `✅ ${config_key} → ${config_value}` });
}

// ─── A3: UPDATE Product (toggle active) ──────────────────────
// N-02: Create new product
async function h_createProduct(session: any, body: any) {
  if (!isAdmin(session)) return json({ success: false, error: 'ADMIN_ONLY' }, 403);

  const { product_name, category_id, section_id, unit, min_order, max_order, order_step, allow_stock, description, image_url } = body;
  if (!product_name || !section_id) {
    return json({ success: false, error: 'MISSING_FIELDS', message: 'product_name and section_id required' }, 400);
  }

  // Generate product_id
  const { data: lastProd } = await db.from('bc_products').select('product_id').order('product_id', { ascending: false }).limit(1);
  const nextNum = lastProd && lastProd.length > 0 ? parseInt(lastProd[0].product_id.replace('PRD-','')) + 1 : 1;
  const productId = 'PRD-' + String(nextNum).padStart(3, '0');

  const { error } = await db.from('bc_products').insert({
    product_id: productId,
    product_name,
    category_id: category_id || null,
    section_id,
    unit: unit || 'pieces',
    min_order: min_order || 1,
    max_order: max_order || 100,
    order_step: order_step || 1,
    allow_stock: allow_stock !== false,
    is_active: true,
    sort_order: 999,
    description: description || '',
    image_url: image_url || '',
  });

  if (error) return json({ success: false, error: 'DB_ERROR', message: error.message }, 500);

  await logAudit(session, 'create_product', 'product', productId, null, { product_name, section_id });

  return json({ success: true, message: `✅ เพิ่มสินค้า "${product_name}" เรียบร้อย`, data: { product_id: productId } });
}

async function h_updateProduct(session: any, body: any) {
  if (!isAdmin(session)) return json({ success: false, error: 'ADMIN_ONLY' }, 403);

  const { product_id, is_active } = body;
  if (!product_id) return json({ success: false, error: 'MISSING_PARAMS' }, 400);

  const { data: current } = await db.from('bc_products')
    .select('*')
    .eq('product_id', product_id)
    .single();

  // N-02 fix: accept more fields for full edit
  const updates: any = {};
  if (is_active !== undefined) updates.is_active = !!is_active;
  if (body.product_name) updates.product_name = body.product_name;
  if (body.category_id) updates.category_id = body.category_id;
  if (body.section_id) updates.section_id = body.section_id;
  if (body.unit) updates.unit = body.unit;
  if (body.min_order !== undefined) updates.min_order = parseInt(body.min_order);
  if (body.max_order !== undefined) updates.max_order = parseInt(body.max_order);
  if (body.order_step !== undefined) updates.order_step = parseInt(body.order_step);
  if (body.allow_stock !== undefined) updates.allow_stock = !!body.allow_stock;
  if (body.description !== undefined) updates.description = body.description;
  if (body.image_url !== undefined) updates.image_url = body.image_url;

  await db.from('bc_products')
    .update(updates)
    .eq('product_id', product_id);

  await logAudit(session, 'update_product', 'product', product_id, { is_active: current?.is_active }, updates);

  return json({ success: true, message: `✅ ${current?.product_name || product_id} → อัพเดตแล้ว` });
}

// ─── GET Product Visibility ─────────────────────────────────
async function h_getProductVisibility(session: any, params: URLSearchParams) {
  if (!isAdmin(session)) return json({ success: false, error: 'ADMIN_ONLY' }, 403);
  
  const productId = params.get('product_id');
  let query = db.from('bc_product_visibility').select('*');
  if (productId) query = query.eq('product_id', productId);
  
  const { data } = await query;
  return json({ success: true, data: data || [] });
}

// ─── UPDATE Product Visibility (batch) ──────────────────────
async function h_updateProductVisibility(session: any, body: any) {
  if (!isAdmin(session)) return json({ success: false, error: 'ADMIN_ONLY' }, 403);
  
  const { product_id, visibility } = body;
  if (!product_id || !visibility) return json({ success: false, error: 'MISSING_PARAMS' }, 400);
  
  // visibility = [{ store_id, dept_id, is_active }]
  for (const v of visibility) {
    const { data: existing } = await db.from('bc_product_visibility')
      .select('visibility_id')
      .eq('product_id', product_id)
      .eq('store_id', v.store_id)
      .eq('dept_id', v.dept_id || '')
      .maybeSingle();
    
    if (existing) {
      await db.from('bc_product_visibility')
        .update({ is_active: v.is_active })
        .eq('visibility_id', existing.visibility_id);
    } else if (v.is_active) {
      // Create new
      const { data: lastVis } = await db.from('bc_product_visibility')
        .select('visibility_id').order('visibility_id', { ascending: false }).limit(1);
      const nextNum = lastVis && lastVis.length > 0 ? parseInt(lastVis[0].visibility_id.replace('VIS-','')) + 1 : 1;
      const visId = 'VIS-' + String(nextNum).padStart(4, '0');
      await db.from('bc_product_visibility').insert({
        visibility_id: visId, product_id, store_id: v.store_id, dept_id: v.dept_id || '', is_active: true,
      });
    }
  }
  
  return json({ success: true, message: '✅ อัพเดต visibility เรียบร้อย' });
}

// ─── A9: GET Audit Log ───────────────────────────────────────
async function h_getAuditLog(session: any, params: URLSearchParams) {
  if (!isAdmin(session)) return json({ success: false, error: 'ADMIN_ONLY' }, 403);

  let query = db.from('bc_audit_log')
    .select('*')
    .order('changed_at', { ascending: false })
    .limit(100);

  const filterType = params.get('target_type');
  if (filterType) query = query.eq('target_type', filterType);

  const filterDate = params.get('date');
  if (filterDate) {
    query = query.gte('changed_at', filterDate + 'T00:00:00')
                 .lt('changed_at', filterDate + 'T23:59:59');
  }

  const { data, error } = await query;
  
  if (error) {
    // Table might not exist yet
    return json({ success: true, data: [], message: 'Audit table may not exist yet. Run SQL to create bc_audit_log.' });
  }

  return json({ success: true, data: data || [] });
}


// ═══════════════════════════════════════════════════════════════
// 4B. MODULE ACCESS OVERRIDE (account_module_access for bc_order)
// ═══════════════════════════════════════════════════════════════

async function h_getModuleAccess(session: any) {
  if (!isAdmin(session)) return json({ success: false, error: 'ADMIN_ONLY' }, 403);

  // Get all active accounts
  const { data: accounts } = await db.from('accounts')
    .select('account_id, display_label, store_id, dept_id, tier_id, status')
    .eq('is_active', true)
    .order('account_id');

  // Get bc_order overrides
  const { data: overrides } = await db.from('account_module_access')
    .select('account_id, module_tier, is_active')
    .eq('module_id', 'bc_order')
    .eq('is_active', true);

  // Get tier list
  const { data: tiers } = await db.from('access_tiers')
    .select('tier_id, tier_name, tier_level')
    .eq('is_active', true)
    .order('tier_level');

  const overrideMap: Record<string, string> = {};
  (overrides || []).forEach((o: any) => { overrideMap[o.account_id] = o.module_tier; });

  return json({
    success: true,
    data: {
      accounts: (accounts || []).map((a: any) => ({
        ...a,
        bc_override: overrideMap[a.account_id] || null,
        effective_tier: overrideMap[a.account_id] || a.tier_id,
      })),
      tiers: tiers || [],
    }
  });
}

async function h_setModuleAccess(session: any, body: any) {
  if (!isAdmin(session)) return json({ success: false, error: 'ADMIN_ONLY' }, 403);

  const { account_id, module_tier } = body;
  if (!account_id || !module_tier) return json({ success: false, error: 'MISSING_FIELDS' }, 422);

  const { data, error } = await db.from('account_module_access')
    .upsert({
      account_id,
      module_id: 'bc_order',
      module_tier,
      is_active: true,
      updated_at: new Date().toISOString(),
      created_by: session.account_id,
    }, { onConflict: 'account_id,module_id' })
    .select()
    .single();

  if (error) return json({ success: false, error: error.message }, 500);

  return json({ success: true, message: `✅ ${account_id} → ${module_tier}`, data });
}

async function h_removeModuleAccess(session: any, body: any) {
  if (!isAdmin(session)) return json({ success: false, error: 'ADMIN_ONLY' }, 403);

  const { account_id } = body;
  if (!account_id) return json({ success: false, error: 'MISSING_FIELDS' }, 422);

  const { error } = await db.from('account_module_access')
    .delete()
    .eq('account_id', account_id)
    .eq('module_id', 'bc_order');

  if (error) return json({ success: false, error: error.message }, 500);

  return json({ success: true, message: `✅ ${account_id} → ใช้ Global Tier` });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

  try {
    const url = new URL(req.url);
    const params = url.searchParams;
    const action = params.get('action') || '';
    const token = params.get('token') || '';

    // Public endpoint
    if (action === 'health') return h_health();

    // All other endpoints require session
    const session = await validateSession(token);
    if (!session.valid) {
      return json({ success: false, error: 'INVALID_SESSION', message: (session as any).message || 'กรุณา login ใหม่' }, 401);
    }

    // Gate access
    if ((session as any).access_level === 'no_access') {
      return json({ success: false, error: 'NO_ACCESS', message: 'คุณไม่มีสิทธิ์เข้าใช้ BC Order Module' }, 403);
    }

    // Dept mapping
    const deptMapping = await getDeptMapping((session as any).dept_id);
    if ((session as any).dept_id !== 'ALL' && (!deptMapping || deptMapping.module_role === 'not_applicable')) {
      return json({ success: false, error: 'UNMAPPED_DEPT', message: 'Department ยังไม่ได้ตั้งค่าใน BC Order' }, 403);
    }

    // Parse body for POST
    let body: any = {};
    if (req.method === 'POST') {
      try { body = await req.json(); } catch { body = {}; }
    }

    // Route
    switch (action) {
      case 'get_categories':       return await h_getCategories();
      case 'get_products':         return await h_getProducts(session, deptMapping!, params);
      case 'get_stock':            return await h_getStock(session, deptMapping!);
      case 'get_orders':           return await h_getOrders(session, deptMapping!, params);
      case 'get_order_detail':     return await h_getOrderDetail(session, deptMapping!, params);
      case 'get_returns':          return await h_getReturns(session, deptMapping!, params);
      case 'get_waste_log':        return await h_getWasteLog(session, deptMapping!, params);
      case 'get_waste_dashboard':   return await h_getWasteDashboard(session, deptMapping!, params);
      case 'get_top_products':      return await h_getTopProducts(session, deptMapping!, params);
      case 'get_config':           return await h_getConfig(session, deptMapping!);
      case 'get_notifications':    return await h_getNotifications(session);
      case 'get_announcements':    return await h_getAnnouncements(session);
      case 'create_announcement':  return await h_createAnnouncement(session, body);
      case 'update_announcement':  return await h_updateAnnouncement(session, body);
      case 'delete_announcement':  return await h_deleteAnnouncement(session, body);
      case 'get_dashboard':        return await h_getDashboard(session, deptMapping!);

      case 'create_order':         return await h_createOrder(session, deptMapping!, body);
      case 'edit_order':           return await h_editOrder(session, deptMapping!, body);
      case 'delete_order':         return await h_deleteOrder(session, deptMapping!, body);
      case 'create_waste':         return await h_createWaste(session, deptMapping!, body);
      case 'edit_waste':           return await h_editWaste(session, deptMapping!, body);
      case 'delete_waste':         return await h_deleteWaste(session, deptMapping!, body);
      case 'report_return':        return await h_reportReturn(session, deptMapping!, body);
      case 'edit_return':          return await h_editReturn(session, deptMapping!, body);
      case 'get_return_dashboard': return await h_getReturnDashboard(session, deptMapping!, params);

      case 'accept_pending':       return await h_acceptPending(session, deptMapping!, body);
      case 'update_fulfilment':    return await h_updateFulfilment(session, deptMapping!, body);
      case 'mark_delivered':       return await h_markDelivered(session, deptMapping!, body);
      case 'add_stock':            return await h_addStock(session, deptMapping!, body);
      case 'remove_stock':         return await h_removeStock(session, deptMapping!, body);
      case 'resolve_return':       return await h_resolveReturn(session, deptMapping!, body);

      // Admin endpoints (A3-A9)
      case 'get_permissions':      return await h_getPermissions(session);
      case 'get_my_permissions':   return await h_getMyPermissions(session);
      case 'update_permission':    return await h_updatePermission(session, body);
      case 'get_dept_mappings':    return await h_getDeptMappings(session);
      case 'update_dept_mapping':  return await h_updateDeptMapping(session, body);
      case 'get_notif_settings':   return await h_getNotifSettings(session);
      case 'update_notif_setting': return await h_updateNotifSetting(session, body);
      case 'update_config':        return await h_updateConfig(session, body);
      case 'update_product':       return await h_updateProduct(session, body);
      case 'create_product':       return await h_createProduct(session, body);
      case 'get_product_visibility':  return await h_getProductVisibility(session, params);
      case 'update_product_visibility': return await h_updateProductVisibility(session, body);
      case 'get_audit_log':        return await h_getAuditLog(session, params);
      case 'get_module_access':    return await h_getModuleAccess(session);
      case 'set_module_access':    return await h_setModuleAccess(session, body);
      case 'remove_module_access': return await h_removeModuleAccess(session, body);

      default:
        return json({ success: false, error: 'UNKNOWN_ACTION', message: 'Unknown action: ' + action }, 400);
    }

  } catch (err: any) {
    return json({ success: false, error: 'SERVER_ERROR', message: err.message }, 500);
  }
});
