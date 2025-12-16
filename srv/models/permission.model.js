require("module-alias/register");
const { DataTypes } = require("sequelize");
const db = require("@database/db").context;

const Permission = db.define(
  "Permission",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      unique: true,
      autoIncrement: true,
    },
    resource_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    tableName: "permissions",
    // indexes: [
    //   {
    //     name: "idx_role_resource",
    //     unique: true,
    //     fields: ["role_id", "resource_id"],
    //   },
    // ],
  }
);

module.exports = Permission;
