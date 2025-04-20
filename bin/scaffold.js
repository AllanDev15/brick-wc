import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import fsPromise from 'node:fs/promises';
import { stdin, stdout } from 'process';
import { spawn, exec } from 'node:child_process';

import { colorPrimary, colorSecondary, colorSuccess, colorError, __dirname } from './commons.js';

const VSCODE_SETTINGS = `
{
  "eslint.experimental.useFlatConfig": true
}`;
const VSCODE_EXTENSIONS = `
{
  "recommendations": [
    "dbaeumer.vscode-eslint"
  ]
}`;

/**
 * Main function to create component scaffold based on user input
 */
export default async function () {
  const projectScaffold = {
    js: createJsProject
  };

  const { projectType, componentName } = await getProjectInfo();
  projectScaffold[projectType](componentName);
}

/**
 * Generates questions to get project type and component type from user
 * @returns {Promise<{projectType: string, componentName: string}>}
 */
async function getProjectInfo() {
  console.log(colorSecondary('  Creating a new Brick component...'));
  const read = readline.createInterface({ input: stdin, output: stdout });
  const projectNameRegex = new RegExp('[a-zA-Z]+(?:-[a-zA-Z]+)*', 'i');
  const projectNameQuestion = colorPrimary('Brick component name: ');
  const projectType = 'js';

  let componentName = await read.question(projectNameQuestion);
  let answerValidation = projectNameRegex.exec(componentName);

  while (!answerValidation || answerValidation[0] !== answerValidation.input) {
    console.log(colorError('Invalid component name'));
    componentName = await read.question(projectNameQuestion);
    answerValidation = projectNameRegex.exec(componentName);
  }

  read.close();

  return { projectType, componentName };
}

/**
 * Creates the folder structure to work with a lit component using JS
 * @param {string} componentName
 */
async function createJsProject(componentName) {
  const upperCamelCaseName = getUpperCameCaseName(componentName);
  const files = ['index.html', 'index.js', 'styles.css', `src/component.js`, `src/component.scss`, 'package.json'];
  const filesGeneration = fileGenerationPromises(files, componentName, upperCamelCaseName);

  Promise.all(filesGeneration).then(() => {
    generateESlintConfig();
    console.log(colorSuccess('  Project created successfully!'));
    console.log(colorPrimary('  Installing dependencies...'));
    console.log('');
    const install = spawn('npm', ['install'], { shell: true, stdio: 'inherit' });

    install.on('close', () => {
      console.log(colorSuccess(`  Dependencies installed successfully!`));

      console.log('> bkwc --serve');
      spawn('bkwc', ['--serve'], { shell: true, stdio: 'inherit' });
    });
  });
}

/**
 * Generates promises to create given files based on templates
 * @param {string[]} files
 * @param {string} componentName
 * @param {string} upperCamelCaseName
 * @returns {Promise[]}
 */
function fileGenerationPromises(files, componentName, upperCamelCaseName) {
  let templatesPath = path.join(__dirname, 'templates');
  return files.map(file => {
    let folderPath = process.cwd();
    let fileToWrite = file;
    const isInSrc = file.includes('src/');
    if (isInSrc) {
      fileToWrite = `${upperCamelCaseName}.${file.split('.').pop()}`;
      file = file.split('/').pop();
      createFolder('src');
      folderPath = path.join(process.cwd(), 'src');
    }

    return fsPromise.readFile(path.join(templatesPath, `${file}.tmpl`), { encoding: 'utf8' }).then(data => {
      const updatedData = data.replace(/ComponentName/g, upperCamelCaseName).replace(/component-name/g, componentName);
      fs.writeFile(path.join(folderPath, fileToWrite), updatedData, { encoding: 'utf8' }, error => error && console.log(colorError(error)));
    });
  });
}

/**
 * Generates eslint config and vscode settings
 */
function generateESlintConfig() {
  const vscodeFolderPath = path.join(process.cwd(), '.vscode');
  exec(`cp ${path.resolve(__dirname, '..', 'eslint.config.js')} ${path.join(process.cwd())}`);

  createFolder('.vscode');
  fs.writeFileSync(path.join(vscodeFolderPath, 'settings.json'), VSCODE_SETTINGS, { encoding: 'utf8' });
  fs.writeFileSync(path.join(vscodeFolderPath, 'extensions.json'), VSCODE_EXTENSIONS, { encoding: 'utf8' });
}

/**
 * Returns the component name in UpperCamelCase
 * @param {string} componentName
 * @returns {string}
 */
function getUpperCameCaseName(componentName) {
  return componentName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

/**
 * Creates a folder in the given path
 * @param {string} folderName
 */
function createFolder(folderName) {
  if (!fs.existsSync(path.join(process.cwd(), folderName))) {
    fs.mkdirSync(path.join(process.cwd(), folderName));
  }
}
