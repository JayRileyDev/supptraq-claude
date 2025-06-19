'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import Papa from 'papaparse'
import { toast } from 'sonner'
import { useMutation } from 'convex/react'
import { api } from '@/../convex/_generated/api'
import { useAuth } from '@clerk/react-router'
import { useUploadRateLimit } from '~/hooks/use-upload-rate-limit'

export default function MerchUpload() {
  const [loading, setLoading] = useState(false)
  const { userId } = useAuth()
  const insertMerch = useMutation(api.inventory.parseAndInsertMerch)
  const { checkRateLimit, recordUpload, isRateLimited, remainingUploads } = useUploadRateLimit()

  const BATCH_SIZE = 1000

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!acceptedFiles[0]) return
    
    // Check rate limit before proceeding
    if (!checkRateLimit()) {
      return; // Rate limit exceeded, user already notified
    }
    
    setLoading(true)

    Papa.parse(acceptedFiles[0], {
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          if (!userId) throw new Error('User not authenticated')
          if (!results.data || results.data.length < 2) throw new Error('CSV file is empty or invalid')

          const rows = results.data as string[][]
          // Only log in development
          if (process.env.NODE_ENV === 'development') {
            console.log('📦 Parsed rows:', rows.length)
          }

          if (rows.length > 100000) throw new Error('CSV file too large. Please split into smaller files.')

          let totalInserted = 0
          let metadata = undefined

          // ✅ Chunk rows into 1000-row segments
          for (let i = 0; i < rows.length; i += BATCH_SIZE) {
            const chunk = rows.slice(i, i + BATCH_SIZE)
            const chunkIndex = Math.floor(i / BATCH_SIZE)
            if (process.env.NODE_ENV === 'development') {
              console.log(`🚚 Uploading chunk: ${i}–${i + chunk.length} (index: ${chunkIndex})`)
            }

            const response: any = await insertMerch({
              rows: chunk,
              chunk_index: chunkIndex,
              ...(metadata && { metadata }) // Only include metadata if it exists
            })

            // Store metadata from the first chunk to use in subsequent chunks
            if (chunkIndex === 0 && response?.metadata) {
              metadata = response.metadata
            }

            totalInserted += response?.stats?.inserted ?? 0
          }

          toast.success(`✅ Upload successful: ${totalInserted} items processed`)
          recordUpload() // Record successful upload for rate limiting
        } catch (err: any) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Upload error:', err)
          }
          toast.error(`❌ Upload failed: ${err.message}`)
        } finally {
          setLoading(false)
        }
      },
      error: (err) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('Parse error:', err)
        }
        toast.error('❌ CSV parse failed')
        setLoading(false)
      }
    })
  }, [insertMerch, userId])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB limit
    onDropRejected: (rejectedFiles) => {
      rejectedFiles.forEach(file => {
        if (file.file.size > 50 * 1024 * 1024) {
          toast.error('File too large. Maximum size is 50MB.');
        } else {
          toast.error('Invalid file type. Please upload a CSV file.');
        }
      });
    }
  })

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300
        ${isDragActive ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-border hover:border-primary/50 hover:bg-muted/30'}
        ${loading ? 'cursor-not-allowed opacity-75' : ''}`}
    >
      <input {...getInputProps()} disabled={loading} />
      {loading ? (
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          </div>
          <div className="space-y-2">
            <p className="text-foreground font-medium">Processing inventory data...</p>
            <p className="text-sm text-muted-foreground">This may take a moment for large files</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Rate limit info */}
          {!isRateLimited && (
            <div className="text-xs text-muted-foreground">
              {remainingUploads} uploads remaining this minute
            </div>
          )}
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
            <span className="text-2xl">📦</span>
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium text-foreground">
              {isDragActive ? 'Drop your CSV file here' : 'Drag & drop inventory CSV here'}
            </p>
            <p className="text-sm text-muted-foreground">or click to browse files</p>
            <p className="text-xs text-muted-foreground">CSV files only • Maximum 50MB • 100K rows</p>
          </div>
        </div>
      )}
    </div>
  )
}
