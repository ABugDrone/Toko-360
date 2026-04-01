# Notification Sounds

This directory contains audio files for the real-time notification system.

## Required Files

### notification.mp3
- **Purpose**: Plays when new messages arrive
- **Format**: MP3 or OGG
- **Duration**: 0.5-2 seconds
- **File Size**: < 50KB
- **Volume**: Pleasant, corporate tone (not exceeding 70dB equivalent)
- **License**: Royalty-free or properly licensed for commercial use

## Current Status

**PLACEHOLDER**: The notification.mp3 file needs to be added by the user.

Please replace this README with your preferred notification sound file named `notification.mp3`.

## Accessibility

The notification sound is accompanied by visual indicators to ensure accessibility for deaf users.

## Usage

The sound file is loaded by the `use-audio-notification` hook and played when:
- A new unread message arrives
- The message is not sent by the current user
- At most once every 3 seconds (debounced)
