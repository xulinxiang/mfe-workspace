package com.mfe.platform.web;

import com.mfe.platform.common.ApiResponse;
import com.mfe.platform.common.BusinessException;
import com.mfe.platform.domain.ProductCategoryEntity;
import com.mfe.platform.rbac.RequirePermission;
import com.mfe.platform.repo.ProductCategoryRepository;
import com.mfe.platform.repo.ProductRepository;
import com.mfe.platform.tenant.TenantContext;
import com.mfe.platform.web.dto.CategoryRequest;
import com.mfe.platform.web.dto.ProductCategoryDto;
import java.util.List;
import java.util.stream.Collectors;
import javax.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
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

  @PostMapping
  @RequirePermission("product:category:create")
  public ApiResponse<ProductCategoryDto> create(@Valid @RequestBody CategoryRequest request) {
    Long tenantId = TenantContext.getTenantId();
    assertNameFree(tenantId, request.getName().trim(), null);
    ProductCategoryEntity entity = new ProductCategoryEntity();
    entity.setTenantId(tenantId);
    entity.setName(request.getName().trim());
    entity.setStatus("off".equals(request.getStatus()) ? "off" : "on");
    entity.setSortOrder(nextSort(tenantId));
    return ApiResponse.ok(toDto(categoryRepository.save(entity), tenantId));
  }

  @PutMapping("/{id}")
  @RequirePermission("product:category:update")
  public ApiResponse<ProductCategoryDto> update(
      @PathVariable("id") Long id, @Valid @RequestBody CategoryRequest request) {
    Long tenantId = TenantContext.getTenantId();
    ProductCategoryEntity entity = requireCategory(id);
    assertNameFree(tenantId, request.getName().trim(), entity.getId());
    entity.setName(request.getName().trim());
    entity.setStatus("off".equals(request.getStatus()) ? "off" : "on");
    return ApiResponse.ok(toDto(categoryRepository.save(entity), tenantId));
  }

  @DeleteMapping("/{id}")
  @RequirePermission("product:category:delete")
  public ApiResponse<Void> delete(@PathVariable("id") Long id) {
    ProductCategoryEntity entity = requireCategory(id);
    long used =
        productRepository.countByTenantIdAndCategoryId(TenantContext.getTenantId(), entity.getId());
    if (used > 0) {
      throw new BusinessException(409, "该分类下还有商品，无法删除");
    }
    categoryRepository.delete(entity);
    return ApiResponse.ok(null);
  }

  private ProductCategoryEntity requireCategory(Long id) {
    return categoryRepository
        .findByIdAndTenantId(id, TenantContext.getTenantId())
        .orElseThrow(() -> new BusinessException(404, "分类不存在"));
  }

  private void assertNameFree(Long tenantId, String name, Long excludeId) {
    categoryRepository
        .findByTenantIdAndName(tenantId, name)
        .ifPresent(
            existing -> {
              if (excludeId == null || !existing.getId().equals(excludeId)) {
                throw new BusinessException(409, "分类名称已存在");
              }
            });
  }

  private int nextSort(Long tenantId) {
    return categoryRepository.findByTenantIdOrderBySortOrderAsc(tenantId).stream()
            .map(ProductCategoryEntity::getSortOrder)
            .max(Integer::compareTo)
            .orElse(0)
        + 10;
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
