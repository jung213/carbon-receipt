// /lib/coin.ts
"use client";

export type CoinState = {
  balance: number;
  lastAwardedMonth?: string;
};

const KEY_STATE = "cr_coin_state";
const KEY_HISTORY = "cr_coin_history";

// 기존: export type CoinTxnType = "redeem" | "invest";
export type CoinTxnType = "redeem" | "invest" | "award";
export type CoinTxn = {
  id: string;          // 트랜잭션 ID
  ts: number;          // epoch ms
  type: CoinTxnType;   // 'redeem' | 'invest'
  title: string;       // 표시용 제목
  amountC: number;     // 사용/투자한 코인 수
  meta?: any;          // 부가 정보(코드, 상품ID 등)
};

export function loadCoinState(defaultBalance = 0): CoinState {
  if (typeof window === "undefined") return { balance: defaultBalance };
  try {
    const raw = localStorage.getItem(KEY_STATE);
    if (!raw) {
      const init = { balance: defaultBalance };
      localStorage.setItem(KEY_STATE, JSON.stringify(init));
      return init;
    }
    return JSON.parse(raw) as CoinState;
  } catch {
    const init = { balance: defaultBalance };
    localStorage.setItem(KEY_STATE, JSON.stringify(init));
    return init;
  }
}

export function saveCoinState(s: CoinState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY_STATE, JSON.stringify(s));
}

export function loadHistory(): CoinTxn[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY_HISTORY);
    return raw ? (JSON.parse(raw) as CoinTxn[]) : [];
  } catch {
    return [];
  }
}

export function saveHistory(h: CoinTxn[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY_HISTORY, JSON.stringify(h));
}

export function pushHistory(txn: CoinTxn) {
  const h = loadHistory();
  h.push(txn);
  saveHistory(h);
  return h;
}

export function genCode(prefix = "CR"): string {
  const body = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `${prefix}-${body}`;
}

// ===== 자동 지급 유틸 =====
export function gToKg(g: number) {
  return Math.max(0, Math.floor(g / 1000));
}
export function coinsFromSavingG(g: number) {
  return gToKg(g) * 1; // 1kg = 1C
}
export function getPrevMonthStr(d = new Date()) {
  const y = d.getFullYear();
  const m = d.getMonth();
  const pm = new Date(y, m - 1, 1);
  return `${pm.getFullYear()}-${String(pm.getMonth() + 1).padStart(2, "0")}`;
}
export function isFirstWeek(d = new Date()) {
  return d.getDate() <= 7;
}

/** 첫째 주에 지난달 절감량(gram)을 코인으로 자동 지급 */
export function maybeAutoAward(prevMonthSavingG: number, now = new Date()): number {
  if (!isFirstWeek(now)) return 0;
  const targetMonth = getPrevMonthStr(now);
  const st = loadCoinState();
  if (st.lastAwardedMonth === targetMonth) return 0;

  const coins = coinsFromSavingG(prevMonthSavingG);
  st.lastAwardedMonth = targetMonth;

  if (coins > 0) {
    st.balance = (st.balance || 0) + coins;
    saveCoinState(st);

    // ⬇️ 자동지급 내역 기록
    pushHistory({
      id: `AWD-${targetMonth}`,
      ts: now.getTime(),
      type: "award",
      title: `자동지급 (${targetMonth})`,
      amountC: coins,
      meta: { month: targetMonth, grams: prevMonthSavingG },
    });
  } else {
    saveCoinState(st);
  }
  return coins;
}

