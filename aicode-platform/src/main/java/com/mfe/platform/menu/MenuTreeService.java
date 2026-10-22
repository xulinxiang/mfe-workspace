package com.mfe.platform.menu;

import com.mfe.platform.domain.MenuItemEntity;
import com.mfe.platform.domain.TenantEntity;
import com.mfe.platform.repo.MenuItemRepository;
import com.mfe.platform.repo.TenantRepository;
import com.mfe.platform.tenant.TenantContext;
import com.mfe.platform.web.dto.MenuNodeDto;
import com.mfe.platform.web.dto.MenusViewDto;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class MenuTreeService {

  private final MenuItemRepository menuItemRepository;
  private final TenantRepository tenantRepository;

  public MenuTreeService(
      MenuItemRepository menuItemRepository, TenantRepository tenantRepository) {
    this.menuItemRepository = menuItemRepository;
    this.tenantRepository = tenantRepository;
  }

  public MenusViewDto buildForCurrentUser() {
    Long tenantId = TenantContext.getTenantId();
    String layout =
        tenantRepository
            .findById(tenantId)
            .map(TenantEntity::getMenuLayout)
            .orElse("tree");
    List<MenuItemEntity> rows =
        menuItemRepository.findByTenantIdOrderBySortOrderAsc(tenantId).stream()
            .sorted(Comparator.comparing(MenuItemEntity::getSortOrder).thenComparing(MenuItemEntity::getId))
            .collect(Collectors.toList());
    List<MenuNodeDto> tree = buildTree(rows, true);
    stripIds(tree);
    MenusViewDto view = new MenusViewDto();
    view.setLayout(layout);
    view.setItems("flat".equalsIgnoreCase(layout) ? flattenRoutes(tree) : tree);
    return view;
  }

  public List<MenuNodeDto> buildAdminTree(Long tenantId) {
    List<MenuItemEntity> rows =
        menuItemRepository.findByTenantIdOrderBySortOrderAsc(tenantId).stream()
            .sorted(Comparator.comparing(MenuItemEntity::getSortOrder).thenComparing(MenuItemEntity::getId))
            .collect(Collectors.toList());
    return buildTree(rows, false);
  }

  private List<MenuNodeDto> buildTree(List<MenuItemEntity> rows, boolean filterByPermission) {
    Map<Long, MenuNodeDto> byId = new HashMap<>();
    for (MenuItemEntity row : rows) {
      MenuNodeDto dto = toDto(row, filterByPermission);
      if (dto == null) {
        continue;
      }
      byId.put(row.getId(), dto);
    }
    List<MenuNodeDto> roots = new ArrayList<>();
    for (MenuNodeDto node : byId.values()) {
      if (node.getParentId() == null) {
        roots.add(node);
        continue;
      }
      MenuNodeDto parent = byId.get(node.getParentId());
      if (parent == null) {
        roots.add(node);
      } else {
        parent.getChildren().add(node);
      }
    }
    sortTree(roots);
    if (!filterByPermission) {
      return roots;
    }
    return roots.stream()
        .map(this::pruneInvisible)
        .filter(Objects::nonNull)
        .collect(Collectors.toList());
  }

  private MenuNodeDto pruneInvisible(MenuNodeDto node) {
    if ("group".equals(node.getNodeType())) {
      List<MenuNodeDto> kept = new ArrayList<>();
      for (MenuNodeDto child : node.getChildren()) {
        MenuNodeDto pruned = pruneInvisible(child);
        if (pruned != null) {
          kept.add(pruned);
        }
      }
      node.setChildren(kept);
      return kept.isEmpty() ? null : node;
    }
    return node;
  }

  private MenuNodeDto toDto(MenuItemEntity entity, boolean filterByPermission) {
    if (filterByPermission
        && entity.getPermissionCode() != null
        && !TenantContext.hasPermission(entity.getPermissionCode())) {
      return null;
    }
    if (filterByPermission && "group".equals(entity.getNodeType())) {
      MenuNodeDto group = baseDto(entity);
      return group;
    }
    if (filterByPermission && !"group".equals(entity.getNodeType())) {
      MenuNodeDto route = baseDto(entity);
      route.setId(null);
      return route;
    }
    return baseDto(entity);
  }

  private MenuNodeDto baseDto(MenuItemEntity entity) {
    MenuNodeDto dto = new MenuNodeDto();
    dto.setId(entity.getId());
    dto.setKey(entity.getMenuKey());
    dto.setLabel(entity.getLabel());
    dto.setPath(entity.getPath());
    dto.setApp(entity.getAppName());
    dto.setIcon(entity.getIcon());
    dto.setPermission(entity.getPermissionCode());
    dto.setNodeType(entity.getNodeType() == null ? "route" : entity.getNodeType());
    dto.setParentId(entity.getParentId());
    dto.setRouteCatalogId(entity.getRouteCatalogId());
    dto.setSortOrder(entity.getSortOrder());
    return dto;
  }

  private void sortTree(List<MenuNodeDto> nodes) {
    nodes.sort(
        Comparator.comparing(MenuNodeDto::getSortOrder, Comparator.nullsLast(Integer::compareTo))
            .thenComparing(MenuNodeDto::getId, Comparator.nullsLast(Long::compareTo)));
    for (MenuNodeDto node : nodes) {
      sortTree(node.getChildren());
    }
  }

  private List<MenuNodeDto> flattenRoutes(List<MenuNodeDto> roots) {
    List<MenuNodeDto> flat = new ArrayList<>();
    walkFlat(roots, flat);
    return flat;
  }

  private void stripIds(List<MenuNodeDto> nodes) {
    for (MenuNodeDto node : nodes) {
      node.setId(null);
      node.setParentId(null);
      node.setRouteCatalogId(null);
      stripIds(node.getChildren());
    }
  }

  private void walkFlat(List<MenuNodeDto> nodes, List<MenuNodeDto> flat) {
    for (MenuNodeDto node : nodes) {
      if ("group".equals(node.getNodeType())) {
        walkFlat(node.getChildren(), flat);
      } else {
        MenuNodeDto copy = new MenuNodeDto();
        copy.setKey(node.getKey());
        copy.setLabel(node.getLabel());
        copy.setPath(node.getPath());
        copy.setApp(node.getApp());
        copy.setIcon(node.getIcon());
        copy.setPermission(node.getPermission());
        copy.setSortOrder(node.getSortOrder());
        copy.setNodeType("route");
        flat.add(copy);
      }
    }
  }
}
