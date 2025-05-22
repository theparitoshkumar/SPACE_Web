# Welcome to the Browser Project! 🌐

Embark on an exciting journey into the world of web browser development with this repository! Whether you're a curious beginner or a seasoned coder, this project offers a hands-on way to explore how browsers work under the hood. Build your own browser, learn the fundamentals, and have fun along the way!

## Getting Started 🚀

If you're new to web browser development, we highly recommend diving into the fantastic book **[Browser Engineering](https://browser.engineering/)**. It’s an incredible resource that breaks down the core concepts of how browsers function, from rendering web pages to handling network requests. Get those fundamentals clear, and you'll be ready to make the most of this project!

## Project Structure 📂

This repository is organized to give you flexibility in choosing your programming language of choice:

- **Browser_py/**: Home to a **Python-based browser** implementation. Perfect for those who love Python’s simplicity and readability.
- **Browser_js/**: Contains a **JavaScript-based browser** implementation. Ideal for those comfortable with JavaScript and its web-native ecosystem.

Choose the folder that best suits your skills and preferences, and start building your browser!

## Running the Browser 🖥️

### Prerequisites
- **Python**: Ensure you have Python 3.x installed for the `Browser_py` project.
- **Node.js**: Required for the `Browser_js` project (if you choose the JavaScript path).
- A passion for learning and experimenting! 😄

### Running the Python Browser
To launch the Python-based browser, open your terminal and navigate to the `Browser_py` folder. Then, run:

```bash
python browser.py https://www.example.org/path
```

### Running a Localhost Server
Want to test your browser with local files? You can spin up a simple localhost server using Python’s built-in HTTP server module. Navigate to the directory containing your files (e.g., directory/path/files) and run:

```bash
python -m http.server dir/path/
```

This will start a server (default port: 8000). Open your browser and visit http://localhost:8000 to view your files.