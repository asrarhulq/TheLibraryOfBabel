import type { NextConfig } from "next";

// Babel's own pages (unchanged) — their "back to the library" links point at "/".
// Since "/" is now the hub, a request for "/" coming *from* one of these pages is sent
// to /babel so Babel keeps behaving exactly as before. Direct visits to "/" get the hub.
const BABEL_PATHS =
  "babel|room|d|hall|journal|immortalize|leaderboard|wall|oracle|search|privacy|terms|refunds";
const OWN_HOSTS = "(?:[a-z0-9-]+\\.)*(?:thelibrary\\.page|vercel\\.app)|localhost(?::\\d+)?|127\\.0\\.0\\.1(?::\\d+)?";
const FROM_BABEL_REFERER = `https?://(?:${OWN_HOSTS})/(?:${BABEL_PATHS})(?:[/?#].*)?`;

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // "/" reached from inside Babel → stay in Babel.
      {
        source: "/",
        has: [{ type: "header", key: "referer", value: FROM_BABEL_REFERER }],
        destination: "/babel",
        permanent: false,
      },
      // Prefix-style addresses (/babel/room/…, /babel/hall) → Babel's real, unchanged paths.
      {
        source: "/babel/:path+",
        destination: "/:path+",
        permanent: true,
      },
    ];
  },

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
