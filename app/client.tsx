'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

const getDB = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type RecordType = 'buy' | 'sell'
type StatsMode = 'month' | 'year' | 'all'

interface FundRecord {
  id: string
  username: string
  record_date: string
  type: RecordType
  fund_name: string
  fund_code: string
  amount: number
  pnl: number
  cost: number
  created_at: string
}

const fmt = (n: number) => '¥' + Math.abs(n).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtPct = (n: number) => (n >= 0 ? '+' : '') + n.toFixed(2) + '%'
const pnlColor = (n: number) => n >= 0 ? '#E24B4A' : '#1D9E75'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 10,
  border: '1px solid var(--bd)', background: 'var(--bg)',
  color: 'var(--tx)', fontSize: 15, boxSizing: 'border-box', fontFamily: 'inherit'
}

function prevMonth(y: number, m: number) { return m === 0 ? [y-1, 11] : [y, m-1] }
function nextMonth(y: number, m: number) { return m === 11 ? [y+1, 0] : [y, m+1] }

// ── Month Picker ──────────────────────────────────────────
function MonthPicker({ year, month, onChange }: {
  year: number, month: number, onChange: (y: number, m: number) => void
}) {
  const [open, setOpen] = useState(false)
  const [calYear, setCalYear] = useState(year)
  const ref = useRef<HTMLDivElement>(null)
  const months = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']

  useEffect(() => { if (open) setCalYear(year) }, [open, year])
  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    if (open) document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', gap: 4,
        background: 'var(--card)', border: '1px solid var(--bd)',
        borderRadius: 8, padding: '5px 12px', cursor: 'pointer',
        fontSize: 15, fontWeight: 600, color: 'var(--tx)', fontFamily: 'inherit'
      }}>
        {year}年{month + 1}月
        <span style={{ fontSize: 9, color: 'var(--t2)', marginLeft: 2 }}>▼</span>
      </button>
      {open && (
        <div style={{
          position: 'fixed', top: 60, right: 16,
          background: 'var(--card)', border: '1px solid var(--bd)',
          borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          padding: '12px', width: 220, zIndex: 300
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <button onClick={() => setCalYear(y => y - 1)} style={{ background: 'var(--bg)', border: '1px solid var(--bd)', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', fontSize: 14, color: 'var(--tx)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&#8249;</button>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx)' }}>{calYear}年</span>
            <button onClick={() => setCalYear(y => y + 1)} style={{ background: 'var(--bg)', border: '1px solid var(--bd)', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', fontSize: 14, color: 'var(--tx)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&#8250;</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 4 }}>
            {months.map((name, i) => {
              const isSel = calYear === year && i === month
              return (
                <button key={i} onClick={() => { onChange(calYear, i); setOpen(false) }} style={{
                  padding: '7px 0', borderRadius: 7, fontSize: 13, cursor: 'pointer',
                  fontFamily: 'inherit', textAlign: 'center',
                  background: isSel ? '#1a1a1a' : 'transparent',
                  color: isSel ? '#fff' : 'var(--tx)',
                  border: '1px solid transparent', fontWeight: isSel ? 600 : 400,
                }}>{name}</button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Year Picker ───────────────────────────────────────────
function YearPicker({ year, onChange }: { year: number, onChange: (y: number) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 2 + i)

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    if (open) document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', gap: 4,
        background: 'var(--card)', border: '1px solid var(--bd)',
        borderRadius: 8, padding: '5px 12px', cursor: 'pointer',
        fontSize: 15, fontWeight: 600, color: 'var(--tx)', fontFamily: 'inherit'
      }}>
        {year}年
        <span style={{ fontSize: 9, color: 'var(--t2)', marginLeft: 2 }}>▼</span>
      </button>
      {open && (
        <div style={{
          position: 'fixed', top: 60, right: 16,
          background: 'var(--card)', border: '1px solid var(--bd)',
          borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          padding: '8px', width: 140, zIndex: 300
        }}>
          {years.map(y => (
            <button key={y} onClick={() => { onChange(y); setOpen(false) }} style={{
              width: '100%', padding: '8px 0', borderRadius: 7, fontSize: 14, cursor: 'pointer',
              fontFamily: 'inherit', textAlign: 'center',
              background: y === year ? '#1a1a1a' : 'transparent',
              color: y === year ? '#fff' : 'var(--tx)',
              border: 'none', fontWeight: y === year ? 600 : 400,
            }}>{y}年</button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Login ─────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (u: string) => void }) {
  const [val, setVal] = useState('')
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--bg)' }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>📒</div>
      <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--tx)', marginBottom: 6 }}>基金日记</h1>
      <p style={{ fontSize: 14, color: 'var(--t2)', marginBottom: 32 }}>记录每一笔卖出，追踪真实收益</p>
      <input style={{ width: '100%', maxWidth: 280, padding: '12px 16px', borderRadius: 12, border: '1px solid var(--bd)', background: 'var(--card)', color: 'var(--tx)', fontSize: 16, marginBottom: 12, fontFamily: 'inherit' }}
        placeholder="输入你的用户名" value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && val.trim() && onLogin(val.trim())}
      />
      <button style={{ width: '100%', maxWidth: 280, padding: '12px 16px', borderRadius: 12, background: '#333', color: '#fff', fontSize: 16, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
        onClick={() => val.trim() && onLogin(val.trim())}>进入</button>
    </div>
  )
}

// ── Add Modal ─────────────────────────────────────────────
function AddModal({ date, username, onClose, onSaved }: {
  date: string, username: string, onClose: () => void, onSaved: () => void
}) {
  const [type, setType] = useState<RecordType>('sell')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [amount, setAmount] = useState('')
  const [pnl, setPnl] = useState('')
  const [cost, setCost] = useState('')
  const [saving, setSaving] = useState(false)
  const [looking, setLooking] = useState(false)

  const lookup = async (c: string) => {
    if (!c || c.length < 4) return
    setLooking(true)
    try {
      const res = await fetch('/api/fund?code=' + encodeURIComponent(c.trim()))
      const json = await res.json()
      if (json?.name) setName(json.name)
    } catch {}
    setLooking(false)
  }

  const canSave = type === 'buy'
    ? (!!amount && !isNaN(Number(amount)))
    : (!!pnl && !isNaN(Number(pnl)))

  const save = async () => {
    if (!canSave) return
    setSaving(true)
    await getDB().from('fund_records').insert({
      username, record_date: date, type,
      fund_name: name.trim(), fund_code: code.trim(),
      amount: type === 'buy' ? Number(amount) : 0,
      pnl: type === 'sell' ? Number(pnl) : 0,
      cost: type === 'sell' ? Number(cost) : 0,
    })
    setSaving(false)
    onSaved()
  }

  const d = new Date(date + 'T00:00:00')
  const dateStr = (d.getMonth() + 1) + '月' + d.getDate() + '日'

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
              flex: 1, padding: '10px 0', borderRadius: 10, border: '1px solid var(--bd)',
              background: type === t ? '#EBEBEB' : 'transparent',
              color: type === t ? 'var(--tx)' : 'var(--t2)',
              fontWeight: type === t ? 600 : 400, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit'
            }}>{t === 'buy' ? '买入' : '卖出'}</button>
          ))}
        </div>
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 4 }}>基金代码</div>
          <input style={inputStyle} placeholder="输入代码自动带出名称，如 510300"
            value={code} onChange={e => { setCode(e.target.value); setName('') }}
            onBlur={e => lookup(e.target.value.trim())} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 4 }}>
            基金名称{looking ? ' 查询中...' : ''}
          </div>
          <input style={inputStyle} placeholder="自动填入，也可手动输入" value={name} onChange={e => setName(e.target.value)} />
        </div>
        {type === 'buy' && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 4 }}>买入金额（元）</div>
            <input style={inputStyle} type="number" placeholder="0"
              value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
        )}
        {type === 'sell' && (
          <>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 4 }}>本次本金（元）<span style={{ color: '#bbb', fontWeight: 400 }}>（部分卖出时填，全部卖出可不填）</span></div>
              <input style={inputStyle} type="number" placeholder="不填则视为全部卖出"
                value={cost} onChange={e => setCost(e.target.value)} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 4 }}>盈亏金额（元）</div>
              <input style={inputStyle} type="number" placeholder="亏损填负数"
                value={pnl} onChange={e => setPnl(e.target.value)} />
            </div>
          </>
        )}
        <button onClick={save} disabled={!canSave || saving} style={{
          width: '100%', padding: '13px 0', borderRadius: 12,
          background: canSave && !saving ? '#333' : 'transparent',
          color: canSave && !saving ? '#fff' : 'var(--t2)',
          border: canSave && !saving ? 'none' : '1px solid var(--bd)',
          fontSize: 16, fontWeight: 600, cursor: canSave && !saving ? 'pointer' : 'default', fontFamily: 'inherit'
        }}>{saving ? '保存中...' : '保存'}</button>
      </div>
    </div>
  )
}

