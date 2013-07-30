#!/bin/bash

cd "$(dirname "${BASH_SOURCE}")"

curl -# "https://raw.github.com/mathiasbynens/jsesc/master/jsesc.js" > "jsesc.js"

cat "jsesc.js" "../eff.js" > "/tmp/string-escape.js"
echo "Copying concatenated JS to pasteboard..."
cat "/tmp/string-escape.js" | pbcopy
