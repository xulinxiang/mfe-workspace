package com.mfe.platform.domain;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Table;

@Entity
@Table(name = "product_category")
public class ProductCategoryEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "tenant_id", nullable = false)
  private Long tenantId;

  @Column(nullable = false, length = 128)
  private String name;

  @Column(nullable = false, length = 8)
  private String status;

  @Column(name = "sort_order", nullable = false)
  private Integer sortOrder;

  public Long getId() {
    return id;
  }

  public Long getTenantId() {
    return tenantId;
  }

  public String getName() {
    return name;
  }

  public String getStatus() {
    return status;
  }

  public Integer getSortOrder() {
    return sortOrder;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public void setTenantId(Long tenantId) {
    this.tenantId = tenantId;
  }

  public void setName(String name) {
    this.name = name;
  }

  public void setStatus(String status) {
    this.status = status;
  }

  public void setSortOrder(Integer sortOrder) {
    this.sortOrder = sortOrder;
  }
}
