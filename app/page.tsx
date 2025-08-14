"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Download, Leaf, Search, Filter, ChevronRight, X } from "lucide-react";
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

/** Carbon Receipt PoC – Demo UI (single-file)
 * Tech: Tailwind + shadcn/ui + Recharts + Framer Motion
 * Note: Mock data → 나중에 실제 API 연동만 바꾸면 됨.
 */

// --------------------------- Mock Data & Helpers ---------------------------
const MOCK_TXNS = [
  { user_id: "U123", txn_id: "T1", approved_krw: 5800, merchant_raw: "STARBUCKS SEOUL", ts: "2025-08-13T09:45:00", channel: "CARD" },
  { user_id: "U123", txn_id: "T2", approved_krw: 4300, merchant_raw: "GS25 HONGDAE", ts: "2025-08-13T20:10:00", channel: "CARD" },
  { user_id: "U123", txn_id: "T3", approved_krw: 15500, merchant_raw: "BAEMIN DELIVERY", ts: "2025-08-12T19:05:00", channel: "CARD" },
  { user_id: "U123", txn_id: "T4", approved_krw: 12000, merchant_raw: "KAKAO TAXI", ts: "2025-08-11T22:10:00", channel: "CARD" },
  { user_id: "U123", txn_id: "T5", approved_krw: 8900, merchant_raw: "EDIYA COFFEE", ts: "2025-08-09T10:05:00", channel: "CARD" },
  { user_id: "U123", txn_id: "T6", approved_krw: 24000, merchant_raw: "LOTTE MART", ts: "2025-08-08T18:35:00", channel: "CARD" },
];

const MERCHANT_RULES = [
  { match: /STARBUCKS|EDIYA|COFFEE/i, category_id: "FNB.COFFEE", factor: 120, source: "SAMPLE_DEFRA", assumptions: ["매장이용"] },
  { match: /GS25|CU|SEVENELEVEN|CONVENIENCE/i, category_id: "RETAIL.CONVENIENCE", factor: 60, source: "SAMPLE_DEFRA", assumptions: [] },
  { match: /BAEMIN|DELIVERY|YOGIYO/i, category_id: "FNB.DELIVERY", factor: 120, source: "SAMPLE_DEFRA", assumptions: ["배달"] },
  { match: /KAKAO TAXI|TAXI|UBER/i, category_id: "MOBILITY.TAXI", factor: 220, source: "SAMPLE_DEFRA", assumptions: [] },
  { match: /MART|EMART|HOMEPLUS/i, category_id: "RETAIL.GROCERY", factor: 55, source: "SAMPLE_DEFRA", assumptions: [] },
];

function mapMerchantToCategory(merchantRaw: string) {
  for (const r of MERCHANT_RULES) {
    if (r.match.test(merchantRaw)) return r;
  }
  return { category_id: "OTHER", factor: 50, source: "SAMPLE_DEFRA", assumptions: [] as string[] };
}

function computeGco2e(txn: any) {
  const rule = mapMerchantToCategory(txn.merchant_raw);
  let multiplier = 1.0;
  if (rule.assumptions.includes("배달")) multiplier *= 1.1; // 예시: 배달 가중치
  const gco2e = Math.round((txn.approved_krw / 1000) * rule.factor * multiplier);
  return { ...txn, category_id: rule.category_id, factor: rule.factor, source: rule.source, assumptions: rule.assumptions, gco2e };
}

function formatKRW(v: number) {
  return v.toLocaleString("ko-KR");
}
function formatTS(ts: string) {
  const d = new Date(ts);
  return d.toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function buildMonthlyReport(txns: any[]) {
  const enriched = txns.map(computeGco2e);
  const total = enriched.reduce((s, t) => s + t.gco2e, 0);
  const byCat: Record<string, number> = {};
  enriched.forEach((t) => (byCat[t.category_id] = (byCat[t.category_id] || 0) + t.gco2e));
  const topCats = Object.entries(byCat)
    .map(([category_id, gco2e]) => ({ category_id, gco2e }))
    .sort((a, b) => b.gco2e - a.gco2e)
    .slice(0, 3);

  const guides = makeGuides(topCats);

  return { total_gco2e: total, top_categories: topCats, guides, enriched };
}

function makeGuides(topCats: { category_id: string; gco2e: number }[]) {
  const g: { text: string }[] = [];
  const coffee = topCats.find((c) => c.category_id === "FNB.COFFEE");
  if (coffee) g.push({ text: "주 2회 텀블러 사용 시 월 150~300 gCO2e 절감 가능" });
  const taxi = topCats.find((c) => c.category_id === "MOBILITY.TAXI");
  if (taxi) g.push({ text: "퇴근 택시를 대중교통 1회로 대체 시 월 200~400 g 절감" });
  if (g.length === 0) g.push({ text: "저탄소 카테고리 비중이 높아요. 현재 패턴을 유지해보세요." });
  return g;
}

// Dummy trend data
const TREND = [
  { d: "08-07", g: 420 },
  { d: "08-08", g: 830 },
  { d: "08-09", g: 610 },
  { d: "08-10", g: 300 },
  { d: "08-11", g: 980 },
  { d: "08-12", g: 1450 },
  { d: "08-13", g: 954 },
];

// --------------------------- UI Components ---------------------------
function Header({ total, onExport }: { total: number; onExport: () => void }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <Leaf className="w-7 h-7" />
        <h1 className="text-2xl font-semibold">카본 리시트 · PoC 데모</h1>
        <Badge variant="secondary" className="rounded-full">U123</Badge>
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={onExport} className="rounded-2xl"><Download className="w-4 h-4 mr-2" />PDF로 저장</Button>
      </div>
    </div>
  );
}

