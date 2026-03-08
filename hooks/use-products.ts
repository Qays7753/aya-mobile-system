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
      setReloadToken((value) => value + 1);
    };

    window.addEventListener("online", handleReconnect);

    return () => {
      isCancelled = true;
      window.removeEventListener("online", handleReconnect);
    };
  }, [reloadToken]);

  return {
    products,
    isLoading,
    errorMessage,
    refresh() {
      setReloadToken((value) => value + 1);
    }
  };
}
