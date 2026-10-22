package com.mfe.platform.web;

import com.mfe.platform.common.ApiResponse;
import com.mfe.platform.common.BusinessException;
import com.mfe.platform.domain.AppUserEntity;
import com.mfe.platform.rbac.RequirePermission;
import com.mfe.platform.repo.AppUserRepository;
import com.mfe.platform.tenant.TenantContext;
import com.mfe.platform.web.dto.UserProfileDto;
import com.mfe.platform.web.dto.UpdateProfileRequest;
import javax.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/user")
public class UserController {

  private final AppUserRepository userRepository;

  public UserController(AppUserRepository userRepository) {
    this.userRepository = userRepository;
  }

  @GetMapping("/profile")
  @RequirePermission("user:profile")
  public ApiResponse<UserProfileDto> profile() {
    return ApiResponse.ok(toDto(currentUser()));
  }

  @PutMapping("/profile")
  @RequirePermission("user:profile:update")
  public ApiResponse<UserProfileDto> updateProfile(
      @Valid @RequestBody UpdateProfileRequest request) {
    AppUserEntity user = currentUser();
    user.setName(request.getName().trim());
    user.setPhone(request.getPhone() == null ? null : request.getPhone().trim());
    return ApiResponse.ok(toDto(userRepository.save(user)));
  }

  private AppUserEntity currentUser() {
    Long userId = TenantContext.getUserId();
    Long tenantId = TenantContext.getTenantId();
    return userRepository
        .findByIdAndTenantId(userId, tenantId)
        .orElseThrow(() -> new BusinessException(404, "用户不存在"));
  }

  private UserProfileDto toDto(AppUserEntity user) {
    UserProfileDto dto = new UserProfileDto();
    dto.setName(user.getName());
    dto.setEmail(user.getEmail());
    dto.setRole(user.getRoleLabel());
    dto.setPhone(user.getPhone());
    return dto;
  }
}
