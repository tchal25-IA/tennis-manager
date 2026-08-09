import {
  IsIn,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreatePlayerDto {
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  firstName: string;

  @IsString()
  @MinLength(1)
  @MaxLength(40)
  lastName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(40)
  nationality: string;

  @IsIn(['ATTACKER', 'DEFENDER', 'ALLROUND'])
  playStyle: 'ATTACKER' | 'DEFENDER' | 'ALLROUND';

  @IsIn(['MODEST', 'MIDDLE', 'PRIVILEGED'])
  socialOrigin: 'MODEST' | 'MIDDLE' | 'PRIVILEGED';

  @IsIn(['CLAY', 'GRASS', 'HARD'])
  preferredSurface: 'CLAY' | 'GRASS' | 'HARD';

  @IsIn(['LEFT', 'RIGHT'])
  dominantHand: 'LEFT' | 'RIGHT';
}
