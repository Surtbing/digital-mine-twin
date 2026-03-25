const http = require("http");
const fs = require("fs");
const path = require("path");

const server = http.createServer((req, res) => {

    if (req.url === "/" || req.url === "/index.html") {

        const filePath = path.join(__dirname, "index.html");
        const html = fs.readFileSync(filePath);

        res.writeHead(200, {
            "Content-Type": "text/html"
        });

        res.end(html);
        return;
    }

    res.writeHead(404);
    res.end("Not Found");
});

server.listen(4000, () => {
    console.log("🖥 Monitor running: http://localhost:4000");
});