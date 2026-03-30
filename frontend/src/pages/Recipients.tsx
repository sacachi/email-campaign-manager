import { useState, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { DataTable, DataTableSelectionMultipleChangeEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { Skeleton } from 'primereact/skeleton';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { Toolbar } from 'primereact/toolbar';
import { Message } from 'primereact/message';
import {
  useRecipients,
  useCreateRecipient,
  useUpdateRecipient,
  useDeleteRecipient,
  useBulkCreateRecipients,
  useBulkDeleteRecipients,
  useExportRecipients,
} from '../hooks/useRecipients';
import type { Recipient } from '../hooks/useRecipients';

export default function Recipients() {
  const toast = useRef<Toast>(null);
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(10);
  const [search, setSearch] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState<Recipient[]>([]);

  const { data, isLoading } = useRecipients({ page, limit: rows, search: search || undefined });
  const createMutation = useCreateRecipient();
  const updateMutation = useUpdateRecipient();
  const deleteMutation = useDeleteRecipient();
  const bulkCreateMutation = useBulkCreateRecipients();
  const bulkDeleteMutation = useBulkDeleteRecipients();
  const exportMutation = useExportRecipients();

  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [bulkDialogVisible, setBulkDialogVisible] = useState(false);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [editingRecipient, setEditingRecipient] = useState<Recipient | null>(null);
  const [form, setForm] = useState({ email: '', name: '' });
  const [bulkText, setBulkText] = useState('');
  const [formError, setFormError] = useState('');

  const filteredRecipients = useMemo(() => {
    if (!data?.data) return [];
    if (!search.trim()) return data.data;
    const searchLower = search.toLowerCase();
    return data.data.filter(
      (r) => r.email.toLowerCase().includes(searchLower) || r.name.toLowerCase().includes(searchLower)
    );
  }, [data?.data, search]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['recipients'] });

  const handleCreate = async () => {
    setFormError('');
    if (!form.email.trim() || !form.name.trim()) {
      setFormError('Email and name are required');
      return;
    }
    try {
      await createMutation.mutateAsync(form);
      invalidate();
      setCreateDialogVisible(false);
      setForm({ email: '', name: '' });
      toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Recipient created' });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setFormError(error.response?.data?.error || 'Failed to create recipient');
    }
  };

  const handleBulkCreate = async () => {
    setFormError('');
    const lines = bulkText.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      setFormError('Please enter at least one recipient');
      return;
    }
    const recipients: { email: string; name: string }[] = [];
    const errors: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim());
      if (parts.length < 2 || !parts[0] || !parts[1]) {
        errors.push(`Line ${i + 1}: expected "email, name" format`);
        continue;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parts[0])) {
        errors.push(`Line ${i + 1}: invalid email "${parts[0]}"`);
        continue;
      }
      recipients.push({ email: parts[0], name: parts[1] });
    }
    if (errors.length > 0) {
      setFormError(errors.slice(0, 5).join('\n') + (errors.length > 5 ? `\n...and ${errors.length - 5} more errors` : ''));
      return;
    }
    try {
      const result = await bulkCreateMutation.mutateAsync(recipients);
      invalidate();
      setBulkDialogVisible(false);
      setBulkText('');
      toast.current?.show({
        severity: 'success',
        summary: 'Bulk Import Complete',
        detail: `${result.data.created} created, ${result.data.skipped} skipped (duplicate)`,
        life: 5000,
      });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setFormError(error.response?.data?.error || 'Failed to import recipients');
    }
  };

  const handleEdit = async () => {
    if (!editingRecipient) return;
    setFormError('');
    if (!form.email.trim() || !form.name.trim()) {
      setFormError('Email and name are required');
      return;
    }
    try {
      await updateMutation.mutateAsync({ id: editingRecipient.id, ...form });
      invalidate();
      setEditDialogVisible(false);
      setEditingRecipient(null);
      toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Recipient updated' });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setFormError(error.response?.data?.error || 'Failed to update recipient');
    }
  };

  const handleDelete = (recipient: Recipient) => {
    confirmDialog({
      message: `Delete ${recipient.email}?`,
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        try {
          await deleteMutation.mutateAsync(recipient.id);
          invalidate();
          setSelectedRecipients((prev) => prev.filter((r) => r.id !== recipient.id));
          toast.current?.show({ severity: 'success', summary: 'Deleted', detail: 'Recipient removed' });
        } catch {
          toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to delete' });
        }
      },
    });
  };

  const handleBulkDelete = () => {
    if (selectedRecipients.length === 0) return;
    confirmDialog({
      message: `Delete ${selectedRecipients.length} selected recipient(s)?`,
      header: 'Bulk Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        try {
          const ids = selectedRecipients.map((r) => r.id);
          const result = await bulkDeleteMutation.mutateAsync(ids);
          invalidate();
          setSelectedRecipients([]);
          toast.current?.show({
            severity: 'success',
            summary: 'Deleted',
            detail: `${result.data.deleted} recipient(s) removed`,
          });
        } catch {
          toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to delete' });
        }
      },
    });
  };

  const handleExport = async () => {
    try {
      const ids = selectedRecipients.map((r) => r.id);
      const blob = await exportMutation.mutateAsync(ids);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `recipients-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.current?.show({
        severity: 'success',
        summary: 'Exported',
        detail: `${ids.length > 0 ? ids.length : 'All'} recipient(s) exported`,
      });
    } catch {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to export' });
    }
  };

  const openEditDialog = (recipient: Recipient) => {
    setEditingRecipient(recipient);
    setForm({ email: recipient.email, name: recipient.name });
    setFormError('');
    setEditDialogVisible(true);
  };

  // Column templates
  const sendCountTemplate = (rowData: Recipient) => (
    <Tag
      value={String(rowData.send_count)}
      severity={rowData.send_count > 0 ? 'success' : 'secondary'}
      rounded
    />
  );

  const lastSentTemplate = (rowData: Recipient) => (
    <span className="text-sm text-600">
      {rowData.last_sent_at ? new Date(rowData.last_sent_at).toLocaleDateString() : '-'}
    </span>
  );

  const createdAtTemplate = (rowData: Recipient) => (
    <span className="text-sm text-600">{new Date(rowData.created_at).toLocaleDateString()}</span>
  );

  const actionsTemplate = (rowData: Recipient) => (
    <div className="flex gap-2">
      <Button icon="pi pi-pencil" severity="info" outlined size="small" onClick={() => openEditDialog(rowData)} tooltip="Edit" tooltipOptions={{ position: 'top' }} />
      <Button icon="pi pi-trash" severity="danger" outlined size="small" onClick={() => handleDelete(rowData)} tooltip="Delete" tooltipOptions={{ position: 'top' }} />
    </div>
  );

  if (isLoading) {
    return (
      <div>
        <div className="flex justify-content-between align-items-center mb-4">
          <Skeleton height="2rem" width="200px" />
          <Skeleton height="2.5rem" width="150px" />
        </div>
        <div className="surface-card border-round-xl shadow-1 p-4">
          <Skeleton height="20rem" />
        </div>
      </div>
    );
  }

  const totalRecords = search.trim() ? filteredRecipients.length : (data?.pagination?.total || 0);

  const renderFormDialog = (
    visible: boolean,
    onHide: () => void,
    header: string,
    onSave: () => void,
    saveLabel: string,
    loading: boolean
  ) => (
    <Dialog
      header={header}
      visible={visible}
      onHide={onHide}
      style={{ width: '420px' }}
      footer={
        <div className="flex justify-content-end gap-2">
          <Button label="Cancel" severity="secondary" outlined onClick={onHide} />
          <Button label={saveLabel} icon="pi pi-check" onClick={onSave} loading={loading} />
        </div>
      }
    >
      <div className="flex flex-column gap-3">
        {formError && (
          <Message severity="error" className="w-full mb-2" style={{ whiteSpace: 'pre-wrap' }} text={formError} />
        )}
        <div className="flex flex-column gap-2">
          <label htmlFor="email" className="text-sm font-medium text-700">Email *</label>
          <InputText id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="recipient@example.com" className="w-full" />
        </div>
        <div className="flex flex-column gap-2">
          <label htmlFor="name" className="text-sm font-medium text-700">Name *</label>
          <InputText id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Doe" className="w-full" />
        </div>
      </div>
    </Dialog>
  );

  const toolbarLeft = () => (
    <div className="flex gap-2">
      {selectedRecipients.length > 0 && (
        <>
          <Button
            label={`Delete (${selectedRecipients.length})`}
            icon="pi pi-trash"
            severity="danger"
            outlined
            size="small"
            onClick={handleBulkDelete}
            loading={bulkDeleteMutation.isPending}
          />
          <Button
            label={`Export (${selectedRecipients.length})`}
            icon="pi pi-download"
            severity="info"
            outlined
            size="small"
            onClick={handleExport}
            loading={exportMutation.isPending}
          />
        </>
      )}
      {selectedRecipients.length === 0 && (
        <Button
          label="Export All"
          icon="pi pi-download"
          severity="info"
          outlined
          size="small"
          onClick={handleExport}
          loading={exportMutation.isPending}
        />
      )}
    </div>
  );

  const toolbarRight = () => (
    <div className="flex gap-2">
      <Button
        label="Bulk Import"
        icon="pi pi-upload"
        severity="secondary"
        outlined
        onClick={() => { setBulkText(''); setFormError(''); setBulkDialogVisible(true); }}
      />
      <Button
        label="Add Recipient"
        icon="pi pi-plus"
        onClick={() => { setForm({ email: '', name: '' }); setFormError(''); setCreateDialogVisible(true); }}
      />
    </div>
  );

  return (
    <div>
      <Toast ref={toast} />
      <ConfirmDialog />

      {renderFormDialog(createDialogVisible, () => { setCreateDialogVisible(false); setFormError(''); }, 'Add Recipient', handleCreate, 'Add Recipient', createMutation.isPending)}
      {renderFormDialog(editDialogVisible, () => { setEditDialogVisible(false); setEditingRecipient(null); setFormError(''); }, 'Edit Recipient', handleEdit, 'Save Changes', updateMutation.isPending)}

      {/* Bulk Import Dialog */}
      <Dialog
        header="Bulk Import Recipients"
        visible={bulkDialogVisible}
        onHide={() => { setBulkDialogVisible(false); setFormError(''); }}
        style={{ width: '550px' }}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button label="Cancel" severity="secondary" outlined onClick={() => setBulkDialogVisible(false)} />
            <Button label="Import" icon="pi pi-upload" onClick={handleBulkCreate} loading={bulkCreateMutation.isPending} />
          </div>
        }
      >
        <div className="flex flex-column gap-3">
          {formError && (
            <Message severity="error" className="w-full mb-2" style={{ whiteSpace: 'pre-wrap' }} text={formError} />
          )}
          <div className="p-3 border-round surface-100 text-sm">
            <i className="pi pi-info-circle mr-2 text-blue-500" />
            Enter one recipient per line in format: <strong>email, name</strong>
          </div>
          <InputTextarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={10}
            placeholder={"john@example.com, John Doe\njane@example.com, Jane Smith\nbob@company.com, Bob Wilson"}
            className="w-full text-sm"
            style={{ fontFamily: 'monospace' }}
            autoResize
          />
          <div className="text-sm text-500">
            {bulkText.split('\n').filter((l) => l.trim()).length} recipient(s) detected
          </div>
        </div>
      </Dialog>

      <div className="flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-900 m-0">Recipients</h1>
          <p className="text-500 text-sm m-0 mt-1">{data?.pagination?.total ?? 0} recipients total</p>
        </div>
      </div>

      <div className="surface-card border-round-xl shadow-1 overflow-hidden">
        <div className="flex align-items-center justify-content-between gap-3 px-4 py-3" style={{ borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
          <Toolbar start={toolbarLeft} end={toolbarRight} className="p-0 surface-card border-none w-full" style={{ boxShadow: 'none' }} />
        </div>
        <div className="px-4 py-3" style={{ borderBottom: '1px solid #e2e8f0' }}>
          <IconField iconPosition="left">
            <InputIcon className="pi pi-search" />
            <InputText
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by email or name..."
              className="w-full"
            />
          </IconField>
        </div>

        {filteredRecipients.length === 0 && !isLoading ? (
          <div className="text-center py-6">
            <i className="pi pi-users text-5xl text-300 mb-3 block" />
            <p className="text-xl text-700 mb-2">No recipients found</p>
            <p className="text-500 mb-4">{search ? 'Try adjusting your search criteria.' : 'Add your first recipient to get started.'}</p>
            {!search && (
              <div className="flex gap-2 justify-content-center">
                <Button label="Add Recipient" icon="pi pi-plus" onClick={() => { setForm({ email: '', name: '' }); setCreateDialogVisible(true); }} />
                <Button label="Bulk Import" icon="pi pi-upload" severity="secondary" outlined onClick={() => { setBulkText(''); setBulkDialogVisible(true); }} />
              </div>
            )}
          </div>
        ) : (
          <DataTable
            value={filteredRecipients}
            selection={selectedRecipients}
            onSelectionChange={(e: DataTableSelectionMultipleChangeEvent<Recipient[]>) => setSelectedRecipients(e.value)}
            selectionMode="multiple"
            paginator
            rows={rows}
            totalRecords={totalRecords}
            lazy={!search.trim()}
            first={(page - 1) * rows}
            onPage={(e) => { setPage(Math.floor(e.first / e.rows) + 1); setRows(e.rows); }}
            rowsPerPageOptions={[5, 10, 25, 50]}
            stripedRows
            emptyMessage="No recipients found"
            dataKey="id"
          >
            <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
            <Column field="email" header="Email" sortable />
            <Column field="name" header="Name" sortable />
            <Column field="send_count" header="Sent" body={sendCountTemplate} sortable style={{ width: '80px' }} />
            <Column field="last_sent_at" header="Last Sent" body={lastSentTemplate} style={{ width: '120px' }} />
            <Column field="created_at" header="Created" body={createdAtTemplate} style={{ width: '120px' }} />
            <Column header="Actions" body={actionsTemplate} style={{ width: '120px' }} />
          </DataTable>
        )}
      </div>
    </div>
  );
}
