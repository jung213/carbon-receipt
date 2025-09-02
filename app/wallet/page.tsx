"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { ReactNode } from "react";
import {
  Coins, Gift, LineChart, ShieldCheck, Plug, ShoppingBag, Leaf,
  ChevronRight, Filter, Copy, Check, Trash2
} from "lucide-react";
import { loadCoinState, loadHistory, saveHistory, CoinTxn } from "@/lib/coin";

type FilterType = "all" | "redeem" | "invest" | "award";

export default function WalletPage() {
  const router = useRouter();
  const [bal, setBal] = useState(0);
  const [hist, setHist] = useState<CoinTxn[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [ft, setFt] = useState<FilterType>("all");

  // 초기 로드
  useEffect(() => {
    setBal(loadCoinState().balance || 0);
    // 최신순으로
    setHist(loadHistory().slice().sort((a, b) => b.ts - a.ts));
  }, []);

  // 필터링
  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return hist.filter((t) => {
      const okType = ft === "all" ? true : t.type === ft;
      const okKw =
        kw === "" ||
        t.title.toLowerCase().includes(kw) ||
        String(t.meta?.code ?? "").toLowerCase().includes(kw);
      return okType && okKw;
    });
  }, [hist, q, ft]);

  const resetHistory = () => {
    if (!confirm("내역을 모두 삭제할까요? (코인 잔액은 유지)")) return;
    saveHistory([]);
    setHist([]);
  };

  const copy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 1200);
    } catch {}
  };

  const iconByType = (t: CoinTxn): ReactNode => {
    if (t.type === "redeem") {
      // 보상 종류를 알 수 있으면 더 세분화
      const rid = String(t.meta?.rewardId ?? "");
      if (rid.startsWith("ev")) return <Plug className="w-4 h-4" />;
      if (rid.startsWith("re")) return <Leaf className="w-4 h-4" />;
      return <ShoppingBag className="w-4 h-4" />;
    }
    if (t.type === "invest") return <LineChart className="w-4 h-4" />;
    return <Gift className="w-4 h-4" />; // award
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-4">
      {/* 헤더/요약 */}
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Coins className="w-4 h-4 text-emerald-600" />
            <span>지갑 & 내역</span>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold">{bal.toLocaleString()} C</div>
            <div className="text-xs text-muted-foreground">1kg CO₂ 절감 = 1C</div>
          </div>
          <div className="flex gap-2">
            <Button className="h-9 rounded-xl" onClick={() => router.push("/rewards")}>
              교환/구매
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
            <Button variant="ghost" className="h-9 rounded-xl border" onClick={() => router.push("/invest")}>
              투자하기
            </Button>
            <Button variant="ghost" className="h-9 rounded-xl border ml-auto" onClick={() => window.print()}>
              내보내기
            </Button>
            <Button variant="ghost" className="h-9 rounded-xl border" onClick={resetHistory}>
              <Trash2 className="w-4 h-4 mr-1" /> 내역 초기화
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 필터 */}
      <Card className="rounded-2xl">
        <CardContent className="p-4 md:p-5 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-4 h-4 opacity-60" />
            <Input
              placeholder="제목·코드 검색 (예: EV, FUND, BOND, NEW)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="max-w-sm"
            />
            <div className="ml-auto flex gap-2">
              {(["all", "redeem", "invest", "award"] as FilterType[]).map((t) => (
                <Button
                  key={t}
                  variant="ghost"
                  className={`h-8 px-3 rounded-xl border ${ft === t ? "bg-muted/60" : ""}`}
                  onClick={() => setFt(t)}
                >
                  {t === "all" ? "전체" : t === "redeem" ? "교환/구매" : t === "invest" ? "투자" : "자동지급"}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 내역 리스트 */}
      {filtered.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="p-6 text-sm text-muted-foreground">
            표시할 내역이 없습니다.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map((t) => {
            const isMinus = t.type === "redeem" || t.type === "invest";
            return (
              <Card key={t.id} className="rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {iconByType(t)}
                      <div>
                        <div className="text-sm font-medium">{t.title}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {new Date(t.ts).toLocaleString()}
                          {t.meta?.month && ` · ${t.meta.month}`}
                          {t.meta?.status && ` · ${t.meta.status}`}
                        </div>
                      </div>
                    </div>

                    <div className={`text-sm font-semibold ${isMinus ? "text-rose-600" : "text-emerald-600"}`}>
                      {isMinus ? "-" : "+"}{t.amountC} C
                    </div>
                  </div>

                  {/* 코드/부가정보 */}
                  {(t.meta?.code || t.meta?.rewardId || t.meta?.instrumentId) && (
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      {t.meta?.code && (
                        <>
                          <code className="px-2 py-1 rounded bg-muted text-sm">{t.meta.code}</code>
                          <Button
                            variant="ghost"
                            className="h-8 px-2 border rounded-lg"
                            onClick={() => copy(String(t.meta.code), t.id)}
                          >
                            {copied === t.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </>
                      )}
                      {t.meta?.rewardId && (
                        <Badge variant="outline">보상: {t.meta.rewardId}</Badge>
                      )}
                      {t.meta?.instrumentId && (
                        <Badge variant="outline">
                          {t.meta.kind === "fund" ? "펀드" : "채권"}: {t.meta.instrumentId}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
