SET NAMES utf8mb4;
USE mfe;

CREATE TABLE IF NOT EXISTS subsystem (
  code VARCHAR(32) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS route_catalog (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  subsystem_code VARCHAR(32) NOT NULL,
  route_key VARCHAR(64) NOT NULL,
  label VARCHAR(128) NOT NULL,
  path VARCHAR(255) NOT NULL,
  permission_code VARCHAR(128) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  UNIQUE KEY uk_subsystem_route (subsystem_code, route_key),
  KEY idx_route_subsystem (subsystem_code),
  CONSTRAINT fk_route_subsystem FOREIGN KEY (subsystem_code) REFERENCES subsystem (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

ALTER TABLE tenant
  ADD COLUMN menu_layout VARCHAR(16) NOT NULL DEFAULT 'tree';

ALTER TABLE permission
  ADD COLUMN subsystem_code VARCHAR(32) DEFAULT NULL;

ALTER TABLE menu_item
  ADD COLUMN node_type VARCHAR(16) NOT NULL DEFAULT 'route',
  ADD COLUMN parent_id BIGINT DEFAULT NULL,
  ADD COLUMN route_catalog_id BIGINT DEFAULT NULL;

ALTER TABLE menu_item
  ADD KEY idx_menu_parent (parent_id),
  ADD KEY idx_menu_catalog (route_catalog_id);

INSERT IGNORE INTO subsystem (code, name, sort_order) VALUES
  ('host', '主应用', 10),
  ('product', '商品子系统', 20),
  ('user', '用户子系统', 30);

INSERT IGNORE INTO route_catalog (subsystem_code, route_key, label, path, permission_code, sort_order) VALUES
  ('host', 'dashboard', '工作台', '/', 'dashboard:view', 10),
  ('host', 'system', '系统管理', '/system', 'system:manage', 90),
  ('product', 'product-list', '商品列表', '/product', 'product:list', 10),
  ('product', 'product-category', '商品分类', '/product/category', 'product:category', 20),
  ('product', 'product-create', '新建商品', '/product/create', 'product:create', 30),
  ('product', 'product-detail', '商品详情', '/product/detail/:id', 'product:view', 40),
  ('user', 'user-profile', '用户中心', '/user', 'user:profile', 10);

UPDATE permission SET subsystem_code = 'host' WHERE code IN ('dashboard:view', 'system:manage');
UPDATE permission SET subsystem_code = 'product' WHERE code LIKE 'product:%';
UPDATE permission SET subsystem_code = 'user' WHERE code LIKE 'user:%';

UPDATE tenant SET menu_layout = 'tree' WHERE code = 'demo';
UPDATE tenant SET menu_layout = 'flat' WHERE code = 'partner';

UPDATE menu_item SET node_type = 'route', parent_id = NULL WHERE node_type IS NULL OR node_type = '';

-- demo 租户：商品相关路由收拢到分组「商品中心」
INSERT INTO menu_item (tenant_id, menu_key, label, path, app_name, permission_code, sort_order, node_type, parent_id, route_catalog_id)
SELECT 1, 'group-product-hub', '商品中心', '#', NULL, NULL, 15, 'group', NULL, NULL
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM menu_item WHERE tenant_id = 1 AND menu_key = 'group-product-hub'
);

UPDATE menu_item m
JOIN route_catalog c ON c.subsystem_code = 'product' AND c.route_key = m.menu_key
SET m.route_catalog_id = c.id
WHERE m.tenant_id IN (1, 2) AND m.node_type = 'route';

UPDATE menu_item child
JOIN menu_item grp ON grp.tenant_id = 1 AND grp.menu_key = 'group-product-hub'
SET child.parent_id = grp.id, child.sort_order = CASE child.menu_key
  WHEN 'product-list' THEN 10
  WHEN 'product-category' THEN 20
  WHEN 'product-create' THEN 30
  ELSE child.sort_order END
WHERE child.tenant_id = 1
  AND child.menu_key IN ('product-list', 'product-category', 'product-create');
