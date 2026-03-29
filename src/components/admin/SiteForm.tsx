import { useState } from 'react'
import type { SiteConfig } from '@/lib/schema'
import { restoreDefaultNavigation } from '@/lib/template-contract'

type Props = {
  site: SiteConfig
}

export default function SiteForm({ site }: Props) {
  const [draft, setDraft] = useState<SiteConfig>(site)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSave() {
    setSaving(true)
    setMessage('')

    const response = await fetch('/api/site', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    })

    const result = await response.json()
    setSaving(false)

    if (!response.ok) {
      setMessage(result.error ?? '保存失败')
      return
    }

    setDraft(result.data)
    setMessage('保存成功')
  }

  function updateNavLabel(index: number, value: string) {
    setDraft((current) => ({
      ...current,
      navigation: current.navigation.map((item, itemIndex) =>
        itemIndex === index ? { ...item, label: value } : item,
      ),
    }))
  }

  function updateNavHref(index: number, value: string) {
    setDraft((current) => ({
      ...current,
      navigation: current.navigation.map((item, itemIndex) =>
        itemIndex === index ? { ...item, href: value } : item,
      ),
    }))
  }

  function addNavigationItem() {
    setDraft((current) => ({
      ...current,
      navigation: [...current.navigation, { label: '', href: '' }],
    }))
  }

  function removeNavigationItem(index: number) {
    setDraft((current) => ({
      ...current,
      navigation: current.navigation.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  function moveNavigationItem(index: number, direction: -1 | 1) {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= draft.navigation.length) {
      return
    }

    setDraft((current) => {
      const nextNavigation = [...current.navigation]
      const currentItem = nextNavigation[index]
      nextNavigation[index] = nextNavigation[nextIndex]
      nextNavigation[nextIndex] = currentItem

      return { ...current, navigation: nextNavigation }
    })
  }

  function resetNavigation() {
    setDraft((current) => ({ ...current, navigation: restoreDefaultNavigation() }))
    setMessage('已恢复默认导航')
  }

  return (
    <div className="admin-card admin-card--wide">
      <h2>Site 设置</h2>
      <p className="muted">编辑站点基础配置并直接写入 Cloudflare D1。</p>

      <div className="form-grid">
        <div className="field">
          <label>站点名称</label>
          <input value={draft.siteName} onChange={(event) => setDraft((current) => ({ ...current, siteName: event.target.value }))} />
        </div>
        <div className="field">
          <label>品牌主色</label>
          <input
            value={draft.brand.primary}
            onChange={(event) =>
              setDraft((current) => ({ ...current, brand: { ...current.brand, primary: event.target.value } }))
            }
          />
        </div>
        <div className="field">
          <label>品牌辅色</label>
          <input
            value={draft.brand.secondary ?? ''}
            onChange={(event) =>
              setDraft((current) => ({ ...current, brand: { ...current.brand, secondary: event.target.value } }))
            }
          />
        </div>
        <div className="field">
          <label>Logo 文案</label>
          <input
            value={draft.brand.logoText ?? ''}
            onChange={(event) =>
              setDraft((current) => ({ ...current, brand: { ...current.brand, logoText: event.target.value } }))
            }
          />
        </div>
        <div className="field">
          <label>联系电话</label>
          <input
            value={draft.contact.phone ?? ''}
            onChange={(event) =>
              setDraft((current) => ({ ...current, contact: { ...current.contact, phone: event.target.value } }))
            }
          />
        </div>
        <div className="field">
          <label>联系邮箱</label>
          <input
            value={draft.contact.email ?? ''}
            onChange={(event) =>
              setDraft((current) => ({ ...current, contact: { ...current.contact, email: event.target.value } }))
            }
          />
        </div>
        <div className="field">
          <label>联系地址</label>
          <textarea
            value={draft.contact.address ?? ''}
            onChange={(event) =>
              setDraft((current) => ({ ...current, contact: { ...current.contact, address: event.target.value } }))
            }
          />
        </div>
        <div className="field">
          <label>默认 SEO 标题</label>
          <input
            value={draft.seo.defaultTitle}
            onChange={(event) =>
              setDraft((current) => ({ ...current, seo: { ...current.seo, defaultTitle: event.target.value } }))
            }
          />
        </div>
        <div className="field">
          <label>默认 SEO 描述</label>
          <textarea
            value={draft.seo.defaultDescription}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                seo: { ...current.seo, defaultDescription: event.target.value },
              }))
            }
          />
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-toolbar">
          <h3>导航</h3>
          <div className="inline-actions">
            <button className="button button--secondary" onClick={resetNavigation} type="button">恢复默认导航</button>
            <button className="button button--secondary" onClick={addNavigationItem} type="button">添加导航项</button>
          </div>
        </div>
        <div className="form-grid">
          {draft.navigation.map((item, index) => (
            <div className="feature-item" key={`${item.href}-${index}`}>
              <div className="admin-toolbar">
                <strong>导航项 {index + 1}</strong>
                <div className="inline-actions">
                  <button className="button button--secondary" onClick={() => moveNavigationItem(index, -1)} type="button">上移</button>
                  <button className="button button--secondary" onClick={() => moveNavigationItem(index, 1)} type="button">下移</button>
                  <button className="button button--secondary" onClick={() => removeNavigationItem(index)} type="button">删除</button>
                </div>
              </div>
              <div className="form-grid">
                <div className="field">
                  <label>导航名称</label>
                  <input value={item.label} onChange={(event) => updateNavLabel(index, event.target.value)} />
                </div>
                <div className="field">
                  <label>链接</label>
                  <input value={item.href} onChange={(event) => updateNavHref(index, event.target.value)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="inline-actions">
        <button className="button button--primary" disabled={saving} onClick={handleSave} type="button">
          {saving ? '保存中...' : '保存 Site'}
        </button>
        {message && <span className="muted">{message}</span>}
      </div>
    </div>
  )
}
