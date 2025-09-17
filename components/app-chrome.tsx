"use client";

import { PropsWithChildren } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LineChart, Wallet, Gift, TrendingUp} from "lucide-react";

/**
 * 데스크톱에서는 중앙에 '폰 프레임'으로 감싸고,
 * 모바일에서는 전체화면 + 하단 탭만 보여주는 크롬 UI
 */
export default function AppChrome({ children }: PropsWithChildren) {
  const pathname = usePathname();

  const tabs = [
    { href: "/", label: "홈", icon: Home },
    { href: "/products", label: "비교", icon: LineChart },
    { href: "/rewards", label: "교환", icon: Gift },
    { href: "/invest", label: "투자", icon: TrendingUp },
    { href: "/wallet", label: "지갑", icon: Wallet },
  ];

  return (
    // 바깥 배경: 데스크톱에서만 폰 프레임 느낌을 주기 위해 밝은 배경
    <div className="min-h-screen md:bg-neutral-100 md:py-6 md:px-4">
      {/* 중앙 정렬된 폰 프레임 (모바일에선 프레임 제거) */}
      <div className="mx-auto md:max-w-[430px] md:rounded-[28px] md:shadow-2xl md:ring-1 md:ring-black/10 md:overflow-hidden md:bg-white">
        {/* 콘텐츠 영역(하단 탭 높이만큼 패딩) + 세이프 에어리어 반영 */}
        <main
          className="min-h-[calc(100vh-64px)] pb-[72px]"
          style={{
            paddingTop: "env(safe-area-inset-top)",
            paddingBottom: "max(env(safe-area-inset-bottom), 16px)",
          }}
        >
          {children}
        </main>

        {/* 하단 탭바 (앱 느낌 핵심) */}
        <nav
          className="fixed md:relative bottom-0 left-0 right-0 md:left-auto md:right-auto md:bottom-auto
                     bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70
                     border-t md:border-t-0"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="mx-auto max-w-[430px] px-3">
            <ul className="grid grid-cols-5 h-[64px]">
              {tabs.map((t) => {
                const active = pathname === t.href;
                const Icon = t.icon;
                return (
                  <li key={t.href} className="flex">
                    <Link
                      href={t.href}
                      className={`flex-1 flex flex-col items-center justify-center gap-1 text-xs
                        ${active ? "text-emerald-600" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      <Icon className={`w-5 h-5 ${active ? "" : "opacity-80"}`} />
                      <span className="leading-none">{t.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
      </div>
    </div>
  );
}
