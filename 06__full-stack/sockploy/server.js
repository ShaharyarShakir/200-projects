import express from 'express';
import Docker from 'dockerode';

const docker = new Docker();

function pullImage(image, tag) {
    return new Promise((resolve, reject) => {
        docker.pull(`${image}`,{tag},err => {
            if(err) {
                reject(err);
            } else {
              return  resolve(true);
            }
        })
    })
}

const managementApp = express();

managementApp.use(express.json());

const MANAGEMENT_PORT = process.env.MANAGEMENT_PORT ?? 8080;
const RESOLVE_REVERSE_PROXY = process.env.RESOLVE_REVERSE_PROXY ?? 'localhost';


managementApp.get('/health', (req, res) => {
    res.status(200).send('OK! container is running and ready to serve requests');
});

managementApp.post('/container', async(req, res) => {
    const {image, tag} =  req.body
    const systemImages = await docker.listImages()
    const existingImage = false;
    for (const systemImage of systemImages) {
        for(const systemTag of systemImage.RepoTags) {
            if(systemTag === `${image}:${tag}`) {
                existingImage = true;
                break;
            }
            if(existingImage) break;
        }
        if(!existingImage){
            await pullImage(image, tag);
        }
        const container = await docker.createContainer({
            Image: `${image}:${tag}`,
            HostConfig: {
                AutoRemove: true,
            }

        })
        await container.start();
        const inspect = await container.inspect();
        return res.json({
            status: 'success',
            data: {
                containerName: inspect.Name,
                domain: `${inspect.Name}.${RESOLVE_REVERSE_PROXY}`
            }
        })
    }
})

managementApp.listen(MANAGEMENT_PORT, () => {
    console.log(`Management server is running on port ${MANAGEMENT_PORT}`);
});