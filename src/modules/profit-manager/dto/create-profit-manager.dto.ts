export class CreateProfitManagerDto {
  huntName: string;
  huntDate: Date;
  huntDuration: number; // Duration in minutes
  profit: bigint;
  preyCardsUsed: number;
  boostsValue: number;
  world: string;
  characterId: string;
  userId: string;
}
