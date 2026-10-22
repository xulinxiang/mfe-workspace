SET NAMES utf8mb4;
USE mfe;

-- 演示租户：侧栏改回分组，工作台路径改回 Host 实际路由
UPDATE tenant SET menu_layout = 'tree' WHERE id = 1;

UPDATE route_catalog
SET route_key = 'dashboard', label = '工作台', path = '/', icon = 'AppstoreOutlined'
WHERE permission_code = 'dashboard:view';

UPDATE menu_item
SET menu_key = 'dashboard', label = '工作台', path = '/', icon = 'AppstoreOutlined', parent_id = NULL, app_name = 'host'
WHERE tenant_id = 1 AND permission_code = 'dashboard:view';

-- 补回被删掉的商品页面权限
INSERT IGNORE INTO permission (code, name, resource_type, parent_code, subsystem_code, sort_order) VALUES
  ('product:view', '查看商品详情', 'page', NULL, 'product', 40),
  ('product:create', '新建商品', 'action', 'product:list', 'product', 30),
  ('product:category', '查看商品分类', 'page', NULL, 'product', 20);

INSERT IGNORE INTO route_catalog (
  subsystem_code, route_key, label, path, permission_code, icon, sort_order
) VALUES
  ('product', 'product-category', '商品分类', '/product/category', 'product:category', 'TagsOutlined', 20),
  ('product', 'product-create', '新建商品', '/product/create', 'product:create', 'PlusOutlined', 30),
  ('product', 'product-detail', '商品详情', '/product/detail/:id', 'product:view', 'ShopOutlined', 40);

-- 商品中心下的演示菜单
INSERT INTO menu_item (
  tenant_id, menu_key, label, path, app_name, icon, permission_code, sort_order,
  node_type, parent_id, route_catalog_id
)
SELECT
  1, 'product-category', '商品分类', '/product/category', 'product', 'TagsOutlined',
  'product:category', 20, 'route', g.id, c.id
FROM menu_item g
JOIN route_catalog c ON c.route_key = 'product-category'
WHERE g.tenant_id = 1 AND g.menu_key = 'group-product-hub'
  AND NOT EXISTS (
    SELECT 1 FROM menu_item x WHERE x.tenant_id = 1 AND x.menu_key = 'product-category'
  );

INSERT INTO menu_item (
  tenant_id, menu_key, label, path, app_name, icon, permission_code, sort_order,
  node_type, parent_id, route_catalog_id
)
SELECT
  1, 'product-create', '新建商品', '/product/create', 'product', 'PlusOutlined',
  'product:create', 30, 'route', g.id, c.id
FROM menu_item g
JOIN route_catalog c ON c.route_key = 'product-create'
WHERE g.tenant_id = 1 AND g.menu_key = 'group-product-hub'
  AND NOT EXISTS (
    SELECT 1 FROM menu_item x WHERE x.tenant_id = 1 AND x.menu_key = 'product-create'
  );

UPDATE menu_item SET app_name = 'product', icon = COALESCE(icon, 'FolderOutlined')
WHERE tenant_id = 1 AND menu_key = 'group-product-hub';

UPDATE menu_item SET icon = COALESCE(icon, 'SettingOutlined')
WHERE tenant_id = 1 AND menu_key = 'group-tenant-admin';

-- 管理员拿回全部权限（侧栏按权限过滤）
INSERT IGNORE INTO role_permission (role_id, permission_id)
SELECT 1, id FROM permission;

-- 只读账号：角色曾被改成管理员，恢复 viewer
INSERT INTO role (tenant_id, code, name)
SELECT 1, 'viewer', '只读用户'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM role WHERE tenant_id = 1 AND code = 'viewer');

UPDATE app_user SET role_label = '只读' WHERE id = 2 AND tenant_id = 1;
DELETE FROM user_role WHERE user_id = 2;
INSERT INTO user_role (user_id, role_id)
SELECT 2, r.id FROM role r WHERE r.tenant_id = 1 AND r.code = 'viewer';

INSERT IGNORE INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
JOIN permission p ON p.code IN (
  'dashboard:view', 'product:list', 'product:view', 'product:category', 'user:profile'
)
WHERE r.tenant_id = 1 AND r.code = 'viewer';
