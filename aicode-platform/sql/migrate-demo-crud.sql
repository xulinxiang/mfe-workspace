SET NAMES utf8mb4;
USE mfe;

-- 按钮权限码改为「页面码:操作」
INSERT IGNORE INTO permission (code, name, resource_type, parent_code, subsystem_code, sort_order) VALUES
  ('product:list:create', '新建商品', 'action', 'product:list', 'product', 30),
  ('product:list:update', '编辑商品', 'action', 'product:list', 'product', 31),
  ('product:list:delete', '删除商品', 'action', 'product:list', 'product', 32),
  ('product:category:create', '新建分类', 'action', 'product:category', 'product', 21),
  ('product:category:update', '编辑分类', 'action', 'product:category', 'product', 22),
  ('product:category:delete', '删除分类', 'action', 'product:category', 'product', 23),
  ('user:list', '用户列表', 'page', NULL, 'user', 10),
  ('user:list:create', '新建用户', 'action', 'user:list', 'user', 11),
  ('user:list:update', '编辑用户', 'action', 'user:list', 'user', 12),
  ('user:list:delete', '删除用户', 'action', 'user:list', 'user', 13);

INSERT IGNORE INTO role_permission (role_id, permission_id)
SELECT rp.role_id, p_new.id
FROM role_permission rp
JOIN permission p_old ON p_old.id = rp.permission_id AND p_old.code = 'product:create'
JOIN permission p_new ON p_new.code = 'product:list:create';

DELETE rp FROM role_permission rp
JOIN permission p ON p.id = rp.permission_id
WHERE p.code = 'product:create';

UPDATE menu_item SET permission_code = 'product:list:create' WHERE permission_code = 'product:create';
UPDATE route_catalog SET permission_code = 'product:list:create' WHERE permission_code = 'product:create';
DELETE FROM permission WHERE code = 'product:create';

-- 新建商品改为列表上的按钮，不再占侧栏
DELETE FROM menu_item WHERE menu_key = 'product-create';
DELETE FROM route_catalog WHERE route_key = 'product-create';

UPDATE permission SET name = '商品列表' WHERE code = 'product:list';
UPDATE permission SET name = '商品分类' WHERE code = 'product:category';

-- 用户列表 + 个人资料
INSERT IGNORE INTO route_catalog (subsystem_code, route_key, label, path, permission_code, sort_order) VALUES
  ('user', 'user-list', '用户列表', '/user', 'user:list', 5);

UPDATE route_catalog
SET path = '/user/profile', label = '个人资料'
WHERE route_key = 'user-profile';

INSERT INTO menu_item (
  tenant_id, menu_key, label, path, app_name, icon, permission_code, sort_order,
  node_type, parent_id, route_catalog_id
)
SELECT 1, 'group-user-hub', '用户中心', '#', NULL, 'TeamOutlined', NULL, 50, 'group', NULL, NULL
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM menu_item WHERE tenant_id = 1 AND menu_key = 'group-user-hub');

UPDATE menu_item
SET menu_key = 'user-profile',
    label = '个人资料',
    path = '/user/profile',
    app_name = 'user',
    icon = COALESCE(icon, 'UserOutlined'),
    permission_code = 'user:profile',
    sort_order = 20,
    node_type = 'route'
WHERE tenant_id = 1 AND menu_key IN ('user-center', 'user-profile');

INSERT INTO menu_item (
  tenant_id, menu_key, label, path, app_name, icon, permission_code, sort_order,
  node_type, parent_id, route_catalog_id
)
SELECT
  1, 'user-list', '用户列表', '/user', 'user', 'TeamOutlined',
  'user:list', 10, 'route', g.id, c.id
FROM menu_item g
JOIN route_catalog c ON c.route_key = 'user-list'
WHERE g.tenant_id = 1 AND g.menu_key = 'group-user-hub'
  AND NOT EXISTS (SELECT 1 FROM menu_item x WHERE x.tenant_id = 1 AND x.menu_key = 'user-list');

UPDATE menu_item child
JOIN menu_item g ON g.tenant_id = child.tenant_id AND g.menu_key = 'group-user-hub'
LEFT JOIN route_catalog c ON c.route_key = child.menu_key
SET child.parent_id = g.id,
    child.route_catalog_id = COALESCE(c.id, child.route_catalog_id)
WHERE child.tenant_id = 1 AND child.menu_key IN ('user-list', 'user-profile');

-- 合作伙伴租户：用户列表作为入口
UPDATE menu_item
SET menu_key = 'user-list',
    label = '用户列表',
    path = '/user',
    permission_code = 'user:list',
    app_name = 'user'
WHERE tenant_id = 2 AND menu_key = 'user-center';

INSERT INTO menu_item (
  tenant_id, menu_key, label, path, app_name, icon, permission_code, sort_order,
  node_type, parent_id, route_catalog_id
)
SELECT
  2, 'user-list', '用户列表', '/user', 'user', 'TeamOutlined',
  'user:list', 30, 'route', NULL, c.id
FROM route_catalog c
WHERE c.route_key = 'user-list'
  AND NOT EXISTS (SELECT 1 FROM menu_item x WHERE x.tenant_id = 2 AND x.menu_key = 'user-list');

-- 管理员拿全部；只读看页面、不能点按钮
INSERT IGNORE INTO role_permission (role_id, permission_id)
SELECT 1, id FROM permission;

INSERT IGNORE INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
JOIN permission p ON p.code IN (
  'dashboard:view',
  'product:list',
  'product:view',
  'product:category',
  'user:list',
  'user:profile'
)
WHERE r.tenant_id = 1 AND r.code = 'viewer';

INSERT IGNORE INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
JOIN permission p ON p.code IN ('user:list', 'product:category')
WHERE r.tenant_id = 2 AND r.code = 'operator';
