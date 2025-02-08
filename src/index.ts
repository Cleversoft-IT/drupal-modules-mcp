#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ErrorCode,
    ListToolsRequestSchema,
    McpError,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import * as cheerio from "cheerio";

interface ModuleInfo {
    name: string;
    description: string;
    version: string;
    downloads: string;
    status: string;
    composerCommand: string;
    drupalCompatibility: string[];
    projectUrl: string;
    readme: string;
}

class DrupalModulesServer {
    private server: Server;

    constructor() {
        this.server = new Server(
            {
                name: "drupal-modules-mcp",
                version: "0.1.0",
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );

        this.setupToolHandlers();

        this.server.onerror = (error) => console.error("[MCP Error]", error);
        process.on("SIGINT", async () => {
            await this.server.close();
            process.exit(0);
        });
    }

    private setupToolHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: "get_module_info",
                    description:
                        "Get information about a Drupal module from drupal.org",
                    inputSchema: {
                        type: "object",
                        properties: {
                            module_name: {
                                type: "string",
                                description:
                                    "Machine name of the Drupal module",
                            },
                        },
                        required: ["module_name"],
                    },
                },
            ],
        }));

        this.server.setRequestHandler(
            CallToolRequestSchema,
            async (request) => {
                if (request.params.name !== "get_module_info") {
                    throw new McpError(
                        ErrorCode.MethodNotFound,
                        `Unknown tool: ${request.params.name}`
                    );
                }

                const args = request.params.arguments as {
                    module_name: string;
                };
                if (!args.module_name) {
                    throw new McpError(
                        ErrorCode.InvalidParams,
                        "Module name is required"
                    );
                }

                try {
                    const moduleInfo = await this.fetchModuleInfo(
                        args.module_name
                    );
                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify(moduleInfo, null, 2),
                            },
                        ],
                    };
                } catch (error) {
                    if (axios.isAxiosError(error)) {
                        throw new McpError(
                            ErrorCode.InternalError,
                            `Failed to fetch module info: ${error.message}`
                        );
                    }
                    throw error;
                }
            }
        );
    }

    private async fetchModuleInfo(moduleName: string): Promise<ModuleInfo> {
        const url = `https://www.drupal.org/project/${moduleName}`;
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        // Get the latest recommended version
        const latestVersion = $(
            ".release.recommended-Yes .views-field-field-release-version strong"
        )
            .first()
            .text()
            .trim();

        // Get Drupal compatibility from the release info
        const compatibility = $(
            ".release.recommended-Yes div:contains('Works with Drupal:')"
        )
            .first()
            .text()
            .replace("Works with Drupal:", "")
            .trim()
            .split("||")
            .map((v) => v.trim());

        // Get description from meta tag since it's cleaner
        const description = $('meta[name="description"]').attr("content") || "";

        const info: ModuleInfo = {
            name: $("#page-title").text().replace("| Drupal.org", "").trim(),
            description: description,
            version: latestVersion,
            downloads:
                $(".project-info li:contains('sites report')")
                    .text()
                    .match(/\d+,\d+/)?.[0] || "0",
            status: $(".project-info li:contains('Module categories')")
                .text()
                .replace("Module categories:", "")
                .trim(),
            composerCommand: $(`.drupalorg-copy.composer-command`)
                .first()
                .text()
                .trim(),
            drupalCompatibility: compatibility,
            projectUrl: url,
            readme: (() => {
                const $body = $(".field-name-body");
                // Replace each link with text+url format
                $body.find("a").each((_, elem) => {
                    const $elem = $(elem);
                    const href = $elem.attr("href");
                    const text = $elem.text().trim();
                    $elem.replaceWith(`${text} (${href})`);
                });
                return $body.text().trim();
            })(),
        };

        // Add additional compatibility info from release table
        const releaseInfo = $(
            ".table-release-compatibility-current tbody tr"
        ).first();
        if (releaseInfo.length) {
            const releaseCompatibility = releaseInfo
                .find("td")
                .map((_, elem) => $(elem).text().trim())
                .get();
            info.drupalCompatibility = [
                ...new Set([
                    ...info.drupalCompatibility,
                    ...releaseCompatibility,
                ]),
            ];
        }

        return info;
    }

    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error("Drupal Modules MCP server running on stdio");
    }
}

const server = new DrupalModulesServer();
server.run().catch(console.error);