// ── Edit Modal ────────────────────────────────────────────
function EditModal({ record, onClose, onSaved }: {
  record: FundRecord, onClose: () => void, onSaved: () => void
}) {
  const [name, setName] = useState(record.fund_name)
  const [code, setCode] = useState(record.fund_code)
  const [amount, setAmount] = useState(record.type === 'buy' ? String(record.amount) : String(record.pnl))
  const [cost, setCost] = useState(record.type === 'sell' ? String(record.cost || 0) : '')
  const [saving, setSaving] = useState(false)
  const [looking, setLooking] = useState(false)

  const lookup = async (c: string) => {
    if (!c || c.length < 4) return
    setLooking(true)
    try {
      const res = await fetch('/api/fund?code=' + encodeURIComponent(c.trim()))
      const json = await res.json()
      if (json?.name) setName(json.name)
    } catch {}
    setLooking(false)
  }

  const canSave = !!amount && !isNaN(Number(amount))

  const save = async () => {
    if (!canSave) return
    setSaving(true)
    await getDB().from('fund_records').update({
      fund_name: name.trim(), fund_code: code.trim(),
      amount: record.type === 'buy' ? Number(amount) : 0,
      pnl: record.type === 'sell' ? Number(amount) : 0,
      cost: record.type === 'sell' ? Number(cost) : 0,
    }).eq('id', record.id)
    setSaving(false)
    onSaved()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 150 }} onClick={onClose}>
      <div style={{ background: 'var(--card)', borderRadius: '20px 20px 0 0', padding: '24px 20px', width: '100%', maxWidth: 480, paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--tx)' }}>编辑记录</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--t2)', cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 4 }}>基金代码</div>
          <input style={inputStyle} value={code}
            onChange={e => { setCode(e.target.value); setName('') }}
            onBlur={e => lookup(e.target.value.trim())} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 4 }}>基金名称{looking ? ' 查询中...' : ''}</div>
          <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} />
        </div>
        {record.type === 'sell' && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 4 }}>本次本金（元）<span style={{ color: '#bbb', fontWeight: 400 }}>（部分卖出时填）</span></div>
            <input style={inputStyle} type="number" placeholder="不填则视为全部卖出" value={cost} onChange={e => setCost(e.target.value)} />
          </div>
        )}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 4 }}>{record.type === 'buy' ? '买入金额（元）' : '盈亏金额（元）'}</div>
          <input style={inputStyle} type="number" value={amount} onChange={e => setAmount(e.target.value)} />
        </div>
        <button onClick={save} disabled={!canSave || saving} style={{
          width: '100%', padding: '13px 0', borderRadius: 12,
          background: canSave && !saving ? '#333' : 'transparent',
          color: canSave && !saving ? '#fff' : 'var(--t2)',
          border: canSave && !saving ? 'none' : '1px solid var(--bd)',
          fontSize: 16, fontWeight: 600, cursor: canSave && !saving ? 'pointer' : 'default', fontFamily: 'inherit'
        }}>{saving ? '保存中...' : '保存'}</button>
      </div>
    </div>
  )
}

