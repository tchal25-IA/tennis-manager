import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlayerDto } from './dto/create-player.dto';

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

@Injectable()
export class PlayerService {
  constructor(private readonly prisma: PrismaService) {}

  private startingStats(dto: CreatePlayerDto) {
    let technique = 65;
    let endurance = 65;
    let mental = 65;
    let celebrity = 5;
    let cash = 500;

    switch (dto.playStyle) {
      case 'ATTACKER':
        technique += 5;
        mental += 2;
        endurance -= 2;
        break;
      case 'DEFENDER':
        endurance += 5;
        mental += 2;
        technique -= 1;
        break;
      case 'ALLROUND':
        technique += 2;
        endurance += 2;
        mental += 2;
        break;
    }

    switch (dto.socialOrigin) {
      case 'MODEST':
        mental += 3;
        cash = 350;
        celebrity = 2;
        break;
      case 'MIDDLE':
        cash = 500;
        break;
      case 'PRIVILEGED':
        technique += 2;
        cash = 800;
        celebrity = 10;
        mental -= 1;
        break;
    }

    return {
      technique: clamp(technique, 60, 100),
      endurance: clamp(endurance, 60, 100),
      mental: clamp(mental, 60, 100),
      celebrity: clamp(celebrity),
      cash,
    };
  }

  create(dto: CreatePlayerDto) {
    const stats = this.startingStats(dto);
    return this.prisma.player.create({
      data: {
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        nationality: dto.nationality.trim(),
        playStyle: dto.playStyle,
        socialOrigin: dto.socialOrigin,
        preferredSurface: dto.preferredSurface,
        dominantHand: dto.dominantHand,
        ...stats,
      },
    });
  }

  findOne(id: string) {
    return this.prisma.player.findUniqueOrThrow({ where: { id } });
  }
}
