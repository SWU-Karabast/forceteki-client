// ControlHub.tsx
import React from "react";
import { useRouter } from "next/navigation";
import { MdSettings, MdMenu, MdArrowBackIos } from "react-icons/md";
import { FaDiscord, FaGithub } from "react-icons/fa";
import Link from "next/link";
import { ControlHubProps } from "./ControlHubTypes";
import "./ControlHub.css";

const ControlHub: React.FC<ControlHubProps> = ({
  sidebarOpen,
  toggleSidebar,
  path,
  user,
  logout,
}) => {
  const router = useRouter();
  const isLobbyView = path === "/lobby";
  const isGameboardView = path === "/gameboard";

  const handleBack = () => {
    if (isLobbyView) {
      router.push("/");
    } else {
      router.back();
    }
  };

  return (
    <div
      className="menu-container"
      style={{ right: isLobbyView || isGameboardView ? "10px" : "0px" }}
    >
      {isLobbyView ? (
        <>
          <button className="icon-button" onClick={handleBack}>
            <MdArrowBackIos className="back-button" />
          </button>
          <h5 className="exit-text">EXIT</h5>
        </>
      ) : isGameboardView ? (
        <>
          <button className="icon-button">
            <MdSettings className="icon" />
          </button>
          {!sidebarOpen && (
            <button className="icon-button" onClick={toggleSidebar}>
              <MdMenu className="icon" />
            </button>
          )}
        </>
      ) : (
        <div className="default-main-container">
          {/* Conditionally render Profile/Log Out or Log In */}
          <div className="profile-box">
            {user ? (
              <>
                <Link href="/profile" className="profile-link">
                  Profile
                </Link>
                <div className="divider" />
                <button onClick={logout} className="profile-link">
                  Log Out
                </button>
              </>
            ) : (
              <Link href="/auth" className="profile-link">
                Log In
              </Link>
            )}
          </div>
          {/* Social Icons */}
          <div className="social-icons-box">
            <a
              href="https://discord.com"
              target="_blank"
              rel="noopener noreferrer"
              className="icon-button"
            >
              <FaDiscord />
            </a>
            <a
              href="https://github.com/SWU-Karabast"
              target="_blank"
              rel="noopener noreferrer"
              className="icon-button"
            >
              <FaGithub />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default ControlHub;