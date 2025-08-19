"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { PRODUCTS } from "@/lib/products";
import { PRODUCT_DETAILS } from "@/lib/productDetails";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip as ReTooltip
} from "recharts";

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = String(params?.id || "");
  const base = PRODUCTS.find(p => p.id === id);
  const detail = PRODUCT_DETAILS[id];

  const esgData = useMemo(() => [
    { name: "E", value: detail?.esg.E ?? 0 },
    { name: "S", value: detail?.esg.S ?? 0 },
    { name: "G", value: detail?.esg.G ?? 0 },
  ], [detail]);

  const similars = useMemo(
    () => (detail?.comparable ?? [])
      .map(cid => PRODUCTS.find(p => p.id === cid))
      .filter(Boolean),
    [detail]
  );

  if (!base || !detail) {
    return (
      <div className="max-w-5xl mx-auto p-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" /> 뒤로
        </Button>
        <div className="mt-6 text-sm">상품을 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold">{base.name}</h1>
            <Badge variant="secondary">{base.type}</Badge>
            {base.badge && <Badge className="rounded-full">{base.badge}</Badge>}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{base.tagline}</p>
          <div className="flex items-center gap-3 mt-2">
            <Badge className="rounded-full">ESG {base.esgScore}</Badge>
            {base.reward && <Badge className="rounded-full">{base.reward}</Badge>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" /> 뒤로
          </Button>
          <Button>신청/상담 요청</Button>
        </div>
      </div>

      {/* 개요 & ESG 분해 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2 rounded-2xl shadow-sm">
          <CardContent className="p-5 space-y-3">
            <div className="text-sm opacity-70">개요</div>
            <div className="text-sm">{detail.overview}</div>
            {!!detail.features?.length && (
              <>
                <div className="text-sm opacity-70 mt-2">주요 혜택</div>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  {detail.features.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-5">
            <div className="text-sm opacity-70 mb-2">ESG 구성</div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={esgData} dataKey="value" outerRadius={80}>
                    {esgData.map((_, i) => <Cell key={i} />)}
                  </Pie>
                  <ReTooltip formatter={(v: unknown, n: unknown) => [`${v}%`, String(n)]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex gap-2 flex-wrap">
              {detail.esg.factors.map((t, i) => (
                <Badge key={i} variant="outline" className="rounded-full">{t}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 금리/수수료/자격 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl shadow-sm"><CardContent className="p-5">
          <div className="text-sm opacity-70">금리/리워드</div>
          <div className="text-sm mt-1">{detail.rates ?? base.reward ?? "—"}</div>
          {!!detail.rewards?.length && (
            <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
              {detail.rewards.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          )}
        </CardContent></Card>

        <Card className="rounded-2xl shadow-sm"><CardContent className="p-5">
          <div className="text-sm opacity-70">수수료</div>
          <div className="text-sm mt-1">{detail.fees ?? "—"}</div>
        </CardContent></Card>

        <Card className="rounded-2xl shadow-sm"><CardContent className="p-5">
          <div className="text-sm opacity-70">가입 자격</div>
          <ul className="list-disc pl-5 mt-1 space-y-1 text-sm">
            {detail.eligibility.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </CardContent></Card>
      </div>

      {/* 약관 요점 & FAQ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="rounded-2xl shadow-sm"><CardContent className="p-5">
          <div className="text-sm opacity-70">유의사항/약관 요점</div>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
            {detail.terms.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </CardContent></Card>

        <Card className="rounded-2xl shadow-sm"><CardContent className="p-5">
          <div className="text-sm opacity-70">FAQ</div>
          <div className="mt-2 space-y-3">
            {detail.faq.map((f, i) => (
              <div key={i}>
                <div className="font-medium text-sm">Q. {f.q}</div>
                <div className="text-sm text-muted-foreground mt-1">A. {f.a}</div>
              </div>
            ))}
          </div>
        </CardContent></Card>
      </div>

      {/* 유사 상품 비교 */}
      {!!similars.length && (
        <div>
          <div className="text-sm opacity-70 mb-2">유사 상품</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {similars.map((p) => (
              <div key={p!.id} className="border rounded-2xl p-4">
                <div className="flex items-center gap-2">
                  <div className="font-semibold">{p!.name}</div>
                  <Badge variant="secondary">{p!.type}</Badge>
                </div>
                <div className="text-sm text-muted-foreground mt-1">{p!.tagline}</div>
                <div className="mt-3 flex items-center justify-between">
                  <Badge className="rounded-full">ESG {p!.esgScore}</Badge>
                  <Button size="sm" onClick={() => router.push(`/products/${p!.id}`)}>자세히</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
