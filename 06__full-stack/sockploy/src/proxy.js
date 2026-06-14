import express from 'express';
import httpProxy from 'http-proxy';

const app   = express();
const proxy = httpProxy.createProxy();

app.use((req, res) => {
    const containerName = req.hostname.split('.')[0];
    proxy.web(req, res, { target: `http://${containerName}:80` });
});

export function startProxyServer() {
    app.listen(80, () => {
        console.log('Reverse proxy is running on port 80');
    });
}