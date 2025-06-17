'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import Papa from 'papaparse'
import { toast } from 'sonner'
import { useMutation } from 'convex/react'
import { api } from '@/../convex/_generated/api'
import { useAuth } from '@clerk/react-router'
import { AlertCircle, CheckCircle } from 'lucide-react'

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
    const [uniqueTicketCount, setUniqueTicketCount] = useState<number | null>(null)
    const [transactionSum, setTransactionSum] = useState<number | null>(null)
    const [errors, setErrors] = useState<any[]>([])
    const { userId } = useAuth()
    
    // Use the two-step approach: parse then insert in batches
    const parseTickets = useMutation(api.ticketParserFixed.parseTicketsOnly)
    const insertBatch = useMutation(api.ticketParserFixed.insertTicketsBatch)
    const createUploadRecord = useMutation(api.ticketMutations.createTicketUploadRecord)
    const triggerMetricsUpdate = useMutation(api.dashboardCache.triggerMetricsUpdate)

    const processFile = useCallback(async (rows: any[][]) => {
        try {
            if (!userId) {
                throw new Error('User not authenticated')
            }

            const totalRows = rows.length
            toast.info(`Processing ${totalRows.toLocaleString()} rows...`, { id: 'processing' })
            setProgress(10)

            // Step 1: Parse with larger, safer chunks
            const PARSE_CHUNK_SIZE = 8000 // Use larger chunks
            const allEntries: any[] = []
            let totalTickets = 0
            const allErrors: any[] = []
            let dynamicProductNames: Record<string, string> = {}

            let chunkNum = 0
            for (let i = 0; i < totalRows; i += PARSE_CHUNK_SIZE) {
                const chunkEndIndex = Math.min(i + PARSE_CHUNK_SIZE, totalRows)
                const chunk = rows.slice(i, chunkEndIndex)
                chunkNum++
                const totalChunks = Math.ceil(totalRows / PARSE_CHUNK_SIZE)
                
                const parseProgress = 10 + Math.round((i / totalRows) * 30)
                setProgress(parseProgress)
                toast.info(`Parsing chunk ${chunkNum}/${totalChunks}...`, { id: 'processing' })

                const parseResponse = await parseTickets({
                    rows: chunk,
                    dynamicProductNames
                })

                if (parseResponse.status !== 'success') {
                    throw new Error(`Parsing chunk ${chunkNum} failed: ${parseResponse.message}`)
                }

                allEntries.push(...(parseResponse.entries || []))
                totalTickets += (parseResponse.totalTickets || 0)
                allErrors.push(...(parseResponse.errors || []))
                
                // Update dynamic product names for next chunk
                if (parseResponse.newProductNames) {
                    dynamicProductNames = { ...dynamicProductNames, ...parseResponse.newProductNames }
                }
            }

            toast.info(`Parsed ${totalTickets} tickets (${allEntries.length} entries). Inserting...`, { id: 'processing' })
            setProgress(45)

            // Step 2: Insert in batches to stay under Convex limits
            const BATCH_SIZE = 6000 // Stay well under 8192 limit
            const totalBatches = Math.ceil(allEntries.length / BATCH_SIZE)
            
            let totalStats = {
                total: totalTickets,
                inserted: 0,
                failed: 0,
                duplicates: 0,
                byTable: {
                    ticket_history: 0,
                    return_tickets: 0,
                    gift_card_tickets: 0
                }
            }
            let finalErrors: any[] = [...allErrors] // Include parsing errors
            
            // Calculate unique tickets and transaction sum following same logic as getTicketStats
            // NOTE: If a ticket has no items and no gift cards, it won't appear in allEntries,
            // so we can't include its transaction_total. This may cause a discrepancy between
            // totalTickets (all parsed tickets) and the tickets we can calculate totals for.
            const ticketTotals = new Map<string, number>()
            const salesTickets = new Set<string>()
            const returnTickets = new Set<string>()
            const giftCardsByTicket = new Map<string, number>()
            const allTicketNumbers = new Set<string>()
            
            // Process all entries to build ticket totals
            allEntries.forEach(entry => {
                const ticketNum = entry.ticket_number
                if (!ticketNum) return
                
                allTicketNumbers.add(ticketNum)
                
                if (entry.type === 'sale') {
                    salesTickets.add(ticketNum)
                    // IMPORTANT: Only set the transaction total ONCE per ticket to avoid any duplication
                    if (!ticketTotals.has(ticketNum)) {
                        const total = entry.transaction_total || 0
                        ticketTotals.set(ticketNum, total)
                    }
                } else if (entry.type === 'return') {
                    returnTickets.add(ticketNum)
                    // ONLY add transaction total if this ticket doesn't exist in sales table
                    // This prevents double-counting when same ticket has both sales and returns
                    if (!salesTickets.has(ticketNum)) {
                        if (!ticketTotals.has(ticketNum)) {
                            const total = entry.transaction_total || 0
                            ticketTotals.set(ticketNum, total)
                        }
                    }
                } else if (entry.type === 'gift_card') {
                    // Accumulate gift card amounts per ticket
                    const current = giftCardsByTicket.get(ticketNum) || 0
                    giftCardsByTicket.set(ticketNum, current + (entry.giftcard_amount || 0))
                }
            })
            
            // Process each unique gift card ticket
            giftCardsByTicket.forEach((totalGiftAmount, ticketNum) => {
                allTicketNumbers.add(ticketNum)
                
                if (salesTickets.has(ticketNum)) {
                    // Ticket exists in sales - DON'T add gift card amount
                    // The transaction_total from ticket_history should already include gift cards
                } else if (returnTickets.has(ticketNum)) {
                    // Ticket exists in returns - DON'T add gift card amount
                    // The transaction_total from return_tickets should already include gift cards
                } else {
                    // Pure gift card ticket (no sales or returns) - use total gift card amount as transaction total
                    ticketTotals.set(ticketNum, totalGiftAmount)
                    console.log(`📌 Gift card only ticket: ${ticketNum}, amount: $${totalGiftAmount}`)
                }
            })
            
            // Calculate total transaction amount from unique tickets
            let totalTransactionAmount = 0
            ticketTotals.forEach(total => {
                totalTransactionAmount += total
            })
            
            // Find tickets that were parsed but don't have transaction totals
            const ticketsWithEntries = new Set<string>()
            allEntries.forEach(entry => {
                if (entry.ticket_number) {
                    ticketsWithEntries.add(entry.ticket_number)
                }
            })
            
            // Check if there are any tickets missing from our calculation
            const missingTickets = Array.from(ticketsWithEntries).filter(ticket => !ticketTotals.has(ticket))
            
            // Debug logging
            console.log('🔍 Transaction sum calculation debug:', {
                totalTicketsParsed: totalTickets,
                ticketsWithEntries: ticketsWithEntries.size,
                ticketTotalsSize: ticketTotals.size,
                salesTickets: salesTickets.size,
                returnTickets: returnTickets.size,
                giftCardOnlyTickets: Array.from(giftCardsByTicket.keys()).filter(t => !salesTickets.has(t) && !returnTickets.has(t)).length,
                totalTransactionAmount: totalTransactionAmount,
                missingTickets: missingTickets.length > 0 ? missingTickets : 'None'
            })
            
            // Log details about missing tickets
            if (missingTickets.length > 0) {
                missingTickets.forEach(ticketNum => {
                    const ticketEntries = allEntries.filter(e => e.ticket_number === ticketNum)
                    console.log(`❌ Missing ticket ${ticketNum}:`, {
                        entryCount: ticketEntries.length,
                        entryTypes: ticketEntries.map(e => e.type),
                        transactionTotals: ticketEntries.map(e => e.transaction_total),
                        giftCardAmounts: ticketEntries.filter(e => e.type === 'gift_card').map(e => e.giftcard_amount)
                    })
                })
            }
            
            const uniqueTicketCount = allTicketNumbers.size
            const transactionSum = totalTransactionAmount

            for (let i = 0; i < allEntries.length; i += BATCH_SIZE) {
                const batch = allEntries.slice(i, Math.min(i + BATCH_SIZE, allEntries.length))
                const batchNumber = Math.floor(i / BATCH_SIZE) + 1
                
                const progress = 45 + Math.round((i / allEntries.length) * 55)
                setProgress(progress)
                toast.info(`Inserting batch ${batchNumber}/${totalBatches}...`, { id: 'processing' })

                const insertResponse = await insertBatch({
                    entries: batch,
                    batchInfo: {
                        batchNumber,
                        totalBatches
                    }
                })

                if (insertResponse.status === 'success') {
                    totalStats.inserted += insertResponse.stats.inserted
                    totalStats.failed += insertResponse.stats.failed
                    totalStats.byTable.ticket_history += insertResponse.stats.byTable.ticket_history
                    totalStats.byTable.return_tickets += insertResponse.stats.byTable.return_tickets
                    totalStats.byTable.gift_card_tickets += insertResponse.stats.byTable.gift_card_tickets
                    finalErrors.push(...insertResponse.errors)
                } else {
                    throw new Error(`Batch ${batchNumber} failed`)
                }
            }

            setProgress(100)

            // Create upload record for dashboard
            try {
                const storesAffected = Array.from(new Set(allEntries.map(e => e.store_id).filter(Boolean)))
                await createUploadRecord({
                    upload_name: `Ticket Upload - ${new Date().toLocaleDateString()}`,
                    total_tickets: totalTickets,
                    total_entries: totalStats.inserted,
                    stores_affected: storesAffected,
                    status: finalErrors.length > 0 ? 'partial' : 'success'
                })
            } catch (error) {
                console.warn('Failed to create upload record:', error)
            }

            // Trigger dashboard metrics recalculation
            try {
                await triggerMetricsUpdate({})
                console.log('✅ Triggered dashboard metrics update')
            } catch (error) {
                console.warn('Failed to trigger metrics update:', error)
            }

            return {
                status: 'success' as const,
                stats: totalStats,
                errors: finalErrors,
                message: `Successfully processed ${totalStats.inserted} entries from ${totalTickets} tickets`,
                uniqueTicketCount,
                transactionSum
            }

        } catch (err) {
            console.error('Processing error:', err)
            throw err
        }
    }, [parseTickets, insertBatch, createUploadRecord, triggerMetricsUpdate, userId])

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (!acceptedFiles[0]) {
            toast.error('❌ No file selected')
            return
        }

        setLoading(true)
        setProgress(0)
        setStats(null)
        setUniqueTicketCount(null)
        setTransactionSum(null)
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
                                setUniqueTicketCount(response.uniqueTicketCount)
                                setTransactionSum(response.transactionSum)
                                
                                const { stats } = response
                                
                                console.log('Upload successful, showing toast with:', {
                                    uniqueTickets: response.uniqueTicketCount,
                                    transactionSum: response.transactionSum,
                                    stats
                                })
                                
                                // Dismiss processing toast and show detailed success message
                                toast.dismiss('processing')
                                toast.success(
                                    <div className="space-y-2">
                                        <div className="font-semibold">✅ Upload Successful!</div>
                                        <div className="text-sm space-y-1">
                                            <div>• {stats.total} tickets processed</div>
                                            <div>• Transaction Total: ${response.transactionSum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
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
                                    { duration: 10000, id: 'upload-success' }
                                )
                                
                                // Store errors if any
                                if (response.errors && response.errors.length > 0) {
                                    setErrors(response.errors)
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

        </div>
    )
} 