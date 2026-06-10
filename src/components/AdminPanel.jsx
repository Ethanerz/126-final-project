import { useEffect, useRef, useState } from 'react'
import { supabase } from '../supabaseClient'
import { UserAuth } from '../context/AuthContext'
import Button from './ui/Button'
import Icon from './ui/Icon'
import { useModalA11y } from '../hooks/useModalA11y'
import '../styles/AdminPanel.css'

const ENTITY_TYPES = ['facility', 'service']
const NAME_MAX = 120
const DESC_MAX = 500

const emptyForm = {
  name: '',
  entity_type: 'facility',
  latitude: '',
  longitude: '',
  description: '',
  image_link: '',
}

// ── Defined OUTSIDE the panel so inputs never remount on parent re-render ────

const Field = ({ label, name, type = 'text', placeholder, required, form, setForm, inputProps }) => (
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
      {...inputProps}
    />
  </div>
)

// EntityForm owns its field state, seeded from `initial` — the parent remounts
// it (via key) when the target entity changes, so no copy-into-state effects.
const EntityForm = ({ initial, onSubmit, submitLabel, status, loading }) => {
  const [form, setForm] = useState(() =>
    initial
      ? {
          name: initial.name || '',
          entity_type: initial.entity_type || 'facility',
          latitude: initial.latitude ?? '',
          longitude: initial.longitude ?? '',
          description: initial.description || '',
          image_link: initial.image_link || '',
        }
      : emptyForm
  )
  const [localError, setLocalError] = useState(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    const name = form.name.trim()
    const latitude = parseFloat(form.latitude)
    const longitude = parseFloat(form.longitude)

    if (!name) {
      setLocalError("The name can't be just spaces.")
      return
    }
    if (Number.isNaN(latitude) || latitude < -90 || latitude > 90) {
      setLocalError('Latitude must be a number between -90 and 90.')
      return
    }
    if (Number.isNaN(longitude) || longitude < -180 || longitude > 180) {
      setLocalError('Longitude must be a number between -180 and 180.')
      return
    }
    setLocalError(null)
    onSubmit({
      name,
      entity_type: form.entity_type,
      latitude,
      longitude,
      description: form.description.trim() || null,
      image_link: form.image_link.trim() || null,
    })
  }

  return (
    <form className="ap-form" onSubmit={handleSubmit}>
      <Field
        label="Name" name="name" placeholder="e.g. Main Library" required
        form={form} setForm={setForm} inputProps={{ maxLength: NAME_MAX }}
      />
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
        <Field
          label="Latitude" name="latitude" type="number" placeholder="10.6419" required
          form={form} setForm={setForm} inputProps={{ min: -90, max: 90 }}
        />
        <Field
          label="Longitude" name="longitude" type="number" placeholder="122.5854" required
          form={form} setForm={setForm} inputProps={{ min: -180, max: 180 }}
        />
      </div>
      <div className="ap-field">
        <label className="ap-label">Description</label>
        <textarea
          className="ap-input ap-textarea"
          placeholder="Brief description (optional)"
          value={form.description}
          maxLength={DESC_MAX}
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
      {(localError || status) && (
        <div
          className={`rupv-alert rupv-alert--${localError ? 'error' : status.type}`}
          role="alert"
        >
          {localError || status.msg}
        </div>
      )}
      <Button type="submit" variant="primary" size="md" block loading={loading}>
        {loading ? 'Saving…' : submitLabel}
      </Button>
    </form>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
// pendingEdit / pendingDelete: entity objects passed from Dashboard card
// buttons. They stay set while the panel works with them; the panel calls
// onConsumed when it is done with them (close, tab switch, delete done).

const AdminPanel = ({ onEntityChange, pendingEdit, pendingDelete, onConsumed }) => {
  const { session } = UserAuth()
  const [internalOpen, setInternalOpen] = useState(false)
  const [internalMode, setInternalMode] = useState('add')
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [closing, setClosing] = useState(false)
  const [addFormKey, setAddFormKey] = useState(0)
  const cardRef = useRef(null)

  // Pending intents from the Dashboard cards take priority over local state.
  const open = internalOpen || !!pendingEdit || !!pendingDelete
  const mode = pendingDelete ? 'delete' : pendingEdit ? 'edit' : internalMode

  // Escape to close + lock body scroll while the modal is open (like AuthModal).
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') setClosing(true) }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  // Focus trap + restore while open.
  useModalA11y(cardRef, open)

  const switchMode = (m) => {
    setInternalMode(m)
    setInternalOpen(true)
    setStatus(null)
    onConsumed?.()
  }

  // Play the exit animation, then actually close (mirrors AuthModal).
  const requestClose = () => setClosing(true)
  const handleScrimAnimEnd = (e) => {
    if (e.target === e.currentTarget && closing) {
      setClosing(false)
      setInternalOpen(false)
      setInternalMode('add')
      setStatus(null)
      onConsumed?.()
    }
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────
  // Every write uses .select() so we can inspect the affected rows. Without it,
  // an RLS-blocked update/delete returns { error: null } while changing 0 rows —
  // which previously showed a false "success" even though nothing was saved.

  const PERMISSION_HINT =
    'No rows were affected. You may not have permission to modify this entity (admins can only manage entities they own).'

  const handleAdd = async (payload) => {
    setLoading(true)
    setStatus(null)
    const { data, error } = await supabase
      .from('entities')
      .insert([{ ...payload, admin_id: session.user.id }])
      .select()
    setLoading(false)
    if (error) {
      setStatus({ type: 'error', msg: error.message })
    } else if (!data || data.length === 0) {
      setStatus({ type: 'error', msg: PERMISSION_HINT })
    } else {
      setStatus({ type: 'success', msg: `"${payload.name}" added successfully.` })
      setAddFormKey((k) => k + 1) // remount the add form empty
      onEntityChange?.()
    }
  }

  const handleEditSave = async (payload) => {
    if (!pendingEdit) return
    setLoading(true)
    setStatus(null)
    const { data, error } = await supabase
      .from('entities')
      .update(payload)
      .eq('id', pendingEdit.id)
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
    if (!pendingDelete) return
    const name = pendingDelete.name
    setLoading(true)
    setStatus(null)
    const { data, error } = await supabase
      .from('entities')
      .delete()
      .eq('id', pendingDelete.id)
      .select()
    setLoading(false)
    if (error) {
      setStatus({ type: 'error', msg: error.message })
    } else if (!data || data.length === 0) {
      setStatus({ type: 'error', msg: PERMISSION_HINT })
    } else {
      // Land back on the Add tab with a success banner.
      setInternalMode('add')
      setInternalOpen(true)
      setStatus({ type: 'success', msg: `"${name}" deleted.` })
      onConsumed?.()
      onEntityChange?.()
    }
  }

  const cancelDelete = () => {
    setInternalMode('add')
    setInternalOpen(true)
    setStatus(null)
    onConsumed?.()
  }

  // ── Collapsed FAB ─────────────────────────────────────────────────────────

  if (!open) {
    return (
      <button
        className="ap-fab"
        onClick={() => { setInternalMode('add'); setStatus(null); setInternalOpen(true) }}
        title="Admin panel"
      >
        <Icon name="building" size={16} />
        <span className="ap-fab-label">Admin</span>
      </button>
    )
  }

  // ── Expanded panel ────────────────────────────────────────────────────────

  return (
    <div
      className={`rupv-modal-scrim${closing ? ' is-closing' : ''}`}
      onMouseDown={(e) => { if (e.target === e.currentTarget) requestClose() }}
      onAnimationEnd={handleScrimAnimEnd}
    >
      <div
        ref={cardRef}
        className={`rupv-modal ap-modal${closing ? ' is-closing' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ap-modal-title"
      >
        <div className="ap-header">
          <div className="ap-header-left">
            <span className="ap-badge">Admin</span>
            <h2 className="ap-title" id="ap-modal-title">Manage entities</h2>
          </div>
          <button className="ap-close" onClick={requestClose} aria-label="Close admin panel">
            <Icon name="close" size={18} stroke="var(--rupv-cream)" />
          </button>
        </div>

        <div className="ap-tabs" role="tablist" aria-label="Entity actions">
          {[
            { m: 'add', icon: 'plus', label: 'Add' },
            { m: 'edit', icon: 'edit', label: 'Edit' },
            { m: 'delete', icon: 'trash', label: 'Delete' },
          ].map(({ m, icon, label }) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
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
              key={`add-${addFormKey}`}
              onSubmit={handleAdd}
              submitLabel="Add entity"
              status={status}
              loading={loading}
            />
          )}

          {mode === 'edit' && (
            pendingEdit ? (
              <>
                <p className="ap-hint">
                  Editing: <strong>{pendingEdit.name || '—'}</strong>
                </p>
                <EntityForm
                  key={`edit-${pendingEdit.id}`}
                  initial={pendingEdit}
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
            pendingDelete ? (
              <div className="ap-delete-confirm">
                <div className="ap-delete-warning">
                  <Icon name="trash" size={36} stroke="var(--rupv-maroon)" />
                </div>
                <p className="ap-delete-msg">
                  Permanently delete <strong>"{pendingDelete.name}"</strong>?<br />
                  <span className="ap-delete-sub">This will also remove all associated reviews.</span>
                </p>
                {status && (
                  <div className={`rupv-alert rupv-alert--${status.type}`} role="alert">{status.msg}</div>
                )}
                <div className="ap-delete-actions">
                  <Button variant="ghost" size="md" onClick={cancelDelete}>
                    Cancel
                  </Button>
                  <Button variant="danger" size="md" onClick={handleDelete} loading={loading}>
                    {loading ? 'Deleting…' : 'Yes, delete'}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="ap-hint">Select the delete button on any entity card to remove it.</p>
            )
          )}

        </div>
      </div>
    </div>
  )
}

export default AdminPanel
