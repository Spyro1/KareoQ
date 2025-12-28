import React from 'react';

type ActionButtonProps = {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    className: string;
    leadingIcon?: React.ReactNode;
};

export function ActionButton({
    label,
    onClick,
    disabled,
    className,
    leadingIcon
}: ActionButtonProps): React.ReactElement {
    return (
        <button type="button" onClick={onClick} disabled={disabled} className={className}>
            {leadingIcon ? <span className="inline-flex items-center">{leadingIcon}</span> : null}
            <span>{label}</span>
        </button>
    );
}
