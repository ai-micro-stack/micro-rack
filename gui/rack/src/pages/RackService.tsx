import { useEffect, useState, createRef } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Table, Button, Alert } from "react-bootstrap";
import { useAuth } from "@/components/AuthService";
import Loading from "@/pages/Loading";

function RackService() {
  const bntInitState = {
    refesh: false,
    prev: false,
    next: false,
  };
  interface Tuple {
    server: {
      service: string;
      protocol: string;
      port: string;
      provider: string;
      status: string;
      color: string;
      nodeRef: React.ReactNode;
    };
  }

  const navigate = useNavigate();
  const { axiosInstance } = useAuth();
  const [serviceStatus, setServiceStatus] = useState([]);
  const [spinning, setSpinning] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [errMsg, setErrMsg] = useState<string[]>([]);
  const [showAlert, setShowAlert] = useState(false);
  const [bntStatus, setBntStatus] = useState(bntInitState);

  useEffect(
    () => {
      chgBntStatus("dirty");
      let serverState = [];
      axiosInstance
        .get("/rackservice/state")
        .then(({ data }) => {
          serverState = data.map(
            (tuple: {
              service: string;
              protocol: string;
              port: string;
              provider: string;
              pingable: boolean;
              // status?: string;
            }) => {
              return {
                server: {
                  service: tuple.service,
                  protocol: tuple.protocol,
                  port: tuple.port,
                  provider: tuple.provider,
                  status: tuple.pingable ? "✓ (Running)" : "(Not found)",
                  color: tuple.pingable ? "text-success" : "text-danger",
                  nodeRef: tuple.provider ? createRef() : null,
                },
              };
            }
          );
          setServiceStatus(serverState);
          chgBntStatus("refresh");
        })
        .catch((error) => {
          chgBntStatus("refresh");
          console.error("Get Rack Service failed ", error);
        });
    },
    // eslint-disable-next-line
    [refresh]
  );

  const chgBntStatus = (status: string) => {
    switch (status) {
      case "none":
        setSpinning(false);
        setBntStatus({
          refesh: false,
          prev: false,
          next: false,
        });
        break;
      case "refresh":
        setSpinning(false);
        setBntStatus({
          refesh: false,
          prev: false,
          next: false,
        });
        break;
      case "dirty":
      default:
        setSpinning(true);
        setBntStatus({
          refesh: true,
          prev: true,
          next: true,
        });
        break;
    }
  };

  const lstyle = { margin: 10 };
  const bstyle = { padding: 20 };
  return (
    <div>
      <h3 className="text-center" style={lstyle}>
        <b>PXE Service Status</b>
      </h3>
      {showAlert && (
        <Alert
          className="mb-2"
          variant="danger"
          onClose={() => setShowAlert(false)}
          dismissible
        >
          {errMsg?.join(" ") ?? "An unknown error."}
        </Alert>
      )}
      <div className="table" style={bstyle}>
        <Table striped bordered hover>
          <thead className="text-center align-middle">
            <tr>
              <th>
                <b>Service Name</b>
              </th>
              <th>
                <b>Service Protocol</b>
              </th>
              <th>
                <b>Service Port</b>
              </th>
              <th>
                <b>Service Provider</b>
              </th>
              <th>
                <b>Service Status</b>
              </th>
            </tr>
          </thead>
          <tbody>
            {serviceStatus.map((tuple: Tuple) => {
              const { server } = tuple;
              return (
                <tr key={server.service} className="text-center">
                  <td>{server.service}</td>
                  <td>{server.protocol}</td>
                  <td>{server.port}</td>
                  <td>{server.provider}</td>
                  <td className={server.color}>{server.status}</td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>
      <div className="jumbotron">
        {/* fixed-bottom */}
        <Form>
          <Button
            style={lstyle}
            variant={bntStatus.refesh ? "secondary" : "primary"}
            disabled={bntStatus.refesh}
            onClick={(e) => {
              e.preventDefault();
              setRefresh(refresh + 1);
              setErrMsg([]);
            }}
          >
            Refresh Status
          </Button>
          <Button
            className="float-end"
            style={lstyle}
            variant={bntStatus.next ? "outline-secondary" : "outline-primary"}
            disabled={bntStatus.next}
            onClick={(e) => {
              e.preventDefault();
              navigate("/os-upload");
            }}
          >
            OS Upload &#9655;&#x25B7;
          </Button>
          <Button
            className="float-end"
            style={lstyle}
            variant={bntStatus.prev ? "outline-secondary" : "outline-primary"}
            disabled={bntStatus.prev}
            onClick={(e) => {
              e.preventDefault();
              navigate("/rack-builder");
            }}
          >
            &#9665;&#x25C1; Rack Builder
          </Button>
        </Form>
      </div>
      {spinning && <Loading />}
    </div>
  );
}

export default RackService;
