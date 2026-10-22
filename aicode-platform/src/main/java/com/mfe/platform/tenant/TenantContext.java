package com.mfe.platform.tenant;

import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Set;

public final class TenantContext {

  private static final ThreadLocal<Long> TENANT_ID = new ThreadLocal<>();
  private static final ThreadLocal<Long> USER_ID = new ThreadLocal<>();
  private static final ThreadLocal<Set<String>> ROLES = new ThreadLocal<>();
  private static final ThreadLocal<Set<String>> PERMISSIONS = new ThreadLocal<>();

  private TenantContext() {}

  public static void setTenantId(Long tenantId) {
    TENANT_ID.set(tenantId);
  }

  public static Long getTenantId() {
    return TENANT_ID.get();
  }

  public static void setUserId(Long userId) {
    USER_ID.set(userId);
  }

  public static Long getUserId() {
    return USER_ID.get();
  }

  public static void setRoles(Iterable<String> roles) {
    Set<String> values = new LinkedHashSet<>();
    roles.forEach(values::add);
    ROLES.set(Collections.unmodifiableSet(values));
  }

  public static Set<String> getRoles() {
    Set<String> roles = ROLES.get();
    return roles == null ? Collections.emptySet() : roles;
  }

  public static void setPermissions(Iterable<String> permissions) {
    Set<String> values = new LinkedHashSet<>();
    permissions.forEach(values::add);
    PERMISSIONS.set(Collections.unmodifiableSet(values));
  }

  public static Set<String> getPermissions() {
    Set<String> permissions = PERMISSIONS.get();
    return permissions == null ? Collections.emptySet() : permissions;
  }

  public static boolean hasPermission(String permission) {
    return getPermissions().contains(permission);
  }

  public static boolean hasAnyPermission(String... permissions) {
    Set<String> granted = getPermissions();
    for (String permission : permissions) {
      if (granted.contains(permission)) {
        return true;
      }
    }
    return false;
  }

  public static void clear() {
    TENANT_ID.remove();
    USER_ID.remove();
    ROLES.remove();
    PERMISSIONS.remove();
  }
}
