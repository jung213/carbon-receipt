"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, LineChart, ShieldCheck } from "lucide-react";
import { loadCoinState, saveCoinState, loadHistory, pushHistory, genCode, CoinTxn } from "@/lib/coin";
import { useRouter } from "next/navigation";

type Instrument = { id: string; kind: "fund" | "bond"; name: string; min: number; note?: string };

const LIST: Instrument[] = [
  { id: "f1", kind: "fund", name: "ESG 인덱스 펀드 A", min: 10, note: "지속가능성 지수 추종" },
  { id: "f2", kind: "fund", name: "그린에너지 테마", min: 20, note: "신재생 중심, 변동성 유의" },
  { id: "b1", kind: "bond", name: "탄소 절감 채권 2025-1", min: 15, note: "프로젝트 파이낸싱(감축 검증)" },
];

export default function InvestPage() {
  const router = useRouter();
  const [bal, setBal] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [positions, setPositions] = useState<CoinTxn[]>([]);

  useEffect(() => {
    setBal(loadCoinState().balance || 0);
    setPositions(loadHistory().filter((t) => t.type === "invest").reverse());
  }, []);

  const invest = (it: Instrument) => {
    const st = loadCoinState();
    if ((st.balance || 0) < it.min) {
      setMsg(`최소 ${it.min}C 이상 필요합니다.`);
      return;
    }
    st.balance -= it.min;
    saveCoinState(st);
    setBal(st.balance);

    // 체결 코드 + 포지션 저장
    const code = genCode((it.kind === "fund" ? "FUND" : "BOND") + "-" + it.id.toUpperCase());
    const txn: CoinTxn = {
      id: code,
      ts: Date.now(),
      type: "invest",
      title: it.name,
      amountC: it.min,
      meta: { instrumentId: it.id, kind: it.kind, code, status: "체결완료" },
    };
    pushHistory(txn);
    setPositions([txn, ...positions]);
    setMsg(`${it.name}에 ${it.min}C 투자 완료!`);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-4">
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 text-sm">
            <Coins className="w-4 h-4 text-emerald-600" />
            <span>코인 투자</span>
          </div>
          <div className="mt-2 text-2xl font-bold">{bal.toLocaleString()} C</div>
          <div className="text-[11px] text-muted-foreground">
            * 데모 시뮬레이션: 실거래 아님. 실제 상품/약관/심사에 따라 달라질 수 있습니다.
          </div>
          {msg && <div className="mt-2 text-xs rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 inline-block">{msg}</div>}
        </CardContent>
      </Card>

      {/* 투자 가능한 상품 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {LIST.map((it) => (
          <Card key={it.id} className="rounded-2xl">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {it.kind === "fund" ? <LineChart className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                  <div className="text-sm font-medium">{it.name}</div>
                </div>
                <Badge variant="outline">{it.kind === "fund" ? "ESG 펀드" : "탄소 절감 채권"}</Badge>
              </div>
              {it.note && <div className="text-[11px] text-muted-foreground">{it.note}</div>}
              <div className="text-xs text-muted-foreground">최소 투자: {it.min} C</div>
              <Button className="w-full rounded-xl h-9" onClick={() => invest(it)}>투자하기</Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 나의 투자 포지션 */}
      {positions.length > 0 && (
        <Card className="rounded-2xl">
          <CardContent className="p-4 md:p-5 space-y-3">
            <div className="text-sm font-medium">나의 투자 포지션</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {positions.map((p) => (
                <div key={p.id} className="rounded-xl border p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">{p.title}</div>
                    <Badge variant="outline">-{p.amountC} C</Badge>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {new Date(p.ts).toLocaleString()} · {p.meta?.status ?? "체결완료"}
                  </div>
                  <div className="mt-2 text-xs">
                    포지션 코드: <code className="px-2 py-1 rounded bg-muted">{p.meta?.code}</code>
                  </div>
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
