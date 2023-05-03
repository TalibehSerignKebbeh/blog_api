const { check, validationResult } = require('express-validator');

function validateBlog() {
  return [
    check('title').notEmpty().withMessage('Title is required'),
    check('content').notEmpty().withMessage('Body is required'),
    check('author').notEmpty().withMessage('Author is required'),   
    // check('category').notEmpty().withMessage('Category is required'),
    check('tags').isArray().withMessage('Tags must be an array'),
    check('published').isBoolean().withMessage('Published must be a boolean'),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
      }
      next();
    },
  ];
}


module.exports={validateBlog}