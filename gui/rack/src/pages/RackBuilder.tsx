import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Row, Col, Button, Alert } from "react-bootstrap";
// import type { moduleType } from "@/types/Addon";
import type { rackModuleAreas } from "@/types/Rack";
import { rackEmptyAreas } from "@/types/Rack";
import FloatingLabel from "react-bootstrap/FloatingLabel";
import { useAuth } from "@/components/AuthService";
import Loading from "@/pages/Loading";
// import type { PxeOptionsType } from "@/types/Rack";
// import { unknownPxe } from "@/types/Rack";
import type { RackInterface, RackSubnet, PxeType } from "@/types/Rack";
import { unknownNic, unknownNet, emptyPxe, utilsList } from "@/types/Rack";
import {
  getPxeDetails,
  getActivePxes,
  getActiveSubnets,
} from "@/utils/activeResource";
import { storeGuiContext, fetchGuiContext } from "@/utils/currentContext";
import { TerminalModal } from "@/components/WebTerminal";

function RackBuilder() {
  const bntInitState = {
    reset: true,
    save: true,
    apply: true,
    next: false,
  };
  const navigate = useNavigate();
  const { axiosInstance } = useAuth();
  const [curContext, setCurContext] = useState({
    ...fetchGuiContext("rack.context"),
  });
  const [nicTreeId, setNicTreeId] = useState(0);
  const [subnetId, setSubnetId] = useState(0);
  const [pxeId, setPxeId] = useState<number | null>(0);

  const [refresh, setRefresh] = useState(0);
  const [nicTrees, setNicTrees] = useState<RackInterface[]>([unknownNic]);

  const [subnets, setSubnets] = useState<RackSubnet[]>([]);
  const [curSubnet, setCurSubnet] = useState<RackSubnet>(unknownNet);
  const [rackModuleAreas, setRackModuleAreas] =
    useState<rackModuleAreas>(rackEmptyAreas);

  const [pxes, setPxes] = useState<PxeType[]>([]);
  const [curPxe, setCurPxe] = useState<PxeType>(emptyPxe);
  const [isoUtils, setIsoUtils] = useState<string[]>([]);

  // const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [errMsg, setErrMsg] = useState<string[]>([]);
  const [showAlert, setShowAlert] = useState(false);
  const [bntStatus, setBntStatus] = useState(bntInitState);

  const [showTerminal, setShowTerminal] = useState(false);

  useEffect(
    () => {
      axiosInstance
        .get("/rackbuild/modules")
        .then(({ data }) => {
          setRackModuleAreas({ ...data });
        })
        .catch((error) =>
          console.error("Get cluster config data failed ", error)
        );
    },
    // eslint-disable-next-line
    [refresh]
  );

  useEffect(
    () => {
      (() => {
        axiosInstance
          .get("/rackplan/data")
          .then(({ data }) => {
            setNicTrees([unknownNic, ...data.Interfaces]);
            setNicTreeId(curContext.nicTreeId);
          })
          .catch((error) =>
            console.error("Get resource context failed ", error)
          );
      })();
    },
    // eslint-disable-next-line
    [rackModuleAreas]
  );

  useEffect(
    () => {
      if (nicTrees.length > nicTreeId) {
        const activeSubnets = getActiveSubnets(nicTrees, nicTreeId);
        setSubnets(activeSubnets.Subnets);
        setSubnetId(curContext.subnetId);
      } else setNicTreeId(0);
    },
    // eslint-disable-next-line
    [nicTrees, nicTreeId]
  );

  useEffect(
    () => {
      if (subnets.length > subnetId) {
        const activePxes = getActivePxes(nicTrees, nicTreeId, subnetId);
        setCurSubnet(subnets[subnetId]);
        setPxes(activePxes.Pxes);
        // setPxeId(null); // activePxes.pxeId
        setPxeId(curContext.pxeId);
      } else setSubnetId(0);
    },
    // eslint-disable-next-line
    [subnets, subnetId]
  );

  useEffect(
    () => {
      if (pxeId === null || pxes.length > pxeId) {
        setCurContext({ ...curContext, pxeId: 0 });
        setPxeId(0);
        storeGuiContext("rack.context", {
          ...curContext,
          pxeId: 0,
        });
      }
      const pxeDetails = getPxeDetails(
        nicTrees,
        nicTreeId,
        subnetId,
        pxeId === null || pxes.length > pxeId ? 0 : pxeId
      );
      if (pxeDetails) {
        setCurPxe(pxeDetails);
        setIsoUtils(pxeDetails.ISO_UTILS.split(" "));
      } else {
        setCurPxe(emptyPxe);
        setIsoUtils(emptyPxe.ISO_UTILS.split(" "));
        setPxeId(0);
      }
    },
    // eslint-disable-next-line
    [pxes, pxeId]
  );

  const saveConfigs = () => {
    // setLoading(true);
    chgBntStatus("none");
    const newCfg = {
      curInterface: nicTrees[nicTreeId],
      curSubnet,
      curPxe: {
        ...curPxe,
        ISO_UTILS: curPxe.ISO_UTILS === "(None)" ? "" : curPxe.ISO_UTILS,
      },
    };
    axiosInstance
      .post("/rackplan/save", newCfg, {
        headers: {},
      })
      .then(() => {
        chgBntStatus("save");
        setRefresh(refresh + 1);
      })
      .catch((error) => {
        chgBntStatus("dirty");
        setErrMsg([
          error.message,
          error.status === 403
            ? "--- You don't have permission to make this operation."
            : "",
        ]);
        setShowAlert(true);
        console.error("Failed saving config to server: ", error);
      });
    // setLoading(false);
  };

  const applyConfigs = () => {
    // setLoading(true);
    chgBntStatus("none");
    const newCfg = {
      curInterface: nicTrees[nicTreeId],
      curSubnet,
      curPxe: {
        ...curPxe,
        ISO_UTILS: curPxe.ISO_UTILS === "(None)" ? "" : curPxe.ISO_UTILS,
      },
    };
    axiosInstance
      .post("/rackbuild/apply", newCfg, {
        headers: {},
      })
      .then(() => {
        chgBntStatus("apply");
        setRefresh(refresh + 1);
      })
      .then(() => {
        handleTerminalShow();
      })
      .catch((error) => {
        chgBntStatus("save");
        setErrMsg([
          error.message,
          error.status === 403
            ? "--- You don't have permission to make this operation."
            : "",
        ]);
        setShowAlert(true);
        console.error("Failed applying settings to server: ", error);
      });
    // setLoading(false);
  };

  const chgBntStatus = (status: string) => {
    switch (status) {
      case "none":
        setSpinning(true);
        setBntStatus({
          reset: true,
          save: true,
          apply: true,
          next: true,
        });
        break;
      case "reset":
        setSpinning(false);
        setBntStatus(bntInitState);
        break;
      case "save":
        setSpinning(false);
        setBntStatus({
          reset: true,
          save: true,
          apply: false,
          next: true,
        });
        break;
      case "apply":
        setSpinning(false);
        setBntStatus(bntInitState);
        break;
      case "dirty":
      default:
        setSpinning(false);
        setBntStatus({
          reset: false,
          save: false,
          apply: true,
          next: true,
        });
        break;
    }
  };

  const changeNic = (targetNic: number) => {
    if (nicTrees[targetNic].Subnets[0].family.toLowerCase() === "ipv6") {
      alert(
        "The Interface is configured with IPv6. this version does not support the IPv6 yet."
      );
    } else {
      setCurContext({ ...curContext, nicTreeId: targetNic });
      storeGuiContext("rack.context", { ...curContext, nicTreeId: targetNic });
      setNicTreeId(targetNic);
      chgBntStatus("dirty");
    }
  };

  const handleTerminalShow = () => {
    setShowTerminal(true);
  };
  const handleTerminalClose = () => {
    setShowTerminal(false);
  };

  const lstyle = { margin: 15 };
  const bstyle = { margin: 10, padding: 10, border: "2px solid rgb(0, 0, 0)" };

  return (
    <div>
      <div className="jumbotron">
        <h3 className="text-center">
          <b>PXE Environment Builder</b>
        </h3>
        <Form>
          {/* ALert */}
          {showAlert ? (
            <Alert
              className="mb-2"
              variant="danger"
              onClose={() => setShowAlert(false)}
              dismissible
            >
              {errMsg?.join(" ") ?? "An unknown error."}
            </Alert>
          ) : (
            <div />
          )}
          <FloatingLabel style={lstyle} label="">
            <b>Network Interface Assignment:</b>
          </FloatingLabel>
          <div style={bstyle}>
            <Row>
              <Form.Group as={Col}>
                <Form.Label>Network Interface Binding:</Form.Label>
                <Form.Select
                  value={nicTreeId}
                  onChange={(e) => {
                    e.preventDefault();
                    changeNic(Number(e.target.value));
                    chgBntStatus("dirty");
                  }}
                >
                  {nicTrees.map((nic, id) => {
                    return (
                      <option
                        key={nic.nic_name}
                        value={id}
                        disabled={id ? false : true}
                      >
                        {nic.nic_name}
                      </option>
                    );
                  })}
                </Form.Select>
              </Form.Group>
              <Form.Group as={Col}>
                <Form.Label>Interface Mac IP Address:</Form.Label>
                <Form.Control
                  plaintext
                  readOnly
                  className="square border border-2"
                  defaultValue={curSubnet.mac}
                />
              </Form.Group>
              <Form.Group as={Col}>
                <Form.Label>Pxe Service IP Binding:</Form.Label>
                <Form.Control
                  plaintext
                  readOnly
                  className="square border border-2"
                  defaultValue={curSubnet.cidr}
                />
              </Form.Group>
            </Row>
          </div>
          <FloatingLabel style={lstyle} label="">
            <b>Local Network Services:</b>
          </FloatingLabel>
          <div style={bstyle}>
            <Row>
              <Form.Group as={Col}>
                <Form.Label>DHCP Server: (UDP-67)</Form.Label>
                <Form.Select
                  value={curPxe.DHCP_SERVER}
                  onChange={(e) => {
                    setCurPxe({
                      ...curPxe,
                      DHCP_SERVER: e.target.value,
                      DHCP_PROXY:
                        e.target.value === "dnsmasq" &&
                        curPxe.DHCP_PROXY === "dnsmasq"
                          ? "(None)"
                          : curPxe.DHCP_PROXY,
                    });
                    chgBntStatus("dirty");
                  }}
                >
                  {rackModuleAreas.dhcpModules.map((pxe) => {
                    return (
                      <option
                        key={pxe.moduleName}
                        value={pxe.moduleName}
                        disabled={
                          pxe.moduleStatus > 0 || pxe.moduleName === "(None)"
                            ? false
                            : true
                        }
                      >
                        {pxe.moduleName}
                      </option>
                    );
                  })}
                </Form.Select>
              </Form.Group>
              <Form.Group as={Col}>
                <Form.Label>DHCP Proxy: (UDP-67)</Form.Label>
                <Form.Select
                  value={curPxe.DHCP_PROXY}
                  onChange={(e) => {
                    setCurPxe({
                      ...curPxe,
                      DHCP_PROXY:
                        e.target.value === "dnsmasq" &&
                        curPxe.DHCP_SERVER === "dnsmasq"
                          ? "(None)"
                          : e.target.value,
                    });
                    chgBntStatus("dirty");
                  }}
                >
                  {rackModuleAreas.proxyModules.map((pxe) => {
                    return (
                      <option
                        key={pxe.moduleName}
                        value={pxe.moduleName}
                        disabled={
                          pxe.moduleStatus > 0 || pxe.moduleName === "(None)"
                            ? false
                            : true
                        }
                      >
                        {pxe.moduleName}
                      </option>
                    );
                  })}
                </Form.Select>
              </Form.Group>
            </Row>
            <Row>
              <Form.Group as={Col}>
                <Form.Label>DNS Server: (TCP/UDP-53)</Form.Label>
                <Form.Select
                  value={curPxe.DNS_SERVER}
                  onChange={(e) => {
                    setCurPxe({
                      ...curPxe,
                      DNS_SERVER: e.target.value,
                    });
                    chgBntStatus("dirty");
                  }}
                >
                  {rackModuleAreas.dnsModules.map((pxe) => {
                    return (
                      <option
                        key={pxe.moduleName}
                        value={pxe.moduleName}
                        disabled={
                          pxe.moduleStatus > 0 || pxe.moduleName === "(None)"
                            ? false
                            : true
                        }
                      >
                        {pxe.moduleName}
                      </option>
                    );
                  })}
                </Form.Select>
              </Form.Group>
              <Form.Group as={Col}>
                <Form.Label>NTP Server: (UDP-123)</Form.Label>
                <Form.Select
                  value={curPxe.NTP_SERVER}
                  onChange={(e) => {
                    setCurPxe({
                      ...curPxe,
                      NTP_SERVER: e.target.value,
                    });
                    chgBntStatus("dirty");
                  }}
                >
                  {rackModuleAreas.ntpModules.map((pxe) => {
                    return (
                      <option
                        key={pxe.moduleName}
                        value={pxe.moduleName}
                        disabled={
                          pxe.moduleStatus > 0 || pxe.moduleName === "(None)"
                            ? false
                            : true
                        }
                      >
                        {pxe.moduleName}
                      </option>
                    );
                  })}
                </Form.Select>
              </Form.Group>
            </Row>
          </div>
          <FloatingLabel style={lstyle} label="">
            <b>PXE Boot & OS Image Server:</b>
          </FloatingLabel>
          <div style={bstyle}>
            <Row>
              <Form.Group as={Col}>
                <Form.Label>
                  PXE Boot Loader: (TFTP &rarr; Image_Server)
                </Form.Label>
                <Form.Select
                  value={curPxe.pxe_type}
                  onChange={(e) => {
                    setCurPxe({
                      ...curPxe,
                      pxe_type: e.target.value,
                    });
                    chgBntStatus("dirty");
                  }}
                >
                  {rackModuleAreas.pxeModules.map((pxe) => {
                    return (
                      <option
                        key={pxe.moduleName}
                        value={pxe.moduleName}
                        disabled={pxe.moduleStatus > 0 ? false : true}
                      >
                        {pxe.moduleName}
                      </option>
                    );
                  })}
                </Form.Select>
              </Form.Group>
              <Form.Group as={Col}>
                <Form.Label>OS Image TFTP Server: (UDP-69)</Form.Label>
                <Form.Select
                  value={curPxe.TFTP_SERVER}
                  onChange={(e) => {
                    setCurPxe({
                      ...curPxe,
                      TFTP_SERVER: e.target.value,
                    });
                    chgBntStatus("dirty");
                  }}
                >
                  {rackModuleAreas.tftpModules.map((pxe) => {
                    return (
                      <option
                        key={pxe.moduleName}
                        value={pxe.moduleName}
                        disabled={pxe.moduleStatus > 0 ? false : true}
                      >
                        {pxe.moduleName}
                      </option>
                    );
                  })}
                </Form.Select>
              </Form.Group>
            </Row>
            <Row>
              <Form.Group as={Col}>
                <Form.Label>OS Image HTTP Server: (TCP-80/443)</Form.Label>
                <Form.Select
                  value={curPxe.HTTP_SERVER}
                  onChange={(e) => {
                    setCurPxe({
                      ...curPxe,
                      HTTP_SERVER: e.target.value,
                    });
                    chgBntStatus("dirty");
                  }}
                >
                  {rackModuleAreas.httpModules.map((pxe) => {
                    return (
                      <option
                        key={pxe.moduleName}
                        value={pxe.moduleName}
                        disabled={
                          pxe.moduleStatus > 0 || pxe.moduleName === "(None)"
                            ? false
                            : true
                        }
                      >
                        {pxe.moduleName}
                      </option>
                    );
                  })}
                </Form.Select>
              </Form.Group>
              <Form.Group as={Col}>
                <Form.Label>OS Image NFS Server: (TCP-2049)</Form.Label>
                <Form.Select
                  value={curPxe.NFS_SERVER}
                  onChange={(e) => {
                    setCurPxe({
                      ...curPxe,
                      NFS_SERVER: e.target.value,
                    });
                    chgBntStatus("dirty");
                  }}
                >
                  {rackModuleAreas.nfsModules.map((pxe) => {
                    return (
                      <option
                        key={pxe.moduleName}
                        value={pxe.moduleName}
                        disabled={
                          pxe.moduleStatus > 0 || pxe.moduleName === "(None)"
                            ? false
                            : true
                        }
                      >
                        {pxe.moduleName}
                      </option>
                    );
                  })}
                </Form.Select>
              </Form.Group>
            </Row>
          </div>
          <FloatingLabel style={lstyle} label="">
            <b>Dependent Software Packages:</b>
          </FloatingLabel>
          <div style={bstyle}>
            {/* <Form.Check
              inline
              type="checkbox"
              label="iSCSI Server"
              defaultChecked={curPxe.iSCSI_SERVER}
              disabled
            />
            <Form.Check
              inline
              type="checkbox"
              label="SMB Server"
              defaultChecked={curPxe.SMB_SERVER}
              disabled
            /> */}
            {utilsList.map((u) => {
              return (
                curPxe.ISO_UTILS !== "(None)" && (
                  <Form.Check
                    key={u}
                    inline
                    type="checkbox"
                    label={u}
                    defaultChecked={isoUtils.includes(u)}
                    // disabled
                    onChange={(e) => {
                      const utils_new = isoUtils.filter((v) => v !== u);
                      if (e.target.checked) {
                        utils_new.push(u);
                      }
                      setIsoUtils([...utils_new]);
                      setCurPxe({
                        ...curPxe,
                        ISO_UTILS: utils_new.join(" ").trim(),
                      });
                      chgBntStatus("dirty");
                    }}
                  />
                )
              );
            })}
          </div>
          <Button
            variant={bntStatus.reset ? "secondary" : "primary"}
            style={lstyle}
            disabled={bntStatus.reset}
            onClick={(e) => {
              e.preventDefault();
              if (!bntStatus.reset) {
                setRefresh(refresh + 1);
              }
              chgBntStatus("reset");
            }}
          >
            Reset
          </Button>
          <Button
            variant={bntStatus.save ? "secondary" : "primary"}
            style={lstyle}
            disabled={bntStatus.save}
            onClick={(e) => {
              e.preventDefault();
              if (!bntStatus.save) {
                saveConfigs();
              }
            }}
          >
            Save
          </Button>
          <Button
            variant={bntStatus.apply ? "secondary" : "primary"}
            style={lstyle}
            disabled={bntStatus.apply}
            onClick={(e) => {
              e.preventDefault();
              if (!bntStatus.apply) {
                applyConfigs();
              }
            }}
          >
            Apply
          </Button>
          <Button
            className="float-end"
            variant={bntStatus.next ? "outline-secondary" : "outline-primary"}
            style={lstyle}
            disabled={bntStatus.next}
            onClick={(e) => {
              e.preventDefault();
              navigate("/rack-service");
            }}
          >
            Rack Service &#9655;&#x25B7;
          </Button>
          <Button
            className="float-end"
            variant={bntStatus.next ? "outline-secondary" : "outline-primary"}
            style={lstyle}
            disabled={bntStatus.next}
            onClick={(e) => {
              e.preventDefault();
              navigate("/rack-planner");
            }}
          >
            &#9665;&#x25C1; Rack Planner
          </Button>
        </Form>
      </div>
      {spinning && <Loading />}
      <TerminalModal
        showTerminal={showTerminal}
        handleTerminalClose={handleTerminalClose}
      />
    </div>
  );
}

export default RackBuilder;
