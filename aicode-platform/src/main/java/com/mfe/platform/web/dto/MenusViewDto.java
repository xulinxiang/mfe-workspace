package com.mfe.platform.web.dto;

import java.util.ArrayList;
import java.util.List;

public class MenusViewDto {

  private String layout;
  private List<MenuNodeDto> items = new ArrayList<>();

  public String getLayout() {
    return layout;
  }

  public void setLayout(String layout) {
    this.layout = layout;
  }

  public List<MenuNodeDto> getItems() {
    return items;
  }

  public void setItems(List<MenuNodeDto> items) {
    this.items = items;
  }
}
