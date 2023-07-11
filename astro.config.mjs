import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import image from "@astrojs/image";
import robotsTxt from "astro-robots-txt";
import sitemap from "@astrojs/sitemap";
import htmlBeautifier from "astro-html-beautifier";

import compress from "astro-compress";

// https://astro.build/config
export default defineConfig({
  site: "https://mohannadotaibi.com",
  integrations: [tailwind(), image({
    serviceEntryPoint: "@astrojs/image/sharp"
  }), robotsTxt(), sitemap(), htmlBeautifier({
    indent_size: 4,
    brace_style: "collapse",
    indent_char: "\t",
    indent_with_tabs: true,
    end_with_newline: true,
    wrap_line_length: 80
  }), compress()]
});