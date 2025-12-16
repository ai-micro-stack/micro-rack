require("module-alias/register");
const { DataTypes } = require("sequelize");
const db = require("@database/db").context;

const Type = db.define(
  "Type",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      unique: true,
      autoIncrement: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    tableName: "types",
  }
);

module.exports = Type;
