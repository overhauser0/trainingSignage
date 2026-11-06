# Training signage

## Netlify deployment

Deploy this repository with the repository root as the publish directory. Netlify
uses `netlify.toml` to publish the static files and deploy the settings function.
The settings function uses Netlify Blobs for site-wide persistence.

Anyone can view the countdowns; opening the settings form prompts for the
password configured in `netlify/functions/settings.mjs`. The server validates
the password, which is held in memory only while the settings form is open.
Anyone with access to the source repository can read this fixed password. Use
the site over HTTPS.

To return from the signage to the top screen, long-press or double-tap the
character. The top screen is also shown automatically if the screen Wake Lock
is released.
