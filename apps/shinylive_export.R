# Export to docs/ folder to deploy to Github Pages
req_packages <- c("shiny", "rjson", "ComplexHeatmap", "circlize", "dplyr", "htmltools", "tidyr")
total_packages <- NULL
for (k in 1:length(req_packages)) {
  pkg <- tools::package_dependencies(req_packages[[k]], recursive = TRUE, db = available.packages())
  pkg2 <- pkg[[req_packages[[k]]]]
  total_packages <- c(total_packages, pkg2)
}
total_packages <- unique(total_packages)
total_packages <- c(total_packages, req_packages)
export_output <- capture.output({shinylive::export(appdir = "apps/brdv-1.2.2", destdir = "docs", packages = total_packages)})
cat(export_output, sep = "\n")
index_file <- "docs/index.html"
html_lines <- readLines(index_file)
html_lines <- gsub("<title>.*</title>", "<title>Bus Route Demand Visualiser 1.2.2</title>", html_lines)
head_close_index <- grep("</head>", html_lines)[1]
favicon_tag <- '<link rel="icon" type="image/png" href="www/stc-icon.png">'
html_lines <- append(html_lines, favicon_tag, after = head_close_index - 1)
writeLines(html_lines, index_file)