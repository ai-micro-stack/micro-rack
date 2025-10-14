import type { RackInterface } from "@/types/Rack";
// import { emptyPxe } from "@/types/Rack";

/* stack utils */

function getActiveSubnets(nicTrees: RackInterface[], nicId: number) {
  let activeNetId = 0;
  for (let i = 0; i < nicTrees[nicId].Subnets.length; i++) {
    if (nicTrees[nicId].Subnets[i].is_active) {
      activeNetId = i;
      break;
    }
  }
  return {
    Subnets: nicTrees[nicId].Subnets,
    subnetId: activeNetId,
  };
}

/* rack utils */

function getActivePxes(
  nicTrees: RackInterface[],
  nicId: number,
  netId: number
) {
  let activePxeId = 0;
  for (let i = 0; i < nicTrees[nicId].Subnets[netId].Pxes.length; i++) {
    if (nicTrees[nicId].Subnets[netId].Pxes[i].is_active) {
      activePxeId = i;
      break;
    }
  }
  return {
    Pxes: nicTrees[nicId].Subnets[netId].Pxes,
    pxeId: activePxeId,
  };
}

function getPxeDetails(
  // useCase: string, //"finder", "planner" or "builder"
  nicTrees: RackInterface[],
  nicId: number,
  netId: number,
  pxeId: number
) {
  const pxeDetails = nicTrees[nicId].Subnets[netId]?.Pxes.map((p) => {
    return { ...p, ISO_UTILS: p.ISO_UTILS.trim() ? p.ISO_UTILS.trim() : "" };
  });
  return pxeDetails && pxeDetails[pxeId] ? pxeDetails[pxeId] : null;
  // return {...pxeDetails, ISO_UTILS: pxeDetails.ISO_UTILS.trim() ? pxeDetails.ISO_UTILS.trim() : utilsList.join(" ")};
}

/* final export */

export { getActiveSubnets, getActivePxes, getPxeDetails };
