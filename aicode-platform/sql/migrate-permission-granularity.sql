SET NAMES utf8mb4;
USE mfe;

ALTER TABLE permission
  ADD COLUMN resource_type VARCHAR(16) NOT NULL DEFAULT 'page' COMMENT 'page=菜单/路由入口 action=按钮/操作' AFTER name,
  ADD COLUMN parent_code VARCHAR(128) DEFAULT NULL COMMENT 'action 所属 page 权限 code' AFTER resource_type;

UPDATE permission SET resource_type = 'page' WHERE code IN (
  'dashboard:view', 'product:list', 'product:view', 'product:category',
  'user:profile', 'system:manage'
);

UPDATE permission SET resource_type = 'action', parent_code = 'product:list' WHERE code = 'product:create';
UPDATE permission SET resource_type = 'action', parent_code = 'user:profile' WHERE code = 'user:profile:update';

INSERT IGNORE INTO permission (code, name, subsystem_code, resource_type, parent_code) VALUES
  ('system:member:manage', '成员账号管理', 'host', 'action', 'system:manage'),
  ('system:role:manage', '角色与权限配置', 'host', 'action', 'system:manage'),
  ('system:menu:manage', '菜单与路由编排', 'host', 'action', 'system:manage');

INSERT IGNORE INTO role_permission (role_id, permission_id)
SELECT 1, id FROM permission WHERE code IN ('system:member:manage', 'system:role:manage', 'system:menu:manage');
