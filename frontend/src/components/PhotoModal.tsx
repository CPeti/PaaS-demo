import { useEffect } from 'preact/hooks'
import type { PhotoRead } from '../lib/api'
import { formatSize } from '../lib/format'

export function PhotoModal({
    photo,
    onClose,
    onPrev,
    onNext,
    onDelete,
    deleting,
}: {
    photo: PhotoRead
    onClose: () => void
    onPrev?: () => void
    onNext?: () => void
    onDelete: () => void
    deleting: boolean
}) {
    // Keyboard navigation
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') onClose()
            if (e.key === 'ArrowLeft') onPrev?.()
            if (e.key === 'ArrowRight') onNext?.()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [onClose, onPrev, onNext])

    return (
        <div
            id="photo-modal"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
            onClick={onClose}
        >
            {/* Prev */}
            {onPrev && (
                <button
                    id="modal-prev"
                    class="absolute left-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                    onClick={(e) => { e.stopPropagation(); onPrev() }}
                    title="Previous (←)"
                >
                    <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                </button>
            )}

            {/* Image + info */}
            <div
                class="relative mx-20 flex max-h-[90vh] max-w-[90vw] flex-col items-center"
                onClick={(e) => e.stopPropagation()}
            >
                {photo.mime_type.startsWith('video/') ? (
                    <video
                        src={photo.url}
                        class="max-h-[80vh] max-w-full rounded-2xl shadow-2xl bg-black/50"
                        controls
                        autoPlay
                        loop
                        playsInline
                    />
                ) : (
                    <img
                        src={photo.url}
                        alt={photo.filename}
                        class="max-h-[80vh] max-w-full rounded-2xl object-contain shadow-2xl"
                    />
                )}

                {/* Info bar */}
                <div class="mt-4 flex w-full items-center justify-between gap-4">
                    <div class="min-w-0">
                        <p class="truncate text-sm font-medium text-white">{photo.filename}</p>
                        <p class="text-xs text-slate-400">
                            {formatSize(photo.size)} · {new Date(photo.created_at).toLocaleDateString()}
                        </p>
                    </div>
                    <button
                        id="modal-delete"
                        onClick={onDelete}
                        disabled={deleting}
                        class="flex shrink-0 items-center gap-2 rounded-lg bg-red-600/80 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50 transition-colors"
                    >
                        {deleting ? (
                            <span class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash h-4 w-4" viewBox="0 0 16 16">
                                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z" />
                                <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z" />
                            </svg>
                        )}
                        Delete
                    </button>
                </div>
            </div>

            {/* Next */}
            {onNext && (
                <button
                    id="modal-next"
                    class="absolute right-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                    onClick={(e) => { e.stopPropagation(); onNext() }}
                    title="Next (→)"
                >
                    <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 18l6-6-6-6" />
                    </svg>
                </button>
            )}

            {/* Close */}
            <button
                id="modal-close"
                class="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                onClick={onClose}
                title="Close (Esc)"
            >
                <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M4.293 4.293a1 1 0 0 1 1.414 0L10 8.586l4.293-4.293a1 1 0 1 1 1.414 1.414L11.414 10l4.293 4.293a1 1 0 0 1-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 0 1-1.414-1.414L8.586 10 4.293 5.707a1 1 0 0 1 0-1.414z" />
                </svg>
            </button>
        </div>
    )
}
