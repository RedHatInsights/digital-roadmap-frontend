import React from 'react';
import { Table, Tbody, Tr, Td, Thead, Th } from '@patternfly/react-table';
import Moment from 'moment';
import { AppLifecycleChanges } from '../../types/AppLifecycleChanges';

interface dataAppLifeCycleChanges {
    data: AppLifecycleChanges[];

}

const columnNames = {
  name: 'Name',
  release: 'Release',
  release_date: 'Release date',
  retirement_date: 'Retirement date',
  systems: 'Systems'
};

export const appLifecycleTab: React.FunctionComponent<dataAppLifeCycleChanges> = (
  {data}
) => {
    const rows = data.flatMap(repo => repo.streams).map(stream => (
        
        <Tr key={stream.name}>
          <Td dataLabel={columnNames.name}>{stream.name} {stream.stream}</Td>
          <Td dataLabel={columnNames.release}>{data.filter((appLifecycleChanges) => appLifecycleChanges.streams.some((str) => str.context === stream.context))[0].rhel_major_version}</Td>
          <Td dataLabel={(columnNames.release_date)}>{(Moment(stream.start_date).format('MMM YYYY'))}</Td>
          <Td dataLabel={(columnNames.retirement_date)}>{Moment(stream.end_date).format('MMM YYYY')}</Td>
          <Td dataLabel={(columnNames.systems)}>N/A</Td>
        </Tr>
  ));

  return (
    <Table aria-label="Simple table">
      <Thead>
        <Tr>
        <Th>{columnNames.name}</Th>
        <Th>{columnNames.release}</Th>
        <Th>{columnNames.release_date}</Th>
        <Th>{columnNames.retirement_date}</Th>
        <Th>{columnNames.systems}</Th>
        </Tr>
      </Thead>
      <Tbody>
        {rows}
      </Tbody>
    </Table>
  );
};

export default appLifecycleTab;