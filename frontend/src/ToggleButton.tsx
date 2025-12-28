import React from 'react';
import { ActionButton } from './ActionButton';

type ToggleButtonProps = {
    enabled: boolean;
    disabled?: boolean;
    onToggle: () => void;
    labelOn: string;
    labelOff: string;
    baseClassName: string;
    enabledClassName: string;
};

export function ToggleButton({
    enabled,
    disabled,
    onToggle,
    labelOn,
    labelOff,
    baseClassName,
    enabledClassName
}: ToggleButtonProps): React.ReactElement {
    return (
        <ActionButton
            label={enabled ? labelOn : labelOff}
            onClick={onToggle}
            disabled={disabled}
            className={`${baseClassName} ${enabled ? enabledClassName : ''}`}
        />
    );
}
