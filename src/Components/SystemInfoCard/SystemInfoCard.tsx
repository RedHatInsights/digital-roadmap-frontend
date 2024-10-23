import './system-info-card.scss';
import React from 'react';
import {
  Card,
  CardBody,
  CardExpandableContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@patternfly/react-core';

const SystemCardExpandable: React.FunctionComponent = () => {
  const [isExpanded, setIsExpanded] = React.useState<boolean>(false);

  const onExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Card id="expandable-card" isExpanded={isExpanded}>
      <CardHeader
        onExpand={onExpand}
        toggleButtonProps={{
          id: 'toggle-button1',
          'aria-label': 'Details',
          'aria-labelledby': 'expandable-card-title toggle-button1',
          'aria-expanded': isExpanded,
        }}
      >
        <CardTitle id="expandable-card-title">
          Known System Information
        </CardTitle>
      </CardHeader>
      <CardExpandableContent>
        <CardBody>Body</CardBody>
        <CardFooter>Footer</CardFooter>
      </CardExpandableContent>
    </Card>
  );
};

export default SystemCardExpandable;
