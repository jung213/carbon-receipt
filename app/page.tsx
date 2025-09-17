"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Coins } from "lucide-react";
import { loadCoinState, maybeAutoAward } from "@/lib/coin";
import { useRouter } from "next/navigation";
import AppTopBar from "@/components/app-topbar";
import {
  Download, Leaf, Filter, ChevronRight, X, Bell, Gift, Plus, Calendar,
  TrendingUp, TrendingDown, Award, Target
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

/* =========================
   Types
========================= */
type TxnType =
  | "TRANSFER" | "AUTOPAY" | "BILL" | "FOREIGN" | "ATM"
  | "CARD_PURCHASE" | "DELIVERY" | "TAXI" | "AIRLINE";

type Transaction = {
  user_id: string;
  txn_id: string;
  approved_krw: number;
  merchant_raw: string;
  ts: string; // ISO
  channel: "CARD" | "ACCOUNT";
  txn_type: TxnType;
};

type MerchantRule = {
  match: RegExp;
  category_id: string;
  factor: number; // g/1000 KRW
  source: string;
  assumptions: string[];
  bonusMultiplier?: number;
};

type EnrichedTransaction = Transaction & {
  category_id: string;
  factor: number;
  source: string;
  assumptions: string[];
  gco2e: number;
};

type TopCat = { category_id: string; gco2e: number };

/* =========================
   Mock Data
========================= */
const MOCK_TXNS: Transaction[] = [
  { user_id: "U123", txn_id: "T1", approved_krw: 5800,  merchant_raw: "STARBUCKS SEOUL", ts: "2025-09-13T09:45:00", channel: "CARD",    txn_type: "CARD_PURCHASE" },
  { user_id: "U123", txn_id: "T2", approved_krw: 4300,  merchant_raw: "GS25 HONGDAE",    ts: "2025-09-13T20:10:00", channel: "CARD",    txn_type: "CARD_PURCHASE" },
  { user_id: "U123", txn_id: "T3", approved_krw: 15500, merchant_raw: "BAEMIN DELIVERY", ts: "2025-09-12T19:05:00", channel: "CARD",    txn_type: "DELIVERY" },
  { user_id: "U123", txn_id: "T4", approved_krw: 12000, merchant_raw: "KAKAO TAXI",      ts: "2025-09-11T22:10:00", channel: "CARD",    txn_type: "TAXI" },
  { user_id: "U123", txn_id: "T5", approved_krw: 8900,  merchant_raw: "EDIYA COFFEE",    ts: "2025-09-09T10:05:00", channel: "CARD",    txn_type: "CARD_PURCHASE" },
  { user_id: "U123", txn_id: "T6", approved_krw: 24000, merchant_raw: "LOTTE MART",      ts: "2025-09-08T18:35:00", channel: "CARD",    txn_type: "CARD_PURCHASE" },
  { user_id: "U123", txn_id: "T7", approved_krw: 800000, merchant_raw: "KE AIR TICKET",  ts: "2025-08-10T08:10:00", channel: "CARD",    txn_type: "AIRLINE" },
  { user_id: "U123", txn_id: "T8", approved_krw: 54000,  merchant_raw: "ELECT BILL",     ts: "2025-08-03T10:05:00", channel: "ACCOUNT", txn_type: "BILL" },
];

const MERCHANT_RULES: MerchantRule[] = [
  { match: /STARBUCKS|EDIYA|COFFEE/i,     category_id: "FNB.COFFEE",      factor: 120, source: "SAMPLE_DEFRA", assumptions: ["매장이용"] },
  { match: /GS25|CU|SEVENELEVEN|CONVENIENCE/i, category_id: "RETAIL.CONVENIENCE", factor: 60,  source: "SAMPLE_DEFRA", assumptions: [] },
  { match: /BAEMIN|YOGIYO|DELIVERY/i,     category_id: "FNB.DELIVERY",    factor: 120, source: "SAMPLE_DEFRA", assumptions: ["배달"], bonusMultiplier: 1.1 },
  { match: /KAKAO TAXI|TAXI|UBER/i,       category_id: "MOBILITY.TAXI",   factor: 220, source: "SAMPLE_DEFRA", assumptions: [] },
  { match: /MART|EMART|HOMEPLUS/i,        category_id: "RETAIL.GROCERY",  factor: 55,  source: "SAMPLE_DEFRA", assumptions: [] },
  { match: /AIR|AIRLINE|TICKET/i,         category_id: "MOBILITY.AIR",    factor: 1500,source: "SAMPLE_FACTORS", assumptions: ["항공권"], bonusMultiplier: 1.0 },
  { match: /ELECT BILL|ELECTRIC|UTILITY/i,category_id: "UTILITY.ELECTRIC",factor: 420, source: "KR_GRID_FACTOR", assumptions: ["전력"], bonusMultiplier: 1.0 },
];

const TYPE_FALLBACK: Record<TxnType, MerchantRule> = {
  TRANSFER:      { match: /.*/, category_id: "BANK.TRANSFER",  factor: 0,    source: "N/A", assumptions: ["자금이동"] },
  AUTOPAY:       { match: /.*/, category_id: "BANK.AUTOPAY",   factor: 0,    source: "N/A", assumptions: ["자동이체"] },
  BILL:          { match: /.*/, category_id: "UTILITY.GENERIC",factor: 200,  source: "AVG", assumptions: ["공과금"] },
  FOREIGN:       { match: /.*/, category_id: "BANK.FOREIGN",   factor: 0,    source: "N/A", assumptions: ["해외송금"] },
  ATM:           { match: /.*/, category_id: "BANK.ATM",       factor: 0,    source: "N/A", assumptions: ["현금인출"] },
  CARD_PURCHASE: { match: /.*/, category_id: "RETAIL.OTHER",   factor: 50,   source: "AVG", assumptions: [] },
  DELIVERY:      { match: /.*/, category_id: "FNB.DELIVERY",   factor: 120,  source: "AVG", assumptions: ["배달"], bonusMultiplier: 1.1 },
  TAXI:          { match: /.*/, category_id: "MOBILITY.TAXI",  factor: 220,  source: "AVG", assumptions: [] },
  AIRLINE:       { match: /.*/, category_id: "MOBILITY.AIR",   factor: 1500, source: "AVG", assumptions: ["항공권"] },
};

/* =========================
   Helpers
========================= */
function useNarrowFrame(threshold = 520) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      setIsNarrow(w < threshold);
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [threshold]);

  return [ref, isNarrow] as const;
}

