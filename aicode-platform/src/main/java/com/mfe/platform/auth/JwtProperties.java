package com.mfe.platform.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "mfe.jwt")
public class JwtProperties {

  /** 与 application.yml 默认一致；避免未加载配置或空环境变量导致 NPE */
  private String secret = "mfe-demo-jwt-secret-change-in-production-32chars";
  private int expireHours = 72;

  public String getSecret() {
    if (secret == null || secret.trim().isEmpty()) {
      return "mfe-demo-jwt-secret-change-in-production-32chars";
    }
    return secret.trim();
  }

  public void setSecret(String secret) {
    this.secret = secret;
  }

  public int getExpireHours() {
    return expireHours;
  }

  public void setExpireHours(int expireHours) {
    this.expireHours = expireHours;
  }
}
