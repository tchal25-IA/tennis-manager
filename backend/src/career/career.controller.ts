import { Body, Controller, Get, Param, Post } from '@nestjs/common';
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

  @Post(':playerId/daily')
  claimDaily(@Param('playerId') playerId: string) {
    return this.careerService.claimDaily(playerId);
  }

  @Post(':playerId/staff/coach')
  upgradeCoach(@Param('playerId') playerId: string) {
    return this.careerService.upgradeCoach(playerId);
  }

  @Post(':playerId/event')
  resolveEvent(
    @Param('playerId') playerId: string,
    @Body('choiceId') choiceId: string,
  ) {
    return this.careerService.resolveEvent(playerId, choiceId);
  }

  @Post(':playerId/staff/:role')
  upgradeStaff(
    @Param('playerId') playerId: string,
    @Param('role') role: string,
  ) {
    return this.careerService.upgradeStaff(playerId, role);
  }

  @Post(':playerId/equipment')
  buyEquipment(
    @Param('playerId') playerId: string,
    @Body('item') item: string,
  ) {
    return this.careerService.buyEquipment(playerId, item);
  }

  @Post(':playerId/sponsor')
  signSponsor(
    @Param('playerId') playerId: string,
    @Body('sponsor') sponsor: string,
  ) {
    return this.careerService.signSponsor(playerId, sponsor);
  }

  @Post(':playerId/recover')
  recover(@Param('playerId') playerId: string) {
    return this.careerService.recover(playerId);
  }
}
