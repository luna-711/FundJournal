import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code') || ''
  if (!code) return NextResponse.json({ name: '' })

  const upper = code.toUpperCase().trim()

  // ── 6位数字：A股基金或指数 ──────────────────────────────
  if (/^\d{6}$/.test(code)) {
    // 先查天天基金（覆盖基金和指数）
    try {
      const res = await fetch(
        `https://fundsuggest.eastmoney.com/FundSearch/api/FundSearchAPI.ashx?m=1&key=${code}`,
        { headers: { Referer: 'https://fund.eastmoney.com/' } }
      )
      const json = await res.json()
      const item = json?.Datas?.find((d: any) => d.CODE === code)
      if (item) return NextResponse.json({ name: item.NAME })
    } catch {}

    // 天天查不到，尝试 Yahoo Finance A股指数
    const suffix = code.startsWith('0') ? '.SS' : '.SZ'
    try {
      const res = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${code}${suffix}?interval=1d&range=1d`,
        { headers: { 'User-Agent': 'Mozilla/5.0' } }
      )
      const json = await res.json()
      const meta = json?.chart?.result?.[0]?.meta
      if (meta?.longName || meta?.shortName) {
        return NextResponse.json({ name: meta.longName || meta.shortName })
      }
    } catch {}

    return NextResponse.json({ name: '' })
  }

  // ── 字母/混合：美股、港股、全球指数 ────────────────────
  const knownIndices = [
    'SPX','SPY','NDX','QQQ','DJI','VIX','RUT',
    'HSTECH','HSI','HSCEI',
    'N225','FTSE','DAX','CAC','STI','KOSPI','TWII',
    'NKY','UKX','SHCOMP','SZCOMP'
  ]

  let yahooCode = upper
  if (knownIndices.includes(upper)) {
    yahooCode = '^' + upper
  } else if (/\.(HK|SS|SZ|T|L)$/i.test(upper)) {
    // 已有交易所后缀
  } else if (/^\d{4,5}$/.test(code)) {
    yahooCode = code.padStart(4, '0') + '.HK'
  }

  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooCode)}?interval=1d&range=1d`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    )
    const json = await res.json()
    const meta = json?.chart?.result?.[0]?.meta
    if (meta?.longName || meta?.shortName) {
      return NextResponse.json({ name: meta.longName || meta.shortName })
    }
  } catch {}

  return NextResponse.json({ name: '' })
}
