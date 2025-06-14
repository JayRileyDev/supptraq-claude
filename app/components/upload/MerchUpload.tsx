'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import Papa from 'papaparse'
import { toast } from 'sonner'
import { useMutation } from 'convex/react'
import { api } from '@/../convex/_generated/api'
import { useAuth } from '@clerk/react-router'

export default function MerchUpload() {
  const [loading, setLoading] = useState(false)
  const { userId } = useAuth()
  const insertMerch = useMutation(api.inventory.parseAndInsertMerch)

  const BATCH_SIZE = 1000

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!acceptedFiles[0]) return
    setLoading(true)

    Papa.parse(acceptedFiles[0], {
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          if (!userId) throw new Error('User not authenticated')
          if (!results.data || results.data.length < 2) throw new Error('CSV file is empty or invalid')

          const rows = results.data as string[][]
          console.log('📦 Parsed rows:', rows.length)

          if (rows.length > 100000) throw new Error('CSV file too large. Please split into smaller files.')

          let totalInserted = 0
          let metadata = undefined

          // ✅ Chunk rows into 1000-row segments
          for (let i = 0; i < rows.length; i += BATCH_SIZE) {
            const chunk = rows.slice(i, i + BATCH_SIZE)
            const chunkIndex = Math.floor(i / BATCH_SIZE)
            console.log(`🚚 Uploading chunk: ${i}–${i + chunk.length} (index: ${chunkIndex})`)

            const response: any = await insertMerch({
              user_id: userId,
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
        } catch (err: any) {
          console.error('Upload error:', err)
          toast.error(`❌ Upload failed: ${err.message}`)
        } finally {
          setLoading(false)
        }
      },
      error: (err) => {
        console.error('Parse error:', err)
        toast.error('❌ CSV parse failed')
        setLoading(false)
      }
    })
  }, [insertMerch, userId])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
  })

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors
        ${isDragActive ? 'bg-muted/50' : 'hover:bg-muted/50'}`}
    >
      <input {...getInputProps()} />
      {loading ? (
        <div className="flex items-center justify-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <span>Processing...</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <span className="text-2xl">📦</span>
          <span>Drop merch CSV here or click to upload</span>
        </div>
      )}
    </div>
  )
}
