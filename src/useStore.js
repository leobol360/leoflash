import { useSyncExternalStore } from "react";
import { Store } from "./store.js";

// Re-render the calling component whenever Store.save() runs.
// Components then read Store.stats(), Store.settings(), etc. directly.
export function useStore() {
  useSyncExternalStore(Store.subscribe, Store.getVersion, Store.getVersion);
  return Store;
}
