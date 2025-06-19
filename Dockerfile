FROM busybox AS file-copier

COPY backend/public /public

FROM nginx:1.25-alpine

COPY --from=file-copier /public /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]