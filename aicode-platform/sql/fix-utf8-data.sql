-- 修复迁移时未指定 utf8mb4 导致的中文乱码（双重 UTF-8）
SET NAMES utf8mb4;

UPDATE subsystem SET name = '主应用' WHERE code = 'host';
UPDATE subsystem SET name = '商品子系统' WHERE code = 'product';
UPDATE subsystem SET name = '用户子系统' WHERE code = 'user';

UPDATE route_catalog SET label = '工作台' WHERE route_key = 'dashboard';
UPDATE route_catalog SET label = '系统管理' WHERE route_key = 'system';
UPDATE route_catalog SET label = '商品列表' WHERE route_key = 'product-list';
UPDATE route_catalog SET label = '商品分类' WHERE route_key = 'product-category';
UPDATE route_catalog SET label = '新建商品' WHERE route_key = 'product-create';
UPDATE route_catalog SET label = '商品详情' WHERE route_key = 'product-detail';
UPDATE route_catalog SET label = '用户中心' WHERE route_key = 'user-profile';

UPDATE permission SET name = '查看工作台' WHERE code = 'dashboard:view';
UPDATE permission SET name = '查看商品列表' WHERE code = 'product:list';
UPDATE permission SET name = '查看商品详情' WHERE code = 'product:view';
UPDATE permission SET name = '新建商品' WHERE code = 'product:create';
UPDATE permission SET name = '查看商品分类' WHERE code = 'product:category';
UPDATE permission SET name = '查看个人资料' WHERE code = 'user:profile';
UPDATE permission SET name = '修改个人资料' WHERE code = 'user:profile:update';
UPDATE permission SET name = '管理用户、角色、权限与菜单' WHERE code = 'system:manage';

UPDATE menu_item SET label = '工作台' WHERE menu_key = 'dashboard';
UPDATE menu_item SET label = '商品列表' WHERE menu_key = 'product-list';
UPDATE menu_item SET label = '商品分类' WHERE menu_key = 'product-category';
UPDATE menu_item SET label = '新建商品' WHERE menu_key = 'product-create';
UPDATE menu_item SET label = '商品详情' WHERE menu_key = 'product-detail';
UPDATE menu_item SET label = '用户中心' WHERE menu_key = 'user-center';
UPDATE menu_item SET label = '系统管理' WHERE menu_key = 'system-management';
UPDATE menu_item SET label = '商品中心' WHERE menu_key = 'group-product-hub';

UPDATE role SET name = '管理员' WHERE code = 'admin' AND tenant_id = 1;
UPDATE role SET name = '只读用户' WHERE code = 'viewer' AND tenant_id = 1;
UPDATE role SET name = '运营人员' WHERE code = 'operator' AND tenant_id = 2;

UPDATE tenant SET name = '演示租户' WHERE code = 'demo';
UPDATE tenant SET name = '合作伙伴租户' WHERE code = 'partner';
