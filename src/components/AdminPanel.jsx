import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { UserAuth } from '../context/AuthContext'
import '../styles/AdminPanel.css'

const ENTITY_TYPES = ['facility', 'service']

const emptyForm = {
  name: '',
  entity_type: 'facility',
  latitude: '',
  longitude: '',
  description: '',
  images_text: '',
}

// ── Defined OUTSIDE component so inputs never remount on re-render ────────────

const Field = ({ label, name, type = 'text', placeholder, required, form, setForm }) => (
  <div className="ap-field">
    <label className="ap-label">
      {label}
      {required && <span className="ap-required">*</span>}
    </label>
    <input
      className="ap-input"
      type={type}
      placeholder={placeholder}
      value={form[name]}
      onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
      required={required}
      step={type === 'number' ? 'any' : undefined}
    />
  </div>
)

const EntityForm = ({ form, setForm, onSubmit, submitLabel, status, loading }) => (
  <form className="ap-form" onSubmit={onSubmit}>
    <Field label="Name" name="name" placeholder="e.g. Main Library" required form={form} setForm={setForm} />
    <div className="ap-field">
      <label className="ap-label">Type<span className="ap-required">*</span></label>
      <div className="ap-radio-group">
        {ENTITY_TYPES.map((t) => (
          <label key={t} className={`ap-radio ${form.entity_type === t ? 'active' : ''}`}>
            <input
              type="radio"
              name="entity_type"
              value={t}
              checked={form.entity_type === t}
              onChange={() => setForm((f) => ({ ...f, entity_type: t }))}
            />
            {t === 'facility' ? '🏛️ Facility' : '🛎️ Service'}
          </label>
        ))}
      </div>
    </div>
    <div className="ap-row">
      <Field label="Latitude" name="latitude" type="number" placeholder="10.6419" required form={form} setForm={setForm} />
      <Field label="Longitude" name="longitude" type="number" placeholder="122.5854" required form={form} setForm={setForm} />
    </div>
    <div className="ap-field">
      <label className="ap-label">Description</label>
      <textarea
        className="ap-input ap-textarea"
        placeholder="Brief description (optional)"
        value={form.description}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        rows={3}
      />
    </div>
    <div className="ap-field">
      <label className="ap-label">Images (text / URLs)</label>
      <input
        className="ap-input"
        type="text"
        placeholder="Optional image reference"
        value={form.images_text}
        onChange={(e) => setForm((f) => ({ ...f, images_text: e.target.value }))}
      />
    </div>
    {status && (
      <div className={`ap-status ap-status--${status.type}`}>{status.msg}</div>
    )}
    <button className="ap-submit" type="submit" disabled={loading}>
      {loading ? 'Saving…' : submitLabel}
    </button>
  </form>
)

// ── Main component ────────────────────────────────────────────────────────────
// pendingEdit / pendingDelete: entity object passed from Dashboard card buttons
// onConsumed: called after panel has consumed the pending action (resets parent state)

