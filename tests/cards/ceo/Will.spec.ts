import {expect} from 'chai';
import {ICard} from '../../../src/server/cards/ICard';
import {Game} from '../../../src/server/Game';
import {SelectCard} from '../../../src/server/inputs/SelectCard';
import {forceGenerationEnd} from '../../TestingUtils';
import {getTestPlayer, newTestGame} from '../../TestGame';
import {TestPlayer} from '../../TestPlayer';

import {Ants} from '../../../src/server/cards/base/Ants';
import {Birds} from '../../../src/server/cards/base/Birds';
import {AsteroidRights} from '../../../src/server/cards/promo/AsteroidRights';
import {CommunicationCenter} from '../../../src/server/cards/pathfinders/CommunicationCenter';

import {Will} from '../../../src/server/cards/ceos/Will';


describe('Will', function() {
  let card: Will;
  let player: TestPlayer;
  let game: Game;

  beforeEach(() => {
    card = new Will();
    game = newTestGame(1, {ceoExtension: true});
    player = getTestPlayer(game, 0);
    player.playedCards.push(card);
  });

  it('Can only act once per game', function() {
    card.action(player);
    forceGenerationEnd(game);
    expect(card.isDisabled).is.true;
    expect(card.canAct(player)).is.false;
  });

  it('Takes OPG action', function() {
    const birds = new Birds();
    const ants = new Ants();
    const asteroidRights = new AsteroidRights();
    player.playedCards.push(birds, ants, asteroidRights);

    card.action(player);
    expect(game.deferredActions).has.length(6);

    // Add animals
    game.deferredActions.runNext();
    expect(birds.resourceCount).eq(2);

    // Add microbes
    game.deferredActions.runNext();
    expect(ants.resourceCount).eq(2);

    game.deferredActions.runNext(); // No Science resource cards, skip
    game.deferredActions.runNext(); // No Floater resource cards, skip

    // Add asteroid
    game.deferredActions.runNext();
    expect(asteroidRights.resourceCount).eq(1);

    // Add resource to any card
    const selectCard = game.deferredActions.pop()!.execute() as SelectCard<ICard>;
    selectCard.cb([selectCard.cards[1]]);
    expect(ants.resourceCount).eq(3);
  });

  it('Takes OPG w/ Communication Center', function() {
    const comms = new CommunicationCenter();
    player.playedCards.push(comms);
    comms.resourceCount = 2; // Put 2 data onto CommCenter

    // Sanity
    expect(comms.resourceCount).eq(2);
    expect(player.cardsInHand.length).to.eq(0);

    // Action
    card.action(player);
    expect(game.deferredActions).has.length(6);
    game.deferredActions.runNext(); // No animals
    game.deferredActions.runNext(); // No bugs
    game.deferredActions.runNext(); // No Science
    game.deferredActions.runNext(); // No Floaters
    game.deferredActions.runNext(); // No Asteroid
    game.deferredActions.runNext(); // One Wild on comms

    // We should have drawn a card here
    expect(comms.resourceCount).eq(0);
    expect(player.cardsInHand.length).to.eq(1);
  });
});
