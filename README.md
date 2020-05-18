# Description

This is a user script which tries to sanitize fast moving Twitch chats by filtering

- immediately following repeated messages
- repeated messages in short time (default: 1.5 seconds) – This defends against LULW and Pog avalanches that happen in large chats.
- repeated long messages (at least 150 characters long, repeated within 30 seconds) – This defends against copy-pasta spam.

# Build

Use Webpack to build this after you have installed all necessary dependencies.
