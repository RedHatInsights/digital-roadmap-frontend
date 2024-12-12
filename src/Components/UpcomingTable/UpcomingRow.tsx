import "@patternfly/react-core/dist/styles/base.css";

import React, { useState } from "react";
import {
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  ExpandableRowContent
} from "@patternfly/react-table";

export const TableRow: React.FunctionComponent = ({
  repo,
  rowIndex,
  columnNames,
  
}) => {
  const [isRepoExpanded, setIsRepoExpanded] = useState(false);
  // Some arbitrary examples of how you could customize the child row based on your needs
  let childIsFullWidth = false;
  let childHasNoPadding = false;
  let detail1Colspan = 1;
  let detail2Colspan = 1;
  let detail3Colspan = 1;
  if (repo.details) {
    const { detail1, detail2, detail3, detailFormat } = repo.details;
    const numColumns = 5;
    childIsFullWidth = [1, 3].includes(detailFormat);
    childHasNoPadding = [2, 3].includes(detailFormat);
    if (detail1 && !detail2 && !detail3) {
      detail1Colspan = !childIsFullWidth ? numColumns : numColumns + 1; // Account for toggle column
    } else if (detail1 && detail2 && !detail3) {
      detail1Colspan = 2;
      detail2Colspan = !childIsFullWidth ? 3 : 4;
    } else if (detail1 && detail2 && detail3) {
      detail1Colspan = 2;
      detail2Colspan = 2;
      detail3Colspan = !childIsFullWidth ? 1 : 2;
    }
  }
  return (
    <Tbody key={`${repo.name}-${repo.type}-${repo.release}-${repo.date}`} 
    isExpanded={isRepoExpanded}>
      <Tr>
        <Td
          expand={{
            rowIndex: rowIndex,
            isExpanded: isRepoExpanded,
            onToggle: () => setIsRepoExpanded(!isRepoExpanded),
            expandId: "composable-expandable-example"
          }}
        />
        <Td dataLabel={columnNames.name} modifier="truncate">
            {repo.name}
        </Td>
        <Td dataLabel={columnNames.type} modifier="truncate">
            {repo.type}
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
            {repo.details.summary ? (
            <Td
                dataLabel="Summary"
                noPadding={childHasNoPadding}
                colSpan={detail1Colspan}
            >
                <ExpandableRowContent>
                {repo.details.summary}
                </ExpandableRowContent>
            </Td>
            ) : null}
            {repo.details.potentiallyAffectedSystems ? (
            <Td
                dataLabel="Potentially affected systems"
                noPadding={childHasNoPadding}
                colSpan={detail2Colspan}
            >
                <ExpandableRowContent>
                {repo.details.potentiallyAffectedSystems}
                </ExpandableRowContent>
            </Td>
            ) : null}
            {repo.details.trainingTicket ? (
            <Td
                dataLabel="Training ticket"
                noPadding={childHasNoPadding}
                colSpan={detail3Colspan}
            >
                <ExpandableRowContent>
                {repo.details.trainingTicket}
                </ExpandableRowContent>
            </Td>
            ) : null}
            {repo.details.dateAdded ? (
            <Td
                dataLabel="Date added"
                noPadding={childHasNoPadding}
                colSpan={detail3Colspan}
            >
                <ExpandableRowContent>
                {repo.details.dateAdded}
                </ExpandableRowContent>
            </Td>
            ) : null}
            {repo.details.lastModified ? (
            <Td
                dataLabel="Last modified"
                noPadding={childHasNoPadding}
                colSpan={detail3Colspan}
            >
                <ExpandableRowContent>
                {repo.details.lastModified}
                </ExpandableRowContent>
            </Td>
            ) : null}
        </Tr>
        ) : null}
    </Tbody>
  );
};
