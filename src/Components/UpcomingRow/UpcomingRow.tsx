import '@patternfly/react-core/dist/styles/base.css';
import { Record, columnNames } from '../Upcoming/mock_data';
import ExclamationCircleIcon from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import ExclamationTriangleIcon from '@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon';
import InfoCircleIcon from '@patternfly/react-icons/dist/esm/icons/info-circle-icon';
import React, { lazy } from 'react';
import { Tbody, Td, Tr } from '@patternfly/react-table';
import {
  Button,
  Icon,
  Text,
  TextContent,
  TextList,
  TextListItem,
  TextListItemVariants,
  TextListVariants,
  TextVariants,
} from '@patternfly/react-core';
const LifecycleModalWindow = lazy(() => import('../../Components/LifecycleModalWindow/LifecycleModalWindow'));
import { SYSTEM_ID } from '../../__mocks__/mockData';

interface TableRowProps {
  repo: Record;
  columnNames: typeof columnNames;
  rowIndex: number;
  isExpanded: boolean;
  hideRepo: () => void;
  showRepo: () => void;
}

export const TableRow: React.FunctionComponent<TableRowProps> = ({
  repo,
  rowIndex,
  columnNames,
  isExpanded,
  showRepo,
  hideRepo,
}) => {
  // Modal related
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [modalDataName, setModalDataName] = React.useState<string>();
  const [modalData, setModalData] = React.useState<string[]>();

  let childIsFullWidth = false;
  let childHasNoPadding = false;

  const onToggle = () => {
    if (isExpanded) {
      hideRepo();
    } else {
      showRepo();
    }
  };

  // _event is needed as it's provided by onClick handler
  const handleModalToggle = (_event: React.MouseEvent | React.KeyboardEvent) => {
    setIsModalOpen((prevIsModalOpen) => !prevIsModalOpen);
  };

  // Set Icons for the type column
  let typeIcon = null;
  if (repo.type === 'Addition' || repo.type === 'Enhancement') {
    typeIcon = (
      <Icon status="info">
        <InfoCircleIcon />
      </Icon>
    );
  }
  if (repo.type === 'Change') {
    typeIcon = (
      <Icon status="warning">
        <ExclamationTriangleIcon />
      </Icon>
    );
  }
  if (repo.type === 'Deprecation') {
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
    <>
      <Tbody isExpanded={isExpanded}>
        <Tr>
          <Td
            expand={{
              rowIndex: rowIndex,
              isExpanded,
              onToggle,
              expandId: 'composable-expandable-example',
            }}
          />
          <Td dataLabel={columnNames.name} modifier="truncate">
            {repo.name}
          </Td>
          <Td dataLabel={columnNames.type} modifier="truncate">
            <span className="drf-lifecycle__upcoming-row-type">
              {typeIcon}
              {repo.type}
            </span>
          </Td>
          <Td dataLabel={columnNames.release} modifier="truncate">
            {repo.release}
          </Td>
          <Td dataLabel={columnNames.date} modifier="truncate">
            {repo.date}
          </Td>
        </Tr>
        {repo.details ? (
          <Tr isExpanded={isExpanded}>
            {!childIsFullWidth ? <Td /> : null}
            <Td
              className="drf-lifecycle__upcoming-row"
              dataLabel="Summary"
              noPadding={childHasNoPadding}
              colSpan={3}
            >
              <div className="drf-lifecycle__upcoming-row-text-container">
                <TextContent className="drf-lifecycle__upcoming-row-text">
                  <Text component={TextVariants.p}>{repo.details.summary}</Text>
                </TextContent>

                <TextContent className="drf-lifecycle__upcoming-row-text">
                  <TextList component={TextListVariants.dl} style={{ gridRowGap: '0px' }}>
                    <TextListItem component={TextListItemVariants.dt} style={{ paddingBottom: '16px' }}>
                      Potentially affected systems
                    </TextListItem>
                    <TextListItem component={TextListItemVariants.dd}>
                      <Button
                        variant="link"
                        onClick={(event) => {
                          handleModalToggle(event);
                          setModalDataName(String(repo.name));
                          setModalData(SYSTEM_ID);
                        }}
                        style={{
                          marginTop: '-4px',
                          fontSize: '14px',
                          marginLeft: '-16px',
                        }}
                      >
                        {repo.details.potentiallyAffectedSystems}
                      </Button>
                    </TextListItem>
                    <TextListItem component={TextListItemVariants.dt}>Training ticket</TextListItem>
                    <TextListItem component={TextListItemVariants.dd}>{repo.details.trainingTicket}</TextListItem>
                    <TextListItem component={TextListItemVariants.dt}>Date added</TextListItem>
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
              </div>
            </Td>
          </Tr>
        ) : null}
      </Tbody>
      <LifecycleModalWindow
        name={modalDataName}
        modalData={modalData}
        setModalData={setModalData}
        isModalOpen={isModalOpen}
        handleModalToggle={handleModalToggle}
      ></LifecycleModalWindow>
    </>
  );
};
