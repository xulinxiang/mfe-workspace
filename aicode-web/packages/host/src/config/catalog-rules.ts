/** 权限目录：子系统前缀由当前子系统带入，用户只填后半段。 */

const HOST_LEGACY_PREFIXES = ['host:', 'admin:', 'dashboard:'] as const

export type SubsystemMount = {
  code: string
  /** Host 匹配并交给该应用的 URL 前缀；host 为空表示任意非远程前缀 */
  pathPrefix: string
  exampleRest: string
  examplePathRest: string
  routerHint: string
}

export const SUBSYSTEM_MOUNTS: Record<string, SubsystemMount> = {
  host: {
    code: 'host',
    pathPrefix: '',
    exampleRest: 'assets:view',
    examplePathRest: 'admin/assets',
    routerHint: 'Host `route-registry.ts` 注册页面组件',
  },
  product: {
    code: 'product',
    pathPrefix: '/product',
    exampleRest: 'shop:list',
    examplePathRest: 'shop',
    routerHint: '商品子应用 `packages/product/src/router`',
  },
  user: {
    code: 'user',
    pathPrefix: '/user',
    exampleRest: 'shop:list',
    examplePathRest: 'profile',
    routerHint: '用户子应用 `packages/user/src/router`',
  },
}

export function mountOf(subsystem: string): SubsystemMount {
  return (
    SUBSYSTEM_MOUNTS[subsystem] ?? {
      code: subsystem,
      pathPrefix: `/${subsystem}`,
      exampleRest: 'resource:view',
      examplePathRest: 'page',
      routerHint: `${subsystem} 子应用路由`,
    }
  )
}

export function codePrefixOf(subsystem: string, existingCode?: string) {
  if (existingCode) {
    const match = `${subsystem}:`
    if (existingCode.startsWith(match)) return match
    if (subsystem === 'host') {
      const legacy = HOST_LEGACY_PREFIXES.find((prefix) => existingCode.startsWith(prefix))
      if (legacy) return legacy
    }
  }
  return `${subsystem}:`
}

export function pathPrefixOf(subsystem: string) {
  const mount = mountOf(subsystem)
  return mount.pathPrefix ? `${mount.pathPrefix}/` : '/'
}

export function splitPageCode(code: string, subsystem: string) {
  const prefix = codePrefixOf(subsystem, code)
  return {
    prefix,
    rest: code.startsWith(prefix) ? code.slice(prefix.length) : code,
  }
}

export function composePageCode(prefix: string, rest: string) {
  let suffix = rest.trim().replace(/^:+/, '')
  if (suffix.startsWith(prefix)) suffix = suffix.slice(prefix.length)
  return `${prefix}${suffix}`
}

export function pageCodeRestError(rest: string): string | null {
  const suffix = rest.trim().replace(/^:+/, '')
  if (!suffix) return '填写资源:操作，例如 shop:list'
  if (suffix.endsWith(':')) return '不要以冒号结尾'
  if (suffix.includes('/')) return '权限码不要写成路径'
  return null
}

export function splitPagePath(path: string, subsystem: string) {
  const prefix = pathPrefixOf(subsystem)
  const mountRoot = mountOf(subsystem).pathPrefix
  if (mountRoot && path === mountRoot) return { prefix, rest: '' }
  if (path.startsWith(prefix)) return { prefix, rest: path.slice(prefix.length) }
  return { prefix, rest: path.replace(/^\//, '') }
}

export function composePagePath(subsystem: string, rest: string) {
  const prefix = pathPrefixOf(subsystem)
  const mountRoot = mountOf(subsystem).pathPrefix
  let suffix = rest.trim().replace(/^\/+/, '')
  if (mountRoot) {
    const bare = mountRoot.replace(/^\//, '')
    if (suffix === bare) return mountRoot
    if (suffix.startsWith(`${bare}/`)) suffix = suffix.slice(bare.length + 1)
  }
  if (!suffix) return mountRoot || '/'
  return `${prefix}${suffix}`
}

export function pagePathRestError(rest: string, subsystem: string): string | null {
  const full = composePagePath(subsystem, rest)
  if (subsystem === 'host') {
    if (
      full === '/product' ||
      full.startsWith('/product/') ||
      full === '/user' ||
      full.startsWith('/user/')
    ) {
      return '主应用不能占用 /product 或 /user'
    }
  }
  return null
}

export function splitActionCode(code: string, parentCode: string) {
  const prefix = `${parentCode}:`
  return code.startsWith(prefix) ? code.slice(prefix.length) : code
}

export function composeActionCode(parentCode: string, rest: string) {
  let suffix = rest.trim().replace(/^:+/, '')
  const prefix = `${parentCode}:`
  if (suffix.startsWith(prefix)) suffix = suffix.slice(prefix.length)
  return `${prefix}${suffix}`
}

export function actionCodeRestError(rest: string): string | null {
  const suffix = rest.trim().replace(/^:+/, '')
  if (!suffix) return '填写操作名，例如 create'
  if (suffix.endsWith(':') || suffix.includes('/')) return '只填操作名，例如 create'
  return null
}
