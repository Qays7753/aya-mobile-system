type DiscountAmountItemInput = {
  product_id: string;
  quantity: number;
  discount_amount?: number;
};

type LegacyDiscountItem = {
  product_id: string;
  quantity: number;
  discount_percentage: number;
};

type DiscountAmountConversionOptions = {
  invoiceDiscountAmount?: number;
  items: DiscountAmountItemInput[];
  maxDiscountAmount: number | null;
  priceByProductId: Map<string, number>;
};

function roundToSix(value: number) {
  return Math.round((value + Number.EPSILON) * 1_000_000) / 1_000_000;
}

export function convertDiscountAmountsToLegacyPercentages({
  invoiceDiscountAmount = 0,
  items,
  maxDiscountAmount,
  priceByProductId
}: DiscountAmountConversionOptions): {
  invoiceDiscountPercentage: number;
  items: LegacyDiscountItem[];
} {
  const effectiveCap = maxDiscountAmount ?? Number.POSITIVE_INFINITY;
  let postLineDiscountTotal = 0;

  const convertedItems = items.map((item) => {
    const salePrice = priceByProductId.get(item.product_id);

    if (salePrice === undefined) {
      throw new Error("ERR_PRODUCT_NOT_FOUND");
    }

    const lineSubtotal = roundToSix(salePrice * item.quantity);
    const requestedDiscountAmount = roundToSix(Math.max(item.discount_amount ?? 0, 0));

    if (
      requestedDiscountAmount > effectiveCap ||
      requestedDiscountAmount > lineSubtotal
    ) {
      throw new Error("ERR_DISCOUNT_EXCEEDED");
    }

    postLineDiscountTotal += lineSubtotal - requestedDiscountAmount;

    return {
      product_id: item.product_id,
      quantity: item.quantity,
      discount_percentage:
        lineSubtotal > 0
          ? roundToSix((requestedDiscountAmount / lineSubtotal) * 100)
          : 0
    };
  });

  const normalizedInvoiceDiscountAmount = roundToSix(Math.max(invoiceDiscountAmount, 0));
  if (
    normalizedInvoiceDiscountAmount > effectiveCap ||
    normalizedInvoiceDiscountAmount > roundToSix(postLineDiscountTotal)
  ) {
    throw new Error("ERR_DISCOUNT_EXCEEDED");
  }

  return {
    items: convertedItems,
    invoiceDiscountPercentage:
      postLineDiscountTotal > 0
        ? roundToSix((normalizedInvoiceDiscountAmount / postLineDiscountTotal) * 100)
        : 0
  };
}
