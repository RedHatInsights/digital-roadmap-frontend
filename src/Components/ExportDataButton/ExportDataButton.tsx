import React from 'react';
import { Button, Tooltip } from '@patternfly/react-core';
import ExportIcon from '@patternfly/react-icons/dist/esm/icons/export-icon';

interface ExportDataButtonProps {
  onClick: () => void;
  isDisabled?: boolean;
  tooltipContent?: string;
  disabledTooltipContent?: string;
  ariaLabel?: string;
  className?: string;
}

const ExportDataButton: React.FunctionComponent<ExportDataButtonProps> = ({
  onClick,
  isDisabled = false,
  tooltipContent = 'Export data',
  disabledTooltipContent,
  ariaLabel = 'Download visible dataset as CSV',
  className,
}) => {
  const content = isDisabled && disabledTooltipContent ? disabledTooltipContent : tooltipContent;

  return (
    <Tooltip content={content}>
      <Button
        className={className}
        variant="plain"
        aria-label={ariaLabel}
        onClick={onClick}
        isDisabled={isDisabled}
        icon={<ExportIcon />}
      ></Button>
    </Tooltip>
  );
};

export default ExportDataButton;
