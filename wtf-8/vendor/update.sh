#!/usr/bin/env bash

cd "$(dirname "${BASH_SOURCE}")"

curl -# "https://raw.githubusercontent.com/mathiasbynens/wtf-8/master/wtf-8.js" > wtf-8.js

cat "wtf-8.js" "../eff.js" > "/tmp/wt-eff-8.js"
echo "Copying concatenated JS to pasteboard..."
pbcopy < "/tmp/wt-eff-8.js"
