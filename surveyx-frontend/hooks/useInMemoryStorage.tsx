"use client";

import { useMemo } from "react";
import { GenericStringStorage } from "@/fhevm/GenericStringStorage";

export function useInMemoryStorage() {
  const storage = useMemo(() => {
    return new GenericStringStorage("surveyx_decryption");
  }, []);

  return { storage };
}

