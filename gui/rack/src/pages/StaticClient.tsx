import type { HTMLProps } from "react";
import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Button, Modal, Alert } from "react-bootstrap";
import { useAuth } from "@/components/AuthService";
import Loading from "@/pages/Loading";
import FileUploader, { FileDownloader } from "@/components/FileUploader";
import type { FileChange, FileChanges } from "@/types/Event";
import fileNameParser from "@/utils/fileNameParser";
import { type DhcpStatic, emptyStatic } from "@/types/Dhcp";
import "bootstrap/dist/css/bootstrap.min.css";
import "@/pages/StaticClient.css";
import type {
  Row,
  Table,
  Column,
  ColumnDef,
  PaginationState,
} from "@tanstack/react-table";
import {
  flexRender,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  // createColumnHelper,
} from "@tanstack/react-table";
import { StyledTable, TableContainer } from "@/styles/tanstack";
import { storeGuiContext, fetchGuiContext } from "@/utils/currentContext";

const uploadChannel = "cfgUpload";
const allowedTypes: string[] = ["dhcp", "conf"];

declare module "@tanstack/react-table" {
  interface TableMeta<TData> {
    editedRows: Row<TData>[];
    setEditedRows: (rows: Row<TData>[]) => void;
    revertData: (rowIndex: number, revert: boolean) => void;
    updateData: (rowIndex: number, columnId: string, value: unknown) => void;
    addRow: (rowDefault: DhcpStatic) => void;
    removeRow: (rowIndex: number) => void;
    removeSelectedRows: (selectedRows: number[]) => void;
  }
}

