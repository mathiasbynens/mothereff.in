#!/usr/bin/env bash

cd "$(dirname "${BASH_SOURCE}")"

curl -# "https://raw.githubusercontent.com/mathiasbynens/utf8.js/master/utf8.js" > utf8.js

cat "utf8.js" "../eff.js" > "/tmp/ut-eff-8.js"
echo "Copying concatenated JS to pasteboard..."
cat "/tmp/ut-eff-8.js" | pbcopy
