#!/bin/bash

echo "Building Application"
npm run build

# Force add and stash build directory
git add dist -f
git stash save

# switch to gh-pages
git checkout gh-pages

# delete old files