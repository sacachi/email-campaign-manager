import { useState } from 'react';
import { ProgressBar } from 'primereact/progressbar';
import { Skeleton } from 'primereact/skeleton';
import { Divider } from 'primereact/divider';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { useNavigate } from 'react-router-dom';
import { useDashboardStats } from '../hooks/useRecipients';

// Material Symbol icon helper
function MIcon({ name, style }: { name: string; style?: React.CSSProperties }) {
  return (
    <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', lineHeight: 1, ...style }}>
      {name}
    </span>
  );
}

interface StatCardProps {
  icon: string;        // material symbol name
  iconColor: string;   // hex
  borderColor: string; // hex — left accent border
  bgColor: string;     // hex — icon bg
  label: string;
  value: number | string;
  valueColor: string;
  onClick?: () => void;
}

function StatCard({ icon, iconColor, borderColor, bgColor, label, value, valueColor, onClick }: StatCardProps) {
  return (
    <div
      className={`surface-card border-round-xl shadow-1 p-4 flex align-items-center gap-3 flex-1${onClick ? ' cursor-pointer' : ''}`}
      style={{ borderLeft: `4px solid ${borderColor}`, minWidth: 0, transition: 'box-shadow 0.2s' }}
      onClick={onClick}
      onMouseEnter={onClick ? (e) => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.12)') : undefined}
      onMouseLeave={onClick ? (e) => (e.currentTarget.style.boxShadow = '') : undefined}
    >
      <div
        className="flex align-items-center justify-content-center border-round-xl flex-shrink-0"
        style={{ width: 52, height: 52, background: bgColor }}
      >
        <MIcon name={icon} style={{ color: iconColor, fontSize: '1.6rem' }} />
      </div>
      <div className="min-w-0 overflow-hidden">
        <p className="text-500 text-sm m-0 mb-1 white-space-nowrap overflow-hidden text-overflow-ellipsis">{label}</p>
        <p className="text-3xl font-bold m-0" style={{ color: valueColor }}>{value}</p>
      </div>
    </div>
  );
}

interface MetricRowProps {
  label: string;
  value: number;
  rate: number;
  color: string;
  icon: string; // material symbol
}

function MetricRow({ label, value, rate, color, icon }: MetricRowProps) {
  return (
    <div>
      <div className="flex justify-content-between align-items-center mb-2">
        <div className="flex align-items-center gap-2">
          <MIcon name={icon} style={{ color, fontSize: '1.1rem' }} />
          <span className="text-700 text-sm font-medium">{label}</span>
        </div>
        <div className="flex align-items-center gap-3">
          <span className="text-900 font-semibold">{value}</span>
          <span className="text-xs font-bold px-2 py-1 border-round" style={{ background: `${color}18`, color }}>
            {rate}%
          </span>
        </div>
      </div>
      <ProgressBar
        value={rate}
        showValue={false}
        style={{ height: '6px', borderRadius: '99px' }}
        color={color}
      />
    </div>
  );
}

