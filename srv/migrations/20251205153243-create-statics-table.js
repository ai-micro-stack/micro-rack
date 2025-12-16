'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('statics', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        unique: true,
        autoIncrement: true,
      },
      subnet_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      mac_address: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      ipv4_address: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      ipv6_address: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      hostname: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      lease_time: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      pingable: {
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
    await queryInterface.dropTable('statics');
  }
};
