type CampaignStatus = 'draft' | 'sending' | 'scheduled' | 'sent';

const statusConfig: Record<CampaignStatus, { label: string; icon: string; className: string }> = {
  draft:     { label: 'Draft',     icon: 'pi pi-pencil',       className: 'status-draft' },
  scheduled: { label: 'Scheduled', icon: 'pi pi-clock',        className: 'status-scheduled' },
  sending:   { label: 'Sending',   icon: 'pi pi-spin pi-spinner', className: 'status-sending' },
  sent:      { label: 'Sent',      icon: 'pi pi-check-circle', className: 'status-sent' },
};

export function StatusBadge({ status }: { status: CampaignStatus }) {
  const config = statusConfig[status] ?? { label: status, icon: '', className: '' };
  return (
    <span className={`text-xs font-semibold px-2 py-1 border-round white-space-nowrap ${config.className}`}>
      <i className={`${config.icon} mr-1`} />
      {config.label}
    </span>
  );
}
