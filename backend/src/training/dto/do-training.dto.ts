import { IsIn, IsString } from 'class-validator';

export class DoTrainingDto {
  @IsString()
  playerId: string;

  @IsIn(['PHYSIQUE', 'TECHNIQUE', 'MENTAL'])
  trainingType: 'PHYSIQUE' | 'TECHNIQUE' | 'MENTAL';
}

