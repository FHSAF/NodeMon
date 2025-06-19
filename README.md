# NodeMon - A Real-Time System Monitoring Dashboard

NodeMon is a lightweight, real-time system monitoring tool built entirely with Node.js and modern web technologies. It provides a sleek web dashboard that displays live CPU, Memory, and Network I/O statistics from the server, showcasing the power of Node.js for handling data streams and asynchronous operations.

This project was developed as a practical learning exercise to demonstrate fundamental to advanced Node.js concepts in a real-world application.

## 🧠 Node.js Concepts in Action

This project was specifically designed to be a living example of core Node.js concepts. Here’s how each one is used:

### 1\. The Asynchronous Non-Blocking I/O Model & The Event Loop

  * **What it is:** The fundamental philosophy of Node.js, allowing it to handle many operations concurrently without waiting (blocking).
  * **How it's used:** The entire server is built on this model. The Event Loop allows our application to simultaneously:
      * Handle multiple WebSocket connections from dashboard clients.
      * Run the `setInterval` loop every second to fetch system data.
      * Serve the static HTML/JS files to new users.
      * Listen for incoming messages from clients (e.g., when they change the history size).
        All of this happens within a single thread without freezing the application, which is the magic of the Event Loop.

### 2\. Asynchronous Patterns (`async/await` & Callbacks)

  * **`async/await` (Modern Promises):**

      * **What it is:** A modern syntax that makes handling asynchronous operations (Promises) clean and readable.
      * **How it's used:** In `src/index.js`, the main data-gathering loop is an `async` function. The line `await Promise.all([...])` is a perfect example, where we concurrently start three asynchronous tasks (getting CPU, memory, and network data) and wait for all of them to complete before continuing. This is far cleaner than nested `.then()` calls.

  * **Callbacks (Event-Driven Pattern):**

      * **What it is:** Functions passed as arguments to be executed when an event occurs or a task completes.
      * **How it's used:** This pattern is the foundation of our WebSocket server.
          * `wss.on('connection', (ws) => { ... })`: The function provided is a callback that executes every time a new client connects.
          * `ws.on('message', ...)`: This callback runs whenever that specific client sends a message to the server.
          * `setInterval(async () => { ... }, 1000)`: The entire async function that fetches data is itself a callback passed to `setInterval`, which the Event Loop executes every second.

### 3\. Modules (ES Modules: `import`/`export`)

  * **What it is:** The modern, standard way to organize and share code between different files.
  * **How it's used:** We use ES Modules throughout the backend (`"type": "module"` in `package.json`). In `src/index.js`, we see clear examples like `import express from 'express';` and `import si from 'systeminformation';` to bring in external libraries and separate our code logically.

### 4\. NPM & `package.json`

  * **What it is:** The Node Package Manager and the project's manifest file.
  * **How it's used:** We used `npm init -y` to create our `package.json` and `npm install express ws systeminformation` to download and manage our project's dependencies. This file tells any other developer exactly what is needed to run our application.

### 5\. Core APIs (`http`, `path`)

  * **What they are:** The built-in modules provided by Node.js for essential functionality.
  * **How they are used:**
      * `http`: We use `http.createServer(app)` to create the underlying HTTP server that our Express and WebSocket servers attach to.
      * `path`: We use `path.join(__dirname, '..', 'public')` to create a reliable, cross-platform file path to our static assets, ensuring the code works on Windows, macOS, and Linux.

### 6\. Streams and Buffers

  * **What they are:** Concepts for handling flowing data efficiently, often in binary form.
  * **How they are used:** This is a more implicit, but critical, part of our application. The `ws` library is built on top of Node.js Streams to handle the continuous flow of data over the TCP connection. When our server calls `client.send(JSON.stringify(data))`, that string is converted into a **Buffer** (raw binary data) by Node.js before being sent over the network stream. This is a perfect example of how high-level libraries abstract away these powerful, low-level concepts.

### 7\. Worker Threads (A Note on Evolution)

  * **What it is:** A tool for offloading CPU-intensive tasks to a separate thread to avoid blocking the Event Loop.
  * **How it's used:** We could have used a Worker Thread to calculate CPU usage. However, we instead use the `systeminformation` library. This represents a real-world development decision: while you *can* build these things from scratch with core modules, it's often more efficient and reliable to use a well-maintained library that specializes in the task. The library itself likely uses advanced methods to get these stats without blocking the main thread.

## 🚀 How to run?

1.  **Clone the repository (or create the project files):**
2.  **Navigate to the project directory:**

    ```bash
    cd NodeMon/backend
    ```

3.  **Install NPM dependencies:**

    ```bash
    npm install
    ```

4.  **Run the application:**

    ```bash
    node src/index.js
    ```

5.  **Open your browser** and navigate to `http://localhost:3000`. The NodeMon dashboard should be live\!
