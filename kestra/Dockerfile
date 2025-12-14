FROM kestra/kestra:latest

# Copy Kestra configuration and flows
COPY application.yaml /app/confs/application.yaml
COPY flows /app/flows

# Expose ports
EXPOSE 8080 8081

# Run Kestra in local server mode with flows
CMD ["server", "local", "--flow-path=/app/flows"]
    