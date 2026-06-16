# ── Stage 1: Build ──────────────────────────────────────────────────
FROM maven:3.9.6-eclipse-temurin-17 AS builder

WORKDIR /app

# Copy pom.xml trước để cache dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code
COPY src ./src

# Build, bỏ qua test để nhanh hơn
RUN mvn clean package -DskipTests -B

# ── Stage 2: Run ────────────────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copy jar từ stage build
COPY --from=builder /app/target/*.jar app.jar

# Expose port
EXPOSE 8080

# Chạy với profile docker
ENTRYPOINT ["java", "-jar", "-Dspring.profiles.active=docker", "app.jar"]
