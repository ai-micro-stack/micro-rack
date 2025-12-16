// User model is excluded from initial sync process as it is created dynamically on first user registration
require("module-alias/register");
const Plat = require("@models/plat.model");
const Interface = require("@models/interface.model");
const Subnet = require("@models/subnet.model");
const Host = require("@models/host.model");
const Type = require("@models/type.model");
const Pxe = require("@models/pxe.model");
const Cluster = require("@models/cluster.model");
const Task = require("@models/task.model");
const Static = require("@models/static.model");
const Role = require("@models/role.model");
const { Op } = require("sequelize");
const db = require("@database/db").context;
const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const execAsync = promisify(exec);

const StackDatabase = async () => {
  try {
    console.log("Running database migrations...");
    await execAsync('npx sequelize-cli db:migrate', { cwd: path.join(__dirname, '..') });
    console.log("Migrations completed. Seeding data...");

    await Plat.destroy({
      where: {
        id: {
          [Op.ne]: 0,
        },
      },
    });
    console.log("Plat data cleared");

    await Interface.destroy({
      where: {
        id: {
          [Op.ne]: 0,
        },
      },
    });
    console.log("Interface data cleared");

    await Subnet.destroy({
      where: {
        id: {
          [Op.ne]: 0,
        },
      },
    });
    console.log("Subnet data cleared");

    await Pxe.destroy({
      where: {},
    });
    console.log("Pxe data cleared");

    await Cluster.destroy({
      where: {
        id: {
          [Op.ne]: 0,
        },
      },
    });
    console.log("Cluster data cleared");

    await Host.destroy({
      where: {},
      truncate: true,
    });
    console.log("Host data cleared");

    await Type.destroy({
      where: {
        [Op.or]: [
          { id: { [Op.lt]: 1 } },
          { id: { [Op.gt]: 3 } }
        ]
      },
    });
    const expectedTypes = [
      { id: 1, type: "Admin" },
      { id: 2, type: "Master" },
      { id: 3, type: "Worker" },
    ];
    for (const e of expectedTypes) {
      await Type.findCreateFind({
        where: {
          id: e.id,
          type: e.type,
        },
      });
    }
    console.log("Type data seeded");

    await Task.destroy({
      where: {},
      truncate: true,
    });
    console.log("Task data cleared");

    await Static.destroy({
      where: {},
      truncate: true,
    });
    console.log("Static data cleared");

    await Role.destroy({
      where: {
        [Op.or]: [
          { id: { [Op.lt]: 1 } },
          { id: { [Op.gt]: 3 } }
        ]
      },
    });
    const expectedRoles = [
      { id: 1, role: "Admin" },
      { id: 2, role: "User" },
      { id: 3, role: "Viewer" },
      { id: 9, role: "Demo" },
    ];
    for (const e of expectedRoles) {
      await Role.findCreateFind({
        where: { ...e },
      });
    }
    console.log("Role data seeded");

    console.log("Database setup completed");
    return true;
  } catch (error) {
    console.error("Error in StackDatabase:", error);
    return false;
  }
};

const StackRawQuery = async (q, options = {}) => {
  const { results, metadata } = await db.query(q, options);
  return { results, metadata };
};

module.exports = { StackDatabase, StackRawQuery };
