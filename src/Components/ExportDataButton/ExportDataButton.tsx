import React from 'react';
import { Dropdown, DropdownItem, DropdownList, MenuToggle, Spinner, Tooltip } from '@patternfly/react-core';
import ExportIcon from '@patternfly/react-icons/dist/esm/icons/export-icon';

export type ExportFormat = 'csv' | 'json' | 'xml';

interface ExportDataButtonProps {
  onExport: (format: ExportFormat) => void;
  isDisabled?: boolean;
  isExporting?: boolean;
  tooltipContent?: string;
  disabledTooltipContent?: string;
  className?: string;
}

const ExportDataButton: React.FunctionComponent<ExportDataButtonProps> = ({
  onExport,
  isDisabled = false,
  isExporting = false,
  tooltipContent = 'Export data',
  disabledTooltipContent,
  className,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const getTooltipContent = () => {
    if (isExporting) return 'Generating export data, please wait...';
    if (isDisabled && disabledTooltipContent) return disabledTooltipContent;
    return tooltipContent;
  };

  const onSelect = (_event: React.MouseEvent | undefined, value: string | number | undefined) => {
    setIsOpen(false);
    if (value) {
      onExport(value as ExportFormat);
    }
  };

  return (
    <Tooltip content={getTooltipContent()}>
      <Dropdown
        isOpen={isOpen}
        onSelect={onSelect}
        onOpenChange={setIsOpen}
        toggle={(toggleRef: React.Ref<HTMLDivElement>) => (
          <MenuToggle
            ref={toggleRef}
            className={className}
            variant="plain"
            onClick={() => setIsOpen((prev) => !prev)}
            isExpanded={isOpen}
            isDisabled={isDisabled || isExporting}
            aria-label={isExporting ? 'Generating export data' : 'Export host list'}
          >
            {isExporting ? <Spinner size="md" aria-label="Generating export" /> : <ExportIcon />}
          </MenuToggle>
        )}
        popperProps={{ enableFlip: true, position: 'start' }}
        shouldFocusToggleOnSelect
      >
        <DropdownList>
          <DropdownItem value="csv" key="csv">
            Export host list to CSV
          </DropdownItem>
          <DropdownItem value="json" key="json">
            Export host list to JSON
          </DropdownItem>
          <DropdownItem value="xml" key="xml">
            Export host list to XML
          </DropdownItem>
        </DropdownList>
      </Dropdown>
    </Tooltip>
  );
};

export default ExportDataButton;
