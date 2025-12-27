import React, { useRef, useState } from 'react';

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
    actionLabel: string;
    onAction: (id: number) => void;
    actionButtonClassName: string;
};

export function AdminRequestTable({
    requests,
    onRequestsChange,
    enableReorder = false,
    onReorderCommit,
    actionLabel,
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
                        <th scope="col" className="px-4 py-3">Előadó</th>
                        <th scope="col" className="px-4 py-3">Énekes(ek)</th>
                        <th scope="col" className="px-4 py-3">Megjegyzés</th>
                        <th scope="col" className="px-4 py-3">Forrás</th>
                        <th scope="col" className="px-4 py-3 text-right">Művelet</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/10 text-sm text-slate-200">
                    {requests.map((request, idx) => (
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
                            className={`transition-colors duration-150 hover:bg-white/5 ${dragOverIndex === idx ? 'bg-white/10' : ''} ${isDragging ? 'select-none' : ''}`}
                        >
                            <td className="whitespace-nowrap cursor-move px-4 py-3 text-slate-400">
                                {formatTimestamp(request.submittedAt)}
                            </td>
                            <td className="cursor-move px-4 py-3 font-semibold text-white">{request.songTitle}</td>
                            <td className="cursor-move px-4 py-3">{request.performer}</td>
                            <td className="cursor-move px-4 py-3">{request.singers}</td>
                            <td className="cursor-move px-4 py-3 text-slate-300">{request.notes ?? ''}</td>
                            <td className="cursor-move px-4 py-3 text-slate-400 uppercase tracking-[0.16em]">
                                {request.submittedBy === 'host' ? 'rendező' : 'vendég'}
                            </td>
                            <td className="px-4 py-3 text-right">
                                <button
                                    type="button"
                                    onClick={() => onAction(request.id)}
                                    className={actionButtonClassName}
                                >
                                    {actionLabel}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
