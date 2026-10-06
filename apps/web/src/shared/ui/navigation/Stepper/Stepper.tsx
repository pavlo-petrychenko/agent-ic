import clsx from 'clsx';
import { Fragment } from 'react';
import { Icon } from '@/shared/ui/foundations/Icon/Icon';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import {
  STEPPER_CHECK_ICON_SIZE,
  StepState,
} from '@/shared/ui/navigation/Stepper/Stepper.constants';
import type { StepperProps } from '@/shared/ui/navigation/Stepper/Stepper.typedefs';
import styles from '@/shared/ui/navigation/Stepper/Stepper.module.scss';

function getStepState(index: number, current: number): StepState {
  if (index < current) {
    return StepState.Done;
  }
  if (index === current) {
    return StepState.Current;
  }
  return StepState.Upcoming;
}

export function Stepper({
  steps,
  current,
  ariaLabel,
  completedLabel,
  className,
  ...rest
}: StepperProps) {
  return (
    <ol {...rest} aria-label={ariaLabel} className={clsx(styles.root, className)}>
      {steps.map((step, index) => {
        const state = getStepState(index, current);

        return (
          <Fragment key={step.id}>
            {index > 0 && <li aria-hidden="true" className={styles.connector} />}
            <li
              aria-current={state === StepState.Current ? 'step' : undefined}
              className={clsx(styles.step, styles[state])}
            >
              <span aria-hidden="true" className={styles.marker}>
                {state === StepState.Done ? (
                  <Icon name={IconName.Check} size={STEPPER_CHECK_ICON_SIZE} />
                ) : (
                  index + 1
                )}
              </span>
              <span className={styles.label}>{step.label}</span>
              {state === StepState.Done && (
                <span className={styles.visuallyHidden}>{completedLabel}</span>
              )}
            </li>
          </Fragment>
        );
      })}
    </ol>
  );
}
