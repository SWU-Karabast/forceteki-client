import type React from 'react';
import type { SxProps, Theme } from '@mui/material';
import type { Annotation, Seat, SwuPgnDocument } from '@/lib/swupgn';
import type { ThreadNode } from '@/app/_utils/annotationThreads';
import type { ReplayMove } from '@/app/_utils/swupgnMoves';
import type { PlayerRoundResourcing, ResourcingReport as ResourcingReportData } from '@/app/_utils/resourcingReport';

// A note carries a client `_id` while in the working copy; file notes carry `id`.
export type Note = Annotation & { _id?: string };

export interface IAnnotationBadgeProps {
    nag?: string;
    size?: number;
}

export interface IDecisionRowProps {
    onClick: () => void;
    children: React.ReactNode;
}

export interface ISeatDeckProps {
    seat: Seat;
    name: string;
    reveal: boolean;
}

export interface INagPickerProps {
    value: string;
    onChange: (v: string) => void;
}

export interface IComposerProps {
    seq: string;
    onSubmit: (text: string, nag: string, ref: string) => void;
    withNag?: boolean;
    placeholder: string;
    compact?: boolean;
}

export interface INoteCardProps {
    node: ThreadNode<Note>;
    onReply: (parentId: string, ref: string, text: string) => void;
    onDelete: (id: string) => void;
    depth?: number;
}

export interface IFileUploadProps {
    onReplayLoaded: (doc: SwuPgnDocument, content: string) => void;
}

export interface IMoveRowProps {
    move: ReplayMove;
    index: number;
    isCurrent: boolean;
    annotated: boolean;
    onSeek: (seq: string) => void;
}

export interface IPlaybackOptionsProps {
    anchorEl: HTMLElement | null;
    onClose: () => void;
}

export interface IReplayAnimatorProps {
    containerRef: React.RefObject<HTMLElement | null>;
}

// The replay page owns `collapsed`, so the board can make room for the open panel.
export interface IReplayPanelProps {
    collapsed: boolean;
    setCollapsed: (collapsed: boolean) => void;
}

export interface IRoundTableProps {
    rows: PlayerRoundResourcing[];
    paid: boolean;
    onSeek: (round: number) => void;
}

export interface IDecisionListProps {
    seat: Seat;
}

export interface IPlayerColumnProps {
    seat: Seat;
    name: string;
    report: ResourcingReportData;
}

export interface IStatProps {
    label: string;
    value: string | number;
}

export interface ISeekRowProps {
    onClick: () => void;
    disabled?: boolean;
    label?: string;

    /** A row that toggles something on and off (a reveal, a filter) rather than seeking. */
    pressed?: boolean;

    /** A row that opens and closes a detail panel below it. */
    expanded?: boolean;
    sx?: SxProps<Theme>;
    children: React.ReactNode;
}

export interface IStoryLineProps {
    line: string;

    /** The frame a numbered action line seeks to; `null` for plain prose. */
    target: number | null;
    isCurrent: boolean;
    onSeek: (frame: number) => void;
}
