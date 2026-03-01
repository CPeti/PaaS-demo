import { useState } from 'preact/hooks'
import type { PhotoRead } from '../lib/api'
import { formatSize } from '../lib/format'

export function PhotoTable({
    photos,
    deletingId,
    onDelete,
    onOpen,
}: {
    photos: PhotoRead[]
    deletingId: string | null
    onDelete: (photo: PhotoRead) => void
    onOpen: (photo: PhotoRead) => void
}) {
    const [sortColumn, setSortColumn] = useState<'filename' | 'size' | 'created_at'>('created_at')
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

    function toggleSort(col: 'filename' | 'size' | 'created_at') {
        if (sortColumn === col) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
        } else {
            setSortColumn(col)
            setSortDir(col === 'created_at' ? 'desc' : 'asc') // default to desc for date, asc for others
        }
    }

    const sortedPhotos = [...photos].sort((a, b) => {
        let cmp = 0
        if (sortColumn === 'filename') {
            cmp = a.filename.localeCompare(b.filename)
        } else if (sortColumn === 'size') {
            cmp = a.size - b.size
        } else if (sortColumn === 'created_at') {
            cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        }
        return sortDir === 'asc' ? cmp : -cmp
    })

    function formatDate(isoStr: string) {
        const d = new Date(isoStr)
        const yyyy = d.getFullYear()
        const mm = String(d.getMonth() + 1).padStart(2, '0')
        const dd = String(d.getDate()).padStart(2, '0')
        const hh = String(d.getHours()).padStart(2, '0')
        const _mm = String(d.getMinutes()).padStart(2, '0')
        return `${yyyy}-${mm}-${dd} ${hh}:${_mm}`
    }

    function truncateFilename(name: string) {
        if (name.length <= 40) return name
        return name.slice(0, 37) + '...'
    }

    function SortIcon({ col }: { col: 'filename' | 'size' | 'created_at' }) {
        if (sortColumn !== col) {
            return <svg class="h-4 w-4 text-slate-500 opacity-0 group-hover:opacity-50 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
        }
        return sortDir === 'asc' ? (
            <svg class="h-4 w-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" /></svg>
        ) : (
            <svg class="h-4 w-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
        )
    }

    return (
        <div class="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 shadow-xl backdrop-blur-sm">
            <div class="overflow-x-auto">
                <table class="w-full text-left text-sm text-slate-300">
                    <thead class="border-b border-slate-800 bg-slate-900/80 text-xs uppercase text-slate-400">
                        <tr>
                            <th scope="col" class="w-24 px-6 py-4 font-medium">Preview</th>
                            <th scope="col" class="px-6 py-4 font-medium cursor-pointer group hover:text-white transition-colors" onClick={() => toggleSort('filename')}>
                                <div class="flex items-center gap-2">
                                    Name
                                    <SortIcon col="filename" />
                                </div>
                            </th>
                            <th scope="col" class="w-32 px-6 py-4 font-medium cursor-pointer group hover:text-white transition-colors" onClick={() => toggleSort('size')}>
                                <div class="flex items-center gap-2">
                                    Size
                                    <SortIcon col="size" />
                                </div>
                            </th>
                            <th scope="col" class="w-48 px-6 py-4 font-medium cursor-pointer group hover:text-white transition-colors" onClick={() => toggleSort('created_at')}>
                                <div class="flex items-center gap-2">
                                    Uploaded
                                    <SortIcon col="created_at" />
                                </div>
                            </th>
                            <th scope="col" class="w-24 px-6 py-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-800/60">
                        {sortedPhotos.map(photo => {
                            const isDeleting = deletingId === photo.id
                            return (
                                <tr
                                    key={photo.id}
                                    class="group transition-colors hover:bg-slate-800/40 cursor-pointer"
                                    onClick={() => onOpen(photo)}
                                >
                                    <td class="px-6 py-3">
                                        <div class="h-10 w-10 overflow-hidden rounded-lg bg-slate-800">
                                            {photo.mime_type.startsWith('video/') ? (
                                                <video
                                                    src={photo.url}
                                                    poster={photo.thumbnail_url}
                                                    preload="none"
                                                    class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110 pointer-events-none"
                                                    muted
                                                    playsInline
                                                />
                                            ) : (
                                                <img
                                                    src={photo.thumbnail_url || photo.url}
                                                    alt={photo.filename}
                                                    class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110 pointer-events-none"
                                                    loading="lazy"
                                                    onError={(e) => {
                                                        const target = e.currentTarget as HTMLImageElement;
                                                        if (target.src !== photo.url) {
                                                            target.src = photo.url;
                                                        }
                                                    }}
                                                />
                                            )}
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="font-medium text-white group-hover:text-violet-300 transition-colors">
                                            {truncateFilename(photo.filename)}
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap font-mono text-xs text-slate-400">
                                        {formatSize(photo.size)}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-slate-400">
                                        {formatDate(photo.created_at)}
                                    </td>
                                    <td class="px-6 py-4 text-right">
                                        <button
                                            id={`delete-${photo.id}`}
                                            onClick={(e) => { e.stopPropagation(); onDelete(photo) }}
                                            disabled={isDeleting}
                                            class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors disabled:opacity-50"
                                            title="Delete photo"
                                        >
                                            {isDeleting ? (
                                                <span class="h-4 w-4 animate-spin rounded-full border-2 border-red-400/30 border-t-red-400" />
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash h-4 w-4" viewBox="0 0 16 16">
                                                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z" />
                                                    <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z" />
                                                </svg>
                                            )}
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                        {sortedPhotos.length === 0 && (
                            <tr>
                                <td colSpan={5} class="px-6 py-8 text-center text-slate-500">
                                    No photos found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
