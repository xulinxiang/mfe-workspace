SET NAMES utf8mb4;
USE mfe;

-- 移除 system 命名，改为 admin 租户治理 + page/action 分层

UPDATE permission SET code = 'admin:members:view', name = '成员管理', resource_type = 'page', parent_code = NULL
WHERE code IN ('system:member:manage', 'admin:members:view');

UPDATE permission SET code = 'admin:roles:view', name = '角色与权限', resource_type = 'page', parent_code = NULL
WHERE code IN ('system:role:manage', 'admin:roles:view');

UPDATE permission SET code = 'admin:menus:view', name = '菜单与导航', resource_type = 'page', parent_code = NULL
WHERE code IN ('system:menu:manage', 'admin:menus:view');

DELETE rp FROM role_permission rp INNER JOIN permission p ON p.id = rp.permission_id WHERE p.code = 'system:manage';
DELETE FROM permission WHERE code = 'system:manage';

INSERT IGNORE INTO permission (code, name, subsystem_code, resource_type, parent_code) VALUES
  ('admin:members:create', '新建成员', 'host', 'action', 'admin:members:view'),
  ('admin:members:assign-role', '分配角色', 'host', 'action', 'admin:members:view'),
  ('admin:roles:create', '新建角色', 'host', 'action', 'admin:roles:view'),
  ('admin:roles:delete', '删除角色', 'host', 'action', 'admin:roles:view'),
  ('admin:roles:assign-permissions', '配置权限矩阵', 'host', 'action', 'admin:roles:view'),
  ('admin:menus:edit', '编辑菜单树', 'host', 'action', 'admin:menus:view'),
  ('admin:menus:layout', '侧栏展示方式', 'host', 'action', 'admin:menus:view'),
  ('admin:menus:catalog', '维护标准路由库', 'host', 'action', 'admin:menus:view');

UPDATE route_catalog SET route_key = 'admin-members', label = '成员管理', path = '/admin/members', permission_code = 'admin:members:view'
WHERE route_key IN ('system-members', 'admin-members') OR path IN ('/system/members', '/admin/members');

UPDATE route_catalog SET route_key = 'admin-roles', label = '角色与权限', path = '/admin/roles', permission_code = 'admin:roles:view'
WHERE route_key IN ('system-roles', 'admin-roles') OR path IN ('/system/roles', '/admin/roles');

UPDATE route_catalog SET route_key = 'admin-menus', label = '菜单与导航', path = '/admin/menus', permission_code = 'admin:menus:view'
WHERE route_key IN ('system-menus', 'admin-menus') OR path IN ('/system/menus', '/admin/menus');

DELETE FROM route_catalog WHERE path LIKE '/system%' OR route_key = 'system';

UPDATE menu_item SET menu_key = 'group-tenant-admin', label = '租户治理', path = '#', permission_code = NULL
WHERE menu_key IN ('group-system', 'group-tenant-admin');

UPDATE menu_item SET menu_key = 'admin-members', label = '成员管理', path = '/admin/members', permission_code = 'admin:members:view'
WHERE menu_key IN ('system-members', 'admin-members');

UPDATE menu_item SET menu_key = 'admin-roles', label = '角色与权限', path = '/admin/roles', permission_code = 'admin:roles:view'
WHERE menu_key IN ('system-roles', 'admin-roles');

UPDATE menu_item SET menu_key = 'admin-menus', label = '菜单与导航', path = '/admin/menus', permission_code = 'admin:menus:view'
WHERE menu_key IN ('system-menus', 'admin-menus');

DELETE FROM menu_item WHERE path LIKE '/system%';

INSERT IGNORE INTO role_permission (role_id, permission_id)
SELECT 1, id FROM permission WHERE code LIKE 'admin:%';
