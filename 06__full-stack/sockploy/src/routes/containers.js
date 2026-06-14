import { Router } from 'express';
import { listContainers, removeContainer } from '../docker.service.js';

const router = Router();

router.get('/containers', async (req, res) => {
    try {
        const containers = await listContainers();
        res.json({ status: 'success', data: containers });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

router.delete('/container/:id', async (req, res) => {
    try {
        await removeContainer(req.params.id);
        res.json({ status: 'success', message: `Container ${req.params.id.slice(0, 12)} removed` });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

export default router;