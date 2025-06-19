import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Badge } from '~/components/ui/badge';
import { Autocomplete, type AutocompleteOption } from '~/components/ui/autocomplete';
import { Trash2, Plus, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface TransferLogManagerProps {
  uploadId: string;
  storeId?: string;
  onTransferLogsChange?: () => void;
}

interface TransferLog {
  _id: Id<'transfer_logs'>;
  item_number: string;
  product_name: string;
  from_store_id: string;
  to_store_id: string;
  qty: number;
  primary_vendor: string;
  box_qty?: boolean;
}

export const TransferLogManager: React.FC<TransferLogManagerProps> = ({
  uploadId,
  storeId,
  onTransferLogsChange
}) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedTransferLog, setSelectedTransferLog] = useState<TransferLog | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [itemSearchTerm, setItemSearchTerm] = useState('');

  // Form state for creating new transfer log
  const [createForm, setCreateForm] = useState({
    itemNumber: '',
    productName: '',
    fromStoreId: '',
    toStoreId: '',
    qty: 1,
    primaryVendor: ''
  });

  // Fetch transfer logs
  const transferLogs = useQuery(api.inventoryQueries.getTransferLogsForManagement, {
    uploadId,
    storeId
  });

  // Fetch inventory filters for store list
  const inventoryFilters = useQuery(api.inventoryQueries.getInventoryFilters);

  // Fetch available items for autocomplete
  const availableItems = useQuery(api.inventoryQueries.getAvailableItemsForUpload, {
    uploadId,
    searchTerm: itemSearchTerm || undefined
  });

  // Mutations
  const createTransferLog = useMutation(api.inventoryMutations.createTransferLog);
  const deleteTransferLog = useMutation(api.inventoryMutations.deleteTransferLog);
  const recalculateQuantities = useMutation(api.inventoryMutations.recalculateInventoryQuantities);

  const handleCreateTransferLog = async () => {
    if (!createForm.itemNumber || !createForm.fromStoreId || !createForm.toStoreId || createForm.qty <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (createForm.fromStoreId === createForm.toStoreId) {
      toast.error('From store and to store cannot be the same');
      return;
    }

    setIsCreating(true);
    try {
      await createTransferLog({
        uploadId,
        itemNumber: createForm.itemNumber,
        productName: createForm.productName || `Item ${createForm.itemNumber}`,
        fromStoreId: createForm.fromStoreId,
        toStoreId: createForm.toStoreId,
        qty: createForm.qty,
        primaryVendor: createForm.primaryVendor || 'Unknown'
      });

      // Recalculate inventory quantities
      await recalculateQuantities({
        uploadId,
        itemNumber: createForm.itemNumber
      });

      toast.success(`Transfer log created: ${createForm.qty} units of ${createForm.itemNumber} from ${createForm.fromStoreId} to ${createForm.toStoreId}`);
      setShowCreateDialog(false);
      setCreateForm({
        itemNumber: '',
        productName: '',
        fromStoreId: '',
        toStoreId: '',
        qty: 1,
        primaryVendor: ''
      });
      setItemSearchTerm('');
      onTransferLogsChange?.();
    } catch (error) {
      toast.error('Failed to create transfer log');
      console.error('Error creating transfer log:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteTransferLog = async () => {
    if (!selectedTransferLog) return;

    setIsDeleting(true);
    try {
      await deleteTransferLog({ transferLogId: selectedTransferLog._id });

      // Recalculate inventory quantities for the affected item
      await recalculateQuantities({
        uploadId,
        itemNumber: selectedTransferLog.item_number
      });

      toast.success(`Transfer log deleted: ${selectedTransferLog.qty} units of ${selectedTransferLog.item_number} from ${selectedTransferLog.from_store_id} to ${selectedTransferLog.to_store_id}`);
      setShowDeleteDialog(false);
      setSelectedTransferLog(null);
      onTransferLogsChange?.();
    } catch (error) {
      toast.error('Failed to delete transfer log');
      console.error('Error deleting transfer log:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRecalculateAll = async () => {
    setIsRecalculating(true);
    try {
      await recalculateQuantities({
        uploadId,
        storeId
      });
      toast.success('Inventory quantities recalculated successfully');
      onTransferLogsChange?.();
    } catch (error) {
      toast.error('Failed to recalculate quantities');
      console.error('Error recalculating quantities:', error);
    } finally {
      setIsRecalculating(false);
    }
  };

  const openDeleteDialog = (transferLog: TransferLog) => {
    setSelectedTransferLog(transferLog);
    setShowDeleteDialog(true);
  };

  const storeOptions = inventoryFilters?.stores || [];
  const filteredTransferLogs = transferLogs || [];

  // Convert available items to autocomplete options (prioritize product name)
  const itemOptions: AutocompleteOption[] = (availableItems || []).map(item => ({
    value: item.item_number,
    label: item.product_name,
    description: `Item #: ${item.item_number} | Vendor: ${item.primary_vendor}`
  }));

  // Handle item selection from autocomplete
  const handleItemSelect = (itemNumber: string) => {
    const selectedItem = availableItems?.find(item => item.item_number === itemNumber);
    if (selectedItem) {
      setCreateForm(prev => ({
        ...prev,
        itemNumber: selectedItem.item_number,
        productName: selectedItem.product_name,
        primaryVendor: selectedItem.primary_vendor
      }));
    }
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Transfer Log Management
                <Badge variant="outline">{filteredTransferLogs.length} transfers</Badge>
              </CardTitle>
              <CardDescription>
                Manage transfer logs for this upload{storeId ? ` and store ${storeId}` : ''}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRecalculateAll}
                disabled={isRecalculating}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {isRecalculating ? 'Recalculating...' : 'Recalculate All'}
              </Button>
              <Button
                size="sm"
                onClick={() => setShowCreateDialog(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Transfer
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTransferLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No transfer logs found for this selection.</p>
              <p className="text-sm mt-1">Create a new transfer log to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransferLogs.map((log: TransferLog) => (
                <div
                  key={log._id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="font-medium">{log.item_number}</div>
                      <div className="text-sm text-muted-foreground">
                        {log.product_name}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span>From: <span className="font-medium">{log.from_store_id}</span></span>
                      <span>To: <span className="font-medium">{log.to_store_id}</span></span>
                      <span>Qty: <span className="font-medium">{log.qty}</span></span>
                      {log.box_qty && <Badge variant="secondary" className="text-xs">Box Qty</Badge>}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openDeleteDialog(log)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Transfer Log Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Transfer Log</DialogTitle>
            <DialogDescription>
              Add a new transfer between stores for this upload.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="itemNumber">Select Product *</Label>
                <Autocomplete
                  options={itemOptions}
                  value={createForm.itemNumber}
                  onValueChange={handleItemSelect}
                  onSearchChange={setItemSearchTerm}
                  placeholder="Search product name..."
                  emptyText="No products found. Try a different search term."
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="qty">Quantity *</Label>
                <Input
                  id="qty"
                  type="number"
                  min="1"
                  value={createForm.qty}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, qty: parseInt(e.target.value) || 1 }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="itemNumber">Item Number</Label>
                <Input
                  id="itemNumber"
                  value={createForm.itemNumber}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, itemNumber: e.target.value }))}
                  placeholder="Auto-filled from product selection"
                  className="bg-muted/50"
                />
              </div>
              <div>
                <Label htmlFor="productName">Product Name</Label>
                <Input
                  id="productName"
                  value={createForm.productName}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, productName: e.target.value }))}
                  placeholder="Auto-filled from product selection"
                  className="bg-muted/50"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fromStore">From Store *</Label>
                <Select value={createForm.fromStoreId} onValueChange={(value) => setCreateForm(prev => ({ ...prev, fromStoreId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select from store" />
                  </SelectTrigger>
                  <SelectContent>
                    {storeOptions.map((store: string) => (
                      <SelectItem key={store} value={store}>{store}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="toStore">To Store *</Label>
                <Select value={createForm.toStoreId} onValueChange={(value) => setCreateForm(prev => ({ ...prev, toStoreId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select to store" />
                  </SelectTrigger>
                  <SelectContent>
                    {storeOptions.map((store: string) => (
                      <SelectItem key={store} value={store}>{store}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="primaryVendor">Primary Vendor</Label>
              <Input
                id="primaryVendor"
                value={createForm.primaryVendor}
                onChange={(e) => setCreateForm(prev => ({ ...prev, primaryVendor: e.target.value }))}
                placeholder="Auto-filled from item selection"
                className="bg-muted/50"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => {
              setShowCreateDialog(false);
              setItemSearchTerm('');
              setCreateForm({
                itemNumber: '',
                productName: '',
                fromStoreId: '',
                toStoreId: '',
                qty: 1,
                primaryVendor: ''
              });
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreateTransferLog} disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Transfer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Transfer Log Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Transfer Log</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this transfer log? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedTransferLog && (
            <div className="p-3 border rounded-lg bg-muted/50">
              <div className="font-medium">{selectedTransferLog.item_number}</div>
              <div className="text-sm text-muted-foreground mt-1">
                {selectedTransferLog.product_name}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                From {selectedTransferLog.from_store_id} to {selectedTransferLog.to_store_id} - Qty: {selectedTransferLog.qty}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTransferLog} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete Transfer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};