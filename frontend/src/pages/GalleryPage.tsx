import { useEffect, useRef, useState } from 'preact/hooks'
import { useLocation } from 'wouter'
import {
    type PhotoRead,
    apiListPhotos,
    apiUploadPhoto,
    apiDeletePhoto,
} from '../lib/api'
import { getToken, clearToken } from '../lib/auth'
import { PhotoCard } from '../components/PhotoCard'
import { PhotoModal } from '../components/PhotoModal'

export function GalleryPage() {
    const [, navigate] = useLocation()
    const token = getToken()

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!token) navigate('/login')
    }, [token])

    const [photos, setPhotos] = useState<PhotoRead[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)
    const [dragOver, setDragOver] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [selectedPhoto, setSelectedPhoto] = useState<PhotoRead | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const selectedIndex = selectedPhoto ? photos.findIndex(p => p.id === selectedPhoto.id) : -1
    const showPrev = selectedIndex > 0
    const showNext = selectedIndex < photos.length - 1

    async function fetchPhotos() {
        if (!token) return
        try {
            const data = await apiListPhotos(token)
            setPhotos(data)
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load photos')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchPhotos() }, [])

    async function handleFiles(files: FileList | null) {
        if (!files || !token) return
        setUploading(true)
        setError(null)
        try {
            for (const file of Array.from(files)) {
                const photo = await apiUploadPhoto(token, file)
                setPhotos(prev => [photo, ...prev])
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Upload failed')
        } finally {
            setUploading(false)
        }
    }

    async function handleDelete(photo: PhotoRead) {
        if (!token) return
        setDeletingId(photo.id)
        setError(null)
        try {
            await apiDeletePhoto(token, photo.id)
            setPhotos(prev => prev.filter(p => p.id !== photo.id))
            if (selectedPhoto?.id === photo.id) setSelectedPhoto(null)
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Delete failed')
        } finally {
            setDeletingId(null)
        }
    }

    function handleLogout() {
        clearToken()
        navigate('/')
    }

    if (!token) return null

    return (
        <div class="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
            {/* ── Navbar ─────────────────────────────────────────── */}
            <header class="sticky top-0 z-40 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md">
                <div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <a href="/" class="flex items-center gap-2.5">
                        <svg class="h-7 w-7 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                            <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" />
                            <line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" />
                            <line x1="4.22" y1="4.22" x2="7.05" y2="7.05" /><line x1="16.95" y1="16.95" x2="19.78" y2="19.78" />
                            <line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" />
                        </svg>
                        <span class="text-xl font-semibold text-white">Lumina</span>
                    </a>
                    <div class="flex items-center gap-3">
                        <button
                            id="upload-btn"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            class="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50 transition-colors"
                        >
                            {uploading ? (
                                <>
                                    <span class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    Uploading…
                                </>
                            ) : (
                                <>
                                    <svg class="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M8 2v9M4 5l4-4 4 4" /><path d="M2 12v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-1" />
                                    </svg>
                                    Upload
                                </>
                            )}
                        </button>
                        <button
                            id="logout-btn"
                            onClick={handleLogout}
                            class="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                        >
                            Log out
                        </button>
                    </div>
                </div>
            </header>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                class="hidden"
                onChange={(e) => handleFiles((e.target as HTMLInputElement).files)}
            />

            <main class="mx-auto max-w-7xl px-6 py-10">
                {/* Error banner */}
                {error && (
                    <div role="alert" class="mb-6 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm text-red-400">
                        <svg class="h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm-.75 3.75a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-1.5 0v-3.5zm.75 6.5a.875.875 0 1 1 0-1.75.875.875 0 0 1 0 1.75z" />
                        </svg>
                        {error}
                        <button class="ml-auto" onClick={() => setError(null)}>✕</button>
                    </div>
                )}

                {/* Drop zone (shown when gallery is empty or while dragging) */}
                {(photos.length === 0 && !loading) && (
                    <div
                        id="drop-zone"
                        class={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-24 text-center transition-colors ${dragOver
                            ? 'border-violet-500 bg-violet-500/10'
                            : 'border-slate-700 hover:border-slate-500'
                            }`}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={(e) => {
                            e.preventDefault()
                            setDragOver(false)
                            handleFiles(e.dataTransfer?.files ?? null)
                        }}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800">
                            <svg class="h-7 w-7 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                        </div>
                        <p class="font-medium text-white">Drop photos here</p>
                        <p class="mt-1 text-sm text-slate-500">or click to browse — up to 10 MB each</p>
                    </div>
                )}

                {/* Loading skeleton */}
                {loading && (
                    <div class="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} class="aspect-square animate-pulse rounded-2xl bg-slate-800" />
                        ))}
                    </div>
                )}

                {/* Photo grid */}
                {!loading && photos.length > 0 && (
                    <>
                        <div class="mb-6 flex items-center justify-between">
                            <h1 class="text-lg font-semibold text-white">
                                Your Album
                                <span class="ml-2 text-sm font-normal text-slate-500">
                                    {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
                                </span>
                            </h1>
                        </div>

                        {/* Drag-to-upload overlay on grid */}
                        <div
                            class={`relative rounded-2xl transition-colors ${dragOver ? 'ring-2 ring-violet-500' : ''}`}
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={(e) => {
                                e.preventDefault()
                                setDragOver(false)
                                handleFiles(e.dataTransfer?.files ?? null)
                            }}
                        >
                            {dragOver && (
                                <div class="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-violet-900/60 backdrop-blur-sm">
                                    <p class="text-lg font-semibold text-white">Drop to upload</p>
                                </div>
                            )}
                            <div class="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                                {photos.map(photo => (
                                    <PhotoCard
                                        key={photo.id}
                                        photo={photo}
                                        deleting={deletingId === photo.id}
                                        onDelete={() => handleDelete(photo)}
                                        onOpen={() => setSelectedPhoto(photo)}
                                    />
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </main>

            {selectedPhoto && (
                <PhotoModal
                    photo={selectedPhoto}
                    onClose={() => setSelectedPhoto(null)}
                    onPrev={showPrev ? () => setSelectedPhoto(photos[selectedIndex - 1]) : undefined}
                    onNext={showNext ? () => setSelectedPhoto(photos[selectedIndex + 1]) : undefined}
                    onDelete={() => handleDelete(selectedPhoto)}
                    deleting={deletingId === selectedPhoto.id}
                />
            )}
        </div>
    )
}
