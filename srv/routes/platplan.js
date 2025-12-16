require("module-alias/register");
const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");
const Plat = require("@models/plat.model");
const Cluster = require("@models/cluster.model");
const Host = require("@models/host.model");
const { AddPlat, UpdatePlat, UpdateClusters } = require("@utils/stackResource");
const { defaultPlat } = require("@consts/constant");
const { verifyToken, grantAccess } = require("@middleware/authMiddleware");

Plat.hasMany(Cluster, { foreignKey: "plat_id" });
Cluster.belongsTo(Plat, { foreignKey: "plat_id" });
Cluster.hasMany(Host, { foreignKey: "cluster_id" });
Host.belongsTo(Cluster, { foreignKey: "cluster_id" });

async function setDefault() {
  try {
    const existing = await Plat.findOne({ where: { plat_name: defaultPlat.plat_name } });
    if (!existing) {
      const plat = await Plat.create({ ...defaultPlat, id: 0 });
      console.log("Default plat created:", plat.toJSON());
      await Cluster.update({ plat_id: plat.id }, { where: { plat_id: null } });
    }
  } catch (err) {
    console.log("Error with default plat:", err);
  }
}

router.get(
  "/data",
  verifyToken,
  // grantAccess([1, 2, 3, 9]),
  async (req, res) => {
    await setDefault();
    try {
      const result = await Plat.findAll({
        include: [
          {
            model: Cluster,
            required: false,
            where: {
              [Op.or]: [
                { cluster_name: { [Op.notLike]: "-- available hosts --" } },
                { plat_id: { [Op.is]: null } },
              ],
            },
            include: {
              model: Host,
              attributes: [
                "id",
                "ip",
                "host",
                "compute_node",
                "compute_role",
                "storage_node",
                "storage_role",
                "balancer_node",
                "balancer_role",
              ],
              required: false,
              where: { cluster_node: true },
            },
          },
        ],
      });
      const plats = result.map((p) => {
        const clusters = p.Clusters.map((c) => {
          const compute_nodes = c.Hosts.filter((h) => h.compute_node).length;
          const storage_nodes = c.Hosts.filter((h) => h.storage_node).length;
          const balancer_nodes = c.Hosts.filter(
            (h) => h.balancer_node
          ).length;
          return {
            admin_subnet: c.Subnet?.cidr,
            cluster_id: c.id,
            cluster_name: c.cluster_name,
            cluster_nodes: c.Hosts.length,
            compute_nodes: compute_nodes,
            storage_nodes: storage_nodes,
            balancer_nodes: balancer_nodes,
            plat_member: c.plat_member,
            balancer_cluster_vip: c.balancer_cluster_vip,
            balancer_protocol: c.balancer_protocol,
            balancer_port: c.balancer_port,
            embedding_member: c.embedding_member,
            embedding_model: c.embedding_model,
            vectordb_member: c.vectordb_member,
            vectordb_vendor: c.vectordb_vendor,
            llm_member: c.llm_member,
            llm_model: c.llm_model,
            compute_cluster_type: c.compute_cluster_type,
            storage_cluster_type: c.storage_cluster_type,
            storage_cluster_share: c.storage_cluster_share,
            balancer_cluster_type: c.balancer_cluster_type,
            plat_core_cluster: c.plat_core_cluster,
            Hosts: c.Hosts,
          };
        });
        return {
          ...p.dataValues,
          Clusters: clusters,
        };
      });
      return res.status(200).json(plats);
    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: "Internal server error", details: err.message });
    }
  }
);

router.post("/save", verifyToken, grantAccess([1, 2]), async (req, res) => {
  const { plat_0, plat_id, Clusters } = req.body;
  const Members = Clusters.map((n) => {
    return {
      ...n,
      plat_id: n.plat_member ? plat_id : plat_0,
    };
  });
  try {
    UpdateClusters(Members).then(() => {
      return res.status(200).json({});
    });
  } catch (err) {
    return res.status(500).send(err);
  }
});

router.post("/create", verifyToken, grantAccess([1, 2]), async (req, res) => {
  const { id, selectedCoreCluster, ...plat } = req.body;
  try {
    const result = await AddPlat(plat);
    // Update plat_core_cluster on clusters
    if (selectedCoreCluster) {
      await Cluster.update(
        { plat_id: result.id, plat_core_cluster: true, plat_member: true },
        { where: { cluster_name: selectedCoreCluster } }
      );
    }
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).send(err);
  }
});

router.post("/update", verifyToken, grantAccess([1, 2]), async (req, res) => {
  const { selectedCoreCluster, ...plat } = req.body;
  try {
    const result = await UpdatePlat(plat);
    // Update plat_core_cluster on clusters
    await Cluster.update(
      { plat_core_cluster: false },
      { where: { plat_id: plat.id } }
    );
    // Update plat_member for clusters where none of embedding_member, vectordb_member, or llm_member is true
    await Cluster.update(
      { plat_member: false },
      { where: { plat_id: plat.id, embedding_member: { [Op.ne]: true }, vectordb_member: { [Op.ne]: true }, llm_member: { [Op.ne]: true } } }
    );
    // Clear plat_id for clusters where plat_member is null or false
    await Cluster.update(
      { plat_id: 0 },
      { where: { plat_id: plat.id, plat_member: { [Op.or]: [null, false] } } }
    );
    if (selectedCoreCluster) {
      await Cluster.update(
        { plat_id: plat.id, plat_core_cluster: true, plat_member: true },
        { where: { cluster_name: selectedCoreCluster } }
      );
    }
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).send(err);
  }
});

router.delete("/delete", verifyToken, grantAccess([1, 2]), async (req, res) => {
  const platId = String(req.headers["x-plat-id"]);
  const plat = await Plat.findByPk(platId);
  if (!plat) {
    return res.status(202).json({ message: `Record not found: ${platId}` });
  } else {
    // Reset member clusters' settings
    await Cluster.update(
      { plat_core_cluster: false, plat_member: false, plat_id: 0 },
      { where: { plat_id: platId } }
    );
    await plat
      .destroy()
      .then((result) => {
        return res.status(200).json({
          message: "Record deleted successfully.",
          entity: `${JSON.stringify(result)}`,
        });
      })
      .catch((error) => {
        return res.status(400).json({
          message: `Unable to delete record! ${error}`,
        });
      });
  }
});

module.exports = router;
