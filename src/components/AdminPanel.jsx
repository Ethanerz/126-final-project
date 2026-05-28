import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { UserAuth } from '../context/AuthContext'
import Icon from './ui/Icon'
import '../styles/AdminPanel.css'

const ENTITY_TYPES = ['facility', 'service']

const emptyForm = {
  name: '',
  entity_type: 'facility',
  latitude: '',
  longitude: '',
  description: '',
  image_link: '',
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
            <Icon name={t === 'facility' ? 'building' : 'bell'} size={16} />
            {t === 'facility' ? 'Facility' : 'Service'}
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
      <label className="ap-label">Image link</label>
      <input
        className="ap-input"
        type="url"
        placeholder="https://i.imgur.com/abc123.jpg"
        value={form.image_link}
        onChange={(e) => setForm((f) => ({ ...f, image_link: e.target.value }))}
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
      image_link: pendingEdit.image_link || '',
    })
    setEditId(pendingEdit.id)
    setDeleteId(null)
    setMode('edit')
    setStatus(null)
    setOpen(true)
    onConsumed()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  // Every write uses .select() so we can inspect the affected rows. Without it,
  // an RLS-blocked update/delete returns { error: null } while changing 0 rows —
  // which previously showed a false "success" even though nothing was saved.

  const PERMISSION_HINT =
    'No rows were affected. You may not have permission to modify this entity (admins can only manage entities they own).'

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
      description: form.description.trim() || null,
      image_link: form.image_link.trim() || null,
    }
    const { data, error } = await supabase.from('entities').insert([payload]).select()
    setLoading(false)
    if (error) {
      setStatus({ type: 'error', msg: error.message })
    } else if (!data || data.length === 0) {
      setStatus({ type: 'error', msg: PERMISSION_HINT })
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
      image_link: form.image_link.trim() || null,
    }
    const { data, error } = await supabase
      .from('entities')
      .update(payload)
      .eq('id', editId)
      .select()
    setLoading(false)
    if (error) {
      setStatus({ type: 'error', msg: error.message })
    } else if (!data || data.length === 0) {
      setStatus({ type: 'error', msg: PERMISSION_HINT })
    } else {
      setStatus({ type: 'success', msg: `"${payload.name}" updated.` })
      onEntityChange?.()
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    const name = deleteName
    setLoading(true)
    setStatus(null)
    const { data, error } = await supabase
      .from('entities')
      .delete()
      .eq('id', deleteId)
      .select()
    setLoading(false)
    if (error) {
      setStatus({ type: 'error', msg: error.message })
    } else if (!data || data.length === 0) {
      setStatus({ type: 'error', msg: PERMISSION_HINT })
    } else {
      // reset() clears status, so switch mode and reset first, then set the banner
      reset()
      setMode('add')
      setStatus({ type: 'success', msg: `"${name}" deleted.` })
      onEntityChange?.()
    }
  }

  // ── Collapsed FAB ─────────────────────────────────────────────────────────

  if (!open) {
    return (
      <button className="ap-fab" onClick={() => { setMode('add'); reset(); setOpen(true) }} title="Admin panel">
        <Icon name="building" size={16} />
        <span className="ap-fab-label">Admin</span>
      </button>
    )
  }

  // ── Expanded panel ────────────────────────────────────────────────────────

  return (
    <div className="ap-panel">
      <div className="ap-header">
        <div className="ap-header-left">
          <span className="ap-badge">Admin</span>
          <h2 className="ap-title">Manage entities</h2>
        </div>
        <button className="ap-close" onClick={() => { setOpen(false); reset() }} aria-label="Close admin panel">
          <Icon name="close" size={18} stroke="var(--rupv-cream)" />
        </button>
      </div>

      <div className="ap-tabs">
        {[
          { m: 'add', icon: 'plus', label: 'Add' },
          { m: 'edit', icon: 'edit', label: 'Edit' },
          { m: 'delete', icon: 'trash', label: 'Delete' },
        ].map(({ m, icon, label }) => (
          <button
            key={m}
            className={`ap-tab ${mode === m ? 'active' : ''}`}
            onClick={() => switchMode(m)}
          >
            <Icon name={icon} size={15} /> {label}
          </button>
        ))}
      </div>

      <div className="ap-body">

        {mode === 'add' && (
          <EntityForm
            form={form}
            setForm={setForm}
            onSubmit={handleAdd}
            submitLabel="Add entity"
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
                submitLabel="Save changes"
                status={status}
                loading={loading}
              />
            </>
          ) : (
            <p className="ap-hint">Select the edit button on any entity card to load it here.</p>
          )
        )}

        {mode === 'delete' && (
          deleteId ? (
            <div className="ap-delete-confirm">
              <div className="ap-delete-warning">
                <Icon name="trash" size={36} stroke="var(--rupv-maroon)" />
              </div>
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
                  {loading ? 'Deleting…' : 'Yes, delete'}
                </button>
              </div>
            </div>
          ) : (
            <p className="ap-hint">Select the delete button on any entity card to remove it.</p>
          )
        )}

      </div>
    </div>
  )
}

export default AdminPanel
