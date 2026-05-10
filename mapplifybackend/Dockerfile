# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jdk-alpine AS builder

WORKDIR /app

# Copy Maven wrapper and pom first (layer-cache friendly)
COPY mvnw mvnw.cmd pom.xml ./
COPY .mvn .mvn

# Download dependencies without building the full project
RUN ./mvnw dependency:go-offline -B

# Copy source and build the fat JAR
COPY src ./src
RUN ./mvnw package -DskipTests -B

# ── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copy only the fat JAR from the build stage
COPY --from=builder /app/target/*.jar app.jar

# Render injects PORT automatically; Spring reads it via ${PORT:8081}
EXPOSE 8081

ENTRYPOINT ["java", "-jar", "app.jar"]
