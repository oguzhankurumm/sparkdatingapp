'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, Button, Skeleton } from '@spark/ui'
import { CaretLeft, UserMinus, MagnifyingGlass, Prohibit } from '@phosphor-icons/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface BlockedUser {
  id: string
  userId: string
  firstName: string
  avatarUrl: string | null
  blockedAt: string
}

// ──────────────────────────────────────────────
// Hooks
// ──────────────────────────────────────────────

function useBlockedUsers() {
  return useQuery({
    queryKey: ['blocked-users'],
    queryFn: () => api.get<BlockedUser[]>('/users/me/blocked'),
    staleTime: 30_000,
  })
}

function useUnblockUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => api.delete(`/users/me/blocked/${userId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['blocked-users'] }),
  })
}

// ──────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────

export default function BlockedUsersPage() {
  const router = useRouter()
  const { data: blocked, isLoading } = useBlockedUsers()
  const unblock = useUnblockUser()
  const [search, setSearch] = useState('')
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const filtered = (blocked ?? []).filter((u) =>
    u.firstName.toLowerCase().includes(search.toLowerCase()),
  )

  const handleUnblock = useCallback(
    async (userId: string) => {
      await unblock.mutateAsync(userId)
      setConfirmId(null)
    },
    [unblock],
  )

  return (
    <div className="mx-auto max-w-2xl pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pb-2 pt-4">
        <button
          onClick={() => router.back()}
          className="text-text-muted hover:text-text-primary flex h-9 w-9 items-center justify-center rounded-full transition-colors"
          aria-label="Go back"
        >
          <CaretLeft className="h-5 w-5" />
        </button>
        <h1 className="text-text-primary text-xl font-bold">Blocked Users</h1>
      </div>

      {/* Search */}
      {(blocked?.length ?? 0) > 0 && (
        <div className="px-4 pb-4">
          <div className="border-border bg-surface-elevated flex items-center gap-2 rounded-xl border px-3 py-2.5">
            <MagnifyingGlass className="text-text-muted h-4 w-4 shrink-0" />
            <input
              type="text"
              placeholder="Search blocked users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-text-primary placeholder:text-text-muted w-full bg-transparent text-sm outline-none"
            />
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3 px-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
          <div className="bg-surface mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <Prohibit className="text-text-muted h-8 w-8" />
          </div>
          <p className="text-text-primary mb-1 font-semibold">
            {search ? 'No results' : 'No blocked users'}
          </p>
          <p className="text-text-muted text-sm">
            {search
              ? 'Try a different search term'
              : 'Users you block will appear here. You can unblock them at any time.'}
          </p>
        </div>
      )}

      {/* List */}
      {!isLoading && filtered.length > 0 && (
        <div className="space-y-2 px-4">
          {filtered.map((user) => (
            <div
              key={user.id}
              className="border-border bg-surface-elevated flex items-center gap-3 rounded-2xl border p-4"
            >
              <Avatar src={user.avatarUrl} fallback={user.firstName.charAt(0)} size="md" />
              <div className="min-w-0 flex-1">
                <p className="text-text-primary text-sm font-semibold">{user.firstName}</p>
                <p className="text-text-muted text-xs">
                  Blocked {new Date(user.blockedAt).toLocaleDateString()}
                </p>
              </div>
              {confirmId === user.userId ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmId(null)}
                    className="text-text-muted"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleUnblock(user.userId)}
                    loading={unblock.isPending}
                  >
                    Unblock
                  </Button>
                </div>
              ) : (
                <Button variant="secondary" size="sm" onClick={() => setConfirmId(user.userId)}>
                  <UserMinus className="h-4 w-4" />
                  Unblock
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      <p className="text-text-muted px-4 py-6 text-center text-xs">
        Blocked users cannot see your profile, send you messages, or match with you.
      </p>
    </div>
  )
}
