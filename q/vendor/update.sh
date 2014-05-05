#!/usr/bin/env bash

cd "$(dirname "${BASH_SOURCE}")"

curl -# "https://raw.githubusercontent.com/mathiasbynens/q-encoding/master/q.js" > q.js
curl -# "https://raw.githubusercontent.com/mathiasbynens/utf8.js/master/utf8.js" > utf8.js

cat "q.js" "utf8.js" "../eff.js" > "/tmp/q.js"
echo "Copying concatenated JS to pasteboard..."
pbcopy < "/tmp/q.js"
