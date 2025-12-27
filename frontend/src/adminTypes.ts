export type BackendSongRequest = {
    id: number;
    song_title: string;
    performer: string;
    singers: string;
    notes?: string | null;
    created_at: string;
    played_at?: string | null;
    is_played: boolean;
    sort_order?: number | null;
    ip_address?: string;
};

export type AdminRequest = {
    id: number;
    songTitle: string;
    performer: string;
    singers: string;
    notes?: string;
    submittedBy: 'guest' | 'host';
    submittedAt: string;
    isPlayed: boolean;
    playedAt?: string;
};
