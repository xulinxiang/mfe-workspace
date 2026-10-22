package com.mfe.platform.repo;

import com.mfe.platform.domain.ProductCategoryEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductCategoryRepository
    extends JpaRepository<ProductCategoryEntity, Long> {

  List<ProductCategoryEntity> findByTenantIdOrderBySortOrderAsc(Long tenantId);
}
