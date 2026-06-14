import docker from './docker.js';
import { NETWORK_NAME, RESOLVE_REVERSE_PROXY } from './config.js';

export async function imageExists(image, tag) {
    const systemImages = await docker.listImages();
    for (const img of systemImages) {
        for (const t of img.RepoTags || []) {
            if (t === `${image}:${tag}`) return true;
        }
    }
    return false;
}

export function pullImage(image, tag, onProgress) {
    return new Promise((resolve, reject) => {
        docker.pull(`${image}:${tag}`, (err, stream) => {
            if (err) return reject(err);
            docker.modem.followProgress(
                stream,
                (err) => { if (err) reject(err); else resolve(); },
                (event) => {
                    const layer  = event.id ? `[${event.id}] ` : '';
                    const detail = event.progressDetail?.total
                        ? ` ${Math.round((event.progressDetail.current / event.progressDetail.total) * 100)}%`
                        : '';
                    onProgress(`${layer}${event.status}${detail}`);
                }
            );
        });
    });
}

export async function deployContainer(image, tag) {
    const container = await docker.createContainer({
        Image: `${image}:${tag}`,
        HostConfig: { AutoRemove: true },
    });
    await container.start();
    const inspect = await container.inspect();

    const network = docker.getNetwork(NETWORK_NAME);
    await network.connect({ Container: inspect.Id });

    const name = inspect.Name.replace(/^\//, '');
    return { name, domain: `${name}.${RESOLVE_REVERSE_PROXY}` };
}

export async function listContainers() {
    return docker.listContainers({ all: true });
}

export async function removeContainer(id) {
    const container = docker.getContainer(id);
    const inspect   = await container.inspect();
    if (inspect.State.Running) await container.stop();
    try { await container.remove({ force: true }); } catch (_) {}
}