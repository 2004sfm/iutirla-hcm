import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000', // El puerto de Django
        pathname: '/media/**', // Solo permitir acceso a la carpeta media
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', // Para la imagen por defecto que pusimos antes
      }
    ],
  },
};

export default nextConfig;
