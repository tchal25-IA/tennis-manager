import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { PlayerModule } from './player/player.module';
import { NarrativeModule } from './narrative/narrative.module';
import { MatchModule } from './match/match.module';
import { CareerModule } from './career/career.module';

@Module({
  imports: [
    PrismaModule,
    PlayerModule,
    NarrativeModule,
    MatchModule,
    CareerModule,
  ],
})
export class AppModule {}
