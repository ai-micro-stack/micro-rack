'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('clusters', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        unique: true,
        autoIncrement: true,
      },
      plat_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      plat_member: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      plat_core_cluster: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      embedding_member: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      embedding_model: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      vectordb_member: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      vectordb_vendor: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      llm_member: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      llm_model: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },

      // generic info
      subnet_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      cluster_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      cluster_note: {
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

      // load balancer
      balancer_cluster_type: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      balancer_cluster_vip: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      balancer_protocol: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      balancer_port: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      peer_interface: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      peer_pass_secret: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      // compute cluster
      compute_cluster_type: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      compute_cluster_dashboard: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      local_compute_type: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },

      // storage cluster
      storage_cluster_type: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      storage_cluster_share: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      storage_cluster_dashboard: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      local_storage_type: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      local_storage_default: {
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

    await queryInterface.addIndex('clusters', ['subnet_id', 'cluster_name'], {
      unique: true,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('clusters');
  }
};