// ── Day Panel ─────────────────────────────────────────────
function DayPanel({ date, records, username, onClose, onRefresh }: {
  date: string, records: FundRecord[], username: string, onClose: () => void, onRefresh: () => void
}) {
  const [showAdd, setShowAdd] = useState(false)
  const [editRecord, setEditRecord] = useState<FundRecord | null>(null)
  const d = new Date(date + 'T00:00:00')
  const dateStr = d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日'
  const sells = records.filter(r => r.type === 'sell')
  const totalPnl = sells.reduce((s, r) => s + r.pnl, 0)

  const del = async (id: string) => {
    await getDB().from('fund_records').delete().eq('id', id)
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
          <div style={{ background: 'var(--bg)', borderRadius: 12, padding: '12px 14px', marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--t2)' }}>总盈亏</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: pnlColor(totalPnl) }}>{totalPnl >= 0 ? '+' : ''}{fmt(totalPnl)}</div>
          </div>
        )}
        {records.length === 0 && <div style={{ textAlign: 'center', color: 'var(--t2)', fontSize: 14, padding: '20px 0' }}>暂无记录</div>}
        {records.map(r => (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '0.5px solid var(--bd)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: r.type === 'buy' ? '#E8E8E8' : '#FDEAEA', color: r.type === 'buy' ? '#666' : '#C0392B', flexShrink: 0 }}>{r.type === 'buy' ? '买入' : '卖出'}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--tx)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.fund_name || '未命名'}</div>
                {r.fund_code && <div style={{ fontSize: 12, color: 'var(--t2)' }}>{r.fund_code}</div>}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <div style={{ textAlign: 'right' }}>
                {r.type === 'buy' && <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--tx)' }}>{fmt(r.amount)}</div>}
                {r.type === 'sell' && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: pnlColor(r.pnl) }}>{r.pnl >= 0 ? '+' : ''}{fmt(r.pnl)}</div>
                    {r.cost > 0 && <div style={{ fontSize: 11, color: 'var(--t2)' }}>本金 {fmt(r.cost)}</div>}
                  </div>
                )}
              </div>
              <button onClick={() => setEditRecord(r)} style={{ background: '#F5F5F5', border: '1px solid #DDD', color: '#555', fontSize: 12, cursor: 'pointer', padding: '4px 8px', borderRadius: 6, fontFamily: 'inherit', flexShrink: 0 }}>编辑</button>
              <button onClick={() => del(r.id)} style={{ background: '#FFF0F0', border: '1px solid #FFCCCC', color: '#E24B4A', fontSize: 12, cursor: 'pointer', padding: '4px 8px', borderRadius: 6, fontFamily: 'inherit', flexShrink: 0 }}>删除</button>
            </div>
          </div>
        ))}
        <button onClick={() => setShowAdd(true)} style={{ width: '100%', marginTop: 16, padding: '12px 0', borderRadius: 12, border: '1px dashed var(--bd)', background: 'transparent', color: 'var(--t2)', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>+ 添加记录</button>
      </div>
      {showAdd && <AddModal date={date} username={username} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); onRefresh() }} />}
      {editRecord && <EditModal record={editRecord} onClose={() => setEditRecord(null)} onSaved={() => { setEditRecord(null); onRefresh() }} />}
    </div>
  )
}

