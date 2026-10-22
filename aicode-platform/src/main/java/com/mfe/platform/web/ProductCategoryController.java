package com.mfe.platform.web;

import com.mfe.platform.common.ApiResponse;
import com.mfe.platform.domain.ProductCategoryEntity;
import com.mfe.platform.rbac.RequirePermission;
import com.mfe.platform.repo.ProductCategoryRepository;
import com.mfe.platform.repo.ProductRepository;
import com.mfe.platform.tenant.TenantContext;
import com.mfe.platform.web.dto.ProductCategoryDto;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/product-categories")
public class ProductCategoryController {

  private final ProductCategoryRepository categoryRepository;
  private final ProductRepository productRepository;

  public ProductCategoryController(
      ProductCategoryRepository categoryRepository, ProductRepository productRepository) {
    this.categoryRepository = categoryRepository;
    this.productRepository = productRepository;
  }

  @GetMapping
  @RequirePermission("product:category")
  public ApiResponse<List<ProductCategoryDto>> list() {
    Long tenantId = TenantContext.getTenantId();
    List<ProductCategoryDto> data =
        categoryRepository.findByTenantIdOrderBySortOrderAsc(tenantId).stream()
            .map(item -> toDto(item, tenantId))
            .collect(Collectors.toList());
    return ApiResponse.ok(data);
  }

  private ProductCategoryDto toDto(ProductCategoryEntity entity, Long tenantId) {
    ProductCategoryDto dto = new ProductCategoryDto();
    dto.setId(entity.getId());
    dto.setName(entity.getName());
    dto.setStatus(entity.getStatus());
    dto.setProductCount(
        productRepository.countByTenantIdAndCategoryId(tenantId, entity.getId()));
    return dto;
  }
}
