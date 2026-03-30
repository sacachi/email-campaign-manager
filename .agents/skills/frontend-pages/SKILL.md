# Skill: Frontend Pages & Components (PrimeReact + PrimeFlex)

## Stack
- **UI components**: PrimeReact 10+ (`primereact/...`)
- **Layout/spacing**: PrimeFlex utility classes (NOT Tailwind)
- **Icons**: PrimeIcons (`pi pi-*`) + Material Symbols Outlined (`<span className="material-symbols-outlined">`)
- **Theme**: `lara-light-blue`
- **State**: Zustand, React Query (`@tanstack/react-query`)

---

## Layout Conventions

### Page wrapper — NO extra container div needed (AppLayout already provides padding)
```tsx
// Every page starts with a header then sections
<div>
  {/* Page header */}
  <div className="flex align-items-center justify-content-between mb-4">
    <div>
      <h1 className="text-2xl font-bold text-900 m-0">Page Title</h1>
      <p className="text-500 text-sm m-0 mt-1">Subtitle</p>
    </div>
    <Button label="Action" icon="pi pi-plus" />
  </div>

  {/* Content sections */}
  <div className="surface-card border-round-xl shadow-1 p-4 mb-4">
    ...
  </div>
</div>
```

### Section card (replaces plain divs/Panel/Fieldset)
```tsx
<div className="surface-card border-round-xl shadow-1 p-4 mb-4">
  {/* Section header */}
  <div className="flex align-items-center gap-2 mb-4 pb-3" style={{ borderBottom: '1px solid #e2e8f0' }}>
    <i className="pi pi-envelope" style={{ color: 'var(--primary-color)', fontSize: '1.1rem' }} />
    <span className="font-semibold text-900">Section Title</span>
  </div>
  {/* Content */}
</div>
```

### Two-column grid (PrimeFlex)
```tsx
<div className="grid">
  <div className="col-12 md:col-6"> ... </div>
  <div className="col-12 md:col-6"> ... </div>
</div>
```

---

## Form Field Patterns

### Standard text input with icon
```tsx
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { InputText } from 'primereact/inputtext';

<div className="flex flex-column gap-2">
  <label className="font-medium text-700 text-sm">
    Field Label <span className="text-red-500">*</span>
  </label>
  <IconField iconPosition="left">
    <InputIcon className="pi pi-tag" />
    <InputText
      value={value}
      onChange={(e) => { setValue(e.target.value); clearError('field'); }}
      placeholder="Placeholder text"
      className={`w-full${errors.field ? ' p-invalid' : ''}`}
    />
  </IconField>
  {errors.field
    ? <small className="p-error">{errors.field}</small>
    : <small className="text-500">Helper text</small>
  }
</div>
```

### Textarea with character counter
```tsx
import { InputTextarea } from 'primereact/inputtextarea';

<div className="flex flex-column gap-2">
  <div className="flex justify-content-between align-items-center">
    <label className="font-medium text-700 text-sm">Label <span className="text-red-500">*</span></label>
    <small className="text-400">{value.length} chars</small>
  </div>
  <InputTextarea
    value={value}
    onChange={(e) => { setValue(e.target.value); clearError('field'); }}
    rows={10}
    autoResize
    className={`w-full${errors.field ? ' p-invalid' : ''}`}
  />
  {errors.field && <small className="p-error">{errors.field}</small>}
</div>
```

### Date/time picker
```tsx
import { Calendar } from 'primereact/calendar';

<Calendar
  value={date}
  onChange={(e) => setDate(e.value as Date | null)}
  showTime
  hourFormat="24"
  minDate={new Date()}
  showIcon
  placeholder="Select date and time"
  className={`w-full${errors.date ? ' p-invalid' : ''}`}
/>
```

### Validation pattern
```tsx
const [errors, setErrors] = useState<Record<string, string>>({});
const clearError = (field: string) => setErrors((prev) => ({ ...prev, [field]: '' }));

const validate = () => {
  const newErrors: Record<string, string> = {};
  if (!form.name.trim()) newErrors.name = 'Name is required';
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
// Always clear per-field on change: onChange={() => { setValue(...); clearError('name'); }}
// p-invalid class on input when errors.name is truthy
```

---

