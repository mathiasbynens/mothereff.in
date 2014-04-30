#!/usr/bin/env bash

cd "$(dirname "${BASH_SOURCE}")"

curl -# "https://raw.githubusercontent.com/mathiasbynens/bacon-cipher/master/bacon.js" > bacon.js

cat "bacon.js" "../eff.js" > "/tmp/bacon.js"
echo "Copying concatenated JS to pasteboard..."
pbcopy < "/tmp/bacon.js"
