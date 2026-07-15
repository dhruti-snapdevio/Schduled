"use client";

import { useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { Check, Copy, DownloadSimple, PaperPlaneTilt, X } from "@phosphor-icons/react";
import { exportMembersCsvAction, resendInviteAction, revokeInviteAction } from "@/app/actions/members";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type PendingInvite = {
  id: string;
  email: string;
  role: string;
  token: string;
  expiresAt: string;
  createdAt: string;
};

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function PendingInvitesTable({ invites }: { invites: PendingInvite[] }) {
  const [isPending, startTransition] = useTransition();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function copyLink(invite: PendingInvite) {
    const url = `${window.location.origin}/invite/${invite.token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(invite.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  function handleResend(id: string) {
    startTransition(async () => {
      await resendInviteAction(id);
    });
  }

  function handleRevoke(id: string) {
    startTransition(async () => {
      await revokeInviteAction(id);
    });
  }

  async function handleExport(filter: "active" | "pending") {
    const result = await exportMembersCsvAction(filter);
    if ("ok" in result) {
      downloadCsv(result.csv, result.filename);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between border-b border-border py-4">
        <CardTitle className="text-sm font-bold uppercase tracking-ui">
          Pending Invites ({invites.length})
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            className="gap-1.5 text-xs"
            onClick={() => handleExport("pending")}
            size="sm"
            type="button"
            variant="outline"
          >
            <DownloadSimple size={13} />
            Export pending
          </Button>
          <Button
            className="gap-1.5 text-xs"
            onClick={() => handleExport("active")}
            size="sm"
            type="button"
            variant="outline"
          >
            <DownloadSimple size={13} />
            Export members
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="w-full text-sm">
            <TableHeader>
              <TableRow className="border-b border-border bg-muted/40">
                <TableHead className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-ui text-muted-foreground">Email</TableHead>
                <TableHead className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-ui text-muted-foreground">Role</TableHead>
                <TableHead className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-ui text-muted-foreground">Expires</TableHead>
                <TableHead className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-ui text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invites.map((invite) => (
                <TableRow key={invite.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <TableCell className="px-4 py-3 text-sm">{invite.email}</TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge variant="secondary" className="text-xs capitalize">{invite.role}</Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(invite.expiresAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Button
                        className="h-7 gap-1 text-xs"
                        onClick={() => copyLink(invite)}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        {copiedId === invite.id ? <Check size={12} /> : <Copy size={12} />}
                        {copiedId === invite.id ? "Copied" : "Copy link"}
                      </Button>
                      <Button
                        className="h-7 gap-1 text-xs"
                        disabled={isPending}
                        onClick={() => handleResend(invite.id)}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        <PaperPlaneTilt size={12} />
                        Resend
                      </Button>
                      <Button
                        className="h-7 gap-1 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                        disabled={isPending}
                        onClick={() => handleRevoke(invite.id)}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        <X size={12} />
                        Revoke
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
