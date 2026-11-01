# App-owned publication contract; common engine: BaseCentral deploy 1.0.0.
APP_ID=flip
SOURCE_SUBDIR=.
DEFAULT_DESTINATION="${FLIP_WEB_ROOT:-$HOME/flip.basecentral.link}"
DEPLOY_URL=https://flip.basecentral.link
PUBLIC_FILES=$(cat <<'PUBLIC_FILES'
app.js
engine.js
i18n.js
icon-192.png
icon-512.png
icon.svg
index.html
manifest.webmanifest
pwa-client.js
shared-chevron.svg
shared-controls.css
shared-icons.svg
storage.js
style.css
sw.js
version.js
PUBLIC_FILES
)
