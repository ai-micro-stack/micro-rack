'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('hosts', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        unique: true,
        autoIncrement: true,
      },
      ip: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      host: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      cluster_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      suffix: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      ping: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      ssh: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      cluster_node: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      compute_node: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      compute_role: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      storage_node: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      storage_role: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      balancer_node: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      balancer_role: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      local_storage: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      local_storage_type: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      local_compute_type: {
        type: Sequelize.INTEGER,
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

    await queryInterface.addIndex('hosts', ['ip'], {
      unique: true,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('hosts');
  }
};
