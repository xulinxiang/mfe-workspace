SET NAMES utf8mb4;
USE mfe;

-- 角色 CRUD 独立成「角色管理」页；原「角色与权限」只做权限矩阵

INSERT IGNORE INTO permission (code, name, resource_type, parent_code, subsystem_code) VALUES
  ('admin:role-manage:view', '角色管理', 'page', NULL, 'host'),
  ('admin:roles:update', '编辑角色', 'action', 'admin:role-manage:view', 'host');

UPDATE permission
SET parent_code = 'admin:role-manage:view'
WHERE code IN ('admin:roles:create', 'admin:roles:delete');

UPDATE route_catalog SET sort_order = 93 WHERE route_key = 'admin-roles' AND sort_order < 93;
UPDATE route_catalog SET sort_order = 94 WHERE route_key = 'admin-permissions' AND sort_order < 94;

INSERT IGNORE INTO route_catalog (
  subsystem_code, route_key, label, path, permission_code, icon, sort_order
) VALUES (
  'host', 'admin-role-manage', '角色管理', '/admin/role-manage',
  'admin:role-manage:view', 'SolutionOutlined', 92
);

INSERT INTO menu_item (
  tenant_id, menu_key, label, path, app_name, icon, permission_code, sort_order,
  node_type, parent_id, route_catalog_id
)
SELECT
  m.tenant_id,
  'admin-role-manage',
  '角色管理',
  '/admin/role-manage',
  'host',
  'SolutionOutlined',
  'admin:role-manage:view',
  15,
  'route',
  m.parent_id,
  c.id
FROM menu_item m
JOIN route_catalog c ON c.route_key = 'admin-role-manage'
WHERE m.menu_key = 'admin-roles'
  AND NOT EXISTS (
    SELECT 1 FROM menu_item x
    WHERE x.tenant_id = m.tenant_id AND x.menu_key = 'admin-role-manage'
  );

INSERT IGNORE INTO role_permission (role_id, permission_id)
SELECT rp.role_id, p.id
FROM role_permission rp
JOIN permission old ON old.id = rp.permission_id AND old.code = 'admin:roles:view'
JOIN permission p ON p.code IN ('admin:role-manage:view', 'admin:roles:update');
