#!/bin/bash

# Use the requirejs optimizer r.js to optimise js files

# By default it will create a sibling build directory called 'csl'
# or it uses a command line argument if present

if [ "$1" == "" ]
then
	BUILD_DIR="../bethecamera.com"
else
	BUILD_DIR="$1"
fi

echo "deploying to build dir $BUILD_DIR"

GIT_COMMIT=$(git rev-parse HEAD)
echo "git commit is $GIT_COMMIT"

rm -rf "$BUILD_DIR"
mkdir "$BUILD_DIR"
node external/r.js -o build.js dir=$BUILD_DIR

# TODO: Replace $GIT_COMMIT with the git commit hash in all php files
cd $BUILD_DIR

sed s/\$GIT_COMMIT/$GIT_COMMIT/g <index.html >tempFile
mv tempFile index.html
