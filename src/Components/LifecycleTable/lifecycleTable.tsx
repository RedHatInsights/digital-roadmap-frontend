import React, { ReactNode, useState, useEffect } from 'react';
import Moment from 'moment';
import { Table, Thead, Tr, Th, Tbody, Td, ThProps } from '@patternfly/react-table';


interface LifecycleChanges {
    name: string;
    release: string;
    major: number;
    minor: number;
    release_date: Date;
    retirement_date: Date;
    systems: number;
    lifecycle_type: string;
  };

interface LifecycleChangesProps {
  lifecycleData: LifecycleChanges[];
}

type columnNames = {
  columnNames: {
    name: string;
    release: string;
    release_date: Date;
    retirement_date: Date;
    systems: number;
  };
}

const columnNames = {
  name: 'Name',
  release: 'Release',
  release_date: 'Release Date',
  retirement_date: 'Retirement Date',
  systems: 'Systems'
  };

interface NameandVersionProps {
  nameVersion: NameandVersion[];
}

interface NameandVersion {
  name: string;
}

export const LifecycleTable: React.FunctionComponent<LifecycleChangesProps> = (
  {lifecycleData}
) => {


  const [newLifecycleData, setNewLifecycleData] = useState(lifecycleData);

  const getLifecycleType = (lifecycleType: string) => {
    switch (lifecycleType) {
      case 'eus':
        return ' EUS';
      case 'e4s':
        return ' for SAP';
      default:
        return '';
    }
  };

  const getNewName = (name: string, major: number, minor: number, lifecycleType: string) => {
    const lifecycleText = getLifecycleType(lifecycleType);
    return `${name} ${major}.${minor}${lifecycleText}`;
  };

  const updateLifecycleData = () => {
    const newData = lifecycleData.map((datum) => {
      datum.name = getNewName(datum.name, datum.major, datum.minor, datum.lifecycle_type);
      return datum;
    });
    setNewLifecycleData(newData);
  };

  useEffect(() => {
    updateLifecycleData();
  }, []);

  useEffect(() => {
    updateLifecycleData();
  }, [lifecycleData]);

  // Index of the currently sorted column
  // Note: if you intend to make columns reorderable, you may instead want to use a non-numeric key
  // as the identifier of the sorted column. See the "Compound expandable" example.
  const [activeSortIndex, setActiveSortIndex] = React.useState<number | undefined>(undefined);

  // Sort direction of the currently sorted column
  const [activeSortDirection, setActiveSortDirection] = React.useState<'asc' | 'desc' | undefined>(undefined);

  // Since OnSort specifies sorted columns by index, we need sortable values for our object by column index.
  // This example is trivial since our data objects just contain strings, but if the data was more complex
  // this would be a place to return simplified string or number versions of each column to sort by.
  const getSortableRowValues = (repo: LifecycleChanges): (string | number | Date)[] => {
    const { name, release, release_date, retirement_date, systems } = repo;
    return [name, release, release_date, retirement_date, systems];
  };

  // Note that we perform the sort as part of the component's render logic and not in onSort.
  // We shouldn't store the list of data in state because we don't want to have to sync that with props.
  let sortedRepositories = newLifecycleData;
  if (typeof activeSortIndex !== 'undefined') {
    sortedRepositories = newLifecycleData.sort((a: LifecycleChanges, b: LifecycleChanges) => {
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

  const getSortParams = (columnIndex: number): ThProps['sort'] => ({
    sortBy: {
      index: activeSortIndex,
      direction: activeSortDirection,
      defaultDirection: 'asc' // starting sort direction when first sorting a column. Defaults to 'asc'
    },
    onSort: (_event, index, direction) => {
      setActiveSortIndex(index);
      setActiveSortDirection(direction);
    },
    columnIndex
  });

  // In this example, we wrap all but the 1st column and make the 1st and 3rd columns sortable just to demonstrate.
  return (
    <Table aria-label="Sortable table" ouiaId="SortableTable">
      <Thead>
        <Tr>
          <Th sort={getSortParams(0)}>{columnNames.name}</Th>
          <Th modifier="wrap" sort={getSortParams(1)}>
            {columnNames.release}
          </Th>
          <Th modifier="wrap" sort={getSortParams(2)}>
            {columnNames.release_date}
          </Th>
          <Th modifier="wrap" sort={getSortParams(3)}>
            {columnNames.retirement_date}
          </Th>
          <Th modifier="wrap" sort={getSortParams(4)}>
            {columnNames.systems}
          </Th>
        </Tr>
      </Thead>
      <Tbody>
        {sortedRepositories.map((repo: LifecycleChanges , rowIndex: React.Key | null | undefined) => (
          <Tr key={rowIndex}>
            <Td style={{paddingRight: '140px'}} dataLabel={columnNames.name}>{repo.name}</Td>
            <Td dataLabel={columnNames.release}>{repo.release}</Td>
            <Td dataLabel={(columnNames.release_date)}>{(Moment(repo.release_date).format('MMM YYYY'))}</Td>
            <Td dataLabel={(columnNames.retirement_date)}>{Moment(repo.retirement_date).format('MMM YYYY')}</Td>
            <Td dataLabel={(columnNames.systems)}>{repo.systems}</Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
};

export default LifecycleTable;
