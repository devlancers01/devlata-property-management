import React from "react";

export default function Footer() {
  return (
    <footer className="w-full py-4 text-center text-white" style={{ backgroundColor: "#007baf" }}>
      <p className="text-sm tracking-wide">
        © 2025 All rights reserved. <span className="font-semibold">Devlata Villa</span> — Built by{" "}
        <span className="font-semibold "><a href="https://devlancers.in" target="_blank" rel="noopener noreferrer">Devlancers</a></span>
      </p>
    </footer>
  );
}
