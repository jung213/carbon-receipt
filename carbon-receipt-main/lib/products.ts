// lib/products.ts
export type Product = {
  id: string;
  name: string;
  type: "카드" | "예금" | "적금" | "대출" | "펀드";
  tagline: string;
  esgScore: number;        // 0~100
  reward?: string;         // 예: "탄소절감 캐시백 3%"
  badge?: "NEW" | "인기" | "추천" | "그린특화";
};

export const PRODUCTS: Product[] = [
  {
    id: "green-card-plus",
    name: "그린카드 플러스",
    type: "카드",
    tagline: "친환경 가맹점 5% 적립 + 탄소절감 미션 보너스",
    esgScore: 92,
    reward: "월 최대 2만P",
    badge: "추천",
  },
  {
    id: "eco-savings-12",
    name: "에코 적금 12",
    type: "적금",
    tagline: "모은 만큼 친환경 프로젝트 투자",
    esgScore: 88,
    reward: "우대금리 +0.5%",
    badge: "그린특화",
  },
  {
    id: "footprint-fund",
    name: "풋프린트 펀드",
    type: "펀드",
    tagline: "저탄소 지수 연동형 포트폴리오",
    esgScore: 85,
    reward: "수수료 30% 할인(신규)",
    badge: "NEW",
  },
];
