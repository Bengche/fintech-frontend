import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/transactions",
          "/settings",
          "/purchases",
          "/referral",
          "/chat/",
          "/invoice/",
          "/admin/",
          "/api/",
        ],
      },
    ],
    sitemap: "https://fonlok.com/sitemap.xml",
  };
}
