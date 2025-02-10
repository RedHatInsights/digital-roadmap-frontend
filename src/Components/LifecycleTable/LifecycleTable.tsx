import React from 'react';
import { Table, Tbody, Td, Th, ThProps, Thead, Tr } from '@patternfly/react-table';
import Moment from 'moment';
import { SystemLifecycleChanges } from '../../types/SystemLifecycleChanges';
import { Stream } from '../../types/Stream';
interface LifecycleTableProps {
  data: Stream[] | SystemLifecycleChanges[];
  type: 'streams' | 'rhel';
}

const LIFECYCLE_COLUMN_NAMES = {
  name: 'Name',
  release: 'Release',
  release_date: 'Release date',
  retirement_date: 'Retirement date',
  systems: 'Systems',
};

const APP_LIFECYCLE_COLUMN_NAMES = {
  name: 'Name',
  release: 'Release',
  release_date: 'Release date',
  retirement_date: 'Retirement date',
  systems: 'Systems',
};

const DEFAULT_ARIA_LABEL = 'Table displaying lifecycle information';

export const LifecycleTable: React.FunctionComponent<LifecycleTableProps> = ({ data, type }: LifecycleTableProps) => {
  // Index of the currently sorted column
  // Note: if you intend to make columns reorderable, you may instead want to use a non-numeric key
  // as the identifier of the sorted column. See the "Compound expandable" example.
  const [activeSortIndex, setActiveSortIndex] = React.useState<number | undefined>(undefined);
  // Sort direction of the currently sorted column
  const [activeSortDirection, setActiveSortDirection] = React.useState<'asc' | 'desc' | undefined>(undefined);

  // Since OnSort specifies sorted columns by index, we need sortable values for our object by column index.
  // This example is trivial since our data objects just contain strings, but if the data was more complex
  // this would be a place to return simplified string or number versions of each column to sort by.
  const getSortableRowValues = (repo: SystemLifecycleChanges): (string | number | Date)[] => {
    const { name, release, release_date, retirement_date, systems } = repo;
    return [name, release, release_date, retirement_date, systems];
  };

  const getSortParams = (columnIndex: number): ThProps['sort'] => ({
    sortBy: {
      index: activeSortIndex,
      direction: activeSortDirection,
      defaultDirection: 'asc', // starting sort direction when first sorting a column. Defaults to 'asc'
    },
    onSort: (_event, index, direction) => {
      setActiveSortIndex(index);
      setActiveSortDirection(direction);
    },
    columnIndex,
  });

  const formatDate = (date: string) => {
    if (date === 'Unknown') {
      return 'Not available';
    }
    return Moment(date).format('MMM YYYY');
  };

  const renderAppLifecycleData = (data: Stream[]) =>
    data.map((stream) => {
      return (
        <Tr key={`${stream.name}-${stream.stream}-${stream.start_date}-${stream.end_date}`}>
          <Td dataLabel={APP_LIFECYCLE_COLUMN_NAMES.name}>
            {stream.name} {stream.stream}
          </Td>
          <Td dataLabel={APP_LIFECYCLE_COLUMN_NAMES.release}>{stream.rhel_major_version}</Td>
          <Td dataLabel={APP_LIFECYCLE_COLUMN_NAMES.release_date}>{formatDate(stream.start_date)}</Td>
          <Td dataLabel={APP_LIFECYCLE_COLUMN_NAMES.retirement_date}>{formatDate(stream.end_date)}</Td>
          <Td dataLabel={APP_LIFECYCLE_COLUMN_NAMES.systems}>N/A</Td>
        </Tr>
      );
    });

  const renderSystemLifecycleData = (data: SystemLifecycleChanges[]) => {
    // Note that we perform the sort as part of the component's render logic and not in onSort.
    // We shouldn't store the list of data in state because we don't want to have to sync that with props.
    let sortedRepositories = data as SystemLifecycleChanges[];

    if (typeof activeSortIndex !== 'undefined') {
      sortedRepositories = sortedRepositories.sort((a: SystemLifecycleChanges, b: SystemLifecycleChanges) => {
        const aValue = getSortableRowValues(a)[activeSortIndex];
        const bValue = getSortableRowValues(b)[activeSortIndex];
        if (typeof aValue === 'number') {
          // Numeric sort
          if (activeSortDirection === 'asc') {
            return (aValue as number) - (bValue as number);
          }
          return (bValue as number) - (aValue as number);
        } else {
          // String sort
          if (activeSortDirection === 'asc') {
            return (aValue as string).localeCompare(bValue as string);
          }
          return (bValue as string).localeCompare(aValue as string);
        }
      });
    }

    return sortedRepositories.map((repo: SystemLifecycleChanges) => (
      <Tr key={`${repo.name}-${repo.release}-${repo.release_date}-${repo.retirement_date}-${repo.systems}`}>
        <Td style={{ paddingRight: '140px' }} dataLabel={LIFECYCLE_COLUMN_NAMES.name}>
          {repo.name}
        </Td>
        <Td dataLabel={LIFECYCLE_COLUMN_NAMES.release}>{repo.release}</Td>
        <Td dataLabel={LIFECYCLE_COLUMN_NAMES.release_date}>{Moment(repo.release_date).format('MMM YYYY')}</Td>
        <Td dataLabel={LIFECYCLE_COLUMN_NAMES.retirement_date}>{Moment(repo.retirement_date).format('MMM YYYY')}</Td>
        <Td dataLabel={LIFECYCLE_COLUMN_NAMES.systems}>{repo.systems}</Td>
      </Tr>
    ));
  };

  const renderHeaders = () => {
    switch (type) {
      case 'streams':
        return (
          <Tr key={LIFECYCLE_COLUMN_NAMES.name}>
            <Th sort={getSortParams(0)}>{LIFECYCLE_COLUMN_NAMES.name}</Th>
            <Th modifier="wrap" sort={getSortParams(1)}>
              {LIFECYCLE_COLUMN_NAMES.release}
            </Th>
            <Th modifier="wrap" sort={getSortParams(2)}>
              {LIFECYCLE_COLUMN_NAMES.release_date}
            </Th>
            <Th modifier="wrap" sort={getSortParams(3)}>
              {LIFECYCLE_COLUMN_NAMES.retirement_date}
            </Th>
            <Th modifier="wrap" sort={getSortParams(4)}>
              {LIFECYCLE_COLUMN_NAMES.systems}
            </Th>
          </Tr>
        );
      case 'rhel':
        return (
          <Tr key={LIFECYCLE_COLUMN_NAMES.name}>
            <Th sort={getSortParams(0)}>{LIFECYCLE_COLUMN_NAMES.name}</Th>
            <Th modifier="wrap" sort={getSortParams(1)}>
              {LIFECYCLE_COLUMN_NAMES.release}
            </Th>
            <Th modifier="wrap" sort={getSortParams(2)}>
              {LIFECYCLE_COLUMN_NAMES.release_date}
            </Th>
            <Th modifier="wrap" sort={getSortParams(3)}>
              {LIFECYCLE_COLUMN_NAMES.retirement_date}
            </Th>
            <Th modifier="wrap" sort={getSortParams(4)}>
              {LIFECYCLE_COLUMN_NAMES.systems}
            </Th>
          </Tr>
        );
      default:
        return;
    }
  };

  const renderData = (): React.ReactNode => {
    switch (type) {
      case 'streams':
        return renderAppLifecycleData(data as Stream[]);
      case 'rhel':
        return renderSystemLifecycleData(data as SystemLifecycleChanges[]);
      default:
        return;
    }
  };

  const getAriaLabel = () => {
    switch (type) {
      case 'streams':
        return 'Table displaying RHEL 9 Application Streams Lifecycle information';
      case 'rhel':
        return 'Table displaying Red Hat Enterprise Linux Lifecycle information';
      default:
        return DEFAULT_ARIA_LABEL;
    }
  };

  return (
    <Table aria-label={getAriaLabel()}>
      <Thead>{renderHeaders()}</Thead>
      <Tbody>{renderData()}</Tbody>
    </Table>
  );
};

export default LifecycleTable;
