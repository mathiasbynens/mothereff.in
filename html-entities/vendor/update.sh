#!/bin/bash

cd "$(dirname "${BASH_SOURCE}")"

curl -# "https://raw.github.com/mathiasbynens/he/master/he.js" > he.js

cat "he.js" "../eff.js" > "/tmp/html-entities.js"
echo "Copying concatenated JS to pasteboard..."
cat "/tmp/html-entities.js" | pbcopy
