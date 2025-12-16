'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // await queryInterface.createTable('permissions', {
    //   id: {
    //     type: Sequelize.INTEGER,
    //     primaryKey: true,
    //     allowNull: false,
    //     unique: true,
    //     autoIncrement: true,
    //   },
    //   resource_id: {
    //     type: Sequelize.INTEGER,
    //     allowNull: false,
    //   },
    //   role_id: {
    //     type: Sequelize.INTEGER,
    //     allowNull: false,
    //   },
    //   createdAt: {
    //     allowNull: false,
    //     type: Sequelize.DATE
    //   },
    //   updatedAt: {
    //     allowNull: false,
    //     type: Sequelize.DATE
    //   },
    // });
  },

  async down (queryInterface, Sequelize) {
    // await queryInterface.dropTable('permissions');
  }
};
