import { IsIn, IsString } from 'class-validator';

export class PlayMatchDto {
  @IsString()
  playerId: string;

  @IsIn(['CLAY', 'GRASS', 'HARD'])
  surface: 'CLAY' | 'GRASS' | 'HARD';

  @IsIn(['AGGRESSIVE', 'SAFE', 'COUNTER'])
  preMatchTactic: 'AGGRESSIVE' | 'SAFE' | 'COUNTER';

  @IsIn(['GO_FOR_WINNER', 'HIGH_PERCENTAGE', 'MIX_PACE'])
  keyMomentChoice: 'GO_FOR_WINNER' | 'HIGH_PERCENTAGE' | 'MIX_PACE';
}
