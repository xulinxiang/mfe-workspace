package com.mfe.platform.domain;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;

@Entity
@Table(name = "dashboard_stat")
public class DashboardStatEntity {

  @Id
  private Long id;

  @Column(name = "tenant_id", nullable = false, unique = true)
  private Long tenantId;

  @Column(nullable = false)
  private Integer remotes;

  @Column(name = "orders_today", nullable = false)
  private Integer ordersToday;

  @Column(nullable = false)
  private Integer pending;

  @Column(name = "active_users_label", nullable = false, length = 32)
  private String activeUsersLabel;

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public Long getTenantId() {
    return tenantId;
  }

  public void setTenantId(Long tenantId) {
    this.tenantId = tenantId;
  }

  public Integer getRemotes() {
    return remotes;
  }

  public void setRemotes(Integer remotes) {
    this.remotes = remotes;
  }

  public Integer getOrdersToday() {
    return ordersToday;
  }

  public void setOrdersToday(Integer ordersToday) {
    this.ordersToday = ordersToday;
  }

  public Integer getPending() {
    return pending;
  }

  public void setPending(Integer pending) {
    this.pending = pending;
  }

  public String getActiveUsersLabel() {
    return activeUsersLabel;
  }

  public void setActiveUsersLabel(String activeUsersLabel) {
    this.activeUsersLabel = activeUsersLabel;
  }
}
