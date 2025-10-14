import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Row, Col, Button, Alert } from "react-bootstrap";
import FloatingLabel from "react-bootstrap/FloatingLabel";
import { useAuth } from "@/components/AuthService";
import Loading from "@/pages/Loading";
import type { RackInterface, RackSubnet } from "@/types/Rack";
import type { PxeType } from "@/types/Rack";
import { unknownNet } from "@/types/Rack";
import { unknownNic, emptyPxe } from "@/types/Rack";
import {
  getPxeDetails,
  getActivePxes,
  getActiveSubnets,
} from "@/utils/activeResource";
import { storeGuiContext, fetchGuiContext } from "@/utils/currentContext";

function RackPlanner() {
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

  const [pxes, setPxes] = useState<PxeType[]>([]);
  const [curPxe, setCurPxe] = useState<PxeType>(emptyPxe);

  const pxeDefaultLoc = ["pxeboot/imgae", "pxeboot/install"];
  const [preOpts, setPreOpts] = useState(pxeDefaultLoc);
  // const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [errMsg, setErrMsg] = useState<string[]>([]);
  const [showAlert, setShowAlert] = useState(false);
  const [bntStatus, setBntStatus] = useState(bntInitState);

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
    [refresh]
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
        setPxeId(null); // activePxes.pxeId
      } else setSubnetId(0);
    },
    // eslint-disable-next-line
    [subnets, subnetId]
  );

  useEffect(
    () => {
      if (pxeId === null || pxes.length > pxeId) {
        const pxeDetails = getPxeDetails(
          nicTrees,
          nicTreeId,
          subnetId,
          pxeId ?? 0
        );
        if (pxeDetails) {
          setCurPxe(pxeDetails);
          setPreOpts([
            `${pxeDetails.pxeRoot}/os-image`,
            `${pxeDetails.pxeRoot}/os-install`,
          ]);
        } else {
          setCurPxe(emptyPxe);
          setPreOpts(pxeDefaultLoc);
          setPxeId(0);
        }
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

  const changeLoc = (targetLoc: string) => {
    setCurPxe({
      ...curPxe,
      pxeAuto: targetLoc,
    });
    chgBntStatus("dirty");
  };

  const lstyle = { margin: 10 };
  const bstyle = { margin: 10, padding: 10, border: "2px solid rgb(0, 0, 0)" };

  return (
    <div>
      <div className="jumbotron">
        <h3 className="text-center">
          <b>PXE Environment Planner</b>
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
          <br />
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
                  // defaultValue={subnets[subnetId].address}
                />
              </Form.Group>
              <Form.Group as={Col}>
                <Form.Label>Pxe Service IP Binding:</Form.Label>
                <Form.Control
                  plaintext
                  readOnly
                  className="square border border-2"
                  defaultValue={curSubnet.cidr}
                  // defaultValue={subnets[subnetId].address}
                />
              </Form.Group>
            </Row>
          </div>
          <br />
          <FloatingLabel style={lstyle} label="">
            <b>DHCP Configuration Options:</b> (*** Auto fill in possible
            values, change them as needed ***)
          </FloatingLabel>
          <div style={bstyle}>
            <Row>
              <Form.Group as={Col}>
                <Form.Label>Net Address:</Form.Label>
                <Form.Control
                  type="input"
                  defaultValue={curSubnet.ip4_netaddress}
                  onChange={(e) => {
                    setCurSubnet({
                      ...curSubnet,
                      ip4_netaddress: e.target.value,
                    });
                    chgBntStatus("dirty");
                  }}
                />
              </Form.Group>
              <Form.Group as={Col}>
                <Form.Label>Net Mask:</Form.Label>
                <Form.Control
                  type="input"
                  defaultValue={curSubnet.netmask}
                  onChange={(e) => {
                    setCurSubnet({
                      ...curSubnet,
                      netmask: e.target.value,
                    });
                    chgBntStatus("dirty");
                  }}
                />
              </Form.Group>
            </Row>
            <Row>
              <Form.Group as={Col}>
                <Form.Label>IP Pool Begin:</Form.Label>
                <Form.Control
                  type="input"
                  defaultValue={curSubnet.ip4_begin}
                  onChange={(e) => {
                    setCurSubnet({
                      ...curSubnet,
                      ip4_begin: e.target.value,
                    });
                    chgBntStatus("dirty");
                  }}
                />
              </Form.Group>
              <Form.Group as={Col}>
                <Form.Label>IP Pool End:</Form.Label>
                <Form.Control
                  type="input"
                  defaultValue={curSubnet.ip4_end}
                  onChange={(e) => {
                    setCurSubnet({
                      ...curSubnet,
                      ip4_end: e.target.value,
                    });
                    chgBntStatus("dirty");
                  }}
                />
              </Form.Group>
            </Row>
            <Row>
              <Form.Group as={Col}>
                <Form.Label>Router/Gateway Address:</Form.Label>
                <Form.Control
                  type="input"
                  defaultValue={curSubnet.ip4_router}
                  onChange={(e) => {
                    setCurSubnet({
                      ...curSubnet,
                      ip4_router: e.target.value,
                    });
                    chgBntStatus("dirty");
                  }}
                />
              </Form.Group>
              <Form.Group as={Col}>
                <Form.Label>Local DNS Server:</Form.Label>
                <Form.Control
                  type="input"
                  defaultValue={curSubnet.ip4_dnslist}
                  onChange={(e) => {
                    setCurSubnet({
                      ...curSubnet,
                      ip4_dnslist: e.target.value,
                    });
                    chgBntStatus("dirty");
                  }}
                />
              </Form.Group>
              <Form.Group as={Col}>
                <Form.Label>Local Domain Name:</Form.Label>
                <Form.Control
                  type="input"
                  defaultValue={curSubnet.ip4_dnsdomain}
                  onChange={(e) => {
                    setCurSubnet({
                      ...curSubnet,
                      ip4_dnsdomain: e.target.value,
                    });
                    chgBntStatus("dirty");
                  }}
                />
              </Form.Group>
            </Row>
          </div>
          <br />
          <FloatingLabel style={lstyle} label="">
            <b>PXE Root & Auto Conf Folder:</b>
          </FloatingLabel>
          <div style={bstyle}>
            <Row>
              <Form.Group as={Col}>
                <Form.Label>PXE Root Folder:</Form.Label>
                <Form.Control
                  type="input"
                  value={curPxe.pxeRoot}
                  onChange={(e) => {
                    setCurPxe({
                      ...curPxe,
                      pxeRoot: e.target.value,
                      imgRoot: `${e.target.value}/os-image`,
                      pxeAuto: `${e.target.value}/os-image`,
                    });
                    setPreOpts([
                      `${e.target.value}/os-image`,
                      `${e.target.value}/os-install`,
                    ]);
                    chgBntStatus("dirty");
                  }}
                />
              </Form.Group>
              <Form.Group as={Col}>
                <Form.Label>
                  OS Auto-setup Conf Folder: (for unattended OS install)
                </Form.Label>
                <Form.Select
                  value={curPxe.pxeAuto}
                  disabled={!curPxe.pxeRoot}
                  onChange={(e) => {
                    e.preventDefault();
                    changeLoc(e.target.value);
                    chgBntStatus("dirty");
                  }}
                >
                  {preOpts.map((pre) => {
                    return (
                      <option
                        key={pre}
                        value={pre}
                        disabled={pre ? false : true}
                      >
                        {pre}
                      </option>
                    );
                  })}
                </Form.Select>
              </Form.Group>
              {/* <Col></Col> */}
            </Row>
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
            className="float-end"
            variant={bntStatus.next ? "outline-secondary" : "outline-primary"}
            style={lstyle}
            disabled={bntStatus.next}
            onClick={(e) => {
              e.preventDefault();
              navigate("/rack-builder");
            }}
          >
            Rack Builder &#9655;&#x25B7;
          </Button>
        </Form>
      </div>
      {spinning && <Loading />}
    </div>
  );
}

export default RackPlanner;
