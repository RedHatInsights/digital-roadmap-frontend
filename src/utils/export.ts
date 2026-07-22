import { download, generateCsv, mkConfig } from 'export-to-csv';
import { ExportFormat } from '../Components/ExportDataButton/ExportDataButton';

type ExportRow = { [key: string]: string | number };

const escapeXml = (val: string | number): string =>
  String(val)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const sanitizeTagName = (key: string): string =>
  key
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_.-]/g, '_')
    .replace(/^(\d)/, '_$1');

export const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const toXml = (data: ExportRow[]): string => {
  const xmlRows = data
    .map((row) => {
      const fields = Object.entries(row)
        .map(([key, value]) => {
          const tag = sanitizeTagName(key);
          return `      <${tag}>${escapeXml(value)}</${tag}>`;
        })
        .join('\n');
      return `    <row>\n${fields}\n    </row>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<data>\n${xmlRows}\n</data>`;
};

const csvConfig = mkConfig({ useKeysAsHeaders: true });

export const exportData = (format: ExportFormat, data: ExportRow[]): void => {
  switch (format) {
    case 'csv': {
      const csv = generateCsv(csvConfig)(data);
      download(csvConfig)(csv);
      break;
    }
    case 'json': {
      downloadFile(JSON.stringify(data, null, 2), 'export.json', 'application/json');
      break;
    }
    case 'xml': {
      downloadFile(toXml(data), 'export.xml', 'application/xml');
      break;
    }
  }
};
