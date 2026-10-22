package com.mfe.platform.repo;

import com.mfe.platform.domain.TenantEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantRepository extends JpaRepository<TenantEntity, Long> {

  Optional<TenantEntity> findByCode(String code);
}
