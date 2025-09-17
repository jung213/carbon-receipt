"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Leaf, Filter, Check, X, Sparkles } from "lucide-react";

type Cat = "deposit" | "fund" | "card";
type Product = {
  id: string;
  cat: Cat;
  name: string;
  headline: string;   // 연 3.1%, 수수료 0.001%, 월 최대 20,000P 등
  subline?: string;   // 우대금리 +0.3%p, RE100 비중↑ 등
  features?: string[]; // 점 목록 (3~4줄까지만)
  badge?: "추천" | "NEW" | "혜택 UP";
};

const DEPOSITS: Product[] = [
  { id: "dep1", cat: "deposit", name: "그린 세이브 예금", headline: "연 3.1%", subline: "우대금리 최대 +0.3%p", features: ["자동이체/미션 달성 시", "친환경 실천 연계"], badge: "추천" },
  { id: "dep2", cat: "deposit", name: "에코 플러스 적금", headline: "연 3.3%", subline: "ESG 미션 연계", features: ["월 적립식", "지속 실천 리워드"] },
  { id: "dep3", cat: "deposit", name: "탄소중립 정기예금", headline: "연 3.0%", subline: "기부 연계", features: ["기부금 세액공제", "사회공헌"] },
  { id: "dep4", cat: "deposit", name: "리사이클 행복예금", headline: "연 3.05%", subline: "친환경 제휴 우대", features: ["ATM 수수료 면제", "제휴처 할인"] },
];

const FUNDS: Product[] = [
  { id: "fund1", cat: "fund", name: "ESG 인덱스 1호", headline: "수수료 0.001%", subline: "지속가능 성장", features: ["탄소감축 기업 중심", "인덱스 추종"], badge: "NEW" },
  { id: "fund2", cat: "fund", name: "저탄소 글로벌", headline: "수수료 0.002%", subline: "RE100 비중↑", features: ["해외 분산 투자", "장기 성장"] },
  { id: "fund3", cat: "fund", name: "그린에너지 테마", headline: "수수료 0.0019%", subline: "변동성 유의", features: ["신재생 중심", "테마 분산"] },
];

const CARDS: Product[] = [
  { id: "card1", cat: "card", name: "그린 체크카드", headline: "월 최대 20,000P", subline: "대중교통/제로웨이스트 5%", features: ["생활밀착 캐시백"], badge: "혜택 UP" },
  { id: "card2", cat: "card", name: "에코 라이프 카드", headline: "월 최대 20,000P", subline: "친환경 매장 5%", features: ["온라인 3%"] },
  { id: "card3", cat: "card", name: "모빌리티 카드", headline: "월 최대 15,000P", subline: "전기차 충전 7%", features: ["공공자전거 5%"] },
];

function Segmented({
  value, onChange,
}: { value: Cat | "all"; onChange: (v: Cat | "all") => void }) {
  const items: Array<{ v: Cat | "all"; label: string }> = [
    { v: "all", label: "전체" },
    { v: "deposit", label: "정기예금/적금" },
    { v: "fund", label: "ESG 펀드" },
    { v: "card", label: "체크/신용카드" },
  ];
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {items.map((it) => (
        <Button
          key={it.v}
          variant="ghost"
          className={`h-8 rounded-full border px-3 text-sm whitespace-nowrap
            ${value === it.v ? "bg-emerald-50 border-emerald-200 text-emerald-700" : ""}`}
          onClick={() => onChange(it.v)}
        >
          {it.label}
        </Button>
      ))}
      <Button
        variant="ghost"
        className="h-8 rounded-full border px-3 text-sm ml-auto"
        onClick={() => onChange("all")}
      >
        선택 해제
      </Button>
    </div>
  );
}

