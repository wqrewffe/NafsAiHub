<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/16nTVcckUorjcE0t5iWjKWTyEYwIq4u7Z

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Features

### Congratulations System

The app includes a comprehensive congratulations system that automatically detects and celebrates user achievements:

- **Badge Unlocks**: When users earn new badges (referral badges, tool usage badges, etc.)
- **Points Earned**: When users gain points through referrals or other activities
- **Level Ups**: When users reach new levels in the referral or tool usage systems

The congratulations modal features:
- Animated confetti effects
- Custom messages for different achievement types
- Smooth animations and transitions
- Automatic detection of new achievements

**Testing the Feature:**
- Visit the Admin Dashboard to find test buttons for manually triggering congratulations
- Use tools to trigger automatic achievement detection
- Complete referrals to see congratulations for new badges and points
