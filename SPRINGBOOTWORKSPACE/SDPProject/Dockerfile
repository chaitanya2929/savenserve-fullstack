# Use a Maven image to build the project
FROM maven:3.9.5-amazoncorretto-21-debian AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn package -DskipTests

# Use a lightweight OpenJDK image for the final, smaller container
FROM openjdk:21-slim
WORKDIR /app
COPY --from=build /app/target/SDPProject-0.0.1-SNAPSHOT.jar /app/app.jar
EXPOSE 2004
ENTRYPOINT ["java", "-jar", "/app/app.jar"]