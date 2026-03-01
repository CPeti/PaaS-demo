/**
 * Utility functions for generating thumbnails on the client side.
 */

const THUMBNAIL_SIZE = 400
const JPEG_QUALITY = 0.85

/**
 * Generate a thumbnail blob from an Image file
 */
export async function generateImageThumbnail(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        const objectUrl = URL.createObjectURL(file)

        img.onload = () => {
            URL.revokeObjectURL(objectUrl)

            // Calculate dimensions to maintain aspect ratio and fit within THUMBNAIL_SIZE
            let width = img.width
            let height = img.height
            if (width > height) {
                if (width > THUMBNAIL_SIZE) {
                    height = Math.round((height * THUMBNAIL_SIZE) / width)
                    width = THUMBNAIL_SIZE
                }
            } else {
                if (height > THUMBNAIL_SIZE) {
                    width = Math.round((width * THUMBNAIL_SIZE) / height)
                    height = THUMBNAIL_SIZE
                }
            }

            const canvas = document.createElement('canvas')
            canvas.width = width
            canvas.height = height

            const ctx = canvas.getContext('2d')
            if (!ctx) {
                reject(new Error('Failed to get canvas context'))
                return
            }

            // Draw image to canvas
            ctx.drawImage(img, 0, 0, width, height)

            // Convert to JPEG blob
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob)
                    } else {
                        reject(new Error('Failed to create blob from canvas'))
                    }
                },
                'image/jpeg',
                JPEG_QUALITY
            )
        }

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl)
            reject(new Error('Failed to load image for thumbnail generation'))
        }

        img.src = objectUrl
    })
}

/**
 * Generate a thumbnail blob from a Video file
 */
export async function generateVideoThumbnail(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video')
        const objectUrl = URL.createObjectURL(file)

        // Ensure we can render a frame
        video.preload = 'metadata'
        video.muted = true
        video.playsInline = true

        video.onloadedmetadata = () => {
            // Seek to 0.1 seconds to grab a frame (avoiding empty first frames)
            video.currentTime = Math.min(0.1, video.duration / 2 || 0)
        }

        video.onseeked = () => {
            URL.revokeObjectURL(objectUrl)

            // Calculate dimensions
            let width = video.videoWidth
            let height = video.videoHeight
            if (width > height) {
                if (width > THUMBNAIL_SIZE) {
                    height = Math.round((height * THUMBNAIL_SIZE) / width)
                    width = THUMBNAIL_SIZE
                }
            } else {
                if (height > THUMBNAIL_SIZE) {
                    width = Math.round((width * THUMBNAIL_SIZE) / height)
                    height = THUMBNAIL_SIZE
                }
            }

            const canvas = document.createElement('canvas')
            canvas.width = width
            canvas.height = height

            const ctx = canvas.getContext('2d')
            if (!ctx) {
                reject(new Error('Failed to get canvas context'))
                return
            }

            ctx.drawImage(video, 0, 0, width, height)

            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob)
                    } else {
                        reject(new Error('Failed to create blob from canvas'))
                    }
                },
                'image/jpeg',
                JPEG_QUALITY
            )
        }

        video.onerror = () => {
            URL.revokeObjectURL(objectUrl)
            reject(new Error('Failed to load video for thumbnail generation'))
        }

        video.src = objectUrl
    })
}
