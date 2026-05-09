import Router from 'express';
const router = Router();
import {createPost, deletePost, getAllPosts, getPostById} from '../controllers/post.controller.js';
import { authenticateRequest } from '../middleware/auth.middleware.js';

// middleware to authenticate requests
router.use(authenticateRequest);

// route to create a new post
router.post('/create-post', createPost);

//route to get all posts
router.get('/get-posts', getAllPosts);

// route to get a post by id
router.get('/:id', getPostById)

// route to delete a post
router.delete('/:id', deletePost)


export default router;
