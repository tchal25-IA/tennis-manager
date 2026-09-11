#!/usr/bin/env node

/**
 * Script de test E2E pour l'API Tennis Manager
 * 
 * Teste le flow complet:
 * 1. Création de joueur
 * 2. 3 scènes narratives
 * 3. Entraînement
 * 4. Match
 * 5. Récompense (slice done)
 * 6. Rematch
 * 
 * Usage:
 *   node backend/scripts/test-e2e.js
 *   node backend/scripts/test-e2e.js https://tennis-manager-api.vercel.app/api
 */

const API_BASE = process.argv[2] || 'http://localhost:3001/api';

console.log('🎾 Test E2E Tennis Manager API');
console.log(`📡 API: ${API_BASE}\n`);

async function request(method, path, body = null) {
  const url = `${API_BASE}${path}`;
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);

  console.log(`${method} ${path}`);
  const res = await fetch(url, opts);
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }

  return res.json();
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  try {
    // 1️⃣ Création du joueur
    console.log('\n1️⃣  CRÉATION DU JOUEUR');
    const player = await request('POST', '/player', {
      firstName: 'Lucas',
      lastName: 'Martin',
      nationality: 'FR',
      playStyle: 'ALLROUND',
      socialOrigin: 'MIDDLE',
      preferredSurface: 'CLAY',
      dominantHand: 'RIGHT',
    });
    console.log(`✅ Joueur créé: ${player.firstName} ${player.lastName} (${player.id})\n`);
    const playerId = player.id;

    await sleep(500);

    // 2️⃣ Hub initial
    console.log('2️⃣  HUB INITIAL');
    let hub = await request('GET', `/career/${playerId}/hub`);
    console.log(`📊 Next step: ${hub.nextStep}`);
    console.log(`💡 Hint: ${hub.loopHint}`);
    console.log(`🔄 Can rematch: ${hub.canRematch}\n`);

    await sleep(500);

    // 3️⃣ Scènes narratives (x3)
    console.log('3️⃣  SCÈNES NARRATIVES');
    for (let i = 0; i < 3; i++) {
      const scene = await request('GET', `/narrative/${playerId}/current`);
      console.log(`\n📖 Scène ${scene.sceneIndex + 1}/3: ${scene.title}`);
      console.log(`   ${scene.text}`);
      
      const choices = scene.choices || [];
      if (choices.length === 0) {
        console.log('   ⚠️  Aucun choix disponible, on continue...');
        continue;
      }

      console.log(`   Choix disponibles:`);
      choices.forEach((c, idx) => {
        console.log(`   ${idx + 1}. ${c.text} (${c.id})`);
      });

      const choice = choices[0];
      console.log(`   → Choix: ${choice.text}`);

      const result = await request('POST', `/narrative/${playerId}/resolve`, {
        choiceId: choice.id,
      });
      console.log(`   ✅ Résolu. Impact: ${JSON.stringify(result.impact || {})}`);
      
      await sleep(500);
    }

    await sleep(500);

    // 4️⃣ Hub après scènes
    console.log('\n4️⃣  HUB APRÈS SCÈNES');
    hub = await request('GET', `/career/${playerId}/hub`);
    console.log(`📊 Next step: ${hub.nextStep}`);
    console.log(`💡 ${hub.loopHint}\n`);

    await sleep(500);

    // 5️⃣ Entraînement
    console.log('5️⃣  ENTRAÎNEMENT');
    const training = await request('POST', `/training/${playerId}`, {
      focus: 'SERVE',
    });
    console.log(`✅ Entraînement terminé`);
    console.log(`   Serve: ${training.player.serve}`);
    console.log(`   Forehand: ${training.player.forehand}`);
    console.log(`   Backhand: ${training.player.backhand}\n`);

    await sleep(500);

    // 6️⃣ Hub avant match
    console.log('6️⃣  HUB AVANT MATCH');
    hub = await request('GET', `/career/${playerId}/hub`);
    console.log(`📊 Next step: ${hub.nextStep}`);
    console.log(`💡 ${hub.loopHint}\n`);

    await sleep(500);

    // 7️⃣ Match
    console.log('7️⃣  MATCH TACTIQUE');
    const match = await request('POST', `/match/${playerId}/play`, {
      tactic: 'BALANCED',
    });
    
    console.log(`🎾 Match terminé!`);
    console.log(`   Résultat: ${match.result.won ? '🏆 VICTOIRE' : '😢 DÉFAITE'}`);
    console.log(`   Score: ${match.result.score}`);
    console.log(`   Récompense: ${match.result.reward}`);
    
    if (match.result.phases && match.result.phases.length > 0) {
      console.log(`   Phases jouées: ${match.result.phases.length}`);
      match.result.phases.slice(0, 3).forEach((phase, idx) => {
        console.log(`     Phase ${idx + 1}: Joueur ${phase.playerScore} - ${phase.opponentScore} Adversaire`);
      });
      if (match.result.phases.length > 3) {
        console.log(`     ... et ${match.result.phases.length - 3} autres phases`);
      }
    }
    console.log();

    await sleep(500);

    // 8️⃣ Hub après match (slice done)
    console.log('8️⃣  HUB APRÈS MATCH');
    hub = await request('GET', `/career/${playerId}/hub`);
    console.log(`📊 Next step: ${hub.nextStep}`);
    console.log(`💡 ${hub.loopHint}`);
    console.log(`🔄 Can rematch: ${hub.canRematch}`);
    console.log(`🏆 Matches played: ${hub.matchesPlayed}\n`);

    await sleep(500);

    // 9️⃣ Rematch
    console.log('9️⃣  REMATCH');
    const rematch = await request('POST', `/career/${playerId}/rematch`);
    console.log(`✅ Rematch activé!`);
    console.log(`📊 Next step: ${rematch.nextStep}`);
    console.log(`💡 ${rematch.loopHint}`);
    console.log(`🔄 Can rematch: ${rematch.canRematch}\n`);

    await sleep(500);

    // 🔟 Deuxième match
    console.log('🔟 DEUXIÈME MATCH');
    const match2 = await request('POST', `/match/${playerId}/play`, {
      tactic: 'AGGRESSIVE',
    });
    console.log(`🎾 Match 2 terminé!`);
    console.log(`   Résultat: ${match2.result.won ? '🏆 VICTOIRE' : '😢 DÉFAITE'}`);
    console.log(`   Score: ${match2.result.score}`);
    console.log(`   Récompense: ${match2.result.reward}\n`);

    await sleep(500);

    // 1️⃣1️⃣ Hub final
    console.log('1️⃣1️⃣ HUB FINAL');
    hub = await request('GET', `/career/${playerId}/hub`);
    console.log(`📊 Next step: ${hub.nextStep}`);
    console.log(`🏆 Matches played: ${hub.matchesPlayed}`);
    console.log(`🔄 Can rematch: ${hub.canRematch}`);
    
    if (hub.lastMatch) {
      console.log(`\n📈 Dernier match:`);
      console.log(`   Won: ${hub.lastMatch.won}`);
      console.log(`   Score: ${hub.lastMatch.score}`);
      console.log(`   Reward: ${hub.lastMatch.reward}`);
    }

    console.log('\n✅ TEST E2E COMPLET RÉUSSI! 🎉\n');

    // Notes pour test navigateur
    console.log('═══════════════════════════════════════════════════════');
    console.log('📝 NOTES POUR TEST NAVIGATEUR');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('1. Ouvrir: https://tennis-manager-one.vercel.app');
    console.log('');
    console.log('2. Flow à vérifier:');
    console.log('   ✓ Écran de création (nom, nationalité, taille, main)');
    console.log('   ✓ 3 scènes narratives avec choix (texte en français)');
    console.log('   ✓ Écran d\'entraînement (focus serve/forehand/backhand)');
    console.log('   ✓ Écran de match tactique (choix tactique)');
    console.log('   ✓ Résultat du match avec score détaillé');
    console.log('   ✓ Hub de carrière avec stats visibles');
    console.log('   ✓ Bouton "Rejouer un match" disponible');
    console.log('');
    console.log('3. Vérifications importantes:');
    console.log('   ✓ Tout le texte est en français (UI + narratif)');
    console.log('   ✓ Les stats du joueur évoluent après entraînement/match');
    console.log('   ✓ Le score du match s\'affiche correctement');
    console.log('   ✓ Le rematch fonctionne sans recréer de joueur');
    console.log('   ✓ Les phases du match sont visibles (détail tactique)');
    console.log('');
    console.log('4. DevTools à ouvrir:');
    console.log('   → Console (vérifier absence d\'erreurs)');
    console.log('   → Network (vérifier appels API vers tennis-manager-api.vercel.app)');
    console.log('');
    console.log('5. Tests cross-browser (optionnel):');
    console.log('   → Chrome/Edge (Chromium)');
    console.log('   → Firefox');
    console.log('   → Safari (si disponible)');
    console.log('   → Mobile (responsive design)');
    console.log('');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.error('\n🔍 Stack:', error.stack);
    process.exit(1);
  }
}

main();
