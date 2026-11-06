const http = require("node:http")
const fs = require("node:fs")
const path = require("node:path")

const root = __dirname
const port = Number(process.env.PORT || 4173)

http
  .createServer((req, res) => {
    const url = new URL(req.url, `http://127.0.0.1:${port}`)
    const file = path.join(root, url.pathname === "/" ? "panel.html" : url.pathname)
    if (!file.startsWith(root)) {
      res.writeHead(403).end("forbidden")
      return
    }
    fs.readFile(file, (error, data) => {
      if (error) {
        res.writeHead(404).end("not found")
        return
      }
      const type = file.endsWith(".html")
        ? "text/html; charset=utf-8"
        : file.endsWith(".css")
          ? "text/css; charset=utf-8"
          : "text/plain; charset=utf-8"
      res.writeHead(200, { "content-type": type }).end(data)
    })
  })
  .listen(port, "127.0.0.1", () => console.log(`prototype on http://127.0.0.1:${port}`))
