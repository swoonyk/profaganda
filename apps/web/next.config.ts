import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  env: {
    // API URL for game endpoints - configure this based on your deployment
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
    // Socket server URL for real-time game communication
    NEXT_PUBLIC_SOCKET_SERVER_URL: process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'http://localhost:4000',
  },
};

export default nextConfig;
