"use client";

import Link from "next/link";
import { Wallet, Bell, Settings } from "lucide-react";

export default function AppTopBar({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b">
      <div className="h-12 px-3 flex items-center justify-between">
        <span className="font-semibold text-base [text-wrap:balance]">{title}</span>
        <div className="flex items-center gap-1">
          <Link href="/wallet" className="p-2 rounded-lg hover:bg-muted" aria-label="지갑">
            <Wallet className="w-5 h-5" />
          </Link>
          <button className="p-2 rounded-lg hover:bg-muted" aria-label="알림">
            <Bell className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-lg hover:bg-muted" aria-label="설정">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
