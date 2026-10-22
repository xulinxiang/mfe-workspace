package com.mfe.platform;

import com.mfe.platform.auth.JwtProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(JwtProperties.class)
public class MfePlatformApplication {

  public static void main(String[] args) {
    SpringApplication.run(MfePlatformApplication.class, args);
  }
}
