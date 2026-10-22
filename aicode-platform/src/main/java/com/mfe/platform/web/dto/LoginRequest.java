package com.mfe.platform.web.dto;

import javax.validation.constraints.NotBlank;

public class LoginRequest {

  private String tenantCode;

  @NotBlank(message = "账号不能为空")
  private String email;

  @NotBlank(message = "密码不能为空")
  private String password;

  public String getTenantCode() {
    return tenantCode;
  }

  public void setTenantCode(String tenantCode) {
    this.tenantCode = tenantCode;
  }

  public String getEmail() {
    return email;
  }

  public void setEmail(String email) {
    this.email = email;
  }

  public String getPassword() {
    return password;
  }

  public void setPassword(String password) {
    this.password = password;
  }
}
