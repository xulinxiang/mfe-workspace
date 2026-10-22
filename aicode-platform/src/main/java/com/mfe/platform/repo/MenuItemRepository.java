package com.mfe.platform.repo;

import com.mfe.platform.domain.MenuItemEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MenuItemRepository extends JpaRepository<MenuItemEntity, Long> {

  List<MenuItemEntity> findByTenantIdOrderBySortOrderAsc(Long tenantId);
}
