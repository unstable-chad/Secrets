# Use a base image
FROM node:14

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Expose a port (if required by your application)
EXPOSE process.env.PORT

# Define the command to run your application
CMD ["node", "app.js"]