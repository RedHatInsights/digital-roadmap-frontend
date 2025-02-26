import '@patternfly/react-core/dist/styles/base.css';
import { Record, columnNames } from '../Upcoming/mock_data';
import ExclamationCircleIcon from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import ExclamationTriangleIcon from '@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon';
import InfoCircleIcon from '@patternfly/react-icons/dist/esm/icons/info-circle-icon';
import React, { useState } from 'react';
import { Tbody, Td, Tr } from '@patternfly/react-table';
import {
  Icon,
  Text,
  TextContent,
  TextList,
  TextListItem,
  TextListItemVariants,
  TextListVariants,
  TextVariants,
} from '@patternfly/react-core';
import { capitalizeFirstLetter } from '../../utils/utils';

interface TableRowProps {
  repo: Record;
  columnNames: typeof columnNames;
  rowIndex: number;
}

export const TableRow: React.FunctionComponent<TableRowProps> = ({ repo, rowIndex, columnNames }) => {
  const [isRepoExpanded, setIsRepoExpanded] = useState(false);
  let childIsFullWidth = false;
  let childHasNoPadding = false;

  // Set Icons for the type column
  let typeIcon = null;
  if (capitalizeFirstLetter(repo.type) == 'Addition') {
    typeIcon = (
      <Icon status="info">
        <InfoCircleIcon />
      </Icon>
    );
  }
  if (repo.type == 'Change') {
    typeIcon = (
      <Icon status="warning">
        <ExclamationTriangleIcon />
      </Icon>
    );
  }
  if (repo.type == 'Deprecation') {
    typeIcon = (
      <Icon status="danger">
        <ExclamationCircleIcon />
      </Icon>
    );
  }

  if (repo.details) {
    const { detailFormat } = repo.details;
    childIsFullWidth = [1, 3].includes(detailFormat);
    childHasNoPadding = [2, 3].includes(detailFormat);
  }
  return (
    <Tbody key={`${repo.name}-${repo.type}-${repo.release}-${repo.date}`} isExpanded={isRepoExpanded}>
      <Tr>
        <Td
          expand={{
            rowIndex: rowIndex,
            isExpanded: isRepoExpanded,
            onToggle: () => setIsRepoExpanded(!isRepoExpanded),
            expandId: 'composable-expandable-example',
          }}
        />
        <Td dataLabel={columnNames.name} modifier="truncate">
          {repo.name}
        </Td>
        <Td dataLabel={columnNames.type} modifier="truncate">
          {typeIcon} {capitalizeFirstLetter(repo.type)}
        </Td>
        <Td dataLabel={columnNames.release} modifier="truncate">
          {repo.release}
        </Td>
        <Td dataLabel={columnNames.date} modifier="truncate">
          {repo.date}
        </Td>
      </Tr>
      {repo.details ? (
        <Tr isExpanded={isRepoExpanded}>
          {!childIsFullWidth ? <Td /> : null}
          <Td className="drf-lifecycle__upcoming-row" dataLabel="Summary" noPadding={childHasNoPadding} colSpan={3}>
            <TextContent className="drf-lifecycle__upcoming-row-text">
              <Text component={TextVariants.p}>{repo.details.summary}</Text>
            </TextContent>

            <TextContent className="drf-lifecycle__upcoming-row-text">
              <TextList component={TextListVariants.dl} style={{ gridRowGap: '0px' }}>
                <TextListItem component={TextListItemVariants.dt} style={{ paddingBottom: '16px' }}>
                  Potentially affected systems
                </TextListItem>
                <TextListItem component={TextListItemVariants.dd}>
                  {repo.details.potentiallyAffectedSystems}
                </TextListItem>
                <TextListItem component={TextListItemVariants.dt}>Training ticket</TextListItem>
                <TextListItem component={TextListItemVariants.dd}>{repo.details.trainingTicket}</TextListItem>
                <TextListItem component={TextListItemVariants.dt}>Date added {''}</TextListItem>
                <TextListItem component={TextListItemVariants.dd}>{repo.details.dateAdded}</TextListItem>
                <TextListItem component={TextListItemVariants.dt}>Last modified</TextListItem>
                <TextListItem component={TextListItemVariants.dd}>{repo.details.lastModified}</TextListItem>
              </TextList>
            </TextContent>
            {/* 
                <TextContent>
                  <TextList component={TextListVariants.dl}>
                    <TextListItem component={TextListItemVariants.dt}>Date added                    {""}</TextListItem>
                    <TextListItem component={TextListItemVariants.dd}>
                      {repo.details.dateAdded}
                    </TextListItem>
                  </TextList>
                </TextContent>

                <TextContent>
                 <TextList component={TextListVariants.dl}>
                  <TextListItem component={TextListItemVariants.dt}>Last modified</TextListItem>
                  <TextListItem component={TextListItemVariants.dd}>
                      {repo.details.lastModified}
                  </TextListItem>
                 </TextList>
                </TextContent> */}
          </Td>
        </Tr>
      ) : null}
    </Tbody>
  );
};
