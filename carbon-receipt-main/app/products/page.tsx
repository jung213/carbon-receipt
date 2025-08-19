"use client";

import { useMemo, useState } from "react";
import FinancialProductCard from "@/components/FinancialProductCard";
import { PRODUCTS, type Product } from "@/lib/products";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ProductsPage() {
  const [q, setQ] = useState("");
  const [type, setType] = useState<string | "">("");
  const [sort, setSort] = useState<"esg" | "reward" | "name" | "">("");

  const filtered = useMemo(() => {
    let list: Product[] = PRODUCTS;
    if (q) {
      const lower = q.toLowerCase();
      list = list.filter((p) =>
        (p.name + p.tagline).toLowerCase().includes(lower)
      );
    }
    if (type) list = list.filter((p) => p.type === type);
    if (sort === "esg") list = [...list].sort((a, b) => b.esgScore - a.esgScore);
    if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "reward") {
      // 보상 문자열 유무 기준 간단 정렬(실데이터 붙이면 수치화 추천)
      list = [...list].sort(
        (a, b) => (b.reward ? 1 : 0) - (a.reward ? 1 : 0)
      );
    }
    return list;
  }, [q, type, sort]);

  const types: Array<Product["type"]> = ["카드", "예금", "적금", "대출", "펀드"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <Input
          placeholder="상품명/설명 검색"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="md:w-80"
        />

        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            onClick={() => setType("")}
            className={`cursor-pointer select-none ${type === "" ? "ring-2 ring-primary" : ""}`}
          >
            전체
          </Badge>
          {types.map((t) => (
            <Badge
              key={t}
              onClick={() => setType(t)}
              className={`cursor-pointer select-none ${type === t ? "ring-2 ring-primary" : ""}`}
            >
              {t}
            </Badge>
          ))}
        </div>

        <div className="ml-auto flex gap-2">
          <Button
            variant={sort === "esg" ? "default" : "ghost"}
            className={sort === "esg" ? "" : "border"}
            aria-pressed={sort === "esg"}
            onClick={() => setSort("esg")}
          >
            ESG 높은 순
          </Button>
          <Button
            variant={sort === "reward" ? "default" : "ghost"}
            className={sort === "reward" ? "" : "border"}
            aria-pressed={sort === "reward"}
            onClick={() => setSort("reward")}
          >
            혜택 많은 순
          </Button>
          <Button
            variant={sort === "name" ? "default" : "ghost"}
            className={sort === "name" ? "" : "border"}
            aria-pressed={sort === "name"}
            onClick={() => setSort("name")}
          >
            이름순
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((p) => (
          <FinancialProductCard key={p.id} p={p} />
        ))}
      </div>
    </div>
  );
}