export default function Dashboard() {
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  const statsParams = (fromDate || toDate) ? {
    ...(fromDate ? { from: fromDate.toISOString().slice(0, 10) } : {}),
    ...(toDate ? { to: toDate.toISOString().slice(0, 10) } : {}),
  } : undefined;

  const { data, isLoading } = useDashboardStats(statsParams);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div>
        <Skeleton height="2rem" width="160px" className="mb-4" />
        <div className="flex gap-3 mb-4 flex-wrap">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-1" style={{ minWidth: '200px' }}>
              <Skeleton height="86px" className="border-round-xl" />
            </div>
          ))}
        </div>
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1" style={{ minWidth: '300px' }}><Skeleton height="260px" className="border-round-xl" /></div>
          <div style={{ width: '320px', minWidth: '260px' }}><Skeleton height="260px" className="border-round-xl" /></div>
        </div>
      </div>
    );
  }

  const stats = data?.data;
  if (!stats) return null;

  const { campaigns, recipients, emails } = stats;

  const statusRows = [
    { label: 'Draft',     count: campaigns.draft,     accentColor: '#94a3b8', icon: 'draft',           bg: '#f8fafc' },
    { label: 'Scheduled', count: campaigns.scheduled, accentColor: '#f59e0b', icon: 'schedule',        bg: '#fffbeb' },
    { label: 'Sending',   count: campaigns.sending,   accentColor: '#3b82f6', icon: 'send',            bg: '#eff6ff' },
    { label: 'Sent',      count: campaigns.sent,      accentColor: '#22c55e', icon: 'mark_email_read', bg: '#f0fdf4' },
  ];

  const emailTiles = [
    { label: 'Total',   value: emails.total,   iconName: 'mail',            iconColor: '#64748b', bg: '#f1f5f9' },
    { label: 'Sent',    value: emails.sent,    iconName: 'send',            iconColor: '#22c55e', bg: '#f0fdf4' },
    { label: 'Failed',  value: emails.failed,  iconName: 'cancel',          iconColor: '#ef4444', bg: '#fef2f2' },
    { label: 'Opened',  value: emails.opened,  iconName: 'mark_email_read', iconColor: '#3b82f6', bg: '#eff6ff' },
  ];

  return (
    <div>
      {/* Page header */}
      <div
        className="flex align-items-center justify-content-between mb-4"
        style={{ flexWrap: 'wrap', gap: '1rem' }}
      >
        <div>
          <h1 className="text-2xl font-bold text-900 m-0">Dashboard</h1>
          <p className="text-500 text-sm m-0 mt-1">Campaign performance overview</p>
        </div>
        <div className="flex align-items-center gap-2" style={{ flexWrap: 'wrap' }}>
          <span className="text-500 text-sm font-medium">Filter by date:</span>
          <Calendar
            value={fromDate}
            onChange={(e) => setFromDate(e.value as Date | null)}
            placeholder="From"
            showIcon
            dateFormat="dd/mm/yy"
            style={{ width: '155px' }}
          />
          <span className="text-400">—</span>
          <Calendar
            value={toDate}
            onChange={(e) => setToDate(e.value as Date | null)}
            placeholder="To"
            showIcon
            dateFormat="dd/mm/yy"
            style={{ width: '155px' }}
          />
          {(fromDate || toDate) && (
            <Button
              icon="pi pi-times-circle"
              rounded
              text
              severity="secondary"
              size="small"
              tooltip="Clear filter"
              onClick={() => { setFromDate(null); setToDate(null); }}
            />
          )}
        </div>
      </div>

      {/* KPI Cards — flex-wrap to avoid grid margin bug */}
      <div className="flex gap-3 mb-4" style={{ flexWrap: 'wrap' }}>
        <StatCard
          icon="campaign"
          iconColor="#3b82f6"
          borderColor="#3b82f6"
          bgColor="#eff6ff"
          label="Total Campaigns"
          value={campaigns.total}
          valueColor="#1e40af"
          onClick={() => navigate('/campaigns')}
        />
        <StatCard
          icon="group"
          iconColor="#a855f7"
          borderColor="#a855f7"
          bgColor="#faf5ff"
          label="Total Recipients"
          value={recipients.total}
          valueColor="#7e22ce"
          onClick={() => navigate('/recipients')}
        />
        <StatCard
          icon="send"
          iconColor="#22c55e"
          borderColor="#22c55e"
          bgColor="#f0fdf4"
          label="Emails Sent"
          value={emails.sent}
          valueColor="#15803d"
        />
        <StatCard
          icon="mark_email_read"
          iconColor="#f97316"
          borderColor="#f97316"
          bgColor="#fff7ed"
          label="Emails Opened"
          value={emails.opened}
          valueColor="#c2410c"
        />
      </div>

      {/* Bottom section */}
      <div className="flex gap-3" style={{ flexWrap: 'wrap', alignItems: 'stretch' }}>

        {/* Email Statistics */}
        <div className="surface-card border-round-xl shadow-1 flex-1" style={{ borderTop: '3px solid #3b82f6', minWidth: '300px', padding: '1.25rem' }}>
          <div className="flex align-items-center gap-2 mb-1">
            <MIcon name="bar_chart" style={{ color: '#3b82f6', fontSize: '1.4rem' }} />
            <span className="text-900 font-semibold text-lg">Email Statistics</span>
          </div>
          <Divider className="my-3" />

          {/* Counts row */}
          <div className="flex gap-2 mb-4" style={{ flexWrap: 'wrap' }}>
            {emailTiles.map(({ label, value, iconName, iconColor, bg }) => (
              <div
                key={label}
                className="flex-1 flex flex-column align-items-center justify-content-center border-round-lg p-3 gap-1"
                style={{ background: bg, minWidth: '70px' }}
              >
                <MIcon name={iconName} style={{ color: iconColor, fontSize: '1.4rem' }} />
                <span className="text-2xl font-bold" style={{ color: iconColor }}>{value}</span>
                <span className="text-500 text-xs font-medium" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Rate bars */}
          <div className="flex flex-column gap-4">
            <MetricRow label="Send Rate" value={emails.sent} rate={emails.send_rate} color="#22c55e" icon="send" />
            <MetricRow label="Open Rate" value={emails.opened} rate={emails.open_rate} color="#3b82f6" icon="mark_email_read" />
          </div>
        </div>

        {/* Campaign Status */}
        <div className="surface-card border-round-xl shadow-1" style={{ borderTop: '3px solid #a855f7', width: '300px', minWidth: '260px', padding: '1.25rem' }}>
          <div className="flex align-items-center gap-2 mb-1">
            <MIcon name="flag" style={{ color: '#a855f7', fontSize: '1.4rem' }} />
            <span className="text-900 font-semibold text-lg">Campaign Status</span>
          </div>
          <Divider className="my-3" />

          <div className="flex flex-column gap-2">
            {statusRows.map(({ label, count, accentColor, icon, bg }) => (
              <div
                key={label}
                className="flex align-items-center justify-content-between border-round-lg p-3"
                style={{ background: bg, borderLeft: `3px solid ${accentColor}` }}
              >
                <div className="flex align-items-center gap-2">
                  <MIcon name={icon} style={{ color: accentColor, fontSize: '1.1rem' }} />
                  <span className="font-medium text-700 text-sm">{label}</span>
                </div>
                <span className="font-bold text-xl" style={{ color: accentColor }}>{count}</span>
              </div>
            ))}
          </div>

          {campaigns.total > 0 && (
            <>
              <Divider className="my-3" />
              <div>
                <div className="flex justify-content-between text-xs text-500 mb-2">
                  <span className="flex align-items-center gap-1">
                    <MIcon name="insights" style={{ fontSize: '0.9rem', color: '#64748b' }} />
                    Completion rate
                  </span>
                  <span className="font-bold" style={{ color: '#22c55e' }}>{Math.round((campaigns.sent / campaigns.total) * 100)}%</span>
                </div>
                <ProgressBar
                  value={Math.round((campaigns.sent / campaigns.total) * 100)}
                  showValue={false}
                  style={{ height: '6px', borderRadius: '99px' }}
                  color="#22c55e"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
