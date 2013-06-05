#!/bin/bash

cd "$(dirname "${BASH_SOURCE}")"

curl -# "https://raw.github.com/mathiasbynens/javascript-string-escape/master/string-escape.js" > "string-escape.js"

cat "string-escape.js" "../eff.js" > "/tmp/string-escape.js"
echo "Copying concatenated JS to pasteboard..."
cat "/tmp/string-escape.js" | pbcopy
