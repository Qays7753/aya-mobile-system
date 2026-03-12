"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { PosProduct } from "@/lib/pos/types";

const PRODUCT_COLUMNS = [
  "id",
  "name",
  "category",
  "sku",
  "description",
  "sale_price",
  "stock_quantity",
  "min_stock_level",
  "track_stock",
  "is_quick_add",
  "is_active",
  "created_at",
  "updated_at",
  "created_by"
].join(", ");

export function useProducts() {
  const [products, setProducts] = useState<PosProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(() => (typeof navigator === "undefined" ? false : !navigator.onLine));
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let isCancelled = false;

    async function loadProducts() {
      setIsLoading(true);
      setErrorMessage(null);

      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("v_pos_products")
        .select(PRODUCT_COLUMNS)
        .order("is_quick_add", { ascending: false })
        .order("name", { ascending: true });

      if (isCancelled) {
        return;
      }

      if (error) {
        setProducts([]);
        setErrorMessage(error.message);
      } else {
        setProducts((data ?? []) as unknown as PosProduct[]);
      }

      setIsLoading(false);
    }

    void loadProducts();

    const handleReconnect = () => {
      setIsOffline(false);
      setReloadToken((value) => value + 1);
    };
    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener("online", handleReconnect);
    window.addEventListener("offline", handleOffline);

    return () => {
      isCancelled = true;
      window.removeEventListener("online", handleReconnect);
      window.removeEventListener("offline", handleOffline);
    };
  }, [reloadToken]);

  return {
    products,
    isLoading,
    isOffline,
    errorMessage,
    refresh() {
      setReloadToken((value) => value + 1);
    }
  };
}
