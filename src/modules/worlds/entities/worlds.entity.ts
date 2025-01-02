export interface Worlds {
  worlds: {
    players_online: number;
    record_date: string;
    record_players: number;
    regular_worlds: RegularWorld[];
    tournament_worlds: TournamentWorld[];
  };
}

export interface RegularWorld {
  battleye_date: string;
  battleye_protected: boolean;
  game_world_type: string;
  location: string;
  name: string;
  players_online: number;
  premium_only: boolean;
  pvp_type: string;
  status: string;
  tournament_world_type: string;
  transfer_type: string;
}

export interface TournamentWorld {
  battleye_date: string;
  battleye_protected: boolean;
  game_world_type: string;
  location: string;
  name: string;
  players_online: number;
  premium_only: boolean;
  pvp_type: string;
  status: string;
  tournament_world_type: string;
  transfer_type: string;
}
