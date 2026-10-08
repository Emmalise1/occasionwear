import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Modal } from '../../components/Modal'
import { EmptyState, ErrorState, LoadingState } from '../../components/States'
import { StatusBadge } from '../../components/StatusBadge'
import { ImageWithFallback } from '../../components/ImageWithFallback'
import { adminService } from '../../services/adminService'
import type { Outfit, OutfitCategory, OutfitPayload, OutfitStatus } from '../../types'
import {
  CATEGORY_LABELS,
  OUTFIT_STATUS_LABELS,
  defaultRentalPeriod,
  errorMessage,
  formatRentalPeriod,
  formatRWF,
} from '../../utils/format'

const CATEGORIES = Object.keys(CATEGORY_LABELS) as OutfitCategory[]
const STATUSES = Object.keys(OUTFIT_STATUS_LABELS) as OutfitStatus[]
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'ONE SIZE', 'EU 38']

interface FormState {
  name: string
  category: OutfitCategory
  size: string
  color: string
  /** Fixed total price for the rental period (RWF) — never a daily rate. */
  rentalPrice: string
  /** Rental period in days — defaults by category: wedding → 5, other → 3. */
  rentalPeriodDays: string
  depositAmount: string
  imageUrl: string
  description: string
  status: OutfitStatus
}

const emptyForm: FormState = {
  name: '',
  category: 'WEDDING_GUEST',
  size: 'M',
  color: '',
  rentalPrice: '',
  rentalPeriodDays: String(defaultRentalPeriod('WEDDING_GUEST')),
  depositAmount: '',
  imageUrl: '',
  description: '',
  status: 'AVAILABLE',
}

