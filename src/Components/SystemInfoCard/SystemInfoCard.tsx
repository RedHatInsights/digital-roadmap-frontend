import './system-info-card.scss';
import React from 'react';
import { Card, CardBody, CardExpandableContent, CardHeader, CardTitle } from '@patternfly/react-core';

const SystemCardExpandable: React.FunctionComponent = () => {
  const [isExpanded, setIsExpanded] = React.useState<boolean>(false);

  const onExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Card id="expandable-card" ouiaId="SystemFilters" isExpanded={isExpanded}>
      <CardHeader
        onExpand={onExpand}
        toggleButtonProps={{
          id: 'toggle-button',
          ouiaId: 'SystemFilters-ToggleButton',
          'aria-label': 'Details',
          'aria-labelledby': 'expandable-card-title toggle-button',
          'aria-expanded': isExpanded,
        }}
      >
        <CardTitle id="expandable-card-title">System filters</CardTitle>
      </CardHeader>
      <CardExpandableContent>
        <CardBody>
          The roadmap is tailored to your needs based on knowledge about the systems in your inventory. Adjust these
          filters to make changes to the roadmap results, for example by adding an additional architecture or
          restricting to fewer packages. TODO: Add filter components here
        </CardBody>
      </CardExpandableContent>
    </Card>
  );
};

export default SystemCardExpandable;
