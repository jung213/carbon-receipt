"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, TrendingUp, Gift, Leaf, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

type SimpleProduct = {
  id: string;
  name: string;
  key1: string;
  key2?: string;
  subtitle?: string;
  badge?: string;
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
                <span className="text-sm font-medium [word-break:keep-all] [text-wrap:balance]">{p.name}</span>
                {p.badge && <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted">{p.badge}</span>}
              </div>
              <div className="mt-2">
                <div className="text-xl md:text-2xl font-bold leading-tight">{p.key1}</div>
                {p.key2 && <div className="text-xs text-muted-foreground [word-break:keep-all]">{p.key2}</div>}
              </div>
              {p.subtitle && (
                <div className="text-[11px] text-muted-foreground mt-1 [word-break:keep-all]">{p.subtitle}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Recommendation({ esg }: { esg: number }) {
  const router = useRouter();
  const [showMore, setShowMore] = useState(false);

  const depositItems: SimpleProduct[] = [
    { id: "dep1", name: "그린 세이브 예금", key1: "연 3.1%", key2: "우대금리 최대 +0.3%p", subtitle: "자동이체/미션 달성 시", badge: "추천" }
  ];
  const fundItems: SimpleProduct[] = [
    { id: "fund1", name: "ESG 인덱스 1호", key1: "수수료 0.001%", key2: "지속가능 성장", subtitle: "탄소감축 기업 중심", badge: "NEW" }
  ];
  const cardItems: SimpleProduct[] = [
    { id: "card1", name: "그린 체크카드", key1: "월 최대 20,000P", key2: "대중교통 5%", subtitle: "제로웨이스트 5%", badge: "혜택 UP" }
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
              <span className="underline decoration-white/60 underline-offset-4">친환경 금융 혜택</span>
            </h3>
            <p className="text-xs md:text-sm mt-1 opacity-90">우대금리·캐시백·수수료 면제까지 한 번에 확인하세요.</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <div className="px-2 py-1 rounded-full bg-white/15 backdrop-blur text-[11px] md:text-xs flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> 우대금리 최대 +0.3%p
            </div>
            <div className="px-2 py-1 rounded-full bg-white/15 backdrop-blur text-[11px] md:text-xs flex items-center gap-1">
              <Gift className="w-3 h-3" /> 미션 달성 캐시백
            </div>
            <div className="px-2 py-1 rounded-full bg-white/15 backdrop-blur text-[11px] md:text-xs flex items-center gap-1">
              <Leaf className="w-3 h-3" /> 친환경 제휴 혜택
            </div>
          </div>
        </div>

        {/* 본문 */}
        <div className="p-4 md:p-5 bg-background">
          {/* 요약 3타일은 제품 레일로 대체 */}
          <ProductRail title="정기예금/적금" items={depositItems} onMore={() => router.push(`/products?esg=${esg}`)} />
          <ProductRail title="ESG 펀드" items={fundItems} onMore={() => router.push(`/products?esg=${esg}`)} />
          <ProductRail title="체크/신용카드" items={cardItems} onMore={() => router.push(`/products?esg=${esg}`)} />

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
