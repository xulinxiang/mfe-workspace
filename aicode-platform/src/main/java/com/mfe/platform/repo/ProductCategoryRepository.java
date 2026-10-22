package com.mfe.platform.repo;

import com.mfe.platform.domain.ProductCategoryEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductCategoryRepository
    extends JpaRepository<ProductCategoryEntity, Long> {

  List<ProductCategoryEntity> findByTenantIdOrderBySortOrderAsc(Long tenantId);

  Optional<ProductCategoryEntity> findByIdAndTenantId(Long id, Long tenantId);

  Optional<ProductCategoryEntity> findByTenantIdAndName(Long tenantId, String name);
}
