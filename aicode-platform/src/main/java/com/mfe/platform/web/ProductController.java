package com.mfe.platform.web;

import com.mfe.platform.common.ApiResponse;
import com.mfe.platform.common.BusinessException;
import com.mfe.platform.domain.ProductEntity;
import com.mfe.platform.rbac.RequireAnyPermission;
import com.mfe.platform.rbac.RequirePermission;
import com.mfe.platform.repo.ProductRepository;
import com.mfe.platform.tenant.TenantContext;
import com.mfe.platform.web.dto.CreateProductRequest;
import com.mfe.platform.web.dto.ProductDto;
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
@RequestMapping("/api/products")
public class ProductController {

  private final ProductRepository productRepository;

  public ProductController(ProductRepository productRepository) {
    this.productRepository = productRepository;
  }

  @GetMapping
  @RequirePermission("product:list")
  public ApiResponse<List<ProductDto>> list() {
    Long tenantId = TenantContext.getTenantId();
    List<ProductDto> list =
        productRepository.findByTenantIdOrderByIdAsc(tenantId).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    return ApiResponse.ok(list);
  }

  @GetMapping("/{id}")
  @RequireAnyPermission({"product:list", "product:view"})
  public ApiResponse<ProductDto> detail(@PathVariable("id") Long id) {
    return ApiResponse.ok(toDto(requireProduct(id)));
  }

  @PostMapping
  @RequirePermission("product:list:create")
  public ApiResponse<ProductDto> create(@Valid @RequestBody CreateProductRequest request) {
    Long tenantId = TenantContext.getTenantId();
    assertSkuFree(tenantId, request.getSku().trim(), null);
    ProductEntity entity = new ProductEntity();
    entity.setTenantId(tenantId);
    apply(entity, request);
    return ApiResponse.ok(toDto(productRepository.save(entity)));
  }

  @PutMapping("/{id}")
  @RequirePermission("product:list:update")
  public ApiResponse<ProductDto> update(
      @PathVariable("id") Long id, @Valid @RequestBody CreateProductRequest request) {
    ProductEntity entity = requireProduct(id);
    assertSkuFree(entity.getTenantId(), request.getSku().trim(), entity.getId());
    apply(entity, request);
    return ApiResponse.ok(toDto(productRepository.save(entity)));
  }

  @DeleteMapping("/{id}")
  @RequirePermission("product:list:delete")
  public ApiResponse<Void> delete(@PathVariable("id") Long id) {
    productRepository.delete(requireProduct(id));
    return ApiResponse.ok(null);
  }

  private ProductEntity requireProduct(Long id) {
    return productRepository
        .findByIdAndTenantId(id, TenantContext.getTenantId())
        .orElseThrow(() -> new BusinessException(404, "商品不存在"));
  }

  private void assertSkuFree(Long tenantId, String sku, Long excludeId) {
    productRepository
        .findByTenantIdAndSku(tenantId, sku)
        .ifPresent(
            existing -> {
              if (excludeId == null || !existing.getId().equals(excludeId)) {
                throw new BusinessException(409, "该 SKU 已存在");
              }
            });
  }

  private void apply(ProductEntity entity, CreateProductRequest request) {
    entity.setName(request.getName().trim());
    entity.setSku(request.getSku().trim());
    entity.setPrice(request.getPrice());
    entity.setStock(request.getStock());
    entity.setStatus("off".equals(request.getStatus()) ? "off" : "on");
    entity.setCategoryId(request.getCategoryId());
  }

  private ProductDto toDto(ProductEntity entity) {
    ProductDto dto = new ProductDto();
    dto.setId(entity.getId());
    dto.setName(entity.getName());
    dto.setSku(entity.getSku());
    dto.setPrice(entity.getPrice().doubleValue());
    dto.setStock(entity.getStock());
    dto.setStatus(entity.getStatus());
    dto.setCategoryId(entity.getCategoryId());
    return dto;
  }
}
