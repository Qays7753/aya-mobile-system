"use client";

import { useEffect, useState } from "react";
import type { StandardEnvelope } from "@/lib/pos/types";

export type CustomerSearchResult = {
  id: string;
  name: string;
  phone: string | null;
  current_balance: number;
};

export function useCustomerSearch(query: string) {
  const [results, setResults] = useState<CustomerSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    void (async () => {
      try {
        const response = await fetch(`/api/pos/customers?q=${encodeURIComponent(trimmed)}`, {
          method: "GET",
          cache: "no-store"
        });
        const envelope = (await response.json()) as StandardEnvelope<{
          items: CustomerSearchResult[];
        }>;

        if (cancelled) {
          return;
        }

        setResults(
          !response.ok || !envelope.success || !envelope.data ? [] : envelope.data.items
        );
      } catch {
        if (!cancelled) {
          setResults([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [query]);

  return { results, isLoading };
}
