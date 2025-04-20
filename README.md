# Bricks Web Components - CLI

This CLI has been built to develop isolated web components using Lit and SASS

For a better visual experience use [Nerd Fonts](https://www.nerdfonts.com/) as your terminal font

---

## Installation

```console
$ npm i -g bricks-wc
```

## Commands

```console
$ bkwc --lint
```

Uses [ESLint](https://eslint.org/) to find problems in the code based on ESlint recommended configurations and custom configurations found in [ESlint Configuration File](/eslint.config.js)

<br>

```console
$ bkwc --serve
```

Starts a live reloading local server to watch web component development in the browser. Implements [Modern Web Dev Server](https://modern-web.dev/docs/dev-server/node-api/)

<br>

```console
$ bkwc --build
```

Uses [esbuild](https://esbuild.github.io/) to generate a bundle of the web component with the following outputs:

```
├── build
│   ├── assets
│   │   ├── **/*.jpg
│   ├── css
│   │   ├── *.css (minify)
│   ├── js
│   │   ├── *.js
│   ├── index.html
```

<br>
