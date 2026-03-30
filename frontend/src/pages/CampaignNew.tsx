import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';
import { Card } from 'primereact/card';
import { Divider } from 'primereact/divider';
import { useCreateCampaign } from '../hooks/useCampaigns';
import { useRecipients, type Recipient } from '../hooks/useRecipients';

function SectionHeader({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex align-items-center gap-2">
      <i className={`pi ${icon} text-primary`} />
      <span className="font-semibold text-900">{label}</span>
    </div>
  );
}

export default function CampaignNew() {
  const navigate = useNavigate();
  const createCampaign = useCreateCampaign();
  const { data: recipientsData, isLoading: recipientsLoading } = useRecipients({ limit: 1000 });

  const [form, setForm] = useState({ name: '', subject: '', body: '' });
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);
  const [selectedRecipients, setSelectedRecipients] = useState<Recipient[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [recipientSearch, setRecipientSearch] = useState('');

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = 'Campaign name is required';
    if (!form.subject.trim()) newErrors.subject = 'Email subject is required';
    if (!form.body.trim()) newErrors.body = 'Email body is required';
    if (selectedRecipients.length === 0) newErrors.recipients = 'Select at least one recipient';
    if (scheduledAt && scheduledAt <= new Date()) newErrors.scheduledAt = 'Send time must be in the future';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      const payload: { name: string; subject: string; body: string; recipientIds: string[]; scheduled_at?: string } = {
        name: form.name,
        subject: form.subject,
        body: form.body,
        recipientIds: selectedRecipients.map((r) => r.id),
      };
      if (scheduledAt) payload.scheduled_at = scheduledAt.toISOString();
      const result = await createCampaign.mutateAsync(payload);
      navigate(`/campaigns/${result.data.id}`);
    } catch (err) {
      console.error('Failed to create campaign:', err);
    }
  };

  const allRecipients = recipientsData?.data || [];

  const filteredRecipients = useMemo(() => {
    if (!recipientSearch.trim()) return allRecipients;
    const q = recipientSearch.toLowerCase();
    return allRecipients.filter(
      (r) => r.email.toLowerCase().includes(q) || (r.name || '').toLowerCase().includes(q)
    );
  }, [allRecipients, recipientSearch]);

  const clearError = (field: string) => setErrors((prev) => ({ ...prev, [field]: '' }));

  return (
    <div>
      {/* Page header */}
      <div className="flex align-items-center gap-3 mb-4">
        <Button
          icon="pi pi-arrow-left"
          rounded
          text
          severity="secondary"
          onClick={() => navigate('/campaigns')}
          aria-label="Back"
        />
        <div>
          <h1 className="text-2xl font-bold text-900 m-0">New Campaign</h1>
          <p className="text-500 text-sm m-0 mt-1">Create and schedule a new email campaign</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Section 1 — Campaign Info */}
        <Card className="mb-4" title={<SectionHeader icon="pi-info-circle" label="Campaign Info" />}>
          <Divider className="mt-0 mb-4" />
          <div className="grid">
            <div className="col-12 md:col-6">
              <div className="flex flex-column gap-2">
                <label className="font-medium text-700 text-sm">
                  Campaign Name <span className="text-red-500">*</span>
                </label>
                <IconField iconPosition="left">
                  <InputIcon className="pi pi-tag" />
                  <InputText
                    value={form.name}
                    onChange={(e) => { setForm({ ...form, name: e.target.value }); clearError('name'); }}
                    placeholder="e.g., Summer Sale 2024"
                    className={`w-full${errors.name ? ' p-invalid' : ''}`}
                  />
                </IconField>
                {errors.name
                  ? <small className="p-error">{errors.name}</small>
                  : <small className="text-500">A short, descriptive name for this campaign</small>
                }
              </div>
            </div>

            <div className="col-12 md:col-6">
              <div className="flex flex-column gap-2">
                <label className="font-medium text-700 text-sm">Schedule Send Time</label>
                <Calendar
                  value={scheduledAt}
                  onChange={(e) => { setScheduledAt(e.value as Date | null); clearError('scheduledAt'); }}
                  showTime
                  hourFormat="24"
                  minDate={new Date()}
                  placeholder="Leave empty → sends in 5 minutes"
                  showIcon
                  className={`w-full${errors.scheduledAt ? ' p-invalid' : ''}`}
                />
                {errors.scheduledAt
                  ? <small className="p-error">{errors.scheduledAt}</small>
                  : <small className="text-500">Leave empty to auto-send 5 minutes after creation</small>
                }
              </div>
            </div>
          </div>
        </Card>

        {/* Section 2 — Email Content */}
        <Card className="mb-4" title={<SectionHeader icon="pi-envelope" label="Email Content" />}>
          <Divider className="mt-0 mb-4" />

          <div className="flex flex-column gap-2 mb-4">
            <label className="font-medium text-700 text-sm">
              Subject Line <span className="text-red-500">*</span>
            </label>
            <IconField iconPosition="left">
              <InputIcon className="pi pi-pencil" />
              <InputText
                value={form.subject}
                onChange={(e) => { setForm({ ...form, subject: e.target.value }); clearError('subject'); }}
                placeholder="e.g., Don't miss our summer sale!"
                className={`w-full${errors.subject ? ' p-invalid' : ''}`}
              />
            </IconField>
            {errors.subject && <small className="p-error">{errors.subject}</small>}
          </div>

          <div className="flex flex-column gap-2">
            <div className="flex justify-content-between align-items-center">
              <label className="font-medium text-700 text-sm">
                Email Body <span className="text-red-500">*</span>
              </label>
              <small className="text-400">{form.body.length} chars</small>
            </div>
            <InputTextarea
              value={form.body}
              onChange={(e) => { setForm({ ...form, body: e.target.value }); clearError('body'); }}
              rows={10}
              placeholder="Write your email content here..."
              className={`w-full${errors.body ? ' p-invalid' : ''}`}
              autoResize
            />
            {errors.body && <small className="p-error">{errors.body}</small>}
          </div>
        </Card>

        {/* Section 3 — Recipients */}
        <Card className="mb-4" title={<SectionHeader icon="pi-users" label="Recipients" />}>
          <Divider className="mt-0 mb-3" />

          <div className="flex align-items-center justify-content-between flex-wrap gap-3 mb-3">
            <div>
              {selectedRecipients.length > 0 && (
                <Tag value={`${selectedRecipients.length} selected`} severity="info" rounded />
              )}
            </div>
            <IconField iconPosition="left">
              <InputIcon className="pi pi-search" />
              <InputText
                value={recipientSearch}
                onChange={(e) => setRecipientSearch(e.target.value)}
                placeholder="Search by name or email…"
                className="w-full"
                style={{ fontSize: '0.875rem', width: '240px' }}
              />
            </IconField>
          </div>

          {errors.recipients && (
            <Message severity="error" text={errors.recipients} className="w-full mb-3" />
          )}

          <DataTable
            value={filteredRecipients}
            selection={selectedRecipients}
            onSelectionChange={(e) => { setSelectedRecipients(e.value as Recipient[]); clearError('recipients'); }}
            dataKey="id"
            paginator
            rows={10}
            rowsPerPageOptions={[5, 10, 25, 50]}
            loading={recipientsLoading}
            emptyMessage="No recipients found."
            stripedRows
            rowHover
            selectionMode="multiple"
            size="small"
          >
            <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
            <Column field="email" header="Email" sortable />
            <Column field="name" header="Name" sortable />
            <Column
              field="send_count"
              header="Emails Sent"
              sortable
              style={{ width: '110px' }}
              body={(rowData: Recipient) => (
                <span className="text-600 text-sm">{rowData.send_count || 0}</span>
              )}
            />
          </DataTable>
        </Card>

        {/* Actions */}
        <div className="flex justify-content-end gap-2">
          <Button
            type="button"
            label="Cancel"
            severity="secondary"
            outlined
            icon="pi pi-times"
            onClick={() => navigate('/campaigns')}
            disabled={createCampaign.isPending}
          />
          <Button
            type="submit"
            label={createCampaign.isPending ? 'Creating…' : 'Create Campaign'}
            icon={createCampaign.isPending ? 'pi pi-spin pi-spinner' : 'pi pi-send'}
            loading={createCampaign.isPending}
          />
        </div>
      </form>
    </div>
  );
}
