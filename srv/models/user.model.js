require("module-alias/register");
const { DataTypes, Sequelize } = require("sequelize");
const db = require("@database/db").context;

const User = db.define(
  "User",
  {
    uuid: {
      type: DataTypes.TEXT,
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role_id: {
      type: DataTypes.TINYINT,
      allowNull: true,
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    createdDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    fullname: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    tableName: "users",
    // indexes: [
    //   {
    //     name: "idx_username_password",
    //     unique: false,
    //     fields: ["username", "password"],
    //   },
    // ],
  }
);

module.exports = User;
