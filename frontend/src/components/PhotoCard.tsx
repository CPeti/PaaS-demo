import { useState } from 'preact/hooks'
import type { PhotoRead } from '../lib/api'
import { formatSize } from '../lib/format'

export function PhotoCard({
    photo,
    deleting,
    onDelete,
    onOpen,
}: {
    photo: PhotoRead
    deleting: boolean
    onDelete: () => void
    onOpen: () => void
}) {
    const [hovered, setHovered] = useState(false)

    return (
        <div
            class="group relative overflow-hidden rounded-2xl bg-slate-800 aspect-square cursor-pointer"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={onOpen}
        >
            {photo.mime_type.startsWith('video/') ? (
                <video
                    src={photo.url}
                    poster={photo.thumbnail_url}
                    preload="none"
                    class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 pointer-events-none"
                    muted
                    loop
                    playsInline
                    onMouseEnter={(e) => (e.target as HTMLVideoElement).play().catch(() => { })}
                    onMouseLeave={(e) => {
                        const target = e.target as HTMLVideoElement;
                        target.pause();
                        target.currentTime = 0;
                    }}
                />
            ) : (
                <img
                    src={photo.thumbnail_url || photo.url}
                    alt={photo.filename}
                    class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 pointer-events-none"
                    loading="lazy"
                    onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        if (target.src !== photo.url) {
                            target.src = photo.url;
                        }
                    }}
                />
            )}

            {/* Hover overlay */}
            <div class={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-200 ${hovered ? 'opacity-100' : 'opacity-0'}`}>
                <div class="absolute bottom-0 left-0 right-0 p-3">
                    <p class="truncate text-xs font-medium text-white">{photo.filename}</p>
                    <p class="text-xs text-slate-400">{formatSize(photo.size)}</p>
                </div>

                {/* Delete button */}
                <button
                    id={`delete-${photo.id}`}
                    onClick={(e) => { e.stopPropagation(); onDelete() }}
                    disabled={deleting}
                    class="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-red-600/90 text-white hover:bg-red-500 disabled:opacity-50 transition-colors backdrop-blur-sm"
                    title="Delete photo"
                >
                    {deleting ? (
                        <span class="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash h-4 w-4" viewBox="0 0 16 16">
                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z" />
                            <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z" />
                        </svg>
                    )}
                </button>
            </div>
        </div>
    )
}
