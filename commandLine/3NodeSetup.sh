#!/bin/bash

cd ~/automated_experiment_baba_20240514/client/node
npm ci

cd ~/automated_experiment_baba_20240514/server/node
npm ci

cd ~/automated_experiment_baba_20240514/server/html
npm ci
