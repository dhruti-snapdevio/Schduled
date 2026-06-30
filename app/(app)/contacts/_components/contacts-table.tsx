'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import { Archive, ArrowCounterClockwise, MagnifyingGlass, Note, Spinner, Trash } from '@phosphor-icons/react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'


interface Contact {
  email: string
  name: string
  booking_count: number
  last_booked_at: string | null
  last_meeting_at: string | null
  next_meeting_at: string | null
  notes: string | null
  is_archived: boolean | null
  contact_id: string | null
}

type ContactFilter = 'all' | 'new' | 'upcoming'

interface ContactsTableProps {
  contacts: Contact[]
  total: number
  page: number
  search: string
  archived: boolean
  filter: ContactFilter
}

const fmtDate = (v: string | null) =>
  v ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(v)) : '—'

export function ContactsTable({ contacts, total, page, search, archived, filter }: ContactsTableProps) {
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
    // replace (not push) so each keystroke-search doesn't pollute history
    startTransition(() => {
      router.replace(`/contacts?${params.toString()}`, { scroll: false })
    })
  }

  function changePage(p: number) {
    const params = new URLSearchParams(sp.toString())
    params.set('page', String(p))
    router.push(`/contacts?${params.toString()}`)
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
      {/* Toolbar: search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex items-center max-w-xs w-full">
          {isPending ? (
            <Spinner size={14} className="pointer-events-none absolute left-2.5 animate-spin text-primary" />
          ) : (
            <MagnifyingGlass size={14} className="pointer-events-none absolute left-2.5 text-muted-foreground" />
          )}
          <Input
            placeholder="Search by name or email…"
            defaultValue={search}
            className="pl-8"
            onChange={(e) => {
              const val = e.target.value
              if (searchDebounce.current) clearTimeout(searchDebounce.current)
              searchDebounce.current = setTimeout(() => push({ q: val || null }), 350)
            }}
          />
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        {([
          { key: 'all',      label: 'All contacts',      active: !archived && filter === 'all' },
          { key: 'upcoming', label: 'Upcoming meetings', active: !archived && filter === 'upcoming' },
          { key: 'new',      label: 'New contacts',      active: !archived && filter === 'new' },
          { key: 'archived', label: 'Archived',          active: archived },
        ] as const).map(({ key, label, active }) => (
          <button
            key={key}
            type="button"
            onClick={() =>
              key === 'archived'
                ? push({ archived: '1', filter: null })
                : push({ archived: null, filter: key === 'all' ? null : key })
            }
            className={cn(
              'inline-flex items-center gap-1.5 border px-3 py-1.5 text-sm font-medium transition-colors',
              active
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-border">
        <Table className="w-full min-w-[640px] table-fixed">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[16%]">Name</TableHead>
              <TableHead className="w-[20%]">Email</TableHead>
              <TableHead className="hidden sm:table-cell w-[8%]">Bookings</TableHead>
              <TableHead className="hidden md:table-cell w-[14%]">Last meeting</TableHead>
              <TableHead className="hidden md:table-cell w-[14%]">Next meeting</TableHead>
              <TableHead className="hidden xl:table-cell w-[16%]">Notes</TableHead>
              <TableHead className="w-[12%] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                  {search
                    ? 'No contacts match your search.'
                    : archived
                      ? 'No archived contacts.'
                      : filter === 'upcoming'
                        ? 'No contacts with upcoming meetings.'
                        : filter === 'new'
                          ? 'No new contacts in the last 30 days.'
                          : 'No contacts yet.'}
                </TableCell>
              </TableRow>
            ) : (
              contacts.map((c) => (
                <TableRow key={c.email} className="transition-colors duration-150 hover:bg-primary/[0.02]">
                  <TableCell className="font-medium truncate">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm truncate">
                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="block truncate cursor-default">{c.email}</span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          {c.email}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{c.booking_count}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {fmtDate(c.last_meeting_at)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {fmtDate(c.next_meeting_at)}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell max-w-[200px]">
                    {c.notes ? (
                      <TooltipProvider delayDuration={300}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="block truncate text-sm text-muted-foreground cursor-default">
                              {c.notes}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="max-w-xs whitespace-pre-wrap break-words text-xs"
                          >
                            {c.notes}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <span className="text-xs text-muted-foreground/40">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Edit note" aria-label="Edit note"
                        onClick={() => openNote(c)}
                        disabled={isPending}
                      >
                        <Note size={15} />
                      </Button>
                      {c.is_archived ? (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Restore" aria-label="Restore"
                          onClick={() => handleUnarchive(c.email)}
                          disabled={isPending}
                        >
                          <ArrowCounterClockwise size={15} />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Archive" aria-label="Archive"
                          onClick={() => handleArchive(c.email, c.name)}
                          disabled={isPending}
                        >
                          <Archive size={15} />
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Delete" aria-label="Delete"
                            className="text-destructive hover:text-destructive"
                            disabled={isPending}
                          >
                            <Trash size={15} />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove {c.name}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              {c.email} will be removed from your contacts. They&apos;ll reappear if they book again.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => handleDelete(c.email)}
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {total > pageSize && (
        <div className="flex flex-wrap items-center justify-between border-t border-border px-4 py-3">
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
