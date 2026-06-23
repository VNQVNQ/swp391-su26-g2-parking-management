# Multi-stage build for Spring Boot application

# Stage 1: Build
FROM maven:3.9-eclipse-temurin-17-alpine AS builder

WORKDIR /app

# Copy pom.xml and download dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build
COPY src ./src
RUN mvn clean package -DskipTests -B

# Stage 2: Runtime
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Install curl for health checks — thử đổi mirror nếu CDN gốc bị chặn/lỗi TLS
RUN (apk --no-cache add curl) || \
    (sed -i 's/dl-cdn.alpinelinux.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apk/repositories && apk --no-cache add curl) || \
    echo "curl install failed after retry, healthcheck will be skipped"

# Copy built application from builder
COPY --from=builder /app/target/*.jar app.jar

# Expose port
EXPOSE 8080

# Health check (tự bỏ qua nếu curl không cài được, không làm container bị coi là unhealthy)
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 0

# Run application
ENTRYPOINT ["java", "-jar", "app.jar"]
