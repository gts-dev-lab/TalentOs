
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  output: process.env.DOCKER_BUILD === 'true' ? 'standalone' : undefined, // Para Docker
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Optimizaciones de rendimiento
  compress: true, // Habilitar compresión gzip
  poweredByHeader: false, // Ocultar header X-Powered-By
  reactStrictMode: true,
  // Ocultar el badge "N 1 Issue" en desarrollo (se puede reactivar para depurar)
  devIndicators: false,
  images: {
    unoptimized: false,
    formats: ['image/avif', 'image/webp'], // Formatos modernos más ligeros
    minimumCacheTTL: 60, // Cache de imágenes
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
       {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Optimización de bundle
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  // Prevent bundling server-only packages
  serverExternalPackages: ['argon2-browser', 'argon2', 'twilio', '@sendgrid/mail', 'google-auth-library'],
  webpack: (config, { isServer }) => {
    config.experiments = {
      ...(config.experiments || {}),
      asyncWebAssembly: true,
    };
    
    // This is to prevent a build error for a missing optional dependency in genkit
    config.externals.push({
      '@opentelemetry/exporter-jaeger': 'commonjs @opentelemetry/exporter-jaeger',
    });
    
    // Fix for argon2-browser trying to use Node.js 'fs' module in the browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
      
      // Handle .wasm files for argon2-browser - use asset/resource
      config.module.rules.push({
        test: /\.wasm$/,
        type: 'asset/resource',
      });
    } else {
      // On server, externalize argon2-browser completely
      config.externals.push('argon2-browser');
      // Also externalize argon2 from client bundle
      config.externals.push('argon2');
    }
    
    // Prevent argon2 from being bundled in the client
    if (!isServer) {
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push('argon2');
      }
    }
    
    return config;
  }
};

export default nextConfig;
