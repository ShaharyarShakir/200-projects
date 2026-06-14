import { Router } from 'express';
import { imageExists, pullImage, deployContainer } from '../docker.service.js';

const router = Router();

router.post('/container', async (req, res) => {
    const { image, tag } = req.body;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const send = (type, payload) =>
        res.write(`data: ${JSON.stringify({ type, ...payload })}\n\n`);

    try {
        const exists = await imageExists(image, tag);

        if (!exists) {
            send('log', { message: `Pulling ${image}:${tag}…` });
            await pullImage(image, tag, (msg) => send('log', { message: msg }));
            send('log', { message: 'Pull complete.' });
        } else {
            send('log', { message: `Image ${image}:${tag} already present, skipping pull.` });
        }

        send('log', { message: 'Creating container…' });
        send('log', { message: 'Starting container…' });
        const { name, domain } = await deployContainer(image, tag);

        send('log', { message: `Connected to network.` });
        send('done', { containerName: name, domain });
    } catch (err) {
        send('error', { message: err.message });
    } finally {
        res.end();
    }
});

export default router;