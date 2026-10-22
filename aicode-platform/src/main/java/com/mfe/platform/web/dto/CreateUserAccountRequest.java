package com.mfe.platform.web.dto;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

public class CreateUserAccountRequest {

  @NotBlank
  @Size(max = 128)
  private String email;

  @NotBlank
  @Size(min = 6, max = 64)
  private String password;

  @NotBlank
  @Size(max = 64)
  private String name;

  @Size(max = 32)
  private String phone;

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

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getPhone() {
    return phone;
  }

  public void setPhone(String phone) {
    this.phone = phone;
  }
}
