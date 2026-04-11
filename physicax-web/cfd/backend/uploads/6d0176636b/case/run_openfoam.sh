#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
blockMesh
surfaceFeatureExtract
snappyHexMesh -overwrite || snappyHexMesh
simpleFoam
postProcess -func sample
postProcess -func streamlines
