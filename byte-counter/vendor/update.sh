#!/usr/bin/env bash

cd "$(dirname "${BASH_SOURCE}")"

curl -# "https://raw.githubusercontent.com/mathiasbynens/utf8.js/master/utf8.js" > utf8.js

cat "utf8.js" "../eff.js" > "/tmp/byte-counter.js"
echo "Copying concatenated JS to pasteboard..."
cat "/tmp/byte-counter.js" | pbcopy
