package com.mfe.platform.repo;

import com.mfe.platform.domain.DashboardStatEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DashboardStatRepository extends JpaRepository<DashboardStatEntity, Long> {

  Optional<DashboardStatEntity> findByTenantId(Long tenantId);
}
