package com.mfe.platform.web;

import com.mfe.platform.common.ApiResponse;
import com.mfe.platform.common.BusinessException;
import com.mfe.platform.domain.AppUserEntity;
import com.mfe.platform.rbac.RequirePermission;
import com.mfe.platform.repo.AppUserRepository;
import com.mfe.platform.tenant.TenantContext;
import com.mfe.platform.web.dto.CreateUserAccountRequest;
import com.mfe.platform.web.dto.UpdateProfileRequest;
import com.mfe.platform.web.dto.UpdateUserAccountRequest;
import com.mfe.platform.web.dto.UserAccountDto;
import com.mfe.platform.web.dto.UserProfileDto;
import java.util.List;
import java.util.stream.Collectors;
import javax.validation.Valid;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/user")
public class UserController {

  private final AppUserRepository userRepository;
  private final JdbcTemplate jdbc;
  private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

  public UserController(AppUserRepository userRepository, JdbcTemplate jdbc) {
    this.userRepository = userRepository;
    this.jdbc = jdbc;
  }

  @GetMapping("/profile")
  @RequirePermission("user:profile")
  public ApiResponse<UserProfileDto> profile() {
    return ApiResponse.ok(toProfile(currentUser()));
  }

  @PutMapping("/profile")
  @RequirePermission("user:profile:update")
  public ApiResponse<UserProfileDto> updateProfile(
      @Valid @RequestBody UpdateProfileRequest request) {
    AppUserEntity user = currentUser();
    user.setName(request.getName().trim());
    user.setPhone(blankToNull(request.getPhone()));
    return ApiResponse.ok(toProfile(userRepository.save(user)));
  }

  @GetMapping("/accounts")
  @RequirePermission("user:list")
  public ApiResponse<List<UserAccountDto>> listAccounts() {
    return ApiResponse.ok(
        userRepository.findByTenantIdOrderByIdAsc(TenantContext.getTenantId()).stream()
            .map(this::toAccount)
            .collect(Collectors.toList()));
  }

  @PostMapping("/accounts")
  @Transactional
  @RequirePermission("user:list:create")
  public ApiResponse<UserAccountDto> createAccount(
      @Valid @RequestBody CreateUserAccountRequest request) {
    Long tenantId = TenantContext.getTenantId();
    String email = request.getEmail().trim().toLowerCase();
    if (userRepository.findByTenantIdAndEmail(tenantId, email).isPresent()) {
      throw new BusinessException(409, "该租户下账号已存在");
    }
    AppUserEntity user = new AppUserEntity();
    user.setTenantId(tenantId);
    user.setEmail(email);
    user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
    user.setName(request.getName().trim());
    user.setPhone(blankToNull(request.getPhone()));
    Long viewerId = viewerRoleId(tenantId);
    user.setRoleLabel(viewerId == null ? "成员" : "只读");
    AppUserEntity saved = userRepository.save(user);
    if (viewerId != null) {
      jdbc.update("INSERT INTO user_role(user_id,role_id) VALUES(?,?)", saved.getId(), viewerId);
    }
    return ApiResponse.ok(toAccount(saved));
  }

  @PutMapping("/accounts/{id}")
  @RequirePermission("user:list:update")
  public ApiResponse<UserAccountDto> updateAccount(
      @PathVariable("id") Long id, @Valid @RequestBody UpdateUserAccountRequest request) {
    AppUserEntity user = requireAccount(id);
    String email = request.getEmail().trim().toLowerCase();
    userRepository
        .findByTenantIdAndEmail(user.getTenantId(), email)
        .ifPresent(
            existing -> {
              if (!existing.getId().equals(user.getId())) {
                throw new BusinessException(409, "该租户下账号已存在");
              }
            });
    user.setEmail(email);
    user.setName(request.getName().trim());
    user.setPhone(blankToNull(request.getPhone()));
    if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
      user.setPasswordHash(passwordEncoder.encode(request.getPassword().trim()));
    }
    return ApiResponse.ok(toAccount(userRepository.save(user)));
  }

  @DeleteMapping("/accounts/{id}")
  @Transactional
  @RequirePermission("user:list:delete")
  public ApiResponse<Void> deleteAccount(@PathVariable("id") Long id) {
    AppUserEntity user = requireAccount(id);
    if (user.getId().equals(TenantContext.getUserId())) {
      throw new BusinessException(400, "不能删除当前登录账号");
    }
    jdbc.update("DELETE FROM user_role WHERE user_id=?", user.getId());
    userRepository.delete(user);
    return ApiResponse.ok(null);
  }

  private AppUserEntity currentUser() {
    return userRepository
        .findByIdAndTenantId(TenantContext.getUserId(), TenantContext.getTenantId())
        .orElseThrow(() -> new BusinessException(404, "用户不存在"));
  }

  private AppUserEntity requireAccount(Long id) {
    return userRepository
        .findByIdAndTenantId(id, TenantContext.getTenantId())
        .orElseThrow(() -> new BusinessException(404, "用户不存在"));
  }

  private Long viewerRoleId(Long tenantId) {
    List<Long> ids =
        jdbc.query(
            "SELECT id FROM role WHERE tenant_id=? AND code='viewer' LIMIT 1",
            (rs, rowNum) -> rs.getLong("id"),
            tenantId);
    return ids.isEmpty() ? null : ids.get(0);
  }

  private UserProfileDto toProfile(AppUserEntity user) {
    UserProfileDto dto = new UserProfileDto();
    dto.setName(user.getName());
    dto.setEmail(user.getEmail());
    dto.setRole(user.getRoleLabel());
    dto.setPhone(user.getPhone());
    return dto;
  }

  private UserAccountDto toAccount(AppUserEntity user) {
    UserAccountDto dto = new UserAccountDto();
    dto.setId(user.getId());
    dto.setName(user.getName());
    dto.setEmail(user.getEmail());
    dto.setPhone(user.getPhone());
    dto.setRoleLabel(user.getRoleLabel());
    return dto;
  }

  private String blankToNull(String value) {
    if (value == null) return null;
    String trimmed = value.trim();
    return trimmed.isEmpty() ? null : trimmed;
  }
}
