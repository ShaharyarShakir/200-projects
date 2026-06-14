import path from 'node:path';
import express from 'express';
import { MANAGEMENT_PORT } from './config.js';
import healthRouter     from './routes/health.js';
import containersRouter from './routes/containers.js';
import deployRouter     from './routes/deploy.js';

const app = express();

app.use(express.json());
app.use(express.static(path.resolve('./public')));

app.use(healthRouter);
app.use(containersRouter);
app.use(deployRouter);

export function startManagementServer() {
    app.listen(MANAGEMENT_PORT, () => {
        console.log(`Management server is running on port ${MANAGEMENT_PORT}`);
    });
}