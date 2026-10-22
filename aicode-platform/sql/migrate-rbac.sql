USE mfe;

ALTER TABLE menu_item
  ADD COLUMN permission_code VARCHAR(128) DEFAULT NULL AFTER app_name;

ALTER TABLE product
  ADD COLUMN category_id BIGINT DEFAULT NULL AFTER tenant_id;

CREATE TABLE IF NOT EXISTS role (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT NOT NULL,
  code VARCHAR(64) NOT NULL,
  name VARCHAR(128) NOT NULL,
  UNIQUE KEY uk_role_tenant_code (tenant_id, code),
  CONSTRAINT fk_role_tenant FOREIGN KEY (tenant_id) REFERENCES tenant (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS permission (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(128) NOT NULL UNIQUE,
  name VARCHAR(128) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS user_role (
  user_id BIGINT NOT NULL,
  role_id BIGINT NOT NULL,
  PRIMARY KEY (user_id, role_id),
  CONSTRAINT fk_user_role_user FOREIGN KEY (user_id) REFERENCES app_user (id),
  CONSTRAINT fk_user_role_role FOREIGN KEY (role_id) REFERENCES role (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS role_permission (
  role_id BIGINT NOT NULL,
  permission_id BIGINT NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_role_permission_role FOREIGN KEY (role_id) REFERENCES role (id),
  CONSTRAINT fk_role_permission_permission FOREIGN KEY (permission_id) REFERENCES permission (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS product_category (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT NOT NULL,
  name VARCHAR(128) NOT NULL,
  status VARCHAR(8) NOT NULL DEFAULT 'on',
  sort_order INT NOT NULL DEFAULT 0,
  UNIQUE KEY uk_category_tenant_name (tenant_id, name),
  CONSTRAINT fk_category_tenant FOREIGN KEY (tenant_id) REFERENCES tenant (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT IGNORE INTO permission (id, code, name) VALUES
  (1, 'dashboard:view', '查看工作台'),
  (2, 'product:list', '查看商品列表'),
  (3, 'product:view', '查看商品详情'),
  (4, 'product:create', '新建商品'),
  (5, 'product:category', '查看商品分类'),
  (6, 'user:profile', '查看个人资料'),
  (7, 'user:profile:update', '修改个人资料'),
  (8, 'system:manage', '管理用户、角色、权限与菜单');

INSERT IGNORE INTO role (id, tenant_id, code, name) VALUES
  (1, 1, 'admin', '管理员'),
  (2, 1, 'viewer', '只读用户');

INSERT IGNORE INTO tenant (id, code, name) VALUES
  (2, 'partner', '合作伙伴租户');

INSERT IGNORE INTO role (id, tenant_id, code, name) VALUES
  (3, 2, 'operator', '运营人员');

INSERT IGNORE INTO app_user (id, tenant_id, email, password_hash, name, role_label, phone)
SELECT 2, 1, 'viewer@company.com', password_hash, 'Viewer', '只读', '139****0000'
FROM app_user WHERE email = 'demo@company.com';

INSERT IGNORE INTO app_user (id, tenant_id, email, password_hash, name, role_label, phone)
SELECT 3, 2, 'partner@company.com', password_hash, 'Partner', '运营', '137****0000'
FROM app_user WHERE email = 'demo@company.com';

INSERT IGNORE INTO user_role (user_id, role_id)
SELECT id, 1 FROM app_user WHERE email = 'demo@company.com';

INSERT IGNORE INTO user_role (user_id, role_id)
SELECT id, 2 FROM app_user WHERE email = 'viewer@company.com';

INSERT IGNORE INTO user_role (user_id, role_id)
SELECT id, 3 FROM app_user WHERE email = 'partner@company.com';

INSERT IGNORE INTO role_permission (role_id, permission_id)
SELECT 1, id FROM permission;

INSERT IGNORE INTO role_permission (role_id, permission_id)
SELECT 2, id FROM permission
WHERE code IN ('dashboard:view', 'product:list', 'product:view', 'product:category', 'user:profile');

INSERT IGNORE INTO role_permission (role_id, permission_id)
SELECT 3, id FROM permission
WHERE code IN ('dashboard:view', 'product:list', 'product:view', 'user:profile');

UPDATE menu_item SET permission_code = 'dashboard:view' WHERE menu_key = 'dashboard';
UPDATE menu_item SET permission_code = 'product:list' WHERE menu_key = 'product-list';
UPDATE menu_item SET permission_code = 'product:category' WHERE menu_key = 'product-category';
UPDATE menu_item SET permission_code = 'product:create' WHERE menu_key = 'product-create';
UPDATE menu_item SET permission_code = 'user:profile' WHERE menu_key = 'user-center';

INSERT IGNORE INTO menu_item
  (tenant_id, menu_key, label, path, app_name, permission_code, sort_order) VALUES
  (1, 'system-management', '系统管理', '/system', 'host', 'system:manage', 90),
  (2, 'dashboard', '工作台', '/', 'host', 'dashboard:view', 10),
  (2, 'product-list', '商品列表', '/product', 'product', 'product:list', 20),
  (2, 'user-center', '用户中心', '/user', 'user', 'user:profile', 30);

INSERT IGNORE INTO product_category (tenant_id, name, status, sort_order) VALUES
  (1, '数码配件', 'on', 10),
  (1, '办公设备', 'on', 20),
  (1, '家用电器', 'off', 30);

INSERT IGNORE INTO product_category (tenant_id, name, status, sort_order) VALUES
  (2, '智能穿戴', 'on', 10);

INSERT IGNORE INTO product (tenant_id, category_id, name, sku, price, stock, status)
SELECT 2, id, '合作款智能手表', 'PARTNER-1001', 1299.00, 20, 'on'
FROM product_category WHERE tenant_id = 2 AND name = '智能穿戴';

INSERT IGNORE INTO dashboard_stat
  (tenant_id, remotes, orders_today, pending, active_users_label) VALUES
  (2, 2, 24, 2, '86');

UPDATE product SET category_id = 1 WHERE tenant_id = 1 AND sku IN ('SKU-1001', 'SKU-1004');
UPDATE product SET category_id = 2 WHERE tenant_id = 1 AND sku IN ('SKU-1002', 'SKU-1003');
