package com.mfe.platform.web.dto;

import java.util.ArrayList;
import java.util.List;
import javax.validation.constraints.NotEmpty;

public class ReorderRequest {

  private Long parentId;

  @NotEmpty private List<Long> orderedIds = new ArrayList<Long>();

  public Long getParentId() {
    return parentId;
  }

  public void setParentId(Long parentId) {
    this.parentId = parentId;
  }

  public List<Long> getOrderedIds() {
    return orderedIds;
  }

  public void setOrderedIds(List<Long> orderedIds) {
    this.orderedIds = orderedIds;
  }
}
