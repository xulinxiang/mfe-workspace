package com.mfe.platform.web.dto;

import java.util.ArrayList;
import java.util.List;
import javax.validation.constraints.NotNull;

public class IdsRequest {

  @NotNull private List<Long> ids = new ArrayList<>();

  public List<Long> getIds() {
    return ids;
  }

  public void setIds(List<Long> ids) {
    this.ids = ids;
  }
}
