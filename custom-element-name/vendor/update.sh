#!/usr/bin/env bash

cd "$(dirname "${BASH_SOURCE}")";

curl -# "https://raw.githubusercontent.com/mathiasbynens/is-potential-custom-element-name/master/index.js" > is-potential-custom-element-name.js;
curl -# "https://raw.githubusercontent.com/sindresorhus/validate-element-name/master/index.js" > validate.js;

cat "all.js" "../eff.js" > "/tmp/custom-element-name.js";
echo "Copying concatenated JS to pasteboard...";
pbcopy < "/tmp/custom-element-name.js";
