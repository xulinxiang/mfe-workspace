SET NAMES utf8mb4;
USE mfe;

ALTER TABLE menu_item
  ADD COLUMN icon VARCHAR(64) DEFAULT NULL AFTER app_name;

ALTER TABLE route_catalog
  ADD COLUMN icon VARCHAR(64) DEFAULT NULL AFTER permission_code;

UPDATE route_catalog SET icon = 'AppstoreOutlined' WHERE route_key = 'dashboard';
UPDATE route_catalog SET icon = 'SettingOutlined' WHERE route_key = 'system';
UPDATE route_catalog SET icon = 'UnorderedListOutlined' WHERE route_key = 'product-list';
UPDATE route_catalog SET icon = 'TagsOutlined' WHERE route_key = 'product-category';
UPDATE route_catalog SET icon = 'PlusOutlined' WHERE route_key = 'product-create';
UPDATE route_catalog SET icon = 'ShopOutlined' WHERE route_key = 'product-detail';
UPDATE route_catalog SET icon = 'UserOutlined' WHERE route_key = 'user-profile';

UPDATE menu_item m
JOIN route_catalog c ON c.id = m.route_catalog_id
SET m.icon = c.icon
WHERE m.icon IS NULL AND c.icon IS NOT NULL;

UPDATE menu_item SET icon = 'FolderOutlined' WHERE node_type = 'group' AND icon IS NULL;

-- 可选：删除与「系统管理」重复路径 /system 的测试菜单（如 1111）
-- DELETE m FROM menu_item m
-- WHERE m.tenant_id = 1 AND m.node_type = 'route' AND m.path = '/system'
--   AND m.menu_key <> 'system-management';
