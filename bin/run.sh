#!/usr/bin/env bash

source ~/.nvm/nvm.sh
nvm use 8.11.1

npm install
npm run bower-install
npm run gulp-dev
npm run gulp-connect
