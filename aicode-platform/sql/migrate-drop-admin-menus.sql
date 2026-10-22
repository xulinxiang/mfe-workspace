-- 移除「菜单与导航」管理页及相关权限（侧栏仍由 GET /api/menus + menu_item 提供）
USE mfe;

DELETE rp FROM role_permission rp
JOIN permission p ON p.id = rp.permission_id
WHERE p.code LIKE 'admin:menus:%';

DELETE FROM menu_item WHERE menu_key = 'admin-menus' OR permission_code = 'admin:menus:view';
DELETE FROM route_catalog WHERE route_key = 'admin-menus' OR permission_code = 'admin:menus:view';
DELETE FROM permission WHERE code LIKE 'admin:menus:%';
