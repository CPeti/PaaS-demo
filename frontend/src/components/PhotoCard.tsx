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
            <img
                src={photo.url}
                alt={photo.filename}
                class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
            />

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
                        <svg class="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 9a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-9" />
                        </svg>
                    )}
                </button>
            </div>
        </div>
    )
}
