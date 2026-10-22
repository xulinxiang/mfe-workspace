SET NAMES utf8mb4;
USE mfe;

INSERT IGNORE INTO role_permission (role_id, permission_id)
SELECT 1, id FROM permission WHERE code LIKE 'admin:%';
