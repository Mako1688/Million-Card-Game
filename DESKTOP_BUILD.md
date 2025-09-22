# Million Card Game - Desktop Version

## Building for Desktop

This project can be packaged as a desktop application using Electron.

### Prerequisites
- Node.js (v16 or higher)
- npm

### Installation
```bash
npm install
```

### Development
```bash
npm start
```

### Building
```bash
# Build for current platform
npm run build

# Build for specific platforms
npm run build-win    # Windows
npm run build-mac    # macOS
npm run build-linux  # Linux
```

### Steam Preparation Checklist

#### Technical Requirements
- [ ] Add application icon (assets/icon.ico, .icns, .png)
- [ ] Implement settings menu (graphics, audio, controls)
- [ ] Add fullscreen toggle (F11)
- [ ] Implement proper save/load system
- [ ] Add achievement system hooks
- [ ] Optimize performance for various hardware
- [ ] Test on Steam Deck (if targeting)

#### Steam Integration
- [ ] Integrate Steamworks SDK
- [ ] Implement Steam achievements
- [ ] Add Steam cloud save support
- [ ] Implement Steam overlay compatibility
- [ ] Add controller support via Steam Input API
- [ ] Test with Steam client

#### Marketing Assets Needed
- [ ] Store capsule images (multiple sizes)
- [ ] At least 5 screenshots
- [ ] Trailer video
- [ ] Store description and features
- [ ] Age rating (ESRB/PEGI)

#### Distribution
- [ ] Create Steam Partner account ($100 fee)
- [ ] Complete tax and banking information
- [ ] Submit build to Steam for review
- [ ] Set pricing and regional availability
- [ ] Plan release date and marketing

### Notes
- The game maintains its original 1688x780 resolution
- Electron wrapper adds minimal overhead
- All original web functionality is preserved
- Compatible with Steam's requirements