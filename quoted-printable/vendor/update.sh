#!/usr/bin/env bash

cd "$(dirname "${BASH_SOURCE}")"

curl -# "https://raw.githubusercontent.com/mathiasbynens/quoted-printable/master/quoted-printable.js" > quoted-printable.js
curl -# "https://raw.githubusercontent.com/mathiasbynens/utf8.js/master/utf8.js" > utf8.js

cat "quoted-printable.js" "utf8.js" "../eff.js" > "/tmp/quoted-printable.js"
echo "Copying concatenated JS to pasteboard..."
pbcopy < "/tmp/quoted-printable.js"
