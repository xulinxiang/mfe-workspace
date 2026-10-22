package com.mfe.platform.rbac;

import com.mfe.platform.common.BusinessException;
import com.mfe.platform.tenant.TenantContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class PermissionInterceptor implements HandlerInterceptor {

  @Override
  public boolean preHandle(
      HttpServletRequest request, HttpServletResponse response, Object handler) {
    if (!(handler instanceof HandlerMethod)) {
      return true;
    }

    HandlerMethod method = (HandlerMethod) handler;

    RequireAnyPermission any = method.getMethodAnnotation(RequireAnyPermission.class);
    if (any == null) {
      any = method.getBeanType().getAnnotation(RequireAnyPermission.class);
    }
    if (any != null) {
      if (!TenantContext.hasAnyPermission(any.value())) {
        throw new BusinessException(403, "无权限执行此操作");
      }
      return true;
    }

    RequirePermission required = method.getMethodAnnotation(RequirePermission.class);
    if (required == null) {
      required = method.getBeanType().getAnnotation(RequirePermission.class);
    }
    if (required == null) {
      return true;
    }

    if (!TenantContext.hasPermission(required.value())) {
      throw new BusinessException(403, "无权限执行此操作");
    }
    return true;
  }
}
