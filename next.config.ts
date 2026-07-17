import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Never emit browser source maps in production — this is the default, but we set it
  // explicitly so the client bundle ships minified & mangled with no readable source,
  // and no .map file to reconstruct it from. Combined with the server-only generation
  // core (src/lib/babel/server), the valuable algorithm never reaches the browser at all.
  productionBrowserSourceMaps: false,

  compiler: {
    // Strip console.* (except errors) from the production client bundle so no debug
    // hints, internal names, or data leak through the console.
    removeConsole: {
      exclude: ["error"],
    },
  },
};

export default nextConfig;
