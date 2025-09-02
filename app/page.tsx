"use client";

import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Coins, Plug, ShoppingBag, LineChart as ChartIcon } from "lucide-react";
import { loadCoinState, saveCoinState, maybeAutoAward } from "@/lib/coin";
import { useRouter } from "next/navigation"; 
import { Download, Leaf, Filter, ChevronRight, X, Bell, Gift, Plus, Calendar, TrendingUp, TrendingDown, Award } from "lucide-react";
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
  { user_id: "U123", txn_id: "T1", approved_krw: 5800,  merchant_raw: "STARBUCKS SEOUL", ts: "2025-08-13T09:45:00", channel: "CARD",    txn_type: "CARD_PURCHASE" },
  { user_id: "U123", txn_id: "T2", approved_krw: 4300,  merchant_raw: "GS25 HONGDAE",    ts: "2025-08-13T20:10:00", channel: "CARD",    txn_type: "CARD_PURCHASE" },
  { user_id: "U123", txn_id: "T3", approved_krw: 15500, merchant_raw: "BAEMIN DELIVERY", ts: "2025-08-12T19:05:00", channel: "CARD",    txn_type: "DELIVERY" },
  { user_id: "U123", txn_id: "T4", approved_krw: 12000, merchant_raw: "KAKAO TAXI",      ts: "2025-08-11T22:10:00", channel: "CARD",    txn_type: "TAXI" },
  { user_id: "U123", txn_id: "T5", approved_krw: 8900,  merchant_raw: "EDIYA COFFEE",    ts: "2025-08-09T10:05:00", channel: "CARD",    txn_type: "CARD_PURCHASE" },
  { user_id: "U123", txn_id: "T6", approved_krw: 24000, merchant_raw: "LOTTE MART",      ts: "2025-08-08T18:35:00", channel: "CARD",    txn_type: "CARD_PURCHASE" },
  { user_id: "U123", txn_id: "T7", approved_krw: 800000, merchant_raw: "KE AIR TICKET",  ts: "2025-07-10T08:10:00", channel: "CARD",    txn_type: "AIRLINE" },
  { user_id: "U123", txn_id: "T8", approved_krw: 54000,  merchant_raw: "ELECT BILL",     ts: "2025-07-03T10:05:00", channel: "ACCOUNT", txn_type: "BILL" },
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

  // ESG 점수(간이)
  const esg = Math.max(0, 100 - Math.min(100, Math.round(total / 1000)));

  // 제안
  const suggestions: string[] = [];
  if (topCats.find((c) => c.category_id.includes("AIR"))) suggestions.push("다음 달 항공권 1회 ↓ → ~120kg 절감");
  if (topCats.find((c) => c.category_id.includes("DELIVERY"))) suggestions.push("배달 2회 → 포장/매장 전환 시 ~200g 절감");
  if (topCats.find((c) => c.category_id.includes("TAXI"))) suggestions.push("퇴근 택시 주 1회 대중교통 → ~200~400g 절감");

  const story = `이번 기간 배출량 ${(total/1000).toFixed(1)}kg. 주요 요인: ${topCats.slice(0,2).map(x=>x.category_id).join(", ")}`;

  return { total_gco2e: total, top_categories: topCats, enriched, esg, suggestions, story };
}

// 일별 추이(선택 기간 내)
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

// 등급 매핑
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
   UI
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

