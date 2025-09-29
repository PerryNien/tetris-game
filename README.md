# Tetris Game

A modern, responsive Tetris game built with pure JavaScript and HTML5 Canvas.

## Features

- 🎮 Classic Tetris gameplay
- 📱 Mobile-friendly with touch controls
- 🎨 Beautiful gradient design
- 🏆 Score and level system
- ⏸️ Pause/Resume functionality
- 🔄 Piece rotation with wall kicks
- 📊 Next piece preview
- 🔊 **Immersive audio system with sound effects and background music**
- 🎵 **Customizable volume controls for master, music, and sound effects**
- 🔇 **Mute/unmute functionality**

## How to Play

### Desktop Controls
- **←/→**: Move piece left/right
- **↓**: Soft drop (faster fall)
- **↑/Space**: Rotate piece
- **P**: Pause/Resume
- **R**: Restart game
- **M**: Mute/Unmute all audio

### Mobile Controls
- **Tap**: Rotate piece
- **Swipe Left/Right**: Move piece
- **Swipe Down**: Soft drop
- **Touch Controls**: Use the on-screen buttons
- **🔊 Audio Button**: Tap to enable audio, then use as mute/unmute toggle

### Audio Controls
- **Volume Sliders**: Adjust master volume, background music, and sound effects separately
- **Mute Button**: Instantly mute/unmute all audio
- **Keyboard Shortcut**: Press 'M' to toggle mute on desktop
- **Mobile Audio Button**: Persistent audio control - enable first, then toggle mute/unmute

## Play Online

Visit the live game: [Tetris Game](https://your-username.github.io/tetris-game/)

## Local Development

1. Clone this repository
2. Open `index.html` in your web browser
3. Start playing!

## Technologies Used

- HTML5 Canvas
- Pure JavaScript (ES6+)
- CSS3 with responsive design
- Touch event handling for mobile devices
- **Web Audio API for immersive sound effects and music**

## Audio Features

This Tetris game includes a comprehensive audio system with **full mobile device support**:

- **Background Music**: Ambient chord progressions that loop continuously
- **Sound Effects**: 
  - Movement sounds when pieces move horizontally
  - Rotation sound when pieces are rotated
  - Drop sound when pieces lock into place
  - Line clear sound for 1-3 lines
  - Special "Tetris" sound for clearing 4 lines at once
  - Level up fanfare
  - Game over sound
  - Pause/resume audio feedback
- **Volume Controls**: Separate sliders for master volume, music, and sound effects
- **Mute Functionality**: Quick mute/unmute with visual feedback
- **Mobile Audio Support**: 
  - Automatic audio unlock on first user interaction
  - Persistent audio control button in touch controls (enable → mute toggle)
  - Audio status indicator
  - Optimized for iOS and Android browsers

All audio is generated using the Web Audio API, ensuring compatibility across modern browsers and providing crisp, retro-style game sounds. The game automatically handles mobile browser audio restrictions and provides clear feedback when audio needs to be enabled.

Enjoy playing Tetris! 🎉