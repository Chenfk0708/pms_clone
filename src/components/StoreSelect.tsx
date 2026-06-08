import { useEffect, useId, useMemo, useRef, useState } from 'react'

export type StoreSelectOption = {
  id: string
  name: string
}

export type StoreSelectInputOption = {
  id?: string
  value?: string
  name?: string
  label?: string
}

type StoreSelectProps = {
  label: string
  options: StoreSelectOption[]
  value: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (storeId: string) => void
  disabled?: boolean
}

export function StoreSelect({ label, options, value, open, onOpenChange, onSelect, disabled }: StoreSelectProps) {
  const listboxId = useId()
  const normalizedOptions = options.length > 0 ? options : [{ id: 'all', name: '全部门店' }]
  const selectedStore = normalizedOptions.find((option) => option.id === value) ?? normalizedOptions[0]
  const hasValue = selectedStore.id !== normalizedOptions[0]?.id

  return (
    <div className={`month-store-select${hasValue ? ' has-value' : ''}`}>
      <button
        type="button"
        className="month-store-select__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        disabled={disabled}
        title={selectedStore.name}
        onClick={() => onOpenChange(!open)}
      >
        <span>{selectedStore.name}</span>
        <i aria-hidden="true" />
      </button>
      {open ? (
        <div id={listboxId} className="month-store-select__options" role="listbox" aria-label={label}>
          {normalizedOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              role="option"
              aria-selected={value === option.id}
              className="month-store-select__option"
              title={option.name}
              onClick={() => {
                onSelect(option.id)
                onOpenChange(false)
              }}
            >
              {option.name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

type StoreSelectControlProps = {
  label?: string
  options?: StoreSelectInputOption[]
  value?: string
  onChange: (storeId: string, option: StoreSelectOption) => void
  disabled?: boolean
  className?: string
  settingsLabel?: string
  onSettingsClick?: () => void
}

export function StoreSelectControl({
  label = '门店范围',
  options = [],
  value = 'all',
  onChange,
  disabled,
  className = '',
  settingsLabel = '门店设置',
  onSettingsClick,
}: StoreSelectControlProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const normalizedOptions = useMemo(() => normalizeStoreSelectOptions(options), [options])
  const normalizedValue = normalizeStoreValue(value)

  useEffect(() => {
    if (!open) return undefined

    const closeByKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    const closeByPointer = (event: MouseEvent) => {
      const target = event.target
      if (target instanceof Node && rootRef.current?.contains(target)) return
      setOpen(false)
    }

    window.addEventListener('keydown', closeByKey)
    window.addEventListener('click', closeByPointer)
    return () => {
      window.removeEventListener('keydown', closeByKey)
      window.removeEventListener('click', closeByPointer)
    }
  }, [open])

  return (
    <div
      ref={rootRef}
      className={[
        'month-store-control',
        onSettingsClick ? 'month-store-control--with-settings' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <StoreSelect
        label={label}
        options={normalizedOptions}
        value={normalizedValue}
        open={open}
        onOpenChange={setOpen}
        onSelect={(storeId) => {
          const option = normalizedOptions.find((item) => item.id === storeId) ?? normalizedOptions[0]
          onChange(storeId, option)
        }}
        disabled={disabled}
      />
      {onSettingsClick ? (
        <button type="button" className="month-store-settings" aria-label={settingsLabel} onClick={onSettingsClick}>
          <span aria-hidden="true">⚙</span>
        </button>
      ) : null}
    </div>
  )
}

export function normalizeStoreSelectOptions(options: StoreSelectInputOption[] = []): StoreSelectOption[] {
  const normalized = options.map((option) => {
    const id = normalizeStoreValue(option.id ?? option.value ?? '')
    const name = normalizeStoreLabel(option.name ?? option.label, id)
    return { id, name }
  })

  if (!normalized.some((option) => option.id === 'all')) {
    normalized.unshift({ id: 'all', name: '全部门店' })
  }

  const seen = new Set<string>()
  return normalized.filter((option) => {
    if (!option.id || seen.has(option.id)) return false
    seen.add(option.id)
    return true
  })
}

function normalizeStoreValue(value: string | undefined) {
  const normalized = value?.trim()
  if (!normalized || normalized === 'ALL') return 'all'
  return normalized
}

function normalizeStoreLabel(label: string | undefined, id: string) {
  const normalized = label?.trim()
  if (normalized) return normalized
  return id === 'all' ? '全部门店' : id
}
