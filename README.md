# Cuppa Tools

Development tools and CLI utilities for Cuppa Platform.

## Overview

This repository contains command-line tools and development utilities used across the Cuppa Platform ecosystem.

## Tools

### cuppa-cli

Cross-platform CLI tool for generating platform-specific code from Cuppa specifications.

**Features**:
- Generate iOS/Swift code from model and API specifications
- Generate Web/TypeScript code from specifications
- Scaffold new Cuppa projects
- Component generation from templates
- Design token code generation

**Documentation**: See [cuppa-cli/README.md](./cuppa-cli/README.md)

## Installation

```bash
# Clone the repository
git clone https://github.com/cuppa-platform/cuppa-tools.git
cd cuppa-tools

# Install cuppa-cli globally
cd cuppa-cli
npm install -g .
```

## Usage

```bash
# Generate code from specifications
cuppa generate --spec path/to/spec.yaml --output ./generated

# Create new Cuppa project
cuppa create my-app --template ios

# Generate component
cuppa component Button --platform ios
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Link for local development
npm link
```

## Repository Structure

```
cuppa-tools/
├── cuppa-cli/          # Main CLI tool
│   ├── src/            # TypeScript source
│   ├── dist/           # Compiled JavaScript
│   └── README.md       # CLI documentation
└── README.md           # This file
```

## Requirements

- Node.js 18+
- npm 9+

## Contributing

This repository is part of the Cuppa Platform development tools. For contribution guidelines, please see the main Cuppa Platform documentation.

## License

MIT License - Copyright © 2025 MyCuppa

## Related Repositories

- [cuppa-ios-v2](https://github.com/mycuppa/cuppa-ios-v2) - iOS Framework
- [cuppa-specs](https://github.com/cuppa-platform/cuppa-specs) - Platform Specifications
- [cuppa-plugins-ios](https://github.com/cuppa-platform/cuppa-plugins-ios) - iOS Plugins
