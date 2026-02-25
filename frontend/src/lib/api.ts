const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export interface UserRead {
    id: string
    username: string
    email: string
    is_active: boolean
}

export interface Token {
    access_token: string
    token_type: string
}

async function request<T>(
    path: string,
    init: RequestInit,
): Promise<T> {
    const res = await fetch(`${BASE}${path}`, init)
    const body = await res.json().catch(() => null)
    if (!res.ok) {
        const detail = body?.detail
        throw new Error(
            typeof detail === 'string'
                ? detail
                : Array.isArray(detail)
                    ? detail.map((d: { msg: string }) => d.msg).join(', ')
                    : `HTTP ${res.status}`,
        )
    }
    return body as T
}

/** POST /auth/token — form-encoded OAuth2 login */
export async function apiLogin(username: string, password: string): Promise<Token> {
    const form = new URLSearchParams({ username, password })
    return request<Token>('/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
    })
}

/** POST /auth/register — JSON */
export async function apiRegister(
    username: string,
    email: string,
    password: string,
): Promise<UserRead> {
    return request<UserRead>('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
    })
}
