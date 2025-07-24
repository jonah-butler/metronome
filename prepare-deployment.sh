#!/bin/bash

echo "Building Application"
npm run build

# Force add and stash build directory
git add dist -f
git stash save

# switch to gh-pages
git checkout gh-pages

# delete old files
git rm -rf .
git stash pop
 
#  copy build dir contents into top level
cp -a ./dist/. ./

# add and commit
git add .
git commit -m "latest build"

# push
git push origin gh-pages
