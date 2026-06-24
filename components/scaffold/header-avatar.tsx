"use client";

import Image from "next/image";
import Link from "next/link";
import { UserCircle } from "@phosphor-icons/react";
import { useAvatar } from "@/components/avatar-context";

export function HeaderAvatar() {
  const { url } = useAvatar();
  return (
    <Link
      href="/profile/profile"
      aria-label="Profile settings"
      className="relative ml-1 flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden bg-primary/10 text-primary transition-opacity hover:opacity-80"
    >
      {url ? (
        <Image fill unoptimized alt="Profile" className="object-cover" sizes="32px" src={url} />
      ) : (
        <UserCircle size={22} />
      )}
    </Link>
  );
}
