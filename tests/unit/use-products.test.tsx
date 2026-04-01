import { act, renderHook, waitFor } from "@testing-library/react";
import { useProducts } from "@/hooks/use-products";

const fetchMock = vi.fn<typeof fetch>();

describe("useProducts", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: true
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads products in pages and appends the next page on demand", async () => {
    const pages = [
      {
        items: [
          {
            id: "product-1",
            name: "شاحن سريع",
            category: "accessory",
            sku: "FAST-001",
            description: "USB-C",
            sale_price: 100,
            stock_quantity: 5,
            min_stock_level: 1,
            track_stock: true,
            is_quick_add: true,
            is_active: true,
            created_at: "",
            updated_at: "",
            created_by: "admin-1"
          },
          {
            id: "product-2",
            name: "سماعة بلوتوث",
            category: "accessory",
            sku: "HEAD-001",
            description: "Wireless",
            sale_price: 80,
            stock_quantity: 3,
            min_stock_level: 1,
            track_stock: true,
            is_quick_add: false,
            is_active: true,
            created_at: "",
            updated_at: "",
            created_by: "admin-1"
          }
        ],
        totalCount: 3,
        hasMore: true
      },
      {
        items: [
          {
            id: "product-3",
            name: "غطاء حماية",
            category: "accessory",
            sku: "CASE-001",
            description: "Silicone",
            sale_price: 20,
            stock_quantity: 10,
            min_stock_level: 2,
            track_stock: true,
            is_quick_add: false,
            is_active: true,
            created_at: "",
            updated_at: "",
            created_by: "admin-1"
          }
        ],
        totalCount: 3,
        hasMore: false
      }
    ];

    fetchMock.mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : input.toString();
      const page = Number(new URL(url, "http://localhost").searchParams.get("page") ?? "0");
      const payload = pages[page] ?? { items: [], totalCount: 3, hasMore: false };

      return {
        ok: true,
        json: async () => ({
          success: true,
          data: payload
        })
      } as Response;
    });

    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.products).toHaveLength(2);
    expect(result.current.hasMore).toBe(true);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/pos/products?page=0",
      expect.objectContaining({
        method: "GET",
        cache: "no-store"
      })
    );

    await act(async () => {
      result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.products).toHaveLength(3);
    });

    expect(result.current.hasMore).toBe(false);
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/pos/products?page=1",
      expect.objectContaining({
        method: "GET",
        cache: "no-store"
      })
    );
  });
});
