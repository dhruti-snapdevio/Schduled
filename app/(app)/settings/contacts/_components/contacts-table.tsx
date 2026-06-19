'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import { Archive, ArrowCounterClockwise, Note, Trash } from '@phosphor-icons/react'
import {
  archiveContact,
  deleteContact,
  unarchiveContact,
  upsertContactNote,
} from '@/app/actions/settings'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'


interface Contact {
  email: string
  name: string
  booking_count: number
  last_booked_at: string | null
  notes: string | null
  is_archived: boolean | null
  contact_id: string | null
}

interface ContactsTableProps {
  contacts: Contact[]
  total: number
  page: number
  search: string
  archived: boolean
}

export function ContactsTable({ contacts, total, page, search, archived }: ContactsTableProps) {
  const router          = useRouter()
  const sp              = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [noteTarget, setNoteTarget] = useState<Contact | null>(null)
  const [noteDraft, setNoteDraft]   = useState('')
  const [noteSaving, setNoteSaving] = useState(false)
  const searchDebounce              = useRef<ReturnType<typeof setTimeout> | null>(null)

  const pageSize  = 20
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  function push(updates: Record<string, string | null>) {
    const params = new URLSearchParams(sp.toString())
    Object.entries(updates).forEach(([k, v]) => {
      if (v === null || v === '') params.delete(k)
      else params.set(k, v)
    })
    params.set('page', '1')
    router.push(`/settings/contacts?${params.toString()}`)
  }

  function changePage(p: number) {
    const params = new URLSearchParams(sp.toString())
    params.set('page', String(p))
    router.push(`/settings/contacts?${params.toString()}`)
  }

  function handleArchive(email: string, name: string) {
    startTransition(async () => {
      await archiveContact(email, name)
      router.refresh()
    })
  }

  function handleUnarchive(email: string) {
    startTransition(async () => {
      await unarchiveContact(email)
      router.refresh()
    })
  }

  function handleDelete(email: string) {
    if (!confirm(`Remove ${email} from contacts? They will reappear if they book again.`)) return
    startTransition(async () => {
      await deleteContact(email)
      router.refresh()
    })
  }

  function openNote(contact: Contact) {
    setNoteTarget(contact)
    setNoteDraft(contact.notes ?? '')
  }

  async function saveNote() {
    if (!noteTarget) return
    setNoteSaving(true)
    await upsertContactNote(noteTarget.email, noteTarget.name, noteDraft)
    setNoteSaving(false)
    setNoteTarget(null)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search by name or email…"
          defaultValue={search}
          className="max-w-xs"
          onChange={(e) => {
            const val = e.target.value
            if (searchDebounce.current) clearTimeout(searchDebounce.current)
            searchDebounce.current = setTimeout(() => push({ q: val || null }), 400)
          }}
        />
        <Button
          variant={archived ? 'default' : 'outline'}
          size="sm"
          onClick={() => push({ archived: archived ? null : '1' })}
        >
          {archived ? 'Show active' : 'View archived'}
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="hidden sm:table-cell">Bookings</TableHead>
              <TableHead className="hidden md:table-cell">Last booked</TableHead>
              <TableHead className="hidden lg:table-cell w-32">Notes</TableHead>
              <TableHead className="w-28 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                  {search ? 'No contacts match your search.' : archived ? 'No archived contacts.' : 'No contacts yet.'}
                </TableCell>
              </TableRow>
            ) : (
              contacts.map((c) => (
                <TableRow key={c.email}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground text-xs sm:text-sm truncate max-w-[140px] sm:max-w-none">{c.email}</TableCell>
                  <TableCell className="hidden sm:table-cell">{c.booking_count}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {c.last_booked_at
                      ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(c.last_booked_at))
                      : '—'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {c.notes ? (
                      <span className="line-clamp-1 text-xs text-muted-foreground">{c.notes}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground/40">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Edit note"
                        onClick={() => openNote(c)}
                        disabled={isPending}
                      >
                        <Note size={15} />
                      </Button>
                      {c.is_archived ? (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Restore"
                          onClick={() => handleUnarchive(c.email)}
                          disabled={isPending}
                        >
                          <ArrowCounterClockwise size={15} />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Archive"
                          onClick={() => handleArchive(c.email, c.name)}
                          disabled={isPending}
                        >
                          <Archive size={15} />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Delete"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(c.email)}
                        disabled={isPending}
                      >
                        <Trash size={15} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {total > pageSize && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">
              {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => changePage(page - 1)}>
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => changePage(page + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Notes dialog */}
      <Dialog open={!!noteTarget} onOpenChange={(open) => { if (!open) setNoteTarget(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogTitle>Note for {noteTarget?.name}</DialogTitle>
          <DialogDescription className="sr-only">Add or edit a private note for this contact.</DialogDescription>
          <Textarea
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            placeholder="Add a private note…"
            rows={4}
            className="resize-none"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setNoteTarget(null)}>
              Cancel
            </Button>
            <Button size="sm" disabled={noteSaving} onClick={saveNote}>
              {noteSaving ? 'Saving…' : 'Save note'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
