import { useMemo, useState } from 'react'
import type { MediaFile } from '@/lib/media-types'

type Props = {
  label: string
  value: string
  files: MediaFile[]
  loading: boolean
  error?: string
  onRefresh: () => void
  onChange: (nextValue: string) => void
}

function formatSize(size: number) {
  if (size < 1024) {
    return `${size} B`
  }

  return `${Math.max(1, Math.round(size / 1024))} KB`
}

export default function MediaPickerField({ label, value, files, loading, error, onRefresh, onChange }: Props) {
  const [query, setQuery] = useState('')
  const selectedFile = useMemo(() => files.find((file) => file.url === value) ?? null, [files, value])
  const hasLibraryMatch = Boolean(selectedFile)
  const filteredFiles = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) {
      return files
    }

    return files.filter((file) => file.name.toLowerCase().includes(keyword) || file.url.toLowerCase().includes(keyword))
  }, [files, query])

  return (
    <div className="field media-picker">
      <label>{label}</label>
      <div className="media-picker__controls">
        <input
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索文件名"
          type="search"
          value={query}
        />
        <select
          onChange={(event) => onChange(event.target.value)}
          value={hasLibraryMatch || !value ? value : '__custom__'}
        >
          <option value="">请选择媒体库图片</option>
          {!hasLibraryMatch && value && <option value="__custom__">当前值不在媒体库：{value}</option>}
          {filteredFiles.map((file) => (
            <option key={file.name} value={file.url}>
              {file.name}
            </option>
          ))}
        </select>
      </div>

      {!value && <p className="muted">请从媒体库选择图片。</p>}
      {value && !hasLibraryMatch && <p className="muted">当前图片不在媒体库列表中，建议重新选择。</p>}
      {selectedFile && (
        <p className="muted">
          {selectedFile.name} · {formatSize(selectedFile.size)}
        </p>
      )}

      <div className="inline-actions">
        <button className="button button--secondary" onClick={onRefresh} type="button">
          刷新媒体库
        </button>
        <a className="button button--secondary" href="/admin/media" rel="noreferrer" target="_blank">
          打开媒体管理
        </a>
        {value && (
          <button className="button button--secondary" onClick={() => onChange('')} type="button">
            清空图片
          </button>
        )}
      </div>
      {loading && <p className="muted">媒体库加载中...</p>}
      {!loading && error && <p className="muted">{error}</p>}
      {!loading && !error && files.length === 0 && <p className="muted">媒体库还没有文件，请先去媒体管理上传。</p>}
      {!loading && !error && files.length > 0 && filteredFiles.length === 0 && (
        <p className="muted">没有匹配当前搜索词的文件。</p>
      )}
    </div>
  )
}
