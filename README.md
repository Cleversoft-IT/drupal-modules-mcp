# drupal-modules-mcp MCP Server

A Model Context Protocol server for retrieving Drupal module information from drupal.org.

This TypeScript-based MCP server provides tools to fetch detailed information about Drupal modules directly from drupal.org. It helps AI assistants and other tools to get accurate, up-to-date information about Drupal modules including version compatibility, installation instructions, and documentation.

<a href="https://glama.ai/mcp/servers/yuseiq2ka3"><img width="380" height="200" src="https://glama.ai/mcp/servers/yuseiq2ka3/badge" alt="drupal-modules-mcp Server MCP server" /></a>

## Features

### Tools
- `get_module_info` - Fetch comprehensive information about a Drupal module
  - Requires the module's machine name as parameter
  - Returns detailed module information including:
    - Name and description
    - Latest recommended version
    - Download statistics
    - Module status
    - Composer installation command
    - Drupal version compatibility
    - Project URL
    - Module documentation/README

## Development

Install dependencies:
```bash
npm install
```

Build the server:
```bash
npm run build
```

For development with auto-rebuild:
```bash
npm run watch
```

## Installation

### Claude Desktop

Add the server config to your Claude Desktop configuration:

On MacOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
On Windows: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "drupal-modules-mcp": {
      "command": "/path/to/drupal-modules-mcp/build/index.js"
    }
  }
}
```

### Cline, Roo-Cline, and Windsurf

Add the server configuration to your IDE's settings:

1. Open the IDE settings
2. Navigate to the MCP Servers section
3. Add a new server with the following configuration:
   ```json
   {
     "drupal-modules-mcp": {
       "command": "/path/to/drupal-modules-mcp/build/index.js"
     }
   }
   ```

Make sure to replace `/path/to/drupal-modules-mcp` with the actual path where you installed the server.

### Debugging

Since MCP servers communicate over stdio, debugging can be challenging. We recommend using the [MCP Inspector](https://github.com/modelcontextprotocol/inspector), which is available as a package script:

```bash
npm run inspector
```

The Inspector will provide a URL to access debugging tools in your browser.
