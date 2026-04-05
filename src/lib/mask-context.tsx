"use client";

import { createContext, useContext } from "react";

const MaskContext = createContext<boolean>(false);

export function MaskProvider({ isMasked, children }: { isMasked: boolean; children: React.ReactNode }) {
  return <MaskContext value={isMasked}>{children}</MaskContext>;
}

export function useMask(): boolean {
  return useContext(MaskContext);
}

/** Returns masked text if data is masked, otherwise the original value */
export function maskValue(value: string, isMasked: boolean): string {
  return isMasked ? "$•••••" : value;
}
