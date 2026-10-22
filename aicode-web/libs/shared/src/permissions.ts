/**
 * 微前端权限声明（对齐 Host 集中 RBAC + 各 Remote 自声明 resource:action）
 * @see ARCHITECTURE.md § 微前端权限（国际通行做法）
 */

export type PermissionKind = 'page' | 'action'

/** 单条权限定义：code 即后端 permission.code，格式 resource:action */
export type PermissionDescriptor = {
  code: string
  name: string
  kind: PermissionKind
  /** action 时指向 page 权限 code */
  parentCode?: string
}

export type SubsystemPermissionManifest = {
  subsystem: string
  label: string
  permissions: PermissionDescriptor[]
}

export function permissionCode(resource: string, action: string) {
  return `${resource}:${action}`
}

/** 合并 Host + 各子系统 manifest，供文档与类型对照（运行时仍以 /api/auth/me 为准） */
export function mergePermissionManifests(
  ...manifests: SubsystemPermissionManifest[]
): SubsystemPermissionManifest[] {
  const bySubsystem = new Map<string, SubsystemPermissionManifest>()
  for (const manifest of manifests) {
    const existing = bySubsystem.get(manifest.subsystem)
    if (!existing) {
      bySubsystem.set(manifest.subsystem, {
        subsystem: manifest.subsystem,
        label: manifest.label,
        permissions: [...manifest.permissions],
      })
      continue
    }
    const codes = new Set(existing.permissions.map((p) => p.code))
    for (const p of manifest.permissions) {
      if (!codes.has(p.code)) existing.permissions.push(p)
    }
  }
  return [...bySubsystem.values()]
}
