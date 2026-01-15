import React from 'react';
import { ActionButton } from './ActionButton';

type ToggleButtonProps = {
    enabled: boolean;
    onToggle: () => void;
    contentOn: React.ReactNode;
    contentOff: React.ReactNode;
    baseColor: string;
    activeColor: string;
    disabled?: boolean;
    leadingIcon?: React.ReactNode;
    ariaLabelOn?: string;
    ariaLabelOff?: string;
};

export function ToggleButton({
    enabled,
    disabled,
    onToggle,
    contentOn,
    contentOff,
    baseColor,
    activeColor,
    leadingIcon,
    ariaLabelOn,
    ariaLabelOff
}: ToggleButtonProps): React.ReactElement {
    return (
        <ActionButton
            content={enabled ? contentOn : contentOff   }
            onClick={onToggle}
            disabled={disabled}
            ariaLabel={enabled ? ariaLabelOn : ariaLabelOff}
            leadingIcon={leadingIcon}
            coloring={`${enabled ? activeColor : baseColor}`}
        />
    );
}
