package com.mfe.platform.web.dto;

import java.util.ArrayList;
import java.util.List;

public class MenuNodeDto {

  private Long id;
  private String key;
  private String label;
  private String path;
  private String app;
  private String icon;
  private String permission;
  private String nodeType;
  private Long parentId;
  private Long routeCatalogId;
  private Integer sortOrder;
  private List<MenuNodeDto> children = new ArrayList<>();

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getKey() {
    return key;
  }

  public void setKey(String key) {
    this.key = key;
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

  public String getApp() {
    return app;
  }

  public void setApp(String app) {
    this.app = app;
  }

  public String getIcon() {
    return icon;
  }

  public void setIcon(String icon) {
    this.icon = icon;
  }

  public String getPermission() {
    return permission;
  }

  public void setPermission(String permission) {
    this.permission = permission;
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

  public Integer getSortOrder() {
    return sortOrder;
  }

  public void setSortOrder(Integer sortOrder) {
    this.sortOrder = sortOrder;
  }

  public List<MenuNodeDto> getChildren() {
    return children;
  }

  public void setChildren(List<MenuNodeDto> children) {
    this.children = children;
  }
}
