package com.mfe.platform.config;

import com.mfe.platform.domain.AppUserEntity;
import com.mfe.platform.repo.AppUserRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

/** 确保演示账号密码为 demo123（与 README 一致）。 */
@Component
public class DemoDataInitializer implements ApplicationRunner {

  private static final String DEMO_EMAIL = "demo@company.com";
  private static final String DEMO_PASSWORD = "demo123";

  private final AppUserRepository userRepository;
  private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

  public DemoDataInitializer(AppUserRepository userRepository) {
    this.userRepository = userRepository;
  }

  @Override
  public void run(ApplicationArguments args) {
    userRepository
        .findByEmail(DEMO_EMAIL)
        .ifPresent(
            user -> {
              if (!passwordEncoder.matches(DEMO_PASSWORD, user.getPasswordHash())) {
                user.setPasswordHash(passwordEncoder.encode(DEMO_PASSWORD));
                userRepository.save(user);
              }
            });
  }
}
