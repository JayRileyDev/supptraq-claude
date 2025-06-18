import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Package, TrendingUp, Filter, FileText, Trash2, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Badge } from "~/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Progress } from "~/components/ui/progress";
import { cn } from "~/lib/utils";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { PageAccessGuard } from "~/components/access/PageAccessGuard";

function InventoryPageContent() {
  const [filters, setFilters] = useState({
    storeId: "all",
    vendor: "all",
    uploadId: "all"
  });
  
  const [reportStore, setReportStore] = useState("");
  const [editedLines, setEditedLines] = useState<Map<string, any>>(new Map());
  const [removedLines, setRemovedLines] = useState<Set<string>>(new Set());
  
  // Deletion progress state
  const [deletionProgress, setDeletionProgress] = useState({
    isDeleting: false,
    currentStep: "",
    totalLines: 0,
    deletedLines: 0,
    totalLogs: 0,
    deletedLogs: 0,
    showProgress: false
  });

  // Queries
  const inventoryFilters = useQuery(api.inventoryQueries.getInventoryFilters);

  // Separate state for Create Report section
  const [reportUploadId, setReportUploadId] = useState("");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  // Pagination state for report table
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  
  const inventoryData = useQuery(
    api.inventoryQueries.getInventoryDataForReport,
    reportUploadId && reportUploadId !== "" && reportStore && reportStore !== ""
      ? { 
          uploadId: reportUploadId,
          storeId: reportStore
        } 
      : "skip"
  );

  // Get vendor/brand mapping for the current upload
  const uploadInfo = inventoryFilters?.uploads.find(upload => upload.id === reportUploadId);
  const primaryVendor = uploadInfo?.vendor;
  
  const uploadOverview = useQuery(
    api.inventoryQueries.getUploadOverview,
    { 
      uploadId: filters.uploadId !== "all" ? filters.uploadId : undefined,
      storeId: filters.storeId !== "all" ? filters.storeId : undefined
    }
  );

  // Mutations
  const updateInventoryLine = useMutation(api.inventoryMutations.updateInventoryLine);
  const deleteInventoryLinesBatch = useMutation(api.inventoryMutations.deleteInventoryLinesBatch);
  const deleteTransferLogsBatch = useMutation(api.inventoryMutations.deleteTransferLogsBatch);
  const deleteUploadRecord = useMutation(api.inventoryMutations.deleteUploadRecord);

  // Handle quantity updates
  const handleQuantityUpdate = useCallback((lineId: string, field: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setEditedLines(prev => {
      const currentEdits = prev.get(lineId) || {};
      const newEdits = new Map(prev);
      newEdits.set(lineId, { ...currentEdits, [field]: numValue });
      return newEdits;
    });
  }, []);

  // Save changes to database
  const saveChanges = useCallback(async (lineId: string) => {
    setEditedLines(prev => {
      const edits = prev.get(lineId);
      if (!edits) return prev;

      updateInventoryLine({
        lineId,
        updates: edits
      }).then(() => {
        // Clear edits for this line after successful save
        setEditedLines(current => {
          const newEdits = new Map(current);
          newEdits.delete(lineId);
          return newEdits;
        });
      }).catch(error => {
        console.error("Failed to save changes:", error);
      });

      return prev;
    });
  }, [updateInventoryLine]);

  // Handle line removal
  const handleRemoveLine = useCallback((lineId: string) => {
    setRemovedLines(prev => {
      const newRemoved = new Set(prev);
      if (newRemoved.has(lineId)) {
        newRemoved.delete(lineId);
      } else {
        newRemoved.add(lineId);
      }
      return newRemoved;
    });
  }, []);

  // Calculate paginated data
  const paginatedData = useMemo(() => {
    if (!inventoryData?.inventoryLines) return { items: [], totalPages: 0, totalItems: 0 };
    
    const filteredItems = inventoryData.inventoryLines.filter(line => !removedLines.has(line._id));
    const totalItems = filteredItems.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const items = filteredItems.slice(startIndex, endIndex);
    
    return { items, totalPages, totalItems };
  }, [inventoryData?.inventoryLines, removedLines, currentPage, itemsPerPage]);

  // Pre-render the table rows to avoid conditional hooks
  const tableRows = useMemo(() => 
    paginatedData.items.map((line, index) => {
      const edits = editedLines.get(line._id) || {};
      const hasEdits = Object.keys(edits).length > 0;
  
      return (
        <motion.tr
          key={line._id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.3 }}
          className={cn(
            "border-b border-border/50 hover:bg-muted/30 transition-colors duration-200",
            hasEdits && "bg-primary/5"
          )}
        >
          <td className="py-3 px-4 text-sm">{line.item_number}</td>
          <td className="py-3 px-4">
            <p className="font-medium text-sm">{line.product_name}</p>
          </td>
          <td className="py-3 px-4 text-center text-sm">{line.qty_sold}</td>
          <td className="py-3 px-4 text-center text-sm">{line.qty_on_hand}</td>
          <td className="py-3 px-4">
            <Input
              type="number"
              min="0"
              value={edits.transfer_in_qty ?? line.transfer_in_qty}
              onChange={(e) => handleQuantityUpdate(line._id, "transfer_in_qty", e.target.value)}
              onBlur={() => Object.keys(editedLines.get(line._id) || {}).length > 0 && saveChanges(line._id)}
              className="w-20 mx-auto text-center"
            />
          </td>
          <td className="py-3 px-4">
            <Input
              type="number"
              min="0"
              value={edits.transfer_out_qty ?? line.transfer_out_qty}
              onChange={(e) => handleQuantityUpdate(line._id, "transfer_out_qty", e.target.value)}
              onBlur={() => Object.keys(editedLines.get(line._id) || {}).length > 0 && saveChanges(line._id)}
              className="w-20 mx-auto text-center"
            />
          </td>
          <td className="py-3 px-4">
            <Input
              type="number"
              min="0"
              value={edits.suggested_reorder_qty ?? line.suggested_reorder_qty}
              onChange={(e) => handleQuantityUpdate(line._id, "suggested_reorder_qty", e.target.value)}
              onBlur={() => Object.keys(editedLines.get(line._id) || {}).length > 0 && saveChanges(line._id)}
              className="w-20 mx-auto text-center"
            />
          </td>
          <td className="py-3 px-4 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveLine(line._id)}
              className={cn(
                "hover:text-destructive",
                removedLines.has(line._id) && "text-destructive"
              )}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </td>
        </motion.tr>
      );
    }), [paginatedData.items, editedLines, handleQuantityUpdate, saveChanges, handleRemoveLine, removedLines]);

  // Reset page when upload changes
  useEffect(() => {
    setCurrentPage(1);
  }, [reportUploadId]);

  // Keyboard navigation for pagination
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!inventoryData || paginatedData.totalPages <= 1) return;
      
      // Only handle arrow keys when not focused on an input
      if (document.activeElement?.tagName === 'INPUT') return;
      
      if (event.key === 'ArrowLeft' && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
        event.preventDefault();
      } else if (event.key === 'ArrowRight' && currentPage < paginatedData.totalPages) {
        setCurrentPage(prev => prev + 1);
        event.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [currentPage, paginatedData.totalPages, inventoryData]);

  // Handle upload deletion
  const handleDeleteUpload = useCallback(async (uploadId: string) => {
    
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this upload and all associated inventory lines? This action cannot be undone."
    );
    
    if (!confirmDelete) return;
    
    // Initialize progress tracking
    setDeletionProgress({
      isDeleting: true,
      currentStep: "Estimating data to delete...",
      totalLines: 0,
      deletedLines: 0,
      totalLogs: 0,
      deletedLogs: 0,
      showProgress: true
    });
    
    try {
      let totalDeletedLines = 0;
      let totalDeletedLogs = 0;
      
      // Estimate total counts for better progress tracking
      setDeletionProgress(prev => ({
        ...prev,
        currentStep: "Deleting inventory lines..."
      }));
      
      // Delete inventory lines in batches
      while (true) {
        const result = await deleteInventoryLinesBatch({ uploadId });
        totalDeletedLines += result.deletedCount;
        
        setDeletionProgress(prev => ({
          ...prev,
          deletedLines: totalDeletedLines,
          currentStep: `Deleting inventory lines... (${totalDeletedLines} deleted)`
        }));
        
        if (!result.hasMore) break;
      }
      
      // Delete transfer logs in batches
      setDeletionProgress(prev => ({
        ...prev,
        currentStep: "Deleting transfer logs..."
      }));
      
      while (true) {
        const result = await deleteTransferLogsBatch({ uploadId });
        totalDeletedLogs += result.deletedCount;
        
        setDeletionProgress(prev => ({
          ...prev,
          deletedLogs: totalDeletedLogs,
          currentStep: `Deleting transfer logs... (${totalDeletedLogs} deleted)`
        }));
        
        if (!result.hasMore) break;
      }
      
      // Finally delete the upload record
      setDeletionProgress(prev => ({
        ...prev,
        currentStep: "Finalizing deletion..."
      }));
      
      await deleteUploadRecord({ uploadId });
      
      // Reset form state if the deleted upload was currently selected
      if (reportUploadId === uploadId) {
        setReportUploadId("");
        setReportStore("");
        setEditedLines(new Map());
        setRemovedLines(new Set());
      }
      
      // Reset filters if the deleted upload was selected there
      if (filters.uploadId === uploadId) {
        setFilters(prev => ({ ...prev, uploadId: "all" }));
      }
      
      // Show completion
      setDeletionProgress(prev => ({
        ...prev,
        currentStep: "Deletion completed!",
        isDeleting: false
      }));
      
      // Close progress dialog after a short delay
      setTimeout(() => {
        setDeletionProgress(prev => ({ ...prev, showProgress: false }));
        alert(`Upload deleted successfully! Removed ${totalDeletedLines} inventory lines and ${totalDeletedLogs} transfer logs.`);
      }, 1500);
      
    } catch (error) {
      console.error("Failed to delete upload:", error);
      setDeletionProgress(prev => ({
        ...prev,
        isDeleting: false,
        currentStep: "Deletion failed",
        showProgress: false
      }));
      alert("Failed to delete upload. Please try again.");
    }
  }, [deleteInventoryLinesBatch, deleteTransferLogsBatch, deleteUploadRecord, reportUploadId, filters.uploadId]);

  // Generate PDF Report
  // Add transfer logs query - commented out for now since this query needs to be updated
  // const transferLogsData = useQuery(
  //   api.inventoryQueries.getTransferLogsForReport,
  //   reportUploadId && reportStore
  //     ? { uploadId: reportUploadId, storeId: reportStore }
  //     : "skip"
  // );

  const generateReport = useCallback(async () => {
    try {
      if (!reportStore || !inventoryData) {
        console.warn("Missing required data for report generation");
        return;
      }

      setIsGeneratingPDF(true);

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Professional color palette (sophisticated & print-friendly)
      const navyBlue: [number, number, number] = [25, 42, 86];         // Deep professional navy
      const charcoalGray: [number, number, number] = [55, 65, 81];     // Elegant charcoal  
      const steelBlue: [number, number, number] = [71, 85, 105];       // Muted steel blue
      const lightGray: [number, number, number] = [248, 250, 252];     // Clean background
      const mutedBlue: [number, number, number] = [226, 232, 240];     // Very subtle blue tint
      const darkText: [number, number, number] = [15, 23, 42];         // Rich dark text
      const mediumGray: [number, number, number] = [100, 116, 139];    // Professional gray
      
      // Add small icon logo in top right corner
      const addIconLogo = async () => {
        try {
          // Use the icon SVG instead of full logo
          const response = await fetch('/Logos/Supptraq Black Transparent Icon SVG.svg');
          const svgText = await response.text();
          
          const img = new Image();
          const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
          const url = URL.createObjectURL(svgBlob);
          
          return new Promise((resolve, reject) => {
            img.onload = () => {
              try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                if (!ctx) {
                  throw new Error('Could not get canvas context');
                }
                
                // Square icon at high resolution
                const scale = 3;
                canvas.width = 60 * scale;
                canvas.height = 60 * scale;
                
                ctx.scale(scale, scale);
                ctx.drawImage(img, 0, 0, 60, 60);
                
                const dataURL = canvas.toDataURL('image/png', 1.0);
                // Position in top left corner, smaller size
                doc.addImage(dataURL, 'PNG', 15, 8, 15, 15);
                
                URL.revokeObjectURL(url);
                resolve(true);
              } catch (error) {
                reject(error);
              }
            };
            
            img.onerror = () => reject(new Error('Failed to load icon'));
            img.src = url;
          });
        } catch (error) {
          throw error;
        }
      };

      // Try to add icon logo
      try {
        await addIconLogo();
      } catch (error) {
        console.warn('Icon loading failed:', error);
        // Small text fallback in left corner
        doc.setTextColor(...mediumGray);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text("SUPPTRAQ", 15, 18, { align: "left" });
      }
      
      // Get brand name from vendor mapping - using primaryVendor as fallback since vendorBrandInfo is commented out
      const brandName = primaryVendor || "Unknown Vendor";
      
      // Filter out removed lines and apply edits
      const reportData = inventoryData.inventoryLines
        .filter(line => !removedLines.has(line._id))
        .map(line => {
          const edits = editedLines.get(line._id) || {};
          return {
            item_number: line.item_number,
            product_name: line.product_name,
            qty_sold: line.qty_sold,
            qty_on_hand: line.qty_on_hand,
            transfer_in_qty: edits.transfer_in_qty ?? line.transfer_in_qty,
            transfer_out_qty: edits.transfer_out_qty ?? line.transfer_out_qty,
            suggested_reorder_qty: edits.suggested_reorder_qty ?? line.suggested_reorder_qty
          };
        });

      // Brand/Vendor name at the top
      doc.setTextColor(navyBlue[0], navyBlue[1], navyBlue[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text(brandName, pageWidth / 2, 25, { align: "center" });
      
      // Report title
      doc.setTextColor(darkText[0], darkText[1], darkText[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(`Inventory Ordering Report – ${reportStore}`, pageWidth / 2, 38, { align: "center" });
      
      // Report metadata
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(mediumGray[0], mediumGray[1], mediumGray[2]);
      const reportDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.text(`Generated: ${reportDate}`, pageWidth / 2, 48, { align: "center" });
      
      // Clean separator line
      doc.setDrawColor(steelBlue[0], steelBlue[1], steelBlue[2]);
      doc.setLineWidth(0.5);
      doc.line(40, 55, pageWidth - 40, 55);

      // Section 1: Ordering Report
      doc.setTextColor(navyBlue[0], navyBlue[1], navyBlue[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Section 1: Items Requiring Reorder", 20, 70);
      
      const orderingData = reportData
        .filter(item => item.suggested_reorder_qty > 0)
        .map(item => [
          item.item_number,
          item.product_name,
          item.qty_sold.toString(),
          item.qty_on_hand.toString(),
          item.transfer_in_qty.toString(),
          item.suggested_reorder_qty.toString()
        ]);

      if (orderingData.length > 0) {
        autoTable(doc, {
          startY: 75,
          head: [['Item #', 'Product Name', 'Sold', 'On Hand', 'Transfer In', 'Reorder']],
          body: orderingData,
          theme: 'plain',
          styles: {
            fontSize: 8,
            cellPadding: { top: 4, right: 5, bottom: 4, left: 5 },
            font: 'helvetica',
            textColor: darkText,
            lineColor: [210, 214, 220],
            lineWidth: 0.3
          },
          headStyles: {
            fillColor: charcoalGray,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 8,
            halign: 'center',
            cellPadding: { top: 5, right: 5, bottom: 5, left: 5 }
          },
          alternateRowStyles: {
            fillColor: [252, 252, 253]
          },
          columnStyles: {
            0: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
            1: { cellWidth: 65 },
            2: { cellWidth: 18, halign: 'center' },
            3: { cellWidth: 18, halign: 'center' },
            4: { cellWidth: 30, halign: 'center', fillColor: [240, 253, 244] }, // Light green for Transfer In
            5: { cellWidth: 22, halign: 'center', fillColor: mutedBlue, fontStyle: 'bold' }
          },
          margin: { left: 15, right: 15 }
        });
      } else {
        doc.setTextColor(mediumGray[0], mediumGray[1], mediumGray[2]);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(10);
        doc.text("No items require reordering at this time.", 20, 85);
      }

      // Section 2: Transfer Report  
      let finalY = 75;
      if ((doc as any).lastAutoTable && (doc as any).lastAutoTable.finalY) {
        finalY = (doc as any).lastAutoTable.finalY;
      }
      
      doc.setTextColor(navyBlue[0], navyBlue[1], navyBlue[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Section 2: Transfer Activity", 20, finalY + 20);
      
      // Create detailed transfer lines - one line per transfer
      const transferLines: Array<{
        item_number: string;
        product_name: string;
        qty_sold: number;
        qty_on_hand: number;
        transfer_type: 'IN' | 'OUT';
        transfer_qty: number;
        from_store: string;
        to_store: string;
      }> = [];
      
      // Create a map of items for quick lookup
      const itemDataMap = new Map<string, {
        product_name: string;
        qty_on_hand: number;
        qty_sold: number;
      }>();
      reportData.forEach(item => {
        itemDataMap.set(item.item_number, {
          product_name: item.product_name,
          qty_on_hand: item.qty_on_hand,
          qty_sold: item.qty_sold
        });
      });
      
      // Process transfer logs to create individual lines - commented out since transferLogsData is not available
      // if (transferLogsData) {
      //   transferLogsData.forEach(log => {
      //     const itemData = itemDataMap.get(log.item_number);
      //     if (itemData) {
      //       // Create a line for each transfer in
      //       log.transfers_in.forEach((transfer: any) => {
      //         transferLines.push({
      //           item_number: log.item_number,
      //           product_name: log.product_name,
      //           qty_sold: itemData.qty_sold,
      //           qty_on_hand: itemData.qty_on_hand,
      //           transfer_type: 'IN',
      //           transfer_qty: transfer.qty,
      //           from_store: transfer.from_store,
      //           to_store: reportStore
      //         });
      //       });
      //       
      //       // Create a line for each transfer out
      //       log.transfers_out.forEach((transfer: any) => {
      //         transferLines.push({
      //           item_number: log.item_number,
      //           product_name: log.product_name,
      //           qty_sold: itemData.qty_sold,
      //           qty_on_hand: itemData.qty_on_hand,
      //           transfer_type: 'OUT',
      //           transfer_qty: transfer.qty,
      //           from_store: reportStore,
      //           to_store: transfer.to_store
      //         });
      //       });
      //     }
      //   });
      // }
      
      // If no transfer logs data, fall back to showing items with transfers (without store details)
      if (transferLines.length === 0) {
        reportData
          .filter(item => item.transfer_in_qty > 0 || item.transfer_out_qty > 0)
          .forEach(item => {
            if (item.transfer_in_qty > 0) {
              transferLines.push({
                item_number: item.item_number,
                product_name: item.product_name,
                qty_sold: item.qty_sold,
                qty_on_hand: item.qty_on_hand,
                transfer_type: 'IN',
                transfer_qty: item.transfer_in_qty,
                from_store: 'TBD',
                to_store: reportStore
              });
            }
            if (item.transfer_out_qty > 0) {
              transferLines.push({
                item_number: item.item_number,
                product_name: item.product_name,
                qty_sold: item.qty_sold,
                qty_on_hand: item.qty_on_hand,
                transfer_type: 'OUT',
                transfer_qty: item.transfer_out_qty,
                from_store: reportStore,
                to_store: 'TBD'
              });
            }
          });
      }
      
      // Sort by item number and transfer type
      transferLines.sort((a, b) => {
        if (a.item_number !== b.item_number) {
          return a.item_number.localeCompare(b.item_number);
        }
        return a.transfer_type === 'IN' ? -1 : 1;
      });
      
      // Convert to table data
      const transferData = transferLines.map(line => [
        line.item_number,
        line.product_name,
        line.qty_sold.toString(),
        line.qty_on_hand.toString(),
        line.transfer_type,
        line.transfer_qty.toString(),
        line.from_store,
        line.to_store
      ]);

      if (transferData.length > 0) {
        autoTable(doc, {
          startY: finalY + 25,
          head: [['Item #', 'Product Name', 'Qty Sold', 'On Hand', 'Type', 'Transfer Qty', 'From Store', 'To Store']],
          body: transferData,
          theme: 'plain',
          styles: {
            fontSize: 7,
            cellPadding: { top: 2, right: 3, bottom: 2, left: 3 },
            font: 'helvetica',
            textColor: darkText,
            lineColor: [210, 214, 220],
            lineWidth: 0.3
          },
          headStyles: {
            fillColor: charcoalGray,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 7,
            halign: 'center',
            cellPadding: { top: 3, right: 3, bottom: 3, left: 3 }
          },
          alternateRowStyles: {
            fillColor: [252, 252, 253]
          },
          columnStyles: {
            0: { cellWidth: 18, halign: 'center', fontStyle: 'bold' }, // Item #
            1: { cellWidth: 50 }, // Product Name
            2: { cellWidth: 15, halign: 'center' }, // Qty Sold
            3: { cellWidth: 15, halign: 'center' }, // On Hand
            4: { cellWidth: 12, halign: 'center', fontStyle: 'bold' }, // Type (IN/OUT)
            5: { cellWidth: 20, halign: 'center', fontStyle: 'bold' }, // Transfer Qty
            6: { cellWidth: 22, halign: 'center' }, // From Store
            7: { cellWidth: 22, halign: 'center' }  // To Store
          },
          didParseCell: function(data) {
            // Only apply styling to body cells, not header cells
            if (data.row.section === 'body') {
              // Color code the Type column
              if (data.column.index === 4 && data.cell.raw) {
                if (data.cell.raw === 'IN') {
                  data.cell.styles.fillColor = [240, 253, 244]; // Light green
                  data.cell.styles.textColor = [34, 197, 94]; // Green text
                } else if (data.cell.raw === 'OUT') {
                  data.cell.styles.fillColor = [254, 242, 242]; // Light red
                  data.cell.styles.textColor = [239, 68, 68]; // Red text
                }
              }
              // Highlight transfer quantity
              if (data.column.index === 5) {
                data.cell.styles.fillColor = [243, 244, 246]; // Light gray background
              }
            }
          },
          margin: { left: 15, right: 15 }
        });
      } else {
        doc.setTextColor(mediumGray[0], mediumGray[1], mediumGray[2]);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(10);
        doc.text("No transfer activity for this period.", 20, finalY + 30);
      }
      
      // Check if we need to add a new page for the footer
      let currentY = finalY + 30;
      if ((doc as any).lastAutoTable && (doc as any).lastAutoTable.finalY) {
        currentY = (doc as any).lastAutoTable.finalY;
      }
      
      // Add footer with proper spacing
      const footerSpacing = 35; // Space needed for footer
      if (currentY > pageHeight - footerSpacing) {
        doc.addPage();
        currentY = 20;
      }
      
      // Professional footer
      const footerY = pageHeight - 20;
      doc.setDrawColor(steelBlue[0], steelBlue[1], steelBlue[2]);
      doc.setLineWidth(0.5);
      doc.line(20, footerY - 8, pageWidth - 20, footerY - 8);
      
      doc.setTextColor(mediumGray[0], mediumGray[1], mediumGray[2]);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("SUPPTRAQ Professional Inventory Management System", 20, footerY);
      
      doc.setFont("helvetica", "bold");
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.text(`Page ${pageCount}`, pageWidth - 20, footerY, { align: "right" });
      
      // Add subtle company details
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(mediumGray[0], mediumGray[1], mediumGray[2]);
      const currentDate = new Date().toISOString().split('T')[0];
      doc.text(`Confidential Business Report • ${currentDate}`, pageWidth / 2, footerY + 8, { align: "center" });

      // Save the PDF
      const fileName = `SUPPTRAQ-Ordering-Report-${reportStore}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      setIsGeneratingPDF(false);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please check console for details.");
      setIsGeneratingPDF(false);
    }
  }, [reportStore, inventoryData, reportUploadId, editedLines, removedLines]);

  return (
    <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 min-h-screen bg-gradient-to-br from-background via-background to-background/50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-foreground mb-2 glow-text">
          Inventory Management
        </h1>
        <p className="text-muted-foreground">
          Review inventory and generate ordering reports by upload
        </p>
      </motion.div>

      {/* Filter Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <Card className="glow-card card-shadow border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Filter className="h-5 w-5 text-primary" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Store
                </label>
                <Select value={filters.storeId} onValueChange={(value) => setFilters(prev => ({ ...prev, storeId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All stores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All stores</SelectItem>
                    {inventoryFilters?.stores.map(store => (
                      <SelectItem key={store} value={store}>{store}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Vendor
                </label>
                <Select value={filters.vendor} onValueChange={(value) => setFilters(prev => ({ ...prev, vendor: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All vendors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All vendors</SelectItem>
                    {inventoryFilters?.vendors.map(vendor => (
                      <SelectItem key={vendor} value={vendor}>{vendor}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Upload
                </label>
                <div className="flex gap-2">
                  <Select 
                    value={filters.uploadId} 
                    onValueChange={(value) => {
                      setFilters(prev => ({ ...prev, uploadId: value }));
                      // Reset report store when upload changes
                      setReportStore("");
                      setEditedLines(new Map());
                      setRemovedLines(new Set());
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All uploads" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All uploads</SelectItem>
                      {inventoryFilters?.uploads
                        .filter(upload => !filters.vendor || filters.vendor === "all" || upload.vendor === filters.vendor)
                        .map(upload => (
                          <SelectItem key={upload.id} value={upload.id}>
                            {upload.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {filters.uploadId !== "all" && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteUpload(filters.uploadId)}
                      className="px-3"
                      title="Delete this upload and all its data"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Upload Overview Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <Card className="glow-card card-shadow border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Package className="h-5 w-5 text-primary" />
              Upload Overview
            </CardTitle>
            <CardDescription>
              {filters.uploadId !== "all" || filters.storeId !== "all" 
                ? "Filtered statistics" 
                : "Statistics across all uploads and stores"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Total Transfers */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
              <div>
                <p className="text-sm text-muted-foreground">Total Transfers</p>
                <p className="text-2xl font-bold text-foreground">
                  {uploadOverview?.transfersOutCount || 0}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary/50" />
            </div>

            {/* Top 5 Sold Items */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <div className="h-8 w-1 bg-gradient-to-b from-primary to-accent rounded-full" />
                Top 5 Sold Items
              </h3>
              <div className="space-y-2">
                {uploadOverview?.topSoldItems && uploadOverview.topSoldItems.length > 0 ? (
                  uploadOverview.topSoldItems.map((item, index) => (
                    <motion.div
                      key={item.item_number}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">#{item.item_number}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">{item.qty_sold} units</p>
                        <p className="text-sm text-primary">${item.retail_total.toFixed(2)}</p>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No sales data available</p>
                    <p className="text-sm">Select filters to view top sold items</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Create Report Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <Card className="glow-card card-shadow border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <FileText className="h-5 w-5 text-primary" />
              Create Report
            </CardTitle>
            <CardDescription>Select an upload and store to edit quantities and generate ordering report</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Upload and Store Selection for Report */}
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Select Upload *
                </label>
                <Select 
                  value={reportUploadId} 
                  onValueChange={(value) => {
                    setReportUploadId(value);
                    // Reset report store when upload changes
                    setReportStore("");
                    setEditedLines(new Map());
                    setRemovedLines(new Set());
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose upload" />
                  </SelectTrigger>
                  <SelectContent>
                    {inventoryFilters?.uploads.map(upload => (
                      <SelectItem key={upload.id} value={upload.id}>
                        {upload.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Select Store for Report *
                </label>
                <Select value={reportStore} onValueChange={setReportStore}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose store" />
                  </SelectTrigger>
                  <SelectContent>
                    {inventoryFilters?.stores.map(store => (
                      <SelectItem key={store} value={store}>{store}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={generateReport}
                disabled={!reportStore || !reportUploadId || isGeneratingPDF}
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              >
                <Download className="h-4 w-4 mr-2" />
                {isGeneratingPDF ? "Generating..." : "Generate Report"}
              </Button>
            </div>

              {/* Summary Info */}
              {inventoryData && paginatedData.totalItems > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-muted/20 rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">Total Items</p>
                    <p className="text-2xl font-bold text-foreground">{paginatedData.totalItems}</p>
                  </div>
                  <div className="bg-muted/20 rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">Items with Edits</p>
                    <p className="text-2xl font-bold text-primary">{editedLines.size}</p>
                  </div>
                  <div className="bg-muted/20 rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">Removed Items</p>
                    <p className="text-2xl font-bold text-destructive">{removedLines.size}</p>
                  </div>
                </div>
              )}

              {/* Editable Table */}
              {inventoryData ? (
                <div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 font-medium text-foreground">Item #</th>
                          <th className="text-left py-3 px-4 font-medium text-foreground">Product</th>
                          <th className="text-center py-3 px-4 font-medium text-foreground">Qty Sold</th>
                          <th className="text-center py-3 px-4 font-medium text-foreground">On Hand</th>
                          <th className="text-center py-3 px-4 font-medium text-foreground">Transfer In</th>
                          <th className="text-center py-3 px-4 font-medium text-foreground">Transfer Out</th>
                          <th className="text-center py-3 px-4 font-medium text-foreground">Reorder</th>
                          <th className="text-center py-3 px-4 font-medium text-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tableRows}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination Controls */}
              {paginatedData.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 px-2">
                  <div className="text-sm text-muted-foreground">
                    <div>Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, paginatedData.totalItems)} of {paginatedData.totalItems} items</div>
                    <div className="text-xs opacity-75 mt-1">Use ← → arrow keys to navigate pages</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, paginatedData.totalPages) }, (_, i) => {
                        let pageNum;
                        if (paginatedData.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= paginatedData.totalPages - 2) {
                          pageNum = paginatedData.totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            className="w-8 h-8 p-0"
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(paginatedData.totalPages, prev + 1))}
                      disabled={currentPage === paginatedData.totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
                </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg mb-2">No data loaded</p>
                <p className="text-sm">Select an upload above to view and edit inventory items</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Deletion Progress Dialog */}
      <Dialog open={deletionProgress.showProgress} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Deleting Upload</DialogTitle>
            <DialogDescription>
              This may take a few moments depending on the amount of data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span className="text-muted-foreground">
                  {deletionProgress.isDeleting ? "In progress..." : "Complete"}
                </span>
              </div>
              <Progress 
                value={
                  !deletionProgress.isDeleting ? 100 :
                  deletionProgress.currentStep.includes("Estimating") ? 10 :
                  deletionProgress.currentStep.includes("inventory lines") ? 
                    Math.min(30 + (deletionProgress.deletedLines > 0 ? 30 : 0), 60) :
                  deletionProgress.currentStep.includes("transfer logs") ? 
                    Math.min(60 + (deletionProgress.deletedLogs > 0 ? 20 : 0), 80) :
                  deletionProgress.currentStep.includes("Finalizing") ? 90 : 5
                } 
                className="h-2"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {deletionProgress.currentStep}
            </div>
            {(deletionProgress.deletedLines > 0 || deletionProgress.deletedLogs > 0) && (
              <div className="text-sm space-y-1">
                {deletionProgress.deletedLines > 0 && (
                  <div>Inventory lines deleted: {deletionProgress.deletedLines}</div>
                )}
                {deletionProgress.deletedLogs > 0 && (
                  <div>Transfer logs deleted: {deletionProgress.deletedLogs}</div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function InventoryPage() {
  return (
    <PageAccessGuard pagePath="/inventory">
      <InventoryPageContent />
    </PageAccessGuard>
  );
}