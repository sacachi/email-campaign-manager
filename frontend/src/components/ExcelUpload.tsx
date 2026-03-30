import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Message } from 'primereact/message';

interface ParsedRecipient {
  email: string;
  name: string;
  isValid: boolean;
  error?: string;
}

interface ExcelUploadProps {
  onDataLoaded: (recipients: ParsedRecipient[]) => void;
}

export function ExcelUpload({ onDataLoaded }: ExcelUploadProps) {
  const [parseError, setParseError] = useState('');

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setParseError('');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

        const recipients: ParsedRecipient[] = [];
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          const email = row[0]?.toString().trim() || '';
          const name = row[1]?.toString().trim() || '';
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          const isValid = emailRegex.test(email) && name.length > 0;
          recipients.push({
            email,
            name,
            isValid,
            error: !emailRegex.test(email) ? 'Invalid email format' : !name ? 'Name is required' : undefined,
          });
        }
        onDataLoaded(recipients);
      } catch {
        setParseError('Error parsing file. Please check the format and try again.');
      }
    };
    reader.readAsBinaryString(file);
    event.target.value = '';
  }, [onDataLoaded]);

  return (
    <div className="flex flex-column gap-2">
      <label
        className="flex flex-column align-items-center justify-content-center gap-3 border-round-xl p-5 cursor-pointer"
        style={{ border: '2px dashed #cbd5e1', transition: 'border-color 0.2s, background 0.2s' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--primary-color)'; (e.currentTarget as HTMLElement).style.background = '#f8faff'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#cbd5e1'; (e.currentTarget as HTMLElement).style.background = ''; }}
      >
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        <i className="pi pi-file-excel" style={{ fontSize: '2.5rem', color: '#22c55e' }} />
        <div className="text-center">
          <p className="font-medium text-700 m-0 mb-1">Click to upload Excel / CSV</p>
          <p className="text-500 text-sm m-0 mb-1">Supports .xlsx, .xls, .csv</p>
          <p className="text-400 text-xs m-0">Format: Column A = Email, Column B = Name</p>
        </div>
      </label>
      {parseError && <Message severity="error" text={parseError} className="w-full" />}
    </div>
  );
}
