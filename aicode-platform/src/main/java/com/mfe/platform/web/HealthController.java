package com.mfe.platform.web;

import com.mfe.platform.common.ApiResponse;
import java.util.Collections;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

  @GetMapping("/api/health")
  public ApiResponse<Map<String, String>> health() {
    return ApiResponse.ok(Collections.singletonMap("status", "up"));
  }
}
