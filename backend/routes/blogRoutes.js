const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createBlogPost,
  publishBlogPost,
  getBlogPosts,
  getBlogPost,
  addComment,
  likeBlogPost
} = require('../controllers/blogController');

router.post('/', protect, createBlogPost);
router.put('/:id/publish', protect, publishBlogPost);
router.get('/', getBlogPosts);
router.get('/:slug', getBlogPost);
router.post('/:id/comments', protect, addComment);
router.put('/:id/like', protect, likeBlogPost);

module.exports = router;
