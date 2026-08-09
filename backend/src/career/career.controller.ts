import { Controller, Get, Param, Post } from '@nestjs/common';
import { CareerService } from './career.service';

@Controller('career')
export class CareerController {
  constructor(private readonly careerService: CareerService) {}

  @Get(':playerId/hub')
  hub(@Param('playerId') playerId: string) {
    return this.careerService.hub(playerId);
  }

  @Post(':playerId/rematch')
  rematch(@Param('playerId') playerId: string) {
    return this.careerService.rematch(playerId);
  }
}
