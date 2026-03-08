const TOKENS_PER_USD = 100

/** Format token count for display: 1500 → "1,500" */
export function formatTokens(tokens: number): string {
  return new Intl.NumberFormat('en-US').format(tokens)
}

/** Convert token count to USD value */
export function tokensToUsd(tokens: number): number {
  return tokens / TOKENS_PER_USD
}

/** Convert USD to token count */
export function usdToTokens(usd: number): number {
  return Math.floor(usd * TOKENS_PER_USD)
}