export function AdminInventoryPage() {
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // filters
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [size, setSize] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  // editor
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<Outfit | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [retiring, setRetiring] = useState<Outfit | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    adminService
      .listOutfits({
        search: search || undefined,
        category: (category || undefined) as OutfitCategory | undefined,
        status: (status || undefined) as OutfitStatus | undefined,
        size: size || undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
      })
      .then(setOutfits)
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false))
  }, [search, category, status, size, minPrice, maxPrice])

  useEffect(load, [load])

  const clearFilters = () => {
    setSearch('')
    setCategory('')
    setStatus('')
    setSize('')
    setMinPrice('')
    setMaxPrice('')
  }

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setFormError(null)
    setEditorOpen(true)
  }

  const openEdit = (outfit: Outfit) => {
    setEditing(outfit)
    setForm({
      name: outfit.name,
      category: outfit.category,
      size: outfit.size,
      color: outfit.color,
      rentalPrice: String(outfit.rentalPrice),
      rentalPeriodDays: String(outfit.rentalPeriodDays),
      depositAmount: String(outfit.depositAmount),
      imageUrl: outfit.imageUrl,
      description: outfit.description ?? '',
      status: outfit.status,
    })
    setFormError(null)
    setEditorOpen(true)
  }

  /** Category drives the default rental period: wedding → 5 days, others → 3. */
  const changeCategory = (category: OutfitCategory) => {
    setForm((current) => ({
      ...current,
      category,
      rentalPeriodDays: String(defaultRentalPeriod(category)),
    }))
  }

  /** Converts an uploaded file into a compact data URL (kept in imageUrl). */
  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const maxW = 700
        const scale = Math.min(1, maxW / img.width)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        setForm((current) => ({
          ...current,
          imageUrl: canvas.toDataURL('image/jpeg', 0.75),
        }))
      }
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const submitForm = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)

    if (!form.name.trim()) return setFormError('Name is required.')
    if (!form.color.trim()) return setFormError('Colour is required.')
    if (!form.size.trim()) return setFormError('Size is required.')
    if (!(Number(form.rentalPrice) > 0)) return setFormError('Rental price must be positive.')
    if (!Number.isInteger(Number(form.rentalPeriodDays)) || Number(form.rentalPeriodDays) < 1)
      return setFormError('Rental period must be at least 1 day.')
    if (!(Number(form.depositAmount) > 0)) return setFormError('Deposit must be positive.')
    if (!form.imageUrl.trim()) return setFormError('Every outfit needs an image (URL or upload).')

    const payload: OutfitPayload = {
      name: form.name.trim(),
      category: form.category,
      size: form.size.trim(),
      color: form.color.trim(),
      // One fixed price for the whole rental period — never a daily rate.
      rentalPrice: Number(form.rentalPrice),
      rentalPeriodDays: Number(form.rentalPeriodDays),
      depositAmount: Number(form.depositAmount),
      imageUrl: form.imageUrl.trim(),
      description: form.description.trim() || undefined,
      status: form.status,
    }

    setSaving(true)
    try {
      if (editing) {
        await adminService.updateOutfit(editing.id, payload)
        setNotice(`${payload.name} updated.`)
      } else {
        await adminService.createOutfit(payload)
        setNotice(`${payload.name} added to the collection.`)
      }
      setEditorOpen(false)
      load()
    } catch (err) {
      setFormError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const retire = async () => {
    if (!retiring) return
    setBusyId(retiring.id)
    try {
      await adminService.retireOutfit(retiring.id)
      setNotice(`${retiring.name} retired (removed from the storefront, record kept).`)
      setRetiring(null)
      load()
    } catch (err) {
      setError(errorMessage(err))
      setRetiring(null)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-caps text-gold-dark">Catalogue</p>
          <h1 className="mt-2 text-3xl text-ink">Inventory</h1>
        </div>
        <button type="button" className="btn-gold" onClick={openCreate}>
          + Add outfit
        </button>
      </header>

      {/* ---------------- Filters ---------------- */}
      <form className="card mt-6 grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-6" aria-label="Inventory filters" onSubmit={(e) => { e.preventDefault(); load() }}>
        <div className="lg:col-span-2">
          <label htmlFor="inv-search" className="label-caps">Search</label>
          <input
            id="inv-search"
            className="input-field mt-1.5"
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="inv-category" className="label-caps">Category</label>
          <select id="inv-category" className="input-field mt-1.5" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="inv-status" className="label-caps">Status</label>
          <select id="inv-status" className="input-field mt-1.5" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            {STATUSES.map((s) => <option key={s} value={s}>{OUTFIT_STATUS_LABELS[s]}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="inv-size" className="label-caps">Size</label>
          <select id="inv-size" className="input-field mt-1.5" value={size} onChange={(e) => setSize(e.target.value)}>
            <option value="">All</option>
            {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="inv-min" className="label-caps">Min</label>
            <input id="inv-min" type="number" min="0" className="input-field mt-1.5" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
          </div>
          <div>
            <label htmlFor="inv-max" className="label-caps">Max</label>
            <input id="inv-max" type="number" min="0" className="input-field mt-1.5" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
          </div>
        </div>
        <div className="sm:col-span-2 lg:col-span-6 flex justify-end">
          <button type="button" className="text-xs font-semibold uppercase tracking-[0.16em] text-burgundy hover:underline" onClick={clearFilters}>
            Clear filters
          </button>
        </div>
      </form>

      {notice && (
        <div role="status" className="mt-5 flex items-start justify-between gap-4 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss">✕</button>
        </div>
      )}

      {/* ---------------- Table ---------------- */}
      <div className="mt-6" aria-live="polite">
        {loading && <LoadingState label="Loading inventory" />}
        {!loading && error && <ErrorState message={error} onRetry={load} />}
        {!loading && !error && outfits.length === 0 && (
          <EmptyState
            title="No outfits match your filters"
            message="Adjust the filters or add a new outfit to the collection."
            action={<button type="button" className="btn-outline" onClick={openCreate}>+ Add outfit</button>}
          />
        )}

        {!loading && !error && outfits.length > 0 && (
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="border-b border-taupe bg-taupe/25 text-[11px] uppercase tracking-[0.14em] text-ink/60">
                <tr>
                  <th scope="col" className="px-4 py-3">Image</th>
                  <th scope="col" className="px-4 py-3">Name</th>
                  <th scope="col" className="px-4 py-3">Category</th>
                  <th scope="col" className="px-4 py-3">Size</th>
                  <th scope="col" className="px-4 py-3">Colour</th>
                  <th scope="col" className="px-4 py-3 text-right">Rental price</th>
                  <th scope="col" className="px-4 py-3 text-right">Period</th>
                  <th scope="col" className="px-4 py-3 text-right">Deposit</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-taupe">
                {outfits.map((outfit) => (
                  <tr key={outfit.id} className="bg-white transition hover:bg-ivory">
                    <td className="px-4 py-2.5">
                      <ImageWithFallback
                        src={outfit.imageUrl}
                        alt={outfit.name}
                        label={outfit.name}
                        className="h-14 w-11 rounded object-cover"
                      />
                    </td>
                    <td className="px-4 py-2.5 font-medium text-ink">{outfit.name}</td>
                    <td className="px-4 py-2.5 text-ink/70">{CATEGORY_LABELS[outfit.category]}</td>
                    <td className="px-4 py-2.5 text-ink/70">{outfit.size}</td>
                    <td className="px-4 py-2.5 text-ink/70">{outfit.color}</td>
                    <td className="px-4 py-2.5 text-right text-ink">{formatRWF(outfit.rentalPrice)}</td>
                    <td className="px-4 py-2.5 text-right text-ink/70">{formatRentalPeriod(outfit.rentalPeriodDays)}</td>
                    <td className="px-4 py-2.5 text-right text-ink">{formatRWF(outfit.depositAmount)}</td>
                    <td className="px-4 py-2.5"><StatusBadge kind="outfit" value={outfit.status} /></td>
                    <td className="px-4 py-2.5">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="rounded-md border border-taupe px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink/70 transition hover:border-ink hover:text-ink"
                          onClick={() => openEdit(outfit)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={outfit.status === 'RETIRED'}
                          className="rounded-md border border-burgundy/40 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-burgundy transition hover:bg-burgundy hover:text-ivory disabled:cursor-not-allowed disabled:opacity-40"
                          onClick={() => setRetiring(outfit)}
                        >
                          Retire
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ---------------- Add / edit modal ---------------- */}
      <Modal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={editing ? `Edit · ${editing.name}` : 'Add outfit'}
        wide
      >
        <form onSubmit={submitForm} className="space-y-4 text-sm" noValidate>
          {formError && (
            <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-red-700">
              {formError}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="of-name" className="label-caps">Name *</label>
              <input id="of-name" className="input-field mt-1.5" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>

            <div>
              <label htmlFor="of-category" className="label-caps">Category *</label>
              <select id="of-category" className="input-field mt-1.5" value={form.category} onChange={(e) => changeCategory(e.target.value as OutfitCategory)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
              </select>
              <p className="mt-1 text-xs text-ink/50">Wedding categories default to a 5-day rental period; all others to 3 days.</p>
            </div>

            <div>
              <label htmlFor="of-size" className="label-caps">Size *</label>
              <select id="of-size" className="input-field mt-1.5" value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })}>
                {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="of-color" className="label-caps">Colour *</label>
              <input id="of-color" className="input-field mt-1.5" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
            </div>

            <div>
              <label htmlFor="of-status" className="label-caps">Status</label>
              <select id="of-status" className="input-field mt-1.5" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as OutfitStatus })}>
                {STATUSES.filter((s) => !(editing?.status === 'RETIRED' && s !== 'RETIRED')).map((s) => (
                  <option key={s} value={s}>{OUTFIT_STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="of-price" className="label-caps">Rental price (RWF) *</label>
              <input id="of-price" type="number" min="1" className="input-field mt-1.5" value={form.rentalPrice} onChange={(e) => setForm({ ...form, rentalPrice: e.target.value })} />
              <p className="mt-1 text-xs text-ink/50">Fixed price for the whole rental period — never charged per day.</p>
            </div>

            <div>
              <label htmlFor="of-period" className="label-caps">Rental period (days) *</label>
              <input id="of-period" type="number" min="1" step="1" className="input-field mt-1.5" value={form.rentalPeriodDays} onChange={(e) => setForm({ ...form, rentalPeriodDays: e.target.value })} />
              <p className="mt-1 text-xs text-ink/50">Defaults by category (wedding 5 · others 3) — adjust only if needed.</p>
            </div>

            <div>
              <label htmlFor="of-deposit" className="label-caps">Refundable deposit (RWF) *</label>
              <input id="of-deposit" type="number" min="1" className="input-field mt-1.5" value={form.depositAmount} onChange={(e) => setForm({ ...form, depositAmount: e.target.value })} />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="of-image" className="label-caps">Image URL *</label>
              <input id="of-image" className="input-field mt-1.5" placeholder="/images/… or https://…" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
            </div>

            <div className="sm:col-span-2">
              <span className="label-caps">Or upload an image</span>
              <div className="mt-1.5 flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFile(file)
                  }}
                />
                <button
                  type="button"
                  className="btn-outline px-4 py-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose file
                </button>
                <span className="text-xs text-ink/50">Images are resized and embedded automatically.</span>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="of-desc" className="label-caps">Description</label>
              <textarea id="of-desc" rows={3} className="input-field mt-1.5" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>

          {form.imageUrl && (
            <div className="flex items-center gap-4 rounded-md border border-taupe bg-white p-3">
              <ImageWithFallback src={form.imageUrl} alt="Preview" label={form.name || 'Preview'} className="h-24 w-20 rounded object-cover" />
              <div className="text-xs text-ink/60">
                <p className="font-semibold text-ink">Image preview</p>
                <p className="mt-1 break-all">{form.imageUrl.startsWith('data:') ? 'Uploaded image (embedded)' : form.imageUrl}</p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-outline px-4 py-2" onClick={() => setEditorOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary px-4 py-2" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Add outfit'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ---------------- Retire confirm ---------------- */}
      <Modal open={retiring !== null} onClose={() => setRetiring(null)} title="Retire this outfit?">
        {retiring && (
          <div className="space-y-4 text-sm text-ink/70">
            <p>
              <strong className="text-ink">{retiring.name}</strong> will be marked{' '}
              <strong className="text-ink">RETIRED</strong> and removed from the storefront. The
              record is kept — nothing is deleted from the database.
            </p>
            <div className="flex justify-end gap-3">
              <button type="button" className="btn-outline px-4 py-2" onClick={() => setRetiring(null)}>
                Keep outfit
              </button>
              <button type="button" className="btn-primary px-4 py-2" onClick={retire} disabled={busyId === retiring.id}>
                {busyId === retiring.id ? 'Retiring…' : 'Retire outfit'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
