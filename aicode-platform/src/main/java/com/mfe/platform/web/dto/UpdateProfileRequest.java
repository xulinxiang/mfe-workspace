package com.mfe.platform.web.dto;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

public class UpdateProfileRequest {

  @NotBlank
  @Size(max = 64)
  private String name;

  @Size(max = 32)
  private String phone;

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
