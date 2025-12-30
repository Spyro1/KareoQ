import React from 'react';
import { ActionButton } from './ActionButton';

type ToggleButtonProps = {
    enabled: boolean;
    disabled?: boolean;
    onToggle: () => void;
    labelOn: React.ReactNode;
    labelOff: React.ReactNode;
    baseClassName: string;
    enabledClassName: string;
    leadingIcon?: React.ReactNode;
    ariaLabelOn?: string;
    ariaLabelOff?: string;
};

export function ToggleButton({
    enabled,
    disabled,
    onToggle,
    labelOn,
    labelOff,
    baseClassName,
    enabledClassName,
    leadingIcon,
    ariaLabelOn,
    ariaLabelOff
}: ToggleButtonProps): React.ReactElement {
    return (
        <ActionButton
            label={enabled ? labelOn : labelOff}
            onClick={onToggle}
            disabled={disabled}
            ariaLabel={enabled ? ariaLabelOn : ariaLabelOff}
            leadingIcon={leadingIcon}
            className={`${baseClassName} ${enabled ? enabledClassName : ''}`}
        />
    );
}
