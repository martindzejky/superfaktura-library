#!/bin/sh
set -eu

# Cloud dev install script. Runs when an agent runs in the cloud.

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
AGENTFILES="${HOME}/.agentfiles"
NVM_DIR="${NVM_DIR:-$HOME/.nvm}"

# set up nvm and corepack so agentfiles install can run node
. "$NVM_DIR/nvm.sh"
corepack enable

# pull latest agentfiles
if [ ! -d "$AGENTFILES/.git" ]; then
  git clone --recurse-submodules https://github.com/martindzejky/agentfiles.git "$AGENTFILES"
else
  git -C "$AGENTFILES" fetch origin master
  git -C "$AGENTFILES" checkout -B master origin/master
  git -C "$AGENTFILES" submodule update --init --recursive
fi

HOME="$HOME" "$AGENTFILES/install"

# install dependencies
cd "$ROOT"
nvm install
corepack prepare --activate
pnpm install --frozen-lockfile
