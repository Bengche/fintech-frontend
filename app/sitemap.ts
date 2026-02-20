import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: "https://fonlok.com",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: "https://fonlok.com/how-it-works",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: "https://fonlok.com/pricing",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://fonlok.com/faq",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://fonlok.com/register",
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.7,
    },
    {
      url: "https://fonlok.com/contact",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: "https://fonlok.com/login",
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: "https://fonlok.com/terms",
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: "https://fonlok.com/privacy",
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
