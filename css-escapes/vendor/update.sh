#!/usr/bin/env bash

cd "$(dirname "${BASH_SOURCE}")"

curl -# "https://raw.githubusercontent.com/mathiasbynens/jsesc/master/jsesc.js" > jsesc.js

cat "jsesc.js" "../eff.js" > "/tmp/css-escapes.js"
echo "Copying concatenated JS to pasteboard..."
cat "/tmp/css-escapes.js" | pbcopy
