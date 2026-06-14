import { Router } from 'express';

const router = Router();

router.get('/health', (req, res) => {
    res.status(200).send('OK! container is running and ready to serve requests');
});

export default router;