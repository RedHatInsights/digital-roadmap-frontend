import { SearchInput, Toolbar, ToolbarGroup, ToolbarItem } from '@patternfly/react-core';
import React from 'react';
import { ErrorObject } from '../../types/ErrorObject';

interface LifecycleFiltersProps {
  nameFilter: string;
  setNameFilter: (name: string) => void;
  setError: (error: ErrorObject) => void;
  setIsLoading: (isLoading: boolean) => void;
}

export const LifecycleFilters: React.FunctionComponent<LifecycleFiltersProps> = ({
  nameFilter,
  setNameFilter,
}: LifecycleFiltersProps) => {
  return (
    <div className="drf-lifecycle__filters">
      <Toolbar className="drf-lifecycle__filters-toolbar">
        <ToolbarGroup>
          <ToolbarItem>
            <SearchInput
              placeholder="Find by name"
              value={nameFilter}
              onChange={(_event, value) => setNameFilter(value)}
              onClear={() => setNameFilter('')}
              aria-label="Find by name"
            />
          </ToolbarItem>
          <ToolbarItem>Second item</ToolbarItem>
        </ToolbarGroup>
        <ToolbarGroup>
          <ToolbarItem>Third item</ToolbarItem>
        </ToolbarGroup>
      </Toolbar>
    </div>
  );
};

export default LifecycleFilters;
