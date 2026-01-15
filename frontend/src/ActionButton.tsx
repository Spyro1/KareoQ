import React from 'react';

type ActionButtonProps = {
    content: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
    coloring: string;
    leadingIcon?: React.ReactNode;
    ariaLabel?: string;
};

export function ActionButton({
    content,
    onClick,
    disabled,
    coloring,
    leadingIcon,
    ariaLabel
}: ActionButtonProps): React.ReactElement {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label={ariaLabel}
            className={`
                inline-flex items-center justify-center gap-2 rounded-full border 
                px-3 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.32em] 
                transition sm:px-4 disabled:cursor-not-allowed disabled:opacity-70 
                ${coloring}`
            }
        >
            {leadingIcon ? <span className="inline-flex items-center">{leadingIcon}</span> : null}
            {content}
        </button>
    );
}
