package com.mfe.platform.web;

import com.mfe.platform.auth.JwtService;
import com.mfe.platform.common.ApiResponse;
import com.mfe.platform.common.BusinessException;
import com.mfe.platform.domain.AppUserEntity;
import com.mfe.platform.domain.TenantEntity;
import com.mfe.platform.repo.AppUserRepository;
import com.mfe.platform.repo.TenantRepository;
import com.mfe.platform.tenant.TenantContext;
import com.mfe.platform.web.dto.LoginRequest;
import com.mfe.platform.web.dto.LoginResponse;
import com.mfe.platform.web.dto.MeResponseDto;
import javax.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final AppUserRepository userRepository;
  private final TenantRepository tenantRepository;
  private final JwtService jwtService;
  private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

  public AuthController(
      AppUserRepository userRepository,
      TenantRepository tenantRepository,
      JwtService jwtService) {
    this.userRepository = userRepository;
    this.tenantRepository = tenantRepository;
    this.jwtService = jwtService;
  }

  @PostMapping("/login")
  public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
    TenantEntity tenant =
        tenantRepository
            .findByCode(request.getTenantCode().trim().toLowerCase())
            .orElseThrow(() -> new BusinessException(401, "租户、邮箱或密码错误"));

    AppUserEntity user =
        userRepository
            .findByTenantIdAndEmail(
                tenant.getId(), request.getEmail().trim().toLowerCase())
            .orElseThrow(() -> new BusinessException(401, "租户、邮箱或密码错误"));

    if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
      throw new BusinessException(401, "租户、邮箱或密码错误");
    }

    String token = jwtService.createToken(user.getId(), tenant.getId(), user.getEmail());

    LoginResponse data = new LoginResponse();
    data.setToken(token);
    data.setTenantId(tenant.getId());
    data.setTenantName(tenant.getName());
    data.setTenantCode(tenant.getCode());
    data.setUserId(user.getId());
    data.setEmail(user.getEmail());
    data.setName(user.getName());
    return ApiResponse.ok(data);
  }

  @GetMapping("/me")
  public ApiResponse<MeResponseDto> me() {
    Long userId = TenantContext.getUserId();
    Long tenantId = TenantContext.getTenantId();
    AppUserEntity user =
        userRepository
            .findByIdAndTenantId(userId, tenantId)
            .orElseThrow(() -> new BusinessException(404, "用户不存在"));
    TenantEntity tenant =
        tenantRepository
            .findById(tenantId)
            .orElseThrow(() -> new BusinessException(404, "租户不存在"));

    MeResponseDto data = new MeResponseDto();
    data.setUserId(user.getId());
    data.setEmail(user.getEmail());
    data.setName(user.getName());
    data.setTenantId(tenant.getId());
    data.setTenantCode(tenant.getCode());
    data.setTenantName(tenant.getName());
    data.setRoles(TenantContext.getRoles());
    data.setPermissions(TenantContext.getPermissions());
    return ApiResponse.ok(data);
  }
}
