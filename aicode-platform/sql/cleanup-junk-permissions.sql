SET NAMES utf8mb4;
USE mfe;

-- 测试留下的半截/乱码按钮权限
DELETE rp FROM role_permission rp
JOIN permission p ON p.id = rp.permission_id
WHERE p.code IN (
  'user:profile:',
  'dashboard:view:',
  'dashboard:view:222',
  'dashboard:view:333',
  'admin:permissions:view:1'
);

DELETE FROM permission
WHERE code IN (
  'user:profile:',
  'dashboard:view:',
  'dashboard:view:222',
  'dashboard:view:333',
  'admin:permissions:view:1'
);

-- 同一权限挂了两条侧栏：保留「用户中心」，去掉重复的「个人中心」
DELETE FROM menu_item
WHERE tenant_id = 1 AND menu_key = 'user-profile' AND permission_code = 'user:profile';
