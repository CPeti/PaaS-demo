FROM minio/mc

ENTRYPOINT []

# Wait for MinIO server to boot up, then initialize bucket
CMD sleep 15 && \
    mc alias set railway $MINIO_ENDPOINT $MINIO_ROOT_USER $MINIO_ROOT_PASSWORD && \
    mc mb --ignore-existing railway/$MINIO_BUCKET && \
    mc anonymous set download railway/$MINIO_BUCKET && \
    echo 'Bucket initialized natively!' && \
    sleep infinity
