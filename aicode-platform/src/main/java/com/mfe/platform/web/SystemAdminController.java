package com.mfe.platform.web;

import com.mfe.platform.common.ApiResponse;
import com.mfe.platform.common.BusinessException;
import com.mfe.platform.rbac.RequireAnyPermission;
import com.mfe.platform.rbac.RequirePermission;
import com.mfe.platform.tenant.TenantContext;
import com.mfe.platform.web.dto.AdminCreateUserRequest;
import com.mfe.platform.web.dto.AdminMenuRequest;
import com.mfe.platform.web.dto.AdminPermissionRequest;
import com.mfe.platform.web.dto.AdminRoleRequest;
import com.mfe.platform.web.dto.IdsRequest;
import com.mfe.platform.web.dto.ReorderRequest;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import javax.validation.Valid;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class SystemAdminController {

  private static final String MEMBER_VIEW = "admin:members:view";
  private static final String MEMBER_CREATE = "admin:members:create";
  private static final String MEMBER_ASSIGN = "admin:members:assign-role";
  private static final String ROLE_MANAGE_VIEW = "admin:role-manage:view";
  private static final String ROLE_VIEW = "admin:roles:view";
  private static final String ROLE_CREATE = "admin:roles:create";
  private static final String ROLE_UPDATE = "admin:roles:update";
  private static final String ROLE_DELETE = "admin:roles:delete";
  private static final String ROLE_ASSIGN = "admin:roles:assign-permissions";
  private static final String PERM_VIEW = "admin:permissions:view";
  private static final String PERM_CREATE = "admin:permissions:create";
  private static final String PERM_UPDATE = "admin:permissions:update";
  private static final String PERM_DELETE = "admin:permissions:delete";

  private final JdbcTemplate jdbc;
  private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

  public SystemAdminController(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  @GetMapping("/bootstrap")
  @RequireAnyPermission({MEMBER_VIEW, ROLE_MANAGE_VIEW, ROLE_VIEW, PERM_VIEW})
  public ApiResponse<Map<String, Object>> bootstrap() {
    Long tenantId = TenantContext.getTenantId();
    Map<String, Object> data = new LinkedHashMap<>();
    data.put(
        "users",
        jdbc.queryForList(
            "SELECT u.id, u.email, u.name, u.role_label AS roleLabel, "
                + "GROUP_CONCAT(ur.role_id ORDER BY ur.role_id) AS roleIds "
                + "FROM app_user u LEFT JOIN user_role ur ON ur.user_id=u.id "
                + "WHERE u.tenant_id=? GROUP BY u.id ORDER BY u.id",
            tenantId));
    data.put(
        "roles",
        jdbc.queryForList(
            "SELECT r.id, r.code, r.name, "
                + "GROUP_CONCAT(rp.permission_id ORDER BY rp.permission_id) AS permissionIds "
                + "FROM role r LEFT JOIN role_permission rp ON rp.role_id=r.id "
                + "WHERE r.tenant_id=? GROUP BY r.id ORDER BY r.id",
            tenantId));
    data.put(
        "permissions",
        jdbc.queryForList(
            "SELECT id, code, name, subsystem_code AS subsystem, resource_type AS resourceType, "
                + "parent_code AS parentCode, sort_order AS sortOrder FROM permission "
                + "ORDER BY subsystem_code, resource_type, sort_order, id"));
    data.put(
        "subsystems",
        jdbc.queryForList("SELECT code, name, sort_order AS sortOrder FROM subsystem ORDER BY sort_order"));
    data.put(
        "routeCatalog",
        jdbc.queryForList(
            "SELECT id, subsystem_code AS subsystem, route_key AS routeKey, label, path, icon, "
                + "permission_code AS permission, sort_order AS sortOrder "
                + "FROM route_catalog ORDER BY subsystem_code, sort_order, id"));
    data.put(
        "menus",
        jdbc.queryForList(
            "SELECT id, menu_key AS menuKey, label, path, app_name AS app, icon, "
                + "permission_code AS permission, sort_order AS sortOrder, node_type AS nodeType, "
                + "parent_id AS parentId, route_catalog_id AS routeCatalogId "
                + "FROM menu_item WHERE tenant_id=? ORDER BY sort_order, id",
            tenantId));
    return ApiResponse.ok(data);
  }

  @PostMapping("/permissions")
  @Transactional
  @RequirePermission(PERM_CREATE)
  public ApiResponse<Void> createPermission(@Valid @RequestBody AdminPermissionRequest request) {
    PermissionFields fields = resolvePermissionFields(request);
    fields.parentMenuId = request.getParentMenuId();
    fields.sortOrder = request.getSortOrder() == null ? nextPermissionSort(fields) : request.getSortOrder();
    String path = normalizePagePath(request.getPath(), fields.resourceType);
    String icon = blankToNull(request.getIcon());
    try {
      jdbc.update(
          "INSERT INTO permission(code,name,resource_type,parent_code,subsystem_code,sort_order) VALUES(?,?,?,?,?,?)",
          fields.code,
          fields.name,
          fields.resourceType,
          fields.parentCode,
          fields.subsystem,
          fields.sortOrder);
      if ("page".equals(fields.resourceType) && path != null) {
        upsertPageRouteAndMenu(fields, path, icon);
      }
      return ApiResponse.ok(null);
    } catch (DuplicateKeyException ex) {
      throw new BusinessException(409, "权限码已存在");
    }
  }

  @PutMapping("/permissions/{id}")
  @Transactional
  @RequirePermission(PERM_UPDATE)
  public ApiResponse<Void> updatePermission(
      @PathVariable("id") Long id, @Valid @RequestBody AdminPermissionRequest request) {
    requirePermissionRow(id);
    String oldCode =
        jdbc.queryForObject("SELECT code FROM permission WHERE id=?", String.class, id);
    PermissionFields fields = resolvePermissionFields(request);
    fields.parentMenuId = request.getParentMenuId();
    fields.sortOrder = request.getSortOrder();
    String path = normalizePagePath(request.getPath(), fields.resourceType);
    String icon = blankToNull(request.getIcon());
    try {
      if (fields.sortOrder != null) {
        jdbc.update(
            "UPDATE permission SET code=?, name=?, resource_type=?, parent_code=?, subsystem_code=?, sort_order=? WHERE id=?",
            fields.code,
            fields.name,
            fields.resourceType,
            fields.parentCode,
            fields.subsystem,
            fields.sortOrder,
            id);
      } else {
        jdbc.update(
            "UPDATE permission SET code=?, name=?, resource_type=?, parent_code=?, subsystem_code=? WHERE id=?",
            fields.code,
            fields.name,
            fields.resourceType,
            fields.parentCode,
            fields.subsystem,
            id);
      }
      if (oldCode != null && !oldCode.equals(fields.code)) {
        jdbc.update("UPDATE permission SET parent_code=? WHERE parent_code=?", fields.code, oldCode);
        jdbc.update(
            "UPDATE menu_item SET permission_code=? WHERE permission_code=?", fields.code, oldCode);
        jdbc.update(
            "UPDATE route_catalog SET permission_code=? WHERE permission_code=?", fields.code, oldCode);
      }
      if ("page".equals(fields.resourceType) && path != null) {
        upsertPageRouteAndMenu(fields, path, icon);
      }
      return ApiResponse.ok(null);
    } catch (DuplicateKeyException ex) {
      throw new BusinessException(409, "权限码已存在");
    }
  }

  @DeleteMapping("/permissions/{id}")
  @Transactional
  @RequirePermission(PERM_DELETE)
  public ApiResponse<Void> deletePermission(@PathVariable("id") Long id) {
    requirePermissionRow(id);
    String code = jdbc.queryForObject("SELECT code FROM permission WHERE id=?", String.class, id);
    List<Long> childIds =
        jdbc.queryForList("SELECT id FROM permission WHERE parent_code=?", Long.class, code);
    for (Long childId : childIds) {
      jdbc.update("DELETE FROM role_permission WHERE permission_id=?", childId);
    }
    jdbc.update("DELETE FROM permission WHERE parent_code=?", code);
    jdbc.update("DELETE FROM menu_item WHERE permission_code=?", code);
    jdbc.update("DELETE FROM route_catalog WHERE permission_code=?", code);
    jdbc.update("DELETE FROM role_permission WHERE permission_id=?", id);
    jdbc.update("DELETE FROM permission WHERE id=?", id);
    return ApiResponse.ok(null);
  }

  @PutMapping("/permission-order")
  @Transactional
  @RequirePermission(PERM_UPDATE)
  public ApiResponse<Void> reorderPermissions(@Valid @RequestBody ReorderRequest request) {
    int sort = 10;
    for (Long id : request.getOrderedIds()) {
      requirePermissionRow(id);
      jdbc.update("UPDATE permission SET sort_order=? WHERE id=?", sort, id);
      sort += 10;
    }
    return ApiResponse.ok(null);
  }

  @PostMapping("/menus")
  @Transactional
  @RequirePermission(PERM_CREATE)
  public ApiResponse<Void> createMenu(@Valid @RequestBody AdminMenuRequest request) {
    insertMenu(resolveMenuFields(request, true));
    return ApiResponse.ok(null);
  }

  @PutMapping("/menus/{id}")
  @Transactional
  @RequirePermission(PERM_UPDATE)
  public ApiResponse<Void> updateMenu(
      @PathVariable("id") Long id, @Valid @RequestBody AdminMenuRequest request) {
    Map<String, Object> row = requireMenuRow(id);
    MenuFields fields = resolveMenuFields(request, false);
    if ("route".equals(String.valueOf(row.get("node_type"))) && "group".equals(fields.nodeType)) {
      throw new BusinessException(400, "菜单不能改成目录");
    }
    assertNotDescendant(id, fields.parentId);
    try {
      jdbc.update(
          "UPDATE menu_item SET menu_key=?, label=?, path=?, app_name=?, icon=?, permission_code=?, "
              + "sort_order=?, node_type=?, parent_id=? WHERE id=? AND tenant_id=?",
          fields.key,
          fields.label,
          fields.path,
          fields.app,
          fields.icon,
          fields.permission,
          fields.sortOrder != null ? fields.sortOrder : ((Number) row.get("sort_order")).intValue(),
          fields.nodeType,
          fields.parentId,
          id,
          TenantContext.getTenantId());
      return ApiResponse.ok(null);
    } catch (DuplicateKeyException ex) {
      throw new BusinessException(409, "侧栏菜单标识已存在");
    }
  }

  @DeleteMapping("/menus/{id}")
  @Transactional
  @RequirePermission(PERM_DELETE)
  public ApiResponse<Void> deleteMenu(@PathVariable("id") Long id) {
    Map<String, Object> row = requireMenuRow(id);
    if (!"group".equals(String.valueOf(row.get("node_type")))) {
      throw new BusinessException(400, "页面菜单请用删除权限；目录才能在此删除");
    }
    Integer childCount =
        jdbc.queryForObject(
            "SELECT COUNT(*) FROM menu_item WHERE parent_id=? AND tenant_id=?",
            Integer.class,
            id,
            TenantContext.getTenantId());
    if (childCount != null && childCount > 0) {
      throw new BusinessException(409, "请先删除或移出该目录下的菜单");
    }
    jdbc.update(
        "DELETE FROM menu_item WHERE id=? AND tenant_id=?", id, TenantContext.getTenantId());
    return ApiResponse.ok(null);
  }

  @PutMapping("/menu-order")
  @Transactional
  @RequirePermission(PERM_UPDATE)
  public ApiResponse<Void> reorderMenus(@Valid @RequestBody ReorderRequest request) {
    Long tenantId = TenantContext.getTenantId();
    Long parentId = request.getParentId();
    if (parentId != null) {
      Map<String, Object> parent = requireMenuRow(parentId);
      if (!"group".equals(String.valueOf(parent.get("node_type")))) {
        throw new BusinessException(400, "只能挂到目录下");
      }
    }
    int sort = 10;
    for (Long id : request.getOrderedIds()) {
      requireMenuRow(id);
      assertNotDescendant(id, parentId);
      jdbc.update(
          "UPDATE menu_item SET parent_id=?, sort_order=? WHERE id=? AND tenant_id=?",
          parentId,
          sort,
          id,
          tenantId);
      sort += 10;
    }
    return ApiResponse.ok(null);
  }

  @PostMapping("/roles")
  @RequirePermission(ROLE_CREATE)
  public ApiResponse<Void> createRole(@Valid @RequestBody AdminRoleRequest request) {
    try {
      jdbc.update(
          "INSERT INTO role(tenant_id,code,name) VALUES(?,?,?)",
          TenantContext.getTenantId(),
          request.getCode().trim().toLowerCase(),
          request.getName().trim());
      return ApiResponse.ok(null);
    } catch (DuplicateKeyException ex) {
      throw new BusinessException(409, "角色编码已存在");
    }
  }

  @PutMapping("/roles/{id}")
  @RequirePermission(ROLE_UPDATE)
  public ApiResponse<Void> updateRole(
      @PathVariable("id") Long id, @Valid @RequestBody AdminRoleRequest request) {
    requireRole(id);
    try {
      jdbc.update(
          "UPDATE role SET code=?, name=? WHERE id=? AND tenant_id=?",
          request.getCode().trim().toLowerCase(),
          request.getName().trim(),
          id,
          TenantContext.getTenantId());
      return ApiResponse.ok(null);
    } catch (DuplicateKeyException ex) {
      throw new BusinessException(409, "角色编码已存在");
    }
  }

  @DeleteMapping("/roles/{id}")
  @Transactional
  @RequirePermission(ROLE_DELETE)
  public ApiResponse<Void> deleteRole(@PathVariable("id") Long id) {
    requireRole(id);
    Integer users =
        jdbc.queryForObject(
            "SELECT COUNT(*) FROM user_role WHERE role_id=?", Integer.class, id);
    if (users != null && users > 0) {
      throw new BusinessException(409, "请先移除使用该角色的用户");
    }
    jdbc.update("DELETE FROM role_permission WHERE role_id=?", id);
    jdbc.update("DELETE FROM role WHERE id=? AND tenant_id=?", id, TenantContext.getTenantId());
    return ApiResponse.ok(null);
  }

  @PutMapping("/roles/{id}/permissions")
  @Transactional
  @RequirePermission(ROLE_ASSIGN)
  public ApiResponse<Void> updateRolePermissions(
      @PathVariable("id") Long id, @Valid @RequestBody IdsRequest request) {
    requireRole(id);
    validateIds("permission", request.getIds(), null);
    jdbc.update("DELETE FROM role_permission WHERE role_id=?", id);
    for (Long permissionId : request.getIds()) {
      jdbc.update(
          "INSERT INTO role_permission(role_id,permission_id) VALUES(?,?)",
          id,
          permissionId);
    }
    return ApiResponse.ok(null);
  }

  @PostMapping("/users")
  @Transactional
  @RequirePermission(MEMBER_CREATE)
  public ApiResponse<Void> createUser(@Valid @RequestBody AdminCreateUserRequest request) {
    Long tenantId = TenantContext.getTenantId();
    validateIds("role", request.getRoleIds(), tenantId);
    String email = request.getEmail().trim().toLowerCase();
    Integer exists =
        jdbc.queryForObject(
            "SELECT COUNT(*) FROM app_user WHERE tenant_id=? AND email=?",
            Integer.class,
            tenantId,
            email);
    if (exists != null && exists > 0) {
      throw new BusinessException(409, "该租户下邮箱已存在");
    }
    String roleLabel = resolveRoleLabel(request.getRoleIds(), tenantId);
    jdbc.update(
        "INSERT INTO app_user(tenant_id,email,password_hash,name,role_label,phone) VALUES(?,?,?,?,?,?)",
        tenantId,
        email,
        passwordEncoder.encode(request.getPassword()),
        request.getName().trim(),
        roleLabel,
        blankToNull(request.getPhone()));
    Long userId =
        jdbc.queryForObject(
            "SELECT id FROM app_user WHERE tenant_id=? AND email=?",
            Long.class,
            tenantId,
            email);
    for (Long roleId : request.getRoleIds()) {
      jdbc.update("INSERT INTO user_role(user_id,role_id) VALUES(?,?)", userId, roleId);
    }
    return ApiResponse.ok(null);
  }

  @PutMapping("/users/{id}/roles")
  @Transactional
  @RequirePermission(MEMBER_ASSIGN)
  public ApiResponse<Void> updateUserRoles(
      @PathVariable("id") Long userId, @Valid @RequestBody IdsRequest request) {
    requireUser(userId);
    if (request.getIds().isEmpty()) {
      throw new BusinessException(400, "用户至少需要一个角色");
    }
    validateIds("role", request.getIds(), TenantContext.getTenantId());
    jdbc.update("DELETE FROM user_role WHERE user_id=?", userId);
    for (Long roleId : request.getIds()) {
      jdbc.update("INSERT INTO user_role(user_id,role_id) VALUES(?,?)", userId, roleId);
    }
    String roleLabel =
        jdbc.queryForObject("SELECT name FROM role WHERE id=?", String.class, request.getIds().get(0));
    jdbc.update("UPDATE app_user SET role_label=? WHERE id=?", roleLabel, userId);
    return ApiResponse.ok(null);
  }

  private void requireRole(Long id) {
    requireTenantRecord("role", id);
  }

  private void requireUser(Long id) {
    requireTenantRecord("app_user", id);
  }

  private void requireTenantRecord(String table, Long id) {
    Integer count =
        jdbc.queryForObject(
            "SELECT COUNT(*) FROM " + table + " WHERE id=? AND tenant_id=?",
            Integer.class,
            id,
            TenantContext.getTenantId());
    if (count == null || count == 0) {
      throw new BusinessException(404, "数据不存在或不属于当前租户");
    }
  }

  private void validateIds(String table, List<Long> ids, Long tenantId) {
    if (ids.isEmpty()) return;
    String placeholders = ids.stream().map(id -> "?").collect(Collectors.joining(","));
    String sql = "SELECT COUNT(*) FROM " + table + " WHERE id IN (" + placeholders + ")";
    List<Object> args = ids.stream().map(id -> (Object) id).collect(Collectors.toList());
    if (tenantId != null) {
      sql += " AND tenant_id=?";
      args.add(tenantId);
    }
    Integer count = jdbc.queryForObject(sql, Integer.class, args.toArray());
    if (count == null || count != ids.size()) {
      throw new BusinessException(400, "包含无效或跨租户的数据");
    }
  }

  private String resolveRoleLabel(List<Long> roleIds, Long tenantId) {
    if (roleIds.isEmpty()) {
      return "";
    }
    String placeholders = roleIds.stream().map(id -> "?").collect(Collectors.joining(","));
    List<Object> args = roleIds.stream().map(id -> (Object) id).collect(Collectors.toList());
    args.add(tenantId);
    return jdbc.queryForList(
            "SELECT name FROM role WHERE id IN (" + placeholders + ") AND tenant_id=? ORDER BY id",
            String.class,
            args.toArray())
        .stream()
        .collect(Collectors.joining("、"));
  }

  private void requirePermissionRow(Long id) {
    Integer count =
        jdbc.queryForObject("SELECT COUNT(*) FROM permission WHERE id=?", Integer.class, id);
    if (count == null || count == 0) {
      throw new BusinessException(404, "权限不存在");
    }
  }

  private PermissionFields resolvePermissionFields(AdminPermissionRequest request) {
    PermissionFields fields = new PermissionFields();
    fields.code = request.getCode().trim();
    fields.name = request.getName().trim();
    fields.resourceType = request.getResourceType().trim().toLowerCase();
    fields.parentCode = blankToNull(request.getParentCode());
    fields.subsystem = blankToNull(request.getSubsystem());

    if (!"page".equals(fields.resourceType) && !"action".equals(fields.resourceType)) {
      throw new BusinessException(400, "resourceType 只能是 page 或 action");
    }
    if ("page".equals(fields.resourceType)) {
      fields.parentCode = null;
      if (fields.subsystem == null) {
        throw new BusinessException(400, "页面权限必须指定子系统");
      }
    } else {
      if (fields.parentCode == null) {
        throw new BusinessException(400, "操作权限必须指定所属页面 parentCode");
      }
      Integer parent =
          jdbc.queryForObject(
              "SELECT COUNT(*) FROM permission WHERE code=? AND resource_type='page'",
              Integer.class,
              fields.parentCode);
      if (parent == null || parent == 0) {
        throw new BusinessException(400, "所属页面权限不存在");
      }
      String parentSubsystem =
          jdbc.queryForObject(
              "SELECT subsystem_code FROM permission WHERE code=?", String.class, fields.parentCode);
      if (fields.subsystem == null) {
        fields.subsystem = parentSubsystem;
      }
    }
    if (fields.subsystem != null) {
      Integer sub =
          jdbc.queryForObject(
              "SELECT COUNT(*) FROM subsystem WHERE code=?", Integer.class, fields.subsystem);
      if (sub == null || sub == 0) {
        throw new BusinessException(400, "子系统不存在");
      }
    }
    return fields;
  }

  private String normalizePagePath(String rawPath, String resourceType) {
    if (!"page".equals(resourceType)) {
      return null;
    }
    String path = blankToNull(rawPath);
    if (path == null) {
      throw new BusinessException(400, "页面权限必须填写路由 path");
    }
    if (!path.startsWith("/")) {
      throw new BusinessException(400, "路由 path 必须以 / 开头");
    }
    return path;
  }

  private void upsertPageRouteAndMenu(PermissionFields fields, String path, String icon) {
    String routeKey = fields.code.replace(':', '-');
    Long catalogId;
    List<Map<String, Object>> existing =
        jdbc.queryForList("SELECT id FROM route_catalog WHERE permission_code=?", fields.code);
    if (!existing.isEmpty()) {
      catalogId = ((Number) existing.get(0).get("id")).longValue();
      jdbc.update(
          "UPDATE route_catalog SET subsystem_code=?, label=?, path=?, route_key=?, icon=? WHERE id=?",
          fields.subsystem,
          fields.name,
          path,
          routeKey,
          icon,
          catalogId);
    } else {
      Integer maxSort =
          jdbc.queryForObject(
              "SELECT COALESCE(MAX(sort_order), 0) FROM route_catalog WHERE subsystem_code=?",
              Integer.class,
              fields.subsystem);
      int sortOrder = (maxSort == null ? 0 : maxSort) + 10;
      try {
        jdbc.update(
            "INSERT INTO route_catalog(subsystem_code, route_key, label, path, permission_code, icon, sort_order) "
                + "VALUES(?,?,?,?,?,?,?)",
            fields.subsystem,
            routeKey,
            fields.name,
            path,
            fields.code,
            icon,
            sortOrder);
      } catch (DuplicateKeyException ex) {
        throw new BusinessException(409, "标准路由键已存在，请更换权限码");
      }
      catalogId =
          jdbc.queryForObject(
              "SELECT id FROM route_catalog WHERE permission_code=?", Long.class, fields.code);
    }

    Long tenantId = TenantContext.getTenantId();
    Long parentId = fields.parentMenuId;
    if (parentId != null) {
      Map<String, Object> parent = requireMenuRow(parentId);
      if (!"group".equals(String.valueOf(parent.get("node_type")))) {
        throw new BusinessException(400, "只能挂到目录下");
      }
    }
    int menuSort = nextMenuSort(tenantId, parentId);

    jdbc.update(
        "UPDATE menu_item SET path=?, label=?, app_name=?, icon=?, permission_code=? WHERE route_catalog_id=?",
        path,
        fields.name,
        fields.subsystem,
        icon,
        fields.code,
        catalogId);

    Integer menuExists =
        jdbc.queryForObject(
            "SELECT COUNT(*) FROM menu_item WHERE tenant_id=? AND (route_catalog_id=? OR permission_code=?)",
            Integer.class,
            tenantId,
            catalogId,
            fields.code);
    if (menuExists != null && menuExists > 0) {
      jdbc.update(
          "UPDATE menu_item SET menu_key=?, label=?, path=?, app_name=?, icon=?, permission_code=?, "
              + "route_catalog_id=?, node_type='route', parent_id=? WHERE tenant_id=? AND (route_catalog_id=? OR permission_code=?)",
          routeKey,
          fields.name,
          path,
          fields.subsystem,
          icon,
          fields.code,
          catalogId,
          parentId,
          tenantId,
          catalogId,
          fields.code);
      return;
    }

    try {
      jdbc.update(
          "INSERT INTO menu_item(tenant_id, menu_key, label, path, app_name, icon, permission_code, "
              + "sort_order, node_type, parent_id, route_catalog_id) VALUES(?,?,?,?,?,?,?,?,?,?,?)",
          tenantId,
          routeKey,
          fields.name,
          path,
          fields.subsystem,
          icon,
          fields.code,
          menuSort,
          "route",
          parentId,
          catalogId);
    } catch (DuplicateKeyException ex) {
      throw new BusinessException(409, "侧栏菜单标识已存在");
    }
  }

  private int nextPermissionSort(PermissionFields fields) {
    if ("action".equals(fields.resourceType)) {
      Integer max =
          jdbc.queryForObject(
              "SELECT COALESCE(MAX(sort_order), 0) FROM permission WHERE parent_code=?",
              Integer.class,
              fields.parentCode);
      return (max == null ? 0 : max) + 10;
    }
    Integer max =
        jdbc.queryForObject(
            "SELECT COALESCE(MAX(sort_order), 0) FROM permission WHERE subsystem_code=? AND resource_type='page'",
            Integer.class,
            fields.subsystem);
    return (max == null ? 0 : max) + 10;
  }

  private int nextMenuSort(Long tenantId, Long parentId) {
    Integer max;
    if (parentId == null) {
      max =
          jdbc.queryForObject(
              "SELECT COALESCE(MAX(sort_order), 0) FROM menu_item WHERE tenant_id=? AND parent_id IS NULL",
              Integer.class,
              tenantId);
    } else {
      max =
          jdbc.queryForObject(
              "SELECT COALESCE(MAX(sort_order), 0) FROM menu_item WHERE tenant_id=? AND parent_id=?",
              Integer.class,
              tenantId,
              parentId);
    }
    return (max == null ? 0 : max) + 10;
  }

  private Map<String, Object> requireMenuRow(Long id) {
    List<Map<String, Object>> rows =
        jdbc.queryForList(
            "SELECT id, menu_key, label, path, app_name, icon, permission_code, sort_order, node_type, parent_id "
                + "FROM menu_item WHERE id=? AND tenant_id=?",
            id,
            TenantContext.getTenantId());
    if (rows.isEmpty()) {
      throw new BusinessException(404, "菜单不存在或不属于当前租户");
    }
    return rows.get(0);
  }

  private void assertNotDescendant(Long nodeId, Long newParentId) {
    Long cursor = newParentId;
    int guard = 0;
    while (cursor != null && guard < 32) {
      guard += 1;
      if (cursor.equals(nodeId)) {
        throw new BusinessException(400, "不能把目录移到自己的子级下");
      }
      List<Map<String, Object>> rows =
          jdbc.queryForList(
              "SELECT parent_id FROM menu_item WHERE id=? AND tenant_id=?",
              cursor,
              TenantContext.getTenantId());
      if (rows.isEmpty()) {
        return;
      }
      Object parent = rows.get(0).get("parent_id");
      cursor = parent == null ? null : ((Number) parent).longValue();
    }
  }

  private MenuFields resolveMenuFields(AdminMenuRequest request, boolean creating) {
    MenuFields fields = new MenuFields();
    String nodeType = blankToNull(request.getNodeType());
    fields.nodeType = nodeType == null ? "group" : nodeType.trim().toLowerCase();
    if (!"group".equals(fields.nodeType) && !"route".equals(fields.nodeType)) {
      throw new BusinessException(400, "nodeType 只能是 group 或 route");
    }
    fields.label = request.getLabel().trim();
    fields.app = blankToNull(request.getApp());
    fields.icon = blankToNull(request.getIcon());
    fields.permission = blankToNull(request.getPermission());
    fields.parentId = request.getParentId();
    fields.sortOrder = request.getSortOrder();
    if ("group".equals(fields.nodeType)) {
      fields.path = "#";
      fields.permission = null;
      String requested = blankToNull(request.getKey());
      fields.key =
          requested != null
              ? requested
              : "group-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    } else {
      String path = blankToNull(request.getPath());
      if (path == null || !path.startsWith("/")) {
        throw new BusinessException(400, "菜单必须填写以 / 开头的 path");
      }
      fields.path = path;
      String requested = blankToNull(request.getKey());
      fields.key = requested != null ? requested : fields.path.replace('/', '-').replaceAll("^-", "");
    }
    if (fields.parentId != null) {
      Map<String, Object> parent = requireMenuRow(fields.parentId);
      if (!"group".equals(String.valueOf(parent.get("node_type")))) {
        throw new BusinessException(400, "只能挂到目录下");
      }
    }
    if (fields.app != null) {
      Integer sub =
          jdbc.queryForObject(
              "SELECT COUNT(*) FROM subsystem WHERE code=?", Integer.class, fields.app);
      if (sub == null || sub == 0) {
        throw new BusinessException(400, "子系统不存在");
      }
    }
    if (creating && fields.sortOrder == null) {
      fields.sortOrder = nextMenuSort(TenantContext.getTenantId(), fields.parentId);
    }
    return fields;
  }

  private void insertMenu(MenuFields fields) {
    try {
      jdbc.update(
          "INSERT INTO menu_item(tenant_id, menu_key, label, path, app_name, icon, permission_code, "
              + "sort_order, node_type, parent_id, route_catalog_id) VALUES(?,?,?,?,?,?,?,?,?,?,?)",
          TenantContext.getTenantId(),
          fields.key,
          fields.label,
          fields.path,
          fields.app,
          fields.icon,
          fields.permission,
          fields.sortOrder,
          fields.nodeType,
          fields.parentId,
          null);
    } catch (DuplicateKeyException ex) {
      throw new BusinessException(409, "侧栏菜单标识已存在");
    }
  }

  private static class PermissionFields {
    private String code;
    private String name;
    private String resourceType;
    private String parentCode;
    private String subsystem;
    private Long parentMenuId;
    private Integer sortOrder;
  }

  private static class MenuFields {
    private String key;
    private String label;
    private String path;
    private String app;
    private String icon;
    private String permission;
    private String nodeType;
    private Long parentId;
    private Integer sortOrder;
  }

  private String blankToNull(String value) {
    return value == null || value.trim().isEmpty() ? null : value.trim();
  }
}
