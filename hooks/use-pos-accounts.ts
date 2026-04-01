"use client";

import { useEffect, useState } from "react";
import type { PosAccount, StandardEnvelope } from "@/lib/pos/types";

type AccountsResponseData = {
  items: PosAccount[];
};

export function usePosAccounts() {
  const [accounts, setAccounts] = useState<PosAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let isCancelled = false;

    async function loadAccounts() {
      setIsLoading(true);
      setErrorMessage(null);

      let data: AccountsResponseData | undefined;
      let error: Error | null = null;

      try {
        const response = await fetch("/api/pos/accounts", {
          method: "GET",
          cache: "no-store"
        });
        const envelope = (await response.json()) as StandardEnvelope<AccountsResponseData>;

        if (!response.ok || !envelope.success || !envelope.data) {
          error = new Error(envelope.error?.message ?? "تعذر جلب الحسابات الآن.");
        } else {
          data = envelope.data;
        }
      } catch (fetchError) {
        error =
          fetchError instanceof Error
            ? fetchError
            : new Error("تعذر جلب الحسابات الآن.");
      }

      if (isCancelled) {
        return;
      }

      if (error) {
        setAccounts([]);
        setErrorMessage(error.message);
      } else {
        setAccounts(data?.items ?? []);
      }

      setIsLoading(false);
    }

    void loadAccounts();

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
    accounts,
    isLoading,
    isOffline,
    errorMessage,
    refresh() {
      setReloadToken((value) => value + 1);
    }
  };
}
