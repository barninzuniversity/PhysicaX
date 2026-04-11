#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
blockMesh
surfaceFeatureExtract
snappyHexMesh -overwrite
simpleFoam
postProcess -func sample
