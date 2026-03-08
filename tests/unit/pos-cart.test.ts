import { calculateCartDiscount, calculateCartSubtotal, calculateCartTotal, usePosCartStore } from "@/stores/pos-cart";

describe("usePosCartStore", () => {
  beforeEach(() => {
    localStorage.clear();
    usePosCartStore.getState().resetStore();
  });

  it("adds a product and accumulates quantity for the same item", () => {
    const store = usePosCartStore.getState();

    store.addProduct({
      id: "product-1",
      name: "شاحن سريع",
      category: "accessory",
      sku: null,
      description: null,
      sale_price: 5,
      stock_quantity: 10,
      min_stock_level: 2,
      track_stock: true,
      is_quick_add: true,
      is_active: true,
      created_at: "",
      updated_at: "",
      created_by: "user-1"
    });
    store.addProduct({
      id: "product-1",
      name: "شاحن سريع",
      category: "accessory",
      sku: null,
      description: null,
      sale_price: 5,
      stock_quantity: 10,
      min_stock_level: 2,
      track_stock: true,
      is_quick_add: true,
      is_active: true,
      created_at: "",
      updated_at: "",
      created_by: "user-1"
    });

    const state = usePosCartStore.getState();

    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(2);
  });

  it("calculates subtotal, discount, and total from the local cart", () => {
    usePosCartStore.setState({
      items: [
        {
          product_id: "product-1",
          name: "سماعة",
          category: "accessory",
          sale_price: 10,
          quantity: 2,
          discount_percentage: 10,
          stock_quantity: 5,
          track_stock: true
        }
      ]
    });

    const { items } = usePosCartStore.getState();

    expect(calculateCartSubtotal(items)).toBe(20);
    expect(calculateCartDiscount(items)).toBe(2);
    expect(calculateCartTotal(items)).toBe(18);
  });

  it("resets cart items and rotates the idempotency key after a successful sale", () => {
    const initialKey = usePosCartStore.getState().currentIdempotencyKey;

    usePosCartStore.setState({
      items: [
        {
          product_id: "product-1",
          name: "سماعة",
          category: "accessory",
          sale_price: 10,
          quantity: 1,
          discount_percentage: 0,
          stock_quantity: 5,
          track_stock: true
        }
      ]
    });

    usePosCartStore.getState().completeSale({
      invoice_id: "invoice-1",
      invoice_number: "INV-0001",
      total: 10,
      change: 0
    });

    const state = usePosCartStore.getState();

    expect(state.items).toHaveLength(0);
    expect(state.currentIdempotencyKey).not.toBe(initialKey);
    expect(state.lastCompletedSale?.invoice_number).toBe("INV-0001");
  });

  it("persists the local cart slice and restores it after hydration", async () => {
    const store = usePosCartStore.getState();

    store.addProduct({
      id: "product-1",
      name: "شاحن سريع",
      category: "accessory",
      sku: "FAST-001",
      description: "USB-C",
      sale_price: 5,
      stock_quantity: 10,
      min_stock_level: 2,
      track_stock: true,
      is_quick_add: true,
      is_active: true,
      created_at: "",
      updated_at: "",
      created_by: "user-1"
    });
    store.setSelectedAccountId("account-1");
    store.setPosTerminalCode("POS-09");
    store.setNotes("keep me");

    const persistedSnapshot = localStorage.getItem("aya-mobile-pos-cart");

    expect(persistedSnapshot).toContain("product-1");

    usePosCartStore.setState({
      items: [],
      selectedAccountId: null,
      posTerminalCode: "",
      notes: "",
      currentIdempotencyKey: "scratch"
    });
    localStorage.setItem("aya-mobile-pos-cart", persistedSnapshot as string);

    await usePosCartStore.persist.rehydrate();

    const hydrated = usePosCartStore.getState();

    expect(hydrated.items).toHaveLength(1);
    expect(hydrated.selectedAccountId).toBe("account-1");
    expect(hydrated.posTerminalCode).toBe("POS-09");
    expect(hydrated.notes).toBe("keep me");
  });
});