function Filter({
  column,
  table,
}: {
  // eslint-disable-next-line
  column: Column<any, any>;
  // eslint-disable-next-line
  table: Table<any>;
}) {
  const firstValue = table
    .getPreFilteredRowModel()
    .flatRows[0]?.getValue(column.id);

  const columnFilterValue = column.getFilterValue();

  return typeof firstValue === "number" ? (
    <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
      <input
        type="number"
        value={(columnFilterValue as [number, number])?.[0] ?? ""}
        onChange={(e) =>
          column.setFilterValue((old: [number, number]) => [
            e.target.value,
            old?.[1],
          ])
        }
        placeholder={`Min`}
        className="w-24 border shadow rounded"
      />
      <input
        type="number"
        value={(columnFilterValue as [number, number])?.[1] ?? ""}
        onChange={(e) =>
          column.setFilterValue((old: [number, number]) => [
            old?.[0],
            e.target.value,
          ])
        }
        placeholder={`Max`}
        className="w-24 border shadow rounded"
      />
    </div>
  ) : (
    <input
      className="w-36 border shadow rounded"
      onChange={(e) => column.setFilterValue(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      placeholder={`Search...`}
      type="text"
      value={(columnFilterValue ?? "") as string}
    />
  );
}

function StaticClient() {
  const bntInitState = {
    parse: false,
    apply: false,
    ping: false,
    prev: false,
  };
  type TrackerEvent = { [key: string]: string };
  type TrackerEvents = { [key: string]: TrackerEvent[] };
  const navigate = useNavigate();
  const { axiosInstance } = useAuth();
  const [staticTuples, setStaticTuples] = useState([]);
  const [changeTracker, setChangeTracker] = useState({});
  const [fileChangeEvent, setFileChangeEvent] = useState({
    file: "",
    change: "",
  });

  const [spinning, setSpinning] = useState(false);
  const [errMsg, setErrMsg] = useState<string[]>([]);
  const [showAlert, setShowAlert] = useState(false);
  const [bntStatus, setBntStatus] = useState(bntInitState);

  function IndeterminateCheckbox({
    indeterminate,
    className = "",
    ...rest
  }: { indeterminate?: boolean } & HTMLProps<HTMLInputElement>) {
    const ref = useRef<HTMLInputElement>(null!);

    useEffect(
      () => {
        if (typeof indeterminate === "boolean") {
          ref.current.indeterminate = !rest.checked && indeterminate;
        }
      },
      // eslint-disable-next-line
      [ref, indeterminate]
    );

    return (
      <input
        type="checkbox"
        ref={ref}
        className={className + " cursor-pointer"}
        {...rest}
      />
    );
  }

  const ActionCell = ({
    row,
    table,
  }: {
    row: Row<DhcpStatic>;
    table: Table<DhcpStatic>;
  }) => {
    const meta = table.options.meta;
    const handleEditedRows = (e: React.MouseEvent<HTMLButtonElement>) => {
      meta?.setEditedRows([row]);
      const elName = e.currentTarget.name;
      switch (elName) {
        case "edit":
          meta?.updateData(0, "", "");
          break;
        case "remove":
          meta?.removeRow(0);
          break;
        default:
          break;
      }
    };

    return (
      <div className="edit-cell-container">
        <div className="edit-cell-action">
          <button onClick={handleEditedRows} name="edit">
            ✏️
          </button>
          <button onClick={handleEditedRows} name="remove">
            ❌
          </button>
        </div>
      </div>
    );
  };

  const columns = useMemo<ColumnDef<DhcpStatic>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <IndeterminateCheckbox
            {...{
              checked: table.getIsAllRowsSelected(),
              indeterminate: table.getIsSomeRowsSelected(),
              // onChange: table.getToggleAllPageRowsSelectedHandler(),
              onChange: table.getToggleAllRowsSelectedHandler(),
            }}
          />
        ),
        cell: ({ row }) => (
          <div className="px-1">
            <IndeterminateCheckbox
              {...{
                checked: row.getIsSelected(),
                disabled: !row.getCanSelect(),
                indeterminate: row.getIsSomeSelected(),
                onChange: row.getToggleSelectedHandler(),
              }}
            />
          </div>
        ),
      },
      {
        accessorKey: "mac_address",
        cell: (info) => info.getValue(),
        footer: (props) => props.column.id,
      },
      {
        accessorKey: "ipv4_address",
        header: () => "ipv4_address",
        footer: (props) => props.column.id,
      },
      {
        accessorKey: "ipv6_address",
        header: () => "ipv6_address",
        footer: (props) => props.column.id,
      },
      {
        accessorKey: "hostname",
        header: "hostname",
        footer: (props) => props.column.id,
      },
      {
        accessorKey: "lease_time",
        header: "lease_time",
        footer: (props) => props.column.id,
      },
      {
        accessorKey: "is_active",
        header: "is_active",
        footer: (props) => props.column.id,
      },
      {
        accessorKey: "pingable",
        header: "pingable",
        footer: (props) => props.column.id,
      },
      {
        header: "Action",
        cell: ActionCell,
      },
    ],
    []
  );

  useEffect(
    () => {
      setChangeTracker(JSON.parse(localStorage.getItem("pxe.dhcp") ?? "{}"));
      getDhcpStatics();
      eventAggregator(fileChangeEvent);
    },
    // eslint-disable-next-line
    [fileChangeEvent]
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
    localStorage.setItem("pxe.dhcp", JSON.stringify(tracker));
    chgBntStatus("dirty");
  };

  const chgBntStatus = (status: string) => {
    switch (status) {
      case "none":
        setSpinning(true);
        setBntStatus({
          parse: true,
          apply: true,
          ping: true,
          prev: true,
        });
        break;
      case "parse":
        setSpinning(false);
        setBntStatus({
          parse: true,
          apply: false,
          ping: false,
          prev: true,
        });
        break;
      case "apply":
        setSpinning(false);
        setBntStatus({
          parse: true,
          apply: true,
          ping: false,
          prev: true,
        });
        break;
      case "ping":
        setSpinning(false);
        setBntStatus({
          parse: true,
          apply: false,
          ping: false,
          prev: false,
        });
        break;
      case "dirty":
      default:
        setSpinning(false);
        setBntStatus({
          parse: false,
          apply: false,
          ping: false,
          prev: true,
        });
        break;
    }
  };

  const getDhcpStatics = () => {
    let staticList = [];
    axiosInstance
      .get("/rackstatic/clients")
      .then(({ data }) => {
        staticList = data.Statics.map(
          (dhcpStatic: {
            id: number;
            subnet_id?: number;
            mac_address: string;
            ipv4_address: string;
            ipv6_address?: string;
            hostname?: string;
            lease_time?: string;
            is_active?: boolean;
            pingable?: boolean;
          }) => {
            return dhcpStatic;
          }
        );
        setStaticTuples(staticList);
      })
      .catch((error) => console.error("Get static config failed ", error));
  };

  const parseStatics = (changeTracker: FileChanges) => {
    chgBntStatus("none");
    const changes = JSON.stringify(changeTracker);
    axiosInstance
      .post("/rackstatic/parse", changes)
      .then(() => {
        chgBntStatus("parse");
        setFileChangeEvent({ file: "", change: "parse" });
        setChangeTracker({});
        localStorage.removeItem("pxe.dhcp");
      })
      .catch((error) => {
        chgBntStatus("parse");
        setErrMsg([
          error.message,
          error.status === 403
            ? "--- You don't have permission to make this operation."
            : "",
        ]);
        setShowAlert(true);
        console.error("Failed to parse static assignments. ", error);
      });
  };

  const deleteSelected = (rowSelection: Row<DhcpStatic>[]) => {
    const confirmDelete = window.confirm(`Delete the selected Static IP(s) ?`);
    if (!confirmDelete) return;
    chgBntStatus("none");
    const selectedMacs = rowSelection.map((row) => {
      return row.original.mac_address;
    });
    axiosInstance
      .post("/rackstatic/delete", JSON.stringify(selectedMacs))
      .then(() => {
        chgBntStatus("dirty");
        setFileChangeEvent({ file: "", change: "delete" });
        // setChangeTracker({});
        // localStorage.removeItem("pxe.dhcp");
      })
      .catch((error) => {
        setErrMsg([
          error.message,
          error.status === 403
            ? "--- You don't have permission to make this operation."
            : "",
        ]);
        setShowAlert(true);
        console.error("Failed to delete static assignments. ", error);
      });
  };

  const applyStatics = () => {
    chgBntStatus("none");
    axiosInstance
      .post("/rackstatic/apply", {})
      .then(() => {
        chgBntStatus("apply");
        setFileChangeEvent({ file: "", change: "apply" });
      })
      .catch((error) => {
        chgBntStatus("apply");
        setErrMsg([
          error.message,
          error.status === 403
            ? "--- You don't have permission to make this operation."
            : "",
        ]);
        setShowAlert(true);
        console.error("Failed to populate boot apply ", error);
      });
  };

  const pingStatics = () => {
    chgBntStatus("none");
    axiosInstance
      .post("/rackstatic/ping", {})
      .then(() => {
        chgBntStatus("ping");
        setFileChangeEvent({ file: "", change: "ping" });
      })
      .catch((error) => {
        chgBntStatus("ping");
        setErrMsg([
          error.message,
          error.status === 403
            ? "--- You don't have permission to make this operation."
            : "",
        ]);
        setShowAlert(true);
        console.error("Failed to ping static IPs ", error);
      });
  };

  const lstyle = { margin: 5 };
  const bstyle = { padding: 5 };
  return (
    <div>
      <h3 className="text-center" style={lstyle}>
        <b>Host Static IP Assignment</b>
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
        <StaticTable
          {...{
            data: staticTuples,
            columns: columns,
          }}
        />
      </div>
      <div className="jumbotron">
        <Form>
          {/* <Button
            variant={
              bntStatus.parse || Object.keys(changeTracker).length === 0
                ? "secondary"
                : "primary"
            }
            style={lstyle}
            disabled={
              bntStatus.parse || Object.keys(changeTracker).length === 0
            }
            onClick={(e) => {
              e.preventDefault();
              if (!bntStatus.parse) {
                parseStatics(changeTracker);
              }
            }}
          >
            Parse Uploaded File
          </Button> */}
          <Button
            variant={bntStatus.apply ? "secondary" : "primary"}
            style={lstyle}
            disabled={bntStatus.apply}
            onClick={(e) => {
              e.preventDefault();
              if (!bntStatus.apply) {
                applyStatics();
              }
            }}
          >
            Apply Static IP Settings
          </Button>
          <Button
            variant={bntStatus.ping ? "secondary" : "primary"}
            style={lstyle}
            disabled={bntStatus.ping}
            onClick={(e) => {
              e.preventDefault();
              if (!bntStatus.ping) {
                pingStatics();
              }
            }}
          >
            Ping All Static Host IPs
          </Button>
          <Button
            className="float-end"
            variant={bntStatus.prev ? "outline-secondary" : "outline-primary"}
            style={lstyle}
            disabled={bntStatus.prev}
            onClick={(e) => {
              e.preventDefault();
              navigate("/boot-image");
            }}
          >
            &#9665;&#x25C1; Boot Image
          </Button>
        </Form>
      </div>
      {spinning && <Loading />}
    </div>
  );

  function StaticTable({
    data,
    columns,
  }: {
    data: DhcpStatic[];
    columns: ColumnDef<DhcpStatic>[];
  }) {
    const [modalStatic, setModalStatic] = useState(emptyStatic);
    const [showModal, setShowModal] = useState(false);
    const [modalAlert, setModalAlert] = useState(false);
    const [validated, setValidated] = useState(false);
    const [errMsg, setErrMsg] = useState<string[]>([]);
    const [rowSelection, setRowSelection] = useState({});
    const [pagination, setPagination] = useState<PaginationState>({
      pageSize: fetchGuiContext("rack.context").pageSize ?? 15,
      pageIndex: 0,
    });
    // const [pagination, setPagination] = useState<PaginationState>(
    //   (({ pageSize, pageIndex }) => ({
    //     pageSize: pageSize ?? 15,
    //     pageIndex: pageIndex ?? 0,
    //   }))({
    //     ...fetchGuiContext("rack.context"),
    //   })
    // );
    const [showFilters, setShowFilters] = useState(false);
    const [editedRows, setEditedRows] = useState<Row<DhcpStatic>[]>([]);
    const [editRow, setEditRow] = useState(0);
    const [deleteRow, setDeleteRow] = useState(0);

    useEffect(() => {
      if (editedRows.length) {
        const original = editedRows[0].original ?? emptyStatic;
        if (editRow) showEditModal(original);
        if (deleteRow) deleteSelected(editedRows);
      }
    }, [editedRows, deleteRow, editRow]);

    const table = useReactTable({
      data,
      columns,
      debugTable: true,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      onPaginationChange: setPagination,
      state: { pagination, rowSelection },
      // autoResetPageIndex: false, // turn off page index reset when sorting or filtering
      enableRowSelection: true,
      onRowSelectionChange: setRowSelection,
      meta: {
        editedRows,
        setEditedRows,
        addRow: () => {},
        removeSelectedRows: () => {},
        revertData: () => {},
        updateData: () => {
          setEditRow(editRow + 1);
        },
        removeRow: () => {
          setDeleteRow(deleteRow + 1);
        },
      },
    });

    const showEditModal = (row: DhcpStatic = emptyStatic) => {
      setModalStatic(row);
      setModalAlert(false);
      setValidated(false);
      setShowModal(true);
    };
    const closeEditModal = () => {
      setModalStatic(emptyStatic);
      setModalAlert(false);
      setValidated(false);
      setShowModal(false);
    };

    const saveEditModal = (e: React.FormEvent) => {
      e.preventDefault();

      // eslint-disable-next-line
      const postRoute = modalStatic.hasOwnProperty("id") ? "update" : "create";
      axiosInstance
        .post(
          `/rackstatic/${postRoute}`,
          { ...modalStatic },
          {
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        )
        .then(() => {
          setShowModal(false);
          getDhcpStatics();
        })
        .catch(() => {
          setErrMsg([". Failed to save data to server"]);
          setModalAlert(true);
          console.error("Failed to save data to server.");
        });
    };

    const toggleFilters = () => {
      table.resetColumnFilters();
      setShowFilters(!showFilters);
    };

    return (
      <>
        <div>
          <Button
            variant={
              bntStatus.parse || Object.keys(changeTracker).length === 0
                ? "secondary"
                : "primary"
            }
            className="border rounded m-2 p-1"
            disabled={
              bntStatus.parse || Object.keys(changeTracker).length === 0
            }
            onClick={(e) => {
              e.preventDefault();
              if (!bntStatus.parse) {
                parseStatics(changeTracker);
              }
            }}
          >
            Import Last Upload
          </Button>
          <Button
            variant="primary"
            className="border rounded m-2 p-1"
            onClick={() => showEditModal()}
          >
            Add A Static Host
          </Button>
          <FileDownloader
            fileName={"full-static-table"}
            channelParam={uploadChannel}
            // receiverUrl={`${uploaderBackend}/file`}
            bunttonText={"Download Static Data"}
            variant={"primary"}
            className={"border rounded m-2 p-1"}
          />
          <Button
            variant="danger"
            className="border rounded m-2 p-1 float-end"
            onClick={() => deleteSelected(table.getSelectedRowModel().flatRows)}
          >
            Delete Selected Rows
          </Button>
          <Button
            variant="info"
            className="border rounded m-2 p-1 float-end"
            onClick={() => toggleFilters()}
          >
            {showFilters ? "Hide" : "Show"} Column Filters
          </Button>
        </div>
        <div className="p-2">
          <div className="h-2" />
          <TableContainer>
            <StyledTable>
              {/* <table> */}
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <th key={header.id} colSpan={header.colSpan}>
                          <div
                            {...{
                              className: header.column.getCanSort()
                                ? "cursor-pointer select-none"
                                : "",
                              onClick: header.column.getToggleSortingHandler(),
                            }}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {{
                              asc: " 🔼",
                              desc: " 🔽",
                            }[header.column.getIsSorted() as string] ?? null}
                            {showFilters && header.column.getCanFilter() ? (
                              <div>
                                <Filter column={header.column} table={table} />
                              </div>
                            ) : null}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => {
                  return (
                    <tr key={row.id}>
                      {row.getVisibleCells().map((cell) => {
                        return (
                          <td key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
              {/* </table> */}
            </StyledTable>
          </TableContainer>
          <div className="h-2" />
          <div className="flex items-center gap-2">
            <button
              className="border rounded p-1"
              onClick={() => table.firstPage()}
              disabled={!table.getCanPreviousPage()}
            >
              {"⏪"}
            </button>
            <button
              className="border rounded p-1"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              {"◀️"}
            </button>
            <button
              className="border rounded p-1"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              {"▶️"}
            </button>
            <button
              className="border rounded p-1"
              onClick={() => table.lastPage()}
              disabled={!table.getCanNextPage()}
            >
              {"⏩"}
            </button>
            {table.getIsSomeRowsSelected() && (
              <span>
                {"("} {Object.keys(rowSelection).length} of{" "}
                {table.getPreFilteredRowModel().rows.length} rows of data have
                been selected {")"}
              </span>
            )}
            {table.getIsAllRowsSelected() && (
              <span className="text-danger">
                {"("} All of {table.getPreFilteredRowModel().rows.length} rows
                of data have been selected !! {")"}
              </span>
            )}
            <div className="float-end">
              <span className="flex items-center gap-1">
                <strong>
                  {table.getState().pagination.pageIndex + 1} of{" "}
                  {table.getPageCount().toLocaleString()}
                </strong>
              </span>
              <span className="flex items-center gap-1">
                | Go to page:
                <input
                  type="number"
                  min="1"
                  max={table.getPageCount()}
                  defaultValue={table.getState().pagination.pageIndex + 1}
                  onChange={(e) => {
                    const page = e.target.value
                      ? Number(e.target.value) - 1
                      : 0;
                    table.setPageIndex(page);
                    storeGuiContext("rack.context", {
                      ...fetchGuiContext("rack.context"),
                      pageIndex: page,
                    });
                  }}
                  className="border p-1 rounded w-16"
                />
              </span>
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => {
                  const pgSize = Number(e.target.value);
                  table.setPageSize(pgSize);
                  table.setPageIndex(0);
                  storeGuiContext("rack.context", {
                    ...fetchGuiContext("rack.context"),
                    pageSize: pgSize,
                    pageIndex: 0,
                  });
                }}
              >
                {[15, 30, 45, 60, 75].map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    Show {pageSize}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Modal
            // size="lg"
            backdrop="static"
            keyboard={false}
            show={showModal}
            onHide={closeEditModal}
          >
            <Modal.Header closeButton>
              <Modal.Title>Static IP & Hostname</Modal.Title>
            </Modal.Header>
            {modalAlert && (
              <Alert
                className="mb-2"
                variant="danger"
                onClose={() => setModalAlert(false)}
                dismissible
              >
                {errMsg?.join(" ") ?? "An unknown error."}
              </Alert>
            )}
            <Modal.Body>
              <Form
                id="dhcpStaticForm"
                onSubmit={saveEditModal}
                noValidate
                validated={validated}
              >
                <Form.Group className="mb-2 d-flex">
                  <Form.Label className=" col-sm-3 text-center">
                    Mac Address:
                  </Form.Label>
                  <Form.Control
                    required
                    // eslint-disable-next-line
                    disabled={modalStatic.hasOwnProperty("id")}
                    type="input"
                    defaultValue={modalStatic?.mac_address}
                    onChange={(e) => {
                      setModalStatic({
                        ...modalStatic,
                        mac_address: e.target.value,
                      });
                    }}
                  />
                </Form.Group>
                <Form.Group className="mb-2 d-flex">
                  <Form.Label className=" col-sm-3 text-center">
                    IPv4 Address:
                  </Form.Label>
                  <Form.Control
                    required
                    type="input"
                    defaultValue={modalStatic?.ipv4_address}
                    onChange={(e) => {
                      setModalStatic({
                        ...modalStatic,
                        ipv4_address: e.target.value,
                      });
                    }}
                  />
                </Form.Group>
                <Form.Group className="mb-2 d-flex">
                  <Form.Label className=" col-sm-3 text-center">
                    IPv6 Address:
                  </Form.Label>
                  <Form.Control
                    required
                    type="input"
                    defaultValue={modalStatic?.ipv6_address}
                    onChange={(e) => {
                      setModalStatic({
                        ...modalStatic,
                        ipv6_address: e.target.value,
                      });
                    }}
                  />
                </Form.Group>
                <Form.Group className="mb-2 d-flex">
                  <Form.Label className=" col-sm-3 text-center">
                    Host Name:
                  </Form.Label>
                  <Form.Control
                    type="input"
                    defaultValue={modalStatic?.hostname}
                    onChange={(e) => {
                      setModalStatic({
                        ...modalStatic,
                        hostname: e.target.value,
                      });
                    }}
                  />
                </Form.Group>
                <Form.Group className="mb-2 d-flex">
                  <Form.Label className=" col-sm-3 text-center">
                    Lease Time:
                  </Form.Label>
                  <Form.Control
                    type="input"
                    defaultValue={modalStatic?.lease_time}
                    onChange={(e) => {
                      setModalStatic({
                        ...modalStatic,
                        lease_time: e.target.value,
                      });
                    }}
                  />
                </Form.Group>
                <Form.Group className="mb-2 d-flex">
                  <Form.Label className="col-sm-3 text-center">
                    Active:
                  </Form.Label>
                  <Form.Check
                    inline
                    type="checkbox"
                    defaultChecked={modalStatic?.is_active}
                    onChange={(e) => {
                      setModalStatic({
                        ...modalStatic,
                        is_active: e.target.checked,
                      });
                    }}
                  />
                </Form.Group>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={closeEditModal}>
                Close
              </Button>
              <Button type="submit" form="dhcpStaticForm" variant="primary">
                Save
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      </>
    );
  }
}

export default StaticClient;
