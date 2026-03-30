import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Skeleton } from 'primereact/skeleton';
import { InputText } from 'primereact/inputtext';
import { ProgressBar } from 'primereact/progressbar';
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
import { useRef } from 'react';
import * as XLSX from 'xlsx';
import { useCampaigns, useDeleteCampaign, useSendCampaign, useCreateCampaign, useDuplicateCampaign, campaignKeys } from '../hooks/useCampaigns';
import { StatusBadge } from '../components/StatusBadge';
import type { Campaign } from '../hooks/useCampaigns';

function MIcon({ name, style }: { name: string; style?: React.CSSProperties }) {
  return (
    <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', lineHeight: 1, ...style }}>
      {name}
    </span>
  );
}

function ScheduleCell({ scheduled_at, status }: { scheduled_at: string | null; status: string }) {
  if (!scheduled_at || status === 'sent') return <span className="text-400 text-sm">—</span>;

  const date = new Date(scheduled_at);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMin = Math.round(diffMs / 60000);

  let label: string;
  let bgColor: string;
  let textColor: string;
  let icon: string;

  if (status === 'sending') {
    label = 'Sending…';
    bgColor = '#fff7ed';
    textColor = '#ea580c';
    icon = 'send';
  } else if (diffMs < 0) {
    // overdue / being picked up
    label = 'Processing';
    bgColor = '#fef9c3';
    textColor = '#ca8a04';
    icon = 'schedule';
  } else if (diffMin < 60) {
    label = `In ${diffMin < 1 ? '< 1' : diffMin} min`;
    bgColor = '#eff6ff';
    textColor = '#2563eb';
    icon = 'alarm';
  } else {
    label = date.toLocaleString(undefined, {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
    bgColor = '#f0fdf4';
    textColor = '#16a34a';
    icon = 'event';
  }

  return (
    <span
      className="flex align-items-center gap-1"
      style={{
        display: 'inline-flex',
        padding: '2px 8px',
        borderRadius: '999px',
        backgroundColor: bgColor,
        color: textColor,
        fontWeight: 600,
        fontSize: '0.75rem',
        whiteSpace: 'nowrap',
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '0.9rem', lineHeight: 1 }}>{icon}</span>
      {label}
    </span>
  );
}

const STATUS_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Draft', value: 'draft' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Sending', value: 'sending' },
  { label: 'Sent', value: 'sent' },
];

