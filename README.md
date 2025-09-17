Carbon Receipt ♻️

카드/영수증 데이터를 탄소 배출량(CO₂e) 으로 환산하고, 월별 감축 목표와 그린 리워드(코인) 로 행동 변화를 돕는 ESG 핀테크 앱.


핵심 기능

거래 → CO₂e 변환

월 목표 & 진행률: 목표 대비 추적, 알림/배지

그린 리워드(코인): 절감 실적에 따른 포인트/랭킹

대시보드: 기간 필터, 상위 배출 카테고리, 금융 상품 추천, 배출량 감소 방법 제안


Tech Stack

Framework: Next.js (App Router) + TypeScript

UI: Tailwind CSS, shadcn/ui

Animation/Icon: (예) Framer Motion, lucide-react

State/Utils: (예) Zustand/React Query, dayjs

실제 package.json 기준으로 항목을 조정하세요.

빠른 시작
# 1) 설치
git clone https://github.com/jung213/carbon-receipt.git
cd carbon-receipt
npm install

# 2) 개발 서버
npm run dev
# http://localhost:3000

환경변수 (.env.local)
# App
NEXT_PUBLIC_APP_NAME=Carbon Receipt
NEXT_PUBLIC_DEFAULT_CURRENCY=KRW
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api

# Features
NEXT_PUBLIC_FEATURE_REWARDS=true
NEXT_PUBLIC_CO2_FACTORS_VERSION=v1


프로젝트 구조
carbon-receipt/
├─ app/                # 페이지/레이아웃 (Next.js App Router)
├─ components/
│  └─ ui/              # shadcn/ui 공용 컴포넌트
├─ lib/                # 유틸(배출계수, 포맷터, 상태 등)
├─ public/             # 정적 자산 (스크린샷/아이콘)
├─ package.json
└─ README.md

스크린샷
<img width="556" height="403" alt="image" src="https://github.com/user-attachments/assets/ef729211-05ae-425c-ab6a-14a038f6dc35" />
