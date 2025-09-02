"use client";

import React, { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useSearchParams, useRouter } from "next/navigation";
import { Leaf, TrendingUp, ChevronRight, Filter } from "lucide-react";

type Category = "deposit" | "fund" | "card";

type Product = {
  id: string;
  category: Category;
  name: string;
  highlights: string[];
  key1: string;     // 메인 수치 (연 3.1%, 수수료 0.001%, 월 최대 20,000P 등)
  key2?: string;    // 보조 문구
  fee?: string;
  rate?: string;
  reward?: string;
  tag?: string;
};

const ALL_PRODUCTS: Product[] = [
  // 예금/적금
  { id: "dep1", category: "deposit", name: "그린 세이브 예금", key1: "연 3.1%", key2: "우대금리 최대 +0.3%p", rate: "연 3.1% + (최대 0.3%p)", highlights: ["자동이체/미션 달성 시", "친환경 실천 연계"], tag: "추천" },
  { id: "dep2", category: "deposit", name: "에코 플러스 적금", key1: "연 3.3%", key2: "ESG 미션 연계", rate: "연 3.3%", highlights: ["월 적립식", "지속 실천 리워드"] },
  { id: "dep3", category: "deposit", name: "탄소중립 정기예금", key1: "연 3.0%", key2: "기부 연계", rate: "연 3.0%", highlights: ["기부금 세액공제", "사회공헌"] },
  { id: "dep4", category: "deposit", name: "리사이클 행복예금", key1: "연 3.05%", key2: "친환경 제휴 우대", rate: "연 3.05%", highlights: ["ATM 수수료 면제", "제휴처 할인"] },

  // 펀드
  { id: "fund1", category: "fund", name: "ESG 인덱스 1호", key1: "수수료 0.001%", key2: "지속가능 성장", fee: "0.001%", highlights: ["탄소감축 기업 중심", "지수 추종"], tag: "NEW" },
  { id: "fund2", category: "fund", name: "저탄소 글로벌 펀드", key1: "수수료 0.002%", key2: "RE100 비중↑", fee: "0.002%", highlights: ["해외 분산 투자", "장기 성장"] },
  { id: "fund3", category: "fund", name: "그린에너지 테마", key1: "수수료 0.001%", key2: "변동성 유의", fee: "0.003%", highlights: ["신재생 중심", "테마 분산"] },

  // 카드
  { id: "card1", category: "card", name: "그린 체크카드", key1: "월 최대 20,000P", key2: "대중교통 5%", reward: "20,000P/월", highlights: ["제로웨이스트 5%", "생활밀착"], tag: "혜택 UP" },
  { id: "card2", category: "card", name: "에코 라이프 카드", key1: "월 최대 20,000P", key2: "친환경 매장 5%", reward: "20,000P/월", highlights: ["온라인 3%", "광범위 가맹점"] },
  { id: "card3", category: "card", name: "모빌리티 카드", key1: "월 최대 15,000P", key2: "전기차 충전 7%", reward: "15,000P/월", highlights: ["공공자전거 5%", "교통 특화"] },
];

