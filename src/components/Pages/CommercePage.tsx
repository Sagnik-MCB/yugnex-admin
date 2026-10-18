import { useState, useEffect } from 'react'
import { getAdminMarketplace, getAdminTransactions } from '../../api/adminApi'
import Icon from '../Icon'

interface MarketItem {
  id: string
  title: string
  username: string
  price_coins: number
  category: string
  sales_count: number
  is_active: boolean
}

interface Transaction {
  id: string
  username: string
  description: string
  amount_inr: number
  created_at: string
  type: string
}

const bars = [35, 68, 48, 82, 64, 91]

export default function CommercePage() {
  const [items, setItems] = useState<MarketItem[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [tab, setTab] = useState<'items' | 'transactions'>('items')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (tab === 'items') {
      setLoading(true)
      getAdminMarketplace().then(r => setItems(r.data.items ?? [])).catch(() => {}).finally(() => setLoading(false))
    } else {
      setLoading(true)
      getAdminTransactions().then(r => setTransactions(r.data.transactions ?? [])).catch(() => {}).finally(() => setLoading(false))
    }
  }, [tab])

  return (
    <div className="admin-page admin-in">
      <section className="admin-intro compact">
        <div>
          <span className="overline">Marketplace &amp; commerce</span>
          <h1>Commerce<br/><em>with clarity.</em></h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['items', 'transactions'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: '9px 16px', border: '1px solid rgba(17,17,15,.14)', borderRadius: 99, background: tab === t ? '#11110f' : 'transparent', color: tab === t ? 'white' : '#11110f', fontSize: 9, cursor: 'pointer', textTransform: 'capitalize' }}>
              {t}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <p style={{ color: '#777', textAlign: 'center', padding: 40 }}>Loading…</p>
      ) : tab === 'items' ? (
        <div className="admin-table">
          <header>
            <span>Item</span>
            <span>Status</span>
            <span>Price</span>
            <span>Signal</span>
            <span />
          </header>
          {items.map((item, index) => (
            <div key={item.id}>
              <span>
                <span className={`person tone-${index % 5}`}>{item.title?.charAt(0) ?? '?'}</span>
                <div>
                  <strong>{item.title}</strong>
                  <div style={{ fontSize: 8, color: '#777', marginTop: 2 }}>by @{item.username}</div>
                </div>
              </span>
              <span>
                <i style={{ background: item.is_active ? '#21855b' : '#777' }} />
                {item.is_active ? 'Active' : 'Inactive'}
              </span>
              <span>{item.price_coins} coins</span>
              <span className="micro-bars">
                {bars.map((h, i) => <i key={i} style={{ height: `${h}%`, animationDelay: `${i * 0.08}s` }} />)}
              </span>
              <button><Icon name="more" size={16} /></button>
            </div>
          ))}
          {items.length === 0 && <p style={{ padding: '40px 10px', color: '#777', textAlign: 'center' }}>No items found</p>}
        </div>
      ) : (
        <div className="admin-table">
          <header>
            <span>Buyer</span>
            <span>Status</span>
            <span>Amount</span>
            <span>Date</span>
            <span />
          </header>
          {transactions.map((t, index) => (
            <div key={t.id}>
              <span>
                <span className={`person tone-${index % 5}`}>{t.username?.charAt(0) ?? '?'}</span>
                <div>
                  <strong>@{t.username}</strong>
                  <div style={{ fontSize: 8, color: '#777', marginTop: 2 }}>{t.description}</div>
                </div>
              </span>
              <span><i />{t.type}</span>
              <span>₹{t.amount_inr.toLocaleString()}</span>
              <span>{new Date(t.created_at).toLocaleDateString('en-IN')}</span>
              <button><Icon name="more" size={16} /></button>
            </div>
          ))}
          {transactions.length === 0 && <p style={{ padding: '40px 10px', color: '#777', textAlign: 'center' }}>No transactions found</p>}
        </div>
      )}
    </div>
  )
}
