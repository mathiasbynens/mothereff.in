#!/usr/bin/env bash

cd "$(dirname "${BASH_SOURCE}")"

curl -# "https://raw.githubusercontent.com/mathiasbynens/he/master/he.js" > he.js

cat "he.js" "../eff.js" > "/tmp/html-entities.js"
echo "Copying concatenated JS to pasteboard..."
pbcopy < "/tmp/html-entities.js"
