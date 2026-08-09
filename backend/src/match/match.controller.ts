import { Body, Controller, Post } from '@nestjs/common';
import { MatchService } from './match.service';
import { PlayMatchDto } from './dto/play-match.dto';

@Controller('match')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Post('play')
  play(@Body() dto: PlayMatchDto) {
    return this.matchService.play(dto);
  }
}
