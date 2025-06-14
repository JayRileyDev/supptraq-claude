'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import Papa from 'papaparse'
import { toast } from 'sonner'
import { useMutation } from 'convex/react'
import { api } from '@/../convex/_generated/api'
import { useAuth } from '@clerk/react-router'
import { AlertCircle, CheckCircle, Info } from 'lucide-react'

interface UploadStats {
    total: number
    inserted: number
    failed: number
    duplicates: number
    byTable: {
        ticket_history: number
        return_tickets: number
        gift_card_tickets: number
    }
}

export default function TicketUpload() {
    const [loading, setLoading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [stats, setStats] = useState<UploadStats | null>(null)
    const [errors, setErrors] = useState<any[]>([])
    const { userId } = useAuth()
    
    // Use the new enhanced parser
    const parseTicketsEnhanced = useMutation(api.ticketHistoryEnhanced.parseAndInsertTicketsEnhanced)

    const processFile = useCallback(async (rows: any[][]) => {
        try {
            if (!userId) {
                throw new Error('User not authenticated')
            }

            const CHUNK_SIZE = 5000 // Process 5000 rows at a time (well under 8192 limit)
            const totalRows = rows.length
            let processedRows = 0
            let totalStats = {
                total: 0,
                inserted: 0,
                failed: 0,
                duplicates: 0,
                byTable: {
                    ticket_history: 0,
                    return_tickets: 0,
                    gift_card_tickets: 0
                }
            }
            let allErrors: any[] = []

            toast.info(`Processing ${totalRows.toLocaleString()} rows in chunks...`, { id: 'processing' })

            // Process in chunks
            for (let i = 0; i < totalRows; i += CHUNK_SIZE) {
                const chunk = rows.slice(i, Math.min(i + CHUNK_SIZE, totalRows))
                const chunkNum = Math.floor(i / CHUNK_SIZE) + 1
                const totalChunks = Math.ceil(totalRows / CHUNK_SIZE)
                
                // Update progress
                const progressPercent = Math.round((i / totalRows) * 100)
                setProgress(progressPercent)
                toast.info(`Processing chunk ${chunkNum}/${totalChunks} (${progressPercent}%)`, { id: 'processing' })

                try {
                    const response = await parseTicketsEnhanced({
                        user_id: userId,
                        rows: chunk,
                        options: {
                            batchSize: 100,
                            validateBeforeInsert: true,
                            skipDuplicateCheck: i > 0, // Skip duplicate check after first chunk for performance
                            dryRun: false
                        }
                    })

                    if (response.status === 'success' && response.stats) {
                        // Accumulate stats
                        totalStats.total += response.stats.total
                        totalStats.inserted += response.stats.inserted
                        totalStats.failed += response.stats.failed
                        totalStats.duplicates += response.stats.duplicates
                        totalStats.byTable.ticket_history += response.stats.byTable.ticket_history
                        totalStats.byTable.return_tickets += response.stats.byTable.return_tickets
                        totalStats.byTable.gift_card_tickets += response.stats.byTable.gift_card_tickets

                        // Collect errors
                        if (response.failed) {
                            allErrors.push(...response.failed)
                        }
                    }

                    processedRows += chunk.length
                } catch (chunkError) {
                    console.error(`Error processing chunk ${chunkNum}:`, chunkError)
                    allErrors.push({
                        chunk: chunkNum,
                        error: chunkError instanceof Error ? chunkError.message : 'Unknown error'
                    })
                }
            }

            setProgress(100)

            return {
                status: 'success' as const,
                stats: totalStats,
                failed: allErrors.slice(0, 20), // Return first 20 errors
                message: `Processed ${totalStats.inserted} tickets from ${totalRows.toLocaleString()} rows`
            }

        } catch (err) {
            console.error('Processing error:', err)
            throw err
        }
    }, [parseTicketsEnhanced, userId])

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (!acceptedFiles[0]) {
            toast.error('❌ No file selected')
            return
        }

        setLoading(true)
        setProgress(0)
        setStats(null)
        setErrors([])

        const file = acceptedFiles[0]
        const reader = new FileReader()
        
        reader.onload = async (e) => {
            try {
                const text = e.target?.result as string
                
                Papa.parse(text, {
                    skipEmptyLines: true,
                    complete: async (results) => {
                        try {
                            if (!userId) {
                                throw new Error('User not authenticated')
                            }
                            if (!results.data || results.data.length < 2) {
                                throw new Error('CSV file is empty or invalid')
                            }

                            const startTime = Date.now()
                            
                            // Process with enhanced parser
                            const response = await processFile(results.data as any[][])
                            
                            const processingTime = Date.now() - startTime
                            console.log('Processing completed in:', processingTime, 'ms')
                            
                            if (response.status === 'success' && response.stats) {
                                setStats(response.stats)
                                
                                const { stats } = response
                                
                                // Show detailed success message
                                toast.success(
                                    <div className="space-y-2">
                                        <div className="font-semibold">✅ Upload Successful!</div>
                                        <div className="text-sm space-y-1">
                                            <div>• {stats.inserted} tickets processed</div>
                                            <div>• {stats.byTable.ticket_history} items imported</div>
                                            <div>• {stats.byTable.return_tickets} returns identified</div>
                                            <div>• {stats.byTable.gift_card_tickets} gift cards found</div>
                                            {stats.duplicates > 0 && (
                                                <div className="text-yellow-600">• {stats.duplicates} duplicates skipped</div>
                                            )}
                                            {stats.failed > 0 && (
                                                <div className="text-red-600">• {stats.failed} failed entries</div>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-2">
                                            Processed in {(processingTime / 1000).toFixed(1)}s
                                        </div>
                                    </div>,
                                    { duration: 10000 }
                                )
                                
                                // Store errors if any
                                if (response.failed && response.failed.length > 0) {
                                    setErrors(response.failed)
                                }
                            } else {
                                throw new Error(response.message || 'Processing failed')
                            }
                        } catch (err: any) {
                            console.error('Upload error:', err)
                            toast.error(
                                <div className="space-y-2">
                                    <div className="font-semibold">❌ Upload Failed</div>
                                    <div className="text-sm">{err.message}</div>
                                </div>
                            )
                        } finally {
                            setLoading(false)
                            setProgress(0)
                        }
                    },
                    error: (err: Error) => {
                        console.error('Parse error:', err)
                        toast.error(`❌ CSV parse failed: ${err.message}`)
                        setLoading(false)
                        setProgress(0)
                    }
                })
            } catch (err: unknown) {
                console.error('File read error:', err)
                toast.error(`❌ File read failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
                setLoading(false)
                setProgress(0)
            }
        }

        reader.onerror = () => {
            console.error('FileReader error')
            toast.error('❌ Failed to read file')
            setLoading(false)
            setProgress(0)
        }

        reader.readAsText(file)
    }, [processFile, userId])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'text/csv': ['.csv'] },
        maxFiles: 1,
    })

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                    ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}
                    ${loading ? 'cursor-not-allowed opacity-75' : ''}`}
            >
                <input {...getInputProps()} disabled={loading} />
                {loading ? (
                    <div className="space-y-4">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                        </div>
                        <p className="text-gray-600 font-medium">Processing ticket data...</p>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                                className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-sm text-gray-500 text-center">{progress}% complete</p>
                        <p className="text-xs text-gray-400 text-center">Large files are processed in chunks for optimal performance</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <p className="text-lg font-medium text-gray-700">
                            {isDragActive ? 'Drop the file here' : 'Drag & drop a CSV file here, or click to select'}
                        </p>
                        <p className="text-sm text-gray-500">Only CSV files are accepted</p>
                    </div>
                )}
            </div>

            {/* Results Summary */}
            {stats && !loading && (
                <div className="mt-6 space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-green-900">Upload Complete</h3>
                                <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-600">Total Tickets:</span>
                                        <span className="ml-2 font-medium">{stats.inserted}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Items:</span>
                                        <span className="ml-2 font-medium">{stats.byTable.ticket_history}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Returns:</span>
                                        <span className="ml-2 font-medium">{stats.byTable.return_tickets}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Gift Cards:</span>
                                        <span className="ml-2 font-medium">{stats.byTable.gift_card_tickets}</span>
                                    </div>
                                </div>
                                {stats.duplicates > 0 && (
                                    <div className="mt-2 text-sm text-yellow-700 bg-yellow-50 rounded p-2">
                                        <Info className="inline w-4 h-4 mr-1" />
                                        {stats.duplicates} duplicate tickets were skipped
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Error Details */}
                    {errors.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                                <div className="flex-1">
                                    <h3 className="font-semibold text-red-900">Some entries failed</h3>
                                    <p className="text-sm text-red-700 mt-1">
                                        {errors.length} entries could not be processed. Common issues include:
                                    </p>
                                    <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                                        <li>Invalid ticket numbers</li>
                                        <li>Missing required fields</li>
                                        <li>Malformed data</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
} 