package com.mfe.platform.web.dto;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

public class AdminMenuRequest {

  @Size(max = 64)
  private String key;

  @NotBlank
  @Size(max = 128)
  private String label;

  @Size(max = 255)
  private String path;

  @Size(max = 32)
  private String app;

  @Size(max = 128)
  private String permission;

  @Size(max = 64)
  private String icon;

  /** group | route */
  @Size(max = 16)
  private String nodeType;

  private Long parentId;

  private Integer sortOrder;

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

  public String getPermission() {
    return permission;
  }

  public void setPermission(String permission) {
    this.permission = permission;
  }

  public String getIcon() {
    return icon;
  }

  public void setIcon(String icon) {
    this.icon = icon;
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

  public Integer getSortOrder() {
    return sortOrder;
  }

  public void setSortOrder(Integer sortOrder) {
    this.sortOrder = sortOrder;
  }
}
