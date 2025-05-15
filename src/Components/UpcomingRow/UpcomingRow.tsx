import '@patternfly/react-core/dist/styles/base.css';
import ExclamationCircleIcon from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import ExclamationTriangleIcon from '@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon';
import InfoCircleIcon from '@patternfly/react-icons/dist/esm/icons/info-circle-icon';
import React, { lazy } from 'react';
import { Tbody, Td, Tr } from '@patternfly/react-table';
import { UpcomingChanges } from '../../types/UpcomingChanges';
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

export const columnNames = {
  name: 'Name',
  type: 'Type',
  release: 'Release',
  date: 'Date',
};

interface TableRowProps {
  repo: UpcomingChanges;
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
          <Td
            dataLabel={columnNames.name}
            width={15} // Increase width of Name column
          >
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
                      {repo.details.potentiallyAffectedSystemsCount &&
                      repo.details.potentiallyAffectedSystemsCount > 0 ? (
                        <Button
                          variant="link"
                          onClick={(event) => {
                            handleModalToggle(event);
                            setModalDataName(String(repo.package));
                            setModalData(repo.details?.potentiallyAffectedSystems);
                          }}
                          style={{
                            marginTop: '-4px',
                            fontSize: '14px',
                            marginLeft: '-16px',
                          }}
                        >
                          {repo.details.potentiallyAffectedSystemsCount}
                        </Button>
                      ) : (
                        <span
                          style={{
                            fontSize: '14px',
                            marginLeft: '-2px',
                          }}
                        >
                          {repo.details.potentiallyAffectedSystemsCount}
                        </span>
                      )}
                    </TextListItem>
                    <TextListItem component={TextListItemVariants.dt}>Tracking ticket</TextListItem>
                    <TextListItem component={TextListItemVariants.dd}>
                      <a href={`https://issues.redhat.com/browse/${repo.details.trainingTicket}`} rel="noreferrer">
                        {repo.details.trainingTicket}
                      </a>
                    </TextListItem>
                    <TextListItem component={TextListItemVariants.dt}>Date added</TextListItem>
                    <TextListItem component={TextListItemVariants.dd}>{repo.details.dateAdded}</TextListItem>
                    <TextListItem component={TextListItemVariants.dt}>Last modified</TextListItem>
                    <TextListItem component={TextListItemVariants.dd}>{repo.details.lastModified}</TextListItem>
                  </TextList>
                </TextContent>
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
