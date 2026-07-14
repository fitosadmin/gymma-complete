/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["react-leaflet", "@react-leaflet/core"],
  images: {
    // Image storage is gradient placeholders for now (frontend-first).
    // Cloudinary is pre-authorized so swapping <GymImage> to next/image
    // with real URLs needs zero config. Add S3/CloudFront here later.
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "picsum.photos" },
      // Google Places photo endpoint (302-redirects to googleusercontent CDN).
      { protocol: "https", hostname: "maps.googleapis.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
