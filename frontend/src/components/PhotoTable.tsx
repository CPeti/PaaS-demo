import { useState, useRef, useEffect } from 'preact/hooks'
import { type PhotoRead } from '../lib/api'
import { formatSize, formatDate } from '../lib/format'

export function PhotoTable({
    photos,
    deletingId,
    onDelete,
    onOpen,
    onRename,
}: {
    photos: PhotoRead[]
    deletingId: string | null
    onDelete: (photo: PhotoRead) => void
    onOpen: (photo: PhotoRead) => void
    onRename?: (photo: PhotoRead, newName: string) => Promise<void>
}) {
    type SortColumn = 'filename' | 'size' | 'created_at'
    const [sortCol, setSortCol] = useState<SortColumn>('created_at')
    const [sortDesc, setSortDesc] = useState(true)

    // Inline editing state
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editName, setEditName] = useState('')
    const [savingId, setSavingId] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Focus input when editing starts
    useEffect(() => {
        if (editingId && inputRef.current) {
            inputRef.current.focus()
            // Select text but not the extension
            const lastDot = editName.lastIndexOf('.')
            if (lastDot > 0) {
                inputRef.current.setSelectionRange(0, lastDot)
            } else {
                inputRef.current.select()
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editingId]) // Only run when editingId changes, not on every keystroke

    async function handleSaveRename(photo: PhotoRead) {
        if (!onRename || editName.trim() === '' || editName === photo.filename) {
            setEditingId(null)
            return
        }

        setSavingId(photo.id)
        try {
            await onRename(photo, editName.trim())
            setEditingId(null)
        } catch (e) {
            // Error is handled by parent, we just stay in edit mode
            inputRef.current?.focus()
        } finally {
            setSavingId(null)
        }
    }

    function toggleSort(col: SortColumn) {
        if (sortCol === col) {
            setSortDesc(!sortDesc)
        } else {
            setSortCol(col)
            setSortDesc(col === 'created_at') // default to desc for date, asc for others
        }
    }

    const sortedPhotos = [...photos].sort((a, b) => {
        let cmp = 0
        if (sortCol === 'filename') {
            cmp = a.filename.localeCompare(b.filename)
        } else if (sortCol === 'size') {
            cmp = a.size - b.size
        } else if (sortCol === 'created_at') {
            cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        }
        return sortDesc ? -cmp : cmp
    })

    function SortIcon({ col }: { col: SortColumn }) {
        if (sortCol !== col) {
            return <svg class="h-4 w-4 text-slate-500 opacity-0 group-hover:opacity-50 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
        }
        return sortDesc ? (
            <svg class="h-4 w-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
        ) : (
            <svg class="h-4 w-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" /></svg>
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
                                        {editingId === photo.id ? (
                                            <div class="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                                <input
                                                    ref={inputRef}
                                                    type="text"
                                                    value={editName}
                                                    onInput={(e) => setEditName((e.target as HTMLInputElement).value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleSaveRename(photo)
                                                        if (e.key === 'Escape') setEditingId(null)
                                                    }}
                                                    disabled={savingId === photo.id}
                                                    class="w-48 bg-slate-800 text-sm font-medium text-white border border-violet-500 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-colors disabled:opacity-50"
                                                />
                                                {savingId === photo.id ? (
                                                    <span class="h-4 w-4 animate-spin rounded-full border-2 border-violet-400/30 border-t-violet-400 shrink-0" />
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleSaveRename(photo) }}
                                                            class="text-green-400 hover:text-green-300 transition-colors p-1"
                                                            title="Save"
                                                        >
                                                            <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setEditingId(null) }}
                                                            class="text-slate-400 hover:text-red-400 transition-colors p-1"
                                                            title="Cancel"
                                                        >
                                                            <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                                                            </svg>
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        ) : (
                                            <div class="flex items-center gap-2 group/edit">
                                                <p class="text-sm font-medium text-white max-w-[200px] truncate" title={photo.filename}>
                                                    {photo.filename.length > 40 ? photo.filename.substring(0, 37) + '...' : photo.filename}
                                                </p>
                                                {onRename && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setEditName(photo.filename)
                                                            setEditingId(photo.id)
                                                        }}
                                                        class="opacity-0 group-hover/edit:opacity-100 text-slate-400 hover:text-violet-400 transition-all p-1 -ml-1"
                                                        title="Rename file"
                                                    >
                                                        <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        )}
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
