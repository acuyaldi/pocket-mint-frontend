import { ASSET_WALLET_TYPES, type Wallet } from "@/src/types/wallet";

export interface TransferEndpoints {
  selectedId: string;
  oppositeId: string;
}

export function getTransferSources(wallets: Wallet[]): Wallet[] {
  return wallets.filter((wallet) => ASSET_WALLET_TYPES.includes(wallet.type));
}

/** Compatibility alias used by older callers and tests. */
export const getTransferWallets = getTransferSources;

export function getTransferDestinations(
  wallets: Wallet[],
  sourceId: string,
): Wallet[] {
  return wallets.filter((wallet) => wallet.id !== sourceId);
}

export function getTransferEndpointWallets(
  wallets: Wallet[],
  oppositeId: string,
): Wallet[] {
  if (wallets.length === 1 && wallets[0].id === oppositeId) {
    return [];
  }

  return wallets;
}

export function selectTransferEndpoint(
  selectedId: string,
  oppositeId: string,
  nextId: string,
): TransferEndpoints {
  if (nextId === oppositeId) {
    return { selectedId: oppositeId, oppositeId: selectedId };
  }

  return { selectedId: nextId, oppositeId };
}

export function swapTransferEndpoints(
  sourceId: string,
  destinationId: string,
): TransferEndpoints {
  return { selectedId: destinationId, oppositeId: sourceId };
}

export function isValidTransferPair(
  sourceId: string,
  destinationId: string,
): boolean {
  return sourceId.length > 0 && destinationId.length > 0 && sourceId !== destinationId;
}
