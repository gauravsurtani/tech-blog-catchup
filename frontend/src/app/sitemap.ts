import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://blog2podcast.com",
      lastModified: new Date(),
    },
    {
      url: "https://blog2podcast.com/explore",
      lastModified: new Date(),
    },
    {
      url: "https://blog2podcast.com/about",
      lastModified: new Date(),
    },
  ];
}
