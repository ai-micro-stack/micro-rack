require("module-alias/register");
const { DataTypes } = require("sequelize");
const db = require("@database/db").context;

const Task = db.define(
  "Task",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      unique: true,
      autoIncrement: true,
    },
    task_time: {
      type: DataTypes.DATE(6),
      allowNull: false,
    },
    task_user: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    task_data: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    task_status: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    tableName: "tasks",
  }
);

module.exports = Task;
