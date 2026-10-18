import { useState, useEffect } from 'react'
import { getAdminPosts, deleteAdminPost } from '../../api/adminApi'
import Icon from '../Icon'

interface Post {
  id: string
  content: string
  username: string
  display_name: string
  likes_count: number
  comments_count: number
  report_count: number
  created_at: string
  media_urls: string[]
}

const bars = [35, 68, 48, 82, 64, 91]

export default function ContentPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [flagged, setFlagged] = useState(false)

  useEffect(() => {
    setLoading(true)
    getAdminPosts({ flagged: flagged || undefined })
      .then(r => setPosts(r.data.posts ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [flagged])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post?')) return
    try {
      await deleteAdminPost(id)
      setPosts(prev => prev.filter(p => p.id !== id))
    } catch {}
  }

  return (
    <div className="admin-page admin-in">
      <section className="admin-intro compact">
        <div>
          <span className="overline">Content moderation</span>
          <h1>Content<br/><em>with clarity.</em></h1>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => setFlagged(!flagged)}
            style={{ padding: '9px 16px', border: '1px solid rgba(17,17,15,.14)', borderRadius: 99, background: flagged ? '#ff4f38' : 'transparent', color: flagged ? 'white' : '#11110f', fontSize: 9, cursor: 'pointer' }}>
            {flagged ? 'Flagged only' : 'All content'}
          </button>
          <button className="admin-action">
            <Icon name="flag" size={14} /> Filter
          </button>
        </div>
      </section>

      {loading ? (
        <p style={{ color: '#777', textAlign: 'center', padding: 40 }}>Loading…</p>
      ) : (
        <div className="admin-table">
          <header>
            <span>Author</span>
            <span>Status</span>
            <span>Engagement</span>
            <span>Signal</span>
            <span />
          </header>
          {posts.map((post, index) => (
            <div key={post.id}>
              <span>
                <span className={`person tone-${index % 5}`}>{post.display_name?.charAt(0) ?? '?'}</span>
                <div>
                  <strong>@{post.username}</strong>
                  <div style={{ fontSize: 8, color: '#777', marginTop: 2, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {post.content}
                  </div>
                </div>
              </span>
              <span>
                {post.report_count > 0 ? (
                  <><i style={{ background: '#ef4444' }} />Flagged</>
                ) : (
                  <><i />Clean</>
                )}
              </span>
              <span>{(post.likes_count ?? 0) + (post.comments_count ?? 0)} interactions</span>
              <span className="micro-bars">
                {bars.map((h, i) => <i key={i} style={{ height: `${h}%`, animationDelay: `${i * 0.08}s` }} />)}
              </span>
              <button onClick={() => handleDelete(post.id)} style={{ color: '#ff4f38' }}>
                <Icon name="close" size={16} />
              </button>
            </div>
          ))}
          {posts.length === 0 && !loading && (
            <p style={{ padding: '40px 10px', color: '#777', textAlign: 'center' }}>No posts found</p>
          )}
        </div>
      )}
    </div>
  )
}