function StatCards({ total, enriched }: { total: number; enriched: any[] }) {
  const coffee = enriched.filter((t) => t.category_id === "FNB.COFFEE").reduce((s, t) => s + t.gco2e, 0);
  const delivery = enriched.filter((t) => t.assumptions?.includes("배달")).reduce((s, t) => s + t.gco2e, 0);
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-5">
          <div className="text-sm opacity-70">이번 달 총 배출량</div>
          <div className="text-3xl font-bold mt-1">{total.toLocaleString()} gCO2e</div>
          <div className="text-xs opacity-50 mt-1">샘플 데이터 기준</div>
        </CardContent>
      </Card>
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-5">
          <div className="text-sm opacity-70">커피 관련</div>
          <div className="text-3xl font-bold mt-1">{coffee.toLocaleString()} g</div>
          <div className="text-xs opacity-50 mt-1">텀블러 사용 가이드 제공</div>
        </CardContent>
      </Card>
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-5">
          <div className="text-sm opacity-70">배달로 추정</div>
          <div className="text-3xl font-bold mt-1">{delivery.toLocaleString()} g</div>
          <div className="text-xs opacity-50 mt-1">배달 가중치 1.1 적용</div>
        </CardContent>
      </Card>
    </div>
  );
}

function TrendChart() {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="p-4">
        <div className="text-sm opacity-70 mb-2">일별 배출량 추이</div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={TREND} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <XAxis dataKey="d" tickMargin={8} fontSize={12} />
              <YAxis fontSize={12} />
              <ReTooltip formatter={(v: any) => [`${v} g`, "배출량"]} labelFormatter={(l: any) => `날짜: ${l}`} />
              <Line type="monotone" dataKey="g" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function CategoryPie({ top }: { top: { category_id: string; gco2e: number }[] }) {
  const data = top.map((t) => ({ name: t.category_id, value: t.gco2e }));
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="p-4">
        <div className="text-sm opacity-70 mb-2">상위 카테고리</div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie dataKey="value" data={data} outerRadius={84}>
                {data.map((_, i) => (<Cell key={i} />))}
              </Pie>
              <ReTooltip formatter={(v: any, n: any) => [`${v} g`, n]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-2 mt-2 flex-wrap">
          {data.map((d, i) => (<Badge key={i} variant="outline" className="rounded-full">{d.name}</Badge>))}
        </div>
      </CardContent>
    </Card>
  );
}

function Guides({ guides }: { guides: { text: string }[] }) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="p-4">
        <div className="text-sm opacity-70 mb-2">개인화 가이드</div>
        <ul className="space-y-2">
          {guides.map((g, i) => (
            <li key={i} className="flex items-start gap-2">
              <ChevronRight className="w-4 h-4 mt-[2px]" />
              <span>{g.text}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function TxnTable({ items, onSelect }: { items: any[]; onSelect: (e: any) => void }) {
  return (
    <Card className="rounded-2xl shadow-sm h-full">
      <CardContent className="p-4 h-full flex flex-col">
        <div className="overflow-auto rounded-xl border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3">시간</th>
                <th className="text-left p-3">가맹점</th>
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

function ReceiptPanel({ selected, onClose }: { selected: any; onClose: () => void }) {
  if (!selected) return null;
  return (
    <motion.div initial={{ x: 400, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 400, opacity: 0 }}
      className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-background border-l shadow-xl z-40">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Leaf className="w-5 h-5" />
          <div className="font-semibold">탄소 영수증</div>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full" onClick={onClose}><X className="w-5 h-5" /></Button>
      </div>
      <div className="p-4 space-y-4">
        <div>
          <div className="text-sm opacity-70">가맹점</div>
          <div className="text-lg font-semibold">{selected.merchant_raw}</div>
          <div className="text-xs opacity-50">{formatTS(selected.ts)}</div>
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
            {selected.assumptions.length ? selected.assumptions.map((a: string, i: number) => (
              <Badge key={i} variant="outline" className="rounded-full">{a}</Badge>
            )) : <span className="text-sm opacity-60">해당 없음</span>}
          </div>
        </div>
        <div className="text-xs opacity-60">출처: {selected.source}</div>
      </div>
    </motion.div>
  );
}

export default function Page() {
  const [txns] = useState(MOCK_TXNS);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const report = useMemo(() => buildMonthlyReport(txns), [txns]);
  const onExport = () => window.print();

  return (
    <TooltipProvider>
      <div className="mx-auto max-w-7xl p-4 md:p-6 space-y-4">
        <Header total={report.total_gco2e} onExport={onExport} />
        <StatCards total={report.total_gco2e} enriched={report.enriched} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2 mb-[-6px]">
              <Filter className="w-4 h-4 opacity-60" />
              <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="가맹점 필터 (예: coffee, taxi)" className="rounded-xl max-w-sm" />
            </div>
            <TxnTable items={txns.filter((t) => t.merchant_raw.toLowerCase().includes(filter.toLowerCase()))} onSelect={setSelected} />
          </div>
          <div className="space-y-4">
            <TrendChart />
            <CategoryPie top={report.top_categories} />
            <Guides guides={report.guides} />
          </div>
        </div>

        {selected && <ReceiptPanel selected={selected} onClose={() => setSelected(null)} />}
      </div>
    </TooltipProvider>
  );
}
