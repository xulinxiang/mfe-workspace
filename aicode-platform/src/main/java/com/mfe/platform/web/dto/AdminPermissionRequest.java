package com.mfe.platform.web.dto;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

public class AdminPermissionRequest {

  @NotBlank
  @Size(max = 128)
  private String code;

  @NotBlank
  @Size(max = 128)
  private String name;

  /** page | action */
  @NotBlank
  @Size(max = 16)
  private String resourceType;

  @Size(max = 128)
  private String parentCode;

  @Size(max = 32)
  private String subsystem;

  /** 页面权限：写入 / 更新 route_catalog.path */
  @Size(max = 255)
  private String path;

  /** 页面权限可选：侧栏 / 标准路由图标名（如 AppstoreOutlined） */
  @Size(max = 64)
  private String icon;

  public String getCode() {
    return code;
  }

  public void setCode(String code) {
    this.code = code;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getResourceType() {
    return resourceType;
  }

  public void setResourceType(String resourceType) {
    this.resourceType = resourceType;
  }

  public String getParentCode() {
    return parentCode;
  }

  public void setParentCode(String parentCode) {
    this.parentCode = parentCode;
  }

  public String getSubsystem() {
    return subsystem;
  }

  public void setSubsystem(String subsystem) {
    this.subsystem = subsystem;
  }

  public String getPath() {
    return path;
  }

  public void setPath(String path) {
    this.path = path;
  }

  public String getIcon() {
    return icon;
  }

  public void setIcon(String icon) {
    this.icon = icon;
  }
}
