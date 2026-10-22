package com.mfe.platform.config;

import com.mfe.platform.auth.AuthFilter;
import com.mfe.platform.rbac.PermissionInterceptor;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

  private final CorsProperties corsProperties;
  private final PermissionInterceptor permissionInterceptor;

  public WebConfig(
      CorsProperties corsProperties, PermissionInterceptor permissionInterceptor) {
    this.corsProperties = corsProperties;
    this.permissionInterceptor = permissionInterceptor;
  }

  @Bean
  public FilterRegistrationBean<AuthFilter> authFilterRegistration(AuthFilter authFilter) {
    FilterRegistrationBean<AuthFilter> bean = new FilterRegistrationBean<>();
    bean.setFilter(authFilter);
    bean.addUrlPatterns("/api/*");
    bean.setOrder(1);
    return bean;
  }

  @Override
  public void addCorsMappings(CorsRegistry registry) {
    registry
        .addMapping("/api/**")
        .allowedOrigins(corsProperties.getAllowedOrigins())
        .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
        .allowedHeaders("*")
        .allowCredentials(true)
        .maxAge(3600);
  }

  @Override
  public void addInterceptors(InterceptorRegistry registry) {
    registry.addInterceptor(permissionInterceptor).addPathPatterns("/api/**");
  }

  @Component
  @ConfigurationProperties(prefix = "mfe.cors")
  public static class CorsProperties {

    private String[] allowedOrigins = new String[] {"http://localhost:5000"};

    public String[] getAllowedOrigins() {
      return allowedOrigins;
    }

    public void setAllowedOrigins(String[] allowedOrigins) {
      this.allowedOrigins = allowedOrigins;
    }
  }
}
