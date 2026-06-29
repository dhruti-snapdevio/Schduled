"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { format } from "date-fns";
import {
  CheckCircle,
  Copy,
  EnvelopeSimple,
  MagnifyingGlass,
  Trash,
} from "@phosphor-icons/react";
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
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { paginationRange } from "@/lib/utils";
import { deleteSubscriberAction } from "@/app/actions/subscribers";

export type SubscriberRow = {
  id: string;
  email: string;
  createdAt: string;
};

const PAGE_SIZE = 15;

function initials(email: string) {
  return email.slice(0, 2).toUpperCase();
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }
  return (
    <button
      onClick={handleCopy}
      title="Copy email"
      className="inline-flex items-center text-muted-foreground/40 transition-colors hover:text-primary"
    >
      {copied ? (
        <CheckCircle size={13} weight="fill" className="text-primary" />
      ) : (
        <Copy size={13} />
      )}
    </button>
  );
}

export function SubscribersTable({
  subscribers,
}: {
  subscribers: SubscriberRow[];
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setPage(1);
  }, [search]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q
      ? subscribers.filter((s) => s.email.toLowerCase().includes(q))
      : subscribers;
  }, [subscribers, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const slice = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function handleDelete(id: string) {
    startTransition(() => deleteSubscriberAction(id));
  }

  return (
    <div className="relative">
      {/* ── Title + Search bar ──────────────────────────────────────── */}
      <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-base font-semibold text-foreground">All Subscribers</p>
          <p className="text-sm text-muted-foreground">
            Email addresses collected from the landing page footer form.
          </p>
        </div>

        <div className="relative w-full lg:w-64">
          <MagnifyingGlass
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            placeholder="Search by email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full border border-border bg-page pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* ── Summary strip ───────────────────────────────────────────── */}
      <div className="flex items-center gap-2.5 border-b border-border px-4 py-2 text-xs text-muted-foreground">
        <span>
          <strong className="font-semibold text-foreground">{subscribers.length}</strong>{" "}
          total subscriber{subscribers.length !== 1 ? "s" : ""}
        </span>
        {search && (
          <>
            <span className="text-border">·</span>
            <span>
              <strong className="font-semibold text-foreground">{filtered.length}</strong>{" "}
              match{filtered.length !== 1 ? "es" : ""}
            </span>
          </>
        )}
      </div>

      {/* ── Table ───────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <Table className="w-full text-sm">
          <TableHeader>
            <TableRow className="border-b border-border bg-muted/40">
              <TableHead className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-ui text-muted-foreground">
                Subscriber
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-ui text-muted-foreground">
                Email Address
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-ui text-muted-foreground">
                Subscribed On
              </TableHead>
              <TableHead className="w-12 px-4 py-3" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="px-6 py-16 text-center text-sm text-muted-foreground"
                >
                  {search
                    ? "No subscribers match your search."
                    : "No subscribers yet. Share your landing page to grow your list."}
                </TableCell>
              </TableRow>
            ) : (
              slice.map((s) => (
                <TableRow
                  key={s.id}
                  className="border-b border-border transition-colors last:border-0 hover:bg-muted/20"
                >
                  {/* Avatar */}
                  <TableCell className="px-4 py-3">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {initials(s.email)}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>

                  {/* Email */}
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <EnvelopeSimple
                        size={14}
                        className="shrink-0 text-muted-foreground/40"
                      />
                      <span className="font-mono text-sm">{s.email}</span>
                      <CopyButton text={s.email} />
                    </div>
                  </TableCell>

                  {/* Date */}
                  <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                    {format(new Date(s.createdAt), "MMM d, yyyy")}
                  </TableCell>

                  {/* Delete */}
                  <TableCell className="px-4 py-3">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          disabled={isPending}
                        >
                          <Trash size={14} />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove subscriber?</AlertDialogTitle>
                          <AlertDialogDescription>
                            <span className="font-mono">{s.email}</span> will be
                            permanently removed from the subscriber list.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => handleDelete(s.id)}
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Footer: count + pagination ───────────────────────────────── */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between gap-3 border-t border-border px-6 py-3">
          <p className="text-xs text-muted-foreground">
            Showing{" "}
            <strong className="font-semibold text-foreground">
              {(safePage - 1) * PAGE_SIZE + 1}–
              {Math.min(safePage * PAGE_SIZE, filtered.length)}
            </strong>{" "}
            of{" "}
            <strong className="font-semibold text-foreground">
              {filtered.length}
            </strong>
          </p>

          {totalPages > 1 && (
            <Pagination className="mx-0 w-auto">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    aria-disabled={safePage <= 1}
                    className={safePage <= 1 ? "pointer-events-none opacity-40" : ""}
                    onClick={(e) => {
                      e.preventDefault();
                      if (safePage > 1) setPage(safePage - 1);
                    }}
                  />
                </PaginationItem>

                {paginationRange(safePage, totalPages).map((p, i) =>
                  p === "ellipsis" ? (
                    <PaginationItem key={`e-${i}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={p}>
                      <PaginationLink
                        href="#"
                        isActive={p === safePage}
                        onClick={(e) => {
                          e.preventDefault();
                          setPage(p);
                        }}
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    aria-disabled={safePage >= totalPages}
                    className={
                      safePage >= totalPages ? "pointer-events-none opacity-40" : ""
                    }
                    onClick={(e) => {
                      e.preventDefault();
                      if (safePage < totalPages) setPage(safePage + 1);
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}
    </div>
  );
}
