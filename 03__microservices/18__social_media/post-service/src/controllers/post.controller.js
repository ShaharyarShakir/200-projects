import Post from '../models/post.model.js';
import logger from '../utils/logger.util.js';
import { publishEvent } from '../utils/rabbitmq.util.js';
import { validateCreatePost } from '../utils/validate.util.js';
const inValidatePostCache = async (req, input) => {
    const cachedKey = `post:${input}`
    await req.redisClient.del(cachedKey);
    const keys = await req.redisClient.keys('posts:*');
    if(keys.lenght > 0){
        await req.redisClient.del(keys);
    }
}

export const createPost = async (req, res) => {
    logger.info(`Creating post for user: ${req.user.userId}`);
    try {
        const {error} = validateCreatePost(req.body);
        if(error){
            logger.warn(`Validation error: ${error.details[0].message}`);
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }
        const {content, mediaIds} = req.body;
        const newPost = new Post({
            user: req.user.userId,
            content,
            mediaIds: mediaIds || []
        });
        await newPost.save();
        await publishEvent('post.created', {
            postId: newPost._id.toString(),
            userId: newPost.user.toString(),
            content: newPost.content,
            createdAt: newPost.createdAt
        })

        await inValidatePostCache(req, newPost._id.toString());
        logger.info(`Post created with ID: ${newPost._id} by User: ${req.user.userId}`);
        res.status(201).json({
            success: true,
            message: 'Post created successfully',
            postId: newPost._id
        });

    } catch (e) {
        logger.error('Error creating post:', e);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error' });
    }
}
export const getAllPosts = async (req, res) => {
    try {const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const startIndex = (page - 1) * limit;
        const cacheKey = `posts:${page}:${limit}`;
        const cachePosts = await req.redisClient.get(cacheKey)
        if(!cachePosts){
            const posts = await Post.find({}).sort({createdAt: -1}).skip(startIndex).limit(limit);
            const totalPosts = await Post.countDocuments();
            const totalPages = Math.ceil(totalPosts / limit);
            const result = {
                posts,
                currentPage: page,
                totalPages: totalPages,
                totalPosts: totalPosts
            }
// save post in redis client
            await req.redisClient.setex(cacheKey, 3600, JSON.stringify(result))
            logger.info(`Posts retrieved from database and cached for 1 hour`);
            return res.json(result)
        }

        return res.json(JSON.parse(cachePosts))


    } catch (e) {
        logger.error('Error getting all posts:', e);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error' });
    }
}

export const getPostById = async (req, res) => {
try {
     const postId = req.params.postId;
       const cacheKey = `post:${postId}`;
        const cachedPost  = await req.redisClient.get(cacheKey)
if(cachedPost){
    return res.json(JSON.parse(cachedPost))
}
const postById = await Post.findById(postId);
if(!postById){
    return res.status(404).json({
        success: false,
        message: 'Post not found'
    });
}
await req.redisClient.setex(cacheKey, 3600, JSON.stringify(postById)
)
logger.info(`Post retrieved from database and cached for 1 hour`);
return res.json(postById)

} catch (e) {
logger.error('Error getting post by ID:', e);
res.status(500).json({
    success: false,
    message: 'Internal Server Error' });
}

}

export const deletePost = async (req, res) => {
    try{
        const post = await Post.findByIdAndDelete({
            _id: req.params.id,
            user: req.user.userId
        })
        if(!post){
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }
        // publish post delete event
        await publishEvent('post.delete', {
            postId: post._id.toString(),
            userId: req.user.userId,
            mediaIds: post.mediaIds
        })
        await inValidatePostCache(req, req.params.id)
        res.json({
            message: "Post deleted successfully"
        })
    } catch (e) {
        logger.error('Error deleting post:', e);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error' });
    }
}
