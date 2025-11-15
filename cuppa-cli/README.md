# @cuppa/cli

Command-line tool for scaffolding and managing Cuppa projects.

## Installation

```bash
npm install -g @cuppa/cli
```

## Usage

### Initialize a new project

```bash
cuppa init my-app --platforms ios,web
```

### Create a full project

```bash
cuppa create MyHealthApp --platforms ios,android --features auth,analytics
```

### Generate code from specifications

```bash
cuppa generate model User --from specs/models/User.schema.json
cuppa generate api-client --from specs/api/v1/openapi.yaml
cuppa generate theme --from specs/design/tokens.json
```

### Add plugins or features

```bash
cuppa add plugin @cuppa/analytics
cuppa add feature authentication
```

### Validate specifications

```bash
cuppa validate specs/models/User.schema.json
```

## Development

### Setup

```bash
pnpm install
```

### Build

```bash
pnpm build
```

### Test locally

```bash
npm link
cuppa --help
```

### Run without building

```bash
pnpm start init test-project
```

## Project Structure

```
cuppa-cli/
├── src/
│   ├── commands/       # CLI commands
│   ├── generators/     # Code generators
│   ├── templates/      # Project templates
│   ├── utils/          # Utility functions
│   └── index.ts        # Entry point
├── bin/
│   └── cuppa.js        # Executable
├── dist/               # Compiled output
└── package.json
```

## Commands

- `cuppa init` - Initialize a new Cuppa project
- `cuppa create` - Create a full project with scaffolding
- `cuppa generate` - Generate code from specifications
- `cuppa add` - Add plugins, features, or dependencies
- `cuppa validate` - Validate specification files

## License

MIT
