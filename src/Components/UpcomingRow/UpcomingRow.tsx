import '@patternfly/react-core/dist/styles/base.css';
import ExclamationCircleIcon from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import ExclamationTriangleIcon from '@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon';
import InfoCircleIcon from '@patternfly/react-icons/dist/esm/icons/info-circle-icon';
import React, { lazy } from 'react';
import { ExpandableRowContent, Tbody, Td, Tr } from '@patternfly/react-table';
import { UpcomingChanges } from '../../types/UpcomingChanges';
import { SystemsDetail } from '../../types/SystemsDetail';
import { Button, Content, ContentVariants, Icon } from '@patternfly/react-core';
import { formatDate } from '../../utils/utils';
const LifecycleModalWindow = lazy(() => import('../../Components/LifecycleModalWindow/LifecycleModalWindow'));

export const columnNames = {
  name: 'Name',
  type: 'Type',
  release: 'Release',
  addedToRoadmap: 'Added to roadmap',
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
  const [modalData, setModalData] = React.useState<SystemsDetail[]>();

  let childIsFullWidth = false;

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
        <InfoCircleIcon color="var(--pf-t--global--icon--color--severity--none--default)" />
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
  }

  return (
    <>
      <Tbody isExpanded={isExpanded}>
        <Tr isContentExpanded={isExpanded}>
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
          <Td dataLabel={columnNames.addedToRoadmap} modifier="truncate">
            {repo.details?.dateAdded ?? ''}
          </Td>
          <Td dataLabel={columnNames.date} modifier="truncate">
            {formatDate(repo.date)}
          </Td>
        </Tr>
        {repo.details ? (
          <Tr isExpanded={isExpanded}>
            {!childIsFullWidth ? <Td /> : null}
            <Td className="drf-lifecycle__upcoming-row" dataLabel="Summary" noPadding colSpan={5}>
              <ExpandableRowContent>
                <div className="drf-lifecycle__upcoming-row-text-container">
                  <Content className="drf-lifecycle__upcoming-row-text">
                    <Content component={ContentVariants.p}>{repo.details.summary}</Content>
                  </Content>

                  <Content className="drf-lifecycle__upcoming-row-text">
                    <Content
                      component={ContentVariants.dl}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'max-content 1fr',
                        gridRowGap: '8px',
                        gridColumnGap: '16px',
                      }}
                    >
                      <Content component={ContentVariants.dt} style={{ whiteSpace: 'nowrap' }}>
                        Potentially affected systems
                      </Content>
                      <Content component={ContentVariants.dd} style={{ margin: 0 }}>
                        {repo.details.potentiallyAffectedSystemsCount &&
                        repo.details.potentiallyAffectedSystemsCount > 0 ? (
                          <Button
                            variant="link"
                            onClick={(event) => {
                              handleModalToggle(event);
                              setModalDataName(String(repo.package));
                              setModalData(repo.details?.potentiallyAffectedSystemsDetail);
                            }}
                            isInline
                          >
                            {repo.details.potentiallyAffectedSystemsCount}
                          </Button>
                        ) : (
                          <span>{repo.details.potentiallyAffectedSystemsCount}</span>
                        )}
                      </Content>
                      <Content component={ContentVariants.dt} style={{ whiteSpace: 'nowrap' }}>
                        Tracking ticket
                      </Content>
                      <Content component={ContentVariants.dd} style={{ margin: 0 }}>
                        <a
                          href={`https://issues.redhat.com/browse/${repo.details.trainingTicket}`}
                          rel="noreferrer"
                        >
                          {repo.details.trainingTicket}
                        </a>
                      </Content>
                      <Content component={ContentVariants.dt} style={{ whiteSpace: 'nowrap' }}>
                        Last modified
                      </Content>
                      <Content component={ContentVariants.dd} style={{ margin: 0 }}>
                        {repo.details.lastModified}
                      </Content>
                    </Content>
                  </Content>
                </div>
              </ExpandableRowContent>
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
