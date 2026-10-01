import { createElement } from 'lwc';
import OdDatatableRelatedList from 'c/odDatatableRelatedList';
import getConfigurationRelatedList from '@salesforce/apex/OD_DatatableConfigurationController.getConfigurationRelatedList';
import getRecordsRelatedList from '@salesforce/apex/OD_DatatableRecordsController.getRecordsRelatedList';
import getLockStatus from '@salesforce/apex/OD_DatatableConfigurationController.getLockStatus';
import { refreshApex } from '@salesforce/apex';

jest.mock(
  '@salesforce/apex/OD_DatatableConfigurationController.getConfigurationRelatedList',
  () => {
    const { createApexTestWireAdapter } = require('@salesforce/sfdx-lwc-jest');
    return { default: createApexTestWireAdapter(jest.fn()) };
  },
  { virtual: true },
);

jest.mock(
  '@salesforce/apex/OD_DatatableRecordsController.getRecordsRelatedList',
  () => {
    const { createApexTestWireAdapter } = require('@salesforce/sfdx-lwc-jest');
    return { default: createApexTestWireAdapter(jest.fn()) };
  },
  { virtual: true },
);

jest.mock('@salesforce/apex/OD_DatatableConfigurationController.getLockStatus', () => ({ default: jest.fn() }), {
  virtual: true,
});

jest.mock('@salesforce/apex', () => ({ refreshApex: jest.fn(() => Promise.resolve()) }), { virtual: true });

const TABLE_NAME = 'lineItemsTable';

function buildConfiguration(overrides = {}) {
  const values = {
    canAdd: 'Yes',
    canEdit: 'Yes',
    canDelete: 'Yes',
    inlineSave: 'Yes',
    canBulkDelete: 'Yes',
    canBulkEdit: 'Yes',
    ...overrides,
  };

  const configuration = {
    columns: { value: JSON.stringify([{ fieldName: 'Name', typeAttributes: { config: {} } }]) },
    uniqueTableName: { value: TABLE_NAME },
    objectName: { value: 'Line_Items__c' },
    sharingContext: { value: 'Without Sharing' },
  };

  Object.entries(values).forEach(([key, value]) => {
    configuration[key] = { value };
  });

  return JSON.stringify(configuration);
}

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

async function render({ startReadOnly, configuration = buildConfiguration(), locked = false } = {}) {
  getLockStatus.mockResolvedValue(locked);

  const element = createElement('c-od-datatable-related-list', { is: OdDatatableRelatedList });
  element.recordId = 'a0B000000000001AAA';
  element.relatedObjectApiName = 'Line_Items__c';
  element.fieldApiName = 'Enrollment_Service__c';
  element.customMetadataName = 'Support_Service_Line_Items';
  if (startReadOnly !== undefined) {
    element.startReadOnly = startReadOnly;
  }
  document.body.appendChild(element);

  getConfigurationRelatedList.emit(configuration);
  getRecordsRelatedList.emit([{ Id: 'a0C000000000001AAA', Name: 'Item 1' }]);
  await flushPromises();

  return element;
}

const getTable = (element) => element.shadowRoot.querySelector('c-od-datatable');
const getButton = (element, id) => element.shadowRoot.querySelector(`lightning-button[data-id="${id}"]`);

describe('c-od-datatable-related-list', () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    jest.clearAllMocks();
    sessionStorage.clear();
  });

  it('is editable straight away when read-only mode is off', async () => {
    const element = await render();

    const table = getTable(element);
    expect(table.canEdit).toBe('Yes');
    expect(table.canAdd).toBe('Yes');
    expect(table.inlineSave).toBe('Yes');
    expect(getButton(element, 'edit-button')).toBeNull();
    expect(getButton(element, 'cancel-button')).toBeNull();
  });

  it('starts read-only with an Edit button when read-only mode is on', async () => {
    const element = await render({ startReadOnly: true });

    const table = getTable(element);
    expect(table.canAdd).toBe(false);
    expect(table.canEdit).toBe(false);
    expect(table.canDelete).toBe(false);
    expect(table.inlineSave).toBe(false);
    expect(table.canBulkDelete).toBe('No');
    expect(table.canBulkEdit).toBe('No');
    expect(getButton(element, 'edit-button')).not.toBeNull();
    expect(getButton(element, 'cancel-button')).toBeNull();
  });

  it('re-creates the table as editable when Edit is clicked', async () => {
    const element = await render({ startReadOnly: true });
    const readOnlyTable = getTable(element);

    getButton(element, 'edit-button').click();
    await flushPromises();

    const table = getTable(element);
    expect(table).not.toBe(readOnlyTable);
    expect(table.canAdd).toBe('Yes');
    expect(table.canEdit).toBe('Yes');
    expect(table.canDelete).toBe('Yes');
    expect(table.inlineSave).toBe('Yes');
    expect(table.canBulkEdit).toBe('Yes');
    expect(getButton(element, 'edit-button')).toBeNull();
    expect(getButton(element, 'cancel-button')).not.toBeNull();
  });

  it('discards unsaved changes and returns to read-only on Cancel', async () => {
    const element = await render({ startReadOnly: true });
    getButton(element, 'edit-button').click();
    await flushPromises();
    sessionStorage.setItem(TABLE_NAME, JSON.stringify({ added: [{ Name: 'Unsaved' }] }));

    getButton(element, 'cancel-button').click();
    await flushPromises();

    expect(sessionStorage.getItem(TABLE_NAME)).toBeNull();
    expect(getTable(element).canEdit).toBe(false);
    expect(getButton(element, 'edit-button')).not.toBeNull();
  });

  it('refreshes the rows and returns to read-only after a successful save', async () => {
    const element = await render({ startReadOnly: true });
    getButton(element, 'edit-button').click();
    await flushPromises();

    getTable(element).dispatchEvent(new CustomEvent('aftersave', { detail: { success: true } }));
    await flushPromises();

    expect(refreshApex).toHaveBeenCalledTimes(1);
    expect(getTable(element).canEdit).toBe(false);
    expect(getButton(element, 'edit-button')).not.toBeNull();
  });

  it('stays in edit mode when some rows failed to save', async () => {
    const element = await render({ startReadOnly: true });
    getButton(element, 'edit-button').click();
    await flushPromises();
    const editingTable = getTable(element);

    editingTable.dispatchEvent(new CustomEvent('aftersave', { detail: { success: false } }));
    await flushPromises();

    expect(refreshApex).not.toHaveBeenCalled();
    expect(getTable(element)).toBe(editingTable);
    expect(getTable(element).canEdit).toBe('Yes');
    expect(getButton(element, 'cancel-button')).not.toBeNull();
  });

  it('does not change save behavior when read-only mode is off', async () => {
    const element = await render();
    const table = getTable(element);

    table.dispatchEvent(new CustomEvent('aftersave', { detail: { success: true } }));
    await flushPromises();

    expect(refreshApex).not.toHaveBeenCalled();
    expect(getTable(element)).toBe(table);
  });

  it('hides the Edit button when the record is locked', async () => {
    const element = await render({ startReadOnly: true, locked: true });

    expect(getButton(element, 'edit-button')).toBeNull();
    expect(getTable(element).canEdit).toBe(false);
  });

  it('hides the Edit button when the table allows no changes', async () => {
    const element = await render({
      startReadOnly: true,
      configuration: buildConfiguration({ canAdd: 'No', canEdit: 'No', canDelete: 'No' }),
    });

    expect(getButton(element, 'edit-button')).toBeNull();
  });
});
