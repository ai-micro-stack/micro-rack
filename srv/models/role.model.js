require("module-alias/register");
const { DataTypes } = require("sequelize");
const db = require("@database/db").context;

const Role = db.define(
  "Role",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      unique: true,
      autoIncrement: true,
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    tableName: "roles",
  }
);

module.exports = Role;
