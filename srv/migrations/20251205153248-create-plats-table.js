'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('plats', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        unique: true,
        autoIncrement: true,
      },
      plat_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      plat_note: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      plat_type: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      plat_vip: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      is_locked: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      build_auto_lock: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      core_gateway_service: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      core_auth_ima_service: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      embedding_model_server: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      embedding_model_store: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      llm_model_server: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      llm_model_store: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      vectordb_data_server: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      vectordb_data_store: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
    });

    await queryInterface.addIndex('plats', ['plat_name'], {
      unique: true,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('plats');
  }
};
