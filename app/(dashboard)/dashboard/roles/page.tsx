import { cookies } from "next/headers";
import { getServerApiBaseUrl } from "@/lib/api";
import { RolesClientView } from "./roles-client-view";

async function getRolesAndUsers() {
  const cookieStore = await cookies();
  const headers = { Cookie: cookieStore.toString() };

  const [rolesRes, usersRes] = await Promise.all([
    fetch(`${getServerApiBaseUrl()}/api/roles`, { headers, cache: "no-store" }),
    fetch(`${getServerApiBaseUrl()}/api/users`, { headers, cache: "no-store" }),
  ]);

  const rolesData = rolesRes.ok ? await rolesRes.json() : { data: [] };
  const usersData = usersRes.ok ? await usersRes.json() : { data: [] };

  return {
    roles: rolesData.data || [],
    users: usersData.data || [],
  };
}

export default async function RolesPage() {
  const { roles, users } = await getRolesAndUsers();
  return <RolesClientView initialRoles={roles} initialUsers={users} />;
}
