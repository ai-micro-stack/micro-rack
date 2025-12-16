'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('types', [
      { id: 1, type: 'Admin', createdAt: new Date(), updatedAt: new Date() },
      { id: 2, type: 'Master', createdAt: new Date(), updatedAt: new Date() },
      { id: 3, type: 'Worker', createdAt: new Date(), updatedAt: new Date() },
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('types', null, {});
  }
};
