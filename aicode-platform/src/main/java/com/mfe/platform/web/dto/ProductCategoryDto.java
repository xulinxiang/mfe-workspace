package com.mfe.platform.web.dto;

public class ProductCategoryDto {

  private long id;
  private String name;
  private String status;
  private long productCount;

  public long getId() {
    return id;
  }

  public void setId(long id) {
    this.id = id;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status;
  }

  public long getProductCount() {
    return productCount;
  }

  public void setProductCount(long productCount) {
    this.productCount = productCount;
  }
}