function ProductCard({
  p, selected, toggle,
}: { p: Product; selected: boolean; toggle: () => void }) {
  return (
    <div className="rounded-2xl border bg-white shadow-sm p-4 min-w-[240px] max-w-[280px] [word-break:keep-all] [text-wrap:balance]">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">{p.name}</div>
        {p.badge && (
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full
              ${p.badge === "추천" ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : p.badge === "NEW" ? "bg-amber-50 text-amber-700 border border-amber-200"
                : "bg-sky-50 text-sky-700 border border-sky-200"}`}
          >
            {p.badge}
          </span>
        )}
      </div>

      <div className="mt-2">
        <div className="text-xl font-bold leading-tight">{p.headline}</div>
        {p.subline && <div className="text-xs text-muted-foreground">{p.subline}</div>}
      </div>

      {p.features?.length ? (
        <ul className="mt-2 space-y-1 text-[12px] text-muted-foreground">
          {p.features.slice(0, 4).map((f, i) => <li key={i}>• {f}</li>)}
        </ul>
      ) : null}

      <div className="mt-3">
        <Button
          onClick={toggle}
          className={`h-8 rounded-xl w-full ${selected ? "bg-emerald-600" : ""}`}
          variant={selected ? "default" : "ghost"}
        >
          {selected ? <Check className="w-4 h-4 mr-1" /> : null}
          {selected ? "비교 목록에 추가됨" : "비교 대상에 추가"}
        </Button>
      </div>
    </div>
  );
}

function Rail({
  title, items, selected, onToggle,
}: {
  title: string;
  items: Product[];
  selected: Record<string, boolean>;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="mt-5">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium">{title}</div>
      </div>
      {/* 📱 앱 스타일: 가로 스크롤 레일 */}
      <div className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="grid grid-flow-col auto-cols-[minmax(240px,1fr)] gap-3 min-w-max">
          {items.map((p) => (
            <ProductCard
              key={p.id}
              p={p}
              selected={!!selected[p.id]}
              toggle={() => onToggle(p.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function CompareBottomBar({
  ids, onClear, onCompare,
}: { ids: string[]; onClear: () => void; onCompare: () => void }) {
  if (ids.length === 0) return null;
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur border-t
                 md:left-1/2 md:-translate-x-1/2 md:max-w-[430px]"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 12px)" }}
    >
      <div className="px-4 py-3 flex items-center gap-2">
        <Badge variant="outline" className="rounded-full">
          선택 {ids.length}
        </Badge>
        <Button variant="ghost" className="h-9 rounded-xl border" onClick={onClear}>
          초기화
        </Button>
        <Button className="h-9 rounded-xl ml-auto" onClick={onCompare}>
          비교하기
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const [q, setQ] = useState("");
  const [seg, setSeg] = useState<Cat | "all">("all");
  const [picked, setPicked] = useState<Record<string, boolean>>({});

  const pool = useMemo(() => {
    let list = [...DEPOSITS, ...FUNDS, ...CARDS];
    if (seg !== "all") list = list.filter((p) => p.cat === seg);
    const kw = q.trim();
    if (kw) list = list.filter((p) => `${p.name} ${p.headline} ${p.subline ?? ""}`.includes(kw));
    return list;
  }, [q, seg]);

  const toggle = (id: string) =>
    setPicked((m) => ({ ...m, [id]: !m[id] }));

  const clear = () => setPicked({});

  const ids = useMemo(() => Object.keys(picked).filter((k) => picked[k]), [picked]);

  // 카테고리별로 다시 묶어서 레일로 표출
  const deposits = pool.filter((p) => p.cat === "deposit");
  const funds = pool.filter((p) => p.cat === "fund");
  const cards = pool.filter((p) => p.cat === "card");

  return (
    <div className="p-4 pb-24 space-y-4">
      {/* 헤드 */}
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Leaf className="w-4 h-4" />
            상품 비교
          </div>
          <div className="mt-1 text-xl font-semibold">친환경 금융상품 비교</div>
          <p className="text-sm text-muted-foreground mt-1">
            ESG 친화형 고객님께 맞춤형 친환경 금융을 추천합니다.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <Badge className="rounded-full">ESG 100점</Badge>
            <span className="text-xs text-muted-foreground">우대금리/캐시백/수수료</span>
          </div>
        </CardContent>
      </Card>

      {/* 검색 & 세그먼트 */}
      <Card className="rounded-2xl">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 opacity-60" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="상품명/특징 검색"
              className="rounded-xl"
            />
          </div>
          <Segmented value={seg} onChange={setSeg} />
        </CardContent>
      </Card>

      {/* 카테고리별 레일 (가로 스크롤, 앱 느낌) */}
      {deposits.length > 0 && (
        <Rail title="정기예금/적금" items={deposits} selected={picked} onToggle={toggle} />
      )}
      {funds.length > 0 && (
        <Rail title="ESG 펀드" items={funds} selected={picked} onToggle={toggle} />
      )}
      {cards.length > 0 && (
        <Rail title="체크/신용카드" items={cards} selected={picked} onToggle={toggle} />
      )}

      {/* 하단 비교 바 */}
      <CompareBottomBar
        ids={ids}
        onClear={clear}
        onCompare={() => {
          // 간단 비교: 새 창/라우팅 대신 alert 또는 console로 전달
          // 실제 비교 페이지가 있다면: router.push(`/compare?ids=${ids.join(",")}`)
          alert(`비교 대상: ${ids.join(", ")}`);
        }}
      />
    </div>
  );
}
