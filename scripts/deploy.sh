#!/bin/sh
# Deploy Flip runtime files from ~/flip to ~/flip.basecentral.link
# Usage: sh scripts/deploy.sh
# Optional: FLIP_CHECKOUT=/path/to/flip FLIP_WEB_ROOT=/path/to/web-root sh scripts/deploy.sh
set -eu

fail() {
    printf 'Deployment stopped: %s\n' "$*" >&2
    exit 1
}

checkout=${FLIP_CHECKOUT:-$HOME/flip}
target=${FLIP_WEB_ROOT:-$HOME/flip.basecentral.link}
repo=https://github.com/nunopedrosa/flip.git

case "$checkout" in
    /*) ;;
    *) fail 'FLIP_CHECKOUT must be an absolute path.' ;;
esac
case "$target" in
    /*) ;;
    *) fail 'FLIP_WEB_ROOT must be an absolute path.' ;;
esac

[ -d "$target" ] || fail "Create the web directory first: $target"
[ -w "$target" ] || fail "The web directory must be writable: $target"

case "$target/" in "$checkout/"*) fail 'The web directory must be outside the checkout.' ;; esac
case "$checkout/" in "$target/"*) fail 'The web directory must not contain the checkout.' ;; esac

if [ ! -d "$checkout/.git" ]; then
    printf 'Cloning %s into %s\n' "$repo" "$checkout"
    git clone "$repo" "$checkout" || fail 'git clone failed.'
else
    printf 'Updating %s\n' "$checkout"
    git -C "$checkout" pull --ff-only || fail 'git pull --ff-only failed.'
fi

if [ -n "$(git -C "$checkout" status --porcelain)" ]; then
    fail 'Checkout has local changes; commit or discard them before deploying.'
fi

# Must match version.js RELEASE_ASSETS (omit the "./" entry).
published_assets='index.html style.css app.js engine.js i18n.js storage.js pwa-client.js version.js manifest.webmanifest icon.svg icon-192.png icon-512.png sw.js'

for asset in $published_assets; do
    [ -f "$checkout/$asset" ] && [ ! -L "$checkout/$asset" ] || fail "Missing or symlinked source asset: $asset"
    [ ! -L "$target/$asset" ] || fail "Refusing to replace a symlink: $asset"
    if [ -e "$target/$asset" ] && [ ! -f "$target/$asset" ]; then
        fail "The destination is not a regular file: $asset"
    fi
done

umask 022
stage=$(mktemp -d "$target/.flip-deploy.XXXXXXXX")
cleanup() {
    for asset in $published_assets; do
        rm -f "$stage/$asset" 2>/dev/null || true
    done
    rmdir "$stage" 2>/dev/null || true
}
trap cleanup 0
trap 'exit 1' 1 2 15

for asset in $published_assets; do
    cp "$checkout/$asset" "$stage/$asset"
    chmod 644 "$stage/$asset"
done

for asset in $published_assets; do
    mv -f "$stage/$asset" "$target/$asset"
done

printf 'Deployed commit %s from %s to %s\n' "$(git -C "$checkout" rev-parse --short HEAD)" "$checkout" "$target"
