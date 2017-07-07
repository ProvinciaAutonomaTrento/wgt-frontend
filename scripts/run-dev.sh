#!/usr/bin/env bash

npm install
bower install
gulp --profile=dev
gulp connect