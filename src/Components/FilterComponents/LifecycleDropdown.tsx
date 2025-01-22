import React from 'react';
import { Dropdown, DropdownItem, DropdownList, Divider, MenuToggle, Select, SelectList, SelectOption} from '@patternfly/react-core';

export const LifecycleDropdown: React.FunctionComponent = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<string>('RHEL 9 Application Streams');

  const onToggleClick = () => {
    setIsOpen(!isOpen);
  };

  const onSelect = (_event: React.MouseEvent<Element, MouseEvent> | undefined, value: string | number | undefined) => {
    // eslint-disable-next-line no-console
    console.log('selected', value);
    setSelected(value as string);
    setIsOpen(false);
  };

  const toggle = (toggleRef: React.Ref<HTMLDivElement | HTMLButtonElement>) => (
    <MenuToggle
      ref={toggleRef}
      onClick={onToggleClick}
      isExpanded={isOpen}
      style={
        {
          width: '400px',
        } as React.CSSProperties
      }
    >
      {selected}
    </MenuToggle>
  );

  return (
    <Select
    id="option-variations-select"
    isOpen={isOpen}
    selected={selected}
    onSelect={onSelect}
    //   onOpenChange={(isOpen) => setIsOpen(isOpen)}
    toggle={toggle}
    shouldFocusToggleOnSelect
  >
    <SelectList>
      <SelectOption value="Basic option">Basic option</SelectOption>
      <SelectOption
        value="Option with description"
        description="This is a description"
      >
        Option with description
      </SelectOption>
      
    </SelectList>
  </Select>
);
};

export default LifecycleDropdown;