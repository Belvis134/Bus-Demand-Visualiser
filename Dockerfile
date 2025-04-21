# Use the official R Shiny image as the base.
FROM rocker/shiny:latest

# --- Copy your Shiny app into the container.
# Your Shiny app is in the folder named `brdv-1.4.1/` (inside your project root)
COPY apps/brdv-1.4.1 /srv/shiny-server/apps/brdv-1.4.1

# --- Adjust permissions to allow file writes to the app's root directory.
# This command recursively gives the 'shiny' user ownership and read/write permissions.
RUN chown -R shiny:shiny /srv/shiny-server/apps/brdv-1.4.1 && \
    chmod -R a+rw /srv/shiny-server/apps/brdv-1.4.1

# Expose Shiny’s default port.
EXPOSE 3838

# Start Shiny Server.
CMD ["/usr/bin/shiny-server"]