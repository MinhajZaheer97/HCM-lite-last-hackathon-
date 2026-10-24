/** @type {import('next').NextConfig} */
const nextConfig = {
  /* cacheComponents disabled: every route in HCM Lite is auth-dynamic
     (reads the Supabase session), so prerendering adds nothing and its
     Suspense requirements conflict with layout-level auth guards. */
  cacheComponents: false,
  partialPrefetching: false,
  reactCompiler: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
