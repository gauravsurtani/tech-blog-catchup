import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://techblog.up.railway.app",
      lastModified: new Date(),
    },
    {
      url: "https://techblog.up.railway.app/explore",
      lastModified: new Date(),
    },
    {
      url: "https://techblog.up.railway.app/about",
      lastModified: new Date(),
    },
  ];
}
