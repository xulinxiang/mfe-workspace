package com.mfe.platform.web.dto;

public class DashboardStatsDto {

  private int remotes;
  private int orders;
  private int pending;
  private String users;

  public int getRemotes() {
    return remotes;
  }

  public void setRemotes(int remotes) {
    this.remotes = remotes;
  }

  public int getOrders() {
    return orders;
  }

  public void setOrders(int orders) {
    this.orders = orders;
  }

  public int getPending() {
    return pending;
  }

  public void setPending(int pending) {
    this.pending = pending;
  }

  public String getUsers() {
    return users;
  }

  public void setUsers(String users) {
    this.users = users;
  }
}
