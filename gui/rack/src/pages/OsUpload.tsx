import { useEffect, useState, createRef } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Table, Button, Alert } from "react-bootstrap";
import { useAuth } from "@/components/AuthService";
import Loading from "@/pages/Loading";
import FileUploader from "@/components/FileUploader";
import type { FileChange, FileChanges } from "@/types/Event";
import fileNameParser from "@/utils/fileNameParser";

import { TerminalModal } from "@/components/WebTerminal";

const uploadChannel = "isoUpload";
const allowedTypes: string[] = ["iso", "zip"];

function OsUpload() {
  const bntInitState = {
    mount: false,
    prev: false,
    next: false,
  };
  interface Tuple {
    os: { osName: string; nodeRef: React.ReactNode };
    iso: { file: string; nodeRef: React.ReactNode };
    zip: { file: string; nodeRef: React.ReactNode };
  }

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
  const [spinning, setSpinning] = useState(false);
  const [errMsg, setErrMsg] = useState<string[]>([]);
  const [showAlert, setShowAlert] = useState(false);
  const [bntStatus, setBntStatus] = useState(bntInitState);

  const [showTerminal, setShowTerminal] = useState(false);

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
    // type TrackerKey = keyof typeof tracker;
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
          prev: false,
          next: false,
        });
        break;
      case "mount":
        setSpinning(false);
        setBntStatus({
          mount: true,
          prev: false,
          next: false,
        });
        break;
      case "dirty":
      default:
        setSpinning(false);
        setBntStatus({
          mount: false,
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
            isoExists: boolean;
            zipExists: boolean;
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
            };
          }
        );
        setIsoTuples(isosInStore);
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
        <b>OS iso File Upload</b>
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
              <th>
                <b>OS ISO File</b>
              </th>
              <th>
                <b>Auto Install Conf (Optional, zipped)</b>
              </th>
            </tr>
          </thead>
          <tbody>
            {isoTuples.map((tuple: Tuple) => {
              const { os, iso, zip } = tuple;
              return (
                <tr key={os.osName} className="text-center">
                  <td className="text-start">{os.osName}</td>
                  <td>
                    {iso.file && (
                      <>
                        ✓ (Uploaded)
                        <Button
                          className="remove-btn float-end"
                          variant="danger"
                          style={{ padding: '0.125rem 0.25rem', fontSize: '0.75rem' }}
                          onClick={() => removeFile(iso.file)}
                        >
                          &times; Delete
                        </Button>
                      </>
                    )}
                  </td>
                  <td>
                    {zip.file && (
                      <>
                        ✓ (Uploaded)
                        <Button
                          className="remove-btn float-end"
                          variant="danger"
                          style={{ padding: '0.125rem 0.25rem', fontSize: '0.75rem' }}
                          onClick={() => removeFile(zip.file)}
                        >
                          &times; Delete
                        </Button>
                      </>
                    )}
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
            className="float-end"
            variant={bntStatus.next ? "outline-secondary" : "outline-primary"}
            style={lstyle}
            disabled={bntStatus.next}
            onClick={(e) => {
              e.preventDefault();
              navigate("/boot-image");
            }}
          >
            Boot Image &#9655;&#x25B7;
          </Button>
          <Button
            className="float-end"
            variant={bntStatus.prev ? "outline-secondary" : "outline-primary"}
            style={lstyle}
            disabled={bntStatus.prev}
            onClick={(e) => {
              e.preventDefault();
              navigate("/rack-service");
            }}
          >
            &#9665;&#x25C1; Rack Service
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

export default OsUpload;
