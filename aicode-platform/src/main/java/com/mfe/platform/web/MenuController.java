package com.mfe.platform.web;

import com.mfe.platform.common.ApiResponse;
import com.mfe.platform.menu.MenuTreeService;
import com.mfe.platform.web.dto.MenusViewDto;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/menus")
public class MenuController {

  private final MenuTreeService menuTreeService;

  public MenuController(MenuTreeService menuTreeService) {
    this.menuTreeService = menuTreeService;
  }

  @GetMapping
  public ApiResponse<MenusViewDto> list() {
    return ApiResponse.ok(menuTreeService.buildForCurrentUser());
  }
}
