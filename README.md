# WGT Frontend
Web GIS Trasversale - Provincia Autonoma di Trento, Italy. [Link](https://webgis.provincia.tn.it/wgt/)

## Who use WGT Frontend
  - Provincia autonoma di Trento 
  - father project: Geoportal Svizzera: https://map.geo.admin.ch/
  - other projects:
    - National :
       - Norwegian Institute of Bioecomic Research : Geoportal forest of Norway: http://kartbeta.skogoglandskap.no/kilden
       - Geoportal Luxembourg is a clone of first version: http://map.geoportail.lu/
    - Regional :
       - Geoportal Bayern : https://geoportal.bayern.de/bayernatlas/
       - Geoportal Jura-Bernois https://map.geojb.ch
       - Geoportal Trento https://webgis.provincia.tn.it/wgt/
       - Geoportal Piemont http://www.geoportale.piemonte.it/geocatalogorp/?sezione=mappa
       - Geoportal of Thurgau https://map.geo.tg.ch/
       - Environmental Portal of Niedersachsen https://numis.niedersachsen.de/kartendienste


## Description
This repository contains the frontend part of the WGT project, which is based on [mf-geoadmin3](https://github.com/geoadmin/mf-geoadmin3) release [r_151216](https://github.com/geoadmin/mf-geoadmin3/releases/tag/r_151216).

The `origin_src` folder contains the fork of `mf-geoadmin3`, while modified files are located in `custom_src` folder.
The build process made with `gulp` generates the `src` folder, which contains the final code to deploy.

## Requirements
- [npm](https://www.npmjs.com/), (since 2020-07-22 using `nvm 8.11.1` with `npm 5.6.0`)
- [bower](https://bower.io/)
- [gulp](http://gulpjs.com/)

## How to build
1. `npm install`
2. `npm run bower-install`
3. `npm run gulp-prod`
