import {expect} from 'chai';
import {Game} from '../../../src/server/Game';
import {getTestPlayer, newTestGame} from '../../TestGame';
import {forceGenerationEnd, runAllActions} from '../../TestingUtils';
import {TestPlayer} from '../../TestPlayer';
import {Turmoil} from '../../../src/server/turmoil/Turmoil';

import {Oscar} from '../../../src/server/cards/ceos/Oscar';
import {Politician} from '../../../src/server/awards/terraCimmeria/Politician';
import {TempestConsultancy} from '../../../src/server/cards/moon/TempestConsultancy';

describe('Oscar', function() {
  let card: Oscar;
  let player: TestPlayer;
  let player2: TestPlayer;
  let game: Game;
  let turmoil: Turmoil;

  beforeEach(() => {
    card = new Oscar();
    game = newTestGame(2, {ceoExtension: true, turmoilExtension: true});
    player = getTestPlayer(game, 0);
    player2 = getTestPlayer(game, 1);
    player.playedCards.push(card);
    turmoil = Turmoil.getTurmoil(player.game);
  });

  it('Has +1 influence', function() {
    card.play(player);
    expect(turmoil?.getPlayerInfluence(player)).eq(1);
  });

  it('Takes OPG action', function() {
    turmoil.chairman = 'NEUTRAL';
    card.action(player);
    runAllActions(game);
    expect(turmoil.chairman).eq(player.id);
  });

  it('Can only act once per game', function() {
    expect(card.canAct(player)).is.true;
    card.action(player);
    runAllActions(game);
    forceGenerationEnd(game);
    expect(card.isDisabled).is.true;
    expect(card.canAct(player)).is.false;
  });

  it('Previous Chairman player gets their delegate back to reserve after Oscar OPG', function() {
    turmoil.chairman = player2.id;
    const prePlayer2Delegates = turmoil.delegateReserve.get(player2.id);
    card.action(player);
    runAllActions(game);
    expect(turmoil.chairman).eq(player.id);
    expect(turmoil.delegateReserve.get(player2.id)).is.eq(prePlayer2Delegates + 1);
  });

  it('Cannot take OPG if no delegates in reserve', function() {
    expect(card.canAct(player)).is.true;
    turmoil.delegateReserve.clear();
    expect(card.canAct(player)).is.false;
  });

  it('Cannot take OPG if already chairman', function() {
    expect(card.canAct(player)).is.true;
    turmoil.chairman = player.id;
    expect(card.canAct(player)).is.false;
  });

  it('OPG does not gain TR', function() {
    const tr = player.getTerraformRating();
    card.action(player);
    runAllActions(game);
    expect(turmoil.chairman).eq(player.id);
    expect(player.getTerraformRating()).is.eq(tr);
  });

  it('OPG gains 1 TR with Tempest Consultancy', function() {
    const tempcons = new TempestConsultancy();
    player.setCorporationForTest(tempcons);
    const tr = player.getTerraformRating();
    card.action(player);
    runAllActions(game);

    expect(turmoil.chairman).eq(player.id);
    expect(player.getTerraformRating()).is.eq(tr+1);
  });

  it('OPG Counts for POLITICAN Award', function() {
    const politician = new Politician();
    game.awards = [];
    game.awards.push(politician);
    const preOPGScore = game.awards[0].getScore(player);
    card.action(player);
    runAllActions(game);
    expect(game.awards[0].getScore(player)).eq(preOPGScore+1);
  });
});
