import { useAuth } from '@/context/AuthContext'
import { useMenus } from '@/context/MenuContext'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchDashboardStats, type DashboardStats } from '@/api/dashboard'
import type { MenuNode } from '@/types/menu'
import { flattenMenuRoutes } from '@/utils/menu-tree'
import styles from './index.module.scss'

type DayPoint = { label: string; value: number; today?: boolean }

function buildWeekTrend(ordersToday: number): DayPoint[] {
  const today = Math.max(ordersToday, 1)
  const labels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  const ratios = [0.72, 0.81, 0.88, 0.93, 0.97, 0.85, 1]
  return labels.map((label, i) => ({
    label,
    value: Math.max(1, Math.round(today * ratios[i])),
    today: i === labels.length - 1,
  }))
}

function buildTrendPaths(points: DayPoint[], w: number, h: number, pad: number) {
  if (!points.length) return { area: '', line: '', dots: [] as { x: number; y: number; today?: boolean }[] }
  const max = Math.max(...points.map((p) => p.value), 1)
  const step = (w - pad * 2) / Math.max(points.length - 1, 1)
  const coords = points.map((p, i) => ({
    x: pad + i * step,
    y: h - pad - (p.value / max) * (h - pad * 2),
    today: p.today,
  }))
  const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ')
  const base = h - pad
  const area = `${line} L${coords[coords.length - 1].x.toFixed(1)},${base} L${coords[0].x.toFixed(1)},${base} Z`
  return { area, line, dots: coords }
}

const SHORTCUTS = [
  { to: '/product', label: '商品列表', tag: 'product', mark: '商' },
  { to: '/product/category', label: '商品分类', tag: 'product', mark: '类' },
  { to: '/user', label: '用户列表', tag: 'user', mark: '用' },
  { to: '/admin/members', label: '租户成员', tag: 'host', mark: '员' },
  { to: '/admin/roles', label: '权限矩阵', tag: 'host', mark: '权' },
  { to: '/admin/permissions', label: '菜单管理', tag: 'host', mark: '单' },
] as const

const SUBSYSTEMS = [
  {
    key: 'product',
    name: '商品子系统',
    port: '5001',
    to: '/product',
    mark: '商',
    blurb: 'SKU、分类与详情页',
  },
  {
    key: 'user',
    name: '用户子系统',
    port: '5002',
    to: '/user',
    mark: '用',
    blurb: '账号列表与个人资料',
  },
] as const

function routesForApp(menus: MenuNode[], app: string) {
  return flattenMenuRoutes(menus).filter((n) => n.app === app && n.path && n.path !== '#')
}

