package com.mfe.platform.repo;

import com.mfe.platform.domain.ProductEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<ProductEntity, Long> {

  List<ProductEntity> findByTenantIdOrderByIdAsc(Long tenantId);

  Optional<ProductEntity> findByIdAndTenantId(Long id, Long tenantId);

  long countByTenantIdAndCategoryId(Long tenantId, Long categoryId);
}