const CAT_LABEL: Record<Category, string> = {
  deposit: "정기예금/적금",
  fund: "ESG 펀드",
  card: "체크/신용카드",
};

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const esg = Number(searchParams.get("esg") ?? "0");

  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Record<Category, boolean>>({
    deposit: true,
    fund: true,
    card: true,
  });
  const [selected, setSelected] = useState<string[]>([]);

  const banner = useMemo(() => {
    if (esg >= 90) return "ESG 최상위 고객님께 맞춤형 친환경 금융을 추천합니다.";
    if (esg >= 80) return "ESG 우수 고객님께 유리한 상품 구성을 모았습니다.";
    return "고객님의 친환경 소비 성향을 바탕으로 금융상품을 비교해보세요.";
  }, [esg]);

  const filtered = useMemo(() => {
    const activeCats = (Object.keys(cat) as Category[]).filter((k) => cat[k]);
    const kw = q.trim().toLowerCase();
    return ALL_PRODUCTS.filter(
      (p) =>
        activeCats.includes(p.category) &&
        (kw === "" ||
          p.name.toLowerCase().includes(kw) ||
          p.highlights.some((h) => h.toLowerCase().includes(kw)))
    );
  }, [q, cat]);

  const toggleSel = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const selectAll = () => setSelected(filtered.map((p) => p.id));
  const clearAll = () => setSelected([]);

  const chosen = ALL_PRODUCTS.filter((p) => selected.includes(p.id));

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-4">
      {/* 헤더 */}
      <Card className="rounded-2xl shadow-sm overflow-hidden">
        <CardContent className="p-5 md:p-6">
          <div className="flex items-center gap-2 text-sm text-emerald-700">
            <Leaf className="w-4 h-4" />
            <span>상품 비교</span>
          </div>
          <h1 className="text-xl md:text-2xl font-semibold mt-1">친환경 금융상품 비교</h1>
          <p className="text-sm text-muted-foreground mt-1">{banner}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
            <Badge variant="outline">ESG {esg}점</Badge>
            <Badge variant="outline">우대금리/캐시백/수수료</Badge>
          </div>
        </CardContent>
      </Card>

      {/* 필터 & 액션 */}
      <Card className="rounded-2xl">
        <CardContent className="p-4 md:p-5 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* 검색 */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 opacity-60" />
              <Input
                placeholder="상품명/특징 검색"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            {/* 카테고리 토글 */}
            <div className="flex flex-wrap items-center gap-2">
              {(Object.keys(CAT_LABEL) as Category[]).map((k) => (
                <Button
                  key={k}
                  variant="ghost"
                  className={`h-8 px-3 rounded-xl border ${cat[k] ? "bg-muted/60" : ""}`}
                  onClick={() => setCat((prev) => ({ ...prev, [k]: !prev[k] }))}
                >
                  {CAT_LABEL[k]}
                </Button>
              ))}
            </div>

            {/* 전체선택/해제 */}
            <div className="flex gap-2">
              <Button variant="ghost" className="h-8 px-3 rounded-xl border" onClick={selectAll}>
                전체 선택
              </Button>
              <Button variant="ghost" className="h-8 px-3 rounded-xl border" onClick={clearAll}>
                선택 해제
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 카드 목록 (무제한 선택) */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered.map((p) => (
            <Card
                key={p.id}
                className={`rounded-2xl border bg-white shadow-sm p-0 overflow-hidden ${
                    selected.includes(p.id) ? `ring-2 ${CAT_STYLES[p.category].ring}` : ""
                }`}
            >
                {/* 상단 색 막대(카테고리 표시) */}
                <div className={`h-1 ${CAT_STYLES[p.category].bar}`} />

                <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="text-sm font-medium [word-break:keep-all] [text-wrap:balance]">
                            {p.name}
                        </div>

                        {/* 카테고리 칩 + 태그 배지 */}
                        <div className="flex items-center gap-1.5">
                            <span
                                className={`text-[10px] px-2 py-0.5 rounded-full border ${CAT_STYLES[p.category].chipBg} ${CAT_STYLES[p.category].chipText} ${CAT_STYLES[p.category].chipBorder}`}
                            >
                                {CAT_LABEL[p.category]}
                            </span>
                            {p.tag && (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${TAG_STYLES[p.tag] ?? "bg-muted"}`}>
                                    {p.tag}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="text-xl font-bold leading-tight">{p.key1}</div>
                    {p.key2 && <div className="text-xs text-muted-foreground [word-break:keep-all]">{p.key2}</div>}

                    <ul className="mt-1 text-[11px] text-muted-foreground list-disc pl-4 space-y-0.5">
                        {p.highlights.map((h, i) => (
                            <li key={i} className="[word-break:keep-all]">{h}</li>
                        ))}
                    </ul>

                    <div className="pt-2">
                        <Button
                            variant="ghost"
                            className={`w-full border rounded-xl ${selected.includes(p.id) ? "bg-muted/60" : ""}`}
                            onClick={() => toggleSel(p.id)}
                        >
                            {selected.includes(p.id) ? "비교 대상에서 제외" : "비교 대상에 추가"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        ))}

      </div>

      {/* 비교 표 (무제한, 가로 스크롤) */}
      <Card className="rounded-2xl">
        <CardContent className="p-4 md:p-5 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <div className="text-sm font-medium">비교 요약</div>
          </div>

          {chosen.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              위의 목록에서 원하는 만큼 선택해 비교하세요. (무제한 선택 가능)
            </div>
          ) : (
            <div className="overflow-auto border rounded-xl">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 sticky left-0 bg-muted/50 z-10">항목</th>
                    {chosen.map((c) => (
                      <th key={c.id} className="text-left p-3 whitespace-nowrap">
                        <span className={`inline-block w-2 h-2 rounded-full mr-1 ${CAT_STYLES[c.category].dot}`} />
                        {c.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="p-3 sticky left-0 bg-background z-10">유형</td>
                    {chosen.map((c) => (
                      <td key={c.id} className="p-3">{CAT_LABEL[c.category]}</td>
                    ))}
                  </tr>
                  <tr className="border-t">
                    <td className="p-3 sticky left-0 bg-background z-10">핵심</td>
                    {chosen.map((c) => (
                      <td key={c.id} className="p-3">{c.rate ?? c.fee ?? c.reward ?? c.key1}</td>
                    ))}
                  </tr>
                  <tr className="border-t">
                    <td className="p-3 sticky left-0 bg-background z-10">부가혜택</td>
                    {chosen.map((c) => (
                      <td key={c.id} className="p-3">{c.key2 ?? "-"}</td>
                    ))}
                  </tr>
                  <tr className="border-t">
                    <td className="p-3 sticky left-0 bg-background z-10">한 줄 요약</td>
                    {chosen.map((c) => (
                      <td key={c.id} className="p-3">{c.highlights[0] ?? "-"}</td>
                    ))}
                  </tr>
                  <tr className="border-t">
                    <td className="p-3 sticky left-0 bg-background z-10">추가 포인트</td>
                    {chosen.map((c) => (
                      <td key={c.id} className="p-3">{c.highlights[1] ?? "-"}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <div className="pt-2 flex gap-2">
            <Button onClick={() => router.push(`/benefits?esg=${esg}`)}>
              내 혜택 계산으로 이동
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
            <Button variant="ghost" className="border" onClick={() => router.push(`/`)}>
              홈으로
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// 카테고리별 색상/스타일
const CAT_STYLES: Record<
  Category,
  { ring: string; bar: string; chipBg: string; chipText: string; chipBorder: string; dot: string }
> = {
  deposit: {
    ring: "ring-emerald-400/60",
    bar: "bg-emerald-400",
    chipBg: "bg-emerald-50",
    chipText: "text-emerald-700",
    chipBorder: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  fund: {
    ring: "ring-amber-400/60",
    bar: "bg-amber-400",
    chipBg: "bg-amber-50",
    chipText: "text-amber-700",
    chipBorder: "border-amber-200",
    dot: "bg-amber-500",
  },
  card: {
    ring: "ring-sky-400/60",
    bar: "bg-sky-400",
    chipBg: "bg-sky-50",
    chipText: "text-sky-700",
    chipBorder: "border-sky-200",
    dot: "bg-sky-500",
  },
};

// 추천/NEW/혜택 UP 배지 색상
const TAG_STYLES: Record<string, string> = {
  "추천": "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "NEW": "bg-amber-50 text-amber-700 border border-amber-200",
  "혜택 UP": "bg-sky-50 text-sky-700 border border-sky-200",
};