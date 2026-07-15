"use client";

import { useTransition } from "react";
import { changeRoleAction } from "@/app/actions/members";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function RoleSelect({
  userId,
  role,
}: {
  userId: string;
  role: "member" | "manager";
}) {
  const [isPending, startTransition] = useTransition();

  function onValueChange(next: string) {
    const fd = new FormData();
    fd.append("userId", userId);
    fd.append("role", next);
    startTransition(async () => {
      await changeRoleAction(fd);
    });
  }

  return (
    <Select value={role} onValueChange={onValueChange} disabled={isPending}>
      <SelectTrigger className="h-7 w-28 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="member">Member</SelectItem>
        <SelectItem value="manager">Manager</SelectItem>
      </SelectContent>
    </Select>
  );
}
