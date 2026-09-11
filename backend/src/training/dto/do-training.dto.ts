import { IsIn, IsString } from 'class-validator';

export class DoTrainingDto {
  @IsString()
  playerId: string;

  @IsIn(['SERVE', 'FOREHAND', 'BACKHAND', 'PHYSIQUE', 'MENTAL'])
  trainingType: 'SERVE' | 'FOREHAND' | 'BACKHAND' | 'PHYSIQUE' | 'MENTAL';
}

