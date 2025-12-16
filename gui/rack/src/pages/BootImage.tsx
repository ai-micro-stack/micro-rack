import { useEffect, useState, createRef } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Table, Button, ToggleButton, Alert } from "react-bootstrap";
import { useAuth } from "@/components/AuthService";
import Loading from "@/pages/Loading";
import FileUploader, { FileDownloader } from "@/components/FileUploader";
import type { FileChange, FileChanges } from "@/types/Event";
import fileNameParser from "@/utils/fileNameParser";

import { TerminalModal } from "@/components/WebTerminal";

const uploadChannel = "plgUpload";
const allowedTypes: string[] = ["plg"];

function BootImage() {
  const bntInitState = {
    mount: false,
    remount: false,
    menu: true,
    prev: false,
    next: false,
  };
  type TrackerEvent = { [key: string]: string };
  type TrackerEvents = { [key: string]: TrackerEvent[] };
  const navigate = useNavigate();
  const { axiosInstance } = useAuth();
  const [isoTuples, setIsoTuples] = useState([]);
  const [changeTracker, setChangeTracker] = useState({});
  const [refresh, setRefresh] = useState(0);
  const [fileChangeEvent, setFileChangeEvent] = useState({
    file: "",
    change: "",
  });
  const [menuDefault, setMenuDefault] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [errMsg, setErrMsg] = useState<string[]>([]);
  const [showAlert, setShowAlert] = useState(false);
  const [bntStatus, setBntStatus] = useState(bntInitState);

  const [showTerminal, setShowTerminal] = useState(false);

  interface Tuple {
    os: { osName: string; nodeRef: React.ReactNode };
    plg: { file: string; nodeRef: React.ReactNode };
    iso: { file: string; nodeRef: React.ReactNode };
    zip: { file: string; nodeRef: React.ReactNode };
    img: { exists: boolean; nodeRef: React.ReactNode };
    menu: { exists: boolean; nodeRef: React.ReactNode };
  }

  useEffect(
    () => {
      setChangeTracker(
        JSON.parse(localStorage.getItem(`${uploadChannel}`) ?? "{}")
      );
      getIsoFiles();
      eventAggregator(fileChangeEvent);
    },
    // eslint-disable-next-line
    [refresh, fileChangeEvent]
  );

  const eventAggregator = (change: FileChange) => {
    if (!change.file) {
      return;
    }
    const tracker: TrackerEvents = { ...changeTracker };
    const fileParts = fileNameParser(change.file);
    const eventName: string = fileParts.name;
    const fileEvent = { [fileParts.ext]: change.change };
    const existedEvents = tracker[eventName] || [];
    const updatedEvents: TrackerEvent[] = [...existedEvents, fileEvent];
    tracker[eventName] = updatedEvents;
    setChangeTracker(tracker);
    localStorage.setItem(`${uploadChannel}`, JSON.stringify(tracker));
    chgBntStatus("dirty");
  };

  const chgBntStatus = (status: string) => {
    switch (status) {
      case "none":
        setSpinning(true);
        setBntStatus({
          mount: true,
          remount: true,
          menu: true,
          prev: true,
          next: true,
        });
        break;
      case "mount":
        setSpinning(false);
        setBntStatus({
          mount: true,
          remount: false,
          menu: false,
          prev: true,
          next: true,
        });
        break;
      case "remount":
        setSpinning(false);
        setBntStatus({
          mount: true,
          remount: true,
          menu: false,
          prev: true,
          next: true,
        });
        break;
      case "menu":
        setSpinning(false);
        setBntStatus({
          mount: true,
          remount: true,
          menu: true,
          prev: false,
          next: false,
        });
        break;
      case "dirty":
      default:
        setSpinning(false);
        setBntStatus({
          mount: false,
          remount: false,
          menu: true,
          prev: true,
          next: true,
        });
        break;
    }
  };

  const getIsoFiles = () => {
    let isosInStore = [];
    axiosInstance
      .get("/rackcontext/files")
      .then(({ data }) => {
        isosInStore = data.pxeContext.map(
          (tuple: {
            osName: string;
            plgExists: boolean;
            isoExists: boolean;
            zipExists: boolean;
            imgExists: boolean;
            mnuExists: boolean;
          }) => {
            return {
              os: {
                osName: tuple.osName,
                nodeRef: createRef(),
              },
              iso: {
                file: tuple.isoExists ? tuple.osName + ".iso" : null,
                nodeRef: tuple.isoExists ? createRef() : null,
              },
              zip: {
                file: tuple.zipExists ? tuple.osName + ".zip" : null,
                nodeRef: tuple.zipExists ? createRef() : null,
              },
              plg: {
                file: tuple.plgExists ? tuple.osName + ".plg" : null,
                nodeRef: tuple.plgExists ? createRef() : null,
              },
              img: {
                exists: tuple.imgExists,
                nodeRef: tuple.imgExists ? createRef() : null,
              },
              menu: {
                exists: tuple.mnuExists,
                nodeRef: tuple.mnuExists ? createRef() : null,
              },
            };
          }
        );
        setIsoTuples(isosInStore);
        setMenuDefault(data.menuDefault);
      })
      .catch((error) => console.error("Get iso files failed ", error));
  };

  const removeFile = (file: string) => {
    const channelParam = uploadChannel ? `/${uploadChannel}` : "";
    const fileName = `${file}`;
    const confirmDelete = window.confirm(`Delete "${fileName}" ?`);
    if (confirmDelete) {
      axiosInstance
        .delete(`/stackupload/delete${channelParam}`, {
          headers: {
            "x-file-name": fileName,
          },
        })
        .then(() => {
          getIsoFiles();
          setFileChangeEvent({ file: file, change: "-" });
        })
        .catch((error) => {
          setErrMsg([
            error.message,
            error.status === 403
              ? "--- You don't have permission to make this operation."
              : "",
          ]);
          setShowAlert(true);
          console.error("Delete iso files failed ", error);
        });
    }
  };

  const defaultPicker = (picked: string) => {
    setMenuDefault(picked);
    setBntStatus({
      ...bntStatus,
      menu: false,
    });
  };

  const imageLoad = (changeTracker: FileChanges) => {
    chgBntStatus("none");
    const changes = JSON.stringify(changeTracker);
    axiosInstance
      .post("/rackimage/mount", changes, {
        // headers: {
        //   "Content-Type": "application/x-binary",
        //   "Access-Control-Allow-Origin": "*",
        // },
      })
      .then(() => {
        chgBntStatus("mount");
        setRefresh(refresh + 1);
        setChangeTracker({});
        localStorage.removeItem(`${uploadChannel}`);
      })
      .then(() => {
        handleTerminalShow();
      })
      .catch((error) => {
        chgBntStatus("mount");
        setErrMsg([
          error.message,
          error.status === 403
            ? "--- You don't have permission to make this operation."
            : "",
        ]);
        setShowAlert(true);
        console.error("Failed to mount iso files ", error);
      });
  };

  const imageReload = () => {
    chgBntStatus("none");
    axiosInstance
      .post("/rackimage/remount", null, {
        headers: {
          "Content-Type": "application/x-binary",
          "Access-Control-Allow-Origin": "*",
        },
      })
      .then(() => {
        chgBntStatus("remount");
        setRefresh(refresh + 1);
        setChangeTracker({});
        localStorage.removeItem("isoUpload");
        localStorage.removeItem("plgUpload");
      })
      .then(() => {
        handleTerminalShow();
      })
      .catch((error) => {
        console.log(JSON.stringify(error, null, 4));
        chgBntStatus("remount");
        setErrMsg([
          error.message,
          error.status === 403
            ? "--- You don't have permission to make this operation."
            : "",
        ]);
        setShowAlert(true);
        console.error("Failed to mount iso files ", error);
      });
  };

  const imageMenu = (menuDefault: string) => {
    chgBntStatus("none");
    axiosInstance
      .post("/rackimage/menu", null, {
        headers: {
          "Content-Type": "application/x-binary",
          "Access-Control-Allow-Origin": "*",
          "default-boot-os": menuDefault,
        },
      })
      .then(() => {
        chgBntStatus("menu");
        setRefresh(refresh + 1);
      })
      .catch((error) => {
        chgBntStatus("menu");
        setErrMsg([
          error.message,
          error.status === 403
            ? "--- You don't have permission to make this operation."
            : "",
        ]);
        setShowAlert(true);
        console.error("Failed to populate boot menu ", error);
      });
  };

  const handleTerminalShow = () => {
    setShowTerminal(true);
  };
  const handleTerminalClose = () => {
    setShowTerminal(false);
  };

  const lstyle = { margin: 10 };
  const bstyle = { padding: 20 };
  return (
    <div>
      <h3 className="text-center" style={lstyle}>
        <b>Boot Image Preparation</b>
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
      <FileUploader
        completeNotifier={setFileChangeEvent}
        channelParam={uploadChannel}
        allowedTypes={allowedTypes}
        // receiverUrl={uploaderBackend}
      />
      <div className="table" style={bstyle}>
        <Table striped bordered hover>
          <thead className="text-center align-middle">
            <tr>
              <th>
                <b>OS Release Name</b>
              </th>
              {/* <th>
                <b>ISO File</b>
              </th>
              <th>
                <b>Auto Instll</b>
              </th> */}
              <th>User Plugin (Optional)</th>
              <th>
                <b>Boot Image</b>
              </th>
              <th>
                <b>Boot Menu</b>
              </th>
              <th>
                <Button variant="link" onClick={() => defaultPicker("")}>
                  <b>Auto Boot</b> ( &#9673; )
                </Button>
              </th>
            </tr>
          </thead>
          <tbody>
            {isoTuples.map((tuple: Tuple) => {
              const { os, plg, iso, /*zip,*/ img, menu } = tuple;
              return (
                <tr key={os.osName} className="text-center">
                  <td className="text-start">{os.osName}</td>
                  {/* <td>{iso.file && <>✓</>}</td>
                  <td>{zip.file && <>✓</>}</td> */}
                  <td>
                    {plg.file && (
                      <>
                        ✓
                        <Button
                          className="remove-btn float-end"
                          variant="danger"
                          style={{ padding: '0.125rem 0.25rem', fontSize: '0.75rem' }}
                          onClick={() => removeFile(plg.file)}
                        >
                          &times; Delete
                        </Button>
                        <FileDownloader
                          fileName={plg.file}
                          channelParam={uploadChannel}
                          // receiverUrl={`${uploaderBackend}/file`}
                          style={{ padding: '0.125rem 0.25rem', fontSize: '0.75rem' }}
                        />
                      </>
                    )}
                  </td>
                  <td className="text-center">
                    {img.exists ? "✓ (Mounted)" : " "}
                  </td>
                  <td className="text-center">
                    {menu.exists ? "✓ (Populated)" : " "}
                  </td>
                  <td className="text-center">
                    <ToggleButton
                      key={os.osName}
                      id={os.osName}
                      type="radio"
                      variant={
                        menuDefault === os.osName
                          ? "outline-success"
                          : "outline-primary"
                      }
                      name="radio"
                      value={iso.file ?? ""}
                      checked={menuDefault === os.osName}
                      style={{ padding: '4px 8px', fontSize: '14px' }}
                      onChange={(e) => defaultPicker(e.currentTarget.id)}
                    ></ToggleButton>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>
      <div className="jumbotron">
        <Form>
          <Button
            variant={
              bntStatus.mount || Object.keys(changeTracker).length === 0
                ? "secondary"
                : "primary"
            }
            style={lstyle}
            disabled={
              bntStatus.mount || Object.keys(changeTracker).length === 0
            }
            onClick={(e) => {
              e.preventDefault();
              if (!bntStatus.mount) {
                imageLoad(changeTracker);
              }
            }}
          >
            Process Changes
          </Button>
          <Button
            variant={bntStatus.remount ? "secondary" : "primary"}
            style={lstyle}
            disabled={bntStatus.remount}
            onClick={(e) => {
              e.preventDefault();
              if (!bntStatus.remount) {
                imageReload();
              }
            }}
          >
            Reprocess All
          </Button>
          <Button
            variant={bntStatus.menu ? "secondary" : "primary"}
            style={lstyle}
            disabled={bntStatus.menu}
            onClick={(e) => {
              e.preventDefault();
              if (!bntStatus.menu) {
                imageMenu(menuDefault);
              }
            }}
          >
            Populate boot menu
          </Button>
          <Button
            className="float-end"
            variant={bntStatus.next ? "outline-secondary" : "outline-primary"}
            style={lstyle}
            disabled={bntStatus.next}
            onClick={(e) => {
              e.preventDefault();
              navigate("/static-client");
            }}
          >
            Static Client &#9655;&#x25B7;
          </Button>
          <Button
            className="float-end"
            variant={bntStatus.prev ? "outline-secondary" : "outline-primary"}
            style={lstyle}
            disabled={bntStatus.prev}
            onClick={(e) => {
              e.preventDefault();
              navigate("/os-upload");
            }}
          >
            &#9665;&#x25C1; OS Upload
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

export default BootImage;
