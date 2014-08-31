#!/usr/bin/env bash

cd "$(dirname "${BASH_SOURCE}")"

curl -# "https://raw.githubusercontent.com/mathiasbynens/esrever/master/esrever.js" > esrever.js

cat "esrever.js" "../eff.js" > "/tmp/reverse-string.js"
echo "Copying concatenated JS to pasteboard..."
cat "/tmp/reverse-string.js" | pbcopy
