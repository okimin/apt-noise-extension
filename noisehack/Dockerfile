# Stage 1: Build the application using Maven
FROM eclipse-temurin:17-jdk-jammy as builder

# Set the working directory in the container
WORKDIR /app

# Copy the Maven wrapper files and the pom.xml
COPY .mvn/ .mvn
COPY mvnw mvnw.cmd pom.xml ./

# Download project dependencies
RUN ./mvnw dependency:go-offline

# Copy the application source code
COPY src ./src

# Package the application into a JAR file, skipping tests
RUN ./mvnw package -DskipTests

# Stage 2: Create the final, smaller image
FROM eclipse-temurin:17-jre-jammy

# Set the working directory in the container
WORKDIR /app

# Copy the JAR file from the builder stage
COPY --from=builder /app/target/noisehack-0.0.1-SNAPSHOT.jar app.jar

# Expose the port the application runs on (default for Spring Boot is 8080)
EXPOSE 8080

# The command to run when the container starts
ENTRYPOINT ["java", "-jar", "app.jar"]