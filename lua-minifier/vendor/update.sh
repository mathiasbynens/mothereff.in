#!/bin/bash

cd "$(dirname "${BASH_SOURCE}")"

curl -# "https://raw.github.com/oxyc/luaparse/master/luaparse.js" > luaparse.js
curl -# "https://raw.github.com/mathiasbynens/luamin/master/luamin.js" > luamin.js

cat "luaparse.js" "luamin.js" "../eff.js" > "/tmp/lua-minifier.js"
echo "Copying concatenated JS to pasteboard..."
cat "/tmp/lua-minifier.js" | pbcopy