export default function Dashboard() {
  const { session } = useAuth()
  const { menus } = useMenus()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchDashboardStats()
      .then((data) => {
        if (!cancelled) setStats(data)
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message || '加载失败')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const orders = stats?.orders ?? 0
  const pending = stats?.pending ?? 0
  const remotes = stats?.remotes ?? 0
  const usersLabel = stats?.users ?? '—'
  const done = Math.max(orders - pending, 0)
  const donePct = orders > 0 ? Math.round((done / orders) * 100) : 0
  const pendingPct = orders > 0 ? Math.round((pending / orders) * 100) : 0

  const accessibleRoutes = useMemo(
    () => flattenMenuRoutes(menus).filter((n) => n.path && n.path !== '#').length,
    [menus],
  )
  const permCount = session?.permissions.length ?? 0
  const roleLabel = session?.roles?.[0]

  const trend = useMemo(() => buildWeekTrend(orders), [orders])
  const paths = useMemo(() => buildTrendPaths(trend, 440, 120, 14), [trend])
  const weekTotal = trend.reduce((s, p) => s + p.value, 0)
  const weekAvg = trend.length ? Math.round(weekTotal / trend.length) : 0
  const yesterdayOrders = trend.length >= 2 ? trend[trend.length - 2].value : 0
  const dayDelta =
    !loading && yesterdayOrders > 0 ? Math.round(((orders - yesterdayOrders) / yesterdayOrders) * 100) : null

  const todayRing = useMemo(() => {
    const radius = 36
    const circumference = 2 * Math.PI * radius
    const progress = loading ? 0 : donePct / 100
    return {
      radius,
      circumference,
      offset: circumference * (1 - progress),
    }
  }, [donePct, loading])

  const routesByApp = useMemo(
    () => ({
      product: routesForApp(menus, 'product'),
      user: routesForApp(menus, 'user'),
    }),
    [menus],
  )
  const remoteMenuTotal = routesByApp.product.length + routesByApp.user.length

  const dateShort = new Date().toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })

  const metrics = [
    { label: '今日订单', value: loading ? '—' : String(orders), note: '租户汇总' },
    { label: '待处理', value: loading ? '—' : String(pending), note: '需跟进', warn: pending > 0 },
    { label: '子应用', value: loading ? '—' : String(remotes), note: 'product / user' },
    { label: '活跃用户', value: loading ? '—' : usersLabel, note: '近 7 日' },
  ]

  const actions = [
    pending > 0
      ? { to: '/product', label: '处理待办单据', hint: `${pending} 笔待跟进` }
      : { to: '/product', label: '查看商品列表', hint: '维护 SKU 与库存' },
    { to: '/admin/members', label: '租户成员与角色', hint: '分配账号权限' },
    { to: '/admin/roles', label: '权限矩阵', hint: '核对角色授权' },
    { to: '/admin/permissions', label: '菜单与按钮', hint: '目录与按钮权限' },
  ]

  return (
    <section className={styles.page}>
      <div className={styles.board}>
        <header className={styles.boardHead}>
          <div>
            <p className={styles.eyebrow}>{session?.tenantName ?? '当前租户'}</p>
            <h1>工作台</h1>
          </div>
          <time className={styles.date}>{dateShort}</time>
        </header>

        {error ? <p className={styles.errorBanner}>{error}</p> : null}

        <div className={styles.metricStrip}>
          {metrics.map((m) => (
            <div key={m.label} className={styles.metric}>
              <span className={styles.metricLabel}>{m.label}</span>
              <strong className={m.warn ? styles.metricValueWarn : undefined}>{m.value}</strong>
              <span className={styles.metricNote}>{m.note}</span>
            </div>
          ))}
        </div>

        <div className={styles.split}>
          <div className={styles.featureGrid}>
            <article className={styles.tile}>
              <div className={styles.tileHead}>
                <h2>订单趋势</h2>
                <span>7 日 {loading ? '—' : weekTotal} 笔 · 日均 {loading ? '—' : weekAvg}</span>
              </div>
              <div className={styles.chartCompact}>
                <svg viewBox="0 0 440 120" className={styles.chartSvg} role="img" aria-label="近7日订单趋势">
                  <defs>
                    <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1677ff" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#1677ff" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {[0.5, 1].map((r) => (
                    <line
                      key={r}
                      x1={14}
                      x2={426}
                      y1={14 + (120 - 28) * (1 - r)}
                      y2={14 + (120 - 28) * (1 - r)}
                      className={styles.gridLine}
                    />
                  ))}
                  <path d={paths.area} fill="url(#trendFill)" />
                  <path d={paths.line} fill="none" className={styles.trendLine} />
                  {paths.dots.map((dot, i) => (
                    <circle
                      key={i}
                      cx={dot.x}
                      cy={dot.y}
                      r={dot.today ? 4 : 3}
                      className={dot.today ? styles.dotToday : styles.dot}
                    />
                  ))}
                </svg>
                <div className={styles.axisLabels}>
                  {trend.map((d) => (
                    <span key={d.label} className={d.today ? styles.axisToday : undefined}>
                      {d.label}
                    </span>
                  ))}
                </div>
              </div>
            </article>

            <article className={`${styles.tile} ${styles.tileToday}`}>
              <div className={styles.todayHead}>
                <h2>今日处理</h2>
                {dayDelta !== null ? (
                  <span className={dayDelta >= 0 ? styles.todayDeltaUp : styles.todayDeltaDown}>
                    较昨日 {dayDelta >= 0 ? '+' : ''}
                    {dayDelta}%
                  </span>
                ) : (
                  <span className={styles.todayDeltaMuted}>实时汇总</span>
                )}
              </div>
              <div className={styles.todayBody}>
                <div className={styles.todayRing} aria-hidden={loading}>
                  <svg viewBox="0 0 88 88" className={styles.todayRingSvg}>
                    <circle cx="44" cy="44" r={todayRing.radius} className={styles.ringTrack} />
                    <circle
                      cx="44"
                      cy="44"
                      r={todayRing.radius}
                      className={styles.ringProgress}
                      strokeDasharray={todayRing.circumference}
                      strokeDashoffset={todayRing.offset}
                      transform="rotate(-90 44 44)"
                    />
                  </svg>
                  <div className={styles.todayRingCenter}>
                    <strong>{loading ? '—' : `${donePct}%`}</strong>
                    <span>完成率</span>
                  </div>
                </div>
                <div className={styles.todayStats}>
                  <div className={styles.todayTotal}>
                    <span>今日订单</span>
                    <strong>{loading ? '—' : orders}</strong>
                  </div>
                  <div className={styles.todaySplitBar}>
                    <div
                      className={styles.todaySplitDone}
                      style={{ flex: loading ? 0 : donePct }}
                    />
                    <div
                      className={styles.todaySplitPending}
                      style={{ flex: loading ? 0 : Math.max(pendingPct, pending > 0 ? 4 : 0) }}
                    />
                  </div>
                  <ul className={styles.todayLegend}>
                    <li>
                      <i className={styles.legendDone} aria-hidden />
                      <span>已完成</span>
                      <b>{loading ? '—' : done}</b>
                    </li>
                    <li>
                      <i className={styles.legendPending} aria-hidden />
                      <span>待处理</span>
                      <b>{loading ? '—' : pending}</b>
                    </li>
                  </ul>
                  {pending > 0 && !loading ? (
                    <Link to="/product" className={styles.todayCta}>
                      处理 {pending} 笔待办
                    </Link>
                  ) : null}
                </div>
              </div>
            </article>

            <article className={`${styles.tile} ${styles.tileSys}`}>
              <div className={styles.tileHead}>
                <h2>子系统</h2>
                <span>
                  已接入 {loading ? '—' : remotes} · 远程菜单 {remoteMenuTotal || '—'} 项
                </span>
              </div>
              <div className={styles.sysGrid}>
                {SUBSYSTEMS.map((sys) => {
                  const routes = routesByApp[sys.key]
                  const quick = routes.slice(0, 3)
                  return (
                    <div key={sys.key} className={styles.sysCard}>
                      <Link to={sys.to} className={styles.sysCardMain}>
                        <span className={styles.sysBadge}>{sys.mark}</span>
                        <div className={styles.sysCardBody}>
                          <div className={styles.sysCardTitle}>
                            <strong>{sys.name}</strong>
                            <span className={styles.sysPill}>运行中</span>
                          </div>
                          <p className={styles.sysBlurb}>{sys.blurb}</p>
                          <div className={styles.sysMeta}>
                            <span>本地 :{sys.port}</span>
                            <span>{routes.length ? `${routes.length} 个入口` : '菜单加载中'}</span>
                          </div>
                        </div>
                        <i className={styles.sysArrow} aria-hidden>
                          →
                        </i>
                      </Link>
                      <div className={styles.sysQuick}>
                        {quick.length ? (
                          quick.map((r) => (
                            <Link key={r.key} to={r.path}>
                              {r.label}
                            </Link>
                          ))
                        ) : (
                          <Link to={sys.to}>进入子系统</Link>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              <p className={styles.sysFoot}>
                主应用 <code>host</code> :5000 · Module Federation 聚合路由与权限
              </p>
            </article>

            <article className={styles.tile}>
              <div className={styles.tileHead}>
                <h2>推荐操作</h2>
                <span>按租户治理流程</span>
              </div>
              <ul className={styles.actionList}>
                {actions.map((item) => (
                  <li key={item.label}>
                    <Link to={item.to} className={styles.actionRow}>
                      <span>{item.label}</span>
                      <small>{item.hint}</small>
                    </Link>
                  </li>
                ))}
              </ul>
            </article>
          </div>

          <aside className={styles.rail}>
            <div className={styles.profile}>
              <span className={styles.avatar}>{session?.name?.slice(0, 1) ?? 'U'}</span>
              <div className={styles.profileBody}>
                <strong>{session?.name ?? '—'}</strong>
                <p>{session?.email ?? '—'}</p>
                {roleLabel ? (
                  <div className={styles.roleTags}>
                    {session?.roles.slice(0, 2).map((role) => (
                      <span key={role}>{role}</span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <div className={styles.railMiniGrid}>
              <div>
                <span>权限点</span>
                <strong>{permCount || '—'}</strong>
              </div>
              <div>
                <span>可访问菜单</span>
                <strong>{accessibleRoutes || '—'}</strong>
              </div>
              <div>
                <span>今日订单</span>
                <strong>{loading ? '—' : orders}</strong>
              </div>
              <div>
                <span>活跃用户</span>
                <strong>{loading ? '—' : usersLabel}</strong>
              </div>
            </div>

            <div className={pending > 0 && !loading ? styles.alert : styles.alertMuted}>
              <span className={styles.alertLabel}>待办</span>
              <strong>{loading ? '—' : pending}</strong>
              <p>{pending > 0 ? '笔单据待跟进' : '当前无待办'}</p>
              {pending > 0 && !loading ? (
                <Link to="/product" className={styles.alertAction}>
                  去商品列表处理 →
                </Link>
              ) : null}
            </div>

            <div className={styles.railLinks}>
              <h3>常用</h3>
              {SHORTCUTS.slice(0, 4).map((item) => (
                <Link key={item.to} to={item.to} className={styles.railLinkRow}>
                  <span className={styles.railLinkMark}>{item.mark}</span>
                  <span>{item.label}</span>
                  <i aria-hidden>→</i>
                </Link>
              ))}
            </div>
          </aside>
        </div>

        <div className={styles.shortcutGrid}>
          {SHORTCUTS.map((item) => (
            <Link key={item.to} to={item.to} className={styles.shortcutTile}>
              <span className={styles.tileMark}>{item.mark}</span>
              <div>
                <strong>{item.label}</strong>
                <em>{item.tag}</em>
              </div>
            </Link>
          ))}
        </div>

        <p className={styles.foot}>主应用 5000 · 商品 5001 · 用户 5002</p>
      </div>
    </section>
  )
}
