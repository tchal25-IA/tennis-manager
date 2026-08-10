var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/worker.js
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type"
    }
  });
}
__name(json, "json");
function err(message, status = 400) {
  return json({ message, error: status === 404 ? "Not Found" : "Bad Request", statusCode: status }, status);
}
__name(err, "err");
function clamp(n, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(n)));
}
__name(clamp, "clamp");
function id(prefix = "") {
  return prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
__name(id, "id");
var SCENES = [
  {
    id: "scene-0",
    orderIndex: 0,
    title: "Premier jour \xE0 l\u2019acad\xE9mie",
    speaker: "Coach Moreau",
    body: "Bienvenue. Ici on forge des champions, pas des touristes. Tu as seize ans, des jambes neuves et tout \xE0 prouver. Comment tu abordes ta premi\xE8re semaine ?",
    choices: [
      { id: "s0c0", label: "Encha\xEEner les s\xE9ances techniques jusqu\u2019\xE0 la nuit", deltaTechnique: 3, deltaEndurance: -1, deltaMental: 0, deltaCelebrity: 0, deltaCash: 0, deltaMorale: -2 },
      { id: "s0c1", label: "\xC9couter le coach et construire une base solide", deltaTechnique: 1, deltaEndurance: 1, deltaMental: 2, deltaCelebrity: 0, deltaCash: 0, deltaMorale: 2 },
      { id: "s0c2", label: "Se faire remarquer en challengeant les seniors", deltaTechnique: 1, deltaEndurance: 0, deltaMental: 1, deltaCelebrity: 3, deltaCash: 0, deltaMorale: 1 }
    ]
  },
  {
    id: "scene-1",
    orderIndex: 1,
    title: "Le rival de vestiaire",
    speaker: "Lucas Vermeer",
    body: "Lucas, favori local, te toise dans le couloir. \xAB T\u2019es juste de passage. Moi, je reste. \xBB Les autres joueurs regardent. Que fais-tu ?",
    choices: [
      { id: "s1c0", label: "Ignorer et garder mon \xE9nergie pour le court", deltaTechnique: 0, deltaEndurance: 1, deltaMental: 2, deltaCelebrity: -1, deltaCash: 0, deltaMorale: 1 },
      { id: "s1c1", label: "R\xE9pondre froidement : on verra sur le score", deltaTechnique: 0, deltaEndurance: 0, deltaMental: 3, deltaCelebrity: 2, deltaCash: 0, deltaMorale: 0 },
      { id: "s1c2", label: "Proposer un set d\u2019entra\xEEnement imm\xE9diat", deltaTechnique: 2, deltaEndurance: -2, deltaMental: 1, deltaCelebrity: 1, deltaCash: 0, deltaMorale: 2 }
    ]
  },
  {
    id: "scene-2",
    orderIndex: 2,
    title: "Appel d\u2019un sponsor local",
    speaker: "Agence CourtVision",
    body: "Une marque r\xE9gionale t\u2019offre un petit contrat si tu acceptes une interview avant ton premier tournoi junior. L\u2019argent aide\u2026 mais le chronom\xE8tre tourne.",
    choices: [
      { id: "s2c0", label: "Accepter l\u2019interview et le ch\xE8que", deltaTechnique: 0, deltaEndurance: 0, deltaMental: -1, deltaCelebrity: 4, deltaCash: 300, deltaMorale: 1 },
      { id: "s2c1", label: "Refuser poliment et rester focus entra\xEEnement", deltaTechnique: 2, deltaEndurance: 1, deltaMental: 1, deltaCelebrity: 0, deltaCash: 0, deltaMorale: 0 },
      { id: "s2c2", label: "N\xE9gocier : interview courte + mat\xE9riel gratuit", deltaTechnique: 1, deltaEndurance: 0, deltaMental: 1, deltaCelebrity: 2, deltaCash: 150, deltaMorale: 2 }
    ]
  }
];
var players = /* @__PURE__ */ new Map();
var matchesByPlayer = /* @__PURE__ */ new Map();
function startingStats(dto) {
  let technique = 65;
  let endurance = 65;
  let mental = 65;
  let celebrity = 5;
  let cash = 500;
  if (dto.playStyle === "ATTACKER") {
    technique += 5;
    mental += 2;
    endurance -= 2;
  } else if (dto.playStyle === "DEFENDER") {
    endurance += 5;
    mental += 2;
    technique -= 1;
  } else {
    technique += 2;
    endurance += 2;
    mental += 2;
  }
  if (dto.socialOrigin === "MODEST") {
    mental += 3;
    cash = 350;
    celebrity = 2;
  } else if (dto.socialOrigin === "PRIVILEGED") {
    technique += 2;
    cash = 800;
    celebrity = 10;
    mental -= 1;
  }
  return {
    technique: clamp(technique, 60, 100),
    endurance: clamp(endurance, 60, 100),
    mental: clamp(mental, 60, 100),
    celebrity: clamp(celebrity),
    cash
  };
}
__name(startingStats, "startingStats");
function hub(player) {
  let nextStep = "SCENE";
  if (player.sliceDone) nextStep = "DONE";
  else if (player.sceneIndex >= 3) nextStep = "MATCH";
  const list = matchesByPlayer.get(player.id) || [];
  const lastMatch = list[list.length - 1] || null;
  return {
    player,
    nextStep,
    lastMatch,
    matchesPlayed: list.length,
    canRematch: player.sliceDone === true,
    loopHint: nextStep === "SCENE" ? "Un \xE9v\xE9nement t\u2019attend \xE0 l\u2019acad\xE9mie" : nextStep === "MATCH" ? "Ton match junior est pr\xEAt \u2014 entre sur le court" : "Slice termin\xE9e \u2014 rejoue un match ou lance une nouvelle carri\xE8re"
  };
}
__name(hub, "hub");
function choiceMod(choice, player) {
  if (choice === "GO_FOR_WINNER") return 0.035 + player.technique / 2500;
  if (choice === "HIGH_PERCENTAGE") return 0.03 + player.endurance / 2800;
  return 0.032 + player.mental / 2600;
}
__name(choiceMod, "choiceMod");
function choiceLabel(choice) {
  if (choice === "GO_FOR_WINNER") return "tenter le winner";
  if (choice === "HIGH_PERCENTAGE") return "jouer safe \xE0 haut pourcentage";
  return "casser le rythme";
}
__name(choiceLabel, "choiceLabel");
function powerFromStats(input) {
  const base = input.technique * 0.4 + input.endurance * 0.3 + input.mental * 0.3;
  const formF = 0.85 + input.form / 100 * 0.3;
  const fatigueF = 1 - input.fatigue / 100 * 0.25;
  return base * formF * fatigueF * (1 + input.surfaceBonus) * (1 + input.tacticMod) * (1 + input.keyMod) * input.rng;
}
__name(powerFromStats, "powerFromStats");
async function handleApi(request) {
  if (request.method === "OPTIONS") {
    return json({ ok: true });
  }
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";
  const parts = path.split("/").filter(Boolean);
  try {
    if (request.method === "POST" && parts[0] === "api" && parts[1] === "players" && parts.length === 2) {
      const dto = await request.json();
      const allowedStyle = ["ATTACKER", "DEFENDER", "ALLROUND"];
      const allowedOrigin = ["MODEST", "MIDDLE", "PRIVILEGED"];
      const allowedSurface = ["CLAY", "GRASS", "HARD"];
      const allowedHand = ["LEFT", "RIGHT"];
      const messages = [];
      if (!dto.firstName || !dto.lastName) messages.push("Pr\xE9nom et nom requis");
      if (!allowedStyle.includes(dto.playStyle)) messages.push("playStyle must be one of the following values: ATTACKER, DEFENDER, ALLROUND");
      if (!allowedOrigin.includes(dto.socialOrigin)) messages.push("socialOrigin must be one of the following values: MODEST, MIDDLE, PRIVILEGED");
      if (!allowedSurface.includes(dto.preferredSurface)) messages.push("preferredSurface must be one of the following values: CLAY, GRASS, HARD");
      if (!allowedHand.includes(dto.dominantHand)) messages.push("dominantHand must be one of the following values: LEFT, RIGHT");
      if (messages.length) return json({ message: messages, error: "Bad Request", statusCode: 400 }, 400);
      const stats = startingStats(dto);
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const player = {
        id: id("p_"),
        firstName: String(dto.firstName).trim(),
        lastName: String(dto.lastName).trim(),
        nationality: String(dto.nationality || "France").trim(),
        playStyle: dto.playStyle,
        socialOrigin: dto.socialOrigin,
        preferredSurface: dto.preferredSurface,
        dominantHand: dto.dominantHand,
        ...stats,
        morale: 70,
        form: 70,
        fatigue: 10,
        careerStage: "JUNIOR",
        sceneIndex: 0,
        sliceDone: false,
        createdAt: now,
        updatedAt: now
      };
      players.set(player.id, player);
      matchesByPlayer.set(player.id, []);
      return json(player);
    }
    if (request.method === "GET" && parts[0] === "api" && parts[1] === "players" && parts.length === 3) {
      const player = players.get(parts[2]);
      if (!player) return err("Joueur introuvable", 404);
      return json(player);
    }
    if (request.method === "GET" && parts[0] === "api" && parts[1] === "career" && parts[3] === "hub") {
      const player = players.get(parts[2]);
      if (!player) return err("Joueur introuvable", 404);
      return json(hub(player));
    }
    if (request.method === "POST" && parts[0] === "api" && parts[1] === "career" && parts[3] === "rematch") {
      const player = players.get(parts[2]);
      if (!player) return err("Joueur introuvable", 404);
      if (player.sceneIndex < 3) return err("Termine d\u2019abord les sc\xE8nes narratives");
      if (player.sliceDone) {
        player.sliceDone = false;
        player.fatigue = clamp(player.fatigue - 8);
        player.form = clamp(player.form + 1);
        player.morale = clamp(player.morale + 2);
        player.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
        players.set(player.id, player);
      }
      return json(hub(player));
    }
    if (request.method === "GET" && parts[0] === "api" && parts[1] === "narrative" && parts[3] === "current") {
      const player = players.get(parts[2]);
      if (!player) return err("Joueur introuvable", 404);
      if (player.sceneIndex >= 3) return json({ done: true, player, scene: null });
      const scene = SCENES.find((s) => s.orderIndex === player.sceneIndex);
      if (!scene) return err("Sc\xE8ne introuvable", 404);
      return json({ done: false, player, scene });
    }
    if (request.method === "POST" && parts[0] === "api" && parts[1] === "narrative" && parts[2] === "choice") {
      const body = await request.json();
      const player = players.get(body.playerId);
      if (!player) return err("Joueur introuvable", 404);
      if (player.sceneIndex >= 3) return err("Toutes les sc\xE8nes sont d\xE9j\xE0 jou\xE9es");
      const scene = SCENES.find((s) => s.orderIndex === player.sceneIndex);
      const choice = scene?.choices.find((c) => c.id === body.choiceId);
      if (!choice) return err("Choix introuvable", 404);
      player.technique = clamp(player.technique + choice.deltaTechnique, 60, 100);
      player.endurance = clamp(player.endurance + choice.deltaEndurance, 60, 100);
      player.mental = clamp(player.mental + choice.deltaMental, 60, 100);
      player.celebrity = clamp(player.celebrity + choice.deltaCelebrity);
      player.cash = Math.max(0, player.cash + choice.deltaCash);
      player.morale = clamp(player.morale + choice.deltaMorale);
      player.sceneIndex += 1;
      player.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      players.set(player.id, player);
      const nextDone = player.sceneIndex >= 3;
      const nextScene = nextDone ? null : SCENES.find((s) => s.orderIndex === player.sceneIndex);
      return json({
        player,
        choiceApplied: choice,
        next: { done: nextDone, scene: nextScene, player }
      });
    }
    if (request.method === "POST" && parts[0] === "api" && parts[1] === "match" && parts[2] === "play") {
      const dto = await request.json();
      const player = players.get(dto.playerId);
      if (!player) return err("Joueur introuvable", 404);
      if (player.sceneIndex < 3) return err("Termine les 3 sc\xE8nes narratives avant le match");
      if (player.sliceDone) return err("Match d\xE9j\xE0 jou\xE9 \u2014 relance un match depuis le hub");
      const surfaceBonus = dto.surface === player.preferredSurface ? 0.09 : -0.03;
      const tacticMod = dto.preMatchTactic === "AGGRESSIVE" ? player.playStyle === "ATTACKER" ? 0.08 : 0.02 : dto.preMatchTactic === "SAFE" ? player.playStyle === "DEFENDER" ? 0.08 : 0.02 : player.playStyle === "ALLROUND" ? 0.07 : 0.02;
      const keyMod = (choiceMod(dto.rallyChoice, player) + choiceMod(dto.breakChoice, player) + choiceMod(dto.finishChoice, player)) / 3;
      const opponentPool = [
        { name: "Lucas Vermeer", technique: 68, endurance: 70, mental: 66, form: 72, fatigue: 15 },
        { name: "In\xE8s Calder\xF3n", technique: 70, endurance: 67, mental: 69, form: 70, fatigue: 12 },
        { name: "Noah Berger", technique: 66, endurance: 72, mental: 64, form: 74, fatigue: 18 }
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
        rng: 0.92 + Math.random() * 0.16
      });
      const oppPower = powerFromStats({
        technique: opponent.technique,
        endurance: opponent.endurance,
        mental: opponent.mental,
        form: opponent.form,
        fatigue: opponent.fatigue,
        surfaceBonus: dto.surface === "HARD" ? 0.02 : 0,
        tacticMod: 0.03,
        keyMod: 0.025,
        rng: 0.92 + Math.random() * 0.16
      });
      const margin = playerPower - oppPower;
      const won = margin >= 0;
      const close = Math.abs(margin) < 4;
      const sets = won ? close ? Math.random() > 0.5 ? "6-4 3-6 7-5" : "7-6 4-6 6-4" : Math.random() > 0.45 ? "6-4 7-5" : "6-3 6-4" : close ? Math.random() > 0.5 ? "4-6 6-3 5-7" : "6-7 6-4 3-6" : Math.random() > 0.45 ? "4-6 5-7" : "3-6 4-6";
      const surfaceFr = dto.surface === "CLAY" ? "terre battue" : dto.surface === "GRASS" ? "gazon" : "dur";
      const timeline = [
        {
          phase: "ENTREE",
          title: "Entr\xE9e sur le court",
          detail: `Tu affrontes ${opponent.name} sur ${surfaceFr}. La foule junior est d\xE9j\xE0 chaude.`
        },
        {
          phase: "RALLY",
          title: "Premier set \u2014 \xE9change long",
          detail: `Tu choisis de ${choiceLabel(dto.rallyChoice)}. ${won || Math.random() > 0.4 ? "Tu prends l\u2019ascendant, les jambes de ton adversaire commencent \xE0 lourdes." : "Il/elle r\xE9siste : chaque point se joue dans le filet de s\xE9curit\xE9."}`
        },
        {
          phase: "BREAK",
          title: "Moment cl\xE9 \u2014 balle de break",
          detail: `4-4. Tu d\xE9cides de ${choiceLabel(dto.breakChoice)}. ${margin > 2 ? "Break ! Le public se l\xE8ve." : margin < -2 ? "Break contre. Il faut remonter la pente." : "\xC9change de ouf \u2014 le set reste en suspens."}`
        },
        {
          phase: "FINISH",
          title: "Finale \u2014 derni\xE8re balle",
          detail: `Dernier set. Tu choisis de ${choiceLabel(dto.finishChoice)}. ${won ? `Point gagnant. Tu bats ${opponent.name} (${sets}).` : `${opponent.name} ferme mieux le point (${sets}). D\xE9faite utile.`}`
        }
      ];
      const rewardCash = won ? 280 + Math.floor(player.celebrity * 2.5) + (close ? 40 : 0) : 90 + Math.floor(player.celebrity);
      const rewardCelebrity = won ? close ? 7 : 5 : 2;
      const narrative = won ? close ? `Match accroch\xE9 contre ${opponent.name} (${sets}). Tu sors grandi \u2014 la carri\xE8re junior a un visage.` : `Ma\xEEtrise sur ${surfaceFr}. Tu bats ${opponent.name} (${sets}). Les recruteurs notent ton nom.` : `D\xE9faite formative face \xE0 ${opponent.name} (${sets}). Tu sens exactement ce qu\u2019il faut travailler demain.`;
      player.cash += rewardCash;
      player.celebrity = clamp(player.celebrity + rewardCelebrity);
      player.morale = clamp(player.morale + (won ? 8 : -4));
      player.fatigue = clamp(player.fatigue + 12);
      player.form = clamp(player.form + (won ? 4 : -2));
      player.sliceDone = true;
      player.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      players.set(player.id, player);
      const match = {
        id: id("m_"),
        playerId: player.id,
        opponentName: opponent.name,
        surface: dto.surface,
        preMatchTactic: dto.preMatchTactic,
        keyMomentChoice: [dto.rallyChoice, dto.breakChoice, dto.finishChoice].join("|"),
        won,
        scoreline: sets,
        rewardCash,
        rewardCelebrity,
        narrative,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
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
          narrative
        }
      });
    }
    return err(`Cannot ${request.method} ${path}`, 404);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur serveur", 500);
  }
}
__name(handleApi, "handleApi");
var worker_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api")) {
      return handleApi(request);
    }
    return env.ASSETS.fetch(request);
  }
};

// ../../../home/ubuntu/.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../home/ubuntu/.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-fi5Fcf/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// ../../../home/ubuntu/.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-fi5Fcf/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=worker.js.map
