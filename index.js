import 'node:process';
import fs from 'node:fs';
import path from 'node:path';
import { networkInterfaces } from 'node:os';
import * as esbuild from 'esbuild';
import * as sass from 'sass';
import * as webDevServer from '@web/dev-server';
import autoprefixer from 'autoprefixer';
import chalk from 'chalk';
import cssnanoPlugin from 'cssnano';
import eslintPkg from 'eslint/use-at-your-own-risk';
import htmlPlugin from '@chialab/esbuild-plugin-html';
import postcss from 'postcss';
import wdsLitCss from 'web-dev-server-plugin-lit-css';
import { litCssPlugin } from 'esbuild-plugin-lit-css';

const { FlatESLint } = eslintPkg;

// Logging colors
const colorPrimary = chalk.hex('#07AAFF');
const colorSecondary = chalk.hex('#FFC05B');
const colorTertiary = chalk.hex('#f14fa1');
const colorError = chalk.redBright.bold;
const colorSuccess = chalk.green.bold;

const operations = {
  '--serve': serve,
  '--build': initBuild,
  '--lint': lint,
  '--version': version,
  '-v': version
};

const args = process.argv[2];
operations[args]();

/**
 * Prints CLI version
 */
function version() {
  const packageJSON = JSON.parse(fs.readFileSync('package.json'));
  console.log(chalk.blueBright(packageJSON.version));
}

/**
 * Validates component linting to start build process
 */
async function initBuild() {
  console.log(colorPrimary.bold('  Setting up build and bundling process...'));
  console.log('');
  try {
    const isLintingValid = await lint();
    if (!isLintingValid) {
      throw new Error('Linting has found errors, fix it before continue.');
    } else {
      console.log('');
      build();
    }
  } catch (error) {
    console.log(colorError(`  ${error}`));
  }
}

/**
 * Build component bundler
 */
async function build() {
  console.log(colorPrimary('  Starting build and bundling process...'));
  console.log('');
  try {
    await esbuild.build({
      logLevel: 'warning',
      entryPoints: ['index.html'],
      assetNames: 'assets/[name]',
      chunkNames: '[ext]/[name]',
      outdir: 'build',
      bundle: true,
      minify: true,
      write: true,
      metafile: true,
      allowOverwrite: true,
      loader: {
        '.scss': 'css'
      },
      plugins: [
        htmlPlugin(),
        litCssPlugin({
          filter: /.scss$/,
          async transform(data, { filePath }) {
            const { css } = sass.compile(filePath, { style: 'compressed' });
            const postCss = await postcss([autoprefixer, cssnanoPlugin]).process(css, { from: filePath });
            return postCss.css;
          }
        })
      ]
    });
    console.log(colorSuccess('  Build process complete!'));
  } catch (error) {
    console.log(colorError(error));
  }
}

/**
 * Start local server to serve component with live reloading
 */
async function serve() {
  const componentPath = filePath => path.join(process.cwd(), filePath);
  let server;

  try {
    server = await webDevServer.startDevServer({
      config: {
        rootDir: process.cwd(),
        appIndex: 'index.html',
        port: 8000,
        open: true,
        clearTerminalOnReload: false,
        nodeResolve: true,
        watch: true,
        plugins: [
          wdsLitCss({
            include: '/**/*.scss',
            transform(data, { filePath }) {
              const { css } = sass.compile(componentPath(filePath), { style: 'expanded' });
              const postCss = postcss([autoprefixer]).process(css, { from: componentPath(filePath) });
              return postCss.css;
            }
          })
        ]
      },
      readCliArgs: false,
      readFileConfig: false,
      autoExitProcess: true,
      logStartMessage: false
    });

    const hostPrefix = 'http:/';
    const {
      config: { hostname, port }
    } = server;
    console.log('');
    console.log(colorPrimary.bold('  Brick component served!'));
    console.log('');
    console.log(`${colorSecondary('Local:'.padStart(10, ' ').padEnd(12, ' '))} ${colorSecondary.underline(`${hostPrefix}/${hostname}:${port}/`)}`);
    console.log(`${colorSecondary('Network:'.padStart(12, ' '))} ${colorSecondary.underline(`${hostPrefix}/${getLocalNetwork()}:${port}/`)}`);
    console.log('');
    console.log(colorTertiary('   Watching for changes... 👁️ 👄👁️'));

    server.fileWatcher.addListener('change', pathChange => {
      if (pathChange.indexOf(process.cwd()) > -1) {
        const currentFolder = `${process.cwd()}/`;
        const changedFile = pathChange.slice(currentFolder.length - pathChange.length);
        console.log(`${colorTertiary.bold('    ' + changedFile)} ${colorTertiary('has changed...')}`);
      }
    });
  } catch (error) {
    console.log(colorError(error));
    server.fileWatcher.removeListener('change', () => {});
    await server.stop();
  }
}

/**
 * Returns network ipv4 address
 * @returns {string}
 */
function getLocalNetwork() {
  let localNetwork = '';
  const nets = networkInterfaces();

  Object.keys(nets).forEach(netName => {
    nets[netName].forEach(net => {
      const familyType = typeof net.family === 'string' ? 'IPv4' : 4;
      if (net.family === familyType && !net.internal) {
        localNetwork = net.address;
      }
    });
  });

  return localNetwork;
}

/**
 * Start linting process using ESLint API
 * @returns {boolean}
 */
async function lint() {
  console.log(colorTertiary('  Checking code linting...'));
  const eslint = new FlatESLint({ overrideConfigFile: 'eslint.config.js' });
  let isValid = false;

  try {
    const results = await eslint.lintFiles(['./**/*.js']);
    const formatter = await eslint.loadFormatter('stylish');
    const resultText = formatter.format(results);

    console.log(resultText);

    isValid = !results.some(result => result.errorCount !== 0);
    if (isValid) {
      console.log(colorTertiary('   Code looks good!'));
    }
  } catch (error) {
    console.log(colorError('Error linting the component', error));
    process.exit(1);
  }

  return isValid;
}