## Loading State
```tsx
import { Skeleton } from 'primereact/skeleton';

if (isLoading) {
  return (
    <div>
      <div className="flex justify-content-between align-items-center mb-4">
        <Skeleton height="2rem" width="160px" />
        <Skeleton height="2.5rem" width="150px" />
      </div>
      <div className="surface-card border-round-xl shadow-1 p-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} height="2.5rem" className="mb-2" />
        ))}
      </div>
    </div>
  );
}
```

## Error State
```tsx
import { Button } from 'primereact/button';

if (error) {
  return (
    <div className="flex align-items-center justify-content-center" style={{ minHeight: '300px' }}>
      <div className="text-center surface-card border-round-xl p-5 shadow-1">
        <i className="pi pi-exclamation-triangle mb-3" style={{ fontSize: '3rem', color: '#ef4444', display: 'block' }} />
        <p className="text-700 mb-4">Failed to load data.</p>
        <Button label="Retry" icon="pi pi-refresh" onClick={handleRetry} />
      </div>
    </div>
  );
}
```

## Empty State
```tsx
<div className="text-center py-6 px-4">
  <i className="pi pi-inbox mb-3" style={{ fontSize: '3rem', color: '#cbd5e1', display: 'block', margin: '0 auto 1rem' }} />
  <p className="text-500 m-0 mb-3">No items yet</p>
  <Button label="Create first item" icon="pi pi-plus" />
</div>
```

---

## Common PrimeReact Components

### Button
```tsx
import { Button } from 'primereact/button';

// Primary
<Button label="Save" icon="pi pi-check" loading={isPending} />

// Secondary outlined
<Button label="Cancel" severity="secondary" outlined icon="pi pi-times" />

// Danger
<Button label="Delete" severity="danger" icon="pi pi-trash" />

// Icon-only round
<Button icon="pi pi-arrow-left" rounded text severity="secondary" aria-label="Back" />
```

### DataTable
```tsx
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

<DataTable
  value={data}
  paginator rows={10} rowsPerPageOptions={[5, 10, 25, 50]}
  loading={isLoading}
  stripedRows rowHover
  emptyMessage="No records found."
  size="small"
>
  <Column field="email" header="Email" sortable />
  <Column field="name" header="Name" sortable />
  <Column body={(row) => <Button icon="pi pi-trash" severity="danger" text rounded />} style={{ width: '4rem' }} />
</DataTable>
```

### DataTable with row selection
```tsx
<DataTable
  value={data}
  selection={selected}
  onSelectionChange={(e) => setSelected(e.value)}
  selectionMode="multiple"
  dataKey="id"
>
  <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
  ...
</DataTable>
```

### Confirm dialog (destructive actions)
```tsx
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog';

// In JSX: <ConfirmDialog />
// Trigger:
confirmDialog({
  message: 'Are you sure?',
  header: 'Confirm',
  icon: 'pi pi-exclamation-triangle',
  acceptClassName: 'p-button-danger',
  accept: () => deleteMutation.mutate(id),
});
```

### Message (inline alert)
```tsx
import { Message } from 'primereact/message';
<Message severity="error" text="Something went wrong" className="w-full mb-3" />
// severity: 'success' | 'info' | 'warn' | 'error'
```

### Tag / Badge
```tsx
import { Tag } from 'primereact/tag';
<Tag value="5 selected" severity="info" rounded />
// severity: 'success' | 'info' | 'warning' | 'danger' | null (primary)
```

### Toast (global notifications)
```tsx
import { Toast } from 'primereact/toast';
const toast = useRef<Toast>(null);
// In JSX: <Toast ref={toast} />
toast.current?.show({ severity: 'success', summary: 'Saved', detail: 'Changes saved.' });
```

### ProgressBar
```tsx
import { ProgressBar } from 'primereact/progressbar';
<ProgressBar value={75} style={{ height: '6px' }} showValue={false} />
```

---

## PrimeFlex Cheat-sheet

| Goal | Class |
|------|-------|
| Flex row, items centered | `flex align-items-center` |
| Flex row, space between | `flex justify-content-between` |
| Flex column | `flex flex-column` |
| Gap | `gap-2` / `gap-3` / `gap-4` |
| Margin bottom | `mb-2` … `mb-6` |
| Padding | `p-4`, `px-4 py-3` |
| Full width | `w-full` |
| Text color | `text-900` (dark), `text-700`, `text-500` (muted) |
| Font weight | `font-medium`, `font-semibold`, `font-bold` |
| Text size | `text-sm`, `text-2xl` |
| Border radius | `border-round-xl` |
| Surface | `surface-card`, `surface-ground` |
| Responsive grid | `col-12 md:col-6` inside `<div className="grid">` |
| Wrap | `flex-wrap` |

