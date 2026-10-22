package com.mfe.platform.domain;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Table;

@Entity
@Table(name = "permission")
public class PermissionEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true, length = 128)
  private String code;

  @Column(nullable = false, length = 128)
  private String name;

  @Column(name = "subsystem_code", length = 32)
  private String subsystemCode;

  @Column(name = "resource_type", nullable = false, length = 16)
  private String resourceType = "page";

  @Column(name = "parent_code", length = 128)
  private String parentCode;

  @Column(name = "sort_order", nullable = false)
  private Integer sortOrder = 0;

  public Long getId() {
    return id;
  }

  public String getCode() {
    return code;
  }

  public String getName() {
    return name;
  }

  public String getSubsystemCode() {
    return subsystemCode;
  }

  public String getResourceType() {
    return resourceType;
  }

  public String getParentCode() {
    return parentCode;
  }

  public Integer getSortOrder() {
    return sortOrder;
  }

  public void setSortOrder(Integer sortOrder) {
    this.sortOrder = sortOrder;
  }
}
