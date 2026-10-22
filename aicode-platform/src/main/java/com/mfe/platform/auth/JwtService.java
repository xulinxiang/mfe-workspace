package com.mfe.platform.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

  private final JwtProperties properties;
  private final SecretKey key;

  public JwtService(JwtProperties properties) {
    this.properties = properties;
    String secret = properties.getSecret();
    if (secret == null || secret.isEmpty()) {
      throw new IllegalStateException("mfe.jwt.secret 未配置，请检查 application.yml 或环境变量 MFE_JWT_SECRET");
    }
    byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
    if (bytes.length < 32) {
      throw new IllegalStateException("mfe.jwt.secret 至少 32 字符");
    }
    this.key = Keys.hmacShaKeyFor(bytes);
  }

  public String createToken(long userId, long tenantId, String email) {
    long now = System.currentTimeMillis();
    long expireMs = properties.getExpireHours() * 3600L * 1000L;
    return Jwts.builder()
        .setSubject(String.valueOf(userId))
        .claim("tenantId", tenantId)
        .claim("email", email)
        .setIssuedAt(new Date(now))
        .setExpiration(new Date(now + expireMs))
        .signWith(key, SignatureAlgorithm.HS256)
        .compact();
  }

  public Claims parse(String token) {
    return Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token).getBody();
  }
}
