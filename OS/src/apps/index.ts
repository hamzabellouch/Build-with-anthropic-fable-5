/** Registers every built-in app with the kernel. */
import { kernel } from '../core/kernel';
import { terminalApp } from './terminal';
import { filesApp } from './files';
import { editorApp } from './editor';
import { browserApp } from './browser';
import { paintApp } from './paint';
import { calculatorApp } from './calculator';
import { viewerApp } from './viewer';
import { pianoApp } from './piano';
import { minesweeperApp } from './minesweeper';
import { snakeApp } from './snake';
import { monitorApp } from './monitor';
import { settingsApp } from './settings-app';
import { welcomeApp } from './welcome';

export function registerApps() {
  for (const app of [
    terminalApp,
    filesApp,
    editorApp,
    browserApp,
    paintApp,
    calculatorApp,
    viewerApp,
    pianoApp,
    minesweeperApp,
    snakeApp,
    monitorApp,
    settingsApp,
    welcomeApp,
  ]) {
    kernel.register(app);
  }
}
