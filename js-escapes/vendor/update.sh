#!/usr/bin/env bash

cd "$(dirname "${BASH_SOURCE}")"

curl -# "https://raw.githubusercontent.com/mathiasbynens/String.fromCodePoint/master/fromcodepoint.js" > "fromcodepoint.js"
curl -# "https://raw.githubusercontent.com/mathiasbynens/jsesc/master/jsesc.js" > "jsesc.js"

cat "fromcodepoint.js" "jsesc.js" "../eff.js" > "/tmp/string-escape.js"
echo "Copying concatenated JS to pasteboard..."
cat "/tmp/string-escape.js" | pbcopy
