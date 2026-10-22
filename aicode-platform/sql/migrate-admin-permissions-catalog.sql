SET NAMES utf8mb4;
USE mfe;

INSERT IGNORE INTO permission (code, name, subsystem_code, resource_type, parent_code) VALUES
  ('admin:permissions:view', '权限目录', 'host', 'page', NULL),
  ('admin:permissions:create', '新建权限', 'host', 'action', 'admin:permissions:view'),
  ('admin:permissions:update', '编辑权限', 'host', 'action', 'admin:permissions:view'),
  ('admin:permissions:delete', '删除权限', 'host', 'action', 'admin:permissions:view');

INSERT INTO route_catalog (subsystem_code, route_key, label, path, permission_code, sort_order)
SELECT 'host', 'admin-permissions', '权限目录', '/admin/permissions', 'admin:permissions:view', 94
WHERE NOT EXISTS (SELECT 1 FROM route_catalog WHERE route_key = 'admin-permissions');

INSERT INTO menu_item (tenant_id, menu_key, label, path, app_name, permission_code, sort_order, node_type, parent_id, route_catalog_id)
SELECT 1, 'admin-permissions', '权限目录', '/admin/permissions', 'host', 'admin:permissions:view', 40, 'route', g.id, c.id
FROM menu_item g
JOIN route_catalog c ON c.route_key = 'admin-permissions'
WHERE g.tenant_id = 1 AND g.menu_key = 'group-tenant-admin'
  AND NOT EXISTS (SELECT 1 FROM menu_item WHERE tenant_id = 1 AND menu_key = 'admin-permissions');

INSERT IGNORE INTO role_permission (role_id, permission_id)
SELECT 1, id FROM permission WHERE code LIKE 'admin:permissions:%';
