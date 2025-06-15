'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import Papa from 'papaparse'
import { toast } from 'sonner'
import { useMutation } from 'convex/react'
import { api } from '@/../convex/_generated/api'
import { useAuth } from '@clerk/react-router'

export default function SkuVendorMapUpload() {
  const [loading, setLoading] = useState(false)
  const { userId } = useAuth()
  const uploadSkuMap = useMutation(api.sku_vendor_map.uploadSkuVendorMap)

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
          console.log('📋 Parsed SKU rows:', rows.length)

          const response: any = await uploadSkuMap({
            user_id: userId,
            rows: rows
          })

          toast.success(`✅ SKU Upload successful: ${response.stats.inserted} items inserted, ${response.stats.skipped} skipped`)
          
          if (response.errors.length > 0) {
            console.log('Upload errors:', response.errors)
          }
        } catch (err: any) {
          console.error('SKU Upload error:', err)
          toast.error(`❌ SKU Upload failed: ${err.message}`)
        } finally {
          setLoading(false)
        }
      },
      error: (err) => {
        console.error('SKU Parse error:', err)
        toast.error('❌ SKU CSV parse failed')
        setLoading(false)
      }
    })
  }, [uploadSkuMap, userId])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
  })

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-md p-4 text-center cursor-pointer transition-colors border-blue-300
        ${isDragActive ? 'bg-blue-50' : 'hover:bg-blue-50'}`}
    >
      <input {...getInputProps()} />
      {loading ? (
        <div className="flex items-center justify-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          <span className="text-sm">Processing SKU Map...</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1">
          <span className="text-lg">🗂️</span>
          <span className="text-sm font-medium">SKU Vendor Map CSV</span>
          <span className="text-xs text-gray-500">Drop here or click</span>
        </div>
      )}
    </div>
  )
}