---

## StatusBadge Component
```tsx
// frontend/src/components/StatusBadge.tsx
import { Tag } from 'primereact/tag';

type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent';

const statusConfig: Record<CampaignStatus, { label: string; className: string }> = {
  draft:     { label: 'Draft',     className: 'status-draft' },
  scheduled: { label: 'Scheduled', className: 'status-scheduled' },
  sending:   { label: 'Sending',   className: 'status-sending' },
  sent:      { label: 'Sent',      className: 'status-sent' },
};

export function StatusBadge({ status }: { status: CampaignStatus }) {
  const { label, className } = statusConfig[status] ?? { label: status, className: '' };
  return (
    <span className={`text-xs font-semibold px-2 py-1 border-round ${className}`}>
      {label}
    </span>
  );
}
// CSS classes defined in index.css:
// .status-draft    { background: #e5e7eb; color: #374151; }
// .status-scheduled{ background: #dbeafe; color: #1d4ed8; }
// .status-sending  { background: #fef3c7; color: #d97706; }
// .status-sent     { background: #d1fae5; color: #059669; }
```

---

## Page Structure Reference

### Create/Edit Form Page
```tsx
<div>
  {/* Header with back button */}
  <div className="flex align-items-center gap-3 mb-4">
    <Button icon="pi pi-arrow-left" rounded text severity="secondary" onClick={() => navigate(-1)} />
    <div>
      <h1 className="text-2xl font-bold text-900 m-0">Page Title</h1>
      <p className="text-500 text-sm m-0 mt-1">Subtitle</p>
    </div>
  </div>

  <form onSubmit={handleSubmit}>
    {/* Section card */}
    <div className="surface-card border-round-xl shadow-1 p-4 mb-4">
      <div className="flex align-items-center gap-2 mb-4 pb-3" style={{ borderBottom: '1px solid #e2e8f0' }}>
        <i className="pi pi-info-circle" style={{ color: 'var(--primary-color)' }} />
        <span className="font-semibold text-900">Section</span>
      </div>
      {/* Fields */}
    </div>

    {/* Action bar */}
    <div className="flex justify-content-end gap-2">
      <Button type="button" label="Cancel" severity="secondary" outlined icon="pi pi-times" onClick={() => navigate(-1)} />
      <Button type="submit" label="Save" icon="pi pi-check" loading={isPending} />
    </div>
  </form>
</div>
```

### List Page
```tsx
<div>
  <div className="flex justify-content-between align-items-center mb-4">
    <div>
      <h1 className="text-2xl font-bold text-900 m-0">Items</h1>
      <p className="text-500 text-sm m-0 mt-1">{total} items total</p>
    </div>
    <Button label="New Item" icon="pi pi-plus" onClick={...} />
  </div>

  <div className="surface-card border-round-xl shadow-1 overflow-hidden">
    {/* Filter/search bar */}
    <div className="flex align-items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid #e2e8f0' }}>
      <IconField iconPosition="left">
        <InputIcon className="pi pi-search" />
        <InputText value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." />
      </IconField>
    </div>
    <DataTable value={filtered} ... />
  </div>
</div>
```

---

## Action Buttons — Campaign Status Logic
```typescript
const canEdit   = status === 'draft' || status === 'scheduled';
const canSend   = status === 'draft' || status === 'scheduled';
const canDelete = status === 'draft';
```

## Rules
- NEVER use Tailwind classes (`bg-gray-100`, `rounded-lg`, `space-y-4`) — use PrimeFlex + PrimeReact surface tokens
- NEVER use raw `<button>` for actions — use PrimeReact `<Button>`
- NEVER use `window.confirm()` — use `confirmDialog()` from PrimeReact
- Always add `p-invalid` to inputs on validation failure, clear on change
- Loading state: `loading={isPending}` prop on `<Button>`, `<Skeleton>` for page-level loading
- Error messages: `<small className="p-error">` for field errors, `<Message>` for block-level errors
