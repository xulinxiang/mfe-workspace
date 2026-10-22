package com.mfe.platform.web.dto;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

public class AdminRouteCatalogRequest {

  @NotBlank
  @Size(max = 32)
  private String subsystem;

  @NotBlank
  @Size(max = 64)
  private String routeKey;

  @NotBlank
  @Size(max = 128)
  private String label;

  @NotBlank
  @Size(max = 255)
  private String path;

  @NotBlank
  @Size(max = 128)
  private String permission;

  @Size(max = 64)
  private String icon;

  @NotNull
  private Integer sortOrder;

  public String getSubsystem() {
    return subsystem;
  }

  public void setSubsystem(String subsystem) {
    this.subsystem = subsystem;
  }

  public String getRouteKey() {
    return routeKey;
  }

  public void setRouteKey(String routeKey) {
    this.routeKey = routeKey;
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

  public Integer getSortOrder() {
    return sortOrder;
  }

  public void setSortOrder(Integer sortOrder) {
    this.sortOrder = sortOrder;
  }
}
