import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { NarrativeService } from './narrative.service';
import { ResolveChoiceDto } from './dto/resolve-choice.dto';

@Controller('narrative')
export class NarrativeController {
  constructor(private readonly narrativeService: NarrativeService) {}

  @Get(':playerId/current')
  current(@Param('playerId') playerId: string) {
    return this.narrativeService.currentScene(playerId);
  }

  @Post('choice')
  resolve(@Body() dto: ResolveChoiceDto) {
    return this.narrativeService.resolveChoice(dto.playerId, dto.choiceId);
  }
}
