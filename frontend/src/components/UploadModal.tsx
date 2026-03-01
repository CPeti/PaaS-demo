import { useState, useRef, useEffect } from 'preact/hooks'
import { formatSize } from '../lib/format'

export interface UploadItem {
    id: string
    file: File
    previewUrl: string
    customName: string
}

export function UploadModal({
    isOpen,
    onClose,
    onUpload,
}: {
    isOpen: boolean
    onClose: () => void
    onUpload: (items: UploadItem[]) => Promise<void>
}) {
    const [items, setItems] = useState<UploadItem[]>([])
    const [dragOver, setDragOver] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Cleanup object URLs when unmounting or removing items
    useEffect(() => {
        return () => {
            items.forEach(item => URL.revokeObjectURL(item.previewUrl))
        }
    }, [items])

    if (!isOpen) return null

    function handleFiles(files: FileList | null) {
        if (!files) return
        setError(null)

        const newItems: UploadItem[] = Array.from(files).map((file) => ({
            id: Math.random().toString(36).substring(7),
            file,
            previewUrl: URL.createObjectURL(file), // Generate local preview
            customName: file.name, // Default to original name
        }))

        setItems(prev => [...prev, ...newItems])
    }

    function removeItem(id: string) {
        setItems(prev => {
            const itemToRemove = prev.find(i => i.id === id)
            if (itemToRemove) URL.revokeObjectURL(itemToRemove.previewUrl)
            return prev.filter(i => i.id !== id)
        })
    }

    function updateItemName(id: string, newName: string) {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, customName: newName } : item
        ))
    }

    async function handleUploadClick() {
        if (items.length === 0) return
        setUploading(true)
        setError(null)
        try {
            await onUpload(items)
            setItems([]) // clear on success
            onClose()
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Upload failed')
        } finally {
            setUploading(false)
        }
    }

    function handleClose() {
        if (!uploading) {
            setItems([])
            setError(null)
            onClose()
        }
    }

    return (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div class="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">

                {/* Header */}
                <div class="flex items-center justify-between border-b border-slate-800 px-6 py-4">
                    <h2 class="text-lg font-semibold text-white">Upload Photos</h2>
                    <button
                        onClick={handleClose}
                        disabled={uploading}
                        class="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors disabled:opacity-50"
                    >
                        <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M4.293 4.293a1 1 0 0 1 1.414 0L10 8.586l4.293-4.293a1 1 0 1 1 1.414 1.414L11.414 10l4.293 4.293a1 1 0 0 1-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 0 1-1.414-1.414L8.586 10 4.293 5.707a1 1 0 0 1 0-1.414z" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div class="flex-1 overflow-y-auto p-6">
                    {error && (
                        <div class="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400 border border-red-500/20">
                            {error}
                        </div>
                    )}

                    {/* Drop Zone */}
                    <div
                        class={`group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed py-12 transition-colors ${dragOver ? 'border-violet-500 bg-violet-500/10' : 'border-slate-700 hover:border-slate-500 bg-slate-800/20 hover:bg-slate-800/40'
                            }`}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={(e) => {
                            e.preventDefault()
                            setDragOver(false)
                            handleFiles(e.dataTransfer?.files ?? null)
                        }}
                        onClick={() => !uploading && fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            class="hidden"
                            onChange={(e) => handleFiles((e.target as HTMLInputElement).files)}
                            disabled={uploading}
                        />
                        <div class="mb-3 rounded-full bg-slate-800 p-3 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-300 transition-colors">
                            <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                        </div>
                        <p class="font-medium text-white">Click to select files or drag them here</p>
                        <p class="mt-1 text-sm text-slate-500">Up to 10 MB each</p>
                    </div>

                    {/* Pending Items List */}
                    {items.length > 0 && (
                        <div class="mt-6 space-y-3">
                            <h3 class="text-sm font-medium text-slate-400">Selected files ({items.length})</h3>
                            {items.map((item) => (
                                <div key={item.id} class="flex items-center gap-4 rounded-xl border border-slate-700/50 bg-slate-800/40 p-3 transition-colors hover:bg-slate-800/60">
                                    {/* Preview */}
                                    <img
                                        src={item.previewUrl}
                                        alt="preview"
                                        class="h-16 w-16 shrink-0 rounded-lg object-cover bg-slate-900 border border-slate-700"
                                    />

                                    {/* Edit Name & Size */}
                                    <div class="flex min-w-0 flex-1 flex-col justify-center">
                                        <input
                                            type="text"
                                            value={item.customName}
                                            onChange={(e) => updateItemName(item.id, (e.target as HTMLInputElement).value)}
                                            disabled={uploading}
                                            class="w-full bg-transparent text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500 rounded px-1 -ml-1 transition-shadow"
                                            placeholder="Enter filename..."
                                        />
                                        <p class="text-xs text-slate-400 mt-1">{formatSize(item.file.size)}</p>
                                    </div>

                                    {/* Remove Button */}
                                    <button
                                        onClick={() => removeItem(item.id)}
                                        disabled={uploading}
                                        class="rounded-lg p-2 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors disabled:opacity-50"
                                        title="Remove file"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash h-4 w-4" viewBox="0 0 16 16">
                                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z" />
                                            <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div class="flex items-center justify-end gap-3 border-t border-slate-800 bg-slate-900/50 px-6 py-4 rounded-b-2xl">
                    <button
                        onClick={handleClose}
                        disabled={uploading}
                        class="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUploadClick}
                        disabled={items.length === 0 || uploading}
                        class="flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50 transition-colors"
                    >
                        {uploading ? (
                            <>
                                <span class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                Uploading {items.length} file{items.length !== 1 ? 's' : ''}...
                            </>
                        ) : (
                            `Upload ${items.length > 0 ? items.length : ''} File${items.length !== 1 ? 's' : ''}`
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
