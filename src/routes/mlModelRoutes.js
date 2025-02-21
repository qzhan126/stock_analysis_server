const express = require('express');
const MLModelController = require('../controllers/mlModelController');

const router = express.Router();

// 获取模型分类
router.get('/categories', MLModelController.getModelCategories);

// 获取推荐模型
router.get('/recommended', MLModelController.getRecommendedModels);

// 获取所有模型
router.get('/models', MLModelController.getModels);

// 根据分类获取模型
router.get('/category/:category', MLModelController.getModelsByCategory);

// 搜索模型
router.get('/search', MLModelController.searchModels);

// 创建模型
router.post('/models', MLModelController.createModel);

// 更新模型
router.put('/models/:id', MLModelController.updateModel);

// 删除模型
router.delete('/models/:id', MLModelController.deleteModel);

router.get('/models/:id', MLModelController.getModelDetail)  

module.exports = router;