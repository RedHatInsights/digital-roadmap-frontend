import './PreparingDataState.scss';
import React, { useId } from 'react';
import {
  Bullseye,
  EmptyState,
  EmptyStateBody,
  EmptyStateVariant,
  Progress,
  ProgressMeasureLocation,
  ProgressVariant,
} from '@patternfly/react-core';
import DatabaseIcon from '@patternfly/react-icons/dist/esm/icons/database-icon';

export type PreparingDataItem = {
  label: string;
  loaded: number;
  total: number;
  completed: boolean;
};

export type PreparingDataStateProps = {
  title: string;
  items: PreparingDataItem[];
};

const formatCount = (value: number) => value.toLocaleString('en-US');

const percentComplete = (item: PreparingDataItem) => {
  if (item.completed) {
    return 100;
  }
  if (item.total <= 0) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round((item.loaded / item.total) * 100)));
};

const progressHelperText = (item: PreparingDataItem) => {
  if (item.completed) {
    return `${item.label} data loaded for ${formatCount(item.total)} systems`;
  }
  if (item.total <= 0) {
    return undefined;
  }
  return `Loading ${formatCount(item.loaded)} out of ${formatCount(item.total)} systems`;
};

const PreparingDataItemRow = ({ item }: { item: PreparingDataItem }) => {
  const helperId = useId();
  const helper = progressHelperText(item);

  return (
    <>
      <div className="preparing-data-state__label">{item.label}</div>
      <Progress
        className="preparing-data-state__progress"
        value={percentComplete(item)}
        measureLocation={ProgressMeasureLocation.outside}
        variant={item.completed ? ProgressVariant.success : undefined}
        helperText={helper ? <span id={helperId}>{helper}</span> : undefined}
        aria-label={item.label}
        aria-describedby={helper ? helperId : undefined}
        valueText={helper}
      />
    </>
  );
};

const PreparingDataState = ({ title, items }: PreparingDataStateProps) => {
  const systemCount = items.reduce((largest, item) => Math.max(largest, item.total), 0);
  const intro = items.some((item) => item.completed)
    ? `This can take a few minutes for ${formatCount(systemCount)} systems.`
    : `Loading data for ${formatCount(systemCount)} systems.`;

  return (
    <Bullseye>
      <EmptyState
        className="preparing-data-state"
        headingLevel="h2"
        icon={DatabaseIcon}
        titleText={title}
        variant={EmptyStateVariant.lg}
      >
        <EmptyStateBody>
          {intro}
          <br />
          Keep this page open to track progress.
        </EmptyStateBody>
        <div className="preparing-data-state__items">
          {items.map((item) => (
            <PreparingDataItemRow key={item.label} item={item} />
          ))}
        </div>
      </EmptyState>
    </Bullseye>
  );
};

export default PreparingDataState;
