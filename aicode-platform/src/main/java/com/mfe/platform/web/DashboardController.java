package com.mfe.platform.web;

import com.mfe.platform.common.ApiResponse;
import com.mfe.platform.common.BusinessException;
import com.mfe.platform.domain.DashboardStatEntity;
import com.mfe.platform.rbac.RequirePermission;
import com.mfe.platform.repo.DashboardStatRepository;
import com.mfe.platform.tenant.TenantContext;
import com.mfe.platform.web.dto.DashboardStatsDto;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

  private final DashboardStatRepository dashboardStatRepository;

  public DashboardController(DashboardStatRepository dashboardStatRepository) {
    this.dashboardStatRepository = dashboardStatRepository;
  }

  @GetMapping("/stats")
  @RequirePermission("dashboard:view")
  public ApiResponse<DashboardStatsDto> stats() {
    Long tenantId = TenantContext.getTenantId();
    DashboardStatEntity stat =
        dashboardStatRepository
            .findByTenantId(tenantId)
            .orElseThrow(() -> new BusinessException(404, "工作台数据不存在"));

    DashboardStatsDto dto = new DashboardStatsDto();
    dto.setRemotes(stat.getRemotes());
    dto.setOrders(stat.getOrdersToday());
    dto.setPending(stat.getPending());
    dto.setUsers(stat.getActiveUsersLabel());
    return ApiResponse.ok(dto);
  }
}
