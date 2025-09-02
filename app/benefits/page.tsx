"use client";

import React, { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSearchParams, useRouter } from "next/navigation";
import { Gift, TrendingUp, ChevronRight } from "lucide-react";

export default function BenefitsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const esg = Number(searchParams.get("esg") ?? "0");

  // 사용자 입력
  const [deposit, setDeposit] = useState<number>(10000000);   // 예치금(원) 예: 1,000만원
  const [transit, setTransit] = useState<number>(80000);      // 대중교통(원/월)
  const [zerowaste, setZerowaste] = useState<number>(50000);  // 제로웨이스트(원/월)
  const [etc, setEtc] = useState<number>(120000);             // 기타 친환경 가맹점(원/월)

  // 데모 계산 로직
  const result = useMemo(() => {
    // 우대금리: 최대 +0.3%p, ESG 점수에 비례(예: 80점=0.24%p, 100점=0.3%p)
    const bonusRateP = Math.min(0.3, (esg / 100) * 0.3); // %p
    const annualBonusInterest = Math.floor(deposit * (bonusRateP / 100)); // 원/년 (간단계산)

    // 카드 리워드: 대중교통 5%, 제로웨이스트 5%, 기타 3% (월 최대 20,000P)
    const monthlyRewardRaw = transit * 0.05 + zerowaste * 0.05 + etc * 0.03;
    const monthlyReward = Math.min(20000, Math.round(monthlyRewardRaw));

    return {
      bonusRateP,
      annualBonusInterest,
      monthlyReward,
    };
  }, [deposit, transit, zerowaste, etc, esg]);

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-4">
      <Card className="rounded-2xl shadow-sm overflow-hidden">
        <CardContent className="p-5 md:p-6">
          <div className="flex items-center gap-2 text-sm text-emerald-700">
            <TrendingUp className="w-4 h-4" />
            <span>혜택 계산기</span>
          </div>
          <h1 className="text-xl md:text-2xl font-semibold mt-1">내 친환경 금융 혜택 계산</h1>
          <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
            <Badge variant="outline">ESG {esg}점</Badge>
            <Badge variant="outline">우대금리 최대 +0.3%p</Badge>
            <Badge variant="outline">카드 리워드 월 최대 20,000P</Badge>
          </div>
        </CardContent>
      </Card>

      {/* 입력 폼 */}
      <Card className="rounded-2xl">
        <CardContent className="p-4 md:p-5 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">예치금(원)</label>
              <Input
                type="number"
                value={deposit}
                onChange={(e) => setDeposit(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">대중교통(원/월)</label>
              <Input
                type="number"
                value={transit}
                onChange={(e) => setTransit(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">제로웨이스트(원/월)</label>
              <Input
                type="number"
                value={zerowaste}
                onChange={(e) => setZerowaste(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">기타 친환경 가맹점(원/월)</label>
              <Input
                type="number"
                value={etc}
                onChange={(e) => setEtc(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <Button className="rounded-xl">
              계산하기
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
            <Button variant="ghost" className="border rounded-xl" onClick={() => router.push(`/products?esg=${esg}`)}>
              상품 비교로 이동
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 결과 */}
      <Card className="rounded-2xl">
        <CardContent className="p-4 md:p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4" />
            <div className="text-sm font-medium">예상 혜택 결과</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-xl border p-3">
              <div className="text-xs text-muted-foreground">우대금리(추가)</div>
              <div className="text-2xl font-bold">{result.bonusRateP.toFixed(2)}%p</div>
            </div>
            <div className="rounded-xl border p-3">
              <div className="text-xs text-muted-foreground">연간 추가 이자(예시)</div>
              <div className="text-2xl font-bold">{result.annualBonusInterest.toLocaleString()}원</div>
            </div>
            <div className="rounded-xl border p-3">
              <div className="text-xs text-muted-foreground">월 예상 리워드(상한 20,000P)</div>
              <div className="text-2xl font-bold">{result.monthlyReward.toLocaleString()}P</div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            * 본 계산은 데모 시뮬레이션이며 실제 금리/수수료/리워드는 상품 약관 및 심사 결과에 따라 달라질 수 있습니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
