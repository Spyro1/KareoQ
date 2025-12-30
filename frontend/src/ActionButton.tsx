import React from 'react';

type ActionButtonProps = {
    label: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
    className: string;
    leadingIcon?: React.ReactNode;
    ariaLabel?: string;
};

export function ActionButton({
    label,
    onClick,
    disabled,
    className,
    leadingIcon,
    ariaLabel
}: ActionButtonProps): React.ReactElement {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label={ariaLabel}
            className={`inline-flex items-center justify-center gap-2 ${className}`}
        >
            {leadingIcon ? <span className="inline-flex items-center">{leadingIcon}</span> : null}
            {label}
        </button>
    );
}
