const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
import { clearToken } from './auth'

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
    thumbnail_url: string
}

async function request<T>(
    path: string,
    init: RequestInit,
): Promise<T> {
    const res = await fetch(`${BASE}${path}`, init)
    const body = await res.json().catch(() => null)
    if (!res.ok) {
        if (res.status === 401) {
            clearToken()
            const path = window.location.pathname
            if (path !== '/login' && path !== '/register') {
                window.location.href = '/login'
            }
            throw new Error(typeof body?.detail === 'string' ? body.detail : 'Unauthorized')
        }
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

/** POST /auth/token - form-encoded OAuth2 login */
export async function apiLogin(username: string, password: string): Promise<Token> {
    const form = new URLSearchParams({ username, password })
    return request<Token>('/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
    })
}

/** POST /auth/register - JSON */
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

/** GET /photos - list current user's photos */
export async function apiListPhotos(token: string): Promise<PhotoRead[]> {
    return request<PhotoRead[]>('/photos', {
        headers: authHeaders(token),
    })
}

/** 
 * Direct S3 Upload Flow
 * 1. Get presigned URLs for the main file and thumbnail
 * 2. Upload both files directly to S3
 * 3. Confirm the upload with the backend to save metadata
 */
export async function apiUploadPhoto(
    token: string,
    file: File,
    thumbnail: Blob,
    filename: string
): Promise<PhotoRead> {
    // 1. Get Presigned URLs
    const uploadInfo = await request<{ key: string; url: string; thumbnail_url: string }>('/photos/upload-url', {
        method: 'POST',
        headers: {
            ...authHeaders(token),
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            filename,
            content_type: file.type,
            size: file.size,
        }),
    })

    // 2. Upload to S3 directly (using PUT directly to the pre-signed URLs)
    // We use standard fetch without auth headers because the URL is already signed.
    const [fileRes, thumbRes] = await Promise.all([
        fetch(uploadInfo.url, {
            method: 'PUT',
            headers: { 'Content-Type': file.type },
            body: file,
        }),
        fetch(uploadInfo.thumbnail_url, {
            method: 'PUT',
            headers: { 'Content-Type': 'image/jpeg' },
            body: thumbnail,
        }),
    ])

    if (!fileRes.ok || !thumbRes.ok) {
        throw new Error('Failed to upload files directly to storage')
    }

    // 3. Confirm Upload
    return request<PhotoRead>('/photos/confirm', {
        method: 'POST',
        headers: {
            ...authHeaders(token),
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            key: uploadInfo.key,
            filename,
            content_type: file.type,
            size: file.size,
        }),
    })
}

/** DELETE /photos/{id} */
export async function apiDeletePhoto(token: string, photoId: string): Promise<void> {
    const res = await fetch(`${BASE}/photos/${photoId}`, {
        method: 'DELETE',
        headers: authHeaders(token),
    })
    if (!res.ok) {
        if (res.status === 401) {
            clearToken()
            const path = window.location.pathname
            if (path !== '/login' && path !== '/register') {
                window.location.href = '/login'
            }
        }
        const body = await res.json().catch(() => null)
        throw new Error(body?.detail ?? `HTTP ${res.status}`)
    }
}

/** PATCH /photos/{id} - update photo metadata */
export async function apiUpdatePhoto(token: string, photoId: string, updates: { filename?: string }): Promise<PhotoRead> {
    return request<PhotoRead>(`/photos/${photoId}`, {
        method: 'PATCH',
        headers: {
            ...authHeaders(token),
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
    })
}