function findRule(merchant_raw: string, txn_type: TxnType): MerchantRule {
  const exact = MERCHANT_RULES.find((r) => r.match.test(merchant_raw));
  return exact ?? TYPE_FALLBACK[txn_type];
}

function computeGco2e(txn: Transaction): EnrichedTransaction {
  const rule = findRule(txn.merchant_raw, txn.txn_type);
  const multiplier = rule.bonusMultiplier ?? 1.0;
  const gco2e = Math.round((txn.approved_krw / 1000) * rule.factor * multiplier);
  return { ...txn, category_id: rule.category_id, factor: rule.factor, source: rule.source, assumptions: rule.assumptions, gco2e };
}

function formatKRW(v: number) { return v.toLocaleString("ko-KR"); }
function formatTS(ts: string) {
  const d = new Date(ts);
  return d.toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function inRange(tsISO: string, start: Date, end: Date) {
  const t = new Date(tsISO).getTime();
  return t >= start.getTime() && t <= end.getTime();
}

function buildMonthlyReport(txns: Transaction[]) {
  const enriched: EnrichedTransaction[] = txns.map(computeGco2e);
  const total = enriched.reduce((s, t) => s + t.gco2e, 0);
  const byCat: Record<string, number> = {};
  enriched.forEach((t) => { byCat[t.category_id] = (byCat[t.category_id] ?? 0) + t.gco2e; });

  const topCats: TopCat[] = Object.entries(byCat)
    .map(([category_id, gco2e]) => ({ category_id, gco2e }))
    .sort((a, b) => b.gco2e - a.gco2e)
    .slice(0, 5);

  const esg = Math.max(0, 100 - Math.min(100, Math.round(total / 1000)));

  const suggestions: string[] = [];
  if (topCats.find((c) => c.category_id.includes("AIR"))) suggestions.push("다음 달 항공권 1회 ↓ → ~120kg 절감");
  if (topCats.find((c) => c.category_id.includes("DELIVERY"))) suggestions.push("배달 2회 → 포장/매장 전환 시 ~200g 절감");
  if (topCats.find((c) => c.category_id.includes("TAXI"))) suggestions.push("퇴근 택시 주 1회 대중교통 → ~200~400g 절감");

  const story = `이번 기간 배출량 ${(total/1000).toFixed(1)}kg. 주요 요인: ${topCats.slice(0,2).map(x=>x.category_id).join(", ")}`;

  return { total_gco2e: total, top_categories: topCats, enriched, esg, suggestions, story };
}

function buildTrend(enriched: EnrichedTransaction[]) {
  const byDay: Record<string, number> = {};
  for (const t of enriched) {
    const d = new Date(t.ts);
    const key = `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    byDay[key] = (byDay[key] ?? 0) + t.gco2e;
  }
  return Object.entries(byDay)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([d, g]) => ({ d, g }));
}

function tierOf(esg: number) {
  if (esg >= 90) return { name: "그린 플래티넘", color: "bg-emerald-600 text-white" };
  if (esg >= 80) return { name: "그린 골드",      color: "bg-amber-500 text-white" };
  if (esg >= 60) return { name: "그린 실버",     color: "bg-gray-300 text-gray-900" };
  return { name: "그린 기본", color: "bg-gray-100 text-gray-900" };
}

/* =========================
   Toast
========================= */
function Toast({ text, onClose }: { text: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 2500); return () => clearTimeout(t); }, [onClose]);
  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 40, opacity: 0 }}
      className="fixed bottom-6 right-6 z-50 rounded-xl border bg-white shadow-lg px-4 py-3 text-sm flex items-center gap-2"
    >
      <Bell className="w-4 h-4" /> {text}
    </motion.div>
  );
}

/* =========================
   UI (Header는 선택 사용)
========================= */
function Header({ total, esg, onExport }: { total: number; esg: number; onExport: () => void }) {
  const tier = tierOf(esg);
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <Leaf className="w-7 h-7" />
        <h1 className="text-2xl font-semibold">카본 리시트 · PoC</h1>
        <Badge variant="secondary" className="rounded-full">U123</Badge>
        <span className={`rounded-full px-2 py-0.5 text-xs ${tier.color}`}><Award className="w-3 h-3 inline mr-1" />{tier.name}</span>
      </div>
      <div className="flex items-center gap-3">
        <Badge className="rounded-full">ESG {esg}</Badge>
        <Button onClick={onExport} className="rounded-2xl">
          <Download className="w-4 h-4 mr-2" />
          PDF로 저장
        </Button>
      </div>
    </div>
  );
}

/* === 앱형 미니 스탯 (2타일: 총 배출량 / 월 목표) === */
function StatStrip({
  total, goal, rewards, prevTotal,
}: {
  total: number; goal: number; rewards: number; prevTotal: number;
}) {
  const delta = prevTotal === 0 ? 0 : Math.round(((total - prevTotal) / prevTotal) * 100);
  const up = delta > 0;
  const goalPct = goal > 0 ? Math.min(Math.round((total / goal) * 100), 100) : 0;

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="p-3">
        <div className="grid grid-cols-2 gap-3">
          {/* 좌: 총 배출량 */}
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
              <Leaf className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="min-w-0 leading-tight">
              <div className="text-[12px] text-muted-foreground whitespace-nowrap">총 배출량</div>
              <div className="flex items-baseline gap-1 whitespace-nowrap">
                <span className="text-[22px] font-semibold tabular-nums tracking-tight">
                  {total.toLocaleString()}
                </span>
                <span className="text-[11px] text-muted-foreground">gCO2e</span>
              </div>
              <span
                className={`mt-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] ${
                  up ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {up ? "▲" : "▼"} 전월 {Math.abs(delta)}%
              </span>
            </div>
          </div>

          {/* 우: 월 목표 */}
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-muted/70 flex items-center justify-center shrink-0">
              <Target className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="text-[12px] text-muted-foreground whitespace-nowrap">월 목표</div>
              <div className="flex items-baseline gap-1 whitespace-nowrap">
                <span className="text-[22px] font-semibold tabular-nums tracking-tight">
                  {goal.toLocaleString()}
                </span>
                <span className="text-[11px] text-muted-foreground">g</span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-1 whitespace-nowrap">
                리워드 {rewards}p
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${goalPct}%` }} />
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5 whitespace-nowrap">
                목표 대비 {goalPct}%
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* === 차트/표/가이드 === */
function TrendChart({ data }:{data:{d:string; g:number}[]}) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="p-4">
        <div className="text-sm opacity-70 mb-2">일별 배출량 추이</div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <XAxis dataKey="d" tickMargin={8} fontSize={12} />
              <YAxis fontSize={12} />
              <ReTooltip formatter={(v: unknown) => [`${v} g`, "배출량"]} labelFormatter={(l: unknown) => `날짜: ${l}`} />
              <Line type="monotone" dataKey="g" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

const PIE_COLORS = [
  "#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6",
  "#14b8a6", "#0ea5e9", "#84cc16", "#f97316", "#ec4899",
];

function CategoryPie({ top }: { top: TopCat[] }) {
  const LABELS: Record<string, string> = {};
  const data = (top ?? []).map((t) => ({ name: LABELS[t.category_id] ?? t.category_id, value: Number(t.gco2e ?? 0) }));
  const total = data.reduce((acc, d) => acc + d.value, 0);
  const pct = (v: number) => (total > 0 ? Math.round((v / total) * 100) : 0);

  return (
    <Card className="rounded-2xl shadow-sm">
      {/* 패딩 p-4로 살짝 늘려 여유 확보 */}
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="text-xs opacity-70">상위 카테고리</div>
          <div className="text-[11px] text-muted-foreground hidden sm:block">
            {total.toLocaleString()} gCO2e
          </div>
        </div>
        <div className="h-[200px] md:h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={56} outerRadius={92} strokeWidth={0}>
                {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {data.slice(0, 6).map((d, i) => (
            <span key={i} className="px-1.5 py-0.5 rounded-full text-[10px]" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length], color: "white" }}>
              {d.name} {pct(d.value)}%
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function Guides({ story, suggestions }: { story: string; suggestions: string[] }) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="p-4 space-y-3">
        <div className="text-sm opacity-70">요약</div>
        <div className="text-sm">{story}</div>
        <div className="text-sm opacity-70 mt-2">제안</div>
        <ul className="space-y-2">
          {suggestions.map((t, i) => (
            <li key={i} className="flex items-start gap-2">
              <ChevronRight className="w-4 h-4 mt-[2px]" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function TxnTable({ items, onSelect }: { items: Transaction[]; onSelect: (e: EnrichedTransaction) => void }) {
  return (
    <Card className="rounded-2xl shadow-sm h-full">
      <CardContent className="p-4 h-full flex flex-col">
        <div className="overflow-auto rounded-xl border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3">시간</th>
                <th className="text-left p-3">가맹점</th>
                <th className="text-left p-3">유형</th>
                <th className="text-right p-3">금액(원)</th>
                <th className="text-right p-3">gCO2e</th>
              </tr>
            </thead>
            <tbody>
              {items.map((t) => {
                const e = computeGco2e(t);
                return (
                  <tr key={t.txn_id} className="hover:bg-muted/40 cursor-pointer" onClick={() => onSelect(e)}>
                    <td className="p-3">{formatTS(t.ts)}</td>
                    <td className="p-3">{t.merchant_raw}</td>
                    <td className="p-3"><Badge variant="outline">{t.txn_type}</Badge></td>
                    <td className="p-3 text-right">{formatKRW(t.approved_krw)}</td>
                    <td className="p-3 text-right font-medium">{e.gco2e.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function ReceiptPanel({ selected, onClose }: { selected: EnrichedTransaction; onClose: () => void }) {
  if (!selected) return null;
  return (
    <motion.div initial={{ x: 400, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 400, opacity: 0 }}
      className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white border-l shadow-xl z-40">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Leaf className="w-5 h-5" />
          <div className="font-semibold">탄소 영수증</div>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full" onClick={onClose}><X className="w-5 h-5" /></Button>
      </div>
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Card className="rounded-xl"><CardContent className="p-3">
            <div className="text-xs opacity-60">가맹점</div>
            <div className="font-medium">{selected.merchant_raw}</div>
            <div className="text-xs opacity-50">{formatTS(selected.ts)}</div>
          </CardContent></Card>
          <Card className="rounded-xl"><CardContent className="p-3">
            <div className="text-xs opacity-60">유형</div>
            <div className="font-medium">{selected.txn_type}</div>
          </CardContent></Card>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Card className="rounded-xl"><CardContent className="p-3">
            <div className="text-xs opacity-60">금액</div>
            <div className="text-xl font-bold">{formatKRW(selected.approved_krw)} 원</div>
          </CardContent></Card>
          <Card className="rounded-xl"><CardContent className="p-3">
            <div className="text-xs opacity-60">배출량</div>
            <div className="text-xl font-bold">{selected.gco2e.toLocaleString()} gCO2e</div>
          </CardContent></Card>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Card className="rounded-xl"><CardContent className="p-3">
            <div className="text-xs opacity-60">카테고리</div>
            <div className="font-medium">{selected.category_id}</div>
          </CardContent></Card>
          <Card className="rounded-xl"><CardContent className="p-3">
            <div className="text-xs opacity-60">적용계수</div>
            <div className="font-medium">{selected.factor} g/1,000원</div>
          </CardContent></Card>
        </div>
        <div className="space-y-2">
          <div className="text-sm opacity-70">가정/보정</div>
          <div className="flex gap-2 flex-wrap">
            {selected.assumptions.length ? selected.assumptions.map((a, i) => (
              <Badge key={i} variant="outline" className="rounded-full">{a}</Badge>
            )) : <span className="text-sm opacity-60">해당 없음</span>}
          </div>
        </div>
        <div className="text-xs opacity-60">출처: {selected.source}</div>
      </div>
    </motion.div>
  );
}

/* =========================
   Txn Simulator
========================= */
function TxnSimulator({ onCreate }: { onCreate: (t: Transaction) => void }) {
  const [merchant, setMerchant] = useState("STARBUCKS SEOUL");
  const [amount, setAmount] = useState<number>(5800);
  const [type, setType] = useState<TxnType>("CARD_PURCHASE");

  const presets: Record<string, { m: string; a: number; t: TxnType }> = {
    coffee:   { m: "STARBUCKS SEOUL", a: 5800,  t: "CARD_PURCHASE" },
    taxi:     { m: "KAKAO TAXI",      a: 12000, t: "TAXI" },
    delivery: { m: "BAEMIN DELIVERY", a: 18000, t: "DELIVERY" },
    airline:  { m: "KE AIR TICKET",   a: 650000,t: "AIRLINE" },
    bill:     { m: "ELECT BILL",      a: 52000, t: "BILL" },
  };

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Plus className="w-4 h-4" />
          <div className="font-medium">거래 시뮬레이터 (수집·정제)</div>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {Object.keys(presets).map((k) => (
            <Button key={k} size="sm" onClick={() => { setMerchant(presets[k].m); setAmount(presets[k].a); setType(presets[k].t); }}>
              {k}
            </Button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Input value={merchant} onChange={(e)=>setMerchant(e.target.value)} placeholder="가맹점" />
          <Input value={amount} onChange={(e)=>setAmount(Number(e.target.value||0))} placeholder="금액(원)" />
          <Input value={type} onChange={(e)=>setType(e.target.value as TxnType)} placeholder="유형(TAXI/AIRLINE/...)" />
        </div>
        <div className="mt-3">
          <Button onClick={()=>{
            const t: Transaction = {
              user_id: "U123",
              txn_id: "SIM-" + Date.now(),
              approved_krw: amount,
              merchant_raw: merchant,
              ts: new Date().toISOString(),
              channel: "CARD",
              txn_type: type,
            };
            onCreate(t);
          }}>거래 추가</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// 지난달 절감량(g) 추론(옵션)
function inferPrevMonthSavingG(report: any, prevTotal?: number, totalNow?: number) {
  const prev = Number(report?.prev_month_gco2e ?? prevTotal ?? 0);
  const curr = Number(report?.current_month_gco2e ?? report?.total_gco2e ?? totalNow ?? 0);
  return Math.max(prev - curr, 0);
}

function CoinWallet({ prevMonthSavingG }: { prevMonthSavingG: number }) {
  const router = useRouter();
  const [balance, setBalance] = useState<number>(0);
  const [awarded, setAwarded] = useState<number>(0);

  useEffect(() => {
    const st = loadCoinState(100);
    setBalance(st.balance || 0);

    const gained = maybeAutoAward(prevMonthSavingG);
    if (gained > 0) {
      const ns = loadCoinState();
      setBalance(ns.balance);
      setAwarded(gained);
    }
  }, [prevMonthSavingG]);

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-emerald-600" />
          <div className="text-sm font-medium">친환경 코인 지갑</div>
        </div>

        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold">{balance.toLocaleString()} C</div>
          <div className="text-xs text-muted-foreground">1kg CO₂ 절감 = 1C</div>
        </div>

        {awarded > 0 && (
          <div className="text-xs rounded-xl px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 inline-block">
            이번 달 1주차 자동지급: +{awarded}C
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 pt-1">
          <Button className="h-9 rounded-xl" onClick={() => (window.location.href = "/rewards")}>
            교환/구매
          </Button>
          <Button variant="ghost" className="h-9 rounded-xl border" onClick={() => (window.location.href = "/invest")}>
            투자하기
          </Button>
          <Button variant="ghost" className="h-9 rounded-xl border" onClick={() => (window.location.href = "/wallet")}>
            내역 보기
          </Button>
        </div>

        <div className="text-[11px] text-muted-foreground">
          전기차 충전권·친환경 가전/패션·재생에너지 상품 교환, ESG 펀드/탄소절감채권 투자에 사용 가능
        </div>
      </CardContent>
    </Card>
  );
}

/* === 빠른 기간 칩 === */
const QuickRangeChip = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="h-7 px-2 rounded-full border text-[12px] text-foreground/80 hover:bg-muted whitespace-nowrap"
  >
    {label}
  </button>
);

/* =========================
   Page
========================= */
export default function Page() {
  const router = useRouter();

  const [txns, setTxns] = useState<Transaction[]>(MOCK_TXNS);
  const [filter, setFilter] = useState<string>("");
  const [selected, setSelected] = useState<EnrichedTransaction | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [frameRef, isPhone] = useNarrowFrame();

  // 기간 필터: 기본 = 이번 달 1일 ~ 오늘
  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [startDate, setStartDate] = useState<string>(defaultStart.toISOString().slice(0,10));
  const [endDate, setEndDate] = useState<string>(now.toISOString().slice(0,10));

  // 목표 & 리워드(간이)
  const [goal] = useState<number>(20000); // gCO2e
  const [rewards, setRewards] = useState<number>(0);

  // 현재 선택 기간 + 텍스트 필터
  const start = new Date(startDate + "T00:00:00");
  const end   = new Date(endDate + "T23:59:59");
  const filtered = useMemo(
    () => txns.filter((t) =>
      t.merchant_raw.toLowerCase().includes(filter.toLowerCase()) && inRange(t.ts, start, end)
    ),
    [txns, filter, startDate, endDate]
  );

  const report = useMemo(() => buildMonthlyReport(filtered), [filtered]);
  const trend = useMemo(() => buildTrend(report.enriched), [report.enriched]);

  // 전월 대비(선택 기간의 "이전 달 같은 날짜 범위")
  const prevStart = new Date(start); prevStart.setMonth(prevStart.getMonth() - 1);
  const prevEnd   = new Date(end);   prevEnd.setMonth(prevEnd.getMonth() - 1);
  const prevRangeTxns = useMemo(
    () => txns.filter((t) => inRange(t.ts, prevStart, prevEnd)),
    [txns, startDate, endDate]
  );
  const prevTotal = useMemo(
    () => buildMonthlyReport(prevRangeTxns).total_gco2e,
    [prevRangeTxns]
  );

  const prevMonthSavingG = useMemo(
    () => Math.max(prevTotal - report.total_gco2e, 0),
    [prevTotal, report.total_gco2e]
  );

  useEffect(() => {
    if (report.total_gco2e <= goal && rewards === 0) {
      setRewards(500);
      setToast("🎉 월 목표 달성! 리워드 500p 지급");
    }
  }, [report.total_gco2e, goal, rewards]);

  const onExport = () => window.print();

  const createTxn = (t: Transaction) => {
    setTxns((prev) => [t, ...prev]);
    const e = computeGco2e(t);
    const totalAfter = buildMonthlyReport([t, ...filtered]).total_gco2e;
    setToast(`이번 거래로 ${(e.gco2e/1000).toFixed(2)}kg CO₂ 배출 (기간 ${(totalAfter/1000).toFixed(1)}kg)`);
  };

  /* 빠른 기간 설정 */
  const setQuickRange = (key: "thisMonth" | "prevMonth" | "7d" | "30d") => {
    const now = new Date();
    const d2 = new Date(now);
    const d1 = new Date(now);
    if (key === "thisMonth") {
      d1.setDate(1);
    } else if (key === "prevMonth") {
      d1.setMonth(d1.getMonth() - 1);
      d1.setDate(1);
      d2.setMonth(d2.getMonth() - 1);
      d2.setDate(new Date(d2.getFullYear(), d2.getMonth() + 1, 0).getDate());
    } else if (key === "7d") {
      d1.setDate(d1.getDate() - 6);
    } else if (key === "30d") {
      d1.setDate(d1.getDate() - 29);
    }
    setStartDate(d1.toISOString().slice(0,10));
    setEndDate(d2.toISOString().slice(0,10));
  };

  return (
    <TooltipProvider>
      <div ref={frameRef} className="mx-auto max-w-none p-4 pt-2 pb-24 space-y-4">
        {/* 앱 상단바 */}
        <AppTopBar title="카본 리시트" />

        {/* 작은 정보 칩 */}
        <div className="px-1 pt-2 flex flex-wrap gap-1 text-[11px]">
          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            ESG {report.esg}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-muted">U123</span>
        </div>

        {/* 기간 필터 (앱 스타일) */}
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <div className="font-medium text-[14px]">기간 필터</div>
              </div>
              <div className="flex items-center gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <QuickRangeChip label="이번 달" onClick={() => setQuickRange("thisMonth")} />
                <QuickRangeChip label="지난 달" onClick={() => setQuickRange("prevMonth")} />
                <QuickRangeChip label="7일" onClick={() => setQuickRange("7d")} />
                <QuickRangeChip label="30일" onClick={() => setQuickRange("30d")} />
              </div>
            </div>

            <div className="rounded-xl border px-2 py-1.5 flex items-center gap-2">
              <Input type="date" value={startDate} onChange={(e)=>setStartDate(e.target.value)} className="h-8 border-0 focus-visible:ring-0 max-w-[160px] px-2" />
              <span className="text-muted-foreground">~</span>
              <Input type="date" value={endDate} onChange={(e)=>setEndDate(e.target.value)} className="h-8 border-0 focus-visible:ring-0 max-w-[160px] px-2" />
            </div>

            <div className="rounded-xl border px-2 py-1.5 flex items-center gap-2">
              <Filter className="w-4 h-4 opacity-60" />
              <Input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="가맹점 필터 (예: coffee, taxi)"
                className="h-8 border-0 focus-visible:ring-0"
              />
            </div>
          </CardContent>
        </Card>

        {/* 앱형 미니 스탯 */}
        <StatStrip
          total={report.total_gco2e}
          goal={goal}
          rewards={rewards}
          prevTotal={prevTotal}
        />

        {/* 거래 시뮬레이터 */}
        <TxnSimulator onCreate={createTxn} />

        {isPhone ? (
          /* 📱 앱: 1열 (고정높이 래퍼 제거) */
          <div className="space-y-4">
            <CoinWallet prevMonthSavingG={prevMonthSavingG} />

            {/* 🔗 추천 페이지 링크 버튼 (홈은 짧게 유지) */}
            <Button
              variant="ghost"
              className="w-full h-9 rounded-xl border"
              onClick={() => router.push(`/recommend?esg=${report.esg}`)}
            >
              금융상품 추천 보기
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>

            <TxnTable items={filtered} onSelect={(e) => setSelected(e)} />
            <div className="space-y-4">
              <TrendChart data={trend} />
              <CategoryPie top={report.top_categories} />
            </div>
            <Guides story={report.story} suggestions={report.suggestions} />
          </div>
        ) : (
          /* 🖥️ 데스크톱: 8/4 (고정높이 래퍼 제거) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-8 space-y-4">
              <TxnTable items={filtered} onSelect={(e) => setSelected(e)} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TrendChart data={trend} />
                <CategoryPie top={report.top_categories} />
              </div>
            </div>
            <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-4">
              <CoinWallet prevMonthSavingG={prevMonthSavingG} />

              {/* 🔗 추천 페이지 링크 버튼 (섹션 대신) */}
              <Button
                variant="ghost"
                className="w-full h-9 rounded-xl border"
                onClick={() => router.push(`/recommend?esg=${report.esg}`)}
              >
                금융상품 추천 보기
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>

              <Guides story={report.story} suggestions={report.suggestions} />
            </div>
          </div>
        )}

        {selected && <ReceiptPanel selected={selected} onClose={() => setSelected(null)} />}
        <AnimatePresence>{toast && <Toast text={toast} onClose={() => setToast(null)} />}</AnimatePresence>
      </div>
    </TooltipProvider>
  );
}
