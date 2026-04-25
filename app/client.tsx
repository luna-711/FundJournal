'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

function getSupabase(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
const supabase = typeof window !== 'undefined' ? getSupabase() : null as any

type RecordType = 'buy' | 'sell'

interface FundRecord {
  id: string
  username: string
  record_date: string
  type: RecordType
  fund_name: string
  fund_code: string
  amount: number
  pnl: number
  created_at: string
}

interface DayData {
  records: FundRecord[]
  totalPnl: number
  totalBuy: number
}

function fmt(n: number) {
  return '¥' + Math.abs(n).toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}
function fmtPct(n: number) {
  return (n >= 0 ? '+' : '') + n.toFixed(2) + '%'
}
function computeIRR(cashflows: { days: number; amount: number }[]): number | null {
  const hasSell = cashflows.some(c => c.amount > 0)
  if (!hasSell || cashflows.length < 2) return null
  let rate = 0.1
  for (let i = 0; i < 300; i++) {
    let npv = 0, dnpv = 0
    for (const c of cashflows) {
      const t = c.days / 365
      const disc = Math.pow(1 + rate, t)
      npv += c.amount / disc
      dnpv += -t * c.amount / Math.pow(1 + rate, t + 1)
    }
    if (Math.abs(npv) < 0.01) break
    if (Math.abs(dnpv) < 1e-10) break
    rate = rate - npv / dnpv
    if (rate < -0.999) rate = -0.999
    if (rate > 1000) rate = 1000
  }
  return isFinite(rate) ? rate : null
}

// ── Month Picker ───────────────────────────────────────────
function MonthPicker({
  year, month, onChange
}: {
  year: number, month: number, onChange: (y: number, m: number) => void
}) {
  const [open, setOpen] = useState(false)
  const [calYear, setCalYear] = useState(year)
  const ref = useRef<HTMLDivElement>(null)
  const today = new Date()
  const months = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']

  useEffect(() => {
    if (open) setCalYear(year)
  }, [open, year])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: 'var(--card)', border: '1px solid var(--bd)',
          borderRadius: 8, padding: '5px 12px', cursor: 'pointer',
          fontSize: 15, fontWeight: 600, color: 'var(--tx)', fontFamily: 'inherit'
        }}
      >
        {year}年{month + 1}月
        <span style={{ fontSize: 9, color: 'var(--t2)', marginLeft: 2 }}>▼</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)',
          background: 'var(--card)', border: '1px solid var(--bd)',
          borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          padding: '12px', width: 230, zIndex: 200
        }}>
          {/* Year nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <button onClick={() => setCalYear(y => y - 1)} style={{
              background: 'var(--bg)', border: '1px solid var(--bd)', borderRadius: 6,
              width: 28, height: 28, cursor: 'pointer', fontSize: 14, color: 'var(--tx)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>‹</button>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx)' }}>{calYear}年</span>
            <button onClick={() => setCalYear(y => y + 1)} style={{
              background: 'var(--bg)', border: '1px solid var(--bd)', borderRadius: 6,
              width: 28, height: 28, cursor: 'pointer', fontSize: 14, color: 'var(--tx)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>›</button>
          </div>
          {/* Month grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 4 }}>
            {months.map((name, i) => {
              const isSelected = calYear === year && i === month
              const isToday = calYear === today.getFullYear() && i === today.getMonth()
              return (
                <button key={i} onClick={() => { onChange(calYear, i); setOpen(false) }} style={{
                  padding: '7px 0', borderRadius: 7, fontSize: 13, cursor: 'pointer',
                  fontFamily: 'inherit', textAlign: 'center',
                  background: isSelected ? '#1a1a1a' : 'transparent',
                  color: isSelected ? '#fff' : 'var(--tx)',
                  border: isToday && !isSelected ? '1px solid var(--tx)' : '1px solid transparent',
                  fontWeight: isToday ? 600 : 400,
                }}>
                  {name}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Login Screen ──────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (u: string) => void }) {
  const [val, setVal] = useState('')
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--bg)' }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>📒</div>
      <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--tx)', marginBottom: 6 }}>基金日记</h1>
      <p style={{ fontSize: 14, color: 'var(--t2)', marginBottom: 32 }}>记录每一笔卖出，追踪真实收益</p>
      <input
        style={{ width: '100%', maxWidth: 280, padding: '12px 16px', borderRadius: 12, border: '1px solid var(--bd)', background: 'var(--card)', color: 'var(--tx)', fontSize: 16, marginBottom: 12 }}
        placeholder="输入你的用户名"
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && val.trim() && onLogin(val.trim())}
      />
      <button
        style={{ width: '100%', maxWidth: 280, padding: '12px 16px', borderRadius: 12, background: 'var(--ac)', color: '#fff', fontSize: 16, fontWeight: 600, border: 'none', cursor: 'pointer' }}
        onClick={() => val.trim() && onLogin(val.trim())}
      >进入</button>
    </div>
  )
}

// ── Add Record Modal ───────────────────────────────────────
function AddModal({
  date, username, onClose, onSaved
}: {
  date: string, username: string, onClose: () => void, onSaved: () => void
}) {
  const [type, setType] = useState<RecordType>('sell')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [amount, setAmount] = useState('')
  const [pnl, setPnl] = useState('')
  const [saving, setSaving] = useState(false)
  const [looking, setLooking] = useState(false)

  const lookupFund = async (c: string) => {
    if (!c || c.length < 4) return
    setLooking(true)
    try {
      const res = await fetch(`/api/fund?code=${encodeURIComponent(c.trim())}`)
      const json = await res.json()
      if (json?.name) setName(json.name)
    } catch {}
    setLooking(false)
  }

  const save = async () => {
    const val = type === 'buy' ? amount : pnl
    if (!val || isNaN(Number(val))) return
    setSaving(true)
    await supabase.from('fund_records').insert({
      username,
      record_date: date,
      type,
      fund_name: name.trim(),
      fund_code: code.trim(),
      amount: type === 'buy' ? Number(amount) : 0,
      pnl: type === 'sell' ? Number(pnl) : 0,
    })
    setSaving(false)
    onSaved()
  }

  const d = new Date(date + 'T00:00:00')
  const dateStr = `${d.getMonth() + 1}月${d.getDate()}日`

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }} onClick={onClose}>
      <div style={{ background: 'var(--card)', borderRadius: '20px 20px 0 0', padding: '24px 20px', width: '100%', maxWidth: 480, paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--tx)' }}>{dateStr}添加记录</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--t2)', cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {(['buy', 'sell'] as RecordType[]).map(t => (
            <button key={t} onClick={() => setType(t)} style={{
              flex: 1, padding: '10px 0', borderRadius: 10, border: '1.5px solid',
              borderColor: type === t ? (t === 'buy' ? '#378ADD' : '#1D9E75') : 'var(--bd)',
              background: type === t ? (t === 'buy' ? '#E6F1FB' : '#E1F5EE') : 'transparent',
              color: type === t ? (t === 'buy' ? '#0C447C' : '#085041') : 'var(--t2)',
              fontWeight: 600, fontSize: 15, cursor: 'pointer'
            }}>{t === 'buy' ? '买入' : '卖出'}</button>
          ))}
        </div>

        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 4 }}>基金代码</div>
          <input
            style={inputStyle}
            placeholder="输入代码自动带出名称，如 510300"
            value={code}
            onChange={e => { setCode(e.target.value); setName('') }}
            onBlur={e => lookupFund(e.target.value.trim())}
          />
        </div>
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 4 }}>
            基金名称 {looking && <span style={{ color: 'var(--ac)' }}>查询中...</span>}
          </div>
          <input style={inputStyle} placeholder="自动填入，也可手动输入" value={name} onChange={e => setName(e.target.value)} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 4 }}>{type === 'buy' ? '买入金额（元）' : '盈亏金额（元）'}</div>
          <input style={inputStyle} type="number" placeholder={type === 'buy' ? '0' : '亏损填负数'} value={type === 'buy' ? amount : pnl} onChange={e => type === 'buy' ? setAmount(e.target.value) : setPnl(e.target.value)} />
        </div>

        <button onClick={save} disabled={saving || !(type === 'buy' ? amount : pnl)} style={{
          width: '100%', padding: '13px 0', borderRadius: 12, background: saving || !(type === 'buy' ? amount : pnl) ? 'var(--bd)' : 'var(--ac)',
          color: '#fff', fontSize: 16, fontWeight: 600, border: 'none', cursor: saving || !(type === 'buy' ? amount : pnl) ? 'default' : 'pointer'
        }}>{saving ? '保存中...' : '保存'}</button>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--bd)',
  background: 'var(--bg)', color: 'var(--tx)', fontSize: 15, boxSizing: 'border-box'
}

// ── Day Detail Panel ───────────────────────────────────────
function DayPanel({
  date, records, username, onClose, onRefresh
}: {
  date: string, records: FundRecord[], username: string, onClose: () => void, onRefresh: () => void
}) {
  const [showAdd, setShowAdd] = useState(false)
  const d = new Date(date + 'T00:00:00')
  const dateStr = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
  const sells = records.filter(r => r.type === 'sell')
  const totalPnl = sells.reduce((s, r) => s + r.pnl, 0)
  const totalInvest = sells.reduce((s, r) => s + r.amount, 0)

  const del = async (id: string) => {
    await supabase.from('fund_records').delete().eq('id', id)
    onRefresh()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50 }} onClick={onClose}>
      <div style={{ background: 'var(--card)', borderRadius: '20px 20px 0 0', padding: '24px 20px', width: '100%', maxWidth: 480, maxHeight: '80dvh', overflowY: 'auto', paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--tx)' }}>{dateStr}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--t2)', cursor: 'pointer' }}>×</button>
        </div>

        {sells.length > 0 && (
          <div style={{ background: 'var(--bg)', borderRadius: 12, padding: '12px 14px', marginBottom: 12, display: 'flex', gap: 16 }}>
            <div><div style={{ fontSize: 11, color: 'var(--t2)' }}>卖出本金</div><div style={{ fontSize: 15, fontWeight: 600, color: 'var(--tx)' }}>{fmt(totalInvest)}</div></div>
            <div><div style={{ fontSize: 11, color: 'var(--t2)' }}>总盈亏</div><div style={{ fontSize: 15, fontWeight: 600, color: totalPnl >= 0 ? '#1D9E75' : '#E24B4A' }}>{totalPnl >= 0 ? '+' : ''}{fmt(totalPnl)}</div></div>
            {totalInvest > 0 && <div><div style={{ fontSize: 11, color: 'var(--t2)' }}>收益率</div><div style={{ fontSize: 15, fontWeight: 600, color: totalPnl >= 0 ? '#1D9E75' : '#E24B4A' }}>{fmtPct(totalPnl / totalInvest * 100)}</div></div>}
          </div>
        )}

        {records.length === 0 && <div style={{ textAlign: 'center', color: 'var(--t2)', fontSize: 14, padding: '20px 0' }}>暂无记录</div>}

        {records.map(r => (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '0.5px solid var(--bd)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 20,
                background: r.type === 'buy' ? '#E6F1FB' : '#E1F5EE',
                color: r.type === 'buy' ? '#0C447C' : '#085041'
              }}>{r.type === 'buy' ? '买入' : '卖出'}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--tx)' }}>{r.fund_name || '未命名'}</div>
                {r.fund_code && <div style={{ fontSize: 12, color: 'var(--t2)' }}>{r.fund_code}</div>}
              </div>
            </div>
            <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--tx)' }}>{fmt(r.amount)}</div>
                {r.type === 'sell' && <div style={{ fontSize: 12, color: r.pnl >= 0 ? '#1D9E75' : '#E24B4A' }}>{r.pnl >= 0 ? '+' : ''}{fmt(r.pnl)}</div>}
              </div>
              <button onClick={() => del(r.id)} style={{ background: 'none', border: 'none', color: '#E24B4A', fontSize: 12, cursor: 'pointer', padding: '4px 6px' }}>删除</button>
            </div>
          </div>
        ))}

        <button onClick={() => setShowAdd(true)} style={{ width: '100%', marginTop: 16, padding: '12px 0', borderRadius: 12, border: '1px dashed var(--bd)', background: 'transparent', color: 'var(--t2)', fontSize: 14, cursor: 'pointer' }}>+ 添加记录</button>
      </div>
      {showAdd && <AddModal date={date} username={username} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); onRefresh() }} />}
    </div>
  )
}

// ── Stats Screen ───────────────────────────────────────────
type StatsMode = 'month' | 'year' | 'all'

function StatsScreen({ records, year, month, mode, setMode }: {
  records: FundRecord[], year: number, month: number, mode: StatsMode, setMode: (m: StatsMode) => void
}) {

  const filtered = mode === 'all'
    ? records
    : mode === 'year'
    ? records.filter(r => new Date(r.record_date).getFullYear() === year)
    : records.filter(r => { const d = new Date(r.record_date); return d.getFullYear() === year && d.getMonth() === month })

  const sells = filtered.filter(r => r.type === 'sell')
  const totalPnl = sells.reduce((s, r) => s + r.pnl, 0)
  const totalInvest = sells.reduce((s, r) => s + r.amount, 0)
  const totalReturn = totalInvest > 0 ? totalPnl / totalInvest * 100 : 0

  // 按基金统计，用全部买入记录找最早买入日期算年化
  const allBuys = records.filter(r => r.type === 'buy')
  const byFund: Record<string, { name: string, code: string, invest: number, pnl: number, earliestBuy: Date | null, latestSell: Date | null }> = {}
  sells.forEach(r => {
    const key = r.fund_code || r.fund_name || '未知'
    if (!byFund[key]) byFund[key] = { name: r.fund_name, code: r.fund_code, invest: 0, pnl: 0, earliestBuy: null, latestSell: null }
    byFund[key].invest += r.amount
    byFund[key].pnl += r.pnl
    const sellDate = new Date(r.record_date)
    if (!byFund[key].latestSell || sellDate > byFund[key].latestSell!) byFund[key].latestSell = sellDate
  })
  // 找每个基金最早买入日期（从全部记录里找，不限于filtered）
  allBuys.forEach(r => {
    const key = r.fund_code || r.fund_name || '未知'
    if (!byFund[key]) return // 只关心有卖出的基金
    const buyDate = new Date(r.record_date)
    if (!byFund[key].earliestBuy || buyDate < byFund[key].earliestBuy!) byFund[key].earliestBuy = buyDate
  })

  // 总体年化：用所有卖出里最早买入日 → 最晚卖出日
  let overallAnnualized: number | null = null
  if (totalInvest > 0) {
    const allSellDates = sells.map(r => new Date(r.record_date))
    const latestSell = allSellDates.length ? new Date(Math.max(...allSellDates.map(d => d.getTime()))) : null
    // 找这些卖出基金的最早买入
    const relevantKeys = new Set(sells.map(r => r.fund_code || r.fund_name || '未知'))
    const relevantBuys = allBuys.filter(r => relevantKeys.has(r.fund_code || r.fund_name || '未知'))
    const earliestBuy = relevantBuys.length
      ? new Date(Math.min(...relevantBuys.map(r => new Date(r.record_date).getTime())))
      : null
    if (earliestBuy && latestSell) {
      const days = Math.round((latestSell.getTime() - earliestBuy.getTime()) / 86400000)
      if (days > 0) overallAnnualized = (totalPnl / totalInvest) / days * 365 * 100
    }
  }

  const modes: { key: StatsMode, label: string }[] = [
    { key: 'month', label: '本月' },
    { key: 'year', label: '本年' },
    { key: 'all', label: '全部' },
  ]

  return (
    <div style={{ padding: '0 0 2rem' }}>
      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {modes.map(m => (
          <button key={m.key} onClick={() => setMode(m.key)} style={{
            flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: mode === m.key ? 'var(--tx)' : 'var(--card)',
            color: mode === m.key ? '#fff' : 'var(--t2)',
            fontWeight: 600, fontSize: 13, fontFamily: 'inherit'
          }}>{m.label}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
        <StatCard label="卖出本金" value={fmt(totalInvest)} />
        <StatCard label="总盈亏" value={(totalPnl >= 0 ? '+' : '') + fmt(totalPnl)} color={totalPnl > 0 ? '#1D9E75' : totalPnl < 0 ? '#E24B4A' : undefined} />
        <StatCard
          label={overallAnnualized !== null ? '年化收益率' : '简单收益率'}
          value={overallAnnualized !== null ? fmtPct(overallAnnualized) : totalInvest > 0 ? fmtPct(totalReturn) : '—'}
          color={totalPnl > 0 ? '#1D9E75' : totalPnl < 0 ? '#E24B4A' : undefined}
        />
      </div>

      {Object.keys(byFund).length > 0 && (
        <>
          <div style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 10 }}>按基金统计</div>
          {Object.values(byFund).sort((a, b) => b.pnl - a.pnl).map((f, i) => {
            // 每个基金的年化
            let annualized: number | null = null
            if (f.earliestBuy && f.latestSell && f.invest > 0) {
              const days = Math.round((f.latestSell.getTime() - f.earliestBuy.getTime()) / 86400000)
              if (days > 0) annualized = (f.pnl / f.invest) / days * 365 * 100
            }
            const pctLabel = annualized !== null ? fmtPct(annualized) + '/年' : fmtPct(f.invest > 0 ? f.pnl / f.invest * 100 : 0)
            return (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '0.5px solid var(--bd)' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--tx)' }}>{f.name || '未命名'}</div>
                  {f.code && <div style={{ fontSize: 12, color: 'var(--t2)' }}>{f.code}</div>}
                  {f.earliestBuy && <div style={{ fontSize: 11, color: 'var(--t2)' }}>
                    买入 {f.earliestBuy.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                    {f.latestSell && ` → 卖出 ${f.latestSell.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}`}
                  </div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, color: f.pnl >= 0 ? '#1D9E75' : '#E24B4A', fontWeight: 500 }}>{f.pnl >= 0 ? '+' : ''}{fmt(f.pnl)}</div>
                  <div style={{ fontSize: 12, color: f.pnl >= 0 ? '#1D9E75' : '#E24B4A' }}>{pctLabel}</div>
                  <div style={{ fontSize: 11, color: 'var(--t2)' }}>本金 {fmt(f.invest)}</div>
                </div>
              </div>
            )
          })}
        </>
      )}

      {sells.length === 0 && <div style={{ textAlign: 'center', color: 'var(--t2)', fontSize: 14, padding: '40px 0' }}>暂无卖出记录</div>}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string, value: string, color?: string }) {
  return (
    <div style={{ background: 'var(--bg)', borderRadius: 12, padding: '12px 10px' }}>
      <div style={{ fontSize: 11, color: 'var(--t2)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: color || 'var(--tx)' }}>{value}</div>
    </div>
  )
}

// ── Calendar Screen ────────────────────────────────────────
function CalendarScreen({ records, year, month, username, onRefresh }: {
  records: FundRecord[], year: number, month: number, username: string, onRefresh: () => void
}) {
  const [selDay, setSelDay] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  const dayMap: Record<string, DayData> = {}
  records.forEach(r => {
    const d = new Date(r.record_date)
    if (d.getFullYear() !== year || d.getMonth() !== month) return
    const k = r.record_date
    if (!dayMap[k]) dayMap[k] = { records: [], totalPnl: 0, totalBuy: 0 }
    dayMap[k].records.push(r)
    if (r.type === 'sell') dayMap[k].totalPnl += r.pnl
    if (r.type === 'buy') dayMap[k].totalBuy += r.amount
  })

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()
  const weeks = ['日', '一', '二', '三', '四', '五', '六']

  return (
    <div style={{ paddingTop: 8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3, marginBottom: 6 }}>
        {weeks.map(w => <div key={w} style={{ textAlign: 'center', fontSize: 12, color: 'var(--t2)', padding: '4px 0' }}>{w}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
        {Array(firstDay).fill(null).map((_, i) => <div key={'e' + i} />)}
        {Array(daysInMonth).fill(null).map((_, i) => {
          const d = i + 1
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
          const data = dayMap[dateStr]
          const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d
          const hasSell = data?.records.some(r => r.type === 'sell')
          return (
            <div key={d} onClick={() => setSelDay(dateStr)} style={{
              minHeight: 62, borderRadius: 10, border: `1.5px solid ${isToday ? 'var(--ac)' : data ? 'var(--bd)' : 'transparent'}`,
              background: data ? 'var(--card)' : 'transparent',
              padding: '5px 6px', cursor: 'pointer'
            }}>
              <div style={{ fontSize: 12, color: isToday ? 'var(--ac)' : 'var(--t2)', fontWeight: isToday ? 700 : 400, marginBottom: 2 }}>{d}</div>
              {hasSell && <div style={{ fontSize: 11, fontWeight: 600, color: data.totalPnl >= 0 ? '#1D9E75' : '#E24B4A', lineHeight: 1.3 }}>
                {data.totalPnl >= 0 ? '+' : ''}{Math.round(data.totalPnl)}
              </div>}
            </div>
          )
        })}
      </div>

      {selDay && (
        <DayPanel
          date={selDay}
          records={dayMap[selDay]?.records || []}
          username={username}
          onClose={() => setSelDay(null)}
          onRefresh={() => onRefresh()}
        />
      )}
    </div>
  )
}

// ── Main App ───────────────────────────────────────────────
export default function App() {
  const [username, setUsername] = useState<string | null>(null)
  const [records, setRecords] = useState<FundRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'cal' | 'stats'>('cal')
  const [curYear, setCurYear] = useState(new Date().getFullYear())
  const [curMonth, setCurMonth] = useState(new Date().getMonth())
  const [statsMode, setStatsMode] = useState<StatsMode>('month')

  useEffect(() => {
    const u = localStorage.getItem('fj_username')
    if (u) setUsername(u)
  }, [])

  const load = useCallback(async (u: string) => {
    setLoading(true)
    const { data } = await supabase.from('fund_records').select('*').eq('username', u).order('record_date', { ascending: false })
    setRecords(data || [])
    setLoading(false)
  }, [])

  const login = (u: string) => {
    localStorage.setItem('fj_username', u)
    setUsername(u)
    load(u)
  }

  useEffect(() => { if (username) load(username) }, [username, load])

  if (!username) return <LoginScreen onLogin={login} />

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100dvh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Header: avatar left, month picker right */}
      <div style={{ padding: '14px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => { localStorage.removeItem('fj_username'); setUsername(null) }} style={{
          width: 36, height: 36, borderRadius: '50%', background: 'var(--ac)', border: 'none',
          color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit'
        }}>
          {username.slice(0, 1).toUpperCase()}
        </button>

        {(tab === 'cal' || statsMode === 'month') && (
          <MonthPicker
            year={curYear}
            month={curMonth}
            onChange={(y, m) => { setCurYear(y); setCurMonth(m) }}
          />
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '0 20px', overflowY: 'auto', paddingTop: 10 }}>
        {loading ? <div style={{ textAlign: 'center', color: 'var(--t2)', padding: '40px 0', fontSize: 14 }}>加载中...</div>
          : tab === 'cal'
          ? <CalendarScreen records={records} year={curYear} month={curMonth} username={username} onRefresh={() => load(username)} />
          : <StatsScreen records={records} year={curYear} month={curMonth} mode={statsMode} setMode={setStatsMode} />
        }
      </div>

      {/* Bottom tab bar */}
      <div style={{
        display: 'flex', borderTop: '0.5px solid var(--bd)', background: 'var(--card)',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}>
        {(['cal', 'stats'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '14px 0', border: 'none', background: 'transparent', cursor: 'pointer',
            color: tab === t ? 'var(--ac)' : 'var(--t2)', fontWeight: tab === t ? 700 : 400,
            fontSize: 14, fontFamily: 'inherit'
          }}>
            {t === 'cal' ? '日历' : '统计'}
          </button>
        ))}
      </div>
    </div>
  )
}
