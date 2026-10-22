package com.mfe.platform.repo;

import com.mfe.platform.domain.PermissionEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PermissionRepository extends JpaRepository<PermissionEntity, Long> {

  @Query(
      value =
          "SELECT DISTINCT p.code FROM permission p "
              + "JOIN role_permission rp ON rp.permission_id = p.id "
              + "JOIN role r ON r.id = rp.role_id "
              + "JOIN user_role ur ON ur.role_id = r.id "
              + "WHERE ur.user_id = :userId AND r.tenant_id = :tenantId "
              + "ORDER BY p.code",
      nativeQuery = true)
  List<String> findCodesByUserAndTenant(
      @Param("userId") Long userId, @Param("tenantId") Long tenantId);
}
