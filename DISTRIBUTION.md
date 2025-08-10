# Distribution Architecture

## Overview

The Foundry VTT AI Model Integration uses a professional two-part distribution strategy following platform conventions:

1. **Foundry Module**: Standard Foundry distribution via GitHub releases
2. **MCP Server**: Cross-platform desktop application with professional installers

## Distribution Components

### 1. Foundry Module Distribution

**Standard Foundry VTT Module Pattern:**
- **Manifest URL**: Auto-discovery via Foundry's module browser
- **GitHub Releases**: Automated ZIP packaging and distribution  
- **Auto-Updates**: Native Foundry update system handles versioning
- **Installation**: One-click install through Foundry's UI

**Technical Implementation:**
```json
{
  "manifest": "https://github.com/adambdooley/foundry-vtt-mcp-integration/releases/latest/download/module.json",
  "download": "https://github.com/adambdooley/foundry-vtt-mcp-integration/releases/latest/download/foundry-mcp-bridge.zip"
}
```

### 2. MCP Server Desktop Application

**Professional Cross-Platform Installers:**
- **Windows**: NSIS installer (.exe) with proper app signing
- **macOS**: DMG with universal binary (x64 + ARM64)
- **Linux**: AppImage and DEB packages for broad compatibility

**Electron-based Architecture:**
- **Native OS integration** with system tray and auto-start options
- **Professional UI** with real-time server status and controls
- **Auto-updater** for seamless application updates
- **Resource bundling** includes complete MCP server runtime

## Build & Release Process

### Automated GitHub Actions Workflow

**Trigger Conditions:**
- **Git tags**: `v*` pattern (e.g., `v0.4.5`)
- **Manual dispatch**: For testing and hotfixes

**Build Matrix:**
- **Windows**: Windows Server 2022, x64 architecture
- **macOS**: macOS 12+, Universal binary (x64 + ARM64)
- **Linux**: Ubuntu 20.04, x64 with broad compatibility

**Artifact Generation:**
1. **Foundry Module**: ZIP package with all required files
2. **MCP Server Executables**: Platform-specific standalone binaries
3. **Professional Installers**: Native installation packages
4. **GitHub Release**: Automated release with all artifacts

### Package Structure

**Foundry Module Package:**
```
foundry-mcp-bridge.zip
├── module.json          # Foundry manifest
├── dist/               # Compiled TypeScript
├── styles/             # CSS styling
├── lang/               # Localization
└── README.md           # Module documentation
```

**MCP Server Application:**
```
Foundry-MCP-Server/
├── app/                # Electron application
│   ├── main.js         # Application entry point
│   ├── preload.js      # Secure context bridge
│   └── resources/      # UI assets and icons
├── mcp-server/         # Bundled MCP server
│   ├── dist/          # Compiled server code
│   └── node_modules/   # Server dependencies
└── package.json        # Application metadata
```

## Professional Standards

### Code Signing & Trust

**Windows:**
- **Authenticode signing** for executable trust
- **SmartScreen compatibility** to avoid security warnings
- **Installer certificate** for professional appearance

**macOS:**
- **Apple Developer ID** signing for Gatekeeper compatibility
- **Notarization** for seamless installation experience
- **Universal binary** supporting both Intel and Apple Silicon

**Linux:**
- **AppImage** for universal compatibility across distributions
- **DEB packaging** following Debian policy standards
- **Desktop integration** with proper .desktop files and icons

### Version Management

**Semantic Versioning:**
- **Major.Minor.Patch** format (e.g., 0.4.5)
- **Synchronized versions** across all components
- **Automated version bumping** during release process

**Update Strategy:**
- **Foundry Module**: Leverages Foundry's built-in update system
- **MCP Server**: Electron auto-updater with background downloads
- **Backward Compatibility**: Maintains compatibility across minor versions

## Quality Assurance

### Testing Matrix

**Automated Testing:**
- **Build verification** on all target platforms
- **Package integrity** checks for all installers
- **Installation testing** in clean environments
- **Integration testing** between module and server components

**Manual Testing Checklist:**
- [ ] Clean installation on each platform
- [ ] Module discovery through Foundry's browser
- [ ] MCP server auto-start and connection
- [ ] Cross-platform file path handling
- [ ] Update process verification
- [ ] Uninstallation cleanup verification

### Performance Optimization

**Installer Size Optimization:**
- **Selective bundling** of Node.js dependencies
- **Asset compression** for UI resources
- **Platform-specific exclusions** to reduce download size

**Runtime Performance:**
- **Lazy loading** of MCP server components
- **Memory management** in Electron application
- **Connection pooling** for WebSocket communications
- **Background processing** for non-blocking operations

## Distribution Metrics

### Success Criteria

**Installation Success Rate:**
- **Target**: >95% successful installations across platforms
- **Measurement**: Error reporting through GitHub Issues
- **Monitoring**: Automated crash reporting in MCP Server app

**User Experience:**
- **Installation Time**: <2 minutes for complete setup
- **First-Run Success**: Connection established within 30 seconds
- **Update Reliability**: Seamless updates without user intervention

**Platform Coverage:**
- **Windows**: Windows 10+ (x64)
- **macOS**: macOS 10.14+ (Universal)
- **Linux**: Ubuntu 18+, CentOS 8+, Arch, Fedora

### Release Cadence

**Version Strategy:**
- **Major Releases**: Quarterly with significant new features
- **Minor Releases**: Monthly with incremental improvements
- **Patch Releases**: As needed for critical bug fixes
- **Security Updates**: Immediate response within 48 hours

**Communication:**
- **Release Notes**: Detailed changelog with upgrade instructions
- **GitHub Releases**: Full artifacts with installation guides
- **Community Updates**: Regular progress updates and roadmap sharing

## Support Infrastructure

### Documentation Strategy

**Multi-Level Documentation:**
1. **Quick Start**: 5-minute setup guide
2. **Installation Guide**: Comprehensive platform-specific instructions
3. **Troubleshooting**: Common issues with step-by-step solutions
4. **Developer Guide**: For contributors and advanced users

**Documentation Maintenance:**
- **Version Synchronization**: Docs updated with each release
- **Screenshot Updates**: UI changes reflected in visual guides
- **Community Contributions**: User-contributed tips and solutions

### Support Channels

**Primary Support:**
- **GitHub Issues**: Bug reports and feature requests
- **Installation Guide**: Comprehensive troubleshooting section
- **In-App Help**: Context-sensitive help within MCP Server app

**Community Support:**
- **README Documentation**: Always up-to-date with latest version
- **Release Notes**: Detailed upgrade and breaking change information
- **Example Configurations**: Sample setups for common use cases

## Future Distribution Considerations

### Planned Enhancements

**Package Manager Integration:**
- **Windows**: Microsoft Store submission consideration
- **macOS**: Mac App Store evaluation for sandboxed version
- **Linux**: Flatpak and Snap package distribution

**Enterprise Distribution:**
- **Silent Installation**: Command-line installer options
- **Group Policy**: Windows domain deployment support
- **Configuration Management**: Centralized configuration for organizations

**Cloud Distribution:**
- **Docker Containers**: For server-based deployments
- **Cloud Marketplace**: AWS/Azure marketplace listings
- **SaaS Consideration**: Hosted MCP server option evaluation