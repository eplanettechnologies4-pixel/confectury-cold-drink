'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  RotateCcw,
  CheckCircle2,
  Package,
  AlertTriangle,
  Minus,
  Plus,
  Info,
  Check,
  Store,
  Calendar,
  X,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useAppState } from '@/lib/store';
import { Order, OrderItem } from '@/types';
import { formatPKR, formatDateDDMMYYYY } from '@/lib/utils';

interface ReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  preSelectedProductId?: string;
  onSuccess?: (message: string) => void;
}

interface ItemReturnState {
  productId: string;
  productName: string;
  category?: string;
  unit: string;
  unitPrice: number;
  discountPercent: number;
  purchasedQty: number;
  alreadyReturnedQty: number;
  availableToReturn: number;
  selected: boolean;
  returnQty: number;
  isResalable: boolean;
}

export const ReturnModal: React.FC<ReturnModalProps> = ({
  isOpen,
  onClose,
  order,
  preSelectedProductId,
  onSuccess,
}) => {
  const { returnSale, salesReturns } = useAppState();

  const [itemsState, setItemsState] = useState<ItemReturnState[]>([]);
  const [returnReason, setReturnReason] = useState('Customer returned goods from route');
  const [globalIsResalable, setGlobalIsResalable] = useState(true);
  const [customRefundAmount, setCustomRefundAmount] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize or re-initialize items when order or preSelectedProductId changes
  useEffect(() => {
    if (!order || !isOpen) {
      setItemsState([]);
      setCustomRefundAmount(null);
      setErrorMessage(null);
      return;
    }

    const initialItems: ItemReturnState[] = order.items.map(item => {
      // Calculate already returned quantity for this line item
      const itemAlreadyReturned = item.returnedQuantity !== undefined && item.returnedQuantity > 0
        ? item.returnedQuantity
        : salesReturns
            .filter(sr => sr.orderId === order.id && sr.productId === item.productId)
            .reduce((sum, sr) => sum + (sr.quantity || 0), 0);

      const available = Math.max(0, item.quantity - itemAlreadyReturned);

      // If preSelectedProductId is passed, only that product is selected initially
      if (preSelectedProductId) {
        const isPreselected = item.productId === preSelectedProductId;
        return {
          productId: item.productId,
          productName: item.productName,
          category: item.category,
          unit: item.unit,
          unitPrice: item.unitPrice,
          discountPercent: item.discountPercent || 0,
          purchasedQty: item.quantity,
          alreadyReturnedQty: itemAlreadyReturned,
          availableToReturn: available,
          selected: isPreselected && available > 0,
          returnQty: isPreselected ? available : 0,
          isResalable: true,
        };
      }

      // Default: select all available items with full quantity (user can uncheck or reduce what is kept)
      return {
        productId: item.productId,
        productName: item.productName,
        category: item.category,
        unit: item.unit,
        unitPrice: item.unitPrice,
        discountPercent: item.discountPercent || 0,
        purchasedQty: item.quantity,
        alreadyReturnedQty: itemAlreadyReturned,
        availableToReturn: available,
        selected: available > 0,
        returnQty: available,
        isResalable: true,
      };
    });

    setItemsState(initialItems);
    setReturnReason('Customer returned excess goods / overstocked');
    setGlobalIsResalable(true);
    setCustomRefundAmount(null);
    setErrorMessage(null);
  }, [order, isOpen, preSelectedProductId, salesReturns]);

  // Handle toggling an individual item's selection
  const handleToggleSelect = (productId: string) => {
    setItemsState(prev =>
      prev.map(item => {
        if (item.productId === productId) {
          const nextSelected = !item.selected;
          return {
            ...item,
            selected: nextSelected,
            returnQty: nextSelected ? (item.returnQty > 0 ? item.returnQty : item.availableToReturn) : 0,
          };
        }
        return item;
      })
    );
    setCustomRefundAmount(null);
  };

  // Handle changing quantity to return for a specific item
  const handleQtyChange = (productId: string, newQty: number) => {
    setItemsState(prev =>
      prev.map(item => {
        if (item.productId === productId) {
          const clamped = Math.max(0, Math.min(newQty, item.availableToReturn));
          return {
            ...item,
            returnQty: clamped,
            selected: clamped > 0,
          };
        }
        return item;
      })
    );
    setCustomRefundAmount(null);
  };

  // Select all items (Full return mode)
  const handleSelectAll = () => {
    setItemsState(prev =>
      prev.map(item => ({
        ...item,
        selected: item.availableToReturn > 0,
        returnQty: item.availableToReturn,
      }))
    );
    setCustomRefundAmount(null);
  };

  // Clear all items (Keep all mode)
  const handleKeepAll = () => {
    setItemsState(prev =>
      prev.map(item => ({
        ...item,
        selected: false,
        returnQty: 0,
      }))
    );
    setCustomRefundAmount(null);
  };

  // Calculate totals
  const {
    totalReturningUnits,
    totalReturningSKUs,
    totalKeptUnits,
    totalKeptSKUs,
    calculatedRefund,
    isFullReturn,
    hasReturns,
  } = useMemo(() => {
    let returningUnits = 0;
    let returningSKUs = 0;
    let keptUnits = 0;
    let keptSKUs = 0;
    let refund = 0;

    itemsState.forEach(item => {
      const returning = item.selected ? item.returnQty : 0;
      const kept = item.availableToReturn - returning;

      if (returning > 0) {
        returningUnits += returning;
        returningSKUs += 1;
        const lineTotal = Math.round(returning * item.unitPrice * (1 - item.discountPercent / 100));
        refund += lineTotal;
      }

      if (kept > 0) {
        keptUnits += kept;
        keptSKUs += 1;
      }
    });

    const full = itemsState.length > 0 && itemsState.every(i => (i.selected ? i.returnQty : 0) === i.availableToReturn);
    const anyReturning = returningUnits > 0;

    return {
      totalReturningUnits: returningUnits,
      totalReturningSKUs: returningSKUs,
      totalKeptUnits: keptUnits,
      totalKeptSKUs: keptSKUs,
      calculatedRefund: refund,
      isFullReturn: full,
      hasReturns: anyReturning,
    };
  }, [itemsState]);

  const effectiveRefundAmount = customRefundAmount !== null ? customRefundAmount : calculatedRefund;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setErrorMessage(null);

    const itemsToSubmit = itemsState
      .filter(item => item.selected && item.returnQty > 0)
      .map(item => ({
        productId: item.productId,
        quantity: item.returnQty,
        isResalable: globalIsResalable,
      }));

    if (itemsToSubmit.length === 0) {
      setErrorMessage('Please specify at least one product with quantity greater than 0 to return.');
      return;
    }

    try {
      setIsSubmitting(true);
      returnSale(order.id, {
        reason: returnReason.trim() || 'Customer returned goods',
        isResalable: globalIsResalable,
        refundAmount: effectiveRefundAmount,
        items: itemsToSubmit,
      });

      setIsSubmitting(false);
      onClose();

      const summaryMsg = isFullReturn
        ? `Sale #${order.orderNumber} was fully returned and removed from Daily Sales.`
        : `Partial return recorded for #${order.orderNumber} (${totalReturningUnits} units returned, ${totalKeptUnits} units kept).`;

      if (onSuccess) {
        onSuccess(summaryMsg);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err?.message || 'Error processing sale return');
    }
  };

  if (!order) return null;

  const quickReasons = [
    'Customer overstocked',
    'Customer rejected item',
    'Damaged packaging',
    'Short expiry date',
    'Wrong product sent',
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Return Sale & Items — Invoice #${order.orderNumber}`}
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-xs text-slate-700">
        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-rose-800 text-xs flex items-center justify-between">
            <span>{errorMessage}</span>
            <button type="button" onClick={() => setErrorMessage(null)} className="text-rose-600 hover:text-rose-800">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Invoice Info Bar */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <Store className="h-4 w-4 text-brand-600 shrink-0" />
            <div>
              <span className="font-extrabold text-slate-900">{order.companyName}</span>
              <span className="text-slate-500 ml-1.5 font-medium">({order.clientName})</span>
              <span className="text-slate-400 mx-1.5">•</span>
              <span className="text-slate-600 font-semibold">{order.area}</span>
            </div>
          </div>
          <div className="flex items-center space-x-3 text-slate-500 font-mono text-[11px]">
            <span className="flex items-center">
              <Calendar className="h-3.5 w-3.5 mr-1 text-slate-400" />
              {formatDateDDMMYYYY(order.orderDate)}
            </span>
            <span>Total: <strong className="text-slate-900">{formatPKR(order.grandTotal)}</strong></span>
          </div>
        </div>

        {/* Interactive Mode & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center">
              <Package className="h-4 w-4 mr-1.5 text-brand-600" />
              Select What Customer Returns vs What They Keep
            </h3>
            <p className="text-[11px] text-slate-500">
              Choose individual products and adjust return quantities. Items with 0 quantity will remain active with the customer.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={handleSelectAll}
              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-semibold text-[11px] transition flex items-center space-x-1"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Return All Items</span>
            </button>
            <button
              type="button"
              onClick={handleKeepAll}
              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg font-semibold text-[11px] transition flex items-center space-x-1"
            >
              <Check className="h-3 w-3" />
              <span>Keep All (Clear)</span>
            </button>
          </div>
        </div>

        {/* Product Items Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="max-h-72 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">Return?</th>
                  <th className="py-2.5 px-3">Product Description</th>
                  <th className="py-2.5 px-3 text-center">Purchased</th>
                  <th className="py-2.5 px-3 text-center">Return Qty</th>
                  <th className="py-2.5 px-3">Status / Kept Qty</th>
                  <th className="py-2.5 px-3 text-right">Refund (PKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {itemsState.map((item, idx) => {
                  const isFullyReturnedPreviously = item.availableToReturn <= 0;
                  const returning = item.selected ? item.returnQty : 0;
                  const kept = item.availableToReturn - returning;
                  const lineRefund = Math.round(returning * item.unitPrice * (1 - item.discountPercent / 100));

                  return (
                    <tr
                      key={item.productId || idx}
                      className={`transition ${
                        isFullyReturnedPreviously
                          ? 'bg-slate-50 opacity-60'
                          : returning > 0
                          ? 'bg-rose-50/40'
                          : 'hover:bg-slate-50/60'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          disabled={isFullyReturnedPreviously}
                          checked={item.selected && item.returnQty > 0}
                          onChange={() => handleToggleSelect(item.productId)}
                          className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer disabled:cursor-not-allowed"
                        />
                      </td>

                      {/* Product Description */}
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">{item.productName}</div>
                        <div className="text-[10px] text-slate-500 flex items-center space-x-2">
                          <span>{item.category || 'Confectionery'}</span>
                          <span>•</span>
                          <span>{item.unit}</span>
                          <span>•</span>
                          <span className="font-mono">{formatPKR(item.unitPrice)}</span>
                          {item.discountPercent > 0 && <span className="text-amber-600">(-{item.discountPercent}%)</span>}
                        </div>
                        {item.alreadyReturnedQty > 0 && (
                          <div className="text-[10px] text-purple-700 font-semibold mt-0.5">
                            Previously returned: {item.alreadyReturnedQty} {item.unit}
                          </div>
                        )}
                      </td>

                      {/* Purchased Quantity */}
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700">
                        {item.purchasedQty} {item.unit}
                      </td>

                      {/* Return Quantity Stepper */}
                      <td className="py-2.5 px-3">
                        {isFullyReturnedPreviously ? (
                          <span className="text-[11px] text-slate-400 italic">Fully Returned</span>
                        ) : (
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              type="button"
                              onClick={() => handleQtyChange(item.productId, item.returnQty - 1)}
                              disabled={item.returnQty <= 0}
                              className="w-6 h-6 rounded bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                            >
                              <Minus className="h-3 w-3" />
                            </button>

                            <input
                              type="number"
                              min="0"
                              max={item.availableToReturn}
                              value={item.returnQty}
                              onChange={(e) => handleQtyChange(item.productId, parseInt(e.target.value) || 0)}
                              className="w-14 text-center px-1.5 py-1 bg-white border border-slate-300 rounded font-mono font-bold text-xs text-rose-700 focus:outline-none focus:ring-1 focus:ring-rose-500"
                            />

                            <button
                              type="button"
                              onClick={() => handleQtyChange(item.productId, item.returnQty + 1)}
                              disabled={item.returnQty >= item.availableToReturn}
                              className="w-6 h-6 rounded bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Status / Kept Quantity */}
                      <td className="py-2.5 px-3">
                        {isFullyReturnedPreviously ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-800">
                            Already Returned
                          </span>
                        ) : returning === 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
                            Client Keeps All ({item.availableToReturn})
                          </span>
                        ) : returning === item.availableToReturn ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-800">
                            <RotateCcw className="h-3 w-3 mr-1 text-rose-600" />
                            Returning All ({returning} {item.unit})
                          </span>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                              Returning {returning}
                            </span>
                            <span className="block text-[10px] text-emerald-700 font-semibold">
                              Keeping {kept} {item.unit}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Line Refund Total */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-xs">
                        {returning > 0 ? (
                          <span className="text-rose-600">-{formatPKR(lineRefund)}</span>
                        ) : (
                          <span className="text-slate-400">Rs. 0</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dynamic Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">Items to Return</span>
            <span className="text-lg font-black text-rose-900">
              {totalReturningUnits} units <span className="text-xs font-normal text-rose-700">({totalReturningSKUs} SKUs)</span>
            </span>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Items Client Keeps</span>
            <span className="text-lg font-black text-emerald-900">
              {totalKeptUnits} units <span className="text-xs font-normal text-emerald-700">({totalKeptSKUs} SKUs)</span>
            </span>
          </div>

          <div className="p-3 bg-slate-900 text-white rounded-xl shadow-xs">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">Total Credit Refund</span>
            <span className="text-lg font-black text-emerald-400 font-mono">
              {formatPKR(effectiveRefundAmount)}
            </span>
          </div>
        </div>

        {/* Dynamic Impact Notice */}
        {hasReturns && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-start space-x-2.5 ${
              isFullReturn
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}
          >
            {isFullReturn ? (
              <AlertTriangle className="h-4 w-4 text-amber-700 mt-0.5 shrink-0" />
            ) : (
              <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
            )}
            <div>
              {isFullReturn ? (
                <>
                  <p className="font-bold">Full Invoice Return:</p>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    All remaining items on this invoice are being returned. The invoice will be marked as <strong>Returned</strong> and automatically removed from active Daily Sales.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-bold">Partial Return (Client keeps remaining goods):</p>
                  <p className="text-[11px] text-blue-800 mt-0.5">
                    The client is keeping <strong>{totalKeptUnits} units</strong>. Customer receivables will be credited by <strong>{formatPKR(effectiveRefundAmount)}</strong>, returned products will be restocked/recorded as damaged, and the invoice will remain active in Daily Sales with the kept goods!
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Stock Condition & Refund Customization */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Stock Condition for Returned Items *</label>
            <select
              value={globalIsResalable ? 'true' : 'false'}
              onChange={(e) => setGlobalIsResalable(e.target.value === 'true')}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-xs"
            >
              <option value="true">Saleable (Restock to Active Warehouse Inventory)</option>
              <option value="false">Damaged / Defective (Record in Damage Loss)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Refund / Credit Amount (PKR) *
            </label>
            <input
              type="number"
              min="0"
              value={effectiveRefundAmount}
              onChange={(e) => setCustomRefundAmount(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-rose-600 text-xs"
              required
            />
          </div>
        </div>

        {/* Return Reason */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Reason for Return *</label>
          <input
            type="text"
            value={returnReason}
            onChange={(e) => setReturnReason(e.target.value)}
            placeholder="e.g. Excess stock returned, route delivery rejected, defective batch"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
            required
          />
          {/* Quick pills */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {quickReasons.map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setReturnReason(r)}
                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[10px] transition"
              >
                + {r}
              </button>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            {hasReturns ? (
              <span>
                Processing return for <strong className="text-slate-800">{totalReturningUnits} units</strong>
              </span>
            ) : (
              <span className="text-amber-700 font-semibold">Select at least 1 unit to return</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!hasReturns || isSubmitting}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold shadow-xs flex items-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <RotateCcw className="h-4 w-4" />
              <span>
                {isSubmitting
                  ? 'Processing Return...'
                  : isFullReturn
                  ? `Confirm Full Return (${formatPKR(effectiveRefundAmount)})`
                  : `Confirm Partial Return (${formatPKR(effectiveRefundAmount)})`}
              </span>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
