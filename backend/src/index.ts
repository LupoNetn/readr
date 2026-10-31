import express from 'express'
import type { Request, Response } from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import { createMcpServer } from './mcp/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp'

dotenv.config()

const port = process.env.PORT ?? 3030

const app = express()
app.use(cors())
app.use(express.json())


app.get("/health", async (req: Request, res: Response) => {
    res.status(200).json({
        "successful": "true",
        "message": "readr v1 is active"
    })
})

app.all("mcp", async (req: Request, res: Response) => {
    const server = createMcpServer()
    const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined
    })

    try {
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
    } catch (error) {
        console.error("Error handling MCP request:", error)
        if (!res.headersSent) {
            res.status(500).json({
                error: "Internal Server Error"
            })
        }
    } finally {
        req.on("close", () => {
            transport.close().catch(() => {})
            server.close().catch(() => {})
        })
    }
})

app.listen(port, () => {
    console.log(`Server is live and active at port ${port}`)
})