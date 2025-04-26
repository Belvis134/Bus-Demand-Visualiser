req_packages <- c("shiny", "rjson", "ComplexHeatmap", "circlize", "dplyr", "htmltools", "tidyr")
total_packages <- NULL
for (k in 1:length(req_packages)) {
  pkg <- tools::package_dependencies(req_packages[[k]], recursive = TRUE, db = available.packages())
  pkg2 <- pkg[[req_packages[[k]]]]
  total_packages <- c(total_packages, pkg2)
}
total_packages <- unique(total_packages)
total_packages <- c(total_packages, req_packages)
shinylive::export(appdir = "apps/brdv-1.4.1", destdir = "docs", packages = total_packages)