"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, Plug, ShoppingBag, Leaf, Copy, Check } from "lucide-react";
import { loadCoinState, saveCoinState, loadHistory, pushHistory, genCode, CoinTxn } from "@/lib/coin";
import { useRouter } from "next/navigation";

type Reward = { id: string; name: string; cost: number; icon: "plug" | "bag" | "leaf"; note?: string };

const REWARDS: Reward[] = [
  { id: "ev10",  name: "EV 충전권 10kWh", cost: 10, icon: "plug", note: "모바일 바코드" },
  { id: "ev30",  name: "EV 충전권 30kWh", cost: 30, icon: "plug" },
  { id: "appl1", name: "친환경 공기청정기 할인쿠폰", cost: 80, icon: "bag" },
  { id: "fash1", name: "리사이클 패션 브랜드 상품권", cost: 30, icon: "bag" },
  { id: "re100", name: "재생에너지 전력상품 구매권", cost: 80, icon: "leaf" },
];

export default function RewardsPage() {
  const router = useRouter();
  const [bal, setBal] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [vouchers, setVouchers] = useState<CoinTxn[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setBal(loadCoinState().balance || 0);
    setVouchers(loadHistory().filter((t) => t.type === "redeem").reverse());
  }, []);

  const icon = (t: Reward["icon"]) =>
    t === "plug" ? <Plug className="w-4 h-4" /> : t === "leaf" ? <Leaf className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />;

  const redeem = async (r: Reward) => {
    const st = loadCoinState();
    if ((st.balance || 0) < r.cost) {
      setMsg("코인이 부족합니다.");
      return;
    }
    st.balance -= r.cost;
    saveCoinState(st);
    setBal(st.balance);

    // 바우처 코드 생성 + 히스토리 저장
    const code = genCode(r.id.toUpperCase());
    const txn: CoinTxn = {
      id: code,
      ts: Date.now(),
      type: "redeem",
      title: r.name,
      amountC: r.cost,
      meta: { rewardId: r.id, code, note: r.note },
    };
    const hist = pushHistory(txn);
    setVouchers([txn, ...vouchers]);
    setMsg(`${r.name} 교환 완료! -${r.cost}C`);
  };

  const copy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1200);
    } catch {}
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-4">
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 text-sm">
            <Coins className="w-4 h-4 text-emerald-600" />
            <span>코인 교환</span>
          </div>
          <div className="mt-2 text-2xl font-bold">{bal.toLocaleString()} C</div>
          <div className="text-xs text-muted-foreground">1kg CO₂ 절감 = 1C</div>
          {msg && <div className="mt-2 text-xs rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 inline-block">{msg}</div>}
        </CardContent>
      </Card>

      {/* 교환 가능한 상품 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {REWARDS.map((r) => (
          <Card key={r.id} className="rounded-2xl">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {icon(r.icon)}
                  <div className="text-sm font-medium">{r.name}</div>
                </div>
                <Badge variant="outline">{r.cost} C</Badge>
              </div>
              {r.note && <div className="text-[11px] text-muted-foreground">{r.note}</div>}
              <Button className="w-full rounded-xl h-9" onClick={() => redeem(r)}>교환하기</Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 내 교환 내역 (바우처) */}
      {vouchers.length > 0 && (
        <Card className="rounded-2xl">
          <CardContent className="p-4 md:p-5 space-y-3">
            <div className="text-sm font-medium">내 교환 내역</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {vouchers.map((v) => (
                <div key={v.id} className="rounded-xl border p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">{v.title}</div>
                    <Badge variant="outline">-{v.amountC} C</Badge>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {new Date(v.ts).toLocaleString()}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <code className="px-2 py-1 rounded bg-muted text-sm">{v.meta?.code}</code>
                    <Button
                      variant="ghost"
                      className="h-8 px-2 border rounded-lg"
                      onClick={() => copy(v.meta?.code, v.id)}
                    >
                      {copiedId === v.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  {v.meta?.note && <div className="text-[11px] text-muted-foreground mt-1">{v.meta.note}</div>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Button variant="ghost" className="border rounded-xl" onClick={() => router.push("/")}>홈으로</Button>
    </div>
  );
}
