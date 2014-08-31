#!/usr/bin/env bash

cd "$(dirname "$0")/vendor"

for file in Zeon.js zeparser/Tokenizer.js zeparser/ZeParser.js; do
	curl -O "https://raw.githubusercontent.com/qfox/Zeon/master/$file"
done

cat Tokenizer.js ZeParser.js Zeon.js ../eff.js > ../all.js.tmp

cd ..
tr -d '\r' < all.js.tmp > all.js

rm all.js.tmp