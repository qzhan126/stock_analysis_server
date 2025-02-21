const { DataTypes } = require('sequelize');  
const sequelize = require('../config/database');  

const MLModel = sequelize.define('MLModel', {  
  id: {  
    type: DataTypes.STRING,  
    primaryKey: true,  
    unique: true  
  },  
  name: {  
    type: DataTypes.STRING,  
    allowNull: false  
  },  
  englishName: {  
    type: DataTypes.STRING,  
    allowNull: true,  
    comment: '模型的英文名称'  
  },  
  icon: {  
    type: DataTypes.STRING,  
    allowNull: true  
  },  
  category: {  
    type: DataTypes.STRING,  
    allowNull: true  
  },  
  type: {  
    type: DataTypes.STRING,  
    allowNull: true  
  },  
  difficulty: {  
    type: DataTypes.STRING,  
    allowNull: true  
  },  
  description: {  
    type: DataTypes.TEXT,  
    allowNull: true  
  },  
  code: {  
    type: DataTypes.TEXT,  
    allowNull: true  
  },  
  is_show: {  
    type: DataTypes.BOOLEAN,  
    defaultValue: true,  
    allowNull: true  
  },  
  is_recommended: {  
    type: DataTypes.BOOLEAN,  
    defaultValue: false,  
    allowNull: true  
  },  
  sort: {  
    type: DataTypes.INTEGER,  
    allowNull: true,  
    defaultValue: 0,  
    comment: '排序权重，数字越大排序越靠前'  
  },  
  details: {  
    type: DataTypes.JSON,  
    allowNull: true,  
    get() {  
      const rawValue = this.getDataValue('details');  
      return rawValue ? (typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue) : [];  
    },  
    set(value) {  
      this.setDataValue('details', typeof value === 'string' ? value : JSON.stringify(value));  
    }  
  },  
  learningPath: {  
    type: DataTypes.JSON,  
    allowNull: true,  
    get() {  
      const rawValue = this.getDataValue('learningPath');  
      return rawValue ? (typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue) : [];  
    },  
    set(value) {  
      this.setDataValue('learningPath', typeof value === 'string' ? value : JSON.stringify(value));  
    }  
  },  
  resources: {  
    type: DataTypes.JSON,  
    allowNull: true,  
    get() {  
      const rawValue = this.getDataValue('resources');  
      return rawValue ? (typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue) : [];  
    },  
    set(value) {  
      this.setDataValue('resources', typeof value === 'string' ? value : JSON.stringify(value));  
    }  
  }  
}, {  
  tableName: 'machine_learning_models',  
  timestamps: true,  
  defaultScope: {  
    order: [['sort', 'DESC'], ['createdAt', 'DESC']]  
  }  
});  

module.exports = MLModel;