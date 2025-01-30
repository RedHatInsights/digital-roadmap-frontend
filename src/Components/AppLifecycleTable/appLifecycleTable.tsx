import React from 'react';
import { Table, Tbody, Tr, Td } from '@patternfly/react-table';
import Moment from 'moment';

interface dataAppLifeCycleChanges {
    data: AppLifecycleChanges[];

}

interface AppLifecycleChanges {
    module_name: string;
    rhel_major_version: number;
    streams: Stream[];
  }
  
interface Stream {
    arch: string;
    context: string;
    description: string;
    end_date: string;
    name: string;
    profiles: Profiles;
    start_date: string;
    stream: string;
    version: string;
  }
  
interface Profiles {
    common: string[];
  }

const columnNames = {
  name: 'Name',
  release: 'Release',
  release_date: 'Release Date',
  retirement_date: 'Retirement Date',
  systems: 'Systems'
};

export const appLifecycleTab: React.FunctionComponent<dataAppLifeCycleChanges> = (
  {data}
) => {
    const rows = data.flatMap(repo => repo.streams).map(stream => (
        <Tr key={stream.name}>
          <Td style={{ paddingRight: '140px' }} dataLabel={columnNames.name}>{stream.name}</Td>
          <Td dataLabel={columnNames.release}>{stream.context}</Td>
          <Td dataLabel={(columnNames.release_date)}>{(Moment(stream.start_date).format('MMM YYYY'))}</Td>
          <Td dataLabel={(columnNames.retirement_date)}>{Moment(stream.end_date).format('MMM YYYY')}</Td>
          <Td dataLabel={(columnNames.systems)}>N/A</Td>
        </Tr>
  ));

  return (
    <Table variant="compact" borders={false}>
      <Tbody>
        {rows}
      </Tbody>
    </Table>
  );
};

export default appLifecycleTab;