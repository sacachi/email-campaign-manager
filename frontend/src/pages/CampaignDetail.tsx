import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ProgressBar } from 'primereact/progressbar';
import { Tag } from 'primereact/tag';
import { Skeleton } from 'primereact/skeleton';
import { Dialog } from 'primereact/dialog';
import { Calendar } from 'primereact/calendar';
import { Divider } from 'primereact/divider';
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { campaignKeys, useCampaign, useDeleteCampaign, useSendCampaign, useScheduleCampaign, useUpdateCampaign } from '../hooks/useCampaigns';
import { useCampaignSSE } from '../hooks/useCampaignSSE';
import { StatusBadge } from '../components/StatusBadge';
import type { Recipient } from '../hooks/useCampaigns';

function MIcon({ name, style }: { name: string; style?: React.CSSProperties }) {
  return (
    <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', lineHeight: 1, userSelect: 'none', ...style }}>
      {name}
    </span>
  );
}

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useCampaign(id || '');
  const deleteMutation = useDeleteCampaign();
  const sendMutation = useSendCampaign();
  const scheduleMutation = useScheduleCampaign();
  const updateMutation = useUpdateCampaign();
  const [scheduleDialogVisible, setScheduleDialogVisible] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<Date | null>(null);
  const [scheduleDateError, setScheduleDateError] = useState('');
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', subject: '', body: '', scheduled_at: null as Date | null });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  // SSE hook must be called unconditionally (Rules of Hooks).
  // It is a no-op when data isn't loaded yet or campaign is already sent.
  const campaignStatus = data?.data?.status;
  useCampaignSSE(id!, !!campaignStatus && campaignStatus !== 'sent');

  if (isLoading) {
    return (
      <div>
        <Skeleton height="2rem" width="220px" className="mb-4" />
        <Skeleton height="120px" className="border-round-xl mb-3" />
        <Skeleton height="160px" className="border-round-xl mb-3" />
        <Skeleton height="200px" className="border-round-xl" />
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
        <div className="text-center surface-card border-round-xl p-5 shadow-1">
          <MIcon name="error" style={{ fontSize: '3rem', color: '#ef4444', display: 'block', margin: '0 auto 1rem' }} />
          <p className="text-700 mb-4">Failed to load campaign.</p>
          <Button label="Back to campaigns" icon="pi pi-arrow-left" severity="secondary" onClick={() => navigate('/campaigns')} />
        </div>
      </div>
    );
  }

  const campaign = data.data;
  const stats = campaign.stats;
  const recipients = campaign.recipients || [];

  const handleDelete = () => {
    confirmDialog({
      message: 'Are you sure you want to delete this campaign?',
      header: 'Delete Campaign',
      icon: 'pi pi-trash',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        await deleteMutation.mutateAsync(id!);
        navigate('/campaigns');
      },
    });
  };

  const handleSend = () => {
    confirmDialog({
      message: 'Are you sure you want to send this campaign? This action cannot be undone.',
      header: 'Send Campaign',
      icon: 'pi pi-send',
      acceptClassName: 'p-button-success',
      accept: async () => {
        await sendMutation.mutateAsync(id!);
        queryClient.invalidateQueries({ queryKey: campaignKeys.detail(id!) });
        queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
      },
    });
  };

  const handleSchedule = async () => {
    if (!scheduleDate) { setScheduleDateError('Please select a date and time'); return; }
    if (scheduleDate <= new Date()) { setScheduleDateError('Send time must be in the future'); return; }
    setScheduleDateError('');
    await scheduleMutation.mutateAsync({ id: id!, scheduled_at: scheduleDate.toISOString() });
    queryClient.invalidateQueries({ queryKey: campaignKeys.detail(id!) });
    queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
    setScheduleDialogVisible(false);
    setScheduleDate(null);
  };

  const openEditDialog = () => {
    setEditForm({
      name: campaign.name,
      subject: campaign.subject,
      body: campaign.body,
      scheduled_at: campaign.scheduled_at ? new Date(campaign.scheduled_at) : null,
    });
    setEditErrors({});
    setEditDialogVisible(true);
  };

  const handleEdit = async () => {
    const errs: Record<string, string> = {};
    if (!editForm.name.trim()) errs.name = 'Name is required';
    if (!editForm.subject.trim()) errs.subject = 'Subject is required';
    if (!editForm.body.trim()) errs.body = 'Body is required';
    if (editForm.scheduled_at && editForm.scheduled_at <= new Date()) errs.scheduled_at = 'Send time must be in the future';
    setEditErrors(errs);
    if (Object.keys(errs).length > 0) return;
    await updateMutation.mutateAsync({
      id: id!,
      name: editForm.name,
      subject: editForm.subject,
      body: editForm.body,
      ...(editForm.scheduled_at ? { scheduled_at: editForm.scheduled_at.toISOString() } : {}),
    });
    queryClient.invalidateQueries({ queryKey: campaignKeys.detail(id!) });
    queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
    setEditDialogVisible(false);
  };

  const recipientStatusTemplate = (rowData: Recipient) => {
    const severity = rowData.status === 'sent' ? 'success' : rowData.status === 'failed' ? 'danger' : 'secondary';
    return <Tag value={rowData.status} severity={severity} rounded />;
  };

  const sentAtTemplate = (rowData: Recipient) => (
    <span className="text-sm text-600">{rowData.sent_at ? new Date(rowData.sent_at).toLocaleString() : '-'}</span>
  );

  const statTiles = [
    { label: 'Total',  value: stats.total,  icon: 'mail',            color: '#64748b', bg: '#f1f5f9' },
    { label: 'Sent',   value: stats.sent,   icon: 'send',            color: '#22c55e', bg: '#f0fdf4' },
    { label: 'Failed', value: stats.failed, icon: 'cancel',          color: '#ef4444', bg: '#fef2f2' },
    { label: 'Opened', value: stats.opened, icon: 'mark_email_read', color: '#3b82f6', bg: '#eff6ff' },
  ];

  return (
    <div>
      <ConfirmDialog />

      {/* Schedule Dialog */}
      <Dialog
        header={
          <div className="flex align-items-center gap-2">
            <MIcon name="schedule_send" style={{ color: '#3b82f6' }} />
            <span>Schedule Campaign</span>
          </div>
        }
        visible={scheduleDialogVisible}
        onHide={() => { setScheduleDialogVisible(false); setScheduleDateError(''); }}
        style={{ width: '420px' }}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button label="Cancel" severity="secondary" outlined onClick={() => { setScheduleDialogVisible(false); setScheduleDateError(''); }} />
            <Button label="Schedule" icon="pi pi-clock" onClick={handleSchedule} loading={scheduleMutation.isPending} />
          </div>
        }
      >
        <div className="p-fluid flex flex-column gap-2">
          <label className="font-medium text-900">Select Date & Time</label>
          <Calendar
            value={scheduleDate}
            onChange={(e) => { setScheduleDate(e.value as Date); setScheduleDateError(''); }}
            showTime
            hourFormat="24"
            minDate={new Date()}
            placeholder="Select a future date and time"
            showIcon
          />
          {scheduleDateError && <small className="p-error">{scheduleDateError}</small>}
        </div>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        header={
          <div className="flex align-items-center gap-2">
            <MIcon name="edit" style={{ color: '#6366f1' }} />
            <span>Edit Campaign</span>
          </div>
        }
        visible={editDialogVisible}
        onHide={() => setEditDialogVisible(false)}
        style={{ width: '520px' }}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button label="Cancel" severity="secondary" outlined onClick={() => setEditDialogVisible(false)} />
            <Button label="Save Changes" icon="pi pi-check" onClick={handleEdit} loading={updateMutation.isPending} />
          </div>
        }
      >
        <div className="p-fluid flex flex-column gap-3">
          <div className="flex flex-column gap-2">
            <label className="font-medium text-900">Campaign Name</label>
            <InputText
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className={editErrors.name ? 'p-invalid' : ''}
            />
            {editErrors.name && <small className="p-error">{editErrors.name}</small>}
          </div>
          <div className="flex flex-column gap-2">
            <label className="font-medium text-900">Email Subject</label>
            <InputText
              value={editForm.subject}
              onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
              className={editErrors.subject ? 'p-invalid' : ''}
            />
            {editErrors.subject && <small className="p-error">{editErrors.subject}</small>}
          </div>
          <div className="flex flex-column gap-2">
            <label className="font-medium text-900">Email Body</label>
            <InputTextarea
              value={editForm.body}
              onChange={(e) => setEditForm({ ...editForm, body: e.target.value })}
              rows={5}
              autoResize
              className={editErrors.body ? 'p-invalid' : ''}
            />
            {editErrors.body && <small className="p-error">{editErrors.body}</small>}
          </div>
          <div className="flex flex-column gap-2">
            <label className="font-medium text-900">Send Time</label>
            <Calendar
              value={editForm.scheduled_at}
              onChange={(e) => setEditForm({ ...editForm, scheduled_at: e.value as Date | null })}
              showTime
              hourFormat="24"
              minDate={new Date()}
              placeholder="Select a future date and time"
              showIcon
            />
            {editErrors.scheduled_at && <small className="p-error">{editErrors.scheduled_at}</small>}
          </div>
        </div>
      </Dialog>

      {/* Page Header */}
      <div className="flex align-items-start justify-content-between gap-3 mb-4" style={{ flexWrap: 'wrap' }}>
        <div className="flex align-items-center gap-3">
          <Button icon="pi pi-arrow-left" rounded text severity="secondary" onClick={() => navigate('/campaigns')} />
          <div>
            <div className="flex align-items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-900 m-0">{campaign.name}</h1>
              <StatusBadge status={campaign.status} />
            </div>
            {campaign.scheduled_at && (
              <div className="flex align-items-center gap-1 mt-1 text-500 text-sm">
                <MIcon name="schedule" style={{ fontSize: '1rem', color: '#f59e0b' }} />
                <span>Scheduled: <strong>{new Date(campaign.scheduled_at).toLocaleString()}</strong></span>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
          {(campaign.status === 'draft' || campaign.status === 'scheduled') && (
            <Button label="Send Now" icon="pi pi-send" severity="success" onClick={handleSend} loading={sendMutation.isPending} />
          )}
          {(campaign.status === 'draft' || campaign.status === 'scheduled') && (
            <Button label="Edit" icon="pi pi-pencil" severity="secondary" outlined onClick={openEditDialog} loading={updateMutation.isPending} />
          )}
          {campaign.status === 'draft' && (
            <>
              <Button label="Schedule" icon="pi pi-clock" severity="info" outlined onClick={() => { setScheduleDate(null); setScheduleDateError(''); setScheduleDialogVisible(true); }} loading={scheduleMutation.isPending} />
              <Button label="Delete" icon="pi pi-trash" severity="danger" outlined onClick={handleDelete} loading={deleteMutation.isPending} />
            </>
          )}
        </div>
      </div>

      {/* Live sending progress banner */}
      {campaign.status === 'sending' && (
        <div
          className="flex align-items-center gap-3 border-round-xl p-3 mb-3"
          style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}
        >
          <i className="pi pi-spin pi-spinner" style={{ color: '#3b82f6', fontSize: '1.2rem', flexShrink: 0 }} />
          <div className="flex-1">
            <div className="flex justify-content-between align-items-center mb-1">
              <span className="font-semibold text-900 text-sm">Sending in progress…</span>
              <span className="text-xs text-500">
                {stats.sent + stats.failed} / {stats.total} processed
              </span>
            </div>
            <ProgressBar
              value={stats.total > 0 ? Math.round(((stats.sent + stats.failed) / stats.total) * 100) : 0}
              showValue={false}
              style={{ height: '6px', borderRadius: '99px' }}
            />
          </div>
        </div>
      )}

      {/* Content + Stats — side by side on large screens */}
      <div className="flex gap-3 mb-3" style={{ flexWrap: 'wrap', alignItems: 'stretch' }}>

        {/* Campaign Content */}
        <div className="surface-card border-round-xl shadow-1 flex-1" style={{ borderTop: '3px solid #6366f1', minWidth: '280px', padding: '1.25rem' }}>
          <div className="flex align-items-center gap-2 mb-1">
            <MIcon name="campaign" style={{ color: '#6366f1' }} />
            <span className="font-semibold text-900 text-lg">Campaign Content</span>
          </div>
          <Divider className="my-3" />
          <div className="flex flex-column gap-4">
            <div>
              <div className="flex align-items-center gap-2 mb-2">
                <MIcon name="subject" style={{ color: '#64748b', fontSize: '1rem' }} />
                <span className="text-500 text-xs font-medium" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>Subject</span>
              </div>
              <p className="text-900 font-medium text-lg m-0 line-height-3">{campaign.subject}</p>
            </div>
            <div>
              <div className="flex align-items-center gap-2 mb-2">
                <MIcon name="article" style={{ color: '#64748b', fontSize: '1rem' }} />
                <span className="text-500 text-xs font-medium" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>Body</span>
              </div>
              <div
                className="white-space-pre-wrap text-700 line-height-3 border-round-lg p-3"
                style={{ background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}
              >
                {campaign.body}
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="surface-card border-round-xl shadow-1" style={{ borderTop: '3px solid #22c55e', width: '320px', minWidth: '260px', padding: '1.25rem' }}>
          <div className="flex align-items-center gap-2 mb-1">
            <MIcon name="bar_chart" style={{ color: '#22c55e' }} />
            <span className="font-semibold text-900 text-lg">Statistics</span>
          </div>
          <Divider className="my-3" />

          {/* Stat tiles */}
          <div className="flex gap-2 mb-4" style={{ flexWrap: 'wrap' }}>
            {statTiles.map(({ label, value, icon, color, bg }) => (
              <div
                key={label}
                className="flex-1 flex flex-column align-items-center justify-content-center border-round-lg p-3 gap-1"
                style={{ background: bg, minWidth: '60px' }}
              >
                <MIcon name={icon} style={{ color, fontSize: '1.3rem' }} />
                <span className="text-2xl font-bold" style={{ color }}>{value}</span>
                <span className="text-500 text-xs" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Rate bars */}
          <div className="flex flex-column gap-3">
            <div>
              <div className="flex justify-content-between align-items-center mb-2">
                <div className="flex align-items-center gap-1">
                  <MIcon name="send" style={{ color: '#22c55e', fontSize: '1rem' }} />
                  <span className="text-700 text-sm font-medium">Send Rate</span>
                </div>
                <span className="text-xs font-bold px-2 py-1 border-round" style={{ background: '#22c55e18', color: '#22c55e' }}>{stats.send_rate}%</span>
              </div>
              <ProgressBar value={stats.send_rate} showValue={false} color="#22c55e" style={{ height: '6px', borderRadius: '99px' }} />
            </div>
            <div>
              <div className="flex justify-content-between align-items-center mb-2">
                <div className="flex align-items-center gap-1">
                  <MIcon name="mark_email_read" style={{ color: '#3b82f6', fontSize: '1rem' }} />
                  <span className="text-700 text-sm font-medium">Open Rate</span>
                </div>
                <span className="text-xs font-bold px-2 py-1 border-round" style={{ background: '#3b82f618', color: '#3b82f6' }}>{stats.open_rate}%</span>
              </div>
              <ProgressBar value={stats.open_rate} showValue={false} color="#3b82f6" style={{ height: '6px', borderRadius: '99px' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Recipients */}
      <div className="surface-card border-round-xl shadow-1" style={{ borderTop: '3px solid #a855f7', padding: '1.25rem' }}>
        <div className="flex align-items-center justify-content-between mb-1">
          <div className="flex align-items-center gap-2">
            <MIcon name="group" style={{ color: '#a855f7' }} />
            <span className="font-semibold text-900 text-lg">Recipients</span>
            <span
              className="text-xs font-bold px-2 py-1 border-round"
              style={{ background: '#a855f718', color: '#a855f7' }}
            >
              {recipients.length}
            </span>
          </div>
        </div>
        <Divider className="my-3" />
        {recipients.length === 0 ? (
          <div className="text-center py-5">
            <MIcon name="group_off" style={{ fontSize: '3rem', color: '#cbd5e1', display: 'block', margin: '0 auto 0.75rem' }} />
            <p className="text-500 m-0">No recipients added</p>
          </div>
        ) : (
          <DataTable
            value={recipients}
            paginator
            rows={10}
            rowsPerPageOptions={[5, 10, 25]}
            stripedRows
            rowHover
            emptyMessage="No recipients"
            size="small"
          >
            <Column field="email" header="Email" sortable />
            <Column field="name" header="Name" sortable />
            <Column field="status" header="Status" body={recipientStatusTemplate} sortable style={{ width: '120px' }} />
            <Column field="sent_at" header="Sent At" body={sentAtTemplate} style={{ width: '180px' }} />
          </DataTable>
        )}
      </div>
    </div>
  );
}