const AdminPanel = ({ onEntityChange, pendingEdit, pendingDelete, onConsumed }) => {
  const { session } = UserAuth()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState('add')
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [deleteName, setDeleteName] = useState('')
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  // When Dashboard passes a pendingEdit, load it and open panel
  useEffect(() => {
    if (!pendingEdit) return
    setForm({
      name: pendingEdit.name || '',
      entity_type: pendingEdit.entity_type || 'facility',
      latitude: pendingEdit.latitude ?? '',
      longitude: pendingEdit.longitude ?? '',
      description: pendingEdit.description || '',
      images_text: pendingEdit.images_text || '',
    })
    setEditId(pendingEdit.id)
    setDeleteId(null)
    setMode('edit')
    setStatus(null)
    setOpen(true)
    onConsumed()
  }, [pendingEdit])

  // When Dashboard passes a pendingDelete, load it and open panel
  useEffect(() => {
    if (!pendingDelete) return
    setDeleteId(pendingDelete.id)
    setDeleteName(pendingDelete.name)
    setEditId(null)
    setForm(emptyForm)
    setMode('delete')
    setStatus(null)
    setOpen(true)
    onConsumed()
  }, [pendingDelete])

  const reset = () => {
    setForm(emptyForm)
    setEditId(null)
    setDeleteId(null)
    setDeleteName('')
    setStatus(null)
  }

  const switchMode = (m) => {
    reset()
    setMode(m)
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────

  const handleAdd = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus(null)
    const payload = {
      name: form.name.trim(),
      entity_type: form.entity_type,
      latitude: parseFloat(form.latitude),
      longitude: parseFloat(form.longitude),
      admin_id: session.user.id,
      ...(form.description.trim() && { description: form.description.trim() }),
      ...(form.images_text.trim() && { images_text: form.images_text.trim() }),
    }
    const { error } = await supabase.from('entities').insert([payload])
    setLoading(false)
    if (error) {
      setStatus({ type: 'error', msg: error.message })
    } else {
      setStatus({ type: 'success', msg: `"${payload.name}" added successfully.` })
      setForm(emptyForm)
      onEntityChange?.()
    }
  }

  const handleEditSave = async (e) => {
    e.preventDefault()
    if (!editId) return
    setLoading(true)
    setStatus(null)
    const payload = {
      name: form.name.trim(),
      entity_type: form.entity_type,
      latitude: parseFloat(form.latitude),
      longitude: parseFloat(form.longitude),
      description: form.description.trim() || null,
      images_text: form.images_text.trim() || null,
    }
    const { error } = await supabase.from('entities').update(payload).eq('id', editId)
    setLoading(false)
    if (error) {
      setStatus({ type: 'error', msg: error.message })
    } else {
      setStatus({ type: 'success', msg: `"${payload.name}" updated.` })
      onEntityChange?.()
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setLoading(true)
    setStatus(null)
    const { error } = await supabase.from('entities').delete().eq('id', deleteId)
    setLoading(false)
    if (error) {
      setStatus({ type: 'error', msg: error.message })
    } else {
      setStatus({ type: 'success', msg: `"${deleteName}" deleted.` })
      reset()
      setMode('add')
      onEntityChange?.()
    }
  }

  // ── Collapsed FAB ─────────────────────────────────────────────────────────

  if (!open) {
    return (
      <button className="ap-fab" onClick={() => { setMode('add'); reset(); setOpen(true) }} title="Admin Panel">
        <span className="ap-fab-icon">⚙</span>
        <span className="ap-fab-label">Admin</span>
      </button>
    )
  }

  // ── Expanded panel ────────────────────────────────────────────────────────

  return (
    <div className="ap-panel">
      <div className="ap-header">
        <div className="ap-header-left">
          <span className="ap-badge">ADMIN</span>
          <h2 className="ap-title">Manage Entities</h2>
        </div>
        <button className="ap-close" onClick={() => { setOpen(false); reset() }}>✕</button>
      </div>

      <div className="ap-tabs">
        {[['add', '＋ Add'], ['edit', '✎ Edit'], ['delete', '✕ Delete']].map(([m, label]) => (
          <button
            key={m}
            className={`ap-tab ${mode === m ? 'active' : ''}`}
            onClick={() => switchMode(m)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="ap-body">

        {mode === 'add' && (
          <EntityForm
            form={form}
            setForm={setForm}
            onSubmit={handleAdd}
            submitLabel="Add Entity"
            status={status}
            loading={loading}
          />
        )}

        {mode === 'edit' && (
          editId ? (
            <>
              <p className="ap-hint">
                Editing: <strong>{form.name || '—'}</strong>
              </p>
              <EntityForm
                form={form}
                setForm={setForm}
                onSubmit={handleEditSave}
                submitLabel="Save Changes"
                status={status}
                loading={loading}
              />
            </>
          ) : (
            <p className="ap-hint">Click the <strong>✎</strong> button on any entity card to edit it.</p>
          )
        )}

        {mode === 'delete' && (
          deleteId ? (
            <div className="ap-delete-confirm">
              <div className="ap-delete-warning">⚠️</div>
              <p className="ap-delete-msg">
                Permanently delete <strong>"{deleteName}"</strong>?<br />
                <span className="ap-delete-sub">This will also remove all associated reviews.</span>
              </p>
              {status && (
                <div className={`ap-status ap-status--${status.type}`}>{status.msg}</div>
              )}
              <div className="ap-delete-actions">
                <button className="ap-btn-ghost" onClick={() => { reset(); setMode('add') }}>
                  Cancel
                </button>
                <button className="ap-btn-danger" onClick={handleDelete} disabled={loading}>
                  {loading ? 'Deleting…' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          ) : (
            <p className="ap-hint">Click the <strong>✕</strong> button on any entity card to delete it.</p>
          )
        )}

      </div>
    </div>
  )
}

export default AdminPanel