// lib/productDetails.ts
import type { Product } from "./products";

export type ProductDetail = {
  id: string;                      // PRODUCTS의 id와 동일
  overview: string;
  features: string[];
  fees?: string;
  rates?: string;                  // 예/적금, 펀드 등
  rewards?: string[];
  eligibility: string[];
  esg: { score: number; E: number; S: number; G: number; factors: string[] };
  terms: string[];
  faq: Array<{ q: string; a: string }>;
  comparable?: string[];           // 유사 상품 id 리스트
};

export const PRODUCT_DETAILS: Record<string, ProductDetail> = {
  "green-card-plus": {
    id: "green-card-plus",
    overview:
      "친환경 가맹점 우대 적립과 탄소절감 미션 보너스를 제공하는 신용카드입니다.",
    features: [
      "친환경 가맹점 5% 적립 (월 최대 20,000P)",
      "탄소절감 미션 달성 시 보너스 2,000P",
      "대중교통/공공자전거 10% 적립(통합 월 1만P)",
    ],
    fees: "연회비 20,000원 (국내전용), 25,000원 (해외겸용)",
    rewards: ["전월실적 30만원 이상 시 기본 적립 적용", "일부 업종 제외"],
    eligibility: ["만 19세 이상", "신용 심사 기준 충족", "국내 거주자"],
    esg: {
      score: 92,
      E: 62, S: 18, G: 20,
      factors: ["친환경 가맹점과의 파트너십", "저탄소 소비 인센티브 구조", "ESG 보고 투명성"]
    },
    terms: [
      "포인트 유효기간 5년",
      "이벤트/프로모션은 별도 공지 기준",
      "실적·적립 제외 가맹점은 약관 참고",
    ],
    faq: [
      { q: "해외 사용도 적립되나요?", a: "해외 겸용 카드 사용은 1% 기본 적립이 적용됩니다." },
      { q: "대중교통 적립 한도는?", a: "월 10,000P까지 적립됩니다." },
    ],
    comparable: ["eco-savings-12", "footprint-fund"],
  },

  "eco-savings-12": {
    id: "eco-savings-12",
    overview:
      "12개월 만기의 친환경 프로젝트 연계 적금으로, 예치액 일부가 녹색 펀딩에 배정됩니다.",
    features: [
      "기본금리 +0.2%p, 친환경 미션 달성 시 우대 +0.3%p",
      "월 1회 자동이체 납입 지원",
      "중도해지 시 별도 약관 적용",
    ],
    rates: "최대 연 4.0% (세전, 조건 충족 시)",
    eligibility: ["만 17세 이상 개인", "1인 1계좌", "월 납입 1만~50만원"],
    esg: {
      score: 88,
      E: 55, S: 20, G: 25,
      factors: ["녹색 프로젝트 할당", "예치액 투명 공시", "윤리적 투자 필터"]
    },
    terms: [
      "우대금리는 조건 충족 월에 한함",
      "세율 및 과세는 관련 법령에 따름",
      "예금자보호법에 의거 보호(한도 5천만원)",
    ],
    faq: [
      { q: "우대금리 조건은?", a: "탄소 리포트 목표 달성과 자동이체 납입 지속 시 적용됩니다." },
      { q: "중도해지 시 이자는?", a: "지급률은 약관의 중도해지 이율표를 따릅니다." },
    ],
    comparable: ["green-card-plus"],
  },

  "footprint-fund": {
    id: "footprint-fund",
    overview:
      "저탄소 지수에 연동된 액티브 ETF 포트폴리오에 분산 투자하는 펀드입니다.",
    features: [
      "저탄소·친환경 테마 자산 비중 확대",
      "리밸런싱 분기 1회",
      "적립식/거치식 가입 가능",
    ],
    fees: "총 보수 연 0.75% (운용·판매·수탁 포함, 변동 가능)",
    rewards: ["신규가입 수수료 30% 인하(기간 한정)"],
    eligibility: ["개인/법인 가능", "최소 가입 10만원"],
    esg: {
      score: 85,
      E: 60, S: 15, G: 25,
      factors: ["지수 구성의 탄소강도 하향", "의결권 행사 가이드라인", "공시 준수"]
    },
    terms: [
      "원금 비보장 상품",
      "시장 변동성에 따라 손실 가능",
      "세제 혜택은 개인별 상이",
    ],
    faq: [
      { q: "환매는 어떻게 하나요?", a: "영업일 기준 T+2일에 환매 대금이 지급됩니다." },
      { q: "적립식 변경 가능?", a: "납입 주기·금액은 월 단위로 변경 가능합니다." },
    ],
    comparable: ["eco-savings-12"],
  },
};
