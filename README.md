# CoreXY Warehouse Automation System

A modern web-based warehouse automation system for CoreXY machines, providing intelligent box packing algorithms, real-time machine control, and comprehensive storage management through Moonraker integration.

## Features

- **Intelligent Packing Algorithm**: Advanced bin packing optimization for efficient storage utilization
- **Real-time Machine Control**: Direct CoreXY control through Moonraker API integration
- **Interactive Visualization**: Live 3D warehouse visualization with placement and retrieval animations
- **WebSocket Communication**: Real-time status updates and command execution
- **Responsive Design**: Modern UI built with React 19, Tailwind CSS, and Radix UI components
- **Machine Diagnostics**: Connection testing, emergency stops, and comprehensive error handling
- **Simulation Mode**: Test packing algorithms and movements before physical execution

## Table of Contents

- [Getting Started](#getting-started)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Architecture](#architecture)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)
- [Resources](#resources)
- [License](#license)
- [Code of Conduct](#code-of-conduct)

## Getting Started

Follow these steps to set up and run the CoreXY Warehouse Automation System.

## Prerequisites

### Hardware Requirements
- CoreXY 3D machine with Klipper firmware
- Moonraker API server running on machine host
- Network connectivity between frontend and machine 

### Software Requirements
- Node.js 16.x or higher
- npm 8.x or higher
- Modern web browser with WebSocket support

### Machine Setup
- Klipper firmware installed and configured
- Moonraker service running (typically on port 7125)
- CORS configured for web interface access

## Installation

### Clone the Repository
```bash
git clone https://github.com/yourusername/corexy-frontend.git
cd corexy-frontend
```

### Install Dependencies
```bash
npm install
```

### Development Server
```bash
npm start
```
The application will be available at `http://localhost:3000`

### Production Build
```bash
npm run build
npm install -g serve
serve -s build -l 3000
```

## Configuration

### Moonraker Configuration
Ensure your `moonraker.conf` includes proper CORS settings:

```ini
[authorization]
cors_domains:
    *
    http://localhost:3000
    http://your-frontend-domain.com

trusted_clients:
    10.0.0.0/8
    127.0.0.0/8
    169.254.0.0/16
    172.16.0.0/12
    192.168.0.0/16
    FE80::/10
    ::1/128
```

### Application Configuration
Default warehouse dimensions and settings are configured in `src/App.tsx`:

```typescript
const defaultConfig: WarehouseConfig = {
  storageWidth: 400,  // 40cm
  storageLength: 400, // 40cm
  numRectangles: 50,
  minSide: 50,        // 5cm
  maxSide: 50,        // 5cm
  clearance: 20       // 2cm
};
```

## Usage

### Basic Operations

1. **Connect to Machine**
   - Enter your Moonraker server IP and port (e.g., `192.168.1.100:7125`)
   - Click "Test Connection" to verify connectivity
   - Green status indicates successful connection

2. **Configure Warehouse**
   - Adjust storage dimensions in the Configuration Panel
   - Set box parameters (quantity, size range, clearance)
   - Click "Save Configuration" to apply changes

3. **Generate Packing Layout**
   - The system automatically generates an optimized packing layout
   - View statistics: boxes packed, space efficiency, solving time
   - Observe the visual representation in the storage grid

4. **Execute Physical Operations**
   - Use "Play" to start automated placement sequence
   - Monitor real-time progress in the Simulation Control Panel
   - Use "Step Forward" for manual step-by-step execution

5. **Manual Control**
   - Directional movement controls (X/Y axis)
   - Home positioning command
   - Emergency stop for safety

### Advanced Features

#### Simulation Modes
- **IDLE**: System ready for commands
- **PLACEMENT**: Automated box placement in progress
- **RETRIEVAL**: Box retrieval operations

#### G-code Generation
The system generates optimized G-code commands for:
- Home positioning (`G28`)
- Coordinated movements (`G1`)
- Tool positioning and operation
- Safety protocols and error handling

## Architecture

### Frontend Stack
- **React 19**: Modern UI framework with concurrent features
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library

### Core Components

#### Packing Algorithm (`lib/packingAlgorithm.ts`)
- Implements advanced bin packing optimization
- Generates placement and retrieval paths
- Calculates storage density metrics

#### G-code Generator (`lib/gcode-generator.ts`)
- Converts logical operations to G-code commands
- Handles movement optimization and safety protocols
- Supports manual and automated operations

#### Moonraker API Client (`lib/moonraker-api.ts`)
- RESTful API communication
- WebSocket connection management
- Error handling and retry logic

### Data Flow
```
User Interface → State Management → API Layer → Moonraker → Klipper → Hardware
```

## 🤝 Contributing

We welcome contributions from the community! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests if applicable
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Style
- Follow TypeScript best practices
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Maintain consistent formatting with Prettier

## 🔧 Troubleshooting

### Common Issues

#### Connection Problems
See [Moonraker Troubleshooting Guide](docs/moonraker-troubleshooting.md) for detailed connection troubleshooting.

#### Build Issues
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear browser cache
# Use incognito/private browsing mode
```

#### CORS Errors
Ensure Moonraker configuration includes your frontend domain in `cors_domains`.

### Debug Mode
Enable verbose logging by opening browser developer tools (F12) and monitoring the Console tab.

### Getting Help
- Check the [Issues](https://github.com/yourusername/corexy-frontend/issues) page
- Review [Moonraker documentation](https://moonraker.readthedocs.io/)
- Join the [Klipper Discord](https://discord.klipper3d.org/) community

## Resources

- [Documentation](docs/) - Detailed guides and API documentation
- [Moonraker API](https://moonraker.readthedocs.io/) - 3D printer web API framework
- [Klipper Firmware](https://www.klipper3d.org/) - 3D printer firmware
- [React Documentation](https://reactjs.org/) - UI framework documentation

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Code of Conduct

We follow the CNCF Code of Conduct. Please see our [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) file for details.

---

**Note**: This project is designed for educational and research purposes. Ensure proper safety measures when operating physical machinery.