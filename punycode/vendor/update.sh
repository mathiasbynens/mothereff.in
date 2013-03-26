#!/bin/bash

cd "$(dirname "${BASH_SOURCE}")"

curl -# "https://raw.github.com/bestiejs/punycode.js/master/punycode.js" > "punycode.js"

echo "Copying JS to pasteboard..."
cat "punycode.js" | pbcopy
