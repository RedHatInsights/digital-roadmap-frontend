import React, { ReactNode, useState, useEffect } from 'react';
import Moment from 'moment';
import { Table, Thead, Tr, Th, Tbody, Td, ThProps } from '@patternfly/react-table';
import { getLifecycleChanges } from '../../api';


interface LifecycleChanges {
    name: string;
    release: string;
    major: number;
    minor: number;
    release_date: Date;
    retirement_date: Date;
    systems: number;
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

export const LifecycleTable: React.FunctionComponent<LifecycleChangesProps> = (
  {lifecycleData}
) => {


  // In this example, we wrap all but the 1st column and make the 1st and 3rd columns sortable just to demonstrate.
  return (
    <React.Fragment>
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
        {lifecycleData.map((repo) => (
          <Tr key={repo.name}>
              <Td style={{paddingRight: '140px'}} dataLabel={columnNames.name}>{repo.name} {repo.major}.{repo.minor}</Td>
              <Td dataLabel={columnNames.release}>Not Applicable</Td>
              <Td dataLabel={(columnNames.release_date)}>{(Moment(repo.release_date).format('MMM YYYY'))}</Td>
              <Td dataLabel={(columnNames.retirement_date)}>{Moment(repo.retirement_date).format('MMM YYYY')}</Td>
              <Td dataLabel={(columnNames.systems)}>{repo.systems}</Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  </React.Fragment>
  );
};

export default LifecycleTable;
