"use client";

import { useSearchParams } from "next/navigation";
import Recommendation from "@/components/recommendation";

export default function RecommendPage() {
  const sp = useSearchParams();
  const esg = Number(sp.get("esg") ?? "90"); // 쿼리 없으면 90으로 표시

  return (
    <div className="p-4 pb-24 space-y-4">
      <Recommendation esg={esg} />
    </div>
  );
}
