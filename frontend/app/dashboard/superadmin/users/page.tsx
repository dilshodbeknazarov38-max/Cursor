'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { API_BASE_URL } from '@/lib/api';
import { getClientAccessToken } from '@/lib/session';

type UserStatus = 'ACTIVE' | 'BLOCKED' | 'INACTIVE';

type UserRow = {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string;
  nickname: string;
  status: UserStatus;
  role: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

type RoleOption = {
  id: string;
  name: string;
  slug: string;
};

type UsersResponse = {
  data: UserRow[];
  meta: {
    totalItems: number;
    totalPages: number;
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
};

const STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: 'Faol',
  BLOCKED: 'Bloklangan',
  INACTIVE: 'Faol emas',
};

const SuperAdminUsersPage = () => {
  const { toast } = useToast();
  const { user: currentUser, permissions } = useAuth();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [meta, setMeta] = useState<UsersResponse['meta']>({
    totalItems: 0,
    totalPages: 1,
    page: 1,
    limit,
    hasNext: false,
    hasPrevious: false,
  });
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

  const canManageUsers = useMemo(
    () =>
      permissions.some((permission) =>
        permission.href?.startsWith('/dashboard/superadmin/users'),
      ),
    [permissions],
  );

  const formatFullName = (user: UserRow) => {
    const parts = [user.firstName, user.lastName ?? ''].map((part) =>
      part?.trim(),
    );
    const name = parts.filter(Boolean).join(' ');
    return name.length > 0 ? name : user.nickname;
  };

  const fetchRoles = useCallback(async () => {
    try {
      const token = getClientAccessToken();
      if (!token) {
        return;
      }
      const response = await fetch(`${API_BASE_URL}/users/roles`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Rollar ro‘yxatini yuklab bo‘lmadi.');
      }
      const data: RoleOption[] = await response.json();
      setRoles(data);
    } catch (fetchError) {
      console.error(fetchError);
      toast({
        title: 'Xatolik',
        description: 'Rollar ro‘yxatini yuklab bo‘lmadi.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const fetchUsers = useCallback(
    async (currentPage: number, currentSearch: string) => {
      setLoading(true);
      setError(null);
      try {
        const token = getClientAccessToken();
        if (!token) {
          setError('Seans ma’lumotlari topilmadi. Iltimos, qayta kiring.');
          setUsers([]);
          return;
        }

        const params = new URLSearchParams({
          page: String(currentPage),
          limit: String(limit),
        });

        if (currentSearch.trim().length > 0) {
          params.set('search', currentSearch.trim());
        }

        const response = await fetch(
          `${API_BASE_URL}/admin/users?${params.toString()}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
            credentials: 'include',
          },
        );

        if (response.status === 401) {
          setError('Seans muddati tugagan. Iltimos, qayta kiring.');
          setUsers([]);
          return;
        }

        if (!response.ok) {
          const body = await response.json().catch(() => null);
          const message =
            typeof body?.message === 'string'
              ? body.message
              : 'Foydalanuvchilar ro‘yxatini yuklab bo‘lmadi.';
          throw new Error(message);
        }

        const data: UsersResponse = await response.json();
        setUsers(data.data);
        setMeta(data.meta);
      } catch (fetchError) {
        const message =
          fetchError instanceof Error
            ? fetchError.message
            : 'Foydalanuvchilar ro‘yxatini yuklashda xatolik yuz berdi.';
        setError(message);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    },
    [limit],
  );

  useEffect(() => {
    if (canManageUsers) {
      fetchRoles();
    }
  }, [canManageUsers, fetchRoles]);

  useEffect(() => {
    if (canManageUsers) {
      fetchUsers(page, search);
    } else {
      setUsers([]);
    }
  }, [canManageUsers, fetchUsers, page, search]);

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchInput.trim();
    setPage(1);
    if (query === search.trim()) {
      fetchUsers(1, query);
    } else {
      setSearch(query);
      setSearchInput(query);
    }
  };

  const handleRoleChange = async (user: UserRow, roleSlug: string) => {
    setPendingActionId(user.id);
    try {
      const token = getClientAccessToken();
      if (!token) {
        throw new Error('Seans ma’lumotlari topilmadi.');
      }

      const response = await fetch(
        `${API_BASE_URL}/admin/users/${user.id}/role`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ roleSlug }),
        },
      );

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const message =
          typeof body?.message === 'string'
            ? body.message
            : 'Rolni o‘zgartirishda xatolik yuz berdi.';
        throw new Error(message);
      }

      const updatedUser: UserRow = await response.json();

      setUsers((prev) =>
        prev.map((item) => (item.id === user.id ? updatedUser : item)),
      );
      toast({
        title: 'Rol yangilandi',
        description: `${formatFullName(updatedUser)} uchun rol muvaffaqiyatli o‘zgartirildi.`,
      });
    } catch (updateError) {
      const message =
        updateError instanceof Error
          ? updateError.message
          : 'Rolni o‘zgartirishda xatolik yuz berdi.';
      toast({
        title: 'Xatolik',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setPendingActionId(null);
    }
  };

  const handleBlockToggle = async (user: UserRow, block: boolean) => {
    setPendingActionId(user.id);
    try {
      const token = getClientAccessToken();
      if (!token) {
        throw new Error('Seans ma’lumotlari topilmadi.');
      }

      const response = await fetch(
        `${API_BASE_URL}/admin/users/${user.id}/block`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ block }),
        },
      );

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const message =
          typeof body?.message === 'string'
            ? body.message
            : 'Hisobni bloklashda xatolik yuz berdi.';
        throw new Error(message);
      }

      const updatedUser: UserRow = await response.json();
      setUsers((prev) =>
        prev.map((item) => (item.id === user.id ? updatedUser : item)),
      );
      toast({
        title: block ? 'Hisob bloklandi' : 'Hisob faollashtirildi',
        description: `${formatFullName(updatedUser)} uchun holat yangilandi.`,
      });
    } catch (updateError) {
      const message =
        updateError instanceof Error
          ? updateError.message
          : 'Hisob holatini yangilashda xatolik yuz berdi.';
      toast({
        title: 'Xatolik',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setPendingActionId(null);
    }
  };

  const disableActionsForUser = (user: UserRow) => {
    if (!canManageUsers) {
      return true;
    }
    const isTargetSuperAdmin = user.role?.slug === 'SUPER_ADMIN';
    if (isTargetSuperAdmin && user.id !== currentUser?.id) {
      return true;
    }
    return false;
  };

  return (
    <DashboardLayout role="superadmin">
      <div className="space-y-6">
        <header className="space-y-2">
          <h2 className="text-2xl font-semibold text-slate-900">
            Foydalanuvchilar boshqaruvi
          </h2>
          <p className="text-sm text-slate-500">
            Barcha foydalanuvchilarni qidiring, ularning rollari va holatini
            boshqaring.
          </p>
        </header>

        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Label htmlFor="search" className="text-sm font-medium text-slate-700">
              Qidiruv
            </Label>
              <Input
                id="search"
                name="search"
                placeholder="Ism, telefon yoki email"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                className="sm:w-72"
              />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              Qidirish
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                  const nextSearch = '';
                  setPage(1);
                  setSearchInput(nextSearch);
                  if (nextSearch === search.trim()) {
                    fetchUsers(1, nextSearch);
                  } else {
                    setSearch(nextSearch);
                  }
              }}
              disabled={loading && search === ''}
            >
              Tozalash
            </Button>
          </div>
        </form>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  F.I.Sh
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Telefon
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Rol
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Bloklash
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-sm text-slate-500"
                  >
                    Ma’lumotlar yuklanmoqda...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-sm text-slate-500"
                  >
                    Foydalanuvchilar topilmadi.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const isBlocked = user.status === 'BLOCKED';
                  const disableActions = disableActionsForUser(user);
                  const isPending = pendingActionId === user.id;

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 text-sm font-mono text-slate-500">
                        {user.id.slice(0, 8)}…
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        <div className="font-medium text-slate-900">
                          {formatFullName(user)}
                        </div>
                        <div className="text-xs text-slate-500">
                          @{user.nickname}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {user.email ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {user.phone}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        <select
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                          value={user.role?.slug ?? ''}
                          onChange={(event) =>
                            handleRoleChange(user, event.target.value)
                          }
                          disabled={disableActions || isPending}
                        >
                          <option value="" disabled>
                            Rolni tanlang
                          </option>
                          {roles.map((role) => (
                            <option key={role.id} value={role.slug}>
                              {role.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                            isBlocked
                              ? 'bg-red-100 text-red-700'
                              : user.status === 'INACTIVE'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {STATUS_LABELS[user.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={isBlocked}
                            onCheckedChange={(checked) =>
                              handleBlockToggle(user, checked === true)
                            }
                            disabled={disableActions || isPending}
                          />
                          <span className="text-xs text-slate-500">
                            {isBlocked ? 'Bloklangan' : 'Faol'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm sm:flex-row">
          <div>
            Jami foydalanuvchilar: {meta.totalItems.toLocaleString('uz-UZ')} | Sahifa:{' '}
            {meta.page} / {meta.totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={loading || !meta.hasPrevious}
            >
              Oldingi
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setPage((prev) => (meta.hasNext ? prev + 1 : prev))
              }
              disabled={loading || !meta.hasNext}
            >
              Keyingi
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SuperAdminUsersPage;
