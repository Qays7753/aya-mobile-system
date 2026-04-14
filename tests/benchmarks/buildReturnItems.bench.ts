import { bench, describe } from 'vitest';

const generateData = (n: number) => {
  const returnableItems = Array.from({ length: n }, (_, i) => ({
    id: `item-${i}`,
    remainingQuantity: 10,
  }));
  const selectedReturnItemIds = Array.from({ length: n / 2 }, (_, i) => `item-${i * 2}`);
  const returnType = "full";
  const returnQuantities: Record<string, number> = {};
  return { returnableItems, selectedReturnItemIds, returnType, returnQuantities };
};

const data = generateData(100); // More realistic array size

describe('buildReturnItems', () => {
  bench('baseline', () => {
    data.returnableItems
      .filter((item) => data.selectedReturnItemIds.includes(item.id))
      .map((item) => ({
        invoice_item_id: item.id,
        quantity: data.returnType === "full" ? item.remainingQuantity : Math.min(item.remainingQuantity, data.returnQuantities[item.id] ?? 0)
      }))
      .filter((item) => item.quantity > 0);
  });

  bench('optimized', () => {
    const selectedSet = new Set(data.selectedReturnItemIds);
    data.returnableItems
      .filter((item) => selectedSet.has(item.id))
      .map((item) => ({
        invoice_item_id: item.id,
        quantity: data.returnType === "full" ? item.remainingQuantity : Math.min(item.remainingQuantity, data.returnQuantities[item.id] ?? 0)
      }))
      .filter((item) => item.quantity > 0);
  });
});
