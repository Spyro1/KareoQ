import React, { useRef, useState } from 'react';
import { ActionButton } from './ActionButton';

import type { AdminRequest } from './adminTypes';

const formatTimestamp = (value: string) =>
    new Intl.DateTimeFormat('hu-HU', {
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(value));

type AdminRequestTableProps = {
    requests: AdminRequest[];
    onRequestsChange?: React.Dispatch<React.SetStateAction<AdminRequest[]>>;
    enableReorder?: boolean;
    onReorderCommit?: (orderedIds: number[]) => void;
    highlightFirstRow?: boolean;
    actionLabel: string;
    actionIcon?: React.ReactNode;
    onAction: (id: number) => void;
    actionButtonClassName: string;
};

export function AdminRequestTable({
    requests,
    onRequestsChange,
    enableReorder = false,
    onReorderCommit,
    highlightFirstRow = false,
    actionLabel,
    actionIcon,
    onAction,
    actionButtonClassName
}: AdminRequestTableProps): React.ReactElement {
    const draggingIndex = useRef<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    return (
        <div className="flex-1 min-h-0 overflow-auto rounded-2xl border border-white/10 bg-slate-800/60 shadow-[0_18px_45px_-30px_rgba(96,165,250,0.5)]">
            <table className="min-w-full divide-y divide-white/10 text-left">
                <thead className="bg-slate-900/40 text-xs uppercase tracking-[0.18em] text-slate-300">
                    <tr>
                        <th scope="col" className="px-4 py-3">Idő</th>
                        <th scope="col" className="px-4 py-3">Dal címe</th>
                        <th scope="col" className="hidden px-4 py-3 sm:table-cell">Előadó</th>
                        <th scope="col" className="hidden px-4 py-3 sm:table-cell">Énekes(ek)</th>
                        <th scope="col" className="hidden px-4 py-3 md:table-cell">Megjegyzés</th>
                        <th scope="col" className="hidden px-4 py-3 md:table-cell">Forrás</th>
                        <th scope="col" className="px-4 py-3 text-right">Művelet</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/10 text-sm text-slate-200">
                    {requests.map((request, idx) => (
                        (() => {
                            const isCurrent = highlightFirstRow && idx === 0;
                            return (
                        <tr
                            key={request.id}
                            draggable={enableReorder}
                            onDragStart={(e) => {
                                if (!enableReorder) {
                                    return;
                                }
                                draggingIndex.current = idx;
                                setIsDragging(true);
                                e.dataTransfer.effectAllowed = 'move';
                                const img = new Image();
                                img.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
                                e.dataTransfer.setDragImage(img, 0, 0);
                            }}
                            onDragOver={(e) => {
                                if (!enableReorder || !onRequestsChange) {
                                    return;
                                }
                                e.preventDefault();
                                const from = draggingIndex.current;
                                const to = idx;
                                if (from === null || from === to) {
                                    setDragOverIndex(idx);
                                    return;
                                }
                                onRequestsChange((prev) => {
                                    const arr = [...prev];
                                    const [moved] = arr.splice(from, 1);
                                    arr.splice(to, 0, moved);
                                    return arr;
                                });
                                draggingIndex.current = to;
                                setDragOverIndex(to);
                            }}
                            onDragEnter={() => {
                                if (!enableReorder) {
                                    return;
                                }
                                setDragOverIndex(idx);
                            }}
                            onDragLeave={() => {
                                if (!enableReorder) {
                                    return;
                                }
                                setDragOverIndex((prev) => (prev === idx ? null : prev));
                            }}
                            onDrop={(e) => {
                                if (!enableReorder) {
                                    return;
                                }
                                e.preventDefault();
                                draggingIndex.current = null;
                                setDragOverIndex(null);
                                setIsDragging(false);
                            }}
                            onDragEnd={() => {
                                if (!enableReorder) {
                                    return;
                                }
                                draggingIndex.current = null;
                                setDragOverIndex(null);
                                setIsDragging(false);

                                if (onReorderCommit) {
                                    onReorderCommit(requests.map((entry) => entry.id));
                                }
                            }}
                            className={`transition-colors duration-150 hover:bg-white/5 ${
                                dragOverIndex === idx ? 'bg-white/10' : ''
                            } ${isCurrent ? 'bg-emerald-500/10' : ''} ${isDragging ? 'select-none' : ''}`}
                        >
                            <td className="whitespace-nowrap cursor-move px-4 py-3 text-slate-400">
                                {formatTimestamp(request.submittedAt)}
                            </td>
                            <td className="cursor-move px-4 py-3 font-semibold text-white">{request.songTitle}</td>
                            <td className="hidden cursor-move px-4 py-3 sm:table-cell">{request.performer}</td>
                            <td className="hidden cursor-move px-4 py-3 sm:table-cell">{request.singers}</td>
                            <td className="hidden cursor-move px-4 py-3 text-slate-300 md:table-cell">{request.notes ?? ''}</td>
                            <td className="hidden cursor-move px-4 py-3 text-slate-400 uppercase tracking-[0.16em] md:table-cell">
                                {request.submittedBy === 'host' ? 'rendező' : 'vendég'}
                            </td>
                            <td className="px-4 py-3 text-right">
                                <ActionButton
                                    label={<span className="sr-only sm:not-sr-only">{actionLabel}</span>}
                                    ariaLabel={actionLabel}
                                    onClick={() => onAction(request.id)}
                                    className={actionButtonClassName}
                                    leadingIcon={actionIcon}
                                />
                            </td>
                        </tr>
                            );
                        })()
                    ))}
                </tbody>
            </table>
        </div>
    );
}
