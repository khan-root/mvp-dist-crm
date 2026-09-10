import { create } from "zustand";
import { CatalogSlice, createCatalogSlice } from "./slices/createCatalogSlice";
import { RolesSlice, createRolesSlice } from "./slices/createRolesSlice";
import { DistributorsSlice, createDistributorsSlice } from "./slices/createDistributorsSlice";

export type BoundState = CatalogSlice & RolesSlice & DistributorsSlice;

export const useStore = create<BoundState>()((...a) => ({
  ...createCatalogSlice(...a),
  ...createRolesSlice(...a),
  ...createDistributorsSlice(...a),
}));
