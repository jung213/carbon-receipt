# Carbon Receipt ♻️

카드/영수증 데이터를 탄소 배출량(CO₂e) 으로 환산하고, 월별 감축 목표와 그린 리워드(코인) 로 행동 변화를 돕는 ESG 핀테크 앱.


# 핵심 기능

거래 → CO₂e 변환

월 목표 & 진행률: 목표 대비 추적, 알림/배지

그린 리워드(코인): 절감 실적에 따른 포인트/랭킹

대시보드: 기간 필터, 상위 배출 카테고리, 금융 상품 추천, 배출량 감소 방법 제안


# Tech Stack

Framework: Next.js (App Router) + TypeScript

UI: Tailwind CSS, shadcn/ui

Animation/Icon: (예) Framer Motion, lucide-react

State/Utils: (예) Zustand/React Query, dayjs

실제 package.json 기준으로 항목을 조정하세요.

# 1) 설치
git clone https://github.com/jung213/carbon-receipt.git
cd carbon-receipt
npm install

# 2) 개발 서버
npm run dev
http://localhost:3000

환경변수 (.env.local)
# App
NEXT_PUBLIC_APP_NAME=Carbon Receipt
NEXT_PUBLIC_DEFAULT_CURRENCY=KRW
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api

# Features
NEXT_PUBLIC_FEATURE_REWARDS=true
NEXT_PUBLIC_CO2_FACTORS_VERSION=v1



# 화면 예시

<img width="556" height="403" alt="image" src="https://github.com/user-attachments/assets/ef729211-05ae-425c-ab6a-14a038f6dc35" />
<img width="424" height="574" alt="image" src="https://github.com/user-attachments/assets/551ccc9b-2850-460c-ada2-cb52fbc5937d" />
<img width="670" height="388" alt="image" src="https://github.com/user-attachments/assets/9a73e64b-ee47-4200-b042-692cd01d9aa9" />
<img width="661" height="344" alt="image" src="https://github.com/user-attachments/assets/fd784d91-7144-4ecb-9399-5c2370b96d4a" />


