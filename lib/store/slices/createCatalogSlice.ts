import { StateCreator } from "zustand";

export interface CategoryItem {
  _id: string;
  category_name: string;
  category_code: string;
  distributor_id: string;
  industry_domain?: string;
  default_gst_rate?: number;
  default_margin_percentage?: number;
  description?: string;
}

export interface BrandItem {
  _id: string;
  brand_name: string;
  brand_code: string;
  distributor_id: string;
  industry_domain?: string;
  principal_owner?: string;
  brand_details?: { country_of_origin?: string; certifications?: string[] };
}

export interface CatalogSlice {
  categories: CategoryItem[];
  brands: BrandItem[];
  setCategories: (categories: CategoryItem[]) => void;
  addCategory: (category: CategoryItem) => void;
  updateCategory: (category: CategoryItem) => void;
  deleteCategory: (categoryId: string) => void;
  setBrands: (brands: BrandItem[]) => void;
  addBrand: (brand: BrandItem) => void;
  updateBrand: (brand: BrandItem) => void;
  deleteBrand: (brandId: string) => void;
}

export const createCatalogSlice: StateCreator<CatalogSlice, [], [], CatalogSlice> = (set) => ({
  categories: [],
  brands: [],

  setCategories: (categories) => set({ categories }),
  addCategory: (category) =>
    set((state) => ({ categories: [category, ...state.categories] })),
  updateCategory: (category) =>
    set((state) => ({
      categories: state.categories.map((c) => (c._id === category._id ? category : c)),
    })),
  deleteCategory: (categoryId) =>
    set((state) => ({
      categories: state.categories.filter((c) => c._id !== categoryId),
    })),

  setBrands: (brands) => set({ brands }),
  addBrand: (brand) => set((state) => ({ brands: [brand, ...state.brands] })),
  updateBrand: (brand) =>
    set((state) => ({
      brands: state.brands.map((b) => (b._id === brand._id ? brand : b)),
    })),
  deleteBrand: (brandId) =>
    set((state) => ({
      brands: state.brands.filter((b) => b._id !== brandId),
    })),
});