// ── Stats ─────────────────────────────────────────────────
function StatsScreen({ records, year, month, mode, setMode, statsYear, setStatsYear, onSwipe }: {
  records: FundRecord[], year: number, month: number,
  mode: StatsMode, setMode: (m: StatsMode) => void,
  statsYear: number, setStatsYear: (y: number) => void,
  onSwipe: (dir: 'left' | 'right') => void
}) {
  const touchRef = useRef<{ x: number, y: number } | null>(null)

  const filtered = mode === 'all' ? records
    : mode === 'year' ? records.filter(r => new Date(r.record_date).getFullYear() === statsYear)
    : records.filter(r => { const d = new Date(r.record_date); return d.getFullYear() === year && d.getMonth() === month })

  const sells = filtered.filter(r => r.type === 'sell')
  // allBuys用全部记录（找最早买入日期用），filteredBuys用于统计本金
  const allBuys = records.filter(r => r.type === 'buy')
  const filteredBuys = filtered.filter(r => r.type === 'buy')
  const totalPnl = sells.reduce((s, r) => s + r.pnl, 0)

  const byFund: Record<string, { name: string, code: string, invest: number, pnl: number, earliestBuy: Date | null, latestSell: Date | null }> = {}
  sells.forEach(r => {
    const key = r.fund_code || r.fund_name || '未知'
    if (!byFund[key]) byFund[key] = { name: r.fund_name, code: r.fund_code, invest: 0, pnl: 0, earliestBuy: null, latestSell: null }
    byFund[key].pnl += r.pnl
    const sd = new Date(r.record_date)
    if (!byFund[key].latestSell || sd > byFund[key].latestSell!) byFund[key].latestSell = sd
  })
  // 本金计算逻辑：
  // 有填cost → 部分卖出，用cost
  // 没填cost → 全部卖出，本金 = 上次卖出之后到本次卖出之前的所有买入之和
  // 按基金分别处理，按时间顺序模拟持仓
  const fundKeys = new Set(sells.map(r => r.fund_code || r.fund_name || '未知'))
  fundKeys.forEach(key => {
    // 该基金全部历史卖出（用于确定"上次卖出"时间点）
    const allFundSells = records
      .filter(r => r.type === 'sell' && (r.fund_code || r.fund_name || '未知') === key)
      .sort((a, b) => a.record_date.localeCompare(b.record_date))
    // 该基金全部历史买入
    const allFundBuys = records
      .filter(r => r.type === 'buy' && (r.fund_code || r.fund_name || '未知') === key)
      .sort((a, b) => a.record_date.localeCompare(b.record_date))
    // 当前筛选范围内的卖出
    const filteredSellsForFund = sells
      .filter(r => (r.fund_code || r.fund_name || '未知') === key)
      .sort((a, b) => a.record_date.localeCompare(b.record_date))

    let totalCostForFund = 0
    filteredSellsForFund.forEach(sellRecord => {
      if (sellRecord.cost && sellRecord.cost > 0) {
        // 部分卖出：直接用填写的本金
        totalCostForFund += sellRecord.cost
      } else {
        // 全部卖出：找上次卖出（含历史）之后、本次卖出之前的所有买入
        const prevSell = allFundSells.filter(s => s.record_date < sellRecord.record_date).pop()
        const fromDate = prevSell ? prevSell.record_date : '0000-00-00'
        const buysInPeriod = allFundBuys.filter(b => b.record_date > fromDate && b.record_date <= sellRecord.record_date)
        totalCostForFund += buysInPeriod.reduce((s, b) => s + b.amount, 0)
      }
    })
    byFund[key].invest = totalCostForFund
  })
  // 最早买入日：找上次「全部卖出」（没填cost）之后的第一笔买入
  fundKeys.forEach(key => {
    const allFundSells = records
      .filter(r => r.type === 'sell' && (r.fund_code || r.fund_name || '未知') === key)
      .sort((a, b) => a.record_date.localeCompare(b.record_date))
    const allFundBuys = records
      .filter(r => r.type === 'buy' && (r.fund_code || r.fund_name || '未知') === key)
      .sort((a, b) => a.record_date.localeCompare(b.record_date))
    const filteredSellsForFund = sells
      .filter(r => (r.fund_code || r.fund_name || '未知') === key)
      .sort((a, b) => a.record_date.localeCompare(b.record_date))
    if (!filteredSellsForFund.length) return
    // 找筛选内第一笔卖出之前，最近一次「全部卖出」（cost=0）的时间点
    const firstSell = filteredSellsForFund[0]
    const prevFullSell = allFundSells
      .filter(s => s.record_date < firstSell.record_date && (!s.cost || s.cost === 0))
      .pop()
    const fromDate = prevFullSell ? prevFullSell.record_date : '0000-00-00'
    const firstBuyAfter = allFundBuys.find(b => b.record_date > fromDate)
    if (firstBuyAfter) byFund[key].earliestBuy = new Date(firstBuyAfter.record_date)
  })

  const totalInvest = Object.values(byFund).reduce((s, f) => s + f.invest, 0)
  const overallReturn = totalInvest > 0 ? totalPnl / totalInvest * 100 : null

  const modes: { key: StatsMode, label: string }[] = [
    { key: 'month', label: '本月' }, { key: 'year', label: '本年' }, { key: 'all', label: '全部' }
  ]

  return (
    <div
      style={{ padding: '0 0 2rem' }}
      onTouchStart={e => { touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY } }}
      onTouchEnd={e => {
        if (!touchRef.current) return
        const dx = e.changedTouches[0].clientX - touchRef.current.x
        const dy = Math.abs(e.changedTouches[0].clientY - touchRef.current.y)
        if (Math.abs(dx) > 60 && dy < 60) onSwipe(dx < 0 ? 'left' : 'right')
        touchRef.current = null
      }}
    >
      {/* Mode tabs + year picker */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
        <div style={{ display: 'flex', flex: 1, gap: 6 }}>
          {modes.map(m => (
            <button key={m.key} onClick={() => setMode(m.key)} style={{
              flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: mode === m.key ? '#333' : 'var(--card)',
              color: mode === m.key ? '#fff' : 'var(--t2)',
              fontWeight: 600, fontSize: 13, fontFamily: 'inherit'
            }}>{m.label}</button>
          ))}
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
        {[
          { label: '卖出本金', value: fmt(totalInvest), color: undefined },
          { label: '总盈亏', value: (totalPnl >= 0 ? '+' : '') + fmt(totalPnl), color: totalPnl !== 0 ? pnlColor(totalPnl) : undefined },
          { label: '简单收益率', value: overallReturn !== null ? fmtPct(overallReturn) : '—', color: totalPnl !== 0 ? pnlColor(totalPnl) : undefined }
        ].map((c, i) => (
          <div key={i} style={{ background: 'var(--bg)', borderRadius: 12, padding: '12px 10px' }}>
            <div style={{ fontSize: 11, color: 'var(--t2)', marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: c.color || 'var(--tx)' }}>{c.value}</div>
          </div>
        ))}
      </div>

      {Object.keys(byFund).length > 0 && (
        <>
          <div style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 10 }}>按基金统计</div>
          {Object.values(byFund).sort((a, b) => b.pnl - a.pnl).map((f, i) => {
            const simpleReturn = f.invest > 0 ? f.pnl / f.invest * 100 : null
            return (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '0.5px solid var(--bd)' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--tx)' }}>{f.name || '未命名'}</div>
                  {f.code && <div style={{ fontSize: 12, color: 'var(--t2)' }}>{f.code}</div>}
                  {f.earliestBuy && <div style={{ fontSize: 11, color: 'var(--t2)' }}>
                    {f.earliestBuy.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                    {f.latestSell ? ' → ' + f.latestSell.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }) : ''}
                  </div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, color: pnlColor(f.pnl), fontWeight: 500 }}>{f.pnl >= 0 ? '+' : ''}{fmt(f.pnl)}</div>
                  {simpleReturn !== null && <div style={{ fontSize: 12, color: pnlColor(f.pnl) }}>{fmtPct(simpleReturn)}</div>}
                  {f.invest > 0 && <div style={{ fontSize: 11, color: 'var(--t2)' }}>本金 {fmt(f.invest)}</div>}
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

// ── Calendar ──────────────────────────────────────────────
function CalendarScreen({ records, year, month, username, onRefresh, onSwipe }: {
  records: FundRecord[], year: number, month: number, username: string,
  onRefresh: () => void, onSwipe: (dir: 'left' | 'right') => void
}) {
  const [selDay, setSelDay] = useState<string | null>(null)
  const [todayStr, setTodayStr] = useState('')
  const touchRef = useRef<{ x: number, y: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = new Date()
    setTodayStr(t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0'))
  }, [])

  const dayMap: Record<string, { records: FundRecord[], totalPnl: number, totalBuy: number }> = {}
  records.forEach(r => {
    const d = new Date(r.record_date)
    if (d.getFullYear() !== year || d.getMonth() !== month) return
    if (!dayMap[r.record_date]) dayMap[r.record_date] = { records: [], totalPnl: 0, totalBuy: 0 }
    dayMap[r.record_date].records.push(r)
    if (r.type === 'sell') dayMap[r.record_date].totalPnl += r.pnl
    if (r.type === 'buy') dayMap[r.record_date].totalBuy += r.amount
  })

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const weeks = ['日', '一', '二', '三', '四', '五', '六']

  return (
    <div
      ref={containerRef}
      style={{ paddingTop: 8 }}
      onTouchStart={e => { touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY } }}
      onTouchEnd={e => {
        if (!touchRef.current) return
        const dx = e.changedTouches[0].clientX - touchRef.current.x
        const dy = Math.abs(e.changedTouches[0].clientY - touchRef.current.y)
        if (Math.abs(dx) > 60 && dy < 60) onSwipe(dx < 0 ? 'left' : 'right')
        touchRef.current = null
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3, marginBottom: 6 }}>
        {weeks.map(w => <div key={w} style={{ textAlign: 'center', fontSize: 12, color: 'var(--t2)', padding: '4px 0' }}>{w}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
        {Array(firstDay).fill(null).map((_, i) => <div key={'e' + i} style={{ aspectRatio: '1' }} />)}
        {Array(daysInMonth).fill(null).map((_, i) => {
          const d = i + 1
          const dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0')
          const data = dayMap[dateStr]
          const isToday = dateStr === todayStr
          const hasSell = data?.records.some(r => r.type === 'sell')
          return (
            <div key={d} onClick={() => setSelDay(dateStr)} style={{
              aspectRatio: '1',
              borderRadius: 10,
              border: data && !isToday ? '1px solid var(--bd)' : 'none',
              background: isToday ? '#FFF3E0' : data ? 'var(--card)' : 'transparent',
              padding: '5px 4px', cursor: 'pointer',
              display: 'flex', flexDirection: 'column'
            }}>
              <div style={{ fontSize: 11, color: isToday ? '#E65100' : 'var(--t2)', fontWeight: isToday ? 700 : 400, marginBottom: 1 }}>{d}</div>
              {data?.totalBuy > 0 && <div style={{ fontSize: 10, fontWeight: 600, color: '#999', lineHeight: 1.2 }}>
                {data.totalBuy.toFixed(0)}
              </div>}
              {hasSell && <div style={{ fontSize: 10, fontWeight: 600, color: pnlColor(data.totalPnl), lineHeight: 1.2 }}>
                {data.totalPnl >= 0 ? '+' : ''}{Math.abs(data.totalPnl).toFixed(0)}
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
          onRefresh={onRefresh}
        />
      )}
    </div>
  )
}


// ── Position Screen ───────────────────────────────────────
function PositionScreen({ records }: { records: FundRecord[] }) {
  // 计算每个基金的持仓剩余本金
  const allBuys = records.filter(r => r.type === 'buy')
  const allSells = records.filter(r => r.type === 'sell')

  const fundKeys = Array.from(new Set(records.map(r => r.fund_code || r.fund_name || '未知')))

  const positions: { key: string, name: string, code: string, totalBuy: number, soldCost: number, remaining: number, lastBuyDate: string }[] = []

  fundKeys.forEach(key => {
    const fundBuys = allBuys
      .filter(r => (r.fund_code || r.fund_name || '未知') === key)
      .sort((a, b) => a.record_date.localeCompare(b.record_date))
    const fundSells = allSells
      .filter(r => (r.fund_code || r.fund_name || '未知') === key)
      .sort((a, b) => a.record_date.localeCompare(b.record_date))

    if (!fundBuys.length) return

    // 找最后一次全部卖出之后的买入
    const lastFullSell = [...fundSells].reverse().find(s => !s.cost || s.cost === 0)
    const fromDate = lastFullSell ? lastFullSell.record_date : '0000-00-00'
    const buysAfterLastFullSell = fundBuys.filter(b => b.record_date > fromDate)

    if (!buysAfterLastFullSell.length) return // 全卖完了，没有持仓

    const totalBuy = buysAfterLastFullSell.reduce((s, b) => s + b.amount, 0)

    // 最后一次全卖之后的部分卖出
    const partialSellsAfter = fundSells.filter(s => s.record_date > fromDate && s.cost && s.cost > 0)
    const soldCost = partialSellsAfter.reduce((s, r) => s + (r.cost || 0), 0)

    const remaining = totalBuy - soldCost
    if (remaining <= 0) return

    const name = fundBuys[fundBuys.length - 1].fund_name
    const code = fundBuys[fundBuys.length - 1].fund_code
    const lastBuyDate = buysAfterLastFullSell[buysAfterLastFullSell.length - 1].record_date

    positions.push({ key, name, code, totalBuy, soldCost, remaining, lastBuyDate })
  })

  positions.sort((a, b) => b.remaining - a.remaining)

  const totalRemaining = positions.reduce((s, p) => s + p.remaining, 0)

  return (
    <div style={{ padding: '0 0 2rem' }}>
      {positions.length > 0 && (
        <div style={{ background: 'var(--bg)', borderRadius: 12, padding: '14px', marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--t2)', marginBottom: 4 }}>总持仓本金</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--tx)' }}>{fmt(totalRemaining)}</div>
        </div>
      )}

      {positions.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--t2)', fontSize: 14, padding: '60px 0' }}>暂无持仓</div>
      )}

      {positions.map((p, i) => {
        const pct = totalRemaining > 0 ? p.remaining / totalRemaining * 100 : 0
        return (
          <div key={i} style={{ padding: '12px 0', borderBottom: '0.5px solid var(--bd)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ minWidth: 0, flex: 1, marginRight: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name || '未命名'}</div>
                {p.code && <div style={{ fontSize: 12, color: 'var(--t2)' }}>{p.code}</div>}
                <div style={{ fontSize: 11, color: 'var(--t2)', marginTop: 2 }}>
                  最近买入 {new Date(p.lastBuyDate + 'T00:00:00').toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--tx)' }}>{fmt(p.remaining)}</div>
                <div style={{ fontSize: 12, color: 'var(--t2)' }}>{pct.toFixed(1)}%</div>
                {p.soldCost > 0 && (
                  <div style={{ fontSize: 11, color: 'var(--t2)' }}>已卖出 {fmt(p.soldCost)}</div>
                )}
              </div>
            </div>
            {/* 占比进度条 */}
            <div style={{ height: 4, borderRadius: 2, background: 'var(--bd)', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 2, background: '#333', width: pct + '%' }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── App ───────────────────────────────────────────────────
export default function App() {
  const [mounted, setMounted] = useState(false)
  const [username, setUsername] = useState<string | null>(null)
  const [records, setRecords] = useState<FundRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'cal' | 'stats' | 'pos'>('cal')
  const [curYear, setCurYear] = useState(0)
  const [curMonth, setCurMonth] = useState(0)
  const [statsMode, setStatsMode] = useState<StatsMode>('month')
  const [statsYear, setStatsYear] = useState(0)

  useEffect(() => {
    const now = new Date()
    setCurYear(now.getFullYear())
    setCurMonth(now.getMonth())
    setStatsYear(now.getFullYear())
    const u = localStorage.getItem('fj_username')
    if (u) setUsername(u)
    setMounted(true)
  }, [])

  const load = useCallback(async (u: string) => {
    setLoading(true)
    const { data } = await getDB().from('fund_records').select('*').eq('username', u).order('record_date', { ascending: false })
    setRecords(data || [])
    setLoading(false)
  }, [])

  const login = (u: string) => {
    localStorage.setItem('fj_username', u)
    setUsername(u)
    load(u)
  }

  useEffect(() => { if (username) load(username) }, [username, load])

  const handleCalSwipe = (dir: 'left' | 'right') => {
    const [ny, nm] = dir === 'left' ? nextMonth(curYear, curMonth) : prevMonth(curYear, curMonth)
    setCurYear(ny); setCurMonth(nm)
  }

  const handleStatsSwipe = (dir: 'left' | 'right') => {
    const order: StatsMode[] = ['month', 'year', 'all']
    const idx = order.indexOf(statsMode)
    if (dir === 'left' && idx < 2) setStatsMode(order[idx + 1])
    if (dir === 'right' && idx > 0) setStatsMode(order[idx - 1])
  }

  if (!mounted) return null
  if (!username) return <LoginScreen onLogin={login} />

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', height: '100dvh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => { localStorage.removeItem('fj_username'); setUsername(null) }} style={{
          width: 36, height: 36, borderRadius: '50%', background: '#333', border: 'none',
          color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit'
        }}>
          {username.slice(0, 1).toUpperCase()}
        </button>
        {(tab === 'cal' || (tab === 'stats' && statsMode === 'month')) && curYear > 0 && (
          <MonthPicker year={curYear} month={curMonth} onChange={(y, m) => { setCurYear(y); setCurMonth(m) }} />
        )}
        {tab === 'stats' && statsMode === 'year' && statsYear > 0 && (
          <YearPicker year={statsYear} onChange={setStatsYear} />
        )}
      </div>

      <div style={{ flex: 1, padding: '0 20px', overflowY: 'auto', paddingTop: 10, minHeight: 0 }}>
        {loading
          ? <div style={{ textAlign: 'center', color: 'var(--t2)', padding: '40px 0', fontSize: 14 }}>加载中...</div>
          : tab === 'cal'
          ? <CalendarScreen records={records} year={curYear} month={curMonth} username={username} onRefresh={() => load(username!)} onSwipe={handleCalSwipe} />
          : tab === 'stats'
          ? <StatsScreen records={records} year={curYear} month={curMonth} mode={statsMode} setMode={setStatsMode} statsYear={statsYear} setStatsYear={setStatsYear} onSwipe={handleStatsSwipe} />
          : <PositionScreen records={records} />
        }
      </div>

      <div style={{ display: 'flex', borderTop: '0.5px solid var(--bd)', background: 'var(--card)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {([['cal', '日历'], ['pos', '持仓'], ['stats', '统计']] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t as any)} style={{
            flex: 1, padding: '14px 0', border: 'none', background: 'transparent', cursor: 'pointer',
            color: tab === t ? 'var(--tx)' : 'var(--t2)', fontWeight: tab === t ? 700 : 400,
            fontSize: 14, fontFamily: 'inherit'
          }}>{label}</button>
        ))}
      </div>
    </div>
  )
}