function StatCards({
  total, enriched, goal, rewards, prevTotal,
}: {
  total: number; enriched: EnrichedTransaction[]; goal: number; rewards: number; prevTotal: number;
}) {
  const coffee = enriched.filter((t) => t.category_id === "FNB.COFFEE").reduce((s, t) => s + t.gco2e, 0);
  const delivery = enriched.filter((t) => t.category_id.includes("DELIVERY")).reduce((s, t) => s + t.gco2e, 0);
  const delta = prevTotal === 0 ? 0 : Math.round(((total - prevTotal) / prevTotal) * 100);
  const up = delta > 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
      <Card className="rounded-2xl shadow-sm"><CardContent className="p-5">
        <div className="text-sm opacity-70">선택 기간 배출량</div>
        <div className="text-3xl font-bold mt-1">{total.toLocaleString()} gCO2e</div>
        <div className={`mt-1 text-xs inline-flex items-center gap-1 ${up ? "text-red-600" : "text-emerald-600"}`}>
          {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          전월 대비 {delta}%
        </div>
      </CardContent></Card>
      <Card className="rounded-2xl shadow-sm"><CardContent className="p-5">
        <div className="text-sm opacity-70">커피 관련</div>
        <div className="text-3xl font-bold mt-1">{coffee.toLocaleString()} g</div>
      </CardContent></Card>
      <Card className="rounded-2xl shadow-sm"><CardContent className="p-5">
        <div className="text-sm opacity-70">배달로 추정</div>
        <div className="text-3xl font-bold mt-1">{delivery.toLocaleString()} g</div>
      </CardContent></Card>
      <Card className="rounded-2xl shadow-sm"><CardContent className="p-5">
        <div className="text-sm opacity-70">월 목표</div>
        <div className="text-xl font-bold mt-1">{goal.toLocaleString()} g</div>
        <div className="text-xs opacity-60 mt-1 flex items-center gap-1"><Gift className="w-3 h-3" /> 리워드: {rewards}p</div>
      </CardContent></Card>
    </div>
  );
}

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

// 색상 팔레트 (그대로 사용)
const PIE_COLORS = [
  "#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6",
  "#14b8a6", "#0ea5e9", "#84cc16", "#f97316", "#ec4899",
];

