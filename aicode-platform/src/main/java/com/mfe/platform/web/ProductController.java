package com.mfe.platform.web;

import com.mfe.platform.common.ApiResponse;
import com.mfe.platform.common.BusinessException;
import com.mfe.platform.domain.ProductEntity;
import com.mfe.platform.rbac.RequirePermission;
import com.mfe.platform.repo.ProductRepository;
import com.mfe.platform.tenant.TenantContext;
import com.mfe.platform.web.dto.CreateProductRequest;
import com.mfe.platform.web.dto.ProductDto;
import java.util.List;
import java.util.stream.Collectors;
import javax.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
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
  @RequirePermission("product:view")
  public ApiResponse<ProductDto> detail(@PathVariable("id") Long id) {
    Long tenantId = TenantContext.getTenantId();
    ProductEntity entity =
        productRepository
            .findByIdAndTenantId(id, tenantId)
            .orElseThrow(() -> new BusinessException(404, "商品不存在"));
    return ApiResponse.ok(toDto(entity));
  }

  @PostMapping
  @RequirePermission("product:create")
  public ApiResponse<ProductDto> create(@Valid @RequestBody CreateProductRequest request) {
    ProductEntity entity = new ProductEntity();
    entity.setTenantId(TenantContext.getTenantId());
    entity.setName(request.getName().trim());
    entity.setSku(request.getSku().trim());
    entity.setPrice(request.getPrice());
    entity.setStock(request.getStock());
    entity.setStatus("off".equals(request.getStatus()) ? "off" : "on");
    return ApiResponse.ok(toDto(productRepository.save(entity)));
  }

  private ProductDto toDto(ProductEntity entity) {
    ProductDto dto = new ProductDto();
    dto.setId(entity.getId());
    dto.setName(entity.getName());
    dto.setSku(entity.getSku());
    dto.setPrice(entity.getPrice().doubleValue());
    dto.setStock(entity.getStock());
    dto.setStatus(entity.getStatus());
    return dto;
  }
}
