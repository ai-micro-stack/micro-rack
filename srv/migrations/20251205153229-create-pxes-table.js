'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('pxes', {
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
      pxe_type: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      pxeRoot: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      imgRoot: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      pxeAuto: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      TFTP_SERVER: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      HTTP_SERVER: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      NFS_SERVER: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      iSCSI_SERVER: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      SMB_SERVER: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      DHCP_PROXY: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      DHCP_SERVER: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      DNS_SERVER: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      NTP_SERVER: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      ISO_UTILS: {
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
    await queryInterface.dropTable('pxes');
  }
};
