SET NAMES utf8mb4;
USE mfe;

-- 权限同级排序（按钮权限、未挂菜单的页面）
ALTER TABLE permission
  ADD COLUMN sort_order INT NOT NULL DEFAULT 0 AFTER subsystem_code;

UPDATE permission p
LEFT JOIN route_catalog r ON r.permission_code = p.code
SET p.sort_order = COALESCE(r.sort_order, p.id * 10);

-- 目录节点补上所属子系统，便于按左侧子系统筛选
UPDATE menu_item g
JOIN (
  SELECT parent_id, MIN(app_name) AS app_name
  FROM menu_item
  WHERE parent_id IS NOT NULL AND app_name IS NOT NULL AND app_name <> ''
  GROUP BY parent_id
) c ON c.parent_id = g.id
SET g.app_name = c.app_name
WHERE g.node_type = 'group' AND (g.app_name IS NULL OR g.app_name = '');
