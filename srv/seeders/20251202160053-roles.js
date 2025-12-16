'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('roles', [
      { id: 1, role: 'Admin', createdAt: new Date(), updatedAt: new Date() },
      { id: 2, role: 'User', createdAt: new Date(), updatedAt: new Date() },
      { id: 3, role: 'Viewer', createdAt: new Date(), updatedAt: new Date() },
      { id: 9, role: 'Demo', createdAt: new Date(), updatedAt: new Date() },
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('roles', null, {});
  }
};
