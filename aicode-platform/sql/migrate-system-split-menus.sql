SET NAMES utf8mb4;
USE mfe;

-- 国际通行：一菜单一路由一 page 权限（resource:action），废弃单一 system:manage 入口

UPDATE permission SET resource_type = 'page', parent_code = NULL
WHERE code IN ('system:member:manage', 'system:role:manage', 'system:menu:manage');

DELETE rp FROM role_permission rp
INNER JOIN permission p ON p.id = rp.permission_id
WHERE p.code = 'system:manage';
DELETE FROM permission WHERE code = 'system:manage';

INSERT INTO route_catalog (subsystem_code, route_key, label, path, permission_code, sort_order)
SELECT 'host', 'system-members', '成员管理', '/system/members', 'system:member:manage', 91
WHERE NOT EXISTS (SELECT 1 FROM route_catalog WHERE route_key = 'system-members');

INSERT INTO route_catalog (subsystem_code, route_key, label, path, permission_code, sort_order)
SELECT 'host', 'system-roles', '角色与权限', '/system/roles', 'system:role:manage', 92
WHERE NOT EXISTS (SELECT 1 FROM route_catalog WHERE route_key = 'system-roles');

INSERT INTO route_catalog (subsystem_code, route_key, label, path, permission_code, sort_order)
SELECT 'host', 'system-menus', '菜单编排', '/system/menus', 'system:menu:manage', 93
WHERE NOT EXISTS (SELECT 1 FROM route_catalog WHERE route_key = 'system-menus');

DELETE FROM menu_item WHERE menu_key = 'system-management';

INSERT INTO menu_item (tenant_id, menu_key, label, path, app_name, permission_code, sort_order, node_type, parent_id, route_catalog_id)
SELECT 1, 'group-system', '系统设置', '#', NULL, NULL, 88, 'group', NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM menu_item WHERE tenant_id = 1 AND menu_key = 'group-system');

INSERT INTO menu_item (tenant_id, menu_key, label, path, app_name, permission_code, sort_order, node_type, parent_id, route_catalog_id)
SELECT 1, 'system-members', '成员管理', '/system/members', 'host', 'system:member:manage', 10, 'route', g.id, c.id
FROM menu_item g
JOIN route_catalog c ON c.route_key = 'system-members'
WHERE g.tenant_id = 1 AND g.menu_key = 'group-system'
  AND NOT EXISTS (SELECT 1 FROM menu_item WHERE tenant_id = 1 AND menu_key = 'system-members');

INSERT INTO menu_item (tenant_id, menu_key, label, path, app_name, permission_code, sort_order, node_type, parent_id, route_catalog_id)
SELECT 1, 'system-roles', '角色与权限', '/system/roles', 'host', 'system:role:manage', 20, 'route', g.id, c.id
FROM menu_item g
JOIN route_catalog c ON c.route_key = 'system-roles'
WHERE g.tenant_id = 1 AND g.menu_key = 'group-system'
  AND NOT EXISTS (SELECT 1 FROM menu_item WHERE tenant_id = 1 AND menu_key = 'system-roles');

INSERT INTO menu_item (tenant_id, menu_key, label, path, app_name, permission_code, sort_order, node_type, parent_id, route_catalog_id)
SELECT 1, 'system-menus', '菜单编排', '/system/menus', 'host', 'system:menu:manage', 30, 'route', g.id, c.id
FROM menu_item g
JOIN route_catalog c ON c.route_key = 'system-menus'
WHERE g.tenant_id = 1 AND g.menu_key = 'group-system'
  AND NOT EXISTS (SELECT 1 FROM menu_item WHERE tenant_id = 1 AND menu_key = 'system-menus');

DELETE FROM route_catalog WHERE route_key = 'system';

INSERT IGNORE INTO role_permission (role_id, permission_id)
SELECT 1, id FROM permission WHERE code IN ('system:member:manage', 'system:role:manage', 'system:menu:manage');
