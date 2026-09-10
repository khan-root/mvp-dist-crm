import { StateCreator } from "zustand";

export interface RoleItem {
  _id: string;
  name: string;
  code: string;
  description?: string;
  is_default?: boolean;
  permissions?: {
    modules?: Array<{ module_name: string; actions: string[] }>;
  };
}

export interface UserItem {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role_id?: { _id?: string; name: string; code: string };
  assigned_facility?: string;
  assigned_warehouse_id?: { _id: string; warehouse_name: string; warehouse_code: string };
  status: string;
}

export interface RolesSlice {
  roles: RoleItem[];
  users: UserItem[];
  setRoles: (roles: RoleItem[]) => void;
  addRole: (role: RoleItem) => void;
  updateRole: (role: RoleItem) => void;
  setUsers: (users: UserItem[]) => void;
  addUser: (user: UserItem) => void;
  updateUser: (user: UserItem) => void;
}

export const createRolesSlice: StateCreator<RolesSlice, [], [], RolesSlice> = (set) => ({
  roles: [],
  users: [],

  setRoles: (roles) => set({ roles }),
  addRole: (role) => set((state) => ({ roles: [role, ...state.roles] })),
  updateRole: (role) =>
    set((state) => ({
      roles: state.roles.map((r) => (r._id === role._id ? role : r)),
    })),

  setUsers: (users) => set({ users }),
  addUser: (user) => set((state) => ({ users: [user, ...state.users] })),
  updateUser: (user) =>
    set((state) => ({
      users: state.users.map((u) => (u._id === user._id ? user : u)),
    })),
});
