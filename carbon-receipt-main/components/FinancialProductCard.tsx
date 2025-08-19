"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Product } from "@/lib/products";
import { useRouter } from "next/navigation";

export default function FinancialProductCard({ p }: { p: Product }) {
  const router = useRouter();
  const grade = p.esgScore >= 90 ? "A+" : p.esgScore >= 80 ? "A" : p.esgScore >= 70 ? "B" : "C";

  return (
    <Card className="relative hover:shadow-xl transition-shadow rounded-2xl">
      {p.badge && (
        <Badge className="absolute -top-2 -right-2 rounded-full px-3 py-1">
          {p.badge}
        </Badge>
      )}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="text-lg font-semibold">{p.name}</div>
          <Badge variant="secondary">{p.type}</Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{p.tagline}</p>
      </div>

      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <div className="font-medium">ESG 점수</div>
            <div className="text-xl font-bold leading-none">{p.esgScore}</div>
            <div className="text-[12px] text-muted-foreground">등급 {grade}</div>
          </div>
          <div className="text-right">
            {p.reward && <div className="text-sm font-semibold">{p.reward}</div>}
            <Button className="mt-2" onClick={() => router.push(`/products/${p.id}`)}>
              자세히 보기
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
