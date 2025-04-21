required_packages <- c(
  "shiny",
  "rjson",
  "tidyverse",
  "ComplexHeatmap",
  "circlize",
  "htmltools",
  "shinylive",
  "httpuv"
)
installed <- installed.packages()[, "Package"]
packages_to_install <- setdiff(required_packages, installed)
if (length(packages_to_install) > 0) {
  install.packages(packages_to_install, repos = "https://cran.rstudio.com/")
}