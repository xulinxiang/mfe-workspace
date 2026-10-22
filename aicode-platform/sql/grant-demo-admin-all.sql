SET NAMES utf8mb4;
USE mfe;

-- demo 租户管理员（role_id=1）拥有当前库内全部 permission
DELETE FROM role_permission WHERE role_id = 1;
INSERT INTO role_permission (role_id, permission_id)
SELECT 1, id FROM permission;
