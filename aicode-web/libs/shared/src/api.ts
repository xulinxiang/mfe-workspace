import {
  emitUnauthorized,
  readAuthSession,
  type AuthSession,
} from './auth'

export type ApiResponse<T> = {
  code: number
  message: string
  data: T
}

export class ApiError extends Error {
  code: number

  constructor(code: number, message: string) {
    super(message)
    this.code = code
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  session?: AuthSession | null,
): Promise<T> {
  const auth = session === undefined ? readAuthSession() : session
  const headers = new Headers(options.headers)

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }
  if (auth?.token) {
    headers.set('Authorization', `Bearer ${auth.token}`)
    headers.set('X-Tenant-Id', String(auth.tenantId))
  }

  let response: Response
  try {
    response = await fetch(path, { ...options, headers })
  } catch {
    throw new ApiError(0, '无法连接接口服务')
  }

  let body: ApiResponse<T>
  try {
    body = (await response.json()) as ApiResponse<T>
  } catch {
    throw new ApiError(response.status, '接口返回格式错误')
  }

  if (body.code !== 0) {
    if (body.code === 401) emitUnauthorized()
    throw new ApiError(body.code, body.message || '请求失败')
  }

  return body.data
}
