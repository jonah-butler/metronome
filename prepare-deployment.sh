#!/bin/bash

echo "Building Application"
npm run build

# Force add and stash build directory
git add dist -f
git stash save

# switch to gh-pages
git checkout gh-pages

# delete old files
git rm favicon.svg
git rm index.html
git rm -rf assets

# retrieve dist from stash
git stash pop
 
#  copy build dir contents into top level
cp -a ./dist/. ./

# delete dist dir
git rm -rf dist

# add and commit
git add .
git commit -m "latest build"

# push
git push origin gh-pages
