const Blog = require('../models/Blog');

// @desc    Create blog post
// @route   POST /api/blog
// @access  Private (Admin only)
const createBlogPost = async (req, res) => {
  try {
    const { title, excerpt, content, category, tags, featuredImage, seoMetadata, isFeatured } = req.body;

    const blog = await Blog.create({
      title,
      excerpt,
      content,
      category,
      tags,
      featuredImage,
      author: req.user._id,
      seoMetadata,
      isFeatured,
      status: 'draft'
    });

    res.status(201).json({
      success: true,
      message: 'Blog post created successfully',
      data: blog
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Publish blog post
// @route   PUT /api/blog/:id/publish
// @access  Private (Admin only)
const publishBlogPost = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    blog.status = 'published';
    blog.publishedAt = Date.now();
    await blog.save();

    res.json({
      success: true,
      message: 'Blog post published successfully',
      data: blog
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all blog posts
// @route   GET /api/blog
// @access  Public
const getBlogPosts = async (req, res) => {
  try {
    const { category, tag, page = 1, limit = 10 } = req.query;
    
    let query = { status: 'published' };
    
    if (category) {
      query.category = category;
    }
    
    if (tag) {
      query.tags = tag;
    }

    const blogs = await Blog.find(query)
      .populate('author', 'name profileImage')
      .select('-content')
      .sort({ publishedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Blog.countDocuments(query);

    res.json({
      success: true,
      data: blogs,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single blog post
// @route   GET /api/blog/:slug
// @access  Public
const getBlogPost = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug, status: 'published' })
      .populate('author', 'name profileImage')
      .populate('comments.user', 'name profileImage');

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    // Increment views
    blog.views += 1;
    await blog.save();

    res.json({
      success: true,
      data: blog
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Add comment to blog post
// @route   POST /api/blog/:id/comments
// @access  Private
const addComment = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    blog.comments.push({
      user: req.user._id,
      content: req.body.content
    });

    await blog.save();
    await blog.populate('comments.user', 'name profileImage');

    res.status(201).json({
      success: true,
      data: blog.comments[blog.comments.length - 1]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Like blog post
// @route   PUT /api/blog/:id/like
// @access  Private
const likeBlogPost = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    const index = blog.likes.indexOf(req.user._id);
    
    if (index > -1) {
      blog.likes.splice(index, 1);
    } else {
      blog.likes.push(req.user._id);
    }

    await blog.save();

    res.json({
      success: true,
      data: { likes: blog.likes.length }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  createBlogPost,
  publishBlogPost,
  getBlogPosts,
  getBlogPost,
  addComment,
  likeBlogPost
};
