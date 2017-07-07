# WGT Frontend
Web GIS Trasversale - Provincia Autonoma di Trento, Italy. [Link](https://webgis.provincia.tn.it/wgt/)

## Description
This repository contains the frontend part of the WGT project, which is based on [mf-geoadmin3](https://github.com/geoadmin/mf-geoadmin3) release [r_151216](https://github.com/geoadmin/mf-geoadmin3/releases/tag/r_151216).

The `origin_src` folder contains the fork of `mf-geoadmin3`, while modified files are located in `custom_src` folder.
The build process made with `gulp` generates the `src` folder, which contains the final code to deploy.

## Requirements
- [npm](https://www.npmjs.com/)
- [bower](https://bower.io/)
- [gulp](http://gulpjs.com/)

## How to build
1. `npm install`
2. `bower install`
3. `gulp --profile=prod`