function CategoryPie({ top }: { top: TopCat[] }) {
  const LABELS: Record<string, string> = {}; // 필요시 id→라벨 매핑

  const data = (top ?? []).map((t) => ({
    name: LABELS[t.category_id] ?? t.category_id,
    value: Number(t.gco2e ?? 0),
  }));

  const total = data.reduce((acc, d) => acc + d.value, 0);
  const pct = (v: number) => (total > 0 ? Math.round((v / total) * 100) : 0);

  return (
    <Card className="rounded-2xl shadow-sm">
      {/* ⬇️ 패딩을 p-3로 줄여서 카드 높이 축소 */}
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          {/* ⬇️ 타이틀 폰트도 살짝 줄임 */}
          <div className="text-xs opacity-70">상위 카테고리</div>
          {/* ⬇️ 총합은 작은 화면에서 숨김 */}
          <div className="text-[11px] text-muted-foreground hidden sm:block">
            {total.toLocaleString()} gCO2e
          </div>
        </div>

        {/* ⬇️ 차트 영역 자체 높이를 축소 (이전 280/320 → 200/220) */}
        <div className="h-[200px] md:h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            {/* ⬇️ 여백도 작게 */}
            <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
              {/* ⬇️ 반지름 축소: inner 56 / outer 92 */}
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={56}
                outerRadius={92}
                strokeWidth={0}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* ⬇️ 배지도 더 콤팩트 (간격·폰트·패딩 축소), 너무 많으면 6개까지만 표시 */}
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {data.slice(0, 6).map((d, i) => (
            <span
              key={i}
              className="px-1.5 py-0.5 rounded-full text-[10px]"
              style={{
                backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                color: "white",
              }}
            >
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

type SimpleProduct = {
  id: string;
  name: string;
  key1: string;         // 핵심 수치 (예: "연 3.1%", "수수료 0.001%", "월 최대 20,000P")
  key2?: string;        // 보조 문구 (예: "우대금리 최대 +0.3%p")
  subtitle?: string;    // 추가 설명
  badge?: string;       // "추천" / "NEW" / "혜택 UP" 등
};

function ProductRail({
  title,
  items,
  onMore,
}: {
  title: string;
  items: SimpleProduct[];
  onMore?: () => void;
}) {
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium [word-break:keep-all]">{title}</div>
        {onMore && (
          <Button variant="ghost" className="h-8 px-3 border rounded-xl" onClick={onMore}>
            모두 보기
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>

      {/* 모바일: 가로 스크롤 / 데스크탑: 자동 맞춤 그리드 */}
      <div className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="
          grid gap-3
          sm:[grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]
          grid-flow-col auto-cols-[minmax(220px,1fr)] sm:grid-flow-row
          min-w-max sm:min-w-0
        ">
          {items.map((p) => (
            <div key={p.id} className="rounded-2xl border bg-white shadow-sm p-4 min-w-[220px]">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium [word-break:keep-all] [text-wrap:balance]">
                  {p.name}
                </span>
                {p.badge && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted">
                    {p.badge}
                  </span>
                )}
              </div>
              <div className="mt-2">
                <div className="text-xl md:text-2xl font-bold leading-tight">{p.key1}</div>
                {p.key2 && (
                  <div className="text-xs text-muted-foreground [word-break:keep-all]">
                    {p.key2}
                  </div>
                )}
              </div>
              {p.subtitle && (
                <div className="text-[11px] text-muted-foreground mt-1 [word-break:keep-all]">
                  {p.subtitle}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Recommendation({ esg }: { esg: number }) {
  const router = useRouter(); // 상단 import 필요: import { useRouter } from "next/navigation";
  const [showMore, setShowMore] = useState(false);

  if (esg < 80) return null; // 항상 보이게 하려면 제거

  // 여러 상품 목록 (데모 데이터)
  const depositItems: SimpleProduct[] = [
    { id: "dep1", name: "그린 세이브 예금", key1: "연 3.1%", key2: "우대금리 최대 +0.3%p", subtitle: "자동이체/미션 달성 시" , badge: "추천" },
    { id: "dep2", name: "에코 플러스 적금", key1: "연 3.3%", key2: "ESG 미션 연계", subtitle: "월 적립식" },
    { id: "dep3", name: "탄소중립 정기예금", key1: "연 3.0%", key2: "기부 연계", subtitle: "기부금 세액공제" },
    { id: "dep4", name: "리사이클 행복예금", key1: "연 3.05%", key2: "친환경 제휴 우대", subtitle: "ATM 수수료 면제" },
  ];

  const fundItems: SimpleProduct[] = [
    { id: "fund1", name: "ESG 인덱스 1호", key1: "수수료 0.001%", key2: "지속가능 성장", subtitle: "탄소감축 기업 중심", badge: "NEW" },
    { id: "fund2", name: "저탄소 글로벌 펀드", key1: "수수료 0.002%", key2: "RE100 비중↑", subtitle: "해외 분산 투자" },
    { id: "fund3", name: "그린에너지 테마", key1: "수수료 0.003%", key2: "변동성 유의", subtitle: "장기/적립 추천" },
  ];

  const cardItems: SimpleProduct[] = [
    { id: "card1", name: "그린 체크카드", key1: "월 최대 20,000P", key2: "대중교통 5%", subtitle: "제로웨이스트 5%" , badge: "혜택 UP" },
    { id: "card2", name: "에코 라이프 카드", key1: "월 최대 20,000P", key2: "친환경 매장 5%", subtitle: "온라인 3%" },
    { id: "card3", name: "모빌리티 카드", key1: "월 최대 15,000P", key2: "전기차 충전 7%", subtitle: "공공자전거 5%" },
  ];

  return (
    <Card className="rounded-2xl shadow-sm overflow-hidden border-emerald-500/40">
      <CardContent className="p-0">
        {/* 헤더 배너 */}
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 text-white p-5 md:p-6">
          <div className="flex items-center gap-2 text-sm opacity-90">
            <Award className="w-4 h-4" />
            <span>금융상품 추천</span>
          </div>

          <div className="mt-1 md:mt-2">
            <h3 className="text-lg md:text-xl font-semibold leading-tight [text-wrap:balance]">
              ESG {esg}점 고객님께 드리는{" "}
              <span className="underline decoration-white/60 underline-offset-4">
                친환경 금융 혜택
              </span>
            </h3>
            <p className="text-xs md:text-sm mt-1 opacity-90">
              우대금리·캐시백·수수료 면제까지 한 번에 확인하세요.
            </p>
          </div>

          {/* 혜택 칩 */}
          <div className="mt-3 flex flex-wrap gap-2">
            <div className="px-2 py-1 rounded-full bg-white/15 backdrop-blur text-[11px] md:text-xs flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              우대금리 최대 +0.3%p
            </div>
            <div className="px-2 py-1 rounded-full bg-white/15 backdrop-blur text-[11px] md:text-xs flex items-center gap-1">
              <Gift className="w-3 h-3" />
              미션 달성 캐시백
            </div>
            <div className="px-2 py-1 rounded-full bg-white/15 backdrop-blur text-[11px] md:text-xs flex items-center gap-1">
              <Leaf className="w-3 h-3" />
              친환경 제휴 혜택
            </div>
          </div>
        </div>

        {/* 본문 */}
        <div className="p-4 md:p-5 bg-background">
          {/* ① 요약 타일 3개(그대로, 가독성 개선 버전) */}
          <div className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="
              grid gap-4
              sm:[grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]
              grid-flow-col auto-cols-[minmax(220px,1fr)] sm:grid-flow-row
              min-w-max sm:min-w-0
            ">
              {/* 예금(요약) */}
              <div className="rounded-2xl border bg-white shadow-sm p-4 min-w-[220px]">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium [word-break:keep-all] [text-wrap:balance]">
                    친환경 정기예금
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    추천
                  </span>
                </div>
                <div className="mt-2">
                  <div className="text-xl md:text-2xl font-bold leading-tight">연 3.1%</div>
                  <div className="text-xs text-muted-foreground [word-break:keep-all]">
                    우대금리 최대 +0.3%p
                  </div>
                </div>
              </div>

              {/* 펀드(요약) */}
              <div className="rounded-2xl border bg-white shadow-sm p-4 min-w-[220px]">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium [word-break:keep-all] [text-wrap:balance]">
                    ESG 인덱스 펀드
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    NEW
                  </span>
                </div>
                <div className="mt-2">
                  <div className="text-xl md:text-2xl font-bold leading-tight">수수료 0.001%</div>
                  <div className="text-xs text-muted-foreground [word-break:keep-all]">
                    탄소감축 기업 중심
                  </div>
                </div>
              </div>

              {/* 카드(요약) */}
              <div className="rounded-2xl border bg-white shadow-sm p-4 min-w-[220px]">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium [word-break:keep-all] [text-wrap:balance]">
                    그린 체크/신용카드
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                    혜택 UP
                  </span>
                </div>
                <div className="mt-2">
                  <div className="text-xl md:text-2xl font-bold leading-tight">월 최대 20,000P</div>
                  <div className="text-xs text-muted-foreground [word-break:keep-all]">
                    대중교통·제로웨이스트 적합
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ② “추천 상품 더 보기” 토글 */}
          <div className="mt-3">
            <Button
              variant="ghost"
              className="h-8 px-3 border rounded-xl"
              onClick={() => setShowMore((v) => !v)}
            >
              {showMore ? "추천 목록 접기" : "추천 상품 더 보기"}
              <ChevronRight className={`w-4 h-4 ml-1 transition-transform ${showMore ? "rotate-90" : ""}`} />
            </Button>
          </div>

          {/* ③ 확장 목록(여러 개씩) */}
          {showMore && (
            <>
              <ProductRail
                title="정기예금/적금"
                items={depositItems}
                onMore={() => router.push(`/products?esg=${esg}`)}
              />
              <ProductRail
                title="ESG 펀드"
                items={fundItems}
                onMore={() => router.push(`/products?esg=${esg}`)}
              />
              <ProductRail
                title="체크/신용카드"
                items={cardItems}
                onMore={() => router.push(`/products?esg=${esg}`)}
              />
            </>
          )}

          {/* CTA */}
          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <Button className="h-9 rounded-xl" onClick={() => router.push(`/products?esg=${esg}`)}>
              상품 비교하기
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
            <Button variant="ghost" className="h-9 rounded-xl border" onClick={() => router.push(`/benefits?esg=${esg}`)}>
              내 혜택 계산
            </Button>
          </div>
        </div>
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
   Txn Simulator (수집/정제 + 실시간 알림)
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

// 지난달 절감량(g) 추론: 프로젝트 데이터에 맞게 여기만 연결하세요.
function inferPrevMonthSavingG(report: any, prevTotal?: number, totalNow?: number) {
  // 1) 보고서에 월 단위가 있으면 우선 사용
  const prev = Number(report?.prev_month_gco2e ?? prevTotal ?? 0);
  const curr = Number(report?.current_month_gco2e ?? report?.total_gco2e ?? totalNow ?? 0);
  // 절감 = 지난달 - 이번달 (감소한 만큼만 코인)
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

/* =========================
   Page
========================= */
export default function Page() {
  const [txns, setTxns] = useState<Transaction[]>(MOCK_TXNS);
  const [filter, setFilter] = useState<string>("");
  const [selected, setSelected] = useState<EnrichedTransaction | null>(null);
  const [toast, setToast] = useState<string | null>(null);

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

  // ✅ 추가: 지난달 대비 절감량(g) 계산 → 코인지급 기준
  const prevMonthSavingG = useMemo(
    () => Math.max(prevTotal - report.total_gco2e, 0),
    [prevTotal, report.total_gco2e]
  );

  // 목표 달성 → 리워드 지급 (1회/월 가정)
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

  return (
    <TooltipProvider>
      <div className="mx-auto max-w-7xl p-4 md:p-6 space-y-4">
        <Header total={report.total_gco2e} esg={report.esg} onExport={onExport} />

        {/* 기간 필터 */}
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4" />
              <div className="font-medium">기간 필터</div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Input type="date" value={startDate} onChange={(e)=>setStartDate(e.target.value)} className="max-w-[180px]" />
              <span>~</span>
              <Input type="date" value={endDate} onChange={(e)=>setEndDate(e.target.value)} className="max-w-[180px]" />
              <div className="flex items-center gap-2 ml-2">
                <Filter className="w-4 h-4 opacity-60" />
                <Input
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="가맹점 필터 (예: coffee, taxi)"
                  className="rounded-xl max-w-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <StatCards
          total={report.total_gco2e}
          enriched={report.enriched}
          goal={goal}
          rewards={rewards}
          prevTotal={prevTotal}
        />

        {/* 거래 시뮬레이터 */}
        <TxnSimulator onCreate={createTxn} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* 왼쪽: 거래 + 차트들 */}
          <div className="lg:col-span-8 space-y-4">
            <TxnTable items={filtered} onSelect={(e) => setSelected(e)} />

            {/* 차트 2개를 왼쪽에 배치해 좌우 균형 맞춤 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-[240px]">
                <TrendChart data={trend} />
              </div>
              <div className="h-[240px]">
                <CategoryPie top={report.top_categories} />
              </div>
            </div>
          </div>

          {/* 오른쪽: ✅ 코인지갑 + 추천 + 가이드 (필요시 고정) */}
          <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-4">
            {/* 지난달 절감량(g)을 전달 → (매달 1주차) 자동 코인지급 */}
            <CoinWallet prevMonthSavingG={prevMonthSavingG} />
            <Recommendation esg={report.esg} />
            <Guides story={report.story} suggestions={report.suggestions} />
          </div>
        </div>

        {selected && <ReceiptPanel selected={selected} onClose={() => setSelected(null)} />}

        <AnimatePresence>{toast && <Toast text={toast} onClose={() => setToast(null)} />}</AnimatePresence>
      </div>
    </TooltipProvider>
  );
}


