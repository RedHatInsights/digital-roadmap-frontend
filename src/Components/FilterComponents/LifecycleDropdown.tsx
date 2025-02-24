import React from 'react';
import { MenuToggle, Select, SelectList, SelectOption } from '@patternfly/react-core';

interface LifecycleDropdownProps {
  currentValue: string;
  setCurrentValue: (value: string) => void;
  onDropdownSelect: (value: string) => void;
}

export const LifecycleDropdown: React.FunctionComponent<LifecycleDropdownProps> = ({
  currentValue,
  setCurrentValue,
  onDropdownSelect,
}: LifecycleDropdownProps) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const onToggleClick = () => {
    setIsOpen(!isOpen);
  };

  const onSelect = (_event: React.MouseEvent<Element, MouseEvent> | undefined, value: string | number | undefined) => {
    setIsOpen(false);
    if (typeof value === 'string') {
      setCurrentValue(value);
      onDropdownSelect(value);
    }
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
      {currentValue}
    </MenuToggle>
  );

  return (
    <Select
      id="option-variations-select"
      isOpen={isOpen}
      selected={currentValue}
      onSelect={onSelect}
      toggle={toggle}
      shouldFocusToggleOnSelect
    >
      <SelectList>
        <SelectOption value="RHEL 9 Application Streams">RHEL 9 Application Streams</SelectOption>
        <SelectOption value="Red Hat Enterprise Linux">Red Hat Enterprise Linux</SelectOption>
      </SelectList>
    </Select>
  );
};

export default LifecycleDropdown;
