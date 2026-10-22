package com.mfe.platform.domain;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Table;

@Entity
@Table(name = "menu_item")
public class MenuItemEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "tenant_id", nullable = false)
  private Long tenantId;

  @Column(name = "menu_key", nullable = false, length = 64)
  private String menuKey;

  @Column(nullable = false, length = 128)
  private String label;

  @Column(nullable = false)
  private String path;

  @Column(name = "app_name", length = 32)
  private String appName;

  @Column(length = 64)
  private String icon;

  @Column(name = "permission_code", length = 128)
  private String permissionCode;

  @Column(name = "sort_order", nullable = false)
  private Integer sortOrder;

  @Column(name = "node_type", nullable = false, length = 16)
  private String nodeType = "route";

  @Column(name = "parent_id")
  private Long parentId;

  @Column(name = "route_catalog_id")
  private Long routeCatalogId;

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public Long getTenantId() {
    return tenantId;
  }

  public void setTenantId(Long tenantId) {
    this.tenantId = tenantId;
  }

  public String getMenuKey() {
    return menuKey;
  }

  public void setMenuKey(String menuKey) {
    this.menuKey = menuKey;
  }

  public String getLabel() {
    return label;
  }

  public void setLabel(String label) {
    this.label = label;
  }

  public String getPath() {
    return path;
  }

  public void setPath(String path) {
    this.path = path;
  }

  public String getAppName() {
    return appName;
  }

  public void setAppName(String appName) {
    this.appName = appName;
  }

  public String getIcon() {
    return icon;
  }

  public void setIcon(String icon) {
    this.icon = icon;
  }

  public String getPermissionCode() {
    return permissionCode;
  }

  public void setPermissionCode(String permissionCode) {
    this.permissionCode = permissionCode;
  }

  public Integer getSortOrder() {
    return sortOrder;
  }

  public void setSortOrder(Integer sortOrder) {
    this.sortOrder = sortOrder;
  }

  public String getNodeType() {
    return nodeType;
  }

  public void setNodeType(String nodeType) {
    this.nodeType = nodeType;
  }

  public Long getParentId() {
    return parentId;
  }

  public void setParentId(Long parentId) {
    this.parentId = parentId;
  }

  public Long getRouteCatalogId() {
    return routeCatalogId;
  }

  public void setRouteCatalogId(Long routeCatalogId) {
    this.routeCatalogId = routeCatalogId;
  }
}
