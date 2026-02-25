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

export interface PhotoRead {
    id: string
    filename: string
    size: number
    mime_type: string
    created_at: string
    url: string
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

function authHeaders(token: string) {
    return { Authorization: `Bearer ${token}` }
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

/** GET /photos — list current user's photos */
export async function apiListPhotos(token: string): Promise<PhotoRead[]> {
    return request<PhotoRead[]>('/photos', {
        headers: authHeaders(token),
    })
}

/** POST /photos — upload an image file */
export async function apiUploadPhoto(token: string, file: File): Promise<PhotoRead> {
    const form = new FormData()
    form.append('file', file)
    return request<PhotoRead>('/photos', {
        method: 'POST',
        headers: authHeaders(token),
        body: form,
    })
}

/** DELETE /photos/{id} */
export async function apiDeletePhoto(token: string, photoId: string): Promise<void> {
    const res = await fetch(`${BASE}/photos/${photoId}`, {
        method: 'DELETE',
        headers: authHeaders(token),
    })
    if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.detail ?? `HTTP ${res.status}`)
    }
}
