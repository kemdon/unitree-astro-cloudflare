import { useEffect, useState, type ChangeEvent } from 'react'
import type { MediaFile } from '@/lib/media-types'

export default function MediaUploader() {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')

  async function loadFiles() {
    const response = await fetch('/api/media')
    const result = await response.json()
    if (response.ok) {
      setFiles(result.files)
    }
  }

  useEffect(() => {
    void loadFiles()
  }, [])

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    setUploading(true)
    setMessage('')

    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/media', {
      method: 'POST',
      body: formData,
    })

    const result = await response.json()
    setUploading(false)

    if (!response.ok) {
      setMessage(result.error ?? '上传失败')
      return
    }

    setFiles((current) => [result.file, ...current])
    setMessage('上传成功')
    event.target.value = ''
  }

  async function handleDelete(name: string) {
    const response = await fetch(`/api/media?name=${encodeURIComponent(name)}`, {
      method: 'DELETE',
    })

    const result = await response.json()
    if (!response.ok) {
      setMessage(result.error ?? '删除失败')
      return
    }

    setFiles((current) => current.filter((file) => file.name !== name))
    setMessage('文件已删除')
  }

  async function copyPath(url: string) {
    await navigator.clipboard.writeText(url)
    setMessage(`已复制路径：${url}`)
  }

  return (
    <div className="admin-card admin-card--wide">
      <h2>媒体管理</h2>
      <p className="muted">上传文件后会通过 /uploads/... 提供可引用路径，preview/生产态也保持一致。</p>

      <div className="form-grid">
        <div className="field">
          <label>选择文件上传</label>
          <input onChange={handleUpload} type="file" />
        </div>
      </div>

      <div className="inline-actions">
        <button className="button button--secondary" onClick={() => void loadFiles()} type="button">
          刷新列表
        </button>
        <span className="muted">{uploading ? '上传中...' : message}</span>
      </div>

      <div className="admin-section">
        <h3>已上传文件</h3>
        <div className="form-grid">
          {files.length === 0 && <p className="muted">当前还没有文件。</p>}
          {files.map((file) => (
            <div className="feature-item" key={file.name}>
              <div className="admin-toolbar">
                <div>
                  <strong>{file.name}</strong>
                  <p className="muted">
                    {file.url} · {Math.max(1, Math.round(file.size / 1024))} KB
                  </p>
                </div>
                <div className="inline-actions">
                  <button className="button button--secondary" onClick={() => copyPath(file.url)} type="button">
                    复制路径
                  </button>
                  <a className="button button--secondary" href={file.url} target="_blank">
                    预览
                  </a>
                  <button className="button button--secondary" onClick={() => handleDelete(file.name)} type="button">
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
