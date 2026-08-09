import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.sceneChoiceLog.deleteMany();
  await prisma.matchResult.deleteMany();
  await prisma.sceneChoice.deleteMany();
  await prisma.scene.deleteMany();

  const scenes = [
    {
      orderIndex: 0,
      title: 'Premier jour à l’académie',
      speaker: 'Coach Moreau',
      body:
        'Bienvenue. Ici on forge des champions, pas des touristes. Tu as seize ans, des jambes neuves et tout à prouver. Comment tu abordes ta première semaine ?',
      choices: [
        {
          label: 'Enchaîner les séances techniques jusqu’à la nuit',
          deltaTechnique: 3,
          deltaEndurance: -1,
          deltaMental: 0,
          deltaCelebrity: 0,
          deltaCash: 0,
          deltaMorale: -2,
        },
        {
          label: 'Écouter le coach et construire une base solide',
          deltaTechnique: 1,
          deltaEndurance: 1,
          deltaMental: 2,
          deltaCelebrity: 0,
          deltaCash: 0,
          deltaMorale: 2,
        },
        {
          label: 'Se faire remarquer en challengeant les seniors',
          deltaTechnique: 1,
          deltaEndurance: 0,
          deltaMental: 1,
          deltaCelebrity: 3,
          deltaCash: 0,
          deltaMorale: 1,
        },
      ],
    },
    {
      orderIndex: 1,
      title: 'Le rival de vestiaire',
      speaker: 'Lucas Vermeer',
      body:
        'Lucas, favori local, te toise dans le couloir. « T’es juste de passage. Moi, je reste. » Les autres joueurs regardent. Que fais-tu ?',
      choices: [
        {
          label: 'Ignorer et garder mon énergie pour le court',
          deltaTechnique: 0,
          deltaEndurance: 1,
          deltaMental: 2,
          deltaCelebrity: -1,
          deltaCash: 0,
          deltaMorale: 1,
        },
        {
          label: 'Répondre froidement : on verra sur le score',
          deltaTechnique: 0,
          deltaEndurance: 0,
          deltaMental: 3,
          deltaCelebrity: 2,
          deltaCash: 0,
          deltaMorale: 0,
        },
        {
          label: 'Proposer un set d’entraînement immédiat',
          deltaTechnique: 2,
          deltaEndurance: -2,
          deltaMental: 1,
          deltaCelebrity: 1,
          deltaCash: 0,
          deltaMorale: 2,
        },
      ],
    },
    {
      orderIndex: 2,
      title: 'Appel d’un sponsor local',
      speaker: 'Agence CourtVision',
      body:
        'Une marque régionale t’offre un petit contrat si tu acceptes une interview avant ton premier tournoi junior. L’argent aide… mais le chronomètre tourne.',
      choices: [
        {
          label: 'Accepter l’interview et le chèque',
          deltaTechnique: 0,
          deltaEndurance: 0,
          deltaMental: -1,
          deltaCelebrity: 4,
          deltaCash: 300,
          deltaMorale: 1,
        },
        {
          label: 'Refuser poliment et rester focus entraînement',
          deltaTechnique: 2,
          deltaEndurance: 1,
          deltaMental: 1,
          deltaCelebrity: 0,
          deltaCash: 0,
          deltaMorale: 0,
        },
        {
          label: 'Négocier : interview courte + matériel gratuit',
          deltaTechnique: 1,
          deltaEndurance: 0,
          deltaMental: 1,
          deltaCelebrity: 2,
          deltaCash: 150,
          deltaMorale: 2,
        },
      ],
    },
  ];

  for (const scene of scenes) {
    const { choices, ...data } = scene;
    await prisma.scene.create({
      data: {
        ...data,
        choices: { create: choices },
      },
    });
  }

  console.log('Seed OK — 3 scènes narratif junior');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
