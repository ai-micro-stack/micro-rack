'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('subnets', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        unique: true,
        autoIncrement: true,
      },
      interface_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      address: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      netmask: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      family: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      mac: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      internal: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      cidr: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      scopeid: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      ip4_class: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      ip4_netaddress: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      ip4_begin: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      ip4_end: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      ip4_router: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      ip4_dnslist: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      ip4_dnsdomain: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      prefix: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
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
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('subnets');
  }
};
