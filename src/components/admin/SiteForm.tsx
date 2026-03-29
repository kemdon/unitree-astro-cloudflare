import { useState } from 'react'
import type { FooterGroup, NavItem, SiteConfig, SocialLink } from '@/lib/schema'
import { restoreDefaultNavigation } from '@/lib/template-contract'

type Props = {
  site: SiteConfig
}

function createNavItem(): NavItem {
  return { label: '', href: '' }
}

function createFooterGroup(): FooterGroup {
  return {
    title: '',
    links: [createNavItem()],
  }
}

function createSocialLink(): SocialLink {
  return { label: '', href: '' }
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

  function updateNavigation(index: number, field: keyof NavItem, value: string) {
    setDraft((current) => ({
      ...current,
      navigation: current.navigation.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    }))
  }

  function addNavigationItem() {
    setDraft((current) => ({
      ...current,
      navigation: [...current.navigation, createNavItem()],
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

  function updateFeaturedLink(index: number, field: keyof NavItem, value: string) {
    setDraft((current) => ({
      ...current,
      featuredLinks: (current.featuredLinks ?? []).map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    }))
  }

  function addFeaturedLink() {
    setDraft((current) => ({
      ...current,
      featuredLinks: [...(current.featuredLinks ?? []), createNavItem()],
    }))
  }

  function removeFeaturedLink(index: number) {
    setDraft((current) => ({
      ...current,
      featuredLinks: (current.featuredLinks ?? []).filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  function updateFooterGroup(index: number, field: keyof FooterGroup, value: string) {
    setDraft((current) => ({
      ...current,
      footerGroups: (current.footerGroups ?? []).map((group, groupIndex) => (groupIndex === index ? { ...group, [field]: value } : group)),
    }))
  }

  function addFooterGroup() {
    setDraft((current) => ({
      ...current,
      footerGroups: [...(current.footerGroups ?? []), createFooterGroup()],
    }))
  }

  function removeFooterGroup(index: number) {
    setDraft((current) => ({
      ...current,
      footerGroups: (current.footerGroups ?? []).filter((_, groupIndex) => groupIndex !== index),
    }))
  }

  function updateFooterLink(groupIndex: number, linkIndex: number, field: keyof NavItem, value: string) {
    setDraft((current) => ({
      ...current,
      footerGroups: (current.footerGroups ?? []).map((group, currentGroupIndex) =>
        currentGroupIndex === groupIndex
          ? {
              ...group,
              links: group.links.map((link, currentLinkIndex) =>
                currentLinkIndex === linkIndex ? { ...link, [field]: value } : link,
              ),
            }
          : group,
      ),
    }))
  }

  function addFooterLink(groupIndex: number) {
    setDraft((current) => ({
      ...current,
      footerGroups: (current.footerGroups ?? []).map((group, currentGroupIndex) =>
        currentGroupIndex === groupIndex ? { ...group, links: [...group.links, createNavItem()] } : group,
      ),
    }))
  }

  function removeFooterLink(groupIndex: number, linkIndex: number) {
    setDraft((current) => ({
      ...current,
      footerGroups: (current.footerGroups ?? []).map((group, currentGroupIndex) =>
        currentGroupIndex === groupIndex
          ? { ...group, links: group.links.filter((_, currentLinkIndex) => currentLinkIndex !== linkIndex) }
          : group,
      ),
    }))
  }

  function updateSocialLink(index: number, field: keyof SocialLink, value: string) {
    setDraft((current) => ({
      ...current,
      socialLinks: (current.socialLinks ?? []).map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    }))
  }

  function addSocialLink() {
    setDraft((current) => ({
      ...current,
      socialLinks: [...(current.socialLinks ?? []), createSocialLink()],
    }))
  }

  function removeSocialLink(index: number) {
    setDraft((current) => ({
      ...current,
      socialLinks: (current.socialLinks ?? []).filter((_, itemIndex) => itemIndex !== index),
    }))
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
              setDraft((current) => ({ ...current, seo: { ...current.seo, defaultDescription: event.target.value } }))
            }
          />
        </div>
        <div className="field">
          <label>版权文案</label>
          <textarea
            value={draft.legalText ?? ''}
            onChange={(event) => setDraft((current) => ({ ...current, legalText: event.target.value }))}
          />
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-toolbar">
          <h3>主导航</h3>
          <div className="inline-actions">
            <button className="button button--secondary" onClick={resetNavigation} type="button">恢复默认导航</button>
            <button className="button button--secondary" onClick={addNavigationItem} type="button">添加导航项</button>
          </div>
        </div>
        <div className="form-grid">
          {draft.navigation.map((item, index) => (
            <div className="feature-item" key={`nav-${index}`}>
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
                  <label>名称</label>
                  <input value={item.label} onChange={(event) => updateNavigation(index, 'label', event.target.value)} />
                </div>
                <div className="field">
                  <label>链接</label>
                  <input value={item.href} onChange={(event) => updateNavigation(index, 'href', event.target.value)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-toolbar">
          <h3>Header CTA</h3>
          <button className="button button--secondary" onClick={addFeaturedLink} type="button">添加按钮</button>
        </div>
        <div className="form-grid">
          {(draft.featuredLinks ?? []).map((item, index) => (
            <div className="feature-item" key={`featured-${index}`}>
              <div className="admin-toolbar">
                <strong>按钮 {index + 1}</strong>
                <button className="button button--secondary" onClick={() => removeFeaturedLink(index)} type="button">删除</button>
              </div>
              <div className="form-grid">
                <div className="field">
                  <label>名称</label>
                  <input value={item.label} onChange={(event) => updateFeaturedLink(index, 'label', event.target.value)} />
                </div>
                <div className="field">
                  <label>链接</label>
                  <input value={item.href} onChange={(event) => updateFeaturedLink(index, 'href', event.target.value)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-toolbar">
          <h3>Footer 分组</h3>
          <button className="button button--secondary" onClick={addFooterGroup} type="button">添加分组</button>
        </div>
        <div className="form-grid">
          {(draft.footerGroups ?? []).map((group, groupIndex) => (
            <div className="feature-item" key={`footer-group-${groupIndex}`}>
              <div className="admin-toolbar">
                <strong>分组 {groupIndex + 1}</strong>
                <button className="button button--secondary" onClick={() => removeFooterGroup(groupIndex)} type="button">删除分组</button>
              </div>
              <div className="field">
                <label>分组标题</label>
                <input value={group.title} onChange={(event) => updateFooterGroup(groupIndex, 'title', event.target.value)} />
              </div>
              <div className="admin-toolbar">
                <span className="muted">分组链接</span>
                <button className="button button--secondary" onClick={() => addFooterLink(groupIndex)} type="button">添加链接</button>
              </div>
              <div className="form-grid">
                {group.links.map((link, linkIndex) => (
                  <div className="feature-item" key={`footer-group-${groupIndex}-link-${linkIndex}`}>
                    <div className="admin-toolbar">
                      <strong>链接 {linkIndex + 1}</strong>
                      <button className="button button--secondary" onClick={() => removeFooterLink(groupIndex, linkIndex)} type="button">删除</button>
                    </div>
                    <div className="form-grid">
                      <div className="field">
                        <label>名称</label>
                        <input value={link.label} onChange={(event) => updateFooterLink(groupIndex, linkIndex, 'label', event.target.value)} />
                      </div>
                      <div className="field">
                        <label>链接</label>
                        <input value={link.href} onChange={(event) => updateFooterLink(groupIndex, linkIndex, 'href', event.target.value)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-toolbar">
          <h3>社交链接</h3>
          <button className="button button--secondary" onClick={addSocialLink} type="button">添加社交链接</button>
        </div>
        <div className="form-grid">
          {(draft.socialLinks ?? []).map((item, index) => (
            <div className="feature-item" key={`social-${index}`}>
              <div className="admin-toolbar">
                <strong>社交项 {index + 1}</strong>
                <button className="button button--secondary" onClick={() => removeSocialLink(index)} type="button">删除</button>
              </div>
              <div className="form-grid">
                <div className="field">
                  <label>名称</label>
                  <input value={item.label} onChange={(event) => updateSocialLink(index, 'label', event.target.value)} />
                </div>
                <div className="field">
                  <label>链接</label>
                  <input value={item.href} onChange={(event) => updateSocialLink(index, 'href', event.target.value)} />
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
