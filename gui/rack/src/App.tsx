import type { NavLinkRenderProps } from "react-router";
import { Routes, Route, NavLink } from "react-router";
import { Container, Row, Col, Navbar, Nav, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider, useAuth } from "@/components/AuthService";
import { storeRefreshToken } from "@/utils/refreshToken";
import { PrivateRoute } from "@/components/PrivateRoute";

const HomePage = lazy(() => import("@/pages/HomePage"));
const RackPlanner = lazy(() => import("@/pages/RackPlanner"));
const RackBuilder = lazy(() => import("@/pages/RackBuilder"));
const RackService = lazy(() => import("@/pages/RackService"));
const OsUpload = lazy(() => import("@/pages/OsUpload"));
const BootImage = lazy(() => import("@/pages/BootImage"));
const StaticClient = lazy(() => import("@/pages/StaticClient"));
const RackPlugin = lazy(() => import("@/pages/RackPlugin"));
const TeamMember = lazy(() => import("@/pages/TeamMember"));
const AboutUs = lazy(() => import("@/pages/AboutUs"));
const UserProfile = lazy(() => import("@/pages/UserProfile"));
const UserLogin = lazy(() => import("@/pages/UserLogin"));
const Register = lazy(() => import("@/pages/UserRegister"));

import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

const style = ({ isActive }: NavLinkRenderProps) => ({
  fontWeight: isActive ? "bold" : "normal",
  whiteSpace: "pre",
});

const Navigation = () => {
  const { accessToken, onLogout } = useAuth();
  const navigate = useNavigate();
  return (
    <Navbar
      bg="primary"
      data-bs-theme="dark"
      className="nav"
    >
      <Container>
        <Navbar.Brand>
          <img
            src="/favicon.ico"
            width="28"
            height="28"
            className="d-inline-block align-bottom me-2"
            alt=""
          />
          Micro Rack
        </Navbar.Brand>
        <Nav className="me-auto">
          <Container>
            <NavLink to="/" style={style}>
              Home Page
            </NavLink>
          </Container>
          <Container>
            <NavLink to="/rack-planner" style={style}>
              Rack Planner
            </NavLink>
          </Container>
          <Container>
            <NavLink to="/rack-builder" style={style}>
              Rack Builder
            </NavLink>
          </Container>
          <Container>
            <NavLink to="/rack-service" style={style}>
              Rack Service
            </NavLink>
          </Container>
          <Container>
            <NavLink to="/os-upload" style={style}>
              OS Upload
            </NavLink>
          </Container>
          <Container>
            <NavLink to="/boot-image" style={style}>
              Boot Image
            </NavLink>
          </Container>
          <Container>
            <NavLink to="/static-client" style={style}>
              Static Client
            </NavLink>
          </Container>
          <Container>
            <NavLink to="/rack-plugin" style={style}>
              Rack Plugins
            </NavLink>
          </Container>
          <Container>
            <NavLink to="/team-user" style={style}>
              Team User
            </NavLink>
          </Container>
          <Container>
            <NavLink to="/about-up" style={style}>
              About
            </NavLink>
          </Container>
        </Nav>
      </Container>
      <Container className="d-flex justify-content-end gap-2">
        {accessToken && (
          <Button
            style={{
              backgroundColor: "transparent",
              backgroundImage: "url('/profile.png')",
              backgroundSize: "cover",
              width: "40px",
              height: "40px",
            }}
            onClick={(e) => {
              e.preventDefault();
              navigate("/user-profile");
            }}
          ></Button>
        )}
        {accessToken ? (
          <Button
            className="float-end"
            onClick={(e) => {
              e.preventDefault();
              storeRefreshToken("", false);
              onLogout();
              navigate("/");
            }}
          >
            Sign Out
          </Button>
        ) : (
          <Button
            className="float-end"
            onClick={(e) => {
              e.preventDefault();
              navigate("/user-login");
            }}
          >
            Sign In
          </Button>
        )}
      </Container>
    </Navbar>
  );
};

const App = () => {
  return (
    <div>
      <Row>
        <Col>
          <AuthProvider>
            <Navigation />
            <Suspense fallback={<div>Loading...</div>}>
              <Routes>
              <Route index element={<HomePage />} />
              <Route
                path="rack-planner"
                element={
                  <PrivateRoute allowedRoles={[1, 9]}>
                    <RackPlanner />
                  </PrivateRoute>
                }
              />
              <Route
                path="rack-builder"
                element={
                  <PrivateRoute allowedRoles={[1, 9]}>
                    <RackBuilder />
                  </PrivateRoute>
                }
              />
              <Route
                path="rack-service"
                element={
                  <PrivateRoute allowedRoles={[1, 2, 3, 9]}>
                    <RackService />
                  </PrivateRoute>
                }
              />
              <Route
                path="os-upload"
                element={
                  <PrivateRoute allowedRoles={[1, 2, 9]}>
                    <OsUpload />
                  </PrivateRoute>
                }
              />
              <Route
                path="boot-image"
                element={
                  <PrivateRoute allowedRoles={[1, 2, 9]}>
                    <BootImage />
                  </PrivateRoute>
                }
              />
              <Route
                path="static-client"
                element={
                  <PrivateRoute allowedRoles={[1, 2, 9]}>
                    <StaticClient />
                  </PrivateRoute>
                }
              />
              <Route
                path="rack-plugin"
                element={
                  <PrivateRoute allowedRoles={[1, 9]}>
                    <RackPlugin />
                  </PrivateRoute>
                }
              />
              <Route
                path="team-user"
                element={
                  <PrivateRoute allowedRoles={[1, 9]}>
                    <TeamMember />
                  </PrivateRoute>
                }
              />
              <Route
                path="user-profile"
                element={
                  <PrivateRoute>
                    <UserProfile />
                  </PrivateRoute>
                }
              />
              <Route path="about-up" element={<AboutUs />} />
              <Route path="user-login" element={<UserLogin />} />
              <Route path="register" element={<Register />} />
              <Route path="*" element={<p>There's nothing here: 404!</p>} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </Col>
      </Row>
    </div>
  );
};

export default App;
