package com.mfe.platform.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mfe.platform.common.ApiResponse;
import com.mfe.platform.common.BusinessException;
import com.mfe.platform.rbac.RbacService;
import com.mfe.platform.tenant.TenantContext;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import java.io.IOException;
import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class AuthFilter extends OncePerRequestFilter {

  public static final String TENANT_HEADER = "X-Tenant-Id";

  private final JwtService jwtService;
  private final ObjectMapper objectMapper;
  private final RbacService rbacService;

  public AuthFilter(
      JwtService jwtService, ObjectMapper objectMapper, RbacService rbacService) {
    this.jwtService = jwtService;
    this.objectMapper = objectMapper;
    this.rbacService = rbacService;
  }

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    String path = request.getRequestURI();
    return path.startsWith("/api/auth/login") || path.equals("/api/health");
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {
    try {
      String auth = request.getHeader(HttpHeaders.AUTHORIZATION);
      if (auth == null || !auth.startsWith("Bearer ")) {
        writeError(response, 401, "未登录或 token 无效");
        return;
      }
      String token = auth.substring(7).trim();
      Claims claims;
      try {
        claims = jwtService.parse(token);
      } catch (JwtException ex) {
        writeError(response, 401, "未登录或 token 无效");
        return;
      }
      long userId = Long.parseLong(claims.getSubject());
      long tenantId = ((Number) claims.get("tenantId")).longValue();

      String headerTenant = request.getHeader(TENANT_HEADER);
      if (headerTenant != null && !headerTenant.isEmpty()) {
        long parsed;
        try {
          parsed = Long.parseLong(headerTenant.trim());
        } catch (NumberFormatException ex) {
          writeError(response, 400, "X-Tenant-Id 格式错误");
          return;
        }
        if (parsed != tenantId) {
          writeError(response, 403, "租户与 token 不一致");
          return;
        }
      }

      TenantContext.setUserId(userId);
      TenantContext.setTenantId(tenantId);
      rbacService.loadContext(userId, tenantId);
      filterChain.doFilter(request, response);
    } catch (BusinessException ex) {
      writeError(response, ex.getCode(), ex.getMessage());
    } finally {
      TenantContext.clear();
    }
  }

  private void writeError(HttpServletResponse response, int code, String message)
      throws IOException {
    response.setStatus(HttpServletResponse.SC_OK);
    response.setCharacterEncoding("UTF-8");
    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
    objectMapper.writeValue(response.getWriter(), ApiResponse.fail(code, message));
  }
}
