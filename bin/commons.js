import path from 'node:path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

// Logging colors
const colorPrimary = chalk.hex('#07AAFF');
const colorSecondary = chalk.hex('#FFC05B');
const colorTertiary = chalk.hex('#f14fa1');
const colorError = chalk.redBright.bold;
const colorSuccess = chalk.green.bold;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export { colorPrimary, colorSecondary, colorTertiary, colorError, colorSuccess, __dirname };
