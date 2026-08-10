/**
 * Tennis Manager — API + static (Cloudflare Worker)
 * Vertical slice: création → 3 scènes → match → rematch
 */

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,POST,OPTIONS',
      'access-control-allow-headers': 'content-type',
    },
  });
}

function err(message, status = 400) {
  return json({ message, error: status === 404 ? 'Not Found' : 'Bad Request', statusCode: status }, status);
}

function clamp(n, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function id(prefix = '') {
  return prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

const SCENES = [
  {
    id: 'scene-0',
    orderIndex: 0,
    title: 'Premier jour à l’académie',
    speaker: 'Coach Moreau',
    body:
      'Bienvenue. Ici on forge des champions, pas des touristes. Tu as seize ans, des jambes neuves et tout à prouver. Comment tu abordes ta première semaine ?',
    choices: [
      { id: 's0c0', label: 'Enchaîner les séances techniques jusqu’à la nuit', deltaTechnique: 3, deltaEndurance: -1, deltaMental: 0, deltaCelebrity: 0, deltaCash: 0, deltaMorale: -2 },
      { id: 's0c1', label: 'Écouter le coach et construire une base solide', deltaTechnique: 1, deltaEndurance: 1, deltaMental: 2, deltaCelebrity: 0, deltaCash: 0, deltaMorale: 2 },
      { id: 's0c2', label: 'Se faire remarquer en challengeant les seniors', deltaTechnique: 1, deltaEndurance: 0, deltaMental: 1, deltaCelebrity: 3, deltaCash: 0, deltaMorale: 1 },
    ],
  },
  {
    id: 'scene-1',
    orderIndex: 1,
    title: 'Le rival de vestiaire',
    speaker: 'Lucas Vermeer',
    body:
      'Lucas, favori local, te toise dans le couloir. « T’es juste de passage. Moi, je reste. » Les autres joueurs regardent. Que fais-tu ?',
    choices: [
      { id: 's1c0', label: 'Ignorer et garder mon énergie pour le court', deltaTechnique: 0, deltaEndurance: 1, deltaMental: 2, deltaCelebrity: -1, deltaCash: 0, deltaMorale: 1 },
      { id: 's1c1', label: 'Répondre froidement : on verra sur le score', deltaTechnique: 0, deltaEndurance: 0, deltaMental: 3, deltaCelebrity: 2, deltaCash: 0, deltaMorale: 0 },
      { id: 's1c2', label: 'Proposer un set d’entraînement immédiat', deltaTechnique: 2, deltaEndurance: -2, deltaMental: 1, deltaCelebrity: 1, deltaCash: 0, deltaMorale: 2 },
    ],
  },
  {
    id: 'scene-2',
    orderIndex: 2,
    title: 'Appel d’un sponsor local',
    speaker: 'Agence CourtVision',
    body:
      'Une marque régionale t’offre un petit contrat si tu acceptes une interview avant ton premier tournoi junior. L’argent aide… mais le chronomètre tourne.',
    choices: [
      { id: 's2c0', label: 'Accepter l’interview et le chèque', deltaTechnique: 0, deltaEndurance: 0, deltaMental: -1, deltaCelebrity: 4, deltaCash: 300, deltaMorale: 1 },
      { id: 's2c1', label: 'Refuser poliment et rester focus entraînement', deltaTechnique: 2, deltaEndurance: 1, deltaMental: 1, deltaCelebrity: 0, deltaCash: 0, deltaMorale: 0 },
      { id: 's2c2', label: 'Négocier : interview courte + matériel gratuit', deltaTechnique: 1, deltaEndurance: 0, deltaMental: 1, deltaCelebrity: 2, deltaCash: 150, deltaMorale: 2 },
    ],
  },
];

/** @type {Map<string, any>} */
const players = new Map();
/** @type {Map<string, any[]>} */
const matchesByPlayer = new Map();

function startingStats(dto) {
  let technique = 65;
  let endurance = 65;
  let mental = 65;
  let celebrity = 5;
  let cash = 500;

  if (dto.playStyle === 'ATTACKER') {
    technique += 5; mental += 2; endurance -= 2;
  } else if (dto.playStyle === 'DEFENDER') {
    endurance += 5; mental += 2; technique -= 1;
  } else {
    technique += 2; endurance += 2; mental += 2;
  }

  if (dto.socialOrigin === 'MODEST') {
    mental += 3; cash = 350; celebrity = 2;
  } else if (dto.socialOrigin === 'PRIVILEGED') {
    technique += 2; cash = 800; celebrity = 10; mental -= 1;
  }

  return {
    technique: clamp(technique, 60, 100),
    endurance: clamp(endurance, 60, 100),
    mental: clamp(mental, 60, 100),
    celebrity: clamp(celebrity),
    cash,
  };
}

function hub(player) {
  let nextStep = 'SCENE';
  if (player.sliceDone) nextStep = 'DONE';
  else if (player.sceneIndex >= 3) nextStep = 'MATCH';

  const list = matchesByPlayer.get(player.id) || [];
  const lastMatch = list[list.length - 1] || null;

  return {
    player,
    nextStep,
    lastMatch,
    matchesPlayed: list.length,
    canRematch: player.sliceDone === true,
    loopHint:
      nextStep === 'SCENE'
        ? 'Un événement t’attend à l’académie'
        : nextStep === 'MATCH'
          ? 'Ton match junior est prêt — entre sur le court'
          : 'Slice terminée — rejoue un match ou lance une nouvelle carrière',
  };
}

function choiceMod(choice, player) {
  if (choice === 'GO_FOR_WINNER') return 0.035 + player.technique / 2500;
  if (choice === 'HIGH_PERCENTAGE') return 0.03 + player.endurance / 2800;
  return 0.032 + player.mental / 2600;
}

function choiceLabel(choice) {
  if (choice === 'GO_FOR_WINNER') return 'tenter le winner';
  if (choice === 'HIGH_PERCENTAGE') return 'jouer safe à haut pourcentage';
  return 'casser le rythme';
}

function powerFromStats(input) {
  const base = input.technique * 0.4 + input.endurance * 0.3 + input.mental * 0.3;
  const formF = 0.85 + (input.form / 100) * 0.3;
  const fatigueF = 1 - (input.fatigue / 100) * 0.25;
  return (
    base *
    formF *
    fatigueF *
    (1 + input.surfaceBonus) *
    (1 + input.tacticMod) *
    (1 + input.keyMod) *
    input.rng
  );
}

async function handleApi(request) {
  if (request.method === 'OPTIONS') {
    return json({ ok: true });
  }

  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const parts = path.split('/').filter(Boolean); // api, ...

  try {
    // POST /api/players
    if (request.method === 'POST' && parts[0] === 'api' && parts[1] === 'players' && parts.length === 2) {
      const dto = await request.json();
      const allowedStyle = ['ATTACKER', 'DEFENDER', 'ALLROUND'];
      const allowedOrigin = ['MODEST', 'MIDDLE', 'PRIVILEGED'];
      const allowedSurface = ['CLAY', 'GRASS', 'HARD'];
      const allowedHand = ['LEFT', 'RIGHT'];
      const messages = [];
      if (!dto.firstName || !dto.lastName) messages.push('Prénom et nom requis');
      if (!allowedStyle.includes(dto.playStyle)) messages.push('playStyle must be one of the following values: ATTACKER, DEFENDER, ALLROUND');
      if (!allowedOrigin.includes(dto.socialOrigin)) messages.push('socialOrigin must be one of the following values: MODEST, MIDDLE, PRIVILEGED');
      if (!allowedSurface.includes(dto.preferredSurface)) messages.push('preferredSurface must be one of the following values: CLAY, GRASS, HARD');
      if (!allowedHand.includes(dto.dominantHand)) messages.push('dominantHand must be one of the following values: LEFT, RIGHT');
      if (messages.length) return json({ message: messages, error: 'Bad Request', statusCode: 400 }, 400);

      const stats = startingStats(dto);
      const now = new Date().toISOString();
      const player = {
        id: id('p_'),
        firstName: String(dto.firstName).trim(),
        lastName: String(dto.lastName).trim(),
        nationality: String(dto.nationality || 'France').trim(),
        playStyle: dto.playStyle,
        socialOrigin: dto.socialOrigin,
        preferredSurface: dto.preferredSurface,
        dominantHand: dto.dominantHand,
        ...stats,
        morale: 70,
        form: 70,
        fatigue: 10,
        careerStage: 'JUNIOR',
        sceneIndex: 0,
        sliceDone: false,
        createdAt: now,
        updatedAt: now,
      };
      players.set(player.id, player);
      matchesByPlayer.set(player.id, []);
      return json(player);
    }

    // GET /api/players/:id
    if (request.method === 'GET' && parts[0] === 'api' && parts[1] === 'players' && parts.length === 3) {
      const player = players.get(parts[2]);
      if (!player) return err('Joueur introuvable', 404);
      return json(player);
    }

    // GET /api/career/:id/hub
    if (request.method === 'GET' && parts[0] === 'api' && parts[1] === 'career' && parts[3] === 'hub') {
      const player = players.get(parts[2]);
      if (!player) return err('Joueur introuvable', 404);
      return json(hub(player));
    }

    // POST /api/career/:id/rematch
    if (request.method === 'POST' && parts[0] === 'api' && parts[1] === 'career' && parts[3] === 'rematch') {
      const player = players.get(parts[2]);
      if (!player) return err('Joueur introuvable', 404);
      if (player.sceneIndex < 3) return err('Termine d’abord les scènes narratives');
      if (player.sliceDone) {
        player.sliceDone = false;
        player.fatigue = clamp(player.fatigue - 8);
        player.form = clamp(player.form + 1);
        player.morale = clamp(player.morale + 2);
        player.updatedAt = new Date().toISOString();
        players.set(player.id, player);
      }
      return json(hub(player));
    }

    // GET /api/narrative/:id/current
    if (request.method === 'GET' && parts[0] === 'api' && parts[1] === 'narrative' && parts[3] === 'current') {
      const player = players.get(parts[2]);
      if (!player) return err('Joueur introuvable', 404);
      if (player.sceneIndex >= 3) return json({ done: true, player, scene: null });
      const scene = SCENES.find((s) => s.orderIndex === player.sceneIndex);
      if (!scene) return err('Scène introuvable', 404);
      return json({ done: false, player, scene });
    }

    // POST /api/narrative/choice
    if (request.method === 'POST' && parts[0] === 'api' && parts[1] === 'narrative' && parts[2] === 'choice') {
      const body = await request.json();
      const player = players.get(body.playerId);
      if (!player) return err('Joueur introuvable', 404);
      if (player.sceneIndex >= 3) return err('Toutes les scènes sont déjà jouées');
      const scene = SCENES.find((s) => s.orderIndex === player.sceneIndex);
      const choice = scene?.choices.find((c) => c.id === body.choiceId);
      if (!choice) return err('Choix introuvable', 404);

      player.technique = clamp(player.technique + choice.deltaTechnique, 60, 100);
      player.endurance = clamp(player.endurance + choice.deltaEndurance, 60, 100);
      player.mental = clamp(player.mental + choice.deltaMental, 60, 100);
      player.celebrity = clamp(player.celebrity + choice.deltaCelebrity);
      player.cash = Math.max(0, player.cash + choice.deltaCash);
      player.morale = clamp(player.morale + choice.deltaMorale);
      player.sceneIndex += 1;
      player.updatedAt = new Date().toISOString();
      players.set(player.id, player);

      const nextDone = player.sceneIndex >= 3;
      const nextScene = nextDone ? null : SCENES.find((s) => s.orderIndex === player.sceneIndex);
      return json({
        player,
        choiceApplied: choice,
        next: { done: nextDone, scene: nextScene, player },
      });
    }

    // POST /api/match/play
    if (request.method === 'POST' && parts[0] === 'api' && parts[1] === 'match' && parts[2] === 'play') {
      const dto = await request.json();
      const player = players.get(dto.playerId);
      if (!player) return err('Joueur introuvable', 404);
      if (player.sceneIndex < 3) return err('Termine les 3 scènes narratives avant le match');
      if (player.sliceDone) return err('Match déjà joué — relance un match depuis le hub');

      const surfaceBonus = dto.surface === player.preferredSurface ? 0.09 : -0.03;
      const tacticMod =
        dto.preMatchTactic === 'AGGRESSIVE'
          ? player.playStyle === 'ATTACKER' ? 0.08 : 0.02
          : dto.preMatchTactic === 'SAFE'
            ? player.playStyle === 'DEFENDER' ? 0.08 : 0.02
            : player.playStyle === 'ALLROUND' ? 0.07 : 0.02;

      const keyMod =
        (choiceMod(dto.rallyChoice, player) +
          choiceMod(dto.breakChoice, player) +
          choiceMod(dto.finishChoice, player)) /
        3;

      const opponentPool = [
        { name: 'Lucas Vermeer', technique: 68, endurance: 70, mental: 66, form: 72, fatigue: 15 },
        { name: 'Inès Calderón', technique: 70, endurance: 67, mental: 69, form: 70, fatigue: 12 },
        { name: 'Noah Berger', technique: 66, endurance: 72, mental: 64, form: 74, fatigue: 18 },
      ];
      const opponent = opponentPool[Math.floor(Math.random() * opponentPool.length)];

      const playerPower = powerFromStats({
        technique: player.technique,
        endurance: player.endurance,
        mental: player.mental,
        form: player.form,
        fatigue: player.fatigue,
        surfaceBonus,
        tacticMod,
        keyMod,
        rng: 0.92 + Math.random() * 0.16,
      });
      const oppPower = powerFromStats({
        technique: opponent.technique,
        endurance: opponent.endurance,
        mental: opponent.mental,
        form: opponent.form,
        fatigue: opponent.fatigue,
        surfaceBonus: dto.surface === 'HARD' ? 0.02 : 0,
        tacticMod: 0.03,
        keyMod: 0.025,
        rng: 0.92 + Math.random() * 0.16,
      });

      const margin = playerPower - oppPower;
      const won = margin >= 0;
      const close = Math.abs(margin) < 4;
      const sets = won
        ? close
          ? Math.random() > 0.5 ? '6-4 3-6 7-5' : '7-6 4-6 6-4'
          : Math.random() > 0.45 ? '6-4 7-5' : '6-3 6-4'
        : close
          ? Math.random() > 0.5 ? '4-6 6-3 5-7' : '6-7 6-4 3-6'
          : Math.random() > 0.45 ? '4-6 5-7' : '3-6 4-6';

      const surfaceFr = dto.surface === 'CLAY' ? 'terre battue' : dto.surface === 'GRASS' ? 'gazon' : 'dur';
      const timeline = [
        {
          phase: 'ENTREE',
          title: 'Entrée sur le court',
          detail: `Tu affrontes ${opponent.name} sur ${surfaceFr}. La foule junior est déjà chaude.`,
        },
        {
          phase: 'RALLY',
          title: 'Premier set — échange long',
          detail: `Tu choisis de ${choiceLabel(dto.rallyChoice)}. ${
            won || Math.random() > 0.4
              ? 'Tu prends l’ascendant, les jambes de ton adversaire commencent à lourdes.'
              : 'Il/elle résiste : chaque point se joue dans le filet de sécurité.'
          }`,
        },
        {
          phase: 'BREAK',
          title: 'Moment clé — balle de break',
          detail: `4-4. Tu décides de ${choiceLabel(dto.breakChoice)}. ${
            margin > 2
              ? 'Break ! Le public se lève.'
              : margin < -2
                ? 'Break contre. Il faut remonter la pente.'
                : 'Échange de ouf — le set reste en suspens.'
          }`,
        },
        {
          phase: 'FINISH',
          title: 'Finale — dernière balle',
          detail: `Dernier set. Tu choisis de ${choiceLabel(dto.finishChoice)}. ${
            won
              ? `Point gagnant. Tu bats ${opponent.name} (${sets}).`
              : `${opponent.name} ferme mieux le point (${sets}). Défaite utile.`
          }`,
        },
      ];

      const rewardCash = won
        ? 280 + Math.floor(player.celebrity * 2.5) + (close ? 40 : 0)
        : 90 + Math.floor(player.celebrity);
      const rewardCelebrity = won ? (close ? 7 : 5) : 2;
      const narrative = won
        ? close
          ? `Match accroché contre ${opponent.name} (${sets}). Tu sors grandi — la carrière junior a un visage.`
          : `Maîtrise sur ${surfaceFr}. Tu bats ${opponent.name} (${sets}). Les recruteurs notent ton nom.`
        : `Défaite formative face à ${opponent.name} (${sets}). Tu sens exactement ce qu’il faut travailler demain.`;

      player.cash += rewardCash;
      player.celebrity = clamp(player.celebrity + rewardCelebrity);
      player.morale = clamp(player.morale + (won ? 8 : -4));
      player.fatigue = clamp(player.fatigue + 12);
      player.form = clamp(player.form + (won ? 4 : -2));
      player.sliceDone = true;
      player.updatedAt = new Date().toISOString();
      players.set(player.id, player);

      const match = {
        id: id('m_'),
        playerId: player.id,
        opponentName: opponent.name,
        surface: dto.surface,
        preMatchTactic: dto.preMatchTactic,
        keyMomentChoice: [dto.rallyChoice, dto.breakChoice, dto.finishChoice].join('|'),
        won,
        scoreline: sets,
        rewardCash,
        rewardCelebrity,
        narrative,
        createdAt: new Date().toISOString(),
      };
      const list = matchesByPlayer.get(player.id) || [];
      list.push(match);
      matchesByPlayer.set(player.id, list);

      return json({
        match,
        player,
        opponent: { name: opponent.name },
        timeline,
        reward: {
          cash: rewardCash,
          celebrity: rewardCelebrity,
          won,
          scoreline: sets,
          narrative,
        },
      });
    }

    return err(`Cannot ${request.method} ${path}`, 404);
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Erreur serveur', 500);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api')) {
      return handleApi(request);
    }
    return env.ASSETS.fetch(request);
  },
};
