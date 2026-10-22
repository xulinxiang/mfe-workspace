package com.mfe.platform.rbac;

import com.mfe.platform.repo.PermissionRepository;
import com.mfe.platform.repo.RoleRepository;
import com.mfe.platform.tenant.TenantContext;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class RbacService {

  private final RoleRepository roleRepository;
  private final PermissionRepository permissionRepository;

  public RbacService(
      RoleRepository roleRepository, PermissionRepository permissionRepository) {
    this.roleRepository = roleRepository;
    this.permissionRepository = permissionRepository;
  }

  public void loadContext(Long userId, Long tenantId) {
    List<String> roles = roleRepository.findCodesByUserAndTenant(userId, tenantId);
    List<String> permissions =
        permissionRepository.findCodesByUserAndTenant(userId, tenantId);
    TenantContext.setRoles(roles);
    TenantContext.setPermissions(permissions);
  }
}
