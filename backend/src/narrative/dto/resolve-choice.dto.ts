import { IsString } from 'class-validator';

export class ResolveChoiceDto {
  @IsString()
  playerId: string;

  @IsString()
  choiceId: string;
}
