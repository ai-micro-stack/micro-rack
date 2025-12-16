'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('interfaces', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        unique: true,
        autoIncrement: true,
      },
      nic_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      nic_mac: {
        type: Sequelize.STRING,
        allowNull: false,
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

    await queryInterface.addIndex('interfaces', ['nic_mac', 'nic_name'], {
      unique: true,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('interfaces');
  }
};
