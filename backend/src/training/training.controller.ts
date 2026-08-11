import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { TrainingService } from './training.service';
import { DoTrainingDto } from './dto/do-training.dto';

@Controller('training')
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  @Get(':playerId/options')
  options(@Param('playerId') playerId: string) {
    return this.trainingService.options(playerId);
  }

  @Post('do')
  doTraining(@Body() dto: DoTrainingDto) {
    return this.trainingService.doTraining(dto);
  }
}

