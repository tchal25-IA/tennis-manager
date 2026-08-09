import { IsIn, IsString } from 'class-validator';

export class PlayMatchDto {
  @IsString()
  playerId: string;

  @IsIn(['CLAY', 'GRASS', 'HARD'])
  surface: 'CLAY' | 'GRASS' | 'HARD';

  @IsIn(['AGGRESSIVE', 'SAFE', 'COUNTER'])
  preMatchTactic: 'AGGRESSIVE' | 'SAFE' | 'COUNTER';

  /** Ouverture de match — premier set */
  @IsIn(['GO_FOR_WINNER', 'HIGH_PERCENTAGE', 'MIX_PACE'])
  rallyChoice: 'GO_FOR_WINNER' | 'HIGH_PERCENTAGE' | 'MIX_PACE';

  /** Moment clé — balle de break */
  @IsIn(['GO_FOR_WINNER', 'HIGH_PERCENTAGE', 'MIX_PACE'])
  breakChoice: 'GO_FOR_WINNER' | 'HIGH_PERCENTAGE' | 'MIX_PACE';

  /** Finale — balle de match / set décisif */
  @IsIn(['GO_FOR_WINNER', 'HIGH_PERCENTAGE', 'MIX_PACE'])
  finishChoice: 'GO_FOR_WINNER' | 'HIGH_PERCENTAGE' | 'MIX_PACE';
}
