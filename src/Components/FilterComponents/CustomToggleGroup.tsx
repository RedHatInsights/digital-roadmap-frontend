import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@patternfly/react-core';

export const ToggleGroupReleasedView: React.FunctionComponent = () => {
  const [isSelected, setIsSelected] = React.useState('');
  const handleItemClick = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    event: React.MouseEvent<any, MouseEvent> | React.KeyboardEvent | MouseEvent
  ) => {
    const id = event.currentTarget.id;
    setIsSelected(id);
  };
  return (
    <ToggleGroup aria-label="Default with single selectable">
      <ToggleGroupItem
        text="Relevant Only"
        buttonId="toggle-group-single-1"
        isSelected={isSelected === 'toggle-group-single-1'}
        onChange={handleItemClick}
      />
      <ToggleGroupItem
        text="All"
        buttonId="toggle-group-single-2"
        isSelected={isSelected === 'toggle-group-single-2'}
        onChange={handleItemClick}
      />
      <ToggleGroupItem
        text="All Expanded"
        buttonId="toggle-group-single-3"
        isSelected={isSelected === 'toggle-group-single-3'}
        onChange={handleItemClick}
      />
    </ToggleGroup>
  );
};

export default ToggleGroupReleasedView;
