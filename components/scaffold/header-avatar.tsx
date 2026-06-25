"use client";

import Link from "next/link";
import { UserCircle } from "@phosphor-icons/react";
import { useAvatar } from "@/components/avatar-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function HeaderAvatar() {
  const { url } = useAvatar();
  return (
    <Link
      href="/profile/profile"
      aria-label="Profile settings"
      className="ml-1 shrink-0 rounded-none transition-opacity hover:opacity-80"
    >
      {/* key remounts the Avatar when the URL changes so the fallback shows
          after a photo is removed (Radix keeps a stale "loaded" status). */}
      <Avatar key={url ?? "placeholder"}>
        {url ? <AvatarImage alt="Profile" src={url} /> : null}
        <AvatarFallback className="bg-primary/10 text-primary">
          <UserCircle size={22} />
        </AvatarFallback>
      </Avatar>
    </Link>
  );
}
