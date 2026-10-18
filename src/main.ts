import { createGame } from './app/create-game';
import './app/styles.css';

const game = createGame();

if (import.meta.hot) {
  import.meta.hot.dispose(() => game.destroy(true));
}
