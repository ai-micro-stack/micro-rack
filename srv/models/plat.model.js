require("module-alias/register");
const { DataTypes } = require("sequelize");
const db = require("@database/db").context;

const Plat = db.define(
  "Plat",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      unique: true,
      autoIncrement: true,
    },

    // generic info
    plat_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    plat_note: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    plat_type: {
      type: DataTypes.NUMBER,
      allowNull: true,
    },
    plat_vip: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    is_locked: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    build_auto_lock: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },

    core_gateway_service: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    core_auth_ima_service: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // detail conf
    embedding_model_server: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    embedding_model_store: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    llm_model_server: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    llm_model_store: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    vectordb_data_server: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    vectordb_data_store: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    indexes: [
      {
        unique: true,
        fields: ["plat_name"],
      },
    ],
  },
  {
    timestamps: true,
    tableName: "plats",
  }
);

module.exports = Plat;
