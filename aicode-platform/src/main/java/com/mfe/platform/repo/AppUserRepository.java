package com.mfe.platform.repo;

import com.mfe.platform.domain.AppUserEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppUserRepository extends JpaRepository<AppUserEntity, Long> {

  Optional<AppUserEntity> findByEmail(String email);

  List<AppUserEntity> findAllByEmail(String email);

  Optional<AppUserEntity> findByTenantIdAndEmail(Long tenantId, String email);

  Optional<AppUserEntity> findByIdAndTenantId(Long id, Long tenantId);

  List<AppUserEntity> findByTenantIdOrderByIdAsc(Long tenantId);
}
