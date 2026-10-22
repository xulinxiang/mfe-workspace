SET NAMES utf8mb4;
USE mfe;

INSERT IGNORE INTO permission (code, name, resource_type, parent_code, subsystem_code, sort_order) VALUES
  ('product:list', '商品列表', 'page', NULL, 'product', 10),
  ('product:list:create', '新建商品', 'action', 'product:list', 'product', 30),
  ('product:list:update', '编辑商品', 'action', 'product:list', 'product', 31),
  ('product:list:delete', '删除商品', 'action', 'product:list', 'product', 32),
  ('product:view', '查看商品详情', 'page', NULL, 'product', 40);

-- 旧的 shop 码并到 list
INSERT IGNORE INTO role_permission (role_id, permission_id)
SELECT rp.role_id, n.id
FROM role_permission rp
JOIN permission o ON o.id = rp.permission_id AND o.code IN ('product:shop:list', 'product:shop:list:create')
JOIN permission n ON n.code = IF(o.code = 'product:shop:list', 'product:list', 'product:list:create');

UPDATE permission SET parent_code = 'product:list' WHERE parent_code = 'product:shop:list';

UPDATE menu_item
SET menu_key = 'product-list',
    label = '商品列表',
    path = '/product',
    permission_code = 'product:list',
    app_name = 'product'
WHERE permission_code = 'product:shop:list'
   OR menu_key IN ('product-shop-list', 'product-list');

UPDATE route_catalog
SET route_key = 'product-list',
    label = '商品列表',
    path = '/product',
    permission_code = 'product:list'
WHERE permission_code = 'product:shop:list'
   OR route_key IN ('product-shop-list', 'product-list');

DELETE rp FROM role_permission rp
JOIN permission p ON p.id = rp.permission_id
WHERE p.code IN ('product:shop:list', 'product:shop:list:create');

DELETE FROM permission WHERE code IN ('product:shop:list', 'product:shop:list:create');

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
WHERE r.code IN ('viewer', 'operate');
