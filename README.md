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

The top screen offers both the timetable layout and a countdown-focused
layout. The countdown layout shows the configured events as equal-width
columns, with the current date and time in the header.

Countdown settings support up to 20 region profiles, each with up to three
events. Choose a profile in the settings form and save it to make it the active
profile shown on the signage. Existing countdown settings are retained as the
「標準」 profile when first loaded after this update.

Automatic shutdown is enabled by default and can be changed in settings for
each device independently. When enabled, the signage returns to the top screen
at 23:30 and releases its screen Wake Lock. The display then turns off according
to the device's screen-sleep settings; the preference is stored in that
browser's local storage and is not shared through Netlify.

To return from the signage to the top screen, long-press or double-tap the
character. The top screen is also shown automatically if the screen Wake Lock
is released.
