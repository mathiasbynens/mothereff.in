#!/bin/bash

cd "$(dirname "$0")/vendor"

for file in https://raw.github.com/qfox/Zeon/master/Zeon.js https://raw.github.com/qfox/Zeon/master/zeparser/Tokenizer.js https://raw.github.com/qfox/Zeon/master/zeparser/ZeParser.js; do
	curl -O "$file"
done

cat Tokenizer.js ZeParser.js Zeon.js ../eff.js > ../all.js.tmp

cd ..
tr -d '\r' < all.js.tmp > all.js

rm all.js.tmp