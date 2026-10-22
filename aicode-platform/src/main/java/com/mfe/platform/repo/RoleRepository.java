package com.mfe.platform.repo;

import com.mfe.platform.domain.RoleEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RoleRepository extends JpaRepository<RoleEntity, Long> {

  @Query(
      value =
          "SELECT DISTINCT r.code FROM role r "
              + "JOIN user_role ur ON ur.role_id = r.id "
              + "WHERE ur.user_id = :userId AND r.tenant_id = :tenantId "
              + "ORDER BY r.code",
      nativeQuery = true)
  List<String> findCodesByUserAndTenant(
      @Param("userId") Long userId, @Param("tenantId") Long tenantId);
}
