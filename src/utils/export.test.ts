import { downloadFile, exportData, toXml } from './export';

URL.createObjectURL = jest.fn(() => 'blob:mock-url');
URL.revokeObjectURL = jest.fn();

jest.mock('export-to-csv', () => ({
  mkConfig: jest.fn(() => ({})),
  generateCsv: jest.fn(() => () => 'csv,data'),
  download: jest.fn(() => jest.fn()),
}));

describe('toXml', () => {
  it('escapes special XML characters in values', () => {
    const data = [{ name: 'host<2>', description: 'A & B "test" \'value\'' }];
    const xml = toXml(data);

    expect(xml).toContain('&lt;2&gt;');
    expect(xml).toContain('A &amp; B &quot;test&quot; &apos;value&apos;');
    expect(xml).not.toContain('<2>');
  });

  it('sanitizes tag names derived from keys', () => {
    const data = [{ 'Affected systems': 5, '1bad': 'val' }];
    const xml = toXml(data);

    expect(xml).toContain('<Affected_systems>');
    expect(xml).toContain('<_1bad>');
    expect(xml).not.toContain('<Affected systems>');
  });

  it('produces well-formed XML for normal data', () => {
    const data = [
      { release: 'RHEL', version: '9.3' },
      { release: 'RHEL', version: '8.9' },
    ];
    const xml = toXml(data);

    expect(xml).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>/);
    expect(xml).toContain('<data>');
    expect(xml).toContain('</data>');
    expect((xml.match(/<row>/g) || []).length).toBe(2);
  });

  it('returns empty data element for empty array', () => {
    const xml = toXml([]);
    expect(xml).toBe('<?xml version="1.0" encoding="UTF-8"?>\n<data>\n\n</data>');
  });
});

describe('downloadFile', () => {
  let clickSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    clickSpy = jest.fn();
    jest.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click: clickSpy,
    } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates a blob URL and triggers a download', () => {
    downloadFile('content', 'test.json', 'application/json');

    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(clickSpy).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });
});

describe('exportData', () => {
  const { generateCsv, download } = jest.requireMock('export-to-csv');
  let clickSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    clickSpy = jest.fn();
    jest.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click: clickSpy,
    } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const sampleData = [{ name: 'test', value: 1 }];

  it('exports CSV using export-to-csv library', () => {
    exportData('csv', sampleData);

    expect(generateCsv).toHaveBeenCalled();
    expect(download).toHaveBeenCalled();
  });

  it('exports JSON via downloadFile', () => {
    exportData('json', sampleData);

    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
  });

  it('exports XML with escaped values via downloadFile', () => {
    exportData('xml', [{ host: 'a<b' }]);

    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
  });
});
