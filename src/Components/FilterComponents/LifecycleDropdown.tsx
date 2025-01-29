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
        <SelectOption value="RHEL 9 Application Streams">RHEL 9 Application Streams</SelectOption>
        <SelectOption value="Red Hat Enterprise Linux" >Red Hat Enterprise Linux</SelectOption>
      </SelectList>
    </Select>
);
};

export default LifecycleDropdown;