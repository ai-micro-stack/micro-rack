require("module-alias/register");
const { DataTypes } = require("sequelize");
const db = require("@database/db").context;

const Resource = db.define(
  "Resource",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    resource: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    tableName: "resources",
  }
);

module.exports = Resource;
