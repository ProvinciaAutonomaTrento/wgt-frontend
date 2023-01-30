#!/usr/bin/env bash
environment=$1

source ~/.nvm/nvm.sh
nvm use 8.11.1

npm install
npm run bower-install

if [ "$environment" == "DEV" ]; then
    echo "Compiling for the $environment"
    npm run gulp-dev
elif [ "$environment" == "PROD" ]; then
    echo "Compiling for the $environment"
    npm run gulp-prod
else
    echo "Compiling for the PROD"
    npm run gulp-prod
fi;



