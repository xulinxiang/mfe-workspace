CREATE DATABASE IF NOT EXISTS mfe DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;
USE mfe;

CREATE TABLE IF NOT EXISTS tenant (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(128) NOT NULL,
  menu_layout VARCHAR(16) NOT NULL DEFAULT 'tree',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

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
  CONSTRAINT fk_route_subsystem FOREIGN KEY (subsystem_code) REFERENCES subsystem (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS app_user (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT NOT NULL,
  email VARCHAR(128) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(64) NOT NULL,
  role_label VARCHAR(64) NOT NULL,
  phone VARCHAR(32) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_tenant_email (tenant_id, email),
  KEY idx_user_tenant (tenant_id),
  CONSTRAINT fk_user_tenant FOREIGN KEY (tenant_id) REFERENCES tenant (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS product (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT NOT NULL,
  category_id BIGINT DEFAULT NULL,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(64) NOT NULL,
  price DECIMAL(12, 2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  status VARCHAR(8) NOT NULL DEFAULT 'on',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_tenant_sku (tenant_id, sku),
  KEY idx_product_tenant (tenant_id),
  CONSTRAINT fk_product_tenant FOREIGN KEY (tenant_id) REFERENCES tenant (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS menu_item (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT NOT NULL,
  menu_key VARCHAR(64) NOT NULL,
  label VARCHAR(128) NOT NULL,
  path VARCHAR(255) NOT NULL,
  app_name VARCHAR(32) DEFAULT NULL,
  icon VARCHAR(64) DEFAULT NULL,
  permission_code VARCHAR(128) DEFAULT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  node_type VARCHAR(16) NOT NULL DEFAULT 'route',
  parent_id BIGINT DEFAULT NULL,
  route_catalog_id BIGINT DEFAULT NULL,
  UNIQUE KEY uk_tenant_menu_key (tenant_id, menu_key),
  KEY idx_menu_tenant (tenant_id),
  KEY idx_menu_parent (parent_id),
  CONSTRAINT fk_menu_tenant FOREIGN KEY (tenant_id) REFERENCES tenant (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

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
  name VARCHAR(128) NOT NULL,
  resource_type VARCHAR(16) NOT NULL DEFAULT 'page',
  parent_code VARCHAR(128) DEFAULT NULL,
  subsystem_code VARCHAR(32) DEFAULT NULL,
  sort_order INT NOT NULL DEFAULT 0
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

CREATE TABLE IF NOT EXISTS dashboard_stat (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT NOT NULL UNIQUE,
  remotes INT NOT NULL DEFAULT 0,
  orders_today INT NOT NULL DEFAULT 0,
  pending INT NOT NULL DEFAULT 0,
  active_users_label VARCHAR(32) NOT NULL DEFAULT '0',
  CONSTRAINT fk_dashboard_tenant FOREIGN KEY (tenant_id) REFERENCES tenant (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO subsystem (code, name, sort_order) VALUES
  ('host', '主应用', 10),
  ('product', '商品子系统', 20),
  ('user', '用户子系统', 30);

INSERT INTO route_catalog (subsystem_code, route_key, label, path, permission_code, sort_order) VALUES
  ('host', 'dashboard', '工作台', '/', 'dashboard:view', 10),
  ('host', 'admin-members', '成员管理', '/admin/members', 'admin:members:view', 91),
  ('host', 'admin-roles', '角色与权限', '/admin/roles', 'admin:roles:view', 93),
  ('host', 'admin-permissions', '权限目录', '/admin/permissions', 'admin:permissions:view', 94),
  ('product', 'product-list', '商品列表', '/product', 'product:list', 10),
  ('product', 'product-category', '商品分类', '/product/category', 'product:category', 20),
  ('product', 'product-create', '新建商品', '/product/create', 'product:create', 30),
  ('product', 'product-detail', '商品详情', '/product/detail/:id', 'product:view', 40),
  ('user', 'user-profile', '用户中心', '/user', 'user:profile', 10),
  ('host', 'admin-role-manage', '角色管理', '/admin/role-manage', 'admin:role-manage:view', 92);

INSERT INTO tenant (id, code, name, menu_layout) VALUES
  (1, 'demo', '演示租户', 'tree'),
  (2, 'partner', '合作伙伴租户', 'flat');

-- password: demo123 (BCrypt)
INSERT INTO app_user (id, tenant_id, email, password_hash, name, role_label, phone) VALUES
  (1, 1, 'demo@company.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'Alex', '管理员', '138****0000'),
  (2, 1, 'viewer@company.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'Viewer', '只读', '139****0000'),
  (3, 2, 'partner@company.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'Partner', '运营', '137****0000');

INSERT INTO product (tenant_id, name, sku, price, stock, status) VALUES
  (1, '无线降噪耳机', 'SKU-1001', 899.00, 126, 'on'),
  (1, '机械键盘', 'SKU-1002', 459.00, 58, 'on'),
  (1, '4K 显示器', 'SKU-1003', 2199.00, 0, 'off'),
  (1, '移动固态硬盘', 'SKU-1004', 699.00, 34, 'on'),
  (2, '合作款智能手表', 'PARTNER-1001', 1299.00, 20, 'on');

INSERT INTO product_category (tenant_id, name, status, sort_order) VALUES
  (1, '数码配件', 'on', 10),
  (1, '办公设备', 'on', 20),
  (1, '家用电器', 'off', 30),
  (2, '智能穿戴', 'on', 10);

UPDATE product SET category_id = 1 WHERE tenant_id = 1 AND sku IN ('SKU-1001', 'SKU-1004');
UPDATE product SET category_id = 2 WHERE tenant_id = 1 AND sku IN ('SKU-1002', 'SKU-1003');
UPDATE product SET category_id = 4 WHERE tenant_id = 2 AND sku = 'PARTNER-1001';

INSERT INTO menu_item (tenant_id, menu_key, label, path, app_name, permission_code, sort_order, node_type, parent_id, route_catalog_id) VALUES
  (1, 'dashboard', '工作台', '/', 'host', 'dashboard:view', 10, 'route', NULL, 1),
  (1, 'group-product-hub', '商品中心', '#', NULL, NULL, 15, 'group', NULL, NULL),
  (1, 'product-list', '商品列表', '/product', 'product', 'product:list', 10, 'route', 2, 5),
  (1, 'product-category', '商品分类', '/product/category', 'product', 'product:category', 20, 'route', 2, 6),
  (1, 'product-create', '新建商品', '/product/create', 'product', 'product:create', 30, 'route', 2, 7),
  (1, 'user-center', '用户中心', '/user', 'user', 'user:profile', 50, 'route', NULL, 9),
  (1, 'group-tenant-admin', '租户治理', '#', NULL, NULL, 88, 'group', NULL, NULL),
  (1, 'admin-members', '成员管理', '/admin/members', 'host', 'admin:members:view', 10, 'route', 7, 2),
  (1, 'admin-role-manage', '角色管理', '/admin/role-manage', 'host', 'admin:role-manage:view', 15, 'route', 7, 10),
  (1, 'admin-roles', '角色与权限', '/admin/roles', 'host', 'admin:roles:view', 20, 'route', 7, 3),
  (1, 'admin-permissions', '权限目录', '/admin/permissions', 'host', 'admin:permissions:view', 30, 'route', 7, 4),
  (2, 'dashboard', '工作台', '/', 'host', 'dashboard:view', 10, 'route', NULL, 1),
  (2, 'product-list', '商品列表', '/product', 'product', 'product:list', 20, 'route', NULL, 5),
  (2, 'user-center', '用户中心', '/user', 'user', 'user:profile', 30, 'route', NULL, 9);

INSERT INTO permission (id, code, name, resource_type, parent_code, subsystem_code) VALUES
  (1, 'dashboard:view', '查看工作台', 'page', NULL, 'host'),
  (2, 'product:list', '查看商品列表', 'page', NULL, 'product'),
  (3, 'product:view', '查看商品详情', 'page', NULL, 'product'),
  (4, 'product:create', '新建商品', 'action', 'product:list', 'product'),
  (5, 'product:category', '查看商品分类', 'page', NULL, 'product'),
  (6, 'user:profile', '查看个人资料', 'page', NULL, 'user'),
  (7, 'user:profile:update', '修改个人资料', 'action', 'user:profile', 'user'),
  (8, 'admin:members:view', '成员管理', 'page', NULL, 'host'),
  (9, 'admin:members:create', '新建成员', 'action', 'admin:members:view', 'host'),
  (10, 'admin:members:assign-role', '分配角色', 'action', 'admin:members:view', 'host'),
  (11, 'admin:roles:view', '角色与权限', 'page', NULL, 'host'),
  (12, 'admin:roles:create', '新建角色', 'action', 'admin:role-manage:view', 'host'),
  (13, 'admin:roles:delete', '删除角色', 'action', 'admin:role-manage:view', 'host'),
  (14, 'admin:roles:assign-permissions', '配置权限矩阵', 'action', 'admin:roles:view', 'host'),
  (19, 'admin:role-manage:view', '角色管理', 'page', NULL, 'host'),
  (20, 'admin:roles:update', '编辑角色', 'action', 'admin:role-manage:view', 'host'),
  (15, 'admin:permissions:view', '权限目录', 'page', NULL, 'host'),
  (16, 'admin:permissions:create', '新建权限', 'action', 'admin:permissions:view', 'host'),
  (17, 'admin:permissions:update', '编辑权限', 'action', 'admin:permissions:view', 'host'),
  (18, 'admin:permissions:delete', '删除权限', 'action', 'admin:permissions:view', 'host');

UPDATE permission p
LEFT JOIN route_catalog r ON r.permission_code = p.code
SET p.sort_order = COALESCE(r.sort_order, p.id * 10);

INSERT INTO role (id, tenant_id, code, name) VALUES
  (1, 1, 'admin', '管理员'),
  (2, 1, 'viewer', '只读用户'),
  (3, 2, 'operator', '运营人员');

INSERT INTO user_role (user_id, role_id) VALUES
  (1, 1),
  (2, 2),
  (3, 3);

INSERT INTO role_permission (role_id, permission_id) VALUES
  (1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7),
  (1, 8), (1, 9), (1, 10), (1, 11), (1, 12), (1, 13), (1, 14),
  (1, 15), (1, 16), (1, 17), (1, 18), (1, 19), (1, 20),
  (2, 1), (2, 2), (2, 3), (2, 5), (2, 6),
  (3, 1), (3, 2), (3, 3), (3, 6);

INSERT INTO dashboard_stat (tenant_id, remotes, orders_today, pending, active_users_label) VALUES
  (1, 2, 128, 6, '1.2k'),
  (2, 2, 24, 2, '86');
