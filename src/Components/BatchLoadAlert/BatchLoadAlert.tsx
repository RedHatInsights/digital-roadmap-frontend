import './BatchLoadAlert.scss';
import React from 'react';
import { Alert, Button, Progress } from '@patternfly/react-core';

export type BatchLoadAlertProps = {
  title: string;
  description: string;
  completed: number;
  total: number;
  onRetry: () => void;
  showRetry?: boolean;
  isRetrying?: boolean;
  progressLabel?: string;
  progressAriaLabel?: string;
};

const formatCount = (value: number) => value.toLocaleString('en-US');

const BatchLoadAlert = ({
  title,
  description,
  completed,
  total,
  onRetry,
  showRetry = false,
  isRetrying = false,
  progressLabel = 'systems',
  progressAriaLabel = 'Lifecycle data loading progress',
}: BatchLoadAlertProps) => {
  const showMeasure = total > 0;
  const percent = showMeasure ? Math.min(100, Math.max(0, Math.round((completed / total) * 100))) : 0;

  return (
    <Alert className="drf-batch-load-alert" variant="info" isInline title={title} component="h2">
      <p>{description}</p>
      {showMeasure && (
        <div className="drf-batch-load-alert__progress">
          <span className="drf-batch-load-alert__count">{`${formatCount(completed)} / ${formatCount(
            total
          )} ${progressLabel}`}</span>
          <Progress value={percent} measureLocation="outside" aria-label={progressAriaLabel} />
        </div>
      )}
      {(showRetry || isRetrying) && (
        <div className="drf-batch-load-alert__retry">
          {isRetrying ? (
            <Button className="drf-batch-load-alert__retry-in-progress" variant="link" isInline isDisabled>
              Retry in progress...
            </Button>
          ) : (
            <>
              <span>Taking longer than expected. </span>
              <Button variant="link" isInline onClick={onRetry}>
                Retry now
              </Button>
            </>
          )}
        </div>
      )}
    </Alert>
  );
};

export default BatchLoadAlert;