export default function Campaigns() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useRef<Toast>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCampaigns, setSelectedCampaigns] = useState<Campaign[]>([]);
  const { data, isLoading, error } = useCampaigns({});
  const deleteMutation = useDeleteCampaign();
  const sendMutation = useSendCampaign();
  const createMutation = useCreateCampaign();
  const duplicateMutation = useDuplicateCampaign();

  const campaigns = data?.data || [];

  const handleExportExcel = () => {
    if (selectedCampaigns.length === 0) {
      toast.current?.show({ severity: 'warn', summary: 'No Selection', detail: 'Please select campaigns to export', life: 3000 });
      return;
    }

    const exportData = selectedCampaigns.map((c) => ({
      'Campaign Name': c.name,
      'Subject': c.subject,
      'Status': c.status,
      'Scheduled At': c.scheduled_at ? new Date(c.scheduled_at).toLocaleString() : '—',
      'Total Recipients': c.stats?.total || 0,
      'Sent': c.stats?.sent || 0,
      'Failed': c.stats?.failed || 0,
      'Opened': c.stats?.opened || 0,
      'Send Rate (%)': c.stats?.send_rate || 0,
      'Open Rate (%)': c.stats?.open_rate || 0,
      'Created At': new Date(c.created_at).toLocaleString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Campaigns');
    XLSX.writeFile(workbook, `campaigns-export-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.current?.show({ severity: 'success', summary: 'Exported', detail: `${selectedCampaigns.length} campaign(s) exported to Excel`, life: 3000 });
  };

  const handleDuplicate = () => {
    if (selectedCampaigns.length === 0) {
      toast.current?.show({ severity: 'warn', summary: 'No Selection', detail: 'Please select campaigns to duplicate', life: 3000 });
      return;
    }

    confirmDialog({
      message: `Are you sure you want to duplicate ${selectedCampaigns.length} campaign(s)?`,
      header: 'Duplicate Campaigns',
      icon: 'pi pi-copy',
      accept: async () => {
        try {
          for (const campaign of selectedCampaigns) {
            await duplicateMutation.mutateAsync(campaign.id);
          }
          queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
          setSelectedCampaigns([]);
          toast.current?.show({
            severity: 'success',
            summary: 'Duplicated',
            detail: `${selectedCampaigns.length} campaign(s) duplicated as drafts (scheduled +5 min)`,
            life: 3000,
          });
        } catch {
          toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to duplicate campaigns', life: 3000 });
        }
      },
    });
  };

  const handleClearSelection = () => {
    setSelectedCampaigns([]);
  };

  const filtered = useMemo(() => {
    let list = campaigns;
    if (statusFilter) list = list.filter((c) => c.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.subject.toLowerCase().includes(q));
    }
    return list;
  }, [campaigns, statusFilter, search]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { '': campaigns.length };
    campaigns.forEach((c) => { counts[c.status] = (counts[c.status] || 0) + 1; });
    return counts;
  }, [campaigns]);

  const handleDelete = (id: string) => {
    confirmDialog({
      message: 'Are you sure you want to delete this campaign?',
      header: 'Delete Campaign',
      icon: 'pi pi-trash',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        await deleteMutation.mutateAsync(id);
        queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
      },
    });
  };

  const handleSend = (id: string) => {
    confirmDialog({
      message: 'Are you sure you want to send this campaign? This action cannot be undone.',
      header: 'Send Campaign',
      icon: 'pi pi-send',
      acceptClassName: 'p-button-success',
      accept: async () => {
        await sendMutation.mutateAsync(id);
        queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
      },
    });
  };

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

  if (error) {
    return (
      <div className="flex align-items-center justify-content-center" style={{ minHeight: '300px' }}>
        <div className="text-center surface-card border-round-xl p-5 shadow-1">
          <MIcon name="error" style={{ fontSize: '3rem', color: '#ef4444', display: 'block', margin: '0 auto 1rem' }} />
          <p className="text-700 mb-4">Failed to load campaigns.</p>
          <Button label="Retry" icon="pi pi-refresh" onClick={() => queryClient.invalidateQueries({ queryKey: campaignKeys.lists() })} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Toast ref={toast} />
      <ConfirmDialog />

      {/* Header */}
      <div className="flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-900 m-0">Campaigns</h1>
          <p className="text-500 text-sm m-0 mt-1">
            {campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <Button
          label="New Campaign"
          icon="pi pi-plus"
          onClick={() => navigate('/campaigns/new')}
        />
      </div>

      <div className="surface-card border-round-xl shadow-1 overflow-hidden">
        {/* Filter bar */}
        <div
          className="flex align-items-center justify-content-between gap-3 px-4 py-3"
          style={{ borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap' }}
        >
          <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
            {STATUS_FILTERS.map(({ label, value }) => (
              <Button
                key={value}
                label={`${label} · ${statusCounts[value] ?? 0}`}
                onClick={() => setStatusFilter(value)}
                size="small"
                text={statusFilter !== value}
                outlined={statusFilter === value}
                severity={statusFilter === value ? undefined : 'secondary'}
                className="border-round-3xl"
              />
            ))}
          </div>
          <span className="p-input-icon-left" style={{ minWidth: '200px' }}>
            <i className="pi pi-search" />
            <InputText
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search campaigns..."
              style={{ width: '100%', fontSize: '0.875rem' }}
            />
          </span>
        </div>

        {/* Selection header */}
        {selectedCampaigns.length > 0 && (
          <div
            className="flex align-items-center justify-content-between gap-3 px-4 py-2"
            style={{ backgroundColor: '#eff6ff', borderBottom: '1px solid #bfdbfe' }}
          >
            <div className="flex align-items-center gap-2">
              <span className="text-sm font-medium text-blue-700">
                {selectedCampaigns.length} campaign{selectedCampaigns.length !== 1 ? 's' : ''} selected
              </span>
              <Button
                label="Clear"
                size="small"
                text
                onClick={handleClearSelection}
                className="text-blue-600"
              />
            </div>
            <div className="flex gap-2">
              <Button
                label="Export Excel"
                icon="pi pi-file-excel"
                size="small"
                outlined
                severity="success"
                onClick={handleExportExcel}
                disabled={createMutation.isPending}
              />
              <Button
                label="Duplicate"
                icon="pi pi-copy"
                size="small"
                outlined
                onClick={handleDuplicate}
                loading={createMutation.isPending}
              />
            </div>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-6 px-4">
            <MIcon name="inbox" style={{ fontSize: '3rem', color: '#cbd5e1', display: 'block', margin: '0 auto 1rem' }} />
            <p className="text-500 m-0 mb-3">
              {campaigns.length === 0 ? 'No campaigns yet' : 'No campaigns match your filters'}
            </p>
            {campaigns.length === 0 && (
              <Button
                label="Create your first campaign"
                icon="pi pi-plus"
                onClick={() => navigate('/campaigns/new')}
              />
            )}
          </div>
        ) : (
          <DataTable
            value={filtered}
            paginator={filtered.length > 10}
            rows={10}
            rowsPerPageOptions={[5, 10, 25]}
            emptyMessage="No campaigns found"
            stripedRows
            rowHover
            selection={selectedCampaigns}
            onSelectionChange={(e) => setSelectedCampaigns(e.value as Campaign[])}
            dataKey="id"
            selectionMode="multiple"
          >
            <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />

            <Column
              field="name"
              header="Campaign"
              sortable
              style={{ minWidth: '220px' }}
              body={(rowData: Campaign) => (
                <div>
                  <div className="font-semibold text-900">{rowData.name}</div>
                  <div
                    className="text-500 text-xs mt-1 overflow-hidden"
                    style={{ maxWidth: '260px', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}
                  >
                    {rowData.subject}
                  </div>
                </div>
              )}
            />
            <Column
              field="status"
              header="Status"
              sortable
              style={{ width: '130px' }}
              body={(rowData: Campaign) => <StatusBadge status={rowData.status} />}
            />
            <Column
              field="scheduled_at"
              header="Schedule At"
              sortable
              style={{ width: '150px' }}
              body={(rowData: Campaign) => (
                <ScheduleCell scheduled_at={rowData.scheduled_at} status={rowData.status} />
              )}
            />
            <Column
              header="Recipients"
              style={{ width: '110px' }}
              body={(rowData: Campaign) => {
                const s = rowData.stats;
                if (!s) return <span className="text-400 text-sm">—</span>;
                return (
                  <span>
                    <span className="font-semibold text-900 text-sm">{s.sent}</span>
                    <span className="text-400 text-sm">/{s.total}</span>
                  </span>
                );
              }}
            />
            <Column
              header="Send %"
              style={{ width: '130px' }}
              body={(rowData: Campaign) => {
                const s = rowData.stats;
                if (!s) return <span className="text-400 text-sm">—</span>;
                return (
                  <div>
                    <div className="text-sm font-semibold mb-1" style={{ color: '#22c55e' }}>{s.send_rate}%</div>
                    <ProgressBar value={s.send_rate} showValue={false} color="#22c55e" style={{ height: '4px', borderRadius: '99px' }} />
                  </div>
                );
              }}
            />
            <Column
              header="Open %"
              style={{ width: '130px' }}
              body={(rowData: Campaign) => {
                const s = rowData.stats;
                if (!s) return <span className="text-400 text-sm">—</span>;
                return (
                  <div>
                    <div className="text-sm font-semibold mb-1" style={{ color: '#3b82f6' }}>{s.open_rate}%</div>
                    <ProgressBar value={s.open_rate} showValue={false} color="#3b82f6" style={{ height: '4px', borderRadius: '99px' }} />
                  </div>
                );
              }}
            />
            <Column
              field="created_at"
              header="Created"
              sortable
              style={{ width: '120px' }}
              body={(rowData: Campaign) => (
                <span className="text-sm text-600">
                  {new Date(rowData.created_at).toLocaleDateString()}
                </span>
              )}
            />
            <Column
              header=""
              style={{ width: '160px' }}
              body={(rowData: Campaign) => (
                <div
                  className="flex gap-1 justify-content-end"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    icon="pi pi-eye"
                    rounded text severity="info" size="small"
                    tooltip="View" tooltipOptions={{ position: 'top' }}
                    onClick={() => navigate(`/campaigns/${rowData.id}`)}
                  />
                  {(rowData.status === 'draft' || rowData.status === 'scheduled') && (
                    <Button
                      icon="pi pi-pencil"
                      rounded text severity="secondary" size="small"
                      tooltip="Edit" tooltipOptions={{ position: 'top' }}
                      onClick={() => navigate(`/campaigns/${rowData.id}`)}
                    />
                  )}
                  {(rowData.status === 'draft' || rowData.status === 'scheduled') && (
                    <Button
                      icon="pi pi-send"
                      rounded text severity="success" size="small"
                      tooltip="Send Now" tooltipOptions={{ position: 'top' }}
                      onClick={() => handleSend(rowData.id)}
                      loading={sendMutation.isPending}
                    />
                  )}
                  {rowData.status === 'draft' && (
                    <Button
                      icon="pi pi-trash"
                      rounded text severity="danger" size="small"
                      tooltip="Delete" tooltipOptions={{ position: 'top' }}
                      onClick={() => handleDelete(rowData.id)}
                      loading={deleteMutation.isPending}
                    />
                  )}
                </div>
              )}
            />
          </DataTable>
        )}
      </div>
    </div>
  );
}
