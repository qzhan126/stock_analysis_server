const MLModel = require('../models/MLModel');
const { Op } = require('sequelize');

class MLModelController {
  // 获取模型分类
  static async getModelCategories(req, res) {
    try {
      const categories = await MLModel.findAll({
        where: {
          type: 'category',
          is_show: true
        },
        attributes: ['category', 'id', 'name', 'icon']
      });
      res.json(categories);
    } catch (error) {
      res.status(500).json({
        error: '获取模型分类失败',
        details: error.message
      });
    }
  }

  // 获取推荐模型
  static async getRecommendedModels(req, res) {
    try {
      const models = await MLModel.findAll({
        where: {
          type: 'recommended',
          is_show: true,
          is_recommended: true
        }
      });
      res.json(models);
    } catch (error) {
      res.status(500).json({
        error: '获取推荐模型失败',
        details: error.message
      });
    }
  }

  static async getModels(req, res) {  
    try {  
      const {   
        page = 1,   
        limit = 10,   
        category,   
        difficulty,  
        sortField = 'sort',  
        sortOrder = 'DESC'  
      } = req.query;  

      const pageNum = Number(page);  
      const limitNum = Number(limit);  

      const whereCondition = {  
        is_show: true  
      };  

      if (category) whereCondition.category = category;  
      if (difficulty) whereCondition.difficulty = difficulty;  

      const { count, rows: models } = await MLModel.findAndCountAll({  
        where: whereCondition,  
        limit: limitNum,  
        offset: (pageNum - 1) * limitNum,  
        order: [[sortField, sortOrder]],  
        
      });  

      res.json({  
        total: count,  
        page: pageNum,  
        limit: limitNum,  
        models  
      });  
    } catch (error) {  
      res.status(500).json({  
        error: '获取模型列表失败',  
        details: error.message  
      });  
    }  
  }  

  // 创建模型  
  static async createModel(req, res) {  
    try {  
      const {  
        id,  
        name,  
        englishName, // 新增英文名称  
        icon,  
        description,  
        difficulty,  
        category,  
        type,  
        is_show = true,  
        is_recommended = false,  
        sort = 0, // 新增排序字段  
        details,  
        learningPath,  
        resources,
        code  
      } = req.body;  

      const newModel = await MLModel.create({  
        id,  
        name,  
        englishName, // 添加英文名称  
        icon,  
        description,  
        difficulty,  
        category,  
        type,
        code,  
        is_show,  
        is_recommended,  
        sort, // 添加排序字段  
        details: JSON.stringify(details),  
        learningPath: JSON.stringify(learningPath),  
        resources: JSON.stringify(resources)  
      });  

      res.status(201).json(newModel);  
    } catch (error) {  
      res.status(500).json({  
        error: '创建模型失败',  
        details: error.message  
      });  
    }  
  }  

  // 更新模型  
  static async updateModel(req, res) {  
    try {  
      const { id } = req.params;  
      const updateData = req.body;  

      // 处理 JSON 字段  
      if (updateData.details) {  
        updateData.details = JSON.stringify(updateData.details);  
      }  
      if (updateData.learningPath) {  
        updateData.learningPath = JSON.stringify(updateData.learningPath);  
      }  
      if (updateData.resources) {  
        updateData.resources = JSON.stringify(updateData.resources);  
      }  

      const [updated] = await MLModel.update(updateData, {  
        where: { id }  
      });  

      if (updated) {  
        const updatedModel = await MLModel.findByPk(id);  
        return res.json(updatedModel);  
      }  

      throw new Error('未找到对应模型');  
    } catch (error) {  
      res.status(500).json({  
        error: '更新模型失败',  
        details: error.message  
      });  
    }  
  }  

  // 搜索模型（增加对英文名称的搜索）  
  static async searchModels(req, res) {  
    try {  
      const { query } = req.query;  

      const models = await MLModel.findAll({  
        where: {  
          [Op.or]: [  
            { name: { [Op.like]: `%${query}%` } },  
            { englishName: { [Op.like]: `%${query}%` } },  
            { description: { [Op.like]: `%${query}%` } },  
            { category: { [Op.like]: `%${query}%` } }  
          ],  
          is_show: true  
        },  
        order: [['sort', 'DESC']]  
      });  

      res.json(models);  
    } catch (error) {  
      res.status(500).json({  
        error: '搜索模型失败',  
        details: error.message  
      });  
    }  
  }  

  // 获取模型详情（可以选择是否展开 JSON 字段）  
  static async getModelDetail(req, res) {  
    try {  
      const { id } = req.params;  
      const { expand = true } = req.query;  

      const model = await MLModel.findByPk(id, {  
        attributes: expand   
          ? undefined   
          : { exclude: ['details', 'learningPath', 'resources'] }  
      });  

      if (!model) {  
        return res.status(404).json({ error: '未找到对应模型' });  
      }  

      res.json(model);  
    } catch (error) {  
      res.status(500).json({  
        error: '获取模型详情失败',  
        details: error.message  
      });  
    }  
  }  

  // 删除模型
  static async deleteModel(req, res) {
    try {
      const { id } = req.params;

      const deletedCount = await MLModel.destroy({
        where: { id }
      });

      if (deletedCount > 0) {
        return res.status(204).send();
      }

      throw new Error('未找到对应模型');
    } catch (error) {
      res.status(500).json({
        error: '删除模型失败',
        details: error.message
      });
    }
  }

  // 根据分类获取模型
  static async getModelsByCategory(req, res) {
    try {
      const { category } = req.params;

      const models = await MLModel.findAll({
        where: {
          category,
          is_show: true
        }
      });

      res.json(models);
    } catch (error) {
      res.status(500).json({
        error: '获取分类模型失败',
        details: error.message
      });
    }
  }  
}

module.exports = MLModelController;