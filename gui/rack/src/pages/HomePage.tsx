import {
  Container,
  Row,
  Button,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthService";
import "@/pages/HomePage.css";
import { useState, useEffect } from "react";
import getAuthState from "@/utils/getAuthState";

function HomePage() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [authState, setAuthState] = useState("");

  getAuthState().then(({ data }) => {
    setAuthState(data.state);
  });

  useEffect(
    () => {
      if (authState === "config") {
        navigate("/register");
      }
    },
    // eslint-disable-next-line
    [authState]
  );

  return (
    <div className="homepage_wrapper">
      <Container fluid>
        <Row>
          <svg
            version="1.1"
            id="svg1"
            width="1200"
            height="800"
            viewBox="0 0 1200 600"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs id="defs1" />
            <g id="g1">
              <image
                width="1200"
                height="600"
                preserveAspectRatio="none"
                href="pxeboot.png"
                id="pxeboot"
              />
              <OverlayTrigger
                placement="left"
                overlay={
                  <Tooltip id="tooltip1">
                    <h5>Bare Metal Client:</h5>
                    <hr />
                    <ol>
                      <li>Need network interface supports PXE boot</li>
                      <li>The Net boot is enabled in the client BIOS</li>
                      <li>Client is in same subnet as the PXE server</li>
                    </ol>
                  </Tooltip>
                }
              >
                <ellipse
                  className="clickable-area blink-area-1"
                  id="ellipse1"
                  ry="13.991688"
                  rx="13.766014"
                  cy="396.2807"
                  cx="326.54797"
                />
              </OverlayTrigger>
              <OverlayTrigger
                placement="left"
                overlay={
                  <Tooltip id="tooltip2">
                    <h5>Pxe Boot Server:</h5>
                    <hr />
                    <ol>
                      <li>Enable the DHCP server if no other DHCP exists</li>
                      <li>Make the DHCP Proxy settings match the DHCP</li>
                      <li>Configure PXE server in same subnet as DHCP</li>
                    </ol>
                  </Tooltip>
                }
              >
                <ellipse
                  className="clickable-area blink-area-2"
                  id="path1"
                  ry="13.991688"
                  rx="13.766014"
                  cy="137.88582"
                  cx="326.54794"
                />
              </OverlayTrigger>
              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip id="tooltip3">
                    <h5>OS Auto Install:</h5>
                    <hr />
                    <ol>
                      <li>Upload an auto install conf with the OS iso</li>
                      <li>Specify the boot menu default to pick OS</li>
                      <li>Power on clients one by one with time gap</li>
                    </ol>
                  </Tooltip>
                }
              >
                <ellipse
                  className="clickable-area blink-area-3"
                  id="ellipse2"
                  ry="13.991688"
                  rx="13.766014"
                  cy="350.01785"
                  cx="536.19763"
                />
              </OverlayTrigger>
              <OverlayTrigger
                placement="right"
                overlay={
                  <Tooltip id="tooltip4">
                    <h5>Complete OS Load:</h5>
                    <hr />
                    <ol>
                      <li>Make sure the Net boot with the lowest priority</li>
                      <li>Enable NTP on PXE server if NTP support needed</li>
                      <li>Configure a start script for special requirement</li>
                    </ol>
                  </Tooltip>
                }
              >
                <ellipse
                  className="clickable-area blink-area-4"
                  id="ellipse3"
                  ry="13.991688"
                  rx="13.766014"
                  cy="460.59732"
                  cx="716.28418"
                />
              </OverlayTrigger>
              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip id="tooltip5">
                    <h5>OS Loaded Client:</h5>
                    <hr />
                    <ol>
                      <li>PXE access is restricted by the BIOS boot order</li>
                      <li>No PXE is touched after OS correctly loadded</li>
                      <li>The OS is reloadable by changing boot order</li>
                    </ol>
                  </Tooltip>
                }
              >
                <ellipse
                  className="clickable-area blink-area-5"
                  id="ellipse4"
                  ry="13.991688"
                  rx="13.766014"
                  cy="345.50443"
                  cx="822.80157"
                />
              </OverlayTrigger>
            </g>
          </svg>
        </Row>
        {accessToken && (
          <div className="text-center position-absolute bottom-0 end-0 translate-middle">
            <Button
              className="float-end"
              variant="outline-primary"
              onClick={(e) => {
                e.preventDefault();
                navigate("/rack-builder");
              }}
            >
              Let's Start &#9655;&#x25B7;
            </Button>
          </div>
        )}
      </Container>
    </div>
  );
}
export default HomePage